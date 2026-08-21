import { IsOptional, IsUUID, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDocumentsDto {
  @ApiPropertyOptional({ description: 'Page number (default: 1)', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page (default: 10)', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by Customer UUID' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by Application UUID' })
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Filter by Document Type UUID' })
  @IsUUID()
  @IsOptional()
  documentTypeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by document status',
    enum: ['PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED'],
  })
  @IsIn(['PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Search term by file name or document type' })
  @IsString()
  @IsOptional()
  search?: string;
}
