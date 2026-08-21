import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiPropertyOptional({ description: 'Parent Category ID for nested subcategories' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;

  @ApiProperty({ example: 'Business Registrations' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'business-registrations' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'MCA, GST, MSME and Trade Registrations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
