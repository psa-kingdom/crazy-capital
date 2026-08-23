import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ description: 'Application UUID' })
  @IsNotEmpty()
  @IsUUID()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Optional WorkflowStage UUID' })
  @IsOptional()
  @IsUUID()
  workflowStageId?: string;

  @ApiProperty({ description: 'Task title / operation summary' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed instructions or checklist' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Task category', default: 'STAGE_EXECUTION' })
  @IsOptional()
  @IsString()
  taskType?: string;

  @ApiPropertyOptional({ description: 'Priority level (LOW, MEDIUM, HIGH, URGENT, CRITICAL)', default: 'MEDIUM' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Target department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Required employee specialization/skill' })
  @IsOptional()
  @IsString()
  requiredSkill?: string;

  @ApiPropertyOptional({ description: 'Estimated effort in hours', default: 4.0 })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'SLA target hours for completion' })
  @IsOptional()
  @IsNumber()
  slaHours?: number;

  @ApiPropertyOptional({ description: 'Explicit due date timestamp' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Direct assignee User UUID (if overriding intelligent auto-routing)' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
