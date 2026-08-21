import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { WorkflowStageType } from '@cc/types';

export class CreateWorkflowStageDto {
  @ApiProperty({ example: 'Application Intake & Document Collection' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'INTAKE' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 1, description: '1-based sequential stage order' })
  @IsInt()
  @Min(1)
  stageOrder: number;

  @ApiPropertyOptional({ enum: WorkflowStageType, default: WorkflowStageType.PROCESSING })
  @IsOptional()
  @IsEnum(WorkflowStageType)
  stageType?: WorkflowStageType = WorkflowStageType.PROCESSING;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isStartStage?: boolean = false;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isEndStage?: boolean = false;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean = true;

  @ApiPropertyOptional({ example: 24, description: 'Target SLA in hours' })
  @IsOptional()
  @IsInt()
  @Min(1)
  slaHours?: number;
}
