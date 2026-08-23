import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class RetryPayoutDto {
  @ApiPropertyOptional({ description: 'Remarks for retrying the failed payout' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'New transfer mode to attempt',
    enum: ['IMPS', 'NEFT', 'RTGS', 'UPI'],
  })
  @IsOptional()
  @IsEnum(['IMPS', 'NEFT', 'RTGS', 'UPI'])
  newMode?: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';
}
