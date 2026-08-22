import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PayoutStatus, UserRole, PayoutDto } from '@cc/types';
import { RecordPayoutDto } from './dto/record-payout.dto';
import { QueryPayoutsDto } from './dto/query-payouts.dto';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * List and filter partner payouts
   */
  async findAll(query: QueryPayoutsDto, user: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based check: partner only sees their own payouts
    const isPartnerOnly = user.roles?.includes(UserRole.PARTNER) && !user.roles?.includes(UserRole.ADMIN) && !user.roles?.includes(UserRole.SUPER_ADMIN);
    if (isPartnerOnly) {
      where.partnerId = user.id;
    } else if (query.partnerId) {
      where.partnerId = query.partnerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { referenceNumber: { contains: query.search, mode: 'insensitive' } },
        { partner: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { partner: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { partner: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, payouts] = await Promise.all([
      this.prisma.payout.count({ where }),
      this.prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          partner: true,
          commission: {
            include: {
              application: true,
              service: true,
            },
          },
        },
      }),
    ]);

    return {
      data: payouts.map((p) => this.mapToDto(p)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * ADR-014: Record manual / offline bank transfer payout with UTR reference number
   * Admin-only permission
   */
  async recordManualPayout(dto: RecordPayoutDto, user: any): Promise<PayoutDto> {
    const isAdmin = user.roles?.includes(UserRole.ADMIN) || user.roles?.includes(UserRole.SUPER_ADMIN);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only Administrators can record commission payouts (ADR-011, ADR-014)',
      );
    }

    const commission = await this.prisma.commission.findUnique({
      where: { id: dto.commissionId },
      include: {
        partner: true,
        payouts: true,
      },
    });

    if (!commission) {
      throw new NotFoundException(`Commission record '${dto.commissionId}' not found`);
    }

    if (commission.status !== 'APPROVED' && commission.status !== 'PAID') {
      throw new BadRequestException(
        `Cannot record payout for commission in status '${commission.status}'. Commission must be APPROVED first.`,
      );
    }

    const existingPayout = commission.payouts[0];

    const result = await this.prisma.$transaction(async (tx) => {
      let payoutRecord: any;

      if (existingPayout) {
        payoutRecord = await tx.payout.update({
          where: { id: existingPayout.id },
          data: {
            status: 'PAID',
            paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
            referenceNumber: dto.referenceNumber,
            paidAt: new Date(),
            notes: dto.notes || existingPayout.notes,
          },
          include: {
            partner: true,
            commission: {
              include: {
                application: true,
                service: true,
              },
            },
          },
        });
      } else {
        payoutRecord = await tx.payout.create({
          data: {
            commissionId: commission.id,
            partnerId: commission.partnerId,
            amount: commission.amount,
            status: 'PAID',
            paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
            referenceNumber: dto.referenceNumber,
            paidAt: new Date(),
            notes: dto.notes,
          },
          include: {
            partner: true,
            commission: {
              include: {
                application: true,
                service: true,
              },
            },
          },
        });
      }

      // Update parent Commission to PAID
      await tx.commission.update({
        where: { id: commission.id },
        data: { status: 'PAID' },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId || null,
          userId: user.id,
          action: 'payout.record_manual',
          entityType: 'Payout',
          entityId: payoutRecord.id,
          newValues: {
            commissionId: commission.id,
            partnerId: commission.partnerId,
            amount: Number(commission.amount),
            referenceNumber: dto.referenceNumber,
            paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
          },
        },
      });

      return payoutRecord;
    });

    this.logger.log(
      `Recorded manual payout for Partner '${result.partner?.email}' (Amount: ₹${result.amount}, UTR: ${dto.referenceNumber})`,
    );

    // Non-blocking notification dispatch with UTR
    this.notificationsService
      .dispatchMultiChannel(
        'payout.processed' as any,
        { email: result.partner?.email, mobile: result.partner?.mobile },
        {
          customerName: result.partner ? `${result.partner.firstName} ${result.partner.lastName}` : 'Valued Partner',
          amount: Number(result.amount),
          referenceNumber: dto.referenceNumber,
          paymentMethod: dto.paymentMethod || 'BANK TRANSFER (NEFT/IMPS)',
        },
        {
          organizationId: user.organizationId,
          userId: result.partnerId,
          idempotencyPrefix: `payout.processed:${result.id}`,
        },
      )
      .catch((err) => this.logger.warn(`Failed to dispatch payout notification: ${err.message}`));

    return this.mapToDto(result);
  }

  private mapToDto(p: any): PayoutDto {
    return {
      id: p.id,
      commissionId: p.commissionId,
      partnerId: p.partnerId,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      status: p.status as PayoutStatus,
      referenceNumber: p.referenceNumber,
      paidAt: p.paidAt ? (p.paidAt instanceof Date ? p.paidAt.toISOString() : new Date(p.paidAt).toISOString()) : null,
      notes: p.notes,
      createdAt: p.createdAt ? (p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date(p.createdAt).toISOString()) : new Date().toISOString(),
      partner: p.partner
        ? {
            id: p.partner.id,
            firstName: p.partner.firstName,
            lastName: p.partner.lastName,
            email: p.partner.email,
            mobile: p.partner.mobile,
          }
        : null,
      commission: p.commission
        ? {
            id: p.commission.id,
            applicationId: p.commission.applicationId,
            serviceId: p.commission.serviceId,
            partnerId: p.commission.partnerId,
            baseAmount: Number(p.commission.baseAmount),
            rate: Number(p.commission.rate),
            amount: Number(p.commission.amount),
            status: p.commission.status,
            createdAt: p.commission.createdAt.toISOString(),
            application: p.commission.application
              ? {
                  id: p.commission.application.id,
                  applicationNumber: p.commission.application.applicationNumber,
                  status: p.commission.application.status,
                }
              : null,
            service: p.commission.service
              ? {
                  id: p.commission.service.id,
                  name: p.commission.service.name,
                }
              : null,
          }
        : null,
    };
  }
}
