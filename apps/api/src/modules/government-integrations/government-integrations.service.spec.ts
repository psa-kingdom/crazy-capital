import { Test, TestingModule } from '@nestjs/testing';
import { GovernmentIntegrationsService } from './government-integrations.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { McaV3Provider } from './providers/mca-v3.provider';
import { GstnProvider } from './providers/gstn.provider';
import { AccountAggregatorProvider } from './providers/account-aggregator.provider';

describe('GovernmentIntegrationsService', () => {
  let service: GovernmentIntegrationsService;
  let prisma: any;

  const mockPrismaService = {
    governmentIntegrationLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GovernmentIntegrationsService,
        McaV3Provider,
        GstnProvider,
        AccountAggregatorProvider,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GovernmentIntegrationsService>(GovernmentIntegrationsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('lookupMcaCompany', () => {
    it('should search MCA V3 registry and check SPICe+ name availability', async () => {
      mockPrismaService.governmentIntegrationLog.create.mockResolvedValue({});

      const result = await service.lookupMcaCompany('org-1', 'CRAZY CAPITAL FINTECH', true);
      expect(result.companyName).toContain('CRAZY CAPITAL');
      expect(result.directors.length).toBeGreaterThan(0);
      expect(mockPrismaService.governmentIntegrationLog.create).toHaveBeenCalled();
    });

    it('should provide suggested alternatives if name is available or reserved', async () => {
      mockPrismaService.governmentIntegrationLog.create.mockResolvedValue({});

      const result = await service.lookupMcaCompany('org-1', 'FUTURE NEXUS TECH', true);
      expect(result.nameAvailabilityCheck).toBeDefined();
      expect(result.nameAvailabilityCheck?.suggestedAlternatives.length).toBeGreaterThan(0);
    });
  });

  describe('lookupGstnTaxpayer', () => {
    it('should parse state and taxpayer jurisdiction from GSTIN', async () => {
      mockPrismaService.governmentIntegrationLog.create.mockResolvedValue({});

      const result = await service.lookupGstnTaxpayer('org-1', '07AAAAA0000A1Z5');
      expect(result.gstin).toBe('07AAAAA0000A1Z5');
      expect(result.principalAddress.state).toBe('Delhi');
      expect(result.gstinStatus).toBe('ACTIVE');
      expect(mockPrismaService.governmentIntegrationLog.create).toHaveBeenCalled();
    });
  });

  describe('initiateAaConsent', () => {
    it('should initiate RBI Account Aggregator consent request', async () => {
      mockPrismaService.governmentIntegrationLog.create.mockResolvedValue({});

      const result = await service.initiateAaConsent('org-1', {
        customerId: 'cust-123',
        mobile: '9876543210',
        fipId: 'HDFC',
        statementMonthsCount: 6,
      });

      expect(result.consentId).toMatch(/^AA_CONSENT_/);
      expect(result.fipName).toBe('HDFC Bank Limited');
      expect(result.status).toBe('PENDING');
      expect(mockPrismaService.governmentIntegrationLog.create).toHaveBeenCalled();
    });
  });

  describe('getIntegrationsHealth', () => {
    it('should return operational status and latency for all gateways', async () => {
      const health = await service.getIntegrationsHealth();
      expect(health.mcaGateway.status).toBe('OPERATIONAL');
      expect(health.gstnGateway.status).toBe('OPERATIONAL');
      expect(health.incomeTaxGateway.status).toBe('OPERATIONAL');
      expect(health.accountAggregator.status).toBe('OPERATIONAL');
    });
  });
});
