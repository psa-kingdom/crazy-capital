import { Test, TestingModule } from '@nestjs/testing';
import { MobileService } from './mobile.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MobilePlatform } from '@cc/types';

describe('MobileService', () => {
  let service: MobileService;
  let prisma: any;

  const mockPrismaService = {
    mobileDeviceToken: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    application: {
      findMany: jest.fn(),
    },
    document: {
      count: jest.fn(),
    },
    invoice: {
      count: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    commission: {
      findMany: jest.fn(),
    },
    lead: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MobileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MobileService>(MobileService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerDevice', () => {
    it('should register a new mobile device token successfully', async () => {
      mockPrismaService.mobileDeviceToken.findUnique.mockResolvedValue(null);
      mockPrismaService.mobileDeviceToken.create.mockResolvedValue({
        id: 'device-123',
        userId: 'user-1',
        organizationId: 'org-1',
        deviceToken: 'fcm_token_xyz_1234567890',
        platform: MobilePlatform.ANDROID,
        isActive: true,
      });

      const res = await service.registerDevice('user-1', 'org-1', {
        deviceToken: 'fcm_token_xyz_1234567890',
        platform: 'ANDROID',
        deviceModel: 'Pixel 8',
      });

      expect(res.success).toBe(true);
      expect(mockPrismaService.mobileDeviceToken.create).toHaveBeenCalled();
    });

    it('should update existing device token if already present', async () => {
      mockPrismaService.mobileDeviceToken.findUnique.mockResolvedValue({
        id: 'device-123',
        deviceToken: 'fcm_token_xyz_1234567890',
        platform: 'IOS',
      });
      mockPrismaService.mobileDeviceToken.update.mockResolvedValue({
        id: 'device-123',
        isActive: true,
      });

      const res = await service.registerDevice('user-1', 'org-1', {
        deviceToken: 'fcm_token_xyz_1234567890',
        platform: 'IOS',
      });

      expect(res.success).toBe(true);
      expect(mockPrismaService.mobileDeviceToken.update).toHaveBeenCalled();
    });
  });

  describe('createBiometricChallenge & verifyBiometricAuth', () => {
    it('should generate a cryptographic challenge nonce', async () => {
      const challenge = await service.createBiometricChallenge('user-1');
      expect(challenge.challengeNonce).toBeDefined();
      expect(challenge.challengeNonce.length).toBe(64);
      expect(challenge.expiresAt).toBeDefined();
    });

    it('should verify biometric signature for an enabled device', async () => {
      mockPrismaService.mobileDeviceToken.findFirst.mockResolvedValue({
        id: 'device-123',
        userId: 'user-1',
        biometricEnabled: true,
        isActive: true,
      });
      mockPrismaService.mobileDeviceToken.update.mockResolvedValue({
        id: 'device-123',
      });

      const result = await service.verifyBiometricAuth('user-1', {
        deviceToken: 'fcm_token_xyz_1234567890',
        challengeNonce: 'nonce_abc_123',
        signature: 'valid_crypto_sig_hardware_enclave',
      });

      expect(result.authenticated).toBe(true);
      expect(result.deviceId).toBe('device-123');
    });
  });

  describe('getCustomerMobileSummary & getPartnerMobileSummary', () => {
    it('should return mobile customer summary', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'rahul@example.com',
        mobile: '9876543210',
        firstName: 'Rahul',
        lastName: 'Sharma',
      });
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'cust-1',
        firstName: 'Rahul',
        lastName: 'Sharma',
      });
      mockPrismaService.application.findMany.mockResolvedValue([]);
      mockPrismaService.document.count.mockResolvedValue(1);
      mockPrismaService.invoice.count.mockResolvedValue(0);
      mockPrismaService.service.findMany.mockResolvedValue([
        { id: 'srv-1', name: 'Pvt Ltd Incorporation', slug: 'pvt-ltd-incorporation', pricing: [{ amount: 6999 }] },
      ]);

      const summary = await service.getCustomerMobileSummary('user-1', 'org-1');
      expect(summary.customerName).toBe('Rahul Sharma');
      expect(summary.quickActionServices.length).toBe(1);
    });

    it('should return mobile partner summary', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-partner-1',
        firstName: 'Amit',
        lastName: 'Verma',
        partnerProfile: { tier: 'GOLD', partnerCode: 'CC-GOLD-01' },
      });
      mockPrismaService.commission.findMany.mockResolvedValue([
        { status: 'PAID', amount: 15000 },
        { status: 'APPROVED', amount: 5000 },
      ]);
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.lead.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);

      const summary = await service.getPartnerMobileSummary('user-partner-1', 'org-1');
      expect(summary.partnerName).toBe('Amit Verma');
      expect(summary.tier).toBe('GOLD');
      expect(summary.lifetimeEarnings).toBe(15000);
      expect(summary.pendingCommissions).toBe(5000);
      expect(summary.conversionRatePct).toBe(50);
    });
  });
});
