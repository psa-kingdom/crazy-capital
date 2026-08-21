import { IsUUID, IsString, IsNotEmpty, IsInt, IsPositive, Max, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export class RequestPresignedUploadDto {
  @ApiProperty({ description: 'ID of the customer who owns the document', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional({ description: 'Optional ID of the application this document is attached to', example: 'uuid' })
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiProperty({ description: 'ID of the document type (e.g. PAN, AADHAAR)', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  documentTypeId!: string;

  @ApiProperty({ description: 'Original file name (e.g. pan_card.pdf)', example: 'pan_card.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ description: 'File size in bytes (max 15MB = 15,728,640 bytes)', example: 1048576 })
  @IsInt()
  @IsPositive()
  @Max(15 * 1024 * 1024, { message: 'File size cannot exceed 15MB' })
  fileSize!: number;

  @ApiProperty({
    description: 'MIME type of the file (application/pdf, image/jpeg, image/png, etc.)',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_MIME_TYPES, {
    message: 'Unsupported MIME type. Allowed: PDF, JPG, PNG, DOC, DOCX',
  })
  mimeType!: string;
}
