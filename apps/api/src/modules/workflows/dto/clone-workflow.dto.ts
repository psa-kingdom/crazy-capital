import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CloneWorkflowDto {
  @ApiProperty({ description: 'Target Service ID to attach the cloned workflow (ADR-012: 1:1)' })
  @IsUUID()
  @IsNotEmpty()
  targetServiceId: string;

  @ApiProperty({ description: 'Name of the new cloned workflow' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Unique code for the cloned workflow' })
  @IsOptional()
  @IsString()
  code?: string;
}
