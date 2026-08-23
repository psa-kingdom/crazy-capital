import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ReassignTaskDto {
  @ApiProperty({ description: 'Target assignee User UUID' })
  @IsNotEmpty()
  @IsUUID()
  assignedToId: string;

  @ApiPropertyOptional({ description: 'Reason for reassignment / workload balance note' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CompleteTaskDto {
  @ApiPropertyOptional({ description: 'Operational completion notes / remarks' })
  @IsOptional()
  @IsString()
  completionNotes?: string;
}
