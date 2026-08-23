import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task status (PENDING, IN_PROGRESS, UNDER_REVIEW, COMPLETED, CANCELLED, BLOCKED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Priority level (LOW, MEDIUM, HIGH, URGENT, CRITICAL)' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Task description / instructions' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Completion notes or operational findings' })
  @IsOptional()
  @IsString()
  completionNotes?: string;
}
