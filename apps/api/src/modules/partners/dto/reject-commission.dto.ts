import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectCommissionDto {
  @ApiProperty({ description: 'Structured reason for commission rejection' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
