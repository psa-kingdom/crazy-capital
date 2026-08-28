import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GovernmentIntegrationsService } from './government-integrations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import {
  mcaCompanyLookupQuerySchema,
  gstnLookupQuerySchema,
  initiateAaConsentSchema,
} from '@cc/validation';
import { InitiateAaConsentInput } from '@cc/types';

@Controller('integrations/government')
@UseGuards(JwtAuthGuard, RbacGuard)
export class GovernmentIntegrationsController {
  constructor(private readonly govService: GovernmentIntegrationsService) {}

  @Get('mca/company-lookup')
  @RequirePermissions('system:view')
  async lookupMcaCompany(@Req() req: any, @Query() query: any) {
    const validated = mcaCompanyLookupQuerySchema.parse(query);
    const organizationId = req.user.organizationId;
    return this.govService.lookupMcaCompany(organizationId, validated.name, validated.checkAvailability);
  }

  @Get('gstn/lookup/:gstin')
  @RequirePermissions('system:view')
  async lookupGstnTaxpayer(@Req() req: any, @Param('gstin') gstin: string) {
    const validated = gstnLookupQuerySchema.parse({ gstin });
    const organizationId = req.user.organizationId;
    return this.govService.lookupGstnTaxpayer(organizationId, validated.gstin);
  }

  @Post('account-aggregator/consent')
  @RequirePermissions('system:manage')
  @HttpCode(HttpStatus.OK)
  async initiateAaConsent(@Req() req: any, @Body() body: any) {
    const validated = initiateAaConsentSchema.parse(body);
    const organizationId = req.user.organizationId;
    return this.govService.initiateAaConsent(organizationId, validated as InitiateAaConsentInput);
  }

  @Get('account-aggregator/consent/:consentId')
  @RequirePermissions('system:view')
  async getAaStatementData(@Req() req: any, @Param('consentId') consentId: string) {
    const organizationId = req.user.organizationId;
    return this.govService.getAaStatementData(organizationId, consentId);
  }

  @Get('health')
  @RequirePermissions('system:view')
  async getHealth() {
    return this.govService.getIntegrationsHealth();
  }

  @Get('logs')
  @RequirePermissions('system:view')
  async getAuditLogs(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.govService.getAuditLogs(organizationId);
  }
}
