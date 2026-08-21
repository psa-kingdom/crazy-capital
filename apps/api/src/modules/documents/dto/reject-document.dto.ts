import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectDocumentDto {
  @ApiProperty({
    description: 'Structured rejection reason displayed to the customer for re-upload guidance',
    example: 'Blurry scan. Please re-upload a clear high-resolution color copy of the PAN Card.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Rejection reason must be at least 3 characters long' })
  rejectionReason!: string;
}
