import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import {
  createComplianceExportSchema,
  queryAuditLogsSchema,
} from '@cc/validation';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('compliance')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('audit-logs')
  @RequirePermissions('system:view')
  async getAuditLogs(
    @CurrentUser('organizationId') organizationId: string,
    @Query() query: any,
  ) {
    const validated = queryAuditLogsSchema.parse(query);
    const result = await this.complianceService.queryAuditLogs(organizationId, validated);
    return {
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  @Post('exports')
  @RequirePermissions('system:view')
  @HttpCode(HttpStatus.CREATED)
  async createExport(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('sub') userId: string,
    @Body() body: any,
  ) {
    const validated = createComplianceExportSchema.parse(body);
    const result = await this.complianceService.createComplianceExport(organizationId, userId, validated as any);
    return {
      success: true,
      data: result,
      message: 'Compliance export created successfully',
    };
  }

  @Get('exports')
  @RequirePermissions('system:view')
  async listExports(@CurrentUser('organizationId') organizationId: string) {
    const data = await this.complianceService.listExports(organizationId);
    return {
      success: true,
      data,
    };
  }

  @Post('data-erasure')
  @RequirePermissions('system:manage')
  @HttpCode(HttpStatus.OK)
  async executeDataErasure(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('sub') requestedById: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    const result = await this.complianceService.processDataErasureRequest(
      organizationId,
      targetUserId,
      requestedById,
    );
    return {
      success: true,
      data: result,
    };
  }
}
