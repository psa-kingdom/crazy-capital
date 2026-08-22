import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '@cc/types';

export class UpdateInvoiceStatusDto {
  @ApiProperty({
    description: 'Target invoice status',
    enum: [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
    example: InvoiceStatus.SENT,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.CANCELLED])
  status: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Reason for status update or cancellation' })
  @IsString()
  @IsOptional()
  reason?: string;
}
