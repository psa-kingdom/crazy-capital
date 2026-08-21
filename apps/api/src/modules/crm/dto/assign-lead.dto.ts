import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignLeadDto {
  @ApiProperty({ example: 'u1234567-89ab-cdef-0123-456789abcdef', description: 'User ID of the employee to assign this lead to' })
  @IsUUID()
  @IsNotEmpty()
  assignedToUserId: string;

  @ApiPropertyOptional({ example: 'Assigned to North region corporate sales specialist', description: 'Assignment rationale or remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
