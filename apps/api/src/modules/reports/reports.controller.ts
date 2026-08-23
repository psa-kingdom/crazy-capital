import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { QueryReportsDto } from './dto/query-reports.dto';
import { ExportReportDto } from './dto/export-report.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Operational Dashboards & Reporting')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('report.view')
  @ApiOperation({ summary: 'Executive & Branch Operational Dashboard (Real-time financial, CRM, fulfillment KPIs)' })
  @ApiResponse({ status: 200, description: 'Operational dashboard metrics' })
  getDashboard(
    @Query() query: QueryReportsDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getDashboard(user, query);
  }

  @Get('revenue')
  @RequirePermissions('report.view')
  @ApiOperation({ summary: 'Revenue & Billing Analytics (Trends, service breakdowns, collections)' })
  @ApiResponse({ status: 200, description: 'Revenue report dataset' })
  getRevenueReport(
    @Query() query: QueryReportsDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getRevenueReport(user, query);
  }

  @Get('leads')
  @RequirePermissions('report.view')
  @ApiOperation({ summary: 'CRM Leads & Conversion Analytics (Status funnels, channel sources, employee velocity)' })
  @ApiResponse({ status: 200, description: 'Leads report dataset' })
  getLeadsReport(
    @Query() query: QueryReportsDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getLeadsReport(user, query);
  }

  @Get('operations')
  @RequirePermissions('report.view')
  @ApiOperation({ summary: 'Fulfillment & Workflow Operations Analytics (Active stages, turnaround, document audit)' })
  @ApiResponse({ status: 200, description: 'Operations report dataset' })
  getOperationsReport(
    @Query() query: QueryReportsDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getOperationsReport(user, query);
  }

  @Get('branches')
  @RequirePermissions('report.view')
  @ApiOperation({ summary: 'Multi-Branch Comparative Performance Benchmarking' })
  @ApiResponse({ status: 200, description: 'Branch comparison metrics' })
  getBranchComparison(
    @Query() query: QueryReportsDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getBranchComparison(user, query);
  }

  @Post('export')
  @RequirePermissions('report.export')
  @ApiOperation({ summary: 'Export Report Dataset to CSV / JSON' })
  @ApiResponse({ status: 200, description: 'Export file contents' })
  async exportReport(
    @Body() dto: ExportReportDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const result = await this.reportsService.exportReport(user, dto);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.content);
  }
}
