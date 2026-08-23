import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { WorkflowRuleType, WorkflowStageType } from '@cc/types';

export class GraphStageItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
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

export class GraphTransitionItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromStageCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toStageCode: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conditionLabel?: string | null;
}

export class GraphRuleItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  stageCode: string;

  @ApiProperty({ enum: WorkflowRuleType })
  @IsEnum(WorkflowRuleType)
  ruleType: WorkflowRuleType;

  @ApiProperty()
  @IsObject()
  ruleConfig: Record<string, any>;
}

export class BulkUpdateWorkflowGraphDto {
  @ApiProperty({ type: [GraphStageItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GraphStageItemDto)
  stages: GraphStageItemDto[];

  @ApiProperty({ type: [GraphTransitionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GraphTransitionItemDto)
  transitions: GraphTransitionItemDto[];

  @ApiPropertyOptional({ type: [GraphRuleItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GraphRuleItemDto)
  rules?: GraphRuleItemDto[];
}
