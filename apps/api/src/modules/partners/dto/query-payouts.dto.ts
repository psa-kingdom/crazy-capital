import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutStatus } from '@cc/types';

export class QueryPayoutsDto {
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

  @ApiPropertyOptional({ enum: ['PENDING_PAYOUT', 'PAID', 'FAILED'] })
  @IsOptional()
  @IsIn(['PENDING_PAYOUT', 'PAID', 'FAILED'])
  status?: PayoutStatus;

  @ApiPropertyOptional({ description: 'Filter by partner User ID' })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional({ description: 'Search by UTR reference number or partner' })
  @IsOptional()
  @IsString()
  search?: string;
}
