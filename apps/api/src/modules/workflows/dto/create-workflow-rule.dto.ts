import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject } from 'class-validator';
import { WorkflowRuleType } from '@cc/types';

export class CreateWorkflowRuleDto {
  @ApiProperty({ enum: WorkflowRuleType, example: WorkflowRuleType.DOCUMENT_GATE })
  @IsEnum(WorkflowRuleType)
  @IsNotEmpty()
  ruleType: WorkflowRuleType;

  @ApiProperty({
    example: {
      requireAllVerified: true,
      mandatoryDocumentTypeIds: ['uuid-1', 'uuid-2'],
    },
  })
  @IsObject()
  @IsNotEmpty()
  ruleConfig: Record<string, any>;
}
