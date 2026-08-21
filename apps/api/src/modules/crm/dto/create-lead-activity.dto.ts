import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LeadActivityType } from '@cc/types';

export class CreateLeadActivityDto {
  @ApiProperty({
    enum: LeadActivityType,
    example: LeadActivityType.CALL,
    description: 'Activity channel / type (CALL, EMAIL, WHATSAPP, MEETING, NOTE, STATUS_CHANGE)',
  })
  @IsEnum(LeadActivityType)
  @IsNotEmpty()
  activityType: LeadActivityType;

  @ApiProperty({ example: 'Discussed timeline and requirements for trademark registration. Client ready to proceed.', description: 'Activity details and notes' })
  @IsString()
  @IsNotEmpty()
  notes: string;
}
