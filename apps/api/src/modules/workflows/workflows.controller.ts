import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { CreateWorkflowStageDto } from './dto/create-workflow-stage.dto';
import { CreateWorkflowTransitionDto } from './dto/create-workflow-transition.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { TransitionWorkflowInstanceDto } from './dto/transition-instance.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { BulkUpdateWorkflowGraphDto } from './dto/bulk-update-graph.dto';
import { UpdateWorkflowStageDto } from './dto/update-stage.dto';
import { CloneWorkflowDto } from './dto/clone-workflow.dto';
import { WorkflowsService } from './workflows.service';

@ApiTags('Workflow Engine')
@ApiBearerAuth()
@Controller()
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get('workflows')
  @RequirePermissions('workflow.read')
  @ApiOperation({ summary: 'List all workflow blueprints across services' })
  async findAll() {
    return this.workflowsService.findAll();
  }

  @Post('workflows')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Create a new workflow blueprint for a service (Admin only - ADR-012 1:1)' })
  @ApiResponse({ status: 201, description: 'Workflow created successfully' })
  async create(@Body() dto: CreateWorkflowDto) {
    return this.workflowsService.create(dto);
  }

  @Get('workflows/:id')
  @RequirePermissions('workflow.read')
  @ApiOperation({ summary: 'Get workflow blueprint details with all stages and transitions' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.findOne(id);
  }

  @Get('workflows/:id/graph')
  @RequirePermissions('workflow.read')
  @ApiOperation({ summary: 'Get DAG graph layout with nodes, edges, cycle detection & validation for visual canvas' })
  async getGraph(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.getGraph(id);
  }

  @Post('workflows/:id/graph')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Atomic bulk update of visual graph canvas layout, stages, transitions and rules' })
  async bulkUpdateGraph(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BulkUpdateWorkflowGraphDto,
  ) {
    return this.workflowsService.bulkUpdateGraph(id, dto);
  }

  @Post('workflows/:id/clone')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Clone an existing workflow blueprint for another service' })
  async cloneWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloneWorkflowDto,
  ) {
    return this.workflowsService.cloneWorkflow(id, dto);
  }

  @Get('services/:serviceId/workflow')
  @RequirePermissions('workflow.read')
  @ApiOperation({ summary: 'Get workflow blueprint configured for a specific service' })
  async findByServiceId(@Param('serviceId', ParseUUIDPipe) serviceId: string) {
    return this.workflowsService.findByServiceId(serviceId);
  }

  @Patch('workflows/:id')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Update workflow metadata (Admin only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.workflowsService.update(id, dto);
  }

  @Post('workflows/:id/stages')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Add an ordered stage to a workflow blueprint (Admin only)' })
  async addStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWorkflowStageDto,
  ) {
    return this.workflowsService.addStage(id, dto);
  }

  @Patch('workflows/stages/:stageId')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Update an individual workflow stage properties & SLA (Admin only)' })
  async updateStage(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: UpdateWorkflowStageDto,
  ) {
    return this.workflowsService.updateStage(stageId, dto);
  }

  @Delete('workflows/stages/:stageId')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Delete a workflow stage (Admin only)' })
  async deleteStage(@Param('stageId', ParseUUIDPipe) stageId: string) {
    return this.workflowsService.deleteStage(stageId);
  }

  @Post('workflows/:id/transitions')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Define an allowable stage-to-stage transition (Admin only)' })
  async addTransition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWorkflowTransitionDto,
  ) {
    return this.workflowsService.addTransition(id, dto);
  }

  @Delete('workflows/transitions/:transitionId')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Delete a transition between stages (Admin only)' })
  async deleteTransition(@Param('transitionId', ParseUUIDPipe) transitionId: string) {
    return this.workflowsService.deleteTransition(transitionId);
  }

  @Post('workflows/stages/:stageId/rules')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Configure a Document/Payment/Approval gate rule on a stage (Admin only)' })
  async addRule(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: CreateWorkflowRuleDto,
  ) {
    return this.workflowsService.addRule(stageId, dto);
  }

  @Delete('workflows/rules/:ruleId')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Delete a workflow gate rule (Admin only)' })
  async deleteRule(@Param('ruleId', ParseUUIDPipe) ruleId: string) {
    return this.workflowsService.deleteRule(ruleId);
  }

  @Post('workflow-instances/:id/transition')
  @RequirePermissions('application.update')
  @ApiOperation({ summary: 'Advance workflow instance to target stage with gate validation' })
  async transitionInstance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionWorkflowInstanceDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.transitionInstance(
      id,
      dto,
      user.id,
      user.organizationId,
    );
  }

  @Get('workflow-instances/:id/history')
  @RequirePermissions('application.read')
  @ApiOperation({ summary: 'Get complete audit history of stage transitions for an instance' })
  async getInstanceHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.getInstanceHistory(id);
  }
}
