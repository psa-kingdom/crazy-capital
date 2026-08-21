import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PricingType } from '@cc/types';

export class CreateServicePricingDto {
  @ApiProperty({ enum: PricingType, default: PricingType.STANDARD })
  @IsEnum(PricingType)
  pricingType: PricingType;

  @ApiProperty({ example: 4999.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: '2026-08-21T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;
}
