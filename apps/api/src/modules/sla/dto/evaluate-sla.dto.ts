import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class EvaluateSlaDto {
  @ApiPropertyOptional({ description: 'Optional specific workflow instance ID to evaluate' })
  @IsOptional()
  @IsString()
  instanceId?: string;

  @ApiPropertyOptional({ description: 'Optional ISO timestamp string to simulate evaluation at a past/future time' })
  @IsOptional()
  @IsString()
  referenceTime?: string;
}
