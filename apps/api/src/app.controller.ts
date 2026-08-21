import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('System')
@Controller()
export class AppController {
  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint for staging / production probes' })
  @ApiResponse({ status: 200, description: 'System healthy' })
  getHealth() {
    return {
      status: 'ok',
      service: 'Crazy Capital Operating Platform API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
