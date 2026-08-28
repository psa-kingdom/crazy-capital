import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SaasService } from './saas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import {
  createTenantSchema,
  updateTenantBrandingSchema,
  verifyDomainSchema,
} from '@cc/validation';
import {
  CreateTenantInput,
  UpdateTenantBrandingInput,
} from '@cc/types';

@Controller('saas')
export class SaasController {
  constructor(private readonly saasService: SaasService) {}

  /**
   * Public tenant resolution endpoint for frontend middleware
   */
  @Get('tenant/resolve')
  async resolveTenant(@Query('host') host: string, @Query('subdomain') subdomain?: string) {
    const identifier = subdomain || host;
    return this.saasService.resolveTenant(identifier);
  }

  /**
   * Get active branding/theme configuration
   */
  @Get('branding')
  @UseGuards(JwtAuthGuard)
  async getBranding(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.saasService.getBranding(organizationId);
  }

  /**
   * Update white-label branding, invoice and email headers
   */
  @Patch('branding')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('system:manage')
  async updateBranding(@Req() req: any, @Body() body: any) {
    const validated = updateTenantBrandingSchema.parse(body);
    const organizationId = req.user.organizationId;
    return this.saasService.updateBranding(organizationId, validated as UpdateTenantBrandingInput);
  }

  /**
   * Super-Admin list all white-label tenants
   */
  @Get('tenants')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('system:manage')
  async listTenants() {
    return this.saasService.listAllTenants();
  }

  /**
   * Create new white-label SaaS tenant
   */
  @Post('tenants')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('system:manage')
  async createTenant(@Req() req: any, @Body() body: any) {
    const validated = createTenantSchema.parse(body);
    const organizationId = req.user.organizationId;
    return this.saasService.createTenant(organizationId, validated as CreateTenantInput);
  }

  /**
   * Verify Custom Domain DNS CNAME configuration
   */
  @Post('domains/verify')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('system:manage')
  @HttpCode(HttpStatus.OK)
  async verifyCustomDomain(@Req() req: any, @Body() body: any) {
    const validated = verifyDomainSchema.parse(body);
    const organizationId = req.user.organizationId;
    return this.saasService.verifyCustomDomain(organizationId, validated.customDomain);
  }
}
