import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateServiceDocumentDto {
  @ApiProperty({ description: 'Document Type UUID' })
  @IsUUID('4')
  @IsNotEmpty()
  documentTypeId: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}
