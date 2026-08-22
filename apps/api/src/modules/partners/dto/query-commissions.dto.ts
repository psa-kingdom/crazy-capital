import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CommissionStatus } from '@cc/types';

export class QueryCommissionsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID'] })
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'PAID'])
  status?: CommissionStatus;

  @ApiPropertyOptional({ description: 'Filter by partner User ID' })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Filter by service ID' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Search by partner name, email, or application number' })
  @IsOptional()
  @IsString()
  search?: string;
}
