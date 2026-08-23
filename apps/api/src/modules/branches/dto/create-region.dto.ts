import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

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
