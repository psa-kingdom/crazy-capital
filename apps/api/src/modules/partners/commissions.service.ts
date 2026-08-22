import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommissionStatus, UserRole, CommissionDto } from '@cc/types';
import { Prisma } from '@prisma/client';
import { ApproveCommissionDto } from './dto/approve-commission.dto';
import { RejectCommissionDto } from './dto/reject-commission.dto';
import { QueryCommissionsDto } from './dto/query-commissions.dto';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Calculate and accrue partner commission for a referred service application
   */
  async calculateCommission(params: {
    applicationId: string;
    serviceId: string;
    partnerId: string;
    baseAmount: number;
    organizationId: string;
  }): Promise<CommissionDto> {
    const { applicationId, serviceId, partnerId, baseAmount, organizationId } = params;

    // Check if commission already exists for this application
    const existing = await this.prisma.commission.findFirst({
      where: { applicationId, partnerId },
    });

    if (existing) {
      this.logger.log(`Commission already calculated for application '${applicationId}' (ID: ${existing.id})`);
      return this.mapToDto(existing);
    }

    // Determine partner commission rate from ServicePricing or default standard 10%
    const partnerPricing = await this.prisma.servicePricing.findFirst({
      where: {
        serviceId,
        pricingType: 'PARTNER',
      },
    });

    let rate = 10.0; // Default 10% partner referral commission
    let commissionAmount = (baseAmount * rate) / 100;

    if (partnerPricing) {
      const partnerBase = Number(partnerPricing.amount);
      if (partnerBase > 0 && partnerBase < baseAmount) {
        // Flat markup margin model
        commissionAmount = baseAmount - partnerBase;
        rate = Math.round(((commissionAmount / baseAmount) * 100) * 100) / 100;
      }
    }

    const commission = await this.prisma.commission.create({
      data: {
        applicationId,
        serviceId,
        partnerId,
        baseAmount: new Prisma.Decimal(baseAmount),
        rate: new Prisma.Decimal(rate),
        amount: new Prisma.Decimal(commissionAmount),
        status: 'PENDING',
      },
      include: {
        application: {
          include: {
            customer: true,
          },
        },
        service: true,
        partner: true,
      },
    });

    this.logger.log(
      `Accrued Commission: ₹${commissionAmount} (${rate}%) for Partner '${commission.partner?.email}' on App '${commission.application?.applicationNumber}'`,
    );

    // Non-blocking notification dispatch
    this.notificationsService
      .dispatchMultiChannel(
        'commission.created' as any,
        { email: commission.partner?.email, mobile: commission.partner?.mobile },
        {
          customerName: commission.partner ? `${commission.partner.firstName} ${commission.partner.lastName}` : 'Valued Partner',
          appNumber: commission.application?.applicationNumber,
          serviceName: commission.service?.name,
          commissionAmount,
        },
        {
          organizationId,
          userId: partnerId,
          idempotencyPrefix: `comm.created:${commission.id}`,
        },
      )
      .catch((err) => this.logger.warn(`Failed to dispatch commission notification: ${err.message}`));

    return this.mapToDto(commission);
  }

  /**
   * List and filter commissions with multi-tenant & role isolation
   */
  async findAll(query: QueryCommissionsDto, user: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based scoping: Partners only see their own commissions
    const isPartnerOnly = user.roles?.includes(UserRole.PARTNER) && !user.roles?.includes(UserRole.ADMIN) && !user.roles?.includes(UserRole.SUPER_ADMIN);
    if (isPartnerOnly) {
      where.partnerId = user.id;
    } else if (query.partnerId) {
      where.partnerId = query.partnerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.serviceId) {
      where.serviceId = query.serviceId;
    }

    if (query.search) {
      where.OR = [
        { application: { applicationNumber: { contains: query.search, mode: 'insensitive' } } },
        { partner: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { partner: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { partner: { email: { contains: query.search, mode: 'insensitive' } } },
        { service: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, commissions] = await Promise.all([
      this.prisma.commission.count({ where }),
      this.prisma.commission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          application: {
            include: {
              customer: true,
            },
          },
          service: true,
          partner: true,
          approvedBy: true,
          payouts: true,
        },
      }),
    ]);

    return {
      data: commissions.map((c) => this.mapToDto(c)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find single commission record by ID
   */
  async findOne(id: string, user: any) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            customer: true,
          },
        },
        service: true,
        partner: true,
        approvedBy: true,
        payouts: true,
      },
    });

    if (!commission) {
      throw new NotFoundException(`Commission record '${id}' not found`);
    }

    // Role-based check: partner can only view their own
    const isPartnerOnly = user.roles?.includes(UserRole.PARTNER) && !user.roles?.includes(UserRole.ADMIN) && !user.roles?.includes(UserRole.SUPER_ADMIN);
    if (isPartnerOnly && commission.partnerId !== user.id) {
      throw new NotFoundException(`Commission record '${id}' not found`);
    }

    return this.mapToDto(commission);
  }

  /**
   * ADR-011: Admin-only approval of partner commission
   * Branch Managers and Employees receive 403 Forbidden
   */
  async approveCommission(id: string, dto: ApproveCommissionDto, user: any): Promise<CommissionDto> {
    // 1. ADR-011 Strict Role Enforcement
    const isAdmin = user.roles?.includes(UserRole.ADMIN) || user.roles?.includes(UserRole.SUPER_ADMIN);
    if (!isAdmin) {
      this.logger.warn(`Unauthorized commission approval attempt by user ${user.id} (${user.roles})`);
      throw new ForbiddenException(
        'Commission approval is Admin-only. Branch Managers and Employees cannot approve commissions (ADR-011).',
      );
    }

    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: {
        partner: true,
        application: true,
        service: true,
      },
    });

    if (!commission) {
      throw new NotFoundException(`Commission record '${id}' not found`);
    }

    if (commission.status === 'APPROVED' || commission.status === 'PAID') {
      throw new BadRequestException(`Commission is already ${commission.status}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.commission.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: user.id,
          approvedAt: new Date(),
          rejectionReason: null,
        },
        include: {
          application: {
            include: {
              customer: true,
            },
          },
          service: true,
          partner: true,
          approvedBy: true,
          payouts: true,
        },
      });

      // Create initial PENDING_PAYOUT record
      await tx.payout.create({
        data: {
          commissionId: id,
          partnerId: commission.partnerId,
          amount: commission.amount,
          status: 'PENDING_PAYOUT',
          notes: dto.notes || 'Commission approved and queued for payout disbursement',
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId || null,
          userId: user.id,
          action: 'commission.approve',
          entityType: 'Commission',
          entityId: id,
          newValues: {
            amount: Number(commission.amount),
            approvedById: user.id,
            partnerId: commission.partnerId,
            notes: dto.notes,
          },
        },
      });

      return updated;
    });

    this.logger.log(`✅ Commission '${id}' approved by Admin '${user.email}' (Amount: ₹${result.amount})`);

    // Non-blocking notification dispatch to Partner
    this.notificationsService
      .dispatchMultiChannel(
        'commission.approved' as any,
        { email: result.partner?.email, mobile: result.partner?.mobile },
        {
          customerName: result.partner ? `${result.partner.firstName} ${result.partner.lastName}` : 'Valued Partner',
          appNumber: result.application?.applicationNumber,
          commissionAmount: Number(result.amount),
        },
        {
          organizationId: user.organizationId,
          userId: result.partnerId,
          idempotencyPrefix: `comm.approved:${result.id}`,
        },
      )
      .catch((err) => this.logger.warn(`Failed to dispatch commission approval notification: ${err.message}`));

    return this.mapToDto(result);
  }

  /**
   * ADR-011: Admin-only rejection of partner commission with structured reason
   */
  async rejectCommission(id: string, dto: RejectCommissionDto, user: any): Promise<CommissionDto> {
    // 1. ADR-011 Strict Role Enforcement
    const isAdmin = user.roles?.includes(UserRole.ADMIN) || user.roles?.includes(UserRole.SUPER_ADMIN);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Commission rejection is Admin-only. Branch Managers and Employees cannot reject commissions (ADR-011).',
      );
    }

    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: {
        partner: true,
        application: true,
      },
    });

    if (!commission) {
      throw new NotFoundException(`Commission record '${id}' not found`);
    }

    if (commission.status === 'PAID') {
      throw new BadRequestException('Cannot reject a commission that has already been PAID');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.commission.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: dto.reason,
          approvedById: user.id,
          approvedAt: new Date(),
        },
        include: {
          application: {
            include: {
              customer: true,
            },
          },
          service: true,
          partner: true,
          approvedBy: true,
          payouts: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId || null,
          userId: user.id,
          action: 'commission.reject',
          entityType: 'Commission',
          entityId: id,
          newValues: {
            reason: dto.reason,
            rejectedById: user.id,
          },
        },
      });

      return res;
    });

    this.logger.log(`Commission '${id}' REJECTED by Admin '${user.email}'. Reason: ${dto.reason}`);

    // Non-blocking notification dispatch
    this.notificationsService
      .dispatchMultiChannel(
        'commission.rejected' as any,
        { email: updated.partner?.email, mobile: updated.partner?.mobile },
        {
          customerName: updated.partner ? `${updated.partner.firstName} ${updated.partner.lastName}` : 'Valued Partner',
          appNumber: updated.application?.applicationNumber,
          reason: dto.reason,
        },
        {
          organizationId: user.organizationId,
          userId: updated.partnerId,
          idempotencyPrefix: `comm.rejected:${updated.id}`,
        },
      )
      .catch((err) => this.logger.warn(`Failed to dispatch commission rejection notification: ${err.message}`));

    return this.mapToDto(updated);
  }

  private mapToDto(c: any): CommissionDto {
    return {
      id: c.id,
      applicationId: c.applicationId,
      serviceId: c.serviceId,
      partnerId: c.partnerId,
      baseAmount: Number(c.baseAmount),
      rate: Number(c.rate),
      amount: Number(c.amount),
      status: c.status as CommissionStatus,
      approvedById: c.approvedById,
      approvedAt: c.approvedAt ? c.approvedAt.toISOString() : null,
      rejectionReason: c.rejectionReason,
      createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt.toISOString() : new Date(c.createdAt).toISOString()) : new Date().toISOString(),
      application: c.application
        ? {
            id: c.application.id,
            applicationNumber: c.application.applicationNumber,
            status: c.application.status,
            customer: c.application.customer
              ? {
                  id: c.application.customer.id,
                  fullName: `${c.application.customer.firstName} ${c.application.customer.lastName}`,
                  email: c.application.customer.email,
                  mobile: c.application.customer.mobile,
                }
              : null,
          }
        : null,
      service: c.service
        ? {
            id: c.service.id,
            name: c.service.name,
            code: c.service.slug,
            basePrice: c.service.pricing?.[0] ? Number(c.service.pricing[0].amount) : undefined,
          }
        : null,
      partner: c.partner
        ? {
            id: c.partner.id,
            firstName: c.partner.firstName,
            lastName: c.partner.lastName,
            email: c.partner.email,
            mobile: c.partner.mobile,
          }
        : null,
      approvedBy: c.approvedBy
        ? {
            id: c.approvedBy.id,
            firstName: c.approvedBy.firstName,
            lastName: c.approvedBy.lastName,
            email: c.approvedBy.email,
          }
        : null,
      payouts: c.payouts
        ? c.payouts.map((p: any) => ({
            id: p.id,
            commissionId: p.commissionId,
            partnerId: p.partnerId,
            amount: Number(p.amount),
            paymentMethod: p.paymentMethod,
            status: p.status,
            referenceNumber: p.referenceNumber,
            paidAt: p.paidAt ? p.paidAt.toISOString() : null,
            notes: p.notes,
            createdAt: p.createdAt.toISOString(),
          }))
        : [],
    };
  }
}
