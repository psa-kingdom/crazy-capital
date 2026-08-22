import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentOrderDto {
  @ApiProperty({ description: 'Invoice ID to collect payment for' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiPropertyOptional({ description: 'Preferred payment method (e.g. CARD, UPI, NETBANKING)' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
