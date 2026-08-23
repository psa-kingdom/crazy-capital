import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { SlaService } from './sla.service';
import { QueryEscalationsDto } from './dto/query-escalations.dto';
import { AcknowledgeEscalationDto } from './dto/acknowledge-escalation.dto';
import { EvaluateSlaDto } from './dto/evaluate-sla.dto';

@ApiTags('SLA & Escalation Engine')
@ApiBearerAuth()
@Controller('sla')
export class SlaController {
  constructor(private readonly slaService: SlaService) {}

  @Get('dashboard')
  @RequirePermissions('workflow.view')
  @ApiOperation({ summary: 'Get live SLA Dashboard KPIs, active stage timers, and escalation breakdown' })
  @ApiResponse({ status: 200, description: 'SLA Dashboard data retrieved' })
  async getDashboard(@CurrentUser() user: any) {
    return this.slaService.getSlaDashboard(user.organizationId, user);
  }

  @Get('escalations')
  @RequirePermissions('workflow.view')
  @ApiOperation({ summary: 'Query all SLA escalation incidents with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Escalations list retrieved' })
  async getEscalations(
    @Query() query: QueryEscalationsDto,
    @CurrentUser() user: any,
  ) {
    return this.slaService.getEscalations(query, user.organizationId, user);
  }

  @Post('evaluate')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Trigger SLA evaluation cycle on active workflows (or evaluate with custom reference time)' })
  @ApiResponse({ status: 200, description: 'SLA evaluation executed successfully' })
  async evaluateSla(
    @Body() dto: EvaluateSlaDto,
    @CurrentUser() user: any,
  ) {
    const refTime = dto.referenceTime ? new Date(dto.referenceTime) : undefined;
    if (dto.instanceId) {
      return this.slaService.evaluateInstanceById(dto.instanceId, refTime);
    }
    return this.slaService.evaluateAllActiveWorkflows(user.organizationId, refTime);
  }

  @Patch('escalations/:id/acknowledge')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Acknowledge an active SLA escalation incident' })
  @ApiResponse({ status: 200, description: 'Escalation marked as acknowledged' })
  async acknowledge(
    @Param('id') id: string,
    @Body() dto: AcknowledgeEscalationDto,
    @CurrentUser() user: any,
  ) {
    return this.slaService.acknowledgeEscalation(id, dto, user);
  }

  @Patch('escalations/:id/resolve')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Resolve an active SLA escalation incident' })
  @ApiResponse({ status: 200, description: 'Escalation marked as resolved' })
  async resolve(
    @Param('id') id: string,
    @Body() dto: AcknowledgeEscalationDto,
    @CurrentUser() user: any,
  ) {
    return this.slaService.resolveEscalation(id, dto, user);
  }
}

