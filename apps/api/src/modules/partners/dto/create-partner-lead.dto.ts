import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePartnerLeadDto {
  @ApiProperty({ description: 'First name of the prospect' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the prospect' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Mobile phone number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Company or business entity name' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Service category or service name of interest' })
  @IsOptional()
  @IsString()
  serviceInterest?: string;

  @ApiPropertyOptional({ description: 'Referral notes or context' })
  @IsOptional()
  @IsString()
  notes?: string;
}
