import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  LeadScoreGrade,
  LeadScoreFactor,
  LeadScoreRecordDto,
  PriorityQueueItemDto,
} from '@cc/types';

@Injectable()
export class LeadScoringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Service estimated deal values and ticket weightings
   */
  private readonly SERVICE_DEAL_VALUES: Record<string, { value: number; weight: number }> = {
    'pvt-ltd-incorporation': { value: 9999, weight: 25 },
    'corporate-tax-filing': { value: 14999, weight: 25 },
    'section-8-company': { value: 18999, weight: 25 },
    'business-loans': { value: 24999, weight: 25 },
    'trademark-registration': { value: 7499, weight: 22 },
    'llp-registration': { value: 6999, weight: 20 },
    'opc-registration': { value: 5999, weight: 18 },
    'copyright-patent': { value: 12999, weight: 22 },
    'startup-india-dpiit': { value: 8999, weight: 20 },
    'gst-registration': { value: 2499, weight: 15 },
    'gst-return-filing': { value: 4999, weight: 16 },
    'roc-annual-compliance': { value: 9999, weight: 22 },
    'fssai-food-license': { value: 3999, weight: 14 },
    'msme-udyam-registration': { value: 1499, weight: 10 },
  };

  /**
   * Calculate Explainable AI Lead Score
   */
  async calculateScore(leadId: string): Promise<LeadScoreRecordDto> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        source: true,
        activities: true,
        partner: true,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    const factors: LeadScoreFactor[] = [];
    let totalScore = 0;

    // 1. Source Quality Factor (Max 25 pts)
    const sourceCode = (lead.source?.code || lead.utmSource || 'WEBSITE').toUpperCase();
    let sourceScore = 10;
    let sourceExpl = 'Standard channel';

    if (['WEBSITE', 'INBOUND_SEARCH', 'DIRECT'].includes(sourceCode)) {
      sourceScore = 24;
      sourceExpl = 'High-intent direct website inquiry';
    } else if (['REFERRAL', 'PARTNER'].includes(sourceCode) || lead.partnerId) {
      sourceScore = 25;
      sourceExpl = 'Direct verified partner / channel referral';
    } else if (['GOOGLE_ADS', 'META_CAMPAIGN', 'LINKEDIN'].includes(sourceCode)) {
      sourceScore = 18;
      sourceExpl = 'Targeted search/social ad inquiry';
    } else if (['COLD_OUTREACH', 'BULK_IMPORT'].includes(sourceCode)) {
      sourceScore = 5;
      sourceExpl = 'Cold outbound lead';
    }

    factors.push({
      factor: 'Source Intent & Quality',
      weight: 25,
      contribution: sourceScore,
      explanation: sourceExpl,
    });
    totalScore += sourceScore;

    // 2. Service Ticket Size & Category Factor (Max 25 pts)
    const serviceSlug = (lead.serviceInterest || '').toLowerCase().replace(/\s+/g, '-');
    const serviceMeta = this.SERVICE_DEAL_VALUES[serviceSlug] || { value: 5000, weight: 15 };
    const serviceScore = serviceMeta.weight;

    factors.push({
      factor: 'Service Value & Margin Potential',
      weight: 25,
      contribution: serviceScore,
      explanation: `Target Service: ${lead.serviceInterest || 'General Inquiry'} (Est. Deal: ₹${serviceMeta.value.toLocaleString('en-IN')})`,
    });
    totalScore += serviceScore;

    // 3. Contact & Profile Completeness Factor (Max 20 pts)
    let completenessScore = 0;
    const completenessExpl: string[] = [];

    if (lead.email && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].some(d => lead.email?.endsWith(`@${d}`))) {
      completenessScore += 8;
      completenessExpl.push('Corporate Domain Email');
    } else if (lead.email) {
      completenessScore += 4;
      completenessExpl.push('Personal Email');
    }

    if (lead.companyName && lead.companyName.trim().length > 2) {
      completenessScore += 6;
      completenessExpl.push('Company Name Provided');
    }

    if (lead.mobile && /^[6-9]\d{9}$/.test(lead.mobile.replace(/\D/g, '').slice(-10))) {
      completenessScore += 6;
      completenessExpl.push('Valid Indian Mobile');
    }

    factors.push({
      factor: 'Data Completeness & Profile Quality',
      weight: 20,
      contribution: completenessScore,
      explanation: completenessExpl.join(', ') || 'Minimal contact details',
    });
    totalScore += completenessScore;

    // 4. Engagement Velocity & Recency Factor (Max 20 pts)
    const now = new Date().getTime();
    const createdTime = new Date(lead.createdAt).getTime();
    const hoursSinceCreation = Math.max(0, (now - createdTime) / (1000 * 60 * 60));

    let velocityScore = 5;
    let velocityExpl = 'Created > 72 hours ago';

    if (hoursSinceCreation <= 2) {
      velocityScore = 20;
      velocityExpl = 'Fresh lead (< 2 hours old, peak conversion window)';
    } else if (hoursSinceCreation <= 24) {
      velocityScore = 15;
      velocityExpl = 'Recent lead (< 24 hours old)';
    } else if (hoursSinceCreation <= 72) {
      velocityScore = 10;
      velocityExpl = 'Moderate recency (24-72 hours)';
    }

    // Engagement activities boost
    const activityCount = lead.activities?.length || 0;
    if (activityCount > 2) {
      velocityScore = Math.min(20, velocityScore + 3);
      velocityExpl += ` with ${activityCount} interactions`;
    }

    factors.push({
      factor: 'Engagement Velocity & Recency',
      weight: 20,
      contribution: velocityScore,
      explanation: velocityExpl,
    });
    totalScore += velocityScore;

    // 5. Channel & Partner Trust Factor (Max 10 pts)
    let partnerScore = 0;
    let partnerExpl = 'Direct inquiry';

    if (lead.partnerId) {
      partnerScore = 10;
      partnerExpl = 'Active Verified Partner Network Referral';
    } else if (lead.utmCampaign || lead.campaign) {
      partnerScore = 6;
      partnerExpl = `Attributed to campaign "${lead.utmCampaign || lead.campaign}"`;
    } else {
      partnerScore = 3;
    }

    factors.push({
      factor: 'Channel Trust & Attribution',
      weight: 10,
      contribution: partnerScore,
      explanation: partnerExpl,
    });
    totalScore += partnerScore;

    // Normalize final score between 1 and 100
    const finalScore = Math.min(100, Math.max(5, totalScore));

    // Determine Grade, Probability, and Recommendation
    let grade: LeadScoreGrade = LeadScoreGrade.C_COLD;
    let conversionProbability = 0.35;
    let recommendedAction = 'Standard email follow-up';

    if (finalScore >= 80) {
      grade = LeadScoreGrade.A_HOT;
      conversionProbability = 0.85;
      recommendedAction = `⚡ Instant Priority Call: Connect within 15 mins. Client has high intent for ${lead.serviceInterest || 'premium service'}.`;
    } else if (finalScore >= 60) {
      grade = LeadScoreGrade.B_WARM;
      conversionProbability = 0.60;
      recommendedAction = `📞 WhatsApp & Phone Follow-up: Share ${lead.serviceInterest || 'service'} proposal & statutory checklist today.`;
    } else if (finalScore >= 40) {
      grade = LeadScoreGrade.C_COLD;
      conversionProbability = 0.30;
      recommendedAction = '📧 Automated Drip: Nurture with case studies and compliance guides.';
    } else {
      grade = LeadScoreGrade.D_UNQUALIFIED;
      conversionProbability = 0.10;
      recommendedAction = '🔍 Verification Needed: Incomplete contact information, send SMS OTP or basic qualification query.';
    }

    // Upsert into lead_score_records
    const record = await this.prisma.leadScoreRecord.create({
      data: {
        organizationId: lead.organizationId,
        leadId: lead.id,
        score: finalScore,
        grade,
        predictedDealValue: serviceMeta.value,
        conversionProbability,
        scoreFactorsJson: factors as any,
        recommendedAction,
      },
    });

    // Update lead table cached score
    await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        leadScore: finalScore,
      },
    });

    return {
      id: record.id,
      organizationId: record.organizationId,
      leadId: record.leadId,
      score: record.score,
      grade: record.grade,
      predictedDealValue: Number(record.predictedDealValue),
      conversionProbability: Number(record.conversionProbability),
      scoreFactors: factors,
      recommendedAction: record.recommendedAction,
      calculatedAt: record.calculatedAt,
    };
  }

  /**
   * Get Priority Sales & Operations Queue
   */
  async getPriorityQueue(
    query: { minScore?: number; grade?: string; priorityRank?: string; limit?: number; offset?: number },
    currentUser?: { organizationId: string; branchId?: string | null },
  ): Promise<{ items: PriorityQueueItemDto[]; total: number; highPriorityCount: number }> {
    const orgId = currentUser?.organizationId;
    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const whereClause: any = {
      deletedAt: null,
      status: { notIn: ['CONVERTED', 'LOST'] },
    };

    if (orgId) {
      whereClause.organizationId = orgId;
    }

    if (currentUser?.branchId) {
      whereClause.branchId = currentUser.branchId;
    }

    if (query.minScore) {
      whereClause.leadScore = { gte: Number(query.minScore) };
    }

    const [leads, total, hotCount] = await Promise.all([
      this.prisma.lead.findMany({
        where: whereClause,
        include: {
          source: true,
          assignedTo: true,
          scoreRecords: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: [{ leadScore: 'desc' }, { createdAt: 'desc' }],
        skip: offset,
        take: limit,
      }),
      this.prisma.lead.count({ where: whereClause }),
      this.prisma.lead.count({
        where: {
          ...whereClause,
          leadScore: { gte: 80 },
        },
      }),
    ]);

    const items: PriorityQueueItemDto[] = leads.map((l) => {
      const latestScore = l.scoreRecords[0];
      const score = latestScore?.score ?? l.leadScore ?? 50;
      const grade = (latestScore?.grade as LeadScoreGrade) || (score >= 80 ? LeadScoreGrade.A_HOT : score >= 60 ? LeadScoreGrade.B_WARM : LeadScoreGrade.C_COLD);
      const conversionProbability = latestScore?.conversionProbability ? Number(latestScore.conversionProbability) : score / 100;
      const serviceSlug = (l.serviceInterest || '').toLowerCase().replace(/\s+/g, '-');
      const dealVal = latestScore?.predictedDealValue ? Number(latestScore.predictedDealValue) : (this.SERVICE_DEAL_VALUES[serviceSlug]?.value || 5000);

      let priorityRank: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
      if (score >= 80) priorityRank = 'URGENT';
      else if (score >= 60) priorityRank = 'HIGH';
      else if (score < 40) priorityRank = 'LOW';

      const hoursInStatus = Math.max(0, (Date.now() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60));

      return {
        leadId: l.id,
        firstName: l.firstName,
        lastName: l.lastName,
        email: l.email,
        mobile: l.mobile,
        companyName: l.companyName,
        serviceInterest: l.serviceInterest,
        status: l.status,
        score,
        grade,
        conversionProbability: Math.round(conversionProbability * 100) / 100,
        predictedDealValue: dealVal,
        recommendedAction: latestScore?.recommendedAction || (score >= 80 ? 'Instant call required' : 'Follow up with proposal'),
        priorityRank,
        sourceName: l.source?.name || l.utmSource || 'Website',
        assignedToName: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : 'Unassigned',
        timeInCurrentStatusHours: Math.round(hoursInStatus * 10) / 10,
        createdAt: l.createdAt,
      };
    });

    return {
      items,
      total,
      highPriorityCount: hotCount,
    };
  }

  /**
   * Get latest score breakdown for a lead
   */
  async getScoreBreakdown(leadId: string): Promise<LeadScoreRecordDto> {
    const latest = await this.prisma.leadScoreRecord.findFirst({
      where: { leadId },
      orderBy: { calculatedAt: 'desc' },
    });

    if (!latest) {
      // Calculate on-the-fly
      return this.calculateScore(leadId);
    }

    return {
      id: latest.id,
      organizationId: latest.organizationId,
      leadId: latest.leadId,
      score: latest.score,
      grade: latest.grade,
      predictedDealValue: latest.predictedDealValue ? Number(latest.predictedDealValue) : undefined,
      conversionProbability: latest.conversionProbability ? Number(latest.conversionProbability) : undefined,
      scoreFactors: (latest.scoreFactorsJson as any) || [],
      recommendedAction: latest.recommendedAction,
      calculatedAt: latest.calculatedAt,
    };
  }
}
