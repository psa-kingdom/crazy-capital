import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({ example: 'Rahul', description: 'First name of the lead' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Sharma', description: 'Last name of the lead' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'rahul.sharma@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '9876543210', description: '10-digit Indian mobile number' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Mobile must be a valid 10-digit Indian mobile number' })
  mobile: string;

  @ApiPropertyOptional({ example: 'Sharma Enterprises Pvt Ltd', description: 'Company or business name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'WEBSITE', description: 'Code of the lead source (e.g. WEBSITE, WHATSAPP, PARTNER_REFERRAL)' })
  @IsOptional()
  @IsString()
  sourceCode?: string;

  @ApiPropertyOptional({ example: 'c1234567-89ab-cdef-0123-456789abcdef', description: 'ID of the lead source' })
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiPropertyOptional({ example: 'c1234567-89ab-cdef-0123-456789abcdef', description: 'Target branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Interested in Private Limited Company Registration', description: 'Initial notes or remarks' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'DIWALI_2026_CAMPAIGN', description: 'Campaign tracking tag' })
  @IsOptional()
  @IsString()
  campaign?: string;

  @ApiPropertyOptional({ example: 25, description: 'Initial lead score (0-100)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  leadScore?: number;
}
