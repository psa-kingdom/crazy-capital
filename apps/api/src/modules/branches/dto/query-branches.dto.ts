import { IsString, IsOptional } from 'class-validator';

export class QueryBranchesDto {
  @IsString()
  @IsOptional()
  regionId?: string;

  @IsString()
  @IsOptional()
  branchType?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;
}

export class QueryBranchTargetsDto {
  @IsString()
  @IsOptional()
  targetPeriod?: string;

  @IsString()
  @IsOptional()
  regionId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
