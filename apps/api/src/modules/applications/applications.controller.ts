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
import { ApplicationsService } from './applications.service';
import { AssignApplicationDto } from './dto/assign-application.dto';
import { CreateApplicationActivityDto } from './dto/create-application-activity.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TransitionStageDto } from './dto/transition-stage.dto';

@ApiTags('Application Lifecycle')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @RequirePermissions('application.create')
  @ApiOperation({ summary: 'Register a new service application and initiate workflow instance' })
  @ApiResponse({ status: 201, description: 'Application registered and workflow initialized' })
  async create(
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.create(dto, user);
  }

  @Get()
  @RequirePermissions('application.read')
  @ApiOperation({ summary: 'List and filter applications with tenant and branch scoping' })
  async findAll(
    @Query() query: QueryApplicationsDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('application.read')
  @ApiOperation({ summary: 'Get Application 360 cockpit view (Workflow stepper, tasks, activities)' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.findOne(id, user);
  }

  @Patch(':id/assign')
  @RequirePermissions('application.assign')
  @ApiOperation({ summary: 'Assign or reassign application to an operations employee' })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.assign(id, dto, user);
  }

  @Post(':id/tasks')
  @RequirePermissions('application.update')
  @ApiOperation({ summary: 'Create an operational task linked to application stage' })
  async createTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.createTask(id, dto, user);
  }

  @Patch('tasks/:taskId')
  @RequirePermissions('application.update')
  @ApiOperation({ summary: 'Update status or reassign operational task' })
  async updateTask(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.updateTask(taskId, dto, user);
  }

  @Post(':id/activities')
  @RequirePermissions('application.update')
  @ApiOperation({ summary: 'Log operational activity or note on application timeline' })
  async addActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateApplicationActivityDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.addActivity(id, dto, user);
  }

  @Patch(':id/transition')
  @RequirePermissions('application.update')
  @ApiOperation({ summary: 'Advance application workflow stage and reset SLA tracking' })
  async transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionStageDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.transitionStage(id, dto.targetStageId, user, dto.notes);
  }
}

