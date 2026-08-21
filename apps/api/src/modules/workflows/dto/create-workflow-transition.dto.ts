import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateWorkflowTransitionDto {
  @ApiProperty({ description: 'Origin Stage UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  fromStageId: string;

  @ApiProperty({ description: 'Destination Stage UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  toStageId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean = false;
}
