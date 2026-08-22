import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@cc/types';

export class QueryInvoicesDto {
  @ApiPropertyOptional({ description: 'Page number (default 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (default 20, max 100)', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by Customer ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by Application ID' })
  @IsString()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by invoice status',
    enum: [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
  })
  @IsString()
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Search by invoice number or customer name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date ISO string' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date ISO string' })
  @IsString()
  @IsOptional()
  endDate?: string;
}
