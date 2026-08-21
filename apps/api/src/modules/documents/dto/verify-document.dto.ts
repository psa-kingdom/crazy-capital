import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyDocumentDto {
  @ApiPropertyOptional({
    description: 'Verification notes or remarks from operations/compliance executive',
    example: 'Aadhaar details verified against MCA database record',
  })
  @IsString()
  @IsOptional()
  remarks?: string;
}
