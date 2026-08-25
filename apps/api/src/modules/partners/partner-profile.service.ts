import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PartnerProfileDto,
  UpdatePartnerKycInput,
  PartnerTier,
  PartnerKycStatus,
  PartnerType,
} from '@cc/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class PartnerProfileService {
  private readonly logger = new Logger(PartnerProfileService.name);

  // Tier Promotion Thresholds (Conversions & Lifetime Earnings)
  private readonly TIER_THRESHOLDS = {
    [PartnerTier.PLATINUM]: { minConversions: 50, minEarnings: 100000 },
    [PartnerTier.GOLD]: { minConversions: 15, minEarnings: 25000 },
    [PartnerTier.SILVER]: { minConversions: 0, minEarnings: 0 },
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or automatically initialize partner profile for authenticated Partner User
   */
  async getOrCreateProfile(userId: string, organizationId: string): Promise<PartnerProfileDto> {
    let profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Generate a unique partner code
      const count = await this.prisma.partnerProfile.count();
      const codeNumber = (count + 1).toString().padStart(4, '0');
      const partnerCode = `CC-PTR-${codeNumber}`;

      profile = await this.prisma.partnerProfile.create({
        data: {
          userId,
          partnerCode,
          partnerType: PartnerType.INDIVIDUAL,
          tier: PartnerTier.SILVER,
          kycStatus: PartnerKycStatus.PENDING_KYC,
        },
      });

      this.logger.log(`Initialized Partner Profile for User '${userId}' with Code '${partnerCode}'`);
    }

    return this.mapToDto(profile);
  }

  /**
   * Submit or update KYC information by Partner
   */
  async updateKyc(userId: string, input: UpdatePartnerKycInput): Promise<PartnerProfileDto> {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(`Partner profile for user '${userId}' not found`);
    }

    // Mask sensitive identifiers before saving
    let panMasked = profile.panMasked;
    if (input.pan) {
      panMasked = input.pan.slice(0, 2) + '•••••' + input.pan.slice(-2);
    }

    let aadhaarMasked = profile.aadhaarMasked;
    if (input.aadhaar) {
      aadhaarMasked = '•••• •••• ' + input.aadhaar.substring(8);
    }

    let bankAccountMasked = profile.bankAccountNumberMasked;
    if (input.bankAccountNumber) {
      bankAccountMasked = '••••••••' + input.bankAccountNumber.slice(-4);
    }

    // Update User model's bank details for RazorpayX compatibility
    if (input.bankAccountNumber && input.bankIfsc) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          bankAccountNumber: input.bankAccountNumber,
          bankIfsc: input.bankIfsc,
          bankAccountName: input.bankBeneficiaryName || undefined,
        },
      });
    }

    const updated = await this.prisma.partnerProfile.update({
      where: { userId },
      data: {
        partnerType: input.partnerType || undefined,
        businessName: input.businessName !== undefined ? input.businessName : undefined,
        panMasked,
        gstin: input.gstin !== undefined ? input.gstin : undefined,
        aadhaarMasked,
        bankAccountNumberMasked: bankAccountMasked,
        bankIfsc: input.bankIfsc !== undefined ? input.bankIfsc : undefined,
        bankBeneficiaryName: input.bankBeneficiaryName !== undefined ? input.bankBeneficiaryName : undefined,
        kycStatus: PartnerKycStatus.UNDER_REVIEW,
      },
    });

    this.logger.log(`Partner '${userId}' submitted KYC. Status moved to UNDER_REVIEW.`);
    return this.mapToDto(updated);
  }

  /**
   * Review partner KYC by Admin
   */
  async reviewKyc(
    partnerId: string,
    status: PartnerKycStatus,
    notes?: string,
  ): Promise<PartnerProfileDto> {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId: partnerId },
    });

    if (!profile) {
      throw new NotFoundException(`Partner profile for '${partnerId}' not found`);
    }

    const updated = await this.prisma.partnerProfile.update({
      where: { userId: partnerId },
      data: {
        kycStatus: status,
        onboardingNotes: notes || profile.onboardingNotes,
      },
    });

    this.logger.log(`Admin reviewed KYC for Partner '${partnerId}': ${status}`);
    return this.mapToDto(updated);
  }

  /**
   * Update or recalculate Partner Tier based on milestones
   */
  async recalculateTier(partnerId: string): Promise<{ previousTier: string; newTier: string; upgraded: boolean }> {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId: partnerId },
    });

    if (!profile) {
      throw new NotFoundException(`Partner profile not found`);
    }

    const earnings = Number(profile.lifetimeEarnings);
    const conversions = profile.lifetimeConversions;

    let targetTier: PartnerTier = PartnerTier.SILVER;
    if (
      conversions >= this.TIER_THRESHOLDS[PartnerTier.PLATINUM].minConversions ||
      earnings >= this.TIER_THRESHOLDS[PartnerTier.PLATINUM].minEarnings
    ) {
      targetTier = PartnerTier.PLATINUM;
    } else if (
      conversions >= this.TIER_THRESHOLDS[PartnerTier.GOLD].minConversions ||
      earnings >= this.TIER_THRESHOLDS[PartnerTier.GOLD].minEarnings
    ) {
      targetTier = PartnerTier.GOLD;
    }

    const previousTier = profile.tier;
    const upgraded = targetTier !== previousTier;

    if (upgraded) {
      await this.prisma.partnerProfile.update({
        where: { userId: partnerId },
        data: {
          tier: targetTier,
          tierPromotedAt: new Date(),
        },
      });
      this.logger.log(`Partner '${partnerId}' tier upgraded: ${previousTier} -> ${targetTier}`);
    }

    return { previousTier, newTier: targetTier, upgraded };
  }

  /**
   * Aggregate Partner Earnings Analytics for Partner Portal Dashboard
   */
  async getEarningsAnalytics(partnerId: string) {
    const [commissions, payouts, profile, leadsCount, appsCount] = await Promise.all([
      this.prisma.commission.findMany({
        where: { partnerId },
        include: { service: true, application: { include: { customer: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payout.findMany({
        where: { partnerId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.partnerProfile.findUnique({
        where: { userId: partnerId },
      }),
      this.prisma.lead.count({ where: { partnerId } }),
      this.prisma.application.count({ where: { partnerId } }),
    ]);

    let totalAccrued = 0;
    let pendingApproval = 0;
    let approvedReady = 0;
    let settledPaid = 0;
    let rejected = 0;

    const byService: Record<string, { serviceName: string; count: number; totalEarned: number }> = {};

    for (const c of commissions) {
      const amount = Number(c.amount);
      totalAccrued += amount;

      if (c.status === 'PENDING') pendingApproval += amount;
      else if (c.status === 'APPROVED') approvedReady += amount;
      else if (c.status === 'PAID') settledPaid += amount;
      else if (c.status === 'REJECTED') rejected += amount;

      const sName = c.service?.name || 'Other Service';
      if (!byService[sName]) {
        byService[sName] = { serviceName: sName, count: 0, totalEarned: 0 };
      }
      byService[sName].count += 1;
      byService[sName].totalEarned += amount;
    }

    // Tier Progress calculation
    const currentTier = profile?.tier || PartnerTier.SILVER;
    let nextTier = null;
    let progressPct = 100;
    let conversionsNeeded = 0;
    let earningsNeeded = 0;

    if (currentTier === PartnerTier.SILVER) {
      nextTier = PartnerTier.GOLD;
      const target = this.TIER_THRESHOLDS[PartnerTier.GOLD];
      const conv = profile?.lifetimeConversions || 0;
      const earn = Number(profile?.lifetimeEarnings || 0);
      conversionsNeeded = Math.max(0, target.minConversions - conv);
      earningsNeeded = Math.max(0, target.minEarnings - earn);
      progressPct = Math.min(100, Math.round((conv / target.minConversions) * 100));
    } else if (currentTier === PartnerTier.GOLD) {
      nextTier = PartnerTier.PLATINUM;
      const target = this.TIER_THRESHOLDS[PartnerTier.PLATINUM];
      const conv = profile?.lifetimeConversions || 0;
      const earn = Number(profile?.lifetimeEarnings || 0);
      conversionsNeeded = Math.max(0, target.minConversions - conv);
      earningsNeeded = Math.max(0, target.minEarnings - earn);
      progressPct = Math.min(100, Math.round((conv / target.minConversions) * 100));
    }

    return {
      profile: profile ? this.mapToDto(profile) : null,
      summary: {
        totalAccrued,
        pendingApproval,
        approvedReady,
        settledPaid,
        rejected,
        leadsCount,
        applicationsCount: appsCount,
        conversionsCount: profile?.lifetimeConversions || 0,
      },
      tierProgress: {
        currentTier,
        nextTier,
        progressPct,
        conversionsNeeded,
        earningsNeeded,
      },
      earningsByService: Object.values(byService),
      recentCommissions: commissions.slice(0, 10),
      recentPayouts: payouts.slice(0, 10),
    };
  }

  private mapToDto(profile: any): PartnerProfileDto {
    return {
      id: profile.id,
      userId: profile.userId,
      partnerCode: profile.partnerCode,
      partnerType: profile.partnerType as PartnerType,
      tier: profile.tier as PartnerTier,
      kycStatus: profile.kycStatus as PartnerKycStatus,
      businessName: profile.businessName,
      panMasked: profile.panMasked,
      gstin: profile.gstin,
      aadhaarMasked: profile.aadhaarMasked,
      digilockerVerifiedAt: profile.digilockerVerifiedAt,
      lifetimeEarnings: Number(profile.lifetimeEarnings),
      lifetimeConversions: profile.lifetimeConversions,
      bankAccountNumberMasked: profile.bankAccountNumberMasked,
      bankIfsc: profile.bankIfsc,
      bankBeneficiaryName: profile.bankBeneficiaryName,
      onboardingNotes: profile.onboardingNotes,
      tierPromotedAt: profile.tierPromotedAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
