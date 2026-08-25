import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload, UserRole } from '@cc/types';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If neither permissions nor roles required, allow access
    if (
      (!requiredPermissions || requiredPermissions.length === 0) &&
      (!requiredRoles || requiredRoles.length === 0)
    ) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    if (!user) {
      throw new ForbiddenException('Access denied: user context not found');
    }

    // Super Admin bypasses all checks
    if (user.roles?.includes(UserRole.SUPER_ADMIN)) {
      return true;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = user.roles || [];
      const hasRole = requiredRoles.some((r) => userRoles.includes(r as UserRole));
      if (!hasRole) {
        throw new ForbiddenException(`Access denied: required role in [${requiredRoles.join(', ')}]`);
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = user.permissions || [];
      const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

      if (!hasPermission) {
        throw new ForbiddenException(
          `Access denied: missing required permission(s) [${requiredPermissions.join(', ')}]`,
        );
      }
    }

    return true;
  }
}
