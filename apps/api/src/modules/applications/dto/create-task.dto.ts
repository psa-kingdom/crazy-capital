import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Verify Director DSC tokens and MCA portal credentials' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Ensure Class 3 DSC token is plugged and pin verified' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Workflow Stage UUID if stage-specific' })
  @IsOptional()
  @IsUUID('4')
  workflowStageId?: string;

  @ApiPropertyOptional({ description: 'Assigned Employee UUID' })
  @IsOptional()
  @IsUUID('4')
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2026-08-25T18:00:00.000Z' })
  @IsOptional()
  @IsString()
  dueDate?: string;
}
