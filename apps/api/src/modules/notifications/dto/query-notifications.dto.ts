import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationStatus } from '@cc/types';

export class QueryNotificationsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'] })
  @IsOptional()
  @IsIn(['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'])
  channel?: NotificationChannel;

  @ApiPropertyOptional({ enum: ['PENDING', 'SENT', 'FAILED', 'DELIVERED'] })
  @IsOptional()
  @IsIn(['PENDING', 'SENT', 'FAILED', 'DELIVERED'])
  status?: NotificationStatus;

  @ApiPropertyOptional({ description: 'Filter by event type (e.g. invoice.sent, payment.captured)' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({ description: 'Filter by recipient email or phone' })
  @IsOptional()
  @IsString()
  recipient?: string;

  @ApiPropertyOptional({ description: 'Full text search in recipient, subject, or body' })
  @IsOptional()
  @IsString()
  search?: string;
}
