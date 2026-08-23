import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { WorkflowStageType } from '@cc/types';

export class UpdateWorkflowStageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  stageOrder?: number;

  @ApiPropertyOptional({ enum: WorkflowStageType })
  @IsOptional()
  @IsEnum(WorkflowStageType)
  stageType?: WorkflowStageType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isStartStage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEndStage?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  slaHours?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  warningHours?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  canvasX?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  canvasY?: number | null;
}
