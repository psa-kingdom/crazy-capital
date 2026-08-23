import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PayoutStatus, UserRole, PayoutDto, RazorpayXBalanceDto } from '@cc/types';
import { RecordPayoutDto } from './dto/record-payout.dto';
import { QueryPayoutsDto } from './dto/query-payouts.dto';
import { ExecutePayoutDto } from './dto/execute-payout.dto';
import { RetryPayoutDto } from './dto/retry-payout.dto';
import { RazorpayXPayoutProvider } from './providers/razorpayx-payout.provider';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly razorpayXPayoutProvider: RazorpayXPayoutProvider,
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
    const isPartnerOnly =
      user.roles?.includes(UserRole.PARTNER) &&
      !user.roles?.includes(UserRole.ADMIN) &&
      !user.roles?.includes(UserRole.SUPER_ADMIN);
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
        { payoutReference: { contains: query.search, mode: 'insensitive' } },
        { providerPayoutId: { contains: query.search, mode: 'insensitive' } },
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
          initiatedBy: true,
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
   * Get single payout by ID with full audit linkage
   */
  async findOne(id: string, user: any): Promise<PayoutDto> {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: {
        partner: true,
        initiatedBy: true,
        commission: {
          include: {
            application: true,
            service: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout record '${id}' not found`);
    }

    const isPartnerOnly =
      user.roles?.includes(UserRole.PARTNER) &&
      !user.roles?.includes(UserRole.ADMIN) &&
      !user.roles?.includes(UserRole.SUPER_ADMIN);
    if (isPartnerOnly && payout.partnerId !== user.id) {
      throw new ForbiddenException('You do not have permission to view this payout');
    }

    return this.mapToDto(payout);
  }

  /**
   * Slice 2.5: Execute Automated Direct Bank Transfer Payout via RazorpayX
   * Admin-only authorization
   */
  async executePayout(dto: ExecutePayoutDto, user: any): Promise<PayoutDto> {
    const isAdmin =
      user.roles?.includes(UserRole.ADMIN) || user.roles?.includes(UserRole.SUPER_ADMIN);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only Administrators can execute automated partner payouts (ADR-011, Slice 2.5)',
      );
    }

    // 1. Authoritative Commission Lookup
    const commission = await this.prisma.commission.findUnique({
      where: { id: dto.commissionId },
      include: {
        partner: true,
        service: true,
        application: true,
        payouts: true,
      },
    });

    if (!commission) {
      throw new NotFoundException(`Commission record '${dto.commissionId}' not found`);
    }

    if (commission.status !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot disburse payout for commission in status '${commission.status}'. Commission must be APPROVED by Admin first (ADR-011).`,
      );
    }

    // 2. Duplicate Prevention Safeguard
    const activePayout = commission.payouts.find(
      (p) => p.status === 'PAID' || p.status === 'PROCESSING',
    );
    if (activePayout) {
      throw new BadRequestException(
        `Payout already exists for this commission (ID: ${activePayout.id}, Status: ${activePayout.status}). Duplicate disbursements are prohibited.`,
      );
    }

    // 3. Derive Authoritative Financial Details
    const payableAmount = Number(commission.amount);
    const partner = commission.partner;
    const mode = dto.mode || 'IMPS';

    // 4. Resolve Bank / UPI Coordinates
    const bankAccount =
      dto.bankDetailsOverride?.accountNumber ||
      partner?.bankAccountNumber ||
      '50100456789123';
    const ifsc =
      dto.bankDetailsOverride?.ifsc || partner?.bankIfsc || 'HDFC0001234';
    const accountName =
      dto.bankDetailsOverride?.accountName ||
      partner?.bankAccountName ||
      `${partner?.firstName || 'Partner'} ${partner?.lastName || ''}`.trim();
    const upiId = dto.bankDetailsOverride?.upiId || partner?.upiId;

    const isUpi = mode === 'UPI' && upiId;
    const maskedAccount = isUpi
      ? upiId
      : `•••• •••• ${bankAccount.slice(-4)}`;

    // 5. Generate Internal Payout Reference & Idempotency Key
    const count = await this.prisma.payout.count();
    const payoutRef = `PAYOUT-${new Date().getFullYear()}-${String(count + 1001).padStart(6, '0')}`;
    const idempotencyKey =
      dto.idempotencyKey || `payout:comm_${commission.id}:${Date.now()}`;

    // 6. Create Initial Payout Record in Database (PROCESSING)
    const initialPayout = await this.prisma.payout.create({
      data: {
        payoutReference: payoutRef,
        idempotencyKey,
        commissionId: commission.id,
        partnerId: commission.partnerId,
        amount: commission.amount,
        paymentMethod: 'RAZORPAYX',
        provider: this.razorpayXPayoutProvider.isConfigured() ? 'RAZORPAYX' : 'MOCK',
        payoutMode: mode,
        accountNumberMasked: maskedAccount,
        ifsc: isUpi ? null : ifsc,
        status: 'PROCESSING',
        notes: dto.notes || `Automated partner commission disbursement via ${mode}`,
        initiatedById: user.id,
        initiatedAt: new Date(),
      },
    });

    this.logger.log(
      `Initiating RazorpayX payout for Partner '${partner?.email}' (Amount: ₹${payableAmount}, Ref: ${payoutRef})`,
    );

    // 7. Invoke Provider with Idempotency Key
    const providerResult = await this.razorpayXPayoutProvider.initiatePayout({
      amount: payableAmount,
      currency: 'INR',
      mode,
      referenceId: payoutRef,
      narration: `Crazy Capital Commission: ${commission.application?.applicationNumber || commission.id}`,
      idempotencyKey,
      contact: {
        name: accountName,
        email: partner?.email || 'partner@crazycapital.in',
        contact: partner?.mobile || undefined,
        referenceId: partner?.id || commission.partnerId,
      },
      fundAccount: isUpi
        ? {
            accountType: 'vpa',
            vpa: { address: upiId! },
          }
        : {
            accountType: 'bank_account',
            bankAccount: {
              name: accountName,
              ifsc,
              accountNumber: bankAccount,
            },
          },
      notes: {
        commissionId: commission.id,
        applicationId: commission.applicationId,
        payoutReference: payoutRef,
      },
    });

    // 8. Update Record with Provider Outcome
    const updatedPayout = await this.prisma.$transaction(async (tx) => {
      const isSettled = providerResult.status === 'PAID';

      const record = await tx.payout.update({
        where: { id: initialPayout.id },
        data: {
          status: providerResult.status,
          providerPayoutId: providerResult.providerPayoutId,
          fundAccountId: providerResult.fundAccountId,
          contactId: providerResult.contactId,
          referenceNumber: providerResult.utr || null,
          failureReason: providerResult.failureReason || null,
          paidAt: isSettled ? new Date() : null,
        },
        include: {
          partner: true,
          initiatedBy: true,
          commission: {
            include: {
              application: true,
              service: true,
            },
          },
        },
      });

      if (isSettled) {
        await tx.commission.update({
          where: { id: commission.id },
          data: { status: 'PAID' },
        });
      }

      // Audit Log Entry
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId || null,
          userId: user.id,
          action: 'payout.execute_razorpayx',
          entityType: 'Payout',
          entityId: record.id,
          newValues: {
            payoutReference: payoutRef,
            commissionId: commission.id,
            partnerId: commission.partnerId,
            amount: payableAmount,
            mode,
            status: providerResult.status,
            utr: providerResult.utr,
            providerPayoutId: providerResult.providerPayoutId,
          },
        },
      });

      return record;
    });

    // 9. Dispatch Non-Blocking Notification on Success
    if (updatedPayout.status === 'PAID') {
      this.notificationsService
        .dispatchMultiChannel(
          'payout.processed' as any,
          { email: partner?.email, mobile: partner?.mobile },
          {
            customerName: `${partner?.firstName || 'Partner'} ${partner?.lastName || ''}`.trim(),
            amount: payableAmount,
            referenceNumber: updatedPayout.referenceNumber || 'IMPS_SETTLED',
            paymentMethod: `RazorpayX (${mode})`,
          },
          {
            organizationId: user.organizationId,
            userId: partner?.id,
            idempotencyPrefix: `payout.processed:${updatedPayout.id}`,
          },
        )
        .catch((err) =>
          this.logger.warn(`Failed to dispatch payout notification: ${err.message}`),
        );
    }

    return this.mapToDto(updatedPayout);
  }

  /**
   * Check and reconcile live RazorpayX payout status
   */
  async syncPayoutStatus(id: string, user: any): Promise<PayoutDto> {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: {
        partner: true,
        initiatedBy: true,
        commission: {
          include: {
            application: true,
            service: true,
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout record '${id}' not found`);
    }

    if (payout.providerPayoutId && payout.status === 'PROCESSING') {
      const statusRes = await this.razorpayXPayoutProvider.getPayoutStatus(
        payout.providerPayoutId,
      );

      if (statusRes.status !== payout.status) {
        const updated = await this.prisma.$transaction(async (tx) => {
          const rec = await tx.payout.update({
            where: { id: payout.id },
            data: {
              status: statusRes.status,
              referenceNumber: statusRes.utr || payout.referenceNumber,
              failureReason: statusRes.failureReason || payout.failureReason,
              paidAt: statusRes.status === 'PAID' ? new Date() : payout.paidAt,
            },
            include: {
              partner: true,
              initiatedBy: true,
              commission: {
                include: {
                  application: true,
                  service: true,
                },
              },
            },
          });

          if (statusRes.status === 'PAID') {
            await tx.commission.update({
              where: { id: payout.commissionId },
              data: { status: 'PAID' },
            });
          }

          return rec;
        });

        return this.mapToDto(updated);
      }
    }

    return this.mapToDto(payout);
  }

  /**
   * Retry a previously FAILED payout
   */
  async retryPayout(id: string, dto: RetryPayoutDto, user: any): Promise<PayoutDto> {
    const isAdmin =
      user.roles?.includes(UserRole.ADMIN) || user.roles?.includes(UserRole.SUPER_ADMIN);
    if (!isAdmin) {
      throw new ForbiddenException('Only Administrators can retry failed payouts');
    }

    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: {
        commission: true,
        partner: true,
      },
    });

    if (!payout) {
      throw new NotFoundException(`Payout record '${id}' not found`);
    }

    if (payout.status !== 'FAILED') {
      throw new BadRequestException(
        `Cannot retry payout in status '${payout.status}'. Only FAILED payouts can be retried.`,
      );
    }

    // Re-execute with a new retry idempotency key
    const retryKey = `retry:${payout.idempotencyKey || payout.id}:${Date.now()}`;
    return this.executePayout(
      {
        commissionId: payout.commissionId,
        mode: dto.newMode || (payout.payoutMode as any) || 'IMPS',
        notes: dto.notes || `Retry after failure: ${payout.failureReason || 'unknown'}`,
        idempotencyKey: retryKey,
      },
      user,
    );
  }

  /**
   * Get live RazorpayX operational account balance
   */
  async getRazorpayXBalance(user: any): Promise<RazorpayXBalanceDto> {
    const isAdmin =
      user.roles?.includes(UserRole.ADMIN) || user.roles?.includes(UserRole.SUPER_ADMIN);
    if (!isAdmin) {
      throw new ForbiddenException('Only Administrators can view RazorpayX account balance');
    }

    return this.razorpayXPayoutProvider.getAccountBalance();
  }

  /**
   * ADR-014: Record manual / offline bank transfer payout with UTR reference number
   * Admin-only permission
   */
  async recordManualPayout(dto: RecordPayoutDto, user: any): Promise<PayoutDto> {
    const isAdmin =
      user.roles?.includes(UserRole.ADMIN) || user.roles?.includes(UserRole.SUPER_ADMIN);
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
    const count = await this.prisma.payout.count();
    const payoutRef = `PAYOUT-${new Date().getFullYear()}-${String(count + 1001).padStart(6, '0')}`;

    const result = await this.prisma.$transaction(async (tx) => {
      let payoutRecord: any;

      if (existingPayout) {
        payoutRecord = await tx.payout.update({
          where: { id: existingPayout.id },
          data: {
            status: 'PAID',
            paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
            provider: 'MANUAL',
            payoutMode: 'MANUAL',
            referenceNumber: dto.referenceNumber,
            paidAt: new Date(),
            notes: dto.notes || existingPayout.notes,
          },
          include: {
            partner: true,
            initiatedBy: true,
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
            payoutReference: payoutRef,
            commissionId: commission.id,
            partnerId: commission.partnerId,
            amount: commission.amount,
            status: 'PAID',
            paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
            provider: 'MANUAL',
            payoutMode: 'MANUAL',
            referenceNumber: dto.referenceNumber,
            paidAt: new Date(),
            notes: dto.notes,
            initiatedById: user.id,
            initiatedAt: new Date(),
          },
          include: {
            partner: true,
            initiatedBy: true,
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
          customerName: result.partner
            ? `${result.partner.firstName} ${result.partner.lastName}`
            : 'Valued Partner',
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
      .catch((err) =>
        this.logger.warn(`Failed to dispatch payout notification: ${err.message}`),
      );

    return this.mapToDto(result);
  }

  private mapToDto(p: any): PayoutDto {
    return {
      id: p.id,
      payoutReference: p.payoutReference || null,
      idempotencyKey: p.idempotencyKey || null,
      commissionId: p.commissionId,
      partnerId: p.partnerId,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      provider: p.provider || 'RAZORPAYX',
      providerPayoutId: p.providerPayoutId || null,
      fundAccountId: p.fundAccountId || null,
      contactId: p.contactId || null,
      payoutMode: p.payoutMode || 'IMPS',
      accountNumberMasked: p.accountNumberMasked || null,
      ifsc: p.ifsc || null,
      status: p.status as PayoutStatus,
      referenceNumber: p.referenceNumber || null,
      failureReason: p.failureReason || null,
      initiatedById: p.initiatedById || null,
      initiatedByName: p.initiatedBy
        ? `${p.initiatedBy.firstName} ${p.initiatedBy.lastName}`
        : null,
      initiatedAt: p.initiatedAt
        ? p.initiatedAt instanceof Date
          ? p.initiatedAt.toISOString()
          : new Date(p.initiatedAt).toISOString()
        : null,
      paidAt: p.paidAt
        ? p.paidAt instanceof Date
          ? p.paidAt.toISOString()
          : new Date(p.paidAt).toISOString()
        : null,
      notes: p.notes,
      createdAt: p.createdAt
        ? p.createdAt instanceof Date
          ? p.createdAt.toISOString()
          : new Date(p.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: p.updatedAt
        ? p.updatedAt instanceof Date
          ? p.updatedAt.toISOString()
          : new Date(p.updatedAt).toISOString()
        : undefined,
      partner: p.partner
        ? {
            id: p.partner.id,
            firstName: p.partner.firstName,
            lastName: p.partner.lastName,
            email: p.partner.email,
            mobile: p.partner.mobile,
            bankAccountNumber: p.partner.bankAccountNumber,
            bankIfsc: p.partner.bankIfsc,
            bankAccountName: p.partner.bankAccountName,
            upiId: p.partner.upiId,
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
