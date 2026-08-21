import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateServiceDocumentDto } from './create-service-document.dto';

export class CreateServiceDto {
  @ApiProperty({ description: 'Category ID UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Private Limited Company Incorporation' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'private-limited-company-incorporation' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'End-to-end MCA incorporation with SPICe+ filing' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 6999 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  standardPrice?: number;

  @ApiPropertyOptional({ example: 4999 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  partnerPrice?: number;

  @ApiPropertyOptional({ type: [CreateServiceDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceDocumentDto)
  requiredDocuments?: CreateServiceDocumentDto[];
}
