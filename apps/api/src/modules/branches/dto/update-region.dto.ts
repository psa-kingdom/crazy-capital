import { IsString, IsOptional } from 'class-validator';

export class UpdateRegionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  regionalManagerId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
