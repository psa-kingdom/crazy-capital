import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Customer status (ACTIVE, INACTIVE, SUSPENDED)' })
  @IsOptional()
  @IsString()
  status?: string;
}
