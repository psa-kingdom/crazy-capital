import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SetFranchisePricingOverrideInput } from '@cc/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class FranchisePricingService {
  private readonly logger = new Logger(FranchisePricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve effective price for a service under a specific franchise (with fallback to global standard catalog)
   */
  async getEffectivePrice(serviceId: string, franchiseId?: string): Promise<{ price: number; isOverride: boolean }> {
    const now = new Date();

    if (franchiseId) {
      const override = await this.prisma.franchisePricingOverride.findFirst({
        where: {
          franchiseId,
          serviceId,
          status: 'ACTIVE',
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
      });

      if (override) {
        return {
          price: Number(override.customPrice),
          isOverride: true,
        };
      }
    }

    // Fallback to standard service pricing
    const standardPricing = await this.prisma.servicePricing.findFirst({
      where: {
        serviceId,
        pricingType: 'STANDARD',
      },
    });

    return {
      price: standardPricing ? Number(standardPricing.amount) : 5000,
      isOverride: false,
    };
  }

  /**
   * Set or update localized pricing override for a franchise
   */
  async setPricingOverride(input: SetFranchisePricingOverrideInput) {
    const override = await this.prisma.franchisePricingOverride.upsert({
      where: {
        franchiseId_serviceId: {
          franchiseId: input.franchiseId,
          serviceId: input.serviceId,
        },
      },
      update: {
        customPrice: new Prisma.Decimal(input.customPrice),
        customMinPrice: input.customMinPrice ? new Prisma.Decimal(input.customMinPrice) : null,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
        status: input.status || 'ACTIVE',
      },
      create: {
        franchiseId: input.franchiseId,
        serviceId: input.serviceId,
        customPrice: new Prisma.Decimal(input.customPrice),
        customMinPrice: input.customMinPrice ? new Prisma.Decimal(input.customMinPrice) : null,
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
        status: input.status || 'ACTIVE',
      },
      include: {
        service: true,
        franchise: true,
      },
    });

    this.logger.log(`Set localized pricing for Franchise '${override.franchise.name}' on Service '${override.service.name}': ₹${input.customPrice}`);
    return {
      id: override.id,
      franchiseId: override.franchiseId,
      serviceId: override.serviceId,
      serviceName: override.service.name,
      customPrice: Number(override.customPrice),
      customMinPrice: override.customMinPrice ? Number(override.customMinPrice) : null,
      status: override.status,
    };
  }

  /**
   * List all localized pricing overrides for a franchise
   */
  async listOverrides(franchiseId: string) {
    const overrides = await this.prisma.franchisePricingOverride.findMany({
      where: { franchiseId },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });

    return overrides.map((o) => ({
      id: o.id,
      franchiseId: o.franchiseId,
      serviceId: o.serviceId,
      serviceName: o.service.name,
      customPrice: Number(o.customPrice),
      customMinPrice: o.customMinPrice ? Number(o.customMinPrice) : null,
      status: o.status,
    }));
  }
}
