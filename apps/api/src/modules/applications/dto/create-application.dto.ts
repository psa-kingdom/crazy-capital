import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ description: 'Customer UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Service UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  serviceId: string;

  @ApiPropertyOptional({ description: 'Branch UUID (defaults to user branch or customer branch)' })
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @ApiPropertyOptional({ description: 'Initial Operations Employee Assignee UUID' })
  @IsOptional()
  @IsUUID('4')
  assignedToId?: string;

  @ApiPropertyOptional({ example: 'Urgent incorporation required for startup seed round' })
  @IsOptional()
  @IsString()
  notes?: string;
}
