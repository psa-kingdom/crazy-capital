import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { recordTelemetryProbeSchema } from '@cc/validation';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('health')
  @Public()
  async getHealth() {
    const summary = await this.telemetryService.getSystemHealthSummary();
    return {
      success: true,
      data: summary,
    };
  }

  @Post('probes')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('system:manage')
  @HttpCode(HttpStatus.CREATED)
  async recordProbe(@Body() body: any) {
    const validated = recordTelemetryProbeSchema.parse(body);
    const result = await this.telemetryService.recordProbe(validated as any);
    return {
      success: true,
      data: result,
    };
  }

  @Get('probes')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @RequirePermissions('system:view')
  async getProbeHistory(
    @Query('serviceName') serviceName?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.telemetryService.getProbeHistory(
      serviceName,
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      success: true,
      data,
    };
  }
}
