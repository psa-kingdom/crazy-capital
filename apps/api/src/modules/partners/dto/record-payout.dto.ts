import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordPayoutDto {
  @ApiProperty({ description: 'ID of the approved commission' })
  @IsNotEmpty()
  @IsString()
  commissionId: string;

  @ApiProperty({ description: 'Bank UTR / Transaction Reference Number' })
  @IsNotEmpty()
  @IsString()
  referenceNumber: string;

  @ApiPropertyOptional({ enum: ['BANK_TRANSFER', 'RAZORPAYX', 'CHEQUE', 'UPI'], default: 'BANK_TRANSFER' })
  @IsOptional()
  @IsIn(['BANK_TRANSFER', 'RAZORPAYX', 'CHEQUE', 'UPI'])
  paymentMethod?: string = 'BANK_TRANSFER';

  @ApiPropertyOptional({ description: 'Disbursement remarks or bank account note' })
  @IsOptional()
  @IsString()
  notes?: string;
}
