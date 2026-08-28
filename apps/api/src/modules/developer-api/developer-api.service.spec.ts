import { Test, TestingModule } from '@nestjs/testing';
import { DeveloperApiService } from './developer-api.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('DeveloperApiService', () => {
  let service: DeveloperApiService;
  let prisma: any;

  const mockPrismaService = {
    apiKey: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    webhookSubscription: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    webhookDeliveryLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeveloperApiService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DeveloperApiService>(DeveloperApiService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApiKey', () => {
    it('should generate an unmasked key and store only SHA-256 hash', async () => {
      mockPrismaService.apiKey.create.mockImplementation(({ data }) => ({
        id: 'key-123',
        ...data,
        createdAt: new Date(),
      }));

      const result = await service.createApiKey('user-1', 'org-1', {
        name: 'Zapier Lead Integration',
        environment: 'LIVE',
        scopes: ['leads:write', 'leads:read'],
        rateLimitPerMin: 60,
      });

      expect(result.rawSecretKey).toBeDefined();
      expect(result.rawSecretKey.startsWith('cc_live_')).toBe(true);
      expect(result.apiKey.name).toBe('Zapier Lead Integration');
      expect(result.apiKey.keyPrefix).toBe(result.rawSecretKey.slice(0, 12));

      // Verify that create was called with a 64-character SHA-256 hash
      expect(mockPrismaService.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            keyHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          }),
        }),
      );
    });
  });

  describe('validateApiKey', () => {
    it('should validate valid raw API key and enforce scopes', async () => {
      const rawKey = 'cc_live_9a8b7c6d5e4f3a2b1c0d9e8f';
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      mockPrismaService.apiKey.findUnique.mockResolvedValue({
        id: 'key-123',
        organizationId: 'org-1',
        name: 'CRM Webhook Key',
        scopesJson: ['leads:write', 'applications:read'],
        rateLimitPerMin: 100,
        isActive: true,
        expiresAt: null,
      });
      mockPrismaService.apiKey.update.mockResolvedValue({});

      const validResult = await service.validateApiKey(rawKey, 'leads:write');
      expect(validResult.organizationId).toBe('org-1');
      expect(validResult.apiKey.name).toBe('CRM Webhook Key');

      // Attempting to access with unassigned scope should throw ForbiddenException
      await expect(service.validateApiKey(rawKey, 'documents:write')).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException for malformed or revoked keys', async () => {
      await expect(service.validateApiKey('invalid_prefix_key')).rejects.toThrow(UnauthorizedException);

      mockPrismaService.apiKey.findUnique.mockResolvedValue(null);
      await expect(service.validateApiKey('cc_live_nonexistent_key_123456')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('dispatchEvent & HMAC-SHA256 Webhook Signing', () => {
    it('should sign webhook payloads with HMAC-SHA256 and create delivery logs', async () => {
      mockPrismaService.webhookSubscription.findMany.mockResolvedValue([
        {
          id: 'sub-123',
          organizationId: 'org-1',
          name: 'Partner ERP Listener',
          targetUrl: 'https://partner.com/webhooks/cc',
          secret: 'whsec_test_secret_key_1234567890',
          eventsJson: ['lead.created', 'application.stage_changed'],
          isActive: true,
        },
      ]);

      mockPrismaService.webhookDeliveryLog.create.mockImplementation(({ data }) => ({
        id: 'log-1',
        ...data,
      }));
      mockPrismaService.webhookSubscription.update.mockResolvedValue({});

      const res = await service.dispatchEvent('org-1', 'lead.created', {
        leadId: 'lead-999',
        name: 'Vikram Singh',
        status: 'QUALIFIED',
      });

      expect(res.dispatchedCount).toBe(1);
      expect(res.deliveryLogs.length).toBe(1);
      expect(res.deliveryLogs[0].signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });
  });
});
