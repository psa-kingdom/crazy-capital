import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PartnerTier, CommissionSlabRuleDto, CreateCommissionSlabInput } from '@cc/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommissionSlabsService {
  private readonly logger = new Logger(CommissionSlabsService.name);

  // Default tier baseline percentages if no custom rule exists
  private readonly DEFAULT_TIER_RATES: Record<string, number> = {
    [PartnerTier.SILVER]: 10.0,
    [PartnerTier.GOLD]: 15.0,
    [PartnerTier.PLATINUM]: 20.0,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Determine the authoritative commission rate (%) and flat bonus for a given partner and service
   */
  async getApplicableRate(params: {
    partnerId: string;
    serviceId: string;
    organizationId: string;
  }): Promise<{ rate: number; flatBonus: number; tier: string; ruleId?: string }> {
    const { partnerId, serviceId, organizationId } = params;

    // 1. Fetch partner profile to check tier
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId: partnerId },
    });

    const tier = profile?.tier || PartnerTier.SILVER;

    // 2. Fetch service to check category
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, categoryId: true },
    });

    const now = new Date();

    // 3. Check for specific service-level commission slab rule for this tier
    let slab = await this.prisma.commissionSlabRule.findFirst({
      where: {
        organizationId,
        tier,
        serviceId,
        status: 'ACTIVE',
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Fallback to category-level commission slab rule for this tier
    if (!slab && service?.categoryId) {
      slab = await this.prisma.commissionSlabRule.findFirst({
        where: {
          organizationId,
          tier,
          serviceCategoryId: service.categoryId,
          serviceId: null,
          status: 'ACTIVE',
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 5. Fallback to global tier slab rule
    if (!slab) {
      slab = await this.prisma.commissionSlabRule.findFirst({
        where: {
          organizationId,
          tier,
          serviceCategoryId: null,
          serviceId: null,
          status: 'ACTIVE',
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (slab) {
      return {
        rate: Number(slab.ratePercentage),
        flatBonus: Number(slab.flatBonusAmount),
        tier,
        ruleId: slab.id,
      };
    }

    // 6. Hard default baseline for tier
    const defaultRate = this.DEFAULT_TIER_RATES[tier] || 10.0;
    return {
      rate: defaultRate,
      flatBonus: 0,
      tier,
    };
  }

  /**
   * Create or update a commission slab rule (Admin only)
   */
  async createSlab(organizationId: string, input: CreateCommissionSlabInput): Promise<CommissionSlabRuleDto> {
    const slab = await this.prisma.commissionSlabRule.create({
      data: {
        organizationId,
        tier: input.tier,
        serviceCategoryId: input.serviceCategoryId || null,
        serviceId: input.serviceId || null,
        ratePercentage: new Prisma.Decimal(input.ratePercentage),
        flatBonusAmount: new Prisma.Decimal(input.flatBonusAmount || 0),
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
        notes: input.notes || null,
        status: 'ACTIVE',
      },
      include: {
        service: true,
        serviceCategory: true,
      },
    });

    this.logger.log(`Created Commission Slab '${slab.id}' for Tier ${input.tier}: ${input.ratePercentage}%`);
    return this.mapToDto(slab);
  }

  /**
   * List all commission slabs with filter
   */
  async listSlabs(organizationId: string, tier?: string): Promise<CommissionSlabRuleDto[]> {
    const slabs = await this.prisma.commissionSlabRule.findMany({
      where: {
        organizationId,
        ...(tier ? { tier } : {}),
      },
      include: {
        service: true,
        serviceCategory: true,
      },
      orderBy: [{ tier: 'asc' }, { createdAt: 'desc' }],
    });

    return slabs.map((s) => this.mapToDto(s));
  }

  /**
   * Update or deactivate a slab
   */
  async updateSlab(id: string, organizationId: string, data: Partial<CreateCommissionSlabInput> & { status?: string }) {
    const slab = await this.prisma.commissionSlabRule.findFirst({
      where: { id, organizationId },
    });

    if (!slab) {
      throw new NotFoundException(`Commission slab '${id}' not found`);
    }

    const updated = await this.prisma.commissionSlabRule.update({
      where: { id },
      data: {
        ...(data.tier ? { tier: data.tier } : {}),
        ...(data.ratePercentage !== undefined ? { ratePercentage: new Prisma.Decimal(data.ratePercentage) } : {}),
        ...(data.flatBonusAmount !== undefined ? { flatBonusAmount: new Prisma.Decimal(data.flatBonusAmount) } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: {
        service: true,
        serviceCategory: true,
      },
    });

    return this.mapToDto(updated);
  }

  private mapToDto(slab: any): CommissionSlabRuleDto {
    return {
      id: slab.id,
      organizationId: slab.organizationId,
      tier: slab.tier as PartnerTier,
      serviceCategoryId: slab.serviceCategoryId,
      serviceId: slab.serviceId,
      ratePercentage: Number(slab.ratePercentage),
      flatBonusAmount: Number(slab.flatBonusAmount),
      effectiveFrom: slab.effectiveFrom,
      effectiveTo: slab.effectiveTo,
      status: slab.status,
      notes: slab.notes,
      serviceCategoryName: slab.serviceCategory?.name || null,
      serviceName: slab.service?.name || null,
    };
  }
}
