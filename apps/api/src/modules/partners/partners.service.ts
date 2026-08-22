import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommissionsService } from './commissions.service';
import { PayoutsService } from './payouts.service';
import {
  PartnerCaseDto,
  PartnerStatsDto,
  UserRole,
} from '@cc/types';
import { CreatePartnerLeadDto } from './dto/create-partner-lead.dto';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly commissionsService: CommissionsService,
    private readonly payoutsService: PayoutsService,
  ) {}

  /**
   * Partner Referral Submission: Creates a Lead tagged to the referring partner
   */
  async submitPartnerLead(dto: CreatePartnerLeadDto, partnerUser: any) {
    const organizationId = partnerUser.organizationId;
    const partnerId = partnerUser.id;

    // Find or create 'PARTNER_REFERRAL' lead source
    let source = await this.prisma.leadSource.findFirst({
      where: { code: 'PARTNER_REFERRAL' },
    });

    if (!source) {
      source = await this.prisma.leadSource.create({
        data: {
          name: 'Partner Referral Network',
          code: 'PARTNER_REFERRAL',
          isActive: true,
        },
      });
    }

    const lead = await this.prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          organizationId,
          sourceId: source.id,
          partnerId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          mobile: dto.mobile,
          email: dto.email || null,
          companyName: dto.companyName || null,
          notes: dto.notes ? `[Partner Referral Note]: ${dto.notes}` : `Referred by partner ${partnerUser.firstName} ${partnerUser.lastName}`,
          campaign: dto.serviceInterest || 'Partner Network',
          status: 'NEW',
        },
      });

      // Record lead activity
      await tx.leadActivity.create({
        data: {
          leadId: createdLead.id,
          performedById: partnerId,
          activityType: 'NOTE',
          notes: `Referral submitted by Partner ${partnerUser.firstName} ${partnerUser.lastName} (${partnerUser.email}). Interest: ${dto.serviceInterest || 'General Financial Services'}`,
        },
      });

      return createdLead;
    });

    this.logger.log(`Partner '${partnerUser.email}' submitted lead '${dto.firstName} ${dto.lastName}' (${dto.mobile})`);

    // Non-blocking notification to Partner acknowledging referral
    this.notificationsService
      .dispatchMultiChannel(
        'partner.lead_received' as any,
        { email: partnerUser.email, mobile: partnerUser.mobile },
        {
          customerName: `${partnerUser.firstName} ${partnerUser.lastName}`,
          leadName: `${dto.firstName} ${dto.lastName}`,
          serviceName: dto.serviceInterest || 'Financial Services',
        },
        {
          organizationId,
          userId: partnerId,
          idempotencyPrefix: `partner.lead:${lead.id}`,
        },
      )
      .catch((err) => this.logger.warn(`Failed to dispatch partner lead notification: ${err.message}`));

    return {
      success: true,
      message: 'Referral lead submitted successfully',
      data: {
        id: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        mobile: lead.mobile,
        status: lead.status,
        createdAt: lead.createdAt.toISOString(),
      },
    };
  }

  /**
   * Partner Case Tracker: Returns status of referred cases without leaking internal notes
   */
  async getPartnerCases(partnerUser: any, query: any = {}): Promise<PartnerCaseDto[]> {
    const partnerId = partnerUser.id;

    const applications = await this.prisma.application.findMany({
      where: {
        partnerId,
        deletedAt: null,
      },
      include: {
        customer: true,
        service: true,
        workflowInstance: {
          include: {
            currentStage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 50,
    });

    return applications.map((app) => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      serviceName: app.service.name,
      customerName: `${app.customer.firstName} ${app.customer.lastName}`,
      status: app.status,
      currentStage: app.workflowInstance?.currentStage?.name || app.status,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }));
  }

  /**
   * Partner Earnings & Performance Statistics
   */
  async getPartnerStats(partnerUser: any): Promise<PartnerStatsDto> {
    const partnerId = partnerUser.id;

    const [totalLeads, convertedLeads, activeCases, commissions] = await Promise.all([
      this.prisma.lead.count({ where: { partnerId } }),
      this.prisma.lead.count({ where: { partnerId, status: 'CONVERTED' } }),
      this.prisma.application.count({
        where: {
          partnerId,
          status: { in: ['SUBMITTED', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.commission.findMany({
        where: { partnerId },
      }),
    ]);

    let totalCommissionEarned = 0;
    let pendingCommission = 0;
    let approvedCommission = 0;
    let paidCommission = 0;

    for (const c of commissions) {
      const amount = Number(c.amount);
      totalCommissionEarned += amount;
      if (c.status === 'PENDING') pendingCommission += amount;
      else if (c.status === 'APPROVED') approvedCommission += amount;
      else if (c.status === 'PAID') paidCommission += amount;
    }

    return {
      totalLeads,
      convertedLeads,
      activeCases,
      totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
      pendingCommission: Math.round(pendingCommission * 100) / 100,
      approvedCommission: Math.round(approvedCommission * 100) / 100,
      paidCommission: Math.round(paidCommission * 100) / 100,
    };
  }

  /**
   * Partner's Own Commissions
   */
  async getPartnerCommissions(partnerUser: any, query: any) {
    return this.commissionsService.findAll({ ...query, partnerId: partnerUser.id }, partnerUser);
  }

  /**
   * Partner's Own Payouts
   */
  async getPartnerPayouts(partnerUser: any, query: any) {
    return this.payoutsService.findAll({ ...query, partnerId: partnerUser.id }, partnerUser);
  }
}
