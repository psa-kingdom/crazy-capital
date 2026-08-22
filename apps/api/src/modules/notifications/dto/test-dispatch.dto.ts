import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '@cc/types';

export class TestDispatchDto {
  @ApiProperty({ enum: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'] })
  @IsNotEmpty()
  @IsIn(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'])
  channel: NotificationChannel;

  @ApiProperty({ description: 'Target email address or mobile number for test' })
  @IsNotEmpty()
  @IsString()
  recipient: string;

  @ApiPropertyOptional({ description: 'Event type to simulate (e.g. invoice.sent, payment.captured)' })
  @IsOptional()
  @IsString()
  eventType?: string = 'test.dispatch';

  @ApiPropertyOptional({ description: 'Optional custom message content' })
  @IsOptional()
  @IsString()
  customMessage?: string;

  @ApiPropertyOptional({ description: 'Optional custom subject' })
  @IsOptional()
  @IsString()
  subject?: string;
}
