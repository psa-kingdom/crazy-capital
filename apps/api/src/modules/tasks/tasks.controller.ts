import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { TasksService } from './tasks.service';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CompleteTaskDto, ReassignTaskDto } from './dto/reassign-task.dto';

@ApiTags('Intelligent Task Engine & Workload Balancing')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('dashboard')
  @RequirePermissions('workflow.view')
  @ApiOperation({ summary: 'Get operational Task Engine & Staff Workload Balancing Dashboard KPIs' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved' })
  async getDashboard(@CurrentUser() user: any) {
    return this.tasksService.getTaskDashboard(user.organizationId, user);
  }

  @Get()
  @RequirePermissions('workflow.view')
  @ApiOperation({ summary: 'Query operational tasks with filters, sorting, and role scoping' })
  @ApiResponse({ status: 200, description: 'Tasks list retrieved' })
  async getTasks(
    @Query() query: QueryTasksDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.getTasks(query, user.organizationId, user);
  }

  @Get(':id')
  @RequirePermissions('workflow.view')
  @ApiOperation({ summary: 'Get full details of a specific operational task' })
  @ApiResponse({ status: 200, description: 'Task retrieved' })
  async getTaskById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.getTaskById(id, user.organizationId, user);
  }

  @Get(':id/candidates')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Get intelligent routing candidate recommendations and workload scores for a task' })
  @ApiResponse({ status: 200, description: 'Candidates list retrieved' })
  async getCandidates(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.getCandidatesForTask(id, user.organizationId, user);
  }

  @Post()
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Manually create an operational task on an application' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async createTask(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.createTask(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('workflow.update')
  @ApiOperation({ summary: 'Update operational task status, priority, or notes' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.updateTask(id, dto, user);
  }

  @Patch(':id/reassign')
  @RequirePermissions('workflow.manage')
  @ApiOperation({ summary: 'Reassign operational task to another employee with audit logging' })
  @ApiResponse({ status: 200, description: 'Task reassigned successfully' })
  async reassignTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReassignTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.reassignTask(id, dto, user);
  }

  @Patch(':id/complete')
  @RequirePermissions('workflow.update')
  @ApiOperation({ summary: 'Mark an operational task as COMPLETED' })
  @ApiResponse({ status: 200, description: 'Task marked as completed' })
  async completeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.completeTask(id, dto.completionNotes, user);
  }
}
