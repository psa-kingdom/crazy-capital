import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, UserRole } from '@cc/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        organization: true,
        branch: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Collect roles and unique permissions
    const roles = user.userRoles.map((ur) => ur.role.code as UserRole);
    const permissionsSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code);
      }
    }
    const permissions = Array.from(permissionsSet);

    // Create session & refresh token
    const rawRefreshToken = uuidv4();
    const hashedRefreshToken = await argon2.hash(rawRefreshToken);

    const refreshExpiryDays = 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'auth.login',
        entityType: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      },
    });

    // Generate Access Token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
        branchId: user.branchId,
        roles,
        permissions,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    // Default to main organization
    const org = await this.prisma.organization.findFirst();
    if (!org) {
      throw new NotFoundException('Default organization not initialized. Please run seed script.');
    }

    let branchId = null;
    if (dto.branchCode) {
      const branch = await this.prisma.branch.findFirst({
        where: { code: dto.branchCode, organizationId: org.id },
      });
      if (branch) branchId = branch.id;
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        organizationId: org.id,
        branchId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        mobile: dto.mobile || null,
        passwordHash,
        status: 'ACTIVE',
      },
    });

    // Assign CUSTOMER role
    const customerRole = await this.prisma.role.findUnique({
      where: { code: 'CUSTOMER' },
    });

    if (customerRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: customerRole.id,
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      message: 'Account registered successfully. Please login.',
    };
  }

  async refresh(rawRefreshToken: string) {
    // Find active sessions
    const sessions = await this.prisma.userSession.findMany({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    let matchedSession = null;
    for (const session of sessions) {
      const match = await argon2.verify(session.refreshToken, rawRefreshToken).catch(() => false);
      if (match) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession || !matchedSession.user || matchedSession.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old session (token rotation)
    await this.prisma.userSession.update({
      where: { id: matchedSession.id },
      data: { revokedAt: new Date() },
    });

    const user = matchedSession.user;
    const roles = user.userRoles.map((ur) => ur.role.code as UserRole);
    const permissionsSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code);
      }
    }
    const permissions = Array.from(permissionsSet);

    // Issue new refresh token
    const newRawRefreshToken = uuidv4();
    const newHashedRefreshToken = await argon2.hash(newRawRefreshToken);

    const refreshExpiryDays = 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: newHashedRefreshToken,
        ipAddress: matchedSession.ipAddress,
        userAgent: matchedSession.userAgent,
        expiresAt,
      },
    });

    // Generate new Access Token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  async logout(userId: string, rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const sessions = await this.prisma.userSession.findMany({
        where: { userId, revokedAt: null },
      });
      for (const session of sessions) {
        const match = await argon2.verify(session.refreshToken, rawRefreshToken).catch(() => false);
        if (match) {
          await this.prisma.userSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } else {
      // Revoke all sessions for user
      await this.prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        branch: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.code as UserRole);
    const permissionsSet = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        permissionsSet.add(rp.permission.code);
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      status: user.status,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        code: user.organization.code,
      },
      branch: user.branch
        ? {
            id: user.branch.id,
            name: user.branch.name,
            code: user.branch.code,
            city: user.branch.city,
          }
        : null,
      roles,
      permissions: Array.from(permissionsSet),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
