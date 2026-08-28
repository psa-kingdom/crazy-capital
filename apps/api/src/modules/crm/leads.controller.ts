import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { LeadScoringService } from './lead-scoring.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ChangeLeadStatusDto } from './dto/change-lead-status.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtPayload } from '@cc/types';

@ApiTags('CRM / Leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadScoringService: LeadScoringService,
  ) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Create lead (Public Inquiry & Authenticated Manual Creation)',
    description: 'Allows public visitors to submit inquiries or internal staff to create leads manually.',
  })
  @ApiResponse({ status: 201, description: 'Lead successfully captured' })
  async create(
    @Body() dto: CreateLeadDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    const userScope = user
      ? { organizationId: user.organizationId, branchId: user.branchId, id: user.sub }
      : undefined;
    const lead = await this.leadsService.create(dto, userScope);
    // Asynchronously trigger AI lead score calculation
    this.leadScoringService.calculateScore(lead.id).catch(() => {});
    return lead;
  }

  @ApiBearerAuth('bearer')
  @Get('priority-queue')
  @RequirePermissions('lead.view')
  @ApiOperation({
    summary: 'Get AI-prioritized leads queue ranked by conversion probability',
    description: 'Returns hot and high-velocity leads for sales and operations triage.',
  })
  @ApiResponse({ status: 200, description: 'Ranked priority queue items' })
  async getPriorityQueue(
    @Query('minScore') minScore?: number,
    @Query('grade') grade?: string,
    @Query('priorityRank') priorityRank?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    const userContext = user ? { organizationId: user.organizationId, branchId: user.branchId } : undefined;
    return this.leadScoringService.getPriorityQueue(
      { minScore, grade, priorityRank, limit, offset },
      userContext,
    );
  }

  @ApiBearerAuth('bearer')
  @Get()
  @RequirePermissions('lead.view')
  @ApiOperation({
    summary: 'Get paginated list of leads',
    description: 'Filter leads by status, branch, source, assigned employee, date range, or keyword search.',
  })
  @ApiResponse({ status: 200, description: 'Paginated lead records' })
  async findAll(
    @Query() query: QueryLeadsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.leadsService.findAll(query, userContext);
  }

  @ApiBearerAuth('bearer')
  @Get(':id')
  @RequirePermissions('lead.view')
  @ApiOperation({
    summary: 'Get lead detail with activity timeline and assignment history',
  })
  @ApiResponse({ status: 200, description: 'Lead detail object' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.leadsService.findOne(id, userContext);
  }

  @ApiBearerAuth('bearer')
  @Patch(':id')
  @RequirePermissions('lead.update')
  @ApiOperation({ summary: 'Update lead profile / contact info' })
  @ApiResponse({ status: 200, description: 'Updated lead details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.leadsService.update(id, dto, userContext);
  }

  @ApiBearerAuth('bearer')
  @Patch(':id/status')
  @RequirePermissions('lead.update')
  @ApiOperation({
    summary: 'Transition lead status through state machine',
    description: 'Enforces state machine rules (NEW → CONTACTED → QUALIFIED → PROPOSAL → CONVERTED/LOST) and writes immutable activity logs.',
  })
  @ApiResponse({ status: 200, description: 'Status updated and activity recorded' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: ChangeLeadStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.leadsService.updateStatus(id, dto, userContext);
  }

  @ApiBearerAuth('bearer')
  @Post(':id/assign')
  @RequirePermissions('lead.assign')
  @ApiOperation({
    summary: 'Assign or reassign lead to an employee',
    description: 'Updates lead assignee and records immutable audit log in lead_assignments.',
  })
  @ApiResponse({ status: 200, description: 'Lead assigned successfully' })
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignLeadDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.leadsService.assign(id, dto, userContext);
  }

  @ApiBearerAuth('bearer')
  @Post(':id/activities')
  @RequirePermissions('lead.update')
  @ApiOperation({
    summary: 'Log an activity (call, email, WhatsApp, meeting, note) on a lead',
  })
  @ApiResponse({ status: 201, description: 'Activity logged to timeline' })
  async addActivity(
    @Param('id') id: string,
    @Body() dto: CreateLeadActivityDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.leadsService.addActivity(id, dto, userContext);
  }

  @ApiBearerAuth('bearer')
  @Delete(':id')
  @RequirePermissions('lead.delete')
  @ApiOperation({ summary: 'Soft delete a lead' })
  @ApiResponse({ status: 200, description: 'Lead archived' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const userContext = {
      id: user.sub,
      organizationId: user.organizationId,
      branchId: user.branchId,
      roles: user.roles,
    };
    return this.leadsService.remove(id, userContext);
  }

  @ApiBearerAuth('bearer')
  @Post(':id/recalculate-score')
  @RequirePermissions('lead.update')
  @ApiOperation({ summary: 'Recalculate AI lead score & factors' })
  @ApiResponse({ status: 200, description: 'Newly calculated score record' })
  async recalculateScore(@Param('id') id: string) {
    return this.leadScoringService.calculateScore(id);
  }

  @ApiBearerAuth('bearer')
  @Get(':id/score-breakdown')
  @RequirePermissions('lead.view')
  @ApiOperation({ summary: 'Get AI score breakdown & factor explanations for a lead' })
  @ApiResponse({ status: 200, description: 'Score factor breakdown' })
  async getScoreBreakdown(@Param('id') id: string) {
    return this.leadScoringService.getScoreBreakdown(id);
  }
}
