import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ResendEmailAdapter } from './providers/resend-email.adapter';
import { Msg91SmsAdapter } from './providers/msg91-sms.adapter';
import { InteraktWhatsappAdapter } from './providers/interakt-whatsapp.adapter';
import { ConfigService } from '@nestjs/config';

describe('NotificationsService (Slice 1.9)', () => {
  let service: NotificationsService;
  let prisma: any;
  let resendAdapter: ResendEmailAdapter;
  let msg91Adapter: Msg91SmsAdapter;
  let interaktAdapter: InteraktWhatsappAdapter;

  const mockPrisma = {
    notificationLog: {
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'EMAIL_FROM') return 'Crazy Capital <notifications@crazycapital.in>';
      if (key === 'MSG91_SENDER_ID') return 'CRZYCP';
      return null; // Mock mode
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        ResendEmailAdapter,
        Msg91SmsAdapter,
        InteraktWhatsappAdapter,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    resendAdapter = module.get<ResendEmailAdapter>(ResendEmailAdapter);
    msg91Adapter = module.get<Msg91SmsAdapter>(Msg91SmsAdapter);
    interaktAdapter = module.get<InteraktWhatsappAdapter>(InteraktWhatsappAdapter);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(resendAdapter).toBeDefined();
    expect(msg91Adapter).toBeDefined();
    expect(interaktAdapter).toBeDefined();
  });

  describe('Email Channel Dispatching (Resend & Mock)', () => {
    it('should dispatch email notification in mock mode when API key is unset', async () => {
      const mockLog = {
        id: 'log-101',
        organizationId: 'org-1',
        userId: 'user-1',
        channel: 'EMAIL',
        eventType: 'invoice.sent',
        recipient: 'rajesh@sharmatech.in',
        subject: 'Invoice INV-2026-000001 from Crazy Capital for Private Limited Incorporation',
        body: 'Dear Rajesh Sharma, your tax invoice INV-2026-000001 for Private Limited Incorporation (₹17,698.82) has been generated.',
        status: 'PENDING',
        provider: 'MOCK',
        attempts: 1,
        createdAt: new Date(),
      };

      mockPrisma.notificationLog.create.mockResolvedValue(mockLog);
      mockPrisma.notificationLog.update.mockResolvedValue({
        ...mockLog,
        status: 'SENT',
        providerMessageId: 'msg_mock_resend_test',
        sentAt: new Date(),
      });

      const result = await service.send(
        {
          channel: 'EMAIL',
          eventType: 'invoice.sent',
          recipient: 'rajesh@sharmatech.in',
          templateData: {
            customerName: 'Rajesh Sharma',
            invoiceNumber: 'INV-2026-000001',
            amount: 17698.82,
            serviceName: 'Private Limited Incorporation',
          },
        },
        'org-1',
      );

      expect(result.status).toBe('SENT');
      expect(result.channel).toBe('EMAIL');
      expect(result.recipient).toBe('rajesh@sharmatech.in');
      expect(mockPrisma.notificationLog.create).toHaveBeenCalled();
      expect(mockPrisma.notificationLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });

    it('should handle invalid email address gracefully without throwing', async () => {
      const mockLog = {
        id: 'log-102',
        channel: 'EMAIL',
        eventType: 'invoice.sent',
        recipient: 'invalid-email-string',
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockPrisma.notificationLog.create.mockResolvedValue(mockLog);
      mockPrisma.notificationLog.update.mockResolvedValue({
        ...mockLog,
        status: 'FAILED',
        errorMessage: "Invalid email recipient address: 'invalid-email-string'",
      });

      const result = await service.send({
        channel: 'EMAIL',
        eventType: 'invoice.sent',
        recipient: 'invalid-email-string',
      });

      expect(result.status).toBe('FAILED');
      expect(result.errorMessage).toContain('Invalid email recipient address');
    });
  });

  describe('SMS Channel Dispatching (MSG91 & Mock)', () => {
    it('should dispatch SMS notification with sanitized phone number', async () => {
      const mockLog = {
        id: 'log-201',
        channel: 'SMS',
        eventType: 'auth.otp',
        recipient: '+919876543210',
        body: 'Your Crazy Capital OTP is 654321. Valid for 10 minutes.',
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockPrisma.notificationLog.create.mockResolvedValue(mockLog);
      mockPrisma.notificationLog.update.mockResolvedValue({
        ...mockLog,
        status: 'SENT',
        providerMessageId: 'req_mock_msg91_test',
        sentAt: new Date(),
      });

      const result = await service.send({
        channel: 'SMS',
        eventType: 'auth.otp',
        recipient: '+91 98765 43210',
        templateData: { otpCode: '654321' },
      });

      expect(result.status).toBe('SENT');
      expect(result.channel).toBe('SMS');
      expect(mockPrisma.notificationLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });
  });

  describe('WhatsApp Channel Dispatching (Interakt & Mock)', () => {
    it('should dispatch WhatsApp notification with country code formatting', async () => {
      const mockLog = {
        id: 'log-301',
        channel: 'WHATSAPP',
        eventType: 'payment.captured',
        recipient: '9876543210',
        body: 'Dear Rajesh Sharma, we have received your payment of ₹17,698.82 for invoice INV-2026-000001.',
        status: 'PENDING',
        createdAt: new Date(),
      };

      mockPrisma.notificationLog.create.mockResolvedValue(mockLog);
      mockPrisma.notificationLog.update.mockResolvedValue({
        ...mockLog,
        status: 'SENT',
        providerMessageId: 'msg_mock_interakt_test',
        sentAt: new Date(),
      });

      const result = await service.send({
        channel: 'WHATSAPP',
        eventType: 'payment.captured',
        recipient: '9876543210',
        templateData: {
          customerName: 'Rajesh Sharma',
          invoiceNumber: 'INV-2026-000001',
          amount: 17698.82,
        },
      });

      expect(result.status).toBe('SENT');
      expect(result.channel).toBe('WHATSAPP');
    });
  });

  describe('Idempotency & Duplicate Prevention', () => {
    it('should return existing record without duplicate dispatch if idempotency key was already SENT', async () => {
      const existingSentLog = {
        id: 'log-idemp-1',
        organizationId: 'org-1',
        channel: 'EMAIL',
        eventType: 'invoice.sent',
        recipient: 'rajesh@sharmatech.in',
        body: 'Already sent body',
        status: 'SENT',
        provider: 'MOCK',
        idempotencyKey: 'invoice.sent:inv-101:EMAIL',
        attempts: 1,
        createdAt: new Date(),
        sentAt: new Date(),
      };

      mockPrisma.notificationLog.findUnique.mockResolvedValue(existingSentLog);

      const result = await service.send(
        {
          channel: 'EMAIL',
          eventType: 'invoice.sent',
          recipient: 'rajesh@sharmatech.in',
          idempotencyKey: 'invoice.sent:inv-101:EMAIL',
        },
        'org-1',
      );

      expect(result.id).toBe('log-idemp-1');
      expect(result.status).toBe('SENT');
      // Should not call create or update
      expect(mockPrisma.notificationLog.create).not.toHaveBeenCalled();
      expect(mockPrisma.notificationLog.update).not.toHaveBeenCalled();
    });
  });

  describe('Multi-Channel Broadcast Helper', () => {
    it('should dispatch parallel email and whatsapp notifications for business event', async () => {
      mockPrisma.notificationLog.create.mockResolvedValue({
        id: 'log-mc-1',
        channel: 'EMAIL',
        eventType: 'workflow.stage_changed',
        recipient: 'rajesh@sharmatech.in',
        body: 'Stage updated',
        status: 'PENDING',
        provider: 'MOCK',
        createdAt: new Date(),
      });
      mockPrisma.notificationLog.update.mockResolvedValue({
        id: 'log-mc-1',
        channel: 'EMAIL',
        eventType: 'workflow.stage_changed',
        recipient: 'rajesh@sharmatech.in',
        body: 'Stage updated',
        status: 'SENT',
        provider: 'MOCK',
        createdAt: new Date(),
      });

      const results = await service.dispatchMultiChannel(
        'workflow.stage_changed',
        { email: 'rajesh@sharmatech.in', mobile: '+919876543210' },
        {
          customerName: 'Rajesh Sharma',
          applicationNumber: 'CC-2026-000001',
          stageName: 'Government Filing Submitted',
          serviceName: 'Private Limited Incorporation',
        },
        {
          organizationId: 'org-1',
          idempotencyPrefix: 'wf:app-1:stg-2',
        },
      );

      expect(results.length).toBe(2);
    });
  });

  describe('Staging Test Dispatch Tool', () => {
    it('should dispatch test message across selected channel', async () => {
      mockPrisma.notificationLog.create.mockResolvedValue({
        id: 'log-test-1',
        channel: 'EMAIL',
        eventType: 'test.dispatch',
        recipient: 'founder@crazycapital.in',
        body: 'Staging verification test ping',
        status: 'PENDING',
        provider: 'MOCK',
        createdAt: new Date(),
      });
      mockPrisma.notificationLog.update.mockResolvedValue({
        id: 'log-test-1',
        channel: 'EMAIL',
        eventType: 'test.dispatch',
        recipient: 'founder@crazycapital.in',
        body: 'Staging verification test ping',
        status: 'SENT',
        provider: 'MOCK',
        createdAt: new Date(),
      });

      const result = await service.testDispatch(
        {
          channel: 'EMAIL',
          recipient: 'founder@crazycapital.in',
          customMessage: 'Staging verification test ping',
        },
        { email: 'admin@crazycapital.in', organizationId: 'org-1' },
      );

      expect(result.status).toBe('SENT');
      expect(result.recipient).toBe('founder@crazycapital.in');
    });
  });

  describe('Unread Notifications & Read Mutations', () => {
    it('should calculate unread notification count correctly', async () => {
      mockPrisma.notificationLog.count.mockResolvedValue(4);

      const result = await service.getUnreadCount({
        userId: 'u-101',
        email: 'user@crazycapital.in',
      });

      expect(result.unreadCount).toBe(4);
      expect(mockPrisma.notificationLog.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            readAt: null,
          }),
        }),
      );
    });

    it('should mark single notification as read', async () => {
      const mockLog = {
        id: 'notif-1',
        channel: 'IN_APP',
        eventType: 'lead.assigned',
        recipient: 'agent@crazycapital.in',
        body: 'Lead Assigned',
        status: 'DELIVERED',
        provider: 'MOCK',
        createdAt: new Date(),
        readAt: null,
      };

      mockPrisma.notificationLog.findUnique.mockResolvedValue(mockLog);
      mockPrisma.notificationLog.update.mockResolvedValue({
        ...mockLog,
        readAt: new Date(),
      });

      const result = await service.markAsRead('notif-1', { userId: 'agent-1' });
      expect(result.metadata.isRead).toBe(true);
      expect(mockPrisma.notificationLog.update).toHaveBeenCalled();
    });

    it('should mark all notifications as read for current user', async () => {
      mockPrisma.notificationLog.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead({
        userId: 'agent-1',
        email: 'agent@crazycapital.in',
      });

      expect(result.updatedCount).toBe(5);
      expect(mockPrisma.notificationLog.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ readAt: null }),
          data: expect.objectContaining({ readAt: expect.any(Date) }),
        }),
      );
    });
  });
});
