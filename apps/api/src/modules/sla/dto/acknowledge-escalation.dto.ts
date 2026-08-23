import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AcknowledgeEscalationDto {
  @ApiPropertyOptional({ description: 'Optional operational notes or mitigation actions' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
