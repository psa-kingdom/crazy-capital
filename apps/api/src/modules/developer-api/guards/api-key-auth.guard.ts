import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DeveloperApiService } from '../developer-api.service';

export const API_KEY_SCOPE_KEY = 'apiKeyScope';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly developerApiService: DeveloperApiService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['x-api-key'];

    if (!authHeader) {
      throw new UnauthorizedException('API key is required in Authorization or X-API-Key header');
    }

    const rawKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    const requiredScope = this.reflector.getAllAndOverride<string>(API_KEY_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const { apiKey, organizationId } = await this.developerApiService.validateApiKey(rawKey, requiredScope);

    request.apiKey = apiKey;
    request.organizationId = organizationId;
    return true;
  }
}
