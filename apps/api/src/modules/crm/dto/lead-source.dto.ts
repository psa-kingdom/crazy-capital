import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeadSourceDto {
  @ApiProperty({ example: 'Google Ads', description: 'Display name of the lead source' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'GOOGLE_ADS', description: 'Unique uppercase code for the lead source' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Whether this lead source is currently active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateLeadSourceDto extends PartialType(CreateLeadSourceDto) {}
