import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class TransitionStageDto {
  @ApiProperty({ description: 'Target WorkflowStage UUID to advance to' })
  @IsNotEmpty()
  @IsUUID()
  targetStageId: string;

  @ApiPropertyOptional({ description: 'Optional transition remarks/notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
