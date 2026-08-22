import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordManualPaymentDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ description: 'Amount collected in INR', example: 11800 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Offline payment method',
    enum: ['BANK_TRANSFER', 'NEFT', 'RTGS', 'CHEQUE', 'CASH', 'UPI_OFFLINE'],
    example: 'BANK_TRANSFER',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['BANK_TRANSFER', 'NEFT', 'RTGS', 'CHEQUE', 'CASH', 'UPI_OFFLINE'])
  paymentMethod: string;

  @ApiProperty({ description: 'UTR number, cheque number, or bank transaction reference', example: 'UTR9847291038' })
  @IsString()
  @IsNotEmpty()
  referenceNumber: string;

  @ApiPropertyOptional({ description: 'Optional operational notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
