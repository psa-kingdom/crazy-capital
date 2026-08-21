import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentTypeDto {
  @ApiProperty({ description: 'Name of the document type (e.g. PAN Card)', example: 'PAN Card' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Unique uppercase code (e.g. PAN, AADHAAR, GST_CERTIFICATE)',
    example: 'PAN',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9_]+$/, { message: 'Code must be uppercase alphanumeric and underscores' })
  code!: string;

  @ApiPropertyOptional({
    description: 'Description of document requirements and guidelines',
    example: 'Permanent Account Number issued by Income Tax Department',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
