import { IsNotEmpty, IsString, IsOptional, IsIn, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationEventType } from '@cc/types';

export class SendNotificationDto {
  @ApiProperty({ enum: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'] })
  @IsNotEmpty()
  @IsIn(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'])
  channel: NotificationChannel;

  @ApiProperty({ description: 'Event identifier e.g. invoice.sent, payment.captured' })
  @IsNotEmpty()
  @IsString()
  eventType: NotificationEventType | string;

  @ApiProperty({ description: 'Recipient email address or phone number' })
  @IsNotEmpty()
  @IsString()
  recipient: string;

  @ApiPropertyOptional({ description: 'Subject line for email notifications' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ description: 'Custom message body (if not using template)' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Associated customer/user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Template variables' })
  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate dispatch' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Additional structured metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
