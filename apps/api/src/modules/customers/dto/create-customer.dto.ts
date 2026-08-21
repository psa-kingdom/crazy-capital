import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerAddressType, CustomerType } from '@cc/types';

export class CustomerAddressInputDto {
  @ApiPropertyOptional({
    enum: CustomerAddressType,
    example: CustomerAddressType.REGISTERED,
    default: CustomerAddressType.REGISTERED,
  })
  @IsOptional()
  @IsEnum(CustomerAddressType)
  type?: CustomerAddressType = CustomerAddressType.REGISTERED;

  @ApiProperty({ example: 'Suite 402, Pinnacle Business Tower', description: 'Address Line 1' })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Sector 62', description: 'Address Line 2' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Noida', description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Uttar Pradesh', description: 'State' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ example: 'India', default: 'India' })
  @IsOptional()
  @IsString()
  country?: string = 'India';

  @ApiProperty({ example: '201309', description: '6-digit Indian PIN Code' })
  @IsString()
  @Matches(/^[1-9][0-9]{5}$/, { message: 'Invalid 6-digit Indian PIN code' })
  pincode: string;
}

export class CustomerContactInputDto {
  @ApiProperty({ example: 'Vikas Sharma', description: 'Name of key contact person' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '9876543210', description: 'Mobile number of contact person' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid 10-digit Indian mobile number' })
  mobile: string;

  @ApiPropertyOptional({ example: 'vikas@example.com', description: 'Email of contact person' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Managing Director', description: 'Designation / Role' })
  @IsOptional()
  @IsString()
  designation?: string;
}

export class CreateCustomerDto {
  @ApiProperty({
    enum: CustomerType,
    example: CustomerType.BUSINESS,
    default: CustomerType.INDIVIDUAL,
  })
  @IsEnum(CustomerType)
  customerType: CustomerType;

  @ApiProperty({ example: 'Rahul', description: 'Customer first name / primary contact first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Sharma', description: 'Customer last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'rahul.sharma@example.com', description: 'Unique customer email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '9876543210', description: 'Unique customer 10-digit mobile number' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid 10-digit Indian mobile number' })
  mobile: string;

  @ApiPropertyOptional({ example: 'Sharma Enterprises Private Limited', description: 'Business or trade entity name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'ABCDE1234F', description: '10-character Indian PAN' })
  @IsOptional()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'Invalid PAN number format (e.g. ABCDE1234F)' })
  pan?: string;

  @ApiPropertyOptional({ example: '07AAAAA0000A1Z5', description: '15-character Indian GSTIN' })
  @IsOptional()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, { message: 'Invalid GSTIN format' })
  gstin?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ type: [CustomerAddressInputDto], description: 'List of customer addresses' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerAddressInputDto)
  addresses?: CustomerAddressInputDto[];

  @ApiPropertyOptional({ type: [CustomerContactInputDto], description: 'List of key contact persons' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerContactInputDto)
  contacts?: CustomerContactInputDto[];
}
