import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApplicationActivityDto {
  @ApiPropertyOptional({ example: 'NOTE', default: 'NOTE' })
  @IsOptional()
  @IsString()
  activityType?: string = 'NOTE';

  @ApiProperty({ example: 'Spoke with customer regarding name approval rejection; submitting alternative RUN form' })
  @IsString()
  @IsNotEmpty()
  notes: string;
}
