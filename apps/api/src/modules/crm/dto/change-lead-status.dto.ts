import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LeadStatus } from '@cc/types';

export class ChangeLeadStatusDto {
  @ApiProperty({
    enum: LeadStatus,
    example: LeadStatus.QUALIFIED,
    description: 'Target lead status (NEW, CONTACTED, QUALIFIED, PROPOSAL, CONVERTED, LOST)',
  })
  @IsEnum(LeadStatus)
  @IsNotEmpty()
  status: LeadStatus;

  @ApiPropertyOptional({ example: 'Client requested comprehensive pitch proposal and quote', description: 'Remarks or reason for status transition' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
