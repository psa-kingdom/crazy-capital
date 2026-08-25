import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  IncentiveRuleDto,
  CreateIncentiveRuleInput,
} from '@cc/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class IncentivesService {
  private readonly logger = new Logger(IncentivesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an incentive / milestone bonus rule (Admin only)
   */
  async createIncentiveRule(organizationId: string, input: CreateIncentiveRuleInput): Promise<IncentiveRuleDto> {
    const rule = await this.prisma.incentiveRule.create({
      data: {
        organizationId,
        name: input.name,
        targetType: input.targetType || 'CONVERSIONS_COUNT',
        thresholdValue: new Prisma.Decimal(input.thresholdValue),
        bonusAmount: new Prisma.Decimal(input.bonusAmount),
        period: input.period || 'MONTHLY',
        applicableTier: input.applicableTier || 'ALL',
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
        status: 'ACTIVE',
      },
    });

    this.logger.log(`Created Incentive Rule '${rule.name}' with Bonus ₹${input.bonusAmount}`);
    return this.mapToDto(rule);
  }

  /**
   * List all incentive rules
   */
  async listIncentiveRules(organizationId: string): Promise<IncentiveRuleDto[]> {
    const rules = await this.prisma.incentiveRule.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return rules.map((r) => this.mapToDto(r));
  }

  private mapToDto(r: any): IncentiveRuleDto {
    return {
      id: r.id,
      organizationId: r.organizationId,
      name: r.name,
      targetType: r.targetType,
      thresholdValue: Number(r.thresholdValue),
      bonusAmount: Number(r.bonusAmount),
      period: r.period,
      applicableTier: r.applicableTier,
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo,
      status: r.status,
    };
  }
}
