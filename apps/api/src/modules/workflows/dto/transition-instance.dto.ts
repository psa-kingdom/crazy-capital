import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class TransitionWorkflowInstanceDto {
  @ApiProperty({ description: 'Target Workflow Stage UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  targetStageId: string;

  @ApiPropertyOptional({ example: 'Documents verified by MCA executive; moving to filing stage' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
