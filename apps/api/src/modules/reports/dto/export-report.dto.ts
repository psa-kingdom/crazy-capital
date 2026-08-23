import { IsEnum, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportType {
  DASHBOARD = 'DASHBOARD',
  REVENUE = 'REVENUE',
  LEADS = 'LEADS',
  OPERATIONS = 'OPERATIONS',
  BRANCHES = 'BRANCHES',
  COMMISSIONS = 'COMMISSIONS',
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export class ExportReportDto {
  @ApiProperty({ enum: ReportType, description: 'Type of report to generate and export' })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.CSV })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;

  @ApiPropertyOptional({ description: 'Start date in ISO format (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date in ISO format (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by branch UUID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
