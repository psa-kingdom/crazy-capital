import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RazorpayGatewayService } from './gateway/razorpay-gateway.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InvoiceStatus, PaymentStatus, UserRole } from '@cc/types';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let gateway: any;

  const mockAdminUser = {
    id: 'user-admin-1',
    organizationId: 'org-test-1',
    roles: [UserRole.ADMIN],
  };

  const mockCustomerUser = {
    id: 'user-cust-1',
    customerId: 'cust-1',
    organizationId: 'org-test-1',
    roles: [UserRole.CUSTOMER],
  };

  const mockInvoice = {
    id: 'inv-1',
    customerId: 'cust-1',
    applicationId: 'app-1',
    invoiceNumber: 'INV-2026-000001',
    amount: '10000.00',
    taxAmount: '1800.00',
    status: InvoiceStatus.DRAFT,
    customer: {
      id: 'cust-1',
      organizationId: 'org-test-1',
      fullName: 'Rajesh Sharma',
      email: 'rajesh@sharmatech.in',
      mobile: '+919876543210',
    },
    application: {
      id: 'app-1',
      applicationNumber: 'CC-2026-000001',
    },
  };

  beforeEach(async () => {
    prisma = {
      invoice: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    gateway = {
      createOrder: jest.fn(),
      verifyPaymentSignature: jest.fn(),
      verifyWebhookSignature: jest.fn(),
      getPublicKey: jest.fn().mockReturnValue('rzp_test_mock_key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RazorpayGatewayService, useValue: gateway },
        {
          provide: NotificationsService,
          useValue: {
            send: jest.fn().mockResolvedValue({ id: 'log-1', status: 'SENT' }),
            dispatchMultiChannel: jest.fn().mockResolvedValue([{ id: 'log-1', status: 'SENT' }]),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('createPaymentOrder', () => {
    it('should create Razorpay payment order and transition invoice from DRAFT to SENT', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      gateway.createOrder.mockResolvedValue({
        orderId: 'order_mock_123456',
        amount: 11800,
        currency: 'INR',
        keyId: 'rzp_test_mock_key',
      });
      prisma.payment.upsert.mockResolvedValue({});
      prisma.invoice.update.mockResolvedValue({});

      const result = await service.createPaymentOrder(
        { invoiceId: 'inv-1' },
        mockCustomerUser,
      );

      expect(result.orderId).toBe('order_mock_123456');
      expect(result.amount).toBe(11800);
      expect(result.currency).toBe('INR');
      expect(result.keyId).toBe('rzp_test_mock_key');
      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: { status: InvoiceStatus.SENT },
        }),
      );
    });

    it('should throw BadRequestException if invoice is already PAID', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PAID,
      });

      await expect(
        service.createPaymentOrder({ invoiceId: 'inv-1' }, mockCustomerUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyClientPayment', () => {
    it('should verify payment signature, capture payment, and mark invoice PAID', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      gateway.verifyPaymentSignature.mockReturnValue(true);

      prisma.payment.upsert.mockResolvedValue({
        id: 'pay-1',
        amount: '11800.00',
        status: PaymentStatus.CAPTURED,
      });

      prisma.invoice.update.mockResolvedValue({
        id: 'inv-1',
        invoiceNumber: 'INV-2026-000001',
        status: InvoiceStatus.PAID,
      });

      const result = await service.verifyClientPayment(
        {
          invoiceId: 'inv-1',
          razorpayOrderId: 'order_123',
          razorpayPaymentId: 'pay_999',
          razorpaySignature: 'valid_sig',
        },
        mockCustomerUser,
      );

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(InvoiceStatus.PAID);
      expect(result.data.paymentId).toBe('pay-1');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should reject payment if cryptographic signature is invalid', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      gateway.verifyPaymentSignature.mockReturnValue(false);

      await expect(
        service.verifyClientPayment(
          {
            invoiceId: 'inv-1',
            razorpayOrderId: 'order_123',
            razorpayPaymentId: 'pay_999',
            razorpaySignature: 'invalid_sig',
          },
          mockCustomerUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('recordManualPayment', () => {
    it('should allow operations staff to record offline UTR payments', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      prisma.payment.create.mockResolvedValue({
        id: 'pay-manual-1',
        amount: '11800.00',
        status: PaymentStatus.CAPTURED,
      });
      prisma.invoice.update.mockResolvedValue({
        id: 'inv-1',
        invoiceNumber: 'INV-2026-000001',
        status: InvoiceStatus.PAID,
      });

      const result = await service.recordManualPayment(
        {
          invoiceId: 'inv-1',
          amount: 11800,
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: 'UTR9876543210',
          notes: 'RTGS received from ICICI Bank',
        },
        mockAdminUser,
      );

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(InvoiceStatus.PAID);
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            gateway: 'BANK_TRANSFER',
            gatewayReference: 'UTR9876543210',
          }),
        }),
      );
    });

    it('should forbid customers from recording manual payments', async () => {
      await expect(
        service.recordManualPayment(
          {
            invoiceId: 'inv-1',
            amount: 11800,
            paymentMethod: 'CASH',
            referenceNumber: 'CASH-REC-1',
          },
          mockCustomerUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('handleWebhook', () => {
    it('should idempotently process payment.captured webhook events', async () => {
      gateway.verifyWebhookSignature.mockReturnValue(true);
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay-pending-1',
        invoiceId: 'inv-1',
        amount: '11800.00',
        invoice: { invoiceNumber: 'INV-2026-000001' },
      });

      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_live_123456',
              order_id: 'order_live_123456',
              amount: 1180000, // in paise
            },
          },
        },
      };

      const result = await service.handleWebhook(
        JSON.stringify(webhookPayload),
        'mock_sig',
        webhookPayload,
      );

      expect(result.status).toBe('processed');
      expect(result.invoiceId).toBe('inv-1');
      expect(prisma.payment.upsert).toHaveBeenCalled();
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: InvoiceStatus.PAID },
      });
    });
  });
});
