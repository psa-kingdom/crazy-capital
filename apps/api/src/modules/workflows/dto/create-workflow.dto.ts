import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateWorkflowStageDto } from './create-workflow-stage.dto';

export class CreateWorkflowDto {
  @ApiProperty({ description: 'Associated Service UUID (1:1 per ADR-012)' })
  @IsUUID('4')
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 'Private Limited Company Standard Incorporation Flow' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'WF_PVT_LTD_INC' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Standard MCA filing pipeline with SPICe+ and PAN/TAN' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [CreateWorkflowStageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowStageDto)
  stages?: CreateWorkflowStageDto[];
}
