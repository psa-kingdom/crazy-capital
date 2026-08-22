import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { TestDispatchDto } from './dto/test-dispatch.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Notifications & Alerts')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('logs')
  @RequirePermissions('notification.read')
  @ApiOperation({ summary: 'List and filter notification delivery logs' })
  @ApiResponse({ status: 200, description: 'Paginated list of notification logs' })
  findAll(@Query() query: QueryNotificationsDto, @CurrentUser() user: any) {
    return this.notificationsService.findAll(query, user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current customer notification alerts' })
  @ApiResponse({ status: 200, description: 'Customer notification list' })
  findMyNotifications(@CurrentUser() user: any) {
    return this.notificationsService.findCustomerNotifications(user);
  }

  @Get('logs/:id')
  @RequirePermissions('notification.read')
  @ApiOperation({ summary: 'Get detailed notification log with provider response payload' })
  @ApiResponse({ status: 200, description: 'Notification log details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.findOne(id, user);
  }

  @Post('logs/:id/retry')
  @RequirePermissions('notification.update')
  @ApiOperation({ summary: 'Retry a failed notification dispatch' })
  @ApiResponse({ status: 200, description: 'Notification retry initiated' })
  retry(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.retry(id, user);
  }

  @Post('test-dispatch')
  @RequirePermissions('notification.create')
  @ApiOperation({ summary: 'Staging test tool: dispatch test notification across email/SMS/WhatsApp' })
  @ApiResponse({ status: 201, description: 'Test notification dispatched' })
  testDispatch(@Body() dto: TestDispatchDto, @CurrentUser() user: any) {
    return this.notificationsService.testDispatch(dto, user);
  }
}
