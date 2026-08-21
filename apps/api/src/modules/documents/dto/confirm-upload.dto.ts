import { IsInt, IsPositive, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiPropertyOptional({ description: 'Confirmed file size in bytes after client upload', example: 1048576 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'SHA-256 integrity checksum calculated on upload',
    example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  })
  @IsString()
  @IsOptional()
  checksumSha256?: string;
}
