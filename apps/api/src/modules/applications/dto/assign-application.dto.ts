import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignApplicationDto {
  @ApiProperty({ description: 'Operations Employee User UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  assignedToUserId: string;

  @ApiPropertyOptional({ example: 'Assigned to Senior MCA Specialist for direct filing' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
