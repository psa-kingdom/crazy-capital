import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveCommissionDto {
  @ApiPropertyOptional({ description: 'Optional approval notes or disbursement instructions' })
  @IsOptional()
  @IsString()
  notes?: string;
}
