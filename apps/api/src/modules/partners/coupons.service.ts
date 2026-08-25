import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CouponDto,
  CreateCouponInput,
  ValidateCouponInput,
  DiscountType,
  CouponStatus,
} from '@cc/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new promotional coupon
   */
  async createCoupon(input: CreateCouponInput): Promise<CouponDto> {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: input.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException(`Coupon code '${input.code}' already exists`);
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code: input.code.toUpperCase(),
        description: input.description || null,
        discountType: input.discountType || DiscountType.PERCENTAGE,
        discountValue: new Prisma.Decimal(input.discountValue),
        maxDiscountAmount: input.maxDiscountAmount ? new Prisma.Decimal(input.maxDiscountAmount) : null,
        minOrderAmount: input.minOrderAmount ? new Prisma.Decimal(input.minOrderAmount) : null,
        validFrom: input.validFrom ? new Date(input.validFrom) : new Date(),
        validTo: input.validTo ? new Date(input.validTo) : null,
        maxTotalUsage: input.maxTotalUsage || null,
        maxUsagePerCustomer: input.maxUsagePerCustomer || 1,
        applicableServiceIds: input.applicableServiceIds || [],
        applicableFranchiseIds: input.applicableFranchiseIds || [],
        partnerId: input.partnerId || null,
        status: CouponStatus.ACTIVE,
      },
    });

    this.logger.log(`Created Coupon '${coupon.code}' (${coupon.discountType}: ${input.discountValue})`);
    return this.mapToDto(coupon);
  }

  /**
   * Validate coupon code against a purchase/application
   */
  async validateCoupon(input: ValidateCouponInput): Promise<{
    valid: boolean;
    discountAmount: number;
    finalAmount: number;
    coupon: CouponDto;
    reason?: string;
  }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: input.code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException(`Invalid coupon code '${input.code}'`);
    }

    const now = new Date();

    // 1. Status and validity period check
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException(`Coupon '${coupon.code}' is inactive or disabled`);
    }

    if (coupon.validFrom && now < coupon.validFrom) {
      throw new BadRequestException(`Coupon '${coupon.code}' is not active yet`);
    }

    if (coupon.validTo && now > coupon.validTo) {
      throw new BadRequestException(`Coupon '${coupon.code}' has expired`);
    }

    // 2. Total usage limit check
    if (coupon.maxTotalUsage && coupon.currentUsageCount >= coupon.maxTotalUsage) {
      throw new BadRequestException(`Coupon '${coupon.code}' total usage limit reached`);
    }

    // 3. Customer usage limit check
    const customerUsage = await this.prisma.couponRedemption.count({
      where: { couponId: coupon.id, customerId: input.customerId },
    });

    if (customerUsage >= coupon.maxUsagePerCustomer) {
      throw new BadRequestException(`You have already used coupon '${coupon.code}' the maximum allowed number of times`);
    }

    // 4. Minimum order amount check
    if (coupon.minOrderAmount && input.orderAmount < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount of ₹${coupon.minOrderAmount} required for coupon '${coupon.code}'`);
    }

    // 5. Service applicability check
    if (coupon.applicableServiceIds.length > 0 && !coupon.applicableServiceIds.includes(input.serviceId)) {
      throw new BadRequestException(`Coupon '${coupon.code}' is not applicable to the selected service`);
    }

    // 6. Franchise applicability check
    if (
      coupon.applicableFranchiseIds.length > 0 &&
      input.franchiseId &&
      !coupon.applicableFranchiseIds.includes(input.franchiseId)
    ) {
      throw new BadRequestException(`Coupon '${coupon.code}' is not valid for this franchise location`);
    }

    // 7. Calculate discount amount
    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (input.orderAmount * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, Number(coupon.maxDiscountAmount));
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    discount = Math.min(discount, input.orderAmount);
    const finalAmount = Math.max(0, input.orderAmount - discount);

    return {
      valid: true,
      discountAmount: Math.round(discount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      coupon: this.mapToDto(coupon),
    };
  }

  /**
   * Redeem coupon upon successful transaction/invoice
   */
  async redeemCoupon(params: {
    couponCode: string;
    customerId: string;
    applicationId?: string;
    discountApplied: number;
  }) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: params.couponCode.toUpperCase() },
    });

    if (!coupon) return;

    await this.prisma.$transaction([
      this.prisma.couponRedemption.create({
        data: {
          couponId: coupon.id,
          customerId: params.customerId,
          applicationId: params.applicationId || null,
          discountApplied: new Prisma.Decimal(params.discountApplied),
        },
      }),
      this.prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          currentUsageCount: { increment: 1 },
        },
      }),
    ]);

    this.logger.log(`Redeemed Coupon '${coupon.code}' for Customer '${params.customerId}'. Discount: ₹${params.discountApplied}`);
  }

  /**
   * List coupons
   */
  async listCoupons(partnerId?: string): Promise<CouponDto[]> {
    const coupons = await this.prisma.coupon.findMany({
      where: partnerId ? { partnerId } : {},
      orderBy: { createdAt: 'desc' },
    });

    return coupons.map((c) => this.mapToDto(c));
  }

  private mapToDto(c: any): CouponDto {
    return {
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType as DiscountType,
      discountValue: Number(c.discountValue),
      maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount) : null,
      minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
      validFrom: c.validFrom,
      validTo: c.validTo,
      maxTotalUsage: c.maxTotalUsage,
      maxUsagePerCustomer: c.maxUsagePerCustomer,
      currentUsageCount: c.currentUsageCount,
      applicableServiceIds: c.applicableServiceIds,
      applicableFranchiseIds: c.applicableFranchiseIds,
      partnerId: c.partnerId,
      status: c.status as CouponStatus,
      createdAt: c.createdAt,
    };
  }
}
