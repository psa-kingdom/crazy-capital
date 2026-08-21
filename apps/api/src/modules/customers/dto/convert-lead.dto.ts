import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType } from '@cc/types';
import { CustomerAddressInputDto, CustomerContactInputDto } from './create-customer.dto';

export class ConvertLeadDto {
  @ApiPropertyOptional({
    enum: CustomerType,
    example: CustomerType.BUSINESS,
    default: CustomerType.INDIVIDUAL,
  })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType = CustomerType.INDIVIDUAL;

  @ApiPropertyOptional({ example: 'Sharma Enterprises Pvt Ltd', description: 'Business company name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F', description: 'PAN Number' })
  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN number format' })
  pan?: string;

  @ApiPropertyOptional({ example: '07AAAAA0000A1Z5', description: 'GSTIN Number' })
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { message: 'Invalid GSTIN format' })
  gstin?: string;

  @ApiPropertyOptional({ type: CustomerAddressInputDto, description: 'Primary registered or billing address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAddressInputDto)
  address?: CustomerAddressInputDto;

  @ApiPropertyOptional({ type: CustomerContactInputDto, description: 'Primary contact person' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerContactInputDto)
  contact?: CustomerContactInputDto;
}
