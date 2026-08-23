import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole } from '@cc/types';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { SetBranchTargetDto } from './dto/set-branch-target.dto';
import { QueryBranchesDto, QueryBranchTargetsDto } from './dto/query-branches.dto';
import {
  BranchDto,
  BranchPerformanceMatrixDto,
  BranchTargetDto,
  RegionDto,
  RegionalRollupDto,
} from '@cc/types';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Resolves caller's authorization scope across organization, region, and branch
   */
  private resolveScope(user: any) {
    const roles: string[] = user.roles || (user.role ? [user.role] : []);
    const isSuperAdmin = roles.includes(UserRole.SUPER_ADMIN);
    const isAdmin = isSuperAdmin || roles.includes(UserRole.ADMIN);
    const isRegionalManager = roles.includes('REGIONAL_MANAGER');
    const isBranchManager = roles.includes(UserRole.BRANCH_MANAGER);

    const organizationId = user.organizationId || 'org-crazy-capital';

    return {
      organizationId,
      isAdmin,
      isRegionalManager,
      isBranchManager,
      userBranchId: user.branchId,
      userId: user.id,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. REGION / REGIONAL HUB MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async getRegions(user: any): Promise<RegionDto[]> {
    const scope = this.resolveScope(user);

    let whereClause: any = {
      organizationId: scope.organizationId,
      deletedAt: null,
    };

    if (scope.isRegionalManager && !scope.isAdmin) {
      whereClause.regionalManagerId = scope.userId;
    } else if (scope.isBranchManager && !scope.isAdmin) {
      // Find branch's region
      const branch = await this.prisma.branch.findUnique({
        where: { id: scope.userBranchId },
        select: { regionId: true },
      });
      if (branch?.regionId) {
        whereClause.id = branch.regionId;
      }
    }

    const regions = await this.prisma.region.findMany({
      where: whereClause,
      include: {
        regionalManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        branches: {
          where: { deletedAt: null },
          include: {
            users: { where: { deletedAt: null } },
            applications: { where: { deletedAt: null } },
            targets: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return regions.map((r) => {
      let activeEmployeeCount = 0;
      let activeCaseCount = 0;
      let totalRevenueTarget = 0;
      let totalAchievedRevenue = 0;
      let totalCaseTarget = 0;
      let totalAchievedCases = 0;

      for (const b of r.branches) {
        activeEmployeeCount += b.users.length;
        activeCaseCount += b.applications.filter((a) => a.status !== 'COMPLETED').length;

        // Sum latest targets
        for (const t of b.targets) {
          totalRevenueTarget += Number(t.revenueTarget || 0);
          totalAchievedRevenue += Number(t.achievedRevenue || 0);
          totalCaseTarget += t.caseTarget || 0;
          totalAchievedCases += t.achievedCases || 0;
        }
      }

      const revenueAttainmentPercent =
        totalRevenueTarget > 0
          ? Math.round((totalAchievedRevenue / totalRevenueTarget) * 1000) / 10
          : 0;
      const caseAttainmentPercent =
        totalCaseTarget > 0
          ? Math.round((totalAchievedCases / totalCaseTarget) * 1000) / 10
          : 0;

      return {
        id: r.id,
        organizationId: r.organizationId,
        name: r.name,
        code: r.code,
        description: r.description,
        regionalManagerId: r.regionalManagerId,
        regionalManagerName: r.regionalManager
          ? `${r.regionalManager.firstName} ${r.regionalManager.lastName}`.trim()
          : null,
        regionalManagerEmail: r.regionalManager?.email || null,
        branchCount: r.branches.length,
        activeEmployeeCount,
        activeCaseCount,
        revenueTarget: totalRevenueTarget,
        achievedRevenue: totalAchievedRevenue,
        revenueAttainmentPercent,
        caseTarget: totalCaseTarget,
        achievedCases: totalAchievedCases,
        caseAttainmentPercent,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  }

  async getRegionById(id: string, user: any): Promise<RegionDto> {
    const scope = this.resolveScope(user);

    const region = await this.prisma.region.findUnique({
      where: { id },
      include: {
        regionalManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        branches: {
          where: { deletedAt: null },
          include: {
            branchManager: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            users: { where: { deletedAt: null } },
            applications: { where: { deletedAt: null } },
            targets: true,
          },
        },
      },
    });

    if (!region || region.organizationId !== scope.organizationId || region.deletedAt) {
      throw new NotFoundException(`Regional Hub with ID '${id}' not found`);
    }

    if (scope.isRegionalManager && !scope.isAdmin && region.regionalManagerId !== scope.userId) {
      throw new ForbiddenException('Access denied: You can only view your assigned regional hub');
    }

    let activeEmployeeCount = 0;
    let activeCaseCount = 0;
    let totalRevenueTarget = 0;
    let totalAchievedRevenue = 0;
    let totalCaseTarget = 0;
    let totalAchievedCases = 0;

    const branchDtos: BranchDto[] = region.branches.map((b) => {
      activeEmployeeCount += b.users.length;
      const bActiveCases = b.applications.filter((a) => a.status !== 'COMPLETED').length;
      const bCompletedCases = b.applications.filter((a) => a.status === 'COMPLETED').length;
      activeCaseCount += bActiveCases;

      let bRevTarget = 0;
      let bAchievedRev = 0;
      let bCaseTarget = 0;
      let bAchievedCase = 0;

      for (const t of b.targets) {
        bRevTarget += Number(t.revenueTarget || 0);
        bAchievedRev += Number(t.achievedRevenue || 0);
        bCaseTarget += t.caseTarget || 0;
        bAchievedCase += t.achievedCases || 0;
      }

      totalRevenueTarget += bRevTarget;
      totalAchievedRevenue += bAchievedRev;
      totalCaseTarget += bCaseTarget;
      totalAchievedCases += bAchievedCase;

      return {
        id: b.id,
        organizationId: b.organizationId,
        regionId: region.id,
        regionName: region.name,
        regionCode: region.code,
        branchManagerId: b.branchManagerId,
        branchManagerName: b.branchManager
          ? `${b.branchManager.firstName} ${b.branchManager.lastName}`.trim()
          : null,
        branchManagerEmail: b.branchManager?.email || null,
        name: b.name,
        code: b.code,
        branchType: b.branchType,
        addressLine: b.addressLine,
        city: b.city,
        state: b.state,
        pincode: b.pincode,
        phone: b.phone,
        email: b.email,
        status: b.status,
        employeeCount: b.users.length,
        activeCaseCount: bActiveCases,
        completedCaseCount: bCompletedCases,
        revenueTarget: bRevTarget,
        achievedRevenue: bAchievedRev,
        revenueAttainmentPercent:
          bRevTarget > 0 ? Math.round((bAchievedRev / bRevTarget) * 1000) / 10 : 0,
        caseTarget: bCaseTarget,
        achievedCases: bAchievedCase,
        caseAttainmentPercent:
          bCaseTarget > 0 ? Math.round((bAchievedCase / bCaseTarget) * 1000) / 10 : 0,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      };
    });

    const revenueAttainmentPercent =
      totalRevenueTarget > 0
        ? Math.round((totalAchievedRevenue / totalRevenueTarget) * 1000) / 10
        : 0;
    const caseAttainmentPercent =
      totalCaseTarget > 0
        ? Math.round((totalAchievedCases / totalCaseTarget) * 1000) / 10
        : 0;

    return {
      id: region.id,
      organizationId: region.organizationId,
      name: region.name,
      code: region.code,
      description: region.description,
      regionalManagerId: region.regionalManagerId,
      regionalManagerName: region.regionalManager
        ? `${region.regionalManager.firstName} ${region.regionalManager.lastName}`.trim()
        : null,
      regionalManagerEmail: region.regionalManager?.email || null,
      branchCount: region.branches.length,
      activeEmployeeCount,
      activeCaseCount,
      revenueTarget: totalRevenueTarget,
      achievedRevenue: totalAchievedRevenue,
      revenueAttainmentPercent,
      caseTarget: totalCaseTarget,
      achievedCases: totalAchievedCases,
      caseAttainmentPercent,
      status: region.status,
      createdAt: region.createdAt.toISOString(),
      updatedAt: region.updatedAt.toISOString(),
      branches: branchDtos,
    };
  }

  async createRegion(dto: CreateRegionDto, user: any): Promise<RegionDto> {
    const scope = this.resolveScope(user);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Only Administrators can create Regional Hubs');
    }

    const code = dto.code.trim().toUpperCase();

    // Check duplicate code
    const existing = await this.prisma.region.findFirst({
      where: {
        organizationId: scope.organizationId,
        code,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException(`Region with code '${code}' already exists`);
    }

    // Validate regional manager if provided
    if (dto.regionalManagerId) {
      const mgr = await this.prisma.user.findFirst({
        where: { id: dto.regionalManagerId, organizationId: scope.organizationId },
      });
      if (!mgr) {
        throw new NotFoundException(`User with ID '${dto.regionalManagerId}' not found in organization`);
      }
    }

    const created = await this.prisma.region.create({
      data: {
        organizationId: scope.organizationId,
        name: dto.name.trim(),
        code,
        description: dto.description?.trim() || null,
        regionalManagerId: dto.regionalManagerId || null,
        status: dto.status || 'ACTIVE',
      },
      include: {
        regionalManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return {
      id: created.id,
      organizationId: created.organizationId,
      name: created.name,
      code: created.code,
      description: created.description,
      regionalManagerId: created.regionalManagerId,
      regionalManagerName: created.regionalManager
        ? `${created.regionalManager.firstName} ${created.regionalManager.lastName}`.trim()
        : null,
      regionalManagerEmail: created.regionalManager?.email || null,
      branchCount: 0,
      activeEmployeeCount: 0,
      activeCaseCount: 0,
      revenueTarget: 0,
      achievedRevenue: 0,
      revenueAttainmentPercent: 0,
      caseTarget: 0,
      achievedCases: 0,
      caseAttainmentPercent: 0,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateRegion(id: string, dto: UpdateRegionDto, user: any): Promise<RegionDto> {
    const scope = this.resolveScope(user);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Only Administrators can update Regional Hubs');
    }

    const region = await this.prisma.region.findUnique({
      where: { id },
    });

    if (!region || region.organizationId !== scope.organizationId || region.deletedAt) {
      throw new NotFoundException(`Region '${id}' not found`);
    }

    if (dto.regionalManagerId) {
      const mgr = await this.prisma.user.findFirst({
        where: { id: dto.regionalManagerId, organizationId: scope.organizationId },
      });
      if (!mgr) {
        throw new NotFoundException(`User '${dto.regionalManagerId}' not found`);
      }
    }

    await this.prisma.region.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.regionalManagerId !== undefined && { regionalManagerId: dto.regionalManagerId || null }),
        ...(dto.status && { status: dto.status }),
      },
    });

    return this.getRegionById(id, user);
  }

  async deleteRegion(id: string, user: any) {
    const scope = this.resolveScope(user);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Only Administrators can delete Regional Hubs');
    }

    const region = await this.prisma.region.findUnique({
      where: { id },
      include: {
        branches: { where: { deletedAt: null } },
      },
    });

    if (!region || region.organizationId !== scope.organizationId || region.deletedAt) {
      throw new NotFoundException(`Region '${id}' not found`);
    }

    if (region.branches.length > 0) {
      throw new BadRequestException(
        `Cannot delete region '${region.name}'. Reassign or delete its ${region.branches.length} active branches first.`,
      );
    }

    await this.prisma.region.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    return { message: `Region '${region.name}' deleted successfully` };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. BRANCH OPERATIONS MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async getBranches(user: any, query?: QueryBranchesDto): Promise<BranchDto[]> {
    const scope = this.resolveScope(user);

    const where: any = {
      organizationId: scope.organizationId,
      deletedAt: null,
    };

    if (query?.regionId) {
      where.regionId = query.regionId;
    }

    if (query?.branchType) {
      where.branchType = query.branchType;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      const q = query.search.trim().toLowerCase();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Role-based scoping
    if (scope.isBranchManager && !scope.isAdmin) {
      where.id = scope.userBranchId;
    } else if (scope.isRegionalManager && !scope.isAdmin) {
      // Find regions managed by this user
      const regions = await this.prisma.region.findMany({
        where: { regionalManagerId: scope.userId, organizationId: scope.organizationId, deletedAt: null },
        select: { id: true },
      });
      where.regionId = { in: regions.map((r) => r.id) };
    }

    const branches = await this.prisma.branch.findMany({
      where,
      include: {
        region: true,
        branchManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        users: { where: { deletedAt: null } },
        applications: { where: { deletedAt: null } },
        targets: true,
      },
      orderBy: { name: 'asc' },
    });

    return branches.map((b) => {
      const activeCaseCount = b.applications.filter((a) => a.status !== 'COMPLETED').length;
      const completedCaseCount = b.applications.filter((a) => a.status === 'COMPLETED').length;

      let bRevTarget = 0;
      let bAchievedRev = 0;
      let bCaseTarget = 0;
      let bAchievedCase = 0;

      for (const t of b.targets) {
        bRevTarget += Number(t.revenueTarget || 0);
        bAchievedRev += Number(t.achievedRevenue || 0);
        bCaseTarget += t.caseTarget || 0;
        bAchievedCase += t.achievedCases || 0;
      }

      return {
        id: b.id,
        organizationId: b.organizationId,
        regionId: b.regionId,
        regionName: b.region?.name || null,
        regionCode: b.region?.code || null,
        branchManagerId: b.branchManagerId,
        branchManagerName: b.branchManager
          ? `${b.branchManager.firstName} ${b.branchManager.lastName}`.trim()
          : null,
        branchManagerEmail: b.branchManager?.email || null,
        name: b.name,
        code: b.code,
        branchType: b.branchType,
        addressLine: b.addressLine,
        city: b.city,
        state: b.state,
        pincode: b.pincode,
        phone: b.phone,
        email: b.email,
        status: b.status,
        employeeCount: b.users.length,
        activeCaseCount,
        completedCaseCount,
        revenueTarget: bRevTarget,
        achievedRevenue: bAchievedRev,
        revenueAttainmentPercent:
          bRevTarget > 0 ? Math.round((bAchievedRev / bRevTarget) * 1000) / 10 : 0,
        caseTarget: bCaseTarget,
        achievedCases: bAchievedCase,
        caseAttainmentPercent:
          bCaseTarget > 0 ? Math.round((bAchievedCase / bCaseTarget) * 1000) / 10 : 0,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      };
    });
  }

  async getBranchById(id: string, user: any): Promise<BranchDto> {
    const scope = this.resolveScope(user);

    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        region: true,
        branchManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        users: {
          where: { deletedAt: null },
          select: { id: true, firstName: true, lastName: true, email: true, department: true, status: true },
        },
        applications: {
          where: { deletedAt: null },
          select: { id: true, applicationNumber: true, status: true, createdAt: true },
        },
        targets: true,
      },
    });

    if (!branch || branch.organizationId !== scope.organizationId || branch.deletedAt) {
      throw new NotFoundException(`Branch with ID '${id}' not found`);
    }

    if (scope.isBranchManager && !scope.isAdmin && branch.id !== scope.userBranchId) {
      throw new ForbiddenException('Access denied: You can only view your assigned branch');
    }

    const activeCaseCount = branch.applications.filter((a) => a.status !== 'COMPLETED').length;
    const completedCaseCount = branch.applications.filter((a) => a.status === 'COMPLETED').length;

    let bRevTarget = 0;
    let bAchievedRev = 0;
    let bCaseTarget = 0;
    let bAchievedCase = 0;

    for (const t of branch.targets) {
      bRevTarget += Number(t.revenueTarget || 0);
      bAchievedRev += Number(t.achievedRevenue || 0);
      bCaseTarget += t.caseTarget || 0;
      bAchievedCase += t.achievedCases || 0;
    }

    return {
      id: branch.id,
      organizationId: branch.organizationId,
      regionId: branch.regionId,
      regionName: branch.region?.name || null,
      regionCode: branch.region?.code || null,
      branchManagerId: branch.branchManagerId,
      branchManagerName: branch.branchManager
        ? `${branch.branchManager.firstName} ${branch.branchManager.lastName}`.trim()
        : null,
      branchManagerEmail: branch.branchManager?.email || null,
      name: branch.name,
      code: branch.code,
      branchType: branch.branchType,
      addressLine: branch.addressLine,
      city: branch.city,
      state: branch.state,
      pincode: branch.pincode,
      phone: branch.phone,
      email: branch.email,
      status: branch.status,
      employeeCount: branch.users.length,
      activeCaseCount,
      completedCaseCount,
      revenueTarget: bRevTarget,
      achievedRevenue: bAchievedRev,
      revenueAttainmentPercent:
        bRevTarget > 0 ? Math.round((bAchievedRev / bRevTarget) * 1000) / 10 : 0,
      caseTarget: bCaseTarget,
      achievedCases: bAchievedCase,
      caseAttainmentPercent:
        bCaseTarget > 0 ? Math.round((bAchievedCase / bCaseTarget) * 1000) / 10 : 0,
      createdAt: branch.createdAt.toISOString(),
      updatedAt: branch.updatedAt.toISOString(),
    };
  }

  async createBranch(dto: CreateBranchDto, user: any): Promise<BranchDto> {
    const scope = this.resolveScope(user);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Only Administrators can create Branches');
    }

    const code = dto.code.trim().toUpperCase();

    // Check duplicate code
    const existing = await this.prisma.branch.findFirst({
      where: {
        organizationId: scope.organizationId,
        code,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException(`Branch with code '${code}' already exists in this organization`);
    }

    // Validate region if provided
    if (dto.regionId) {
      const reg = await this.prisma.region.findFirst({
        where: { id: dto.regionId, organizationId: scope.organizationId, deletedAt: null },
      });
      if (!reg) {
        throw new NotFoundException(`Region '${dto.regionId}' not found in organization`);
      }
    }

    // Validate branch manager if provided
    if (dto.branchManagerId) {
      const mgr = await this.prisma.user.findFirst({
        where: { id: dto.branchManagerId, organizationId: scope.organizationId, deletedAt: null },
      });
      if (!mgr) {
        throw new NotFoundException(`User '${dto.branchManagerId}' not found`);
      }
    }

    const created = await this.prisma.branch.create({
      data: {
        organizationId: scope.organizationId,
        regionId: dto.regionId || null,
        branchManagerId: dto.branchManagerId || null,
        name: dto.name.trim(),
        code,
        branchType: dto.branchType || 'METRO_BRANCH',
        addressLine: dto.addressLine?.trim() || null,
        city: dto.city?.trim() || null,
        state: dto.state?.trim() || null,
        pincode: dto.pincode?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        status: dto.status || 'ACTIVE',
      },
      include: {
        region: true,
        branchManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return {
      id: created.id,
      organizationId: created.organizationId,
      regionId: created.regionId,
      regionName: created.region?.name || null,
      regionCode: created.region?.code || null,
      branchManagerId: created.branchManagerId,
      branchManagerName: created.branchManager
        ? `${created.branchManager.firstName} ${created.branchManager.lastName}`.trim()
        : null,
      branchManagerEmail: created.branchManager?.email || null,
      name: created.name,
      code: created.code,
      branchType: created.branchType,
      addressLine: created.addressLine,
      city: created.city,
      state: created.state,
      pincode: created.pincode,
      phone: created.phone,
      email: created.email,
      status: created.status,
      employeeCount: 0,
      activeCaseCount: 0,
      completedCaseCount: 0,
      revenueTarget: 0,
      achievedRevenue: 0,
      revenueAttainmentPercent: 0,
      caseTarget: 0,
      achievedCases: 0,
      caseAttainmentPercent: 0,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateBranch(id: string, dto: UpdateBranchDto, user: any): Promise<BranchDto> {
    const scope = this.resolveScope(user);
    if (!scope.isAdmin) {
      throw new ForbiddenException('Only Administrators can update Branch configurations');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch || branch.organizationId !== scope.organizationId || branch.deletedAt) {
      throw new NotFoundException(`Branch '${id}' not found`);
    }

    if (dto.regionId) {
      const reg = await this.prisma.region.findFirst({
        where: { id: dto.regionId, organizationId: scope.organizationId, deletedAt: null },
      });
      if (!reg) throw new NotFoundException(`Region '${dto.regionId}' not found`);
    }

    if (dto.branchManagerId) {
      const mgr = await this.prisma.user.findFirst({
        where: { id: dto.branchManagerId, organizationId: scope.organizationId, deletedAt: null },
      });
      if (!mgr) throw new NotFoundException(`User '${dto.branchManagerId}' not found`);
    }

    await this.prisma.branch.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.regionId !== undefined && { regionId: dto.regionId || null }),
        ...(dto.branchManagerId !== undefined && { branchManagerId: dto.branchManagerId || null }),
        ...(dto.branchType && { branchType: dto.branchType }),
        ...(dto.addressLine !== undefined && { addressLine: dto.addressLine?.trim() || null }),
        ...(dto.city !== undefined && { city: dto.city?.trim() || null }),
        ...(dto.state !== undefined && { state: dto.state?.trim() || null }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode?.trim() || null }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.email !== undefined && { email: dto.email?.trim() || null }),
        ...(dto.status && { status: dto.status }),
      },
    });

    return this.getBranchById(id, user);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. TARGET MANAGEMENT & REGIONAL ROLLUP
  // ─────────────────────────────────────────────────────────────────────────────

  async setBranchTarget(dto: SetBranchTargetDto, user: any): Promise<BranchTargetDto> {
    const scope = this.resolveScope(user);
    if (!scope.isAdmin && !scope.isRegionalManager) {
      throw new ForbiddenException('Only Administrators and Regional Managers can set branch targets');
    }

    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
      include: { region: true },
    });

    if (!branch || branch.organizationId !== scope.organizationId || branch.deletedAt) {
      throw new NotFoundException(`Branch '${dto.branchId}' not found`);
    }

    // Compute actual achievements for period
    const { achievedRevenue, achievedCases } = await this.calculateActualAchievements(
      branch.id,
      dto.targetPeriod,
      scope.organizationId,
    );

    const revAttain =
      dto.revenueTarget > 0
        ? Math.round((achievedRevenue / dto.revenueTarget) * 1000) / 10
        : 100;
    const caseAttain =
      dto.caseTarget > 0 ? Math.round((achievedCases / dto.caseTarget) * 1000) / 10 : 100;

    let status = 'ON_TRACK';
    if (revAttain >= 100 && caseAttain >= 100) status = 'ACHIEVED';
    else if (revAttain < 50 || caseAttain < 50) status = 'AT_RISK';

    const target = await this.prisma.branchTarget.upsert({
      where: {
        branchId_targetPeriod: {
          branchId: branch.id,
          targetPeriod: dto.targetPeriod,
        },
      },
      create: {
        organizationId: scope.organizationId,
        branchId: branch.id,
        regionId: branch.regionId,
        targetPeriod: dto.targetPeriod,
        periodType: dto.periodType || 'MONTHLY',
        revenueTarget: dto.revenueTarget,
        caseTarget: dto.caseTarget,
        leadTarget: dto.leadTarget || 0,
        achievedRevenue,
        achievedCases,
        status,
        notes: dto.notes?.trim() || null,
      },
      update: {
        revenueTarget: dto.revenueTarget,
        caseTarget: dto.caseTarget,
        leadTarget: dto.leadTarget || 0,
        achievedRevenue,
        achievedCases,
        status,
        notes: dto.notes?.trim() || null,
      },
      include: {
        branch: true,
        region: true,
      },
    });

    return {
      id: target.id,
      organizationId: target.organizationId,
      branchId: target.branchId,
      branchName: target.branch.name,
      branchCode: target.branch.code,
      regionId: target.regionId,
      regionName: target.region?.name || null,
      targetPeriod: target.targetPeriod,
      periodType: target.periodType,
      revenueTarget: Number(target.revenueTarget),
      caseTarget: target.caseTarget,
      leadTarget: target.leadTarget || 0,
      achievedRevenue: Number(target.achievedRevenue),
      achievedCases: target.achievedCases,
      revenueAttainmentPercent: revAttain,
      caseAttainmentPercent: caseAttain,
      varianceRevenue: Number(target.achievedRevenue) - Number(target.revenueTarget),
      varianceCases: target.achievedCases - target.caseTarget,
      status: target.status,
      notes: target.notes,
      createdAt: target.createdAt.toISOString(),
      updatedAt: target.updatedAt.toISOString(),
    };
  }

  /**
   * Helper: Calculates authoritative actual revenue and cases for a branch in a given period
   */
  private async calculateActualAchievements(
    branchId: string,
    targetPeriod: string,
    organizationId: string,
  ) {
    // Determine date range from target period string e.g. "2026-08" or "2026-Q3"
    let startDate: Date;
    let endDate: Date;

    if (targetPeriod.includes('-Q')) {
      const [yearStr, qStr] = targetPeriod.split('-Q');
      const year = parseInt(yearStr, 10);
      const q = parseInt(qStr, 10);
      startDate = new Date(year, (q - 1) * 3, 1);
      endDate = new Date(year, q * 3, 0, 23, 59, 59, 999);
    } else if (targetPeriod.includes('-')) {
      const [yearStr, monthStr] = targetPeriod.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      // Annual or fallback to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // 1. Calculate Realized Revenue: Sum of Invoices linked to Branch's Applications
    const applications = await this.prisma.application.findMany({
      where: {
        organizationId,
        branchId,
        deletedAt: null,
      },
      include: {
        invoices: {
          where: {
            status: 'PAID',
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    let achievedRevenue = 0;
    for (const app of applications) {
      for (const inv of app.invoices) {
        achievedRevenue += Number(inv.amount || 0);
      }
    }

    // 2. Calculate Completed Cases: Applications completed in date range
    const completedCases = await this.prisma.application.count({
      where: {
        organizationId,
        branchId,
        status: 'COMPLETED',
        deletedAt: null,
        updatedAt: { gte: startDate, lte: endDate },
      },
    });

    return {
      achievedRevenue: Math.round(achievedRevenue * 100) / 100,
      achievedCases: completedCases,
    };
  }

  async getBranchTargets(user: any, query?: QueryBranchTargetsDto): Promise<BranchTargetDto[]> {
    const scope = this.resolveScope(user);

    const where: any = {
      organizationId: scope.organizationId,
    };

    if (query?.targetPeriod) {
      where.targetPeriod = query.targetPeriod;
    }

    if (query?.regionId) {
      where.regionId = query.regionId;
    }

    if (query?.branchId) {
      where.branchId = query.branchId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (scope.isBranchManager && !scope.isAdmin) {
      where.branchId = scope.userBranchId;
    }

    const targets = await this.prisma.branchTarget.findMany({
      where,
      include: {
        branch: true,
        region: true,
      },
      orderBy: [{ targetPeriod: 'desc' }, { branch: { name: 'asc' } }],
    });

    return targets.map((t) => {
      const revTarget = Number(t.revenueTarget);
      const achRev = Number(t.achievedRevenue);
      const revAttain = revTarget > 0 ? Math.round((achRev / revTarget) * 1000) / 10 : 0;
      const caseAttain =
        t.caseTarget > 0 ? Math.round((t.achievedCases / t.caseTarget) * 1000) / 10 : 0;

      return {
        id: t.id,
        organizationId: t.organizationId,
        branchId: t.branchId,
        branchName: t.branch.name,
        branchCode: t.branch.code,
        regionId: t.regionId,
        regionName: t.region?.name || null,
        targetPeriod: t.targetPeriod,
        periodType: t.periodType,
        revenueTarget: revTarget,
        caseTarget: t.caseTarget,
        leadTarget: t.leadTarget || 0,
        achievedRevenue: achRev,
        achievedCases: t.achievedCases,
        revenueAttainmentPercent: revAttain,
        caseAttainmentPercent: caseAttain,
        varianceRevenue: achRev - revTarget,
        varianceCases: t.achievedCases - t.caseTarget,
        status: t.status,
        notes: t.notes,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. PERFORMANCE MATRIX & REGIONAL ROLLUP SCORECARD
  // ─────────────────────────────────────────────────────────────────────────────

  async getPerformanceMatrix(
    user: any,
    targetPeriod: string = '2026-08',
  ): Promise<BranchPerformanceMatrixDto> {
    const scope = this.resolveScope(user);

    const [regions, branchTargets, allBranches] = await Promise.all([
      this.getRegions(user),
      this.getBranchTargets(user, { targetPeriod }),
      this.getBranches(user),
    ]);

    // Build regional rollups
    const regionalRollups: RegionalRollupDto[] = regions.map((r) => {
      const regionTargets = branchTargets.filter((bt) => bt.regionId === r.id);

      let revTarget = 0;
      let achRev = 0;
      let caseTarget = 0;
      let achCases = 0;

      for (const t of regionTargets) {
        revTarget += t.revenueTarget;
        achRev += t.achievedRevenue;
        caseTarget += t.caseTarget;
        achCases += t.achievedCases;
      }

      const revAttain = revTarget > 0 ? Math.round((achRev / revTarget) * 1000) / 10 : 0;
      const caseAttain = caseTarget > 0 ? Math.round((achCases / caseTarget) * 1000) / 10 : 0;

      let status = 'ON_TRACK';
      if (revAttain >= 100 && caseAttain >= 100) status = 'ACHIEVED';
      else if (revAttain < 60 || caseAttain < 60) status = 'AT_RISK';

      return {
        regionId: r.id,
        regionName: r.name,
        regionCode: r.code,
        regionalManagerName: r.regionalManagerName,
        branchCount: r.branchCount,
        revenueTarget: revTarget,
        achievedRevenue: achRev,
        revenueAttainmentPercent: revAttain,
        caseTarget,
        achievedCases: achCases,
        caseAttainmentPercent: caseAttain,
        status,
        branches: regionTargets,
      };
    });

    // Organization Summary
    let totalRevenueTarget = 0;
    let totalAchievedRevenue = 0;
    let totalCaseTarget = 0;
    let totalAchievedCases = 0;
    let onTrackCount = 0;
    let achievedCount = 0;
    let atRiskCount = 0;
    let missedCount = 0;

    for (const bt of branchTargets) {
      totalRevenueTarget += bt.revenueTarget;
      totalAchievedRevenue += bt.achievedRevenue;
      totalCaseTarget += bt.caseTarget;
      totalAchievedCases += bt.achievedCases;

      if (bt.status === 'ACHIEVED') achievedCount++;
      else if (bt.status === 'AT_RISK') atRiskCount++;
      else if (bt.status === 'MISSED') missedCount++;
      else onTrackCount++;
    }

    const orgRevenueAttain =
      totalRevenueTarget > 0
        ? Math.round((totalAchievedRevenue / totalRevenueTarget) * 1000) / 10
        : 0;
    const orgCaseAttain =
      totalCaseTarget > 0
        ? Math.round((totalAchievedCases / totalCaseTarget) * 1000) / 10
        : 0;

    return {
      targetPeriod,
      organizationSummary: {
        totalBranches: allBranches.length,
        totalRegions: regions.length,
        totalRevenueTarget,
        totalAchievedRevenue,
        revenueAttainmentPercent: orgRevenueAttain,
        totalCaseTarget,
        totalAchievedCases,
        caseAttainmentPercent: orgCaseAttain,
        onTrackCount,
        achievedCount,
        atRiskCount,
        missedCount,
      },
      regionalRollups,
      branchScorecards: allBranches,
    };
  }
}
