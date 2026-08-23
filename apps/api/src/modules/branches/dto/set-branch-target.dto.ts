import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class SetBranchTargetDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsString()
  @IsNotEmpty()
  targetPeriod!: string; // e.g. "2026-08", "2026-Q3"

  @IsString()
  @IsOptional()
  periodType?: string; // MONTHLY, QUARTERLY, ANNUAL

  @IsNumber()
  @Min(0)
  revenueTarget!: number;

  @IsNumber()
  @Min(0)
  caseTarget!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  leadTarget?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
