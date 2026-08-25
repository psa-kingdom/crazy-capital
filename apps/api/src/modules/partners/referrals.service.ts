import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  ReferralTierLevel,
  ReferralStatus,
  ReferralAttributionDto,
  PartnerReferralTreeDto,
} from '@cc/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  // Multi-tier commission override rates
  private readonly TIER_OVERRIDE_RATES = {
    [ReferralTierLevel.TIER_1_DIRECT]: 10.0, // Direct partner slab rate
    [ReferralTierLevel.TIER_2_PARENT]: 2.5,  // Parent partner override
    [ReferralTierLevel.TIER_3_MASTER]: 1.0,  // Master partner override
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or generate unique referral code & URL slug for Partner
   */
  async getPartnerReferralCode(partnerId: string): Promise<{ referralCode: string; referralUrl: string }> {
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { userId: partnerId },
    });

    if (!profile) {
      throw new NotFoundException(`Partner profile for '${partnerId}' not found`);
    }

    const referralCode = profile.partnerCode;
    const referralUrl = `https://crazycapital.in/?ref=${referralCode}`;

    return { referralCode, referralUrl };
  }

  /**
   * Attribute a lead or customer registration to a referring partner with anti-abuse validation
   */
  async attributeReferral(params: {
    referralCode: string;
    referredUserId?: string;
    leadId?: string;
    organizationId: string;
  }): Promise<ReferralAttributionDto> {
    const { referralCode, referredUserId, leadId, organizationId } = params;

    // 1. Find partner by referral code
    const profile = await this.prisma.partnerProfile.findUnique({
      where: { partnerCode: referralCode },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException(`Invalid referral code '${referralCode}'`);
    }

    const referrerId = profile.userId;

    // 2. Anti-abuse: Self-referral prevention
    if (referredUserId && referredUserId === referrerId) {
      throw new BadRequestException('Self-referral is strictly prohibited');
    }

    // 3. Anti-abuse: Circular referral prevention
    if (referredUserId) {
      const isCircular = await this.checkCircularReferral(referrerId, referredUserId);
      if (isCircular) {
        throw new BadRequestException('Circular referral graph detected and rejected');
      }
    }

    // 4. Duplicate prevention
    if (leadId) {
      const existing = await this.prisma.referralAttribution.findFirst({
        where: { leadId, referrerId },
      });
      if (existing) {
        return this.mapToDto(existing);
      }
    }

    if (referredUserId) {
      const existing = await this.prisma.referralAttribution.findFirst({
        where: { referredUserId, referrerId },
      });
      if (existing) {
        return this.mapToDto(existing);
      }
    }

    const attribution = await this.prisma.referralAttribution.create({
      data: {
        referrerId,
        referredUserId: referredUserId || null,
        leadId: leadId || null,
        referralCode,
        tierLevel: ReferralTierLevel.TIER_1_DIRECT,
        status: ReferralStatus.PENDING,
      },
    });

    this.logger.log(`Referral attributed: Partner '${referrerId}' -> Lead '${leadId || referredUserId}' via Code '${referralCode}'`);
    return this.mapToDto(attribution);
  }

  /**
   * Process multi-tier commission allocation upon application conversion
   */
  async processMultiTierConversion(params: {
    applicationId: string;
    directPartnerId: string;
    baseAmount: number;
    organizationId: string;
  }) {
    const { applicationId, directPartnerId, baseAmount, organizationId } = params;

    // 1. Mark Direct attribution as CONVERTED
    await this.prisma.referralAttribution.updateMany({
      where: {
        applicationId,
        referrerId: directPartnerId,
      },
      data: {
        status: ReferralStatus.CONVERTED,
        convertedAt: new Date(),
      },
    });

    // 2. Increment lifetime stats on PartnerProfile
    await this.prisma.partnerProfile.updateMany({
      where: { userId: directPartnerId },
      data: {
        lifetimeConversions: { increment: 1 },
      },
    });

    // 3. Traverse PartnerReferralTree for Tier 2 Parent and Tier 3 Master overrides
    const tree = await this.prisma.partnerReferralTree.findUnique({
      where: { partnerId: directPartnerId },
    });

    if (!tree) return;

    // Tier 2 Parent override
    if (tree.parentPartnerId && tree.parentPartnerId !== directPartnerId) {
      const parentRate = this.TIER_OVERRIDE_RATES[ReferralTierLevel.TIER_2_PARENT];
      const parentBonus = (baseAmount * parentRate) / 100;

      await this.prisma.referralAttribution.create({
        data: {
          referrerId: tree.parentPartnerId,
          applicationId,
          referralCode: `TIER2-OVERRIDE-${directPartnerId.slice(0, 6)}`,
          tierLevel: ReferralTierLevel.TIER_2_PARENT,
          status: ReferralStatus.CONVERTED,
          commissionRate: new Prisma.Decimal(parentRate),
          commissionEarned: new Prisma.Decimal(parentBonus),
          convertedAt: new Date(),
        },
      });

      this.logger.log(`Tier 2 Override: ₹${parentBonus} (${parentRate}%) credited to Parent Partner '${tree.parentPartnerId}'`);
    }

    // Tier 3 Master override
    if (tree.masterPartnerId && tree.masterPartnerId !== directPartnerId && tree.masterPartnerId !== tree.parentPartnerId) {
      const masterRate = this.TIER_OVERRIDE_RATES[ReferralTierLevel.TIER_3_MASTER];
      const masterBonus = (baseAmount * masterRate) / 100;

      await this.prisma.referralAttribution.create({
        data: {
          referrerId: tree.masterPartnerId,
          applicationId,
          referralCode: `TIER3-OVERRIDE-${directPartnerId.slice(0, 6)}`,
          tierLevel: ReferralTierLevel.TIER_3_MASTER,
          status: ReferralStatus.CONVERTED,
          commissionRate: new Prisma.Decimal(masterRate),
          commissionEarned: new Prisma.Decimal(masterBonus),
          convertedAt: new Date(),
        },
      });

      this.logger.log(`Tier 3 Override: ₹${masterBonus} (${masterRate}%) credited to Master Partner '${tree.masterPartnerId}'`);
    }
  }

  /**
   * Anti-abuse cycle detector: checks if adding targetUserId -> sourceUserId would form a cycle
   */
  async checkCircularReferral(sourcePartnerId: string, targetPartnerId: string): Promise<boolean> {
    if (sourcePartnerId === targetPartnerId) return true;

    let currentId: string | null = sourcePartnerId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) return true;
      visited.add(currentId);

      if (currentId === targetPartnerId) return true;

      const node: { parentPartnerId: string | null } | null = await this.prisma.partnerReferralTree.findUnique({
        where: { partnerId: currentId },
        select: { parentPartnerId: true },
      });

      currentId = node?.parentPartnerId || null;
    }

    return false;
  }

  /**
   * Get referral network tree for Partner Portal
   */
  async getReferralTree(partnerId: string): Promise<{
    directCount: number;
    conversionsCount: number;
    attributions: ReferralAttributionDto[];
    subPartners: any[];
  }> {
    const [attributions, subPartners, conversionsCount] = await Promise.all([
      this.prisma.referralAttribution.findMany({
        where: { referrerId: partnerId },
        orderBy: { attributedAt: 'desc' },
      }),
      this.prisma.partnerReferralTree.findMany({
        where: { parentPartnerId: partnerId },
        include: { partner: { include: { partnerProfile: true } } },
      }),
      this.prisma.referralAttribution.count({
        where: { referrerId: partnerId, status: ReferralStatus.CONVERTED },
      }),
    ]);

    return {
      directCount: attributions.length,
      conversionsCount,
      attributions: attributions.map((a) => this.mapToDto(a)),
      subPartners: subPartners.map((sp) => ({
        partnerId: sp.partnerId,
        name: `${sp.partner.firstName} ${sp.partner.lastName}`,
        email: sp.partner.email,
        tier: sp.partner.partnerProfile?.tier || 'SILVER',
        conversions: sp.partner.partnerProfile?.lifetimeConversions || 0,
      })),
    };
  }

  private mapToDto(a: any): ReferralAttributionDto {
    return {
      id: a.id,
      referrerId: a.referrerId,
      referredUserId: a.referredUserId,
      leadId: a.leadId,
      applicationId: a.applicationId,
      referralCode: a.referralCode,
      tierLevel: a.tierLevel as ReferralTierLevel,
      status: a.status as ReferralStatus,
      commissionRate: a.commissionRate ? Number(a.commissionRate) : null,
      commissionEarned: a.commissionEarned ? Number(a.commissionEarned) : null,
      attributedAt: a.attributedAt,
      convertedAt: a.convertedAt,
    };
  }
}
