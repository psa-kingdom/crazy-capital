import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RazorpayGatewayService } from './gateway/razorpay-gateway.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RecordManualPaymentDto } from './dto/record-manual-payment.dto';
import { InvoiceStatus, PaymentStatus, UserRole } from '@cc/types';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RazorpayGatewayService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Step 1: Create a Razorpay Order linked to an Invoice
   */
  async createPaymentOrder(dto: CreatePaymentOrderDto, user: any) {
    const organizationId = user.organizationId;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        customer: true,
        application: true,
      },
    });

    if (!invoice || invoice.customer.organizationId !== organizationId) {
      throw new NotFoundException(`Invoice '${dto.invoiceId}' not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException(`Invoice '${invoice.invoiceNumber}' is already marked as PAID`);
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException(`Invoice '${invoice.invoiceNumber}' is CANCELLED and cannot be paid`);
    }

    // Customer role boundary: customer can only pay for their own invoice
    if (user.roles?.includes(UserRole.CUSTOMER) && user.customerId && invoice.customerId !== user.customerId) {
      throw new ForbiddenException('You can only initiate payment for your own invoices');
    }

    const baseAmount = Number(invoice.amount);
    const taxAmount = Number(invoice.taxAmount);
    const totalAmount = Math.round((baseAmount + taxAmount) * 100) / 100;

    // Create order with Razorpay / Mock Gateway
    const orderResult = await this.gateway.createOrder({
      invoiceId: invoice.id,
      amount: totalAmount,
      currency: 'INR',
      receipt: invoice.invoiceNumber,
      notes: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        applicationId: invoice.applicationId || '',
      },
    });

    // Create or update pending payment record linked to this order
    await this.prisma.payment.upsert({
      where: {
        gatewayReference: orderResult.orderId,
      },
      create: {
        invoiceId: invoice.id,
        gateway: 'RAZORPAY',
        gatewayReference: orderResult.orderId,
        amount: new Prisma.Decimal(totalAmount),
        status: PaymentStatus.PENDING,
        rawPayload: {
          orderId: orderResult.orderId,
          createdFor: user.id,
        },
      },
      update: {
        amount: new Prisma.Decimal(totalAmount),
        status: PaymentStatus.PENDING,
      },
    });

    // If invoice was in DRAFT, transition it to SENT
    if (invoice.status === InvoiceStatus.DRAFT) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.SENT },
      });
    }

    this.logger.log(`Generated payment order '${orderResult.orderId}' for Invoice '${invoice.invoiceNumber}' (₹${totalAmount})`);

    return {
      orderId: orderResult.orderId,
      amount: totalAmount,
      currency: orderResult.currency,
      keyId: orderResult.keyId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: {
        name: (invoice.customer as any).fullName || `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        email: invoice.customer.email,
        mobile: invoice.customer.mobile,
      },
    };
  }

  /**
   * Step 2: Verify client checkout callback and capture payment
   */
  async verifyClientPayment(dto: VerifyPaymentDto, user: any) {
    const organizationId = user.organizationId;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        customer: true,
        application: true,
      },
    });

    if (!invoice || invoice.customer.organizationId !== organizationId) {
      throw new NotFoundException(`Invoice '${dto.invoiceId}' not found`);
    }

    // Verify cryptographic signature
    const isValid = this.gateway.verifyPaymentSignature({
      orderId: dto.razorpayOrderId,
      paymentId: dto.razorpayPaymentId,
      signature: dto.razorpaySignature,
    });

    if (!isValid) {
      this.logger.warn(`Invalid payment signature for invoice '${invoice.invoiceNumber}' (Order: ${dto.razorpayOrderId})`);
      throw new BadRequestException('Payment verification failed: Invalid cryptographic signature');
    }

    const baseAmount = Number(invoice.amount);
    const taxAmount = Number(invoice.taxAmount);
    const totalAmount = Math.round((baseAmount + taxAmount) * 100) / 100;

    // Atomic transaction: mark payment CAPTURED and invoice PAID
    const result = await this.prisma.$transaction(async (tx) => {
      // Find existing payment by order reference or create new payment record for paymentId
      const payment = await tx.payment.upsert({
        where: {
          gatewayReference: dto.razorpayPaymentId,
        },
        create: {
          invoiceId: invoice.id,
          gateway: 'RAZORPAY',
          gatewayReference: dto.razorpayPaymentId,
          amount: new Prisma.Decimal(totalAmount),
          status: PaymentStatus.CAPTURED,
          rawPayload: {
            orderId: dto.razorpayOrderId,
            paymentId: dto.razorpayPaymentId,
            signature: dto.razorpaySignature,
            verifiedAt: new Date().toISOString(),
            verifiedBy: user.id,
          },
        },
        update: {
          status: PaymentStatus.CAPTURED,
          rawPayload: {
            orderId: dto.razorpayOrderId,
            paymentId: dto.razorpayPaymentId,
            signature: dto.razorpaySignature,
            verifiedAt: new Date().toISOString(),
            verifiedBy: user.id,
          },
        },
      });

      // Update invoice to PAID
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PAID,
        },
        include: {
          customer: true,
          application: true,
          payments: true,
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: user.id,
          action: 'payment.captured',
          entityType: 'Invoice',
          entityId: invoice.id,
          newValues: {
            paymentId: payment.id,
            gatewayReference: dto.razorpayPaymentId,
            amount: totalAmount,
            status: PaymentStatus.CAPTURED,
          },
        },
      });

      return {
        payment,
        invoice: updatedInvoice,
      };
    });

    this.logger.log(`✅ Payment successfully captured for Invoice '${invoice.invoiceNumber}' (Payment ID: ${dto.razorpayPaymentId})`);

    // Non-blocking payment confirmation notification
    this.notificationsService
      .dispatchMultiChannel(
        'payment.captured',
        { email: invoice.customer?.email, mobile: invoice.customer?.mobile },
        {
          customerName: invoice.customer
            ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
            : 'Valued Customer',
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(result.payment.amount),
          gatewayReference: dto.razorpayPaymentId,
        },
        {
          organizationId,
          userId: invoice.customerId,
          idempotencyPrefix: `payment.captured:${result.payment.id}`,
        },
      )
      .catch((err) =>
        this.logger.warn(`Failed to dispatch payment notification: ${err.message}`),
      );

    return {
      success: true,
      message: 'Payment verified and captured successfully',
      data: {
        paymentId: result.payment.id,
        invoiceId: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        status: result.invoice.status,
        amount: Number(result.payment.amount),
      },
    };
  }

  /**
   * Record manual / offline payment (Bank Transfer / NEFT / Cheque / Cash)
   */
  async recordManualPayment(dto: RecordManualPaymentDto, user: any) {
    const organizationId = user.organizationId;

    // Check staff permissions
    if (user.roles?.includes(UserRole.CUSTOMER) && !user.roles?.some((r: any) => [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE].includes(r))) {
      throw new ForbiddenException('Only operations staff and admins can record manual offline payments');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: { customer: true, application: true },
    });

    if (!invoice || invoice.customer.organizationId !== organizationId) {
      throw new NotFoundException(`Invoice '${dto.invoiceId}' not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException(`Invoice '${invoice.invoiceNumber}' is already PAID`);
    }

    // Atomic transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          gateway: dto.paymentMethod,
          gatewayReference: dto.referenceNumber,
          amount: new Prisma.Decimal(dto.amount),
          status: PaymentStatus.CAPTURED,
          rawPayload: {
            paymentMethod: dto.paymentMethod,
            referenceNumber: dto.referenceNumber,
            notes: dto.notes,
            recordedBy: user.id,
            recordedAt: new Date().toISOString(),
          },
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PAID,
        },
        include: {
          customer: true,
          application: true,
          payments: true,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          userId: user.id,
          action: 'payment.manual_recorded',
          entityType: 'Invoice',
          entityId: invoice.id,
          newValues: {
            paymentId: payment.id,
            method: dto.paymentMethod,
            referenceNumber: dto.referenceNumber,
            amount: dto.amount,
          },
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    this.logger.log(`Recorded manual payment (${dto.paymentMethod} - ${dto.referenceNumber}) for Invoice '${invoice.invoiceNumber}'`);

    // Non-blocking payment confirmation notification
    this.notificationsService
      .dispatchMultiChannel(
        'payment.captured',
        { email: invoice.customer?.email, mobile: invoice.customer?.mobile },
        {
          customerName: invoice.customer
            ? `${invoice.customer.firstName} ${invoice.customer.lastName}`
            : 'Valued Customer',
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(result.payment.amount),
          gatewayReference: dto.referenceNumber,
        },
        {
          organizationId,
          userId: invoice.customerId,
          idempotencyPrefix: `payment.captured:${result.payment.id}`,
        },
      )
      .catch((err) =>
        this.logger.warn(`Failed to dispatch manual payment notification: ${err.message}`),
      );

    return {
      success: true,
      message: 'Manual offline payment recorded successfully',
      data: {
        paymentId: result.payment.id,
        invoiceId: result.invoice.id,
        invoiceNumber: result.invoice.invoiceNumber,
        status: result.invoice.status,
        amount: Number(result.payment.amount),
      },
    };
  }

  /**
   * Idempotent Webhook Handler for Razorpay server-to-server notifications
   */
  async handleWebhook(rawBody: string, signature: string, payload: any) {
    // 1. Verify webhook signature
    const isValid = this.gateway.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn('Rejected Razorpay webhook with invalid signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload?.event;
    this.logger.log(`Received Razorpay webhook event: '${event}'`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payload?.payment?.entity;
      const orderEntity = payload?.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id || `pay_${Date.now()}`;
      const amountInPaise = paymentEntity?.amount || orderEntity?.amount;
      const amount = amountInPaise ? amountInPaise / 100 : 0;

      if (!orderId) {
        return { status: 'ignored', reason: 'No order_id in webhook payload' };
      }

      // Idempotency: Check if already processed
      const existingPayment = await this.prisma.payment.findUnique({
        where: { gatewayReference: paymentId },
      });

      if (existingPayment && existingPayment.status === PaymentStatus.CAPTURED) {
        this.logger.log(`Webhook: Payment '${paymentId}' was already processed (idempotent skip)`);
        return { status: 'already_processed', paymentId };
      }

      // Find invoice linked to the order
      const pendingPayment = await this.prisma.payment.findFirst({
        where: { gatewayReference: orderId },
        include: { invoice: true },
      });

      if (!pendingPayment) {
        this.logger.warn(`Webhook: No pending payment found for order '${orderId}'`);
        return { status: 'order_not_found', orderId };
      }

      // Process capture
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.upsert({
          where: { gatewayReference: paymentId },
          create: {
            invoiceId: pendingPayment.invoiceId,
            gateway: 'RAZORPAY',
            gatewayReference: paymentId,
            amount: new Prisma.Decimal(amount || Number(pendingPayment.amount)),
            status: PaymentStatus.CAPTURED,
            rawPayload: payload,
          },
          update: {
            status: PaymentStatus.CAPTURED,
            rawPayload: payload,
          },
        });

        await tx.invoice.update({
          where: { id: pendingPayment.invoiceId },
          data: { status: InvoiceStatus.PAID },
        });
      });

      this.logger.log(`Webhook successfully updated invoice '${pendingPayment.invoice.invoiceNumber}' to PAID`);
      return { status: 'processed', invoiceId: pendingPayment.invoiceId };
    }

    return { status: 'ignored', event };
  }
}
