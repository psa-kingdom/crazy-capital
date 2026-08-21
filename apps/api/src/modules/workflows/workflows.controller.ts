import {
  Body,
  Controller,
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
import { WorkflowsService } from './workflows.service';

@ApiTags('Workflow Engine')
@ApiBearerAuth()
@Controller()
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

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

  @Post('workflows/:id/transitions')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Define an allowable stage-to-stage transition (Admin only)' })
  async addTransition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWorkflowTransitionDto,
  ) {
    return this.workflowsService.addTransition(id, dto);
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
  @ApiOperation({ summary: 'Get immutable audit history of workflow stage transitions' })
  async getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowsService.getHistory(id);
  }
}
