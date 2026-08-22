import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Customer ID for whom the invoice is issued' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional({ description: 'Associated Application ID if linked to a service case' })
  @IsString()
  @IsOptional()
  applicationId?: string;

  @ApiProperty({ description: 'Base service amount before GST taxes', example: 10000 })
  @IsNumber()
  @Min(0)
  baseAmount: number;

  @ApiPropertyOptional({ description: 'Explicit tax amount (if omitted, standard 18% GST is auto-computed)', example: 1800 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Optional invoice notes or description' })
  @IsString()
  @IsOptional()
  notes?: string;
}
