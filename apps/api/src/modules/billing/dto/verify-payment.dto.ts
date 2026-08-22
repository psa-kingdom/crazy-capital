import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ description: 'Razorpay Order ID returned by createOrder' })
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @ApiProperty({ description: 'Razorpay Payment ID returned upon successful checkout' })
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @ApiProperty({ description: 'Cryptographic signature from Razorpay checkout' })
  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
