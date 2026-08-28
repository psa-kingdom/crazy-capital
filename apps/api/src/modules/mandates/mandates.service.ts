import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateSubscriptionMandateInput,
  SubscriptionMandateDto,
  ExecuteMandateDebitInput,
  MandateExecutionResultDto,
} from '@cc/types';

@Injectable()
export class MandatesService {
  private readonly logger = new Logger(MandatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Slice 6.2: Create recurring UPI AutoPay / e-NACH Subscription Mandate
   */
  async createMandate(
    organizationId: string,
    input: CreateSubscriptionMandateInput,
  ): Promise<SubscriptionMandateDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: input.customerId, organizationId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${input.customerId} not found`);
    }

    const gatewayMandateId = `mandate_rzp_${Math.random().toString(36).substring(2, 12)}`;
    const nextBillingDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const mandate = await this.prisma.subscriptionMandate.create({
      data: {
        organizationId,
        customerId: input.customerId,
        serviceId: input.serviceId || null,
        planName: input.planName,
        frequency: input.frequency || 'MONTHLY',
        amount: input.amount,
        status: 'ACTIVE',
        gatewayMandateId,
        paymentMethod: input.paymentMethod || 'UPI_AUTOPAY',
        nextBillingDate,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
      },
    });

    this.logger.log(`Created Subscription Mandate: ${mandate.id} (${mandate.planName}) for ${customer.firstName} ${customer.lastName}`);

    return {
      id: mandate.id,
      organizationId: mandate.organizationId,
      customerId: mandate.customerId,
      customerName: `${mandate.customer.firstName} ${mandate.customer.lastName}`,
      serviceId: mandate.serviceId,
      serviceName: mandate.service?.name,
      planName: mandate.planName,
      frequency: mandate.frequency as any,
      amount: Number(mandate.amount),
      status: mandate.status as any,
      gatewayMandateId: mandate.gatewayMandateId,
      paymentMethod: mandate.paymentMethod,
      nextBillingDate: mandate.nextBillingDate,
      lastBilledDate: mandate.lastBilledDate,
      retryCount: mandate.retryCount,
      createdAt: mandate.createdAt,
      updatedAt: mandate.updatedAt,
    };
  }

  /**
   * Slice 6.2: Execute mandate debit (auto-charging retainer invoice)
   */
  async executeDebit(
    organizationId: string,
    mandateId: string,
    input?: ExecuteMandateDebitInput,
  ): Promise<MandateExecutionResultDto> {
    const mandate = await this.prisma.subscriptionMandate.findFirst({
      where: { id: mandateId, organizationId },
      include: { customer: true },
    });

    if (!mandate) {
      throw new NotFoundException(`Mandate with ID ${mandateId} not found`);
    }

    if (mandate.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot debit mandate in ${mandate.status} state`);
    }

    const debitAmount = input?.amountOverride ? Number(input.amountOverride) : Number(mandate.amount);
    const transactionId = `pay_sub_${Math.random().toString(36).substring(2, 12)}`;

    // Calculate next billing date based on frequency
    const currentNext = new Date(mandate.nextBillingDate);
    const intervalDays = mandate.frequency === 'ANNUALLY' ? 365 : mandate.frequency === 'QUARTERLY' ? 90 : 30;
    const newNextBillingDate = new Date(currentNext.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // Update mandate status
    await this.prisma.subscriptionMandate.update({
      where: { id: mandateId },
      data: {
        lastBilledDate: new Date(),
        nextBillingDate: newNextBillingDate,
        retryCount: 0,
      },
    });

    this.logger.log(`Executed Mandate Debit: ₹${debitAmount} for ${mandate.planName} (Txn: ${transactionId})`);

    return {
      success: true,
      transactionId,
      mandateId,
      amountDebited: debitAmount,
      status: 'CAPTURED',
      message: `Recurring retainer payment of ₹${debitAmount} successfully processed via ${mandate.paymentMethod}.`,
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * Update mandate status (PAUSE, RESUME, CANCEL)
   */
  async updateStatus(
    organizationId: string,
    mandateId: string,
    newStatus: 'ACTIVE' | 'PAUSED' | 'CANCELLED',
  ): Promise<{ success: boolean; status: string }> {
    const mandate = await this.prisma.subscriptionMandate.findFirst({
      where: { id: mandateId, organizationId },
    });

    if (!mandate) {
      throw new NotFoundException(`Mandate with ID ${mandateId} not found`);
    }

    await this.prisma.subscriptionMandate.update({
      where: { id: mandateId },
      data: { status: newStatus },
    });

    return { success: true, status: newStatus };
  }

  /**
   * List all recurring subscription mandates for an organization
   */
  async listMandates(organizationId: string, customerId?: string): Promise<SubscriptionMandateDto[]> {
    const where: any = { organizationId };
    if (customerId) {
      where.customerId = customerId;
    }

    const mandates = await this.prisma.subscriptionMandate.findMany({
      where,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return mandates.map((m) => ({
      id: m.id,
      organizationId: m.organizationId,
      customerId: m.customerId,
      customerName: `${m.customer.firstName} ${m.customer.lastName}`,
      serviceId: m.serviceId,
      serviceName: m.service?.name,
      planName: m.planName,
      frequency: m.frequency as any,
      amount: Number(m.amount),
      status: m.status as any,
      gatewayMandateId: m.gatewayMandateId,
      paymentMethod: m.paymentMethod,
      nextBillingDate: m.nextBillingDate,
      lastBilledDate: m.lastBilledDate,
      retryCount: m.retryCount,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }
}
