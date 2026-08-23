import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BankDetailsOverrideDto {
  @ApiPropertyOptional({ description: 'Bank Account Number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Bank IFSC Code' })
  @IsOptional()
  @IsString()
  ifsc?: string;

  @ApiPropertyOptional({ description: 'Account Holder Name' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({ description: 'UPI VPA Address' })
  @IsOptional()
  @IsString()
  upiId?: string;
}

export class ExecutePayoutDto {
  @ApiProperty({ description: 'Commission UUID to disburse via RazorpayX' })
  @IsNotEmpty()
  @IsString()
  commissionId: string;

  @ApiPropertyOptional({
    description: 'Transfer mode',
    enum: ['IMPS', 'NEFT', 'RTGS', 'UPI'],
    default: 'IMPS',
  })
  @IsOptional()
  @IsEnum(['IMPS', 'NEFT', 'RTGS', 'UPI'])
  mode?: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';

  @ApiPropertyOptional({ description: 'Strategic / accounting disbursement notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Custom client idempotency key' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Optional bank details override' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsOverrideDto)
  bankDetailsOverride?: BankDetailsOverrideDto;
}
