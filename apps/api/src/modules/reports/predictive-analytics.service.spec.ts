import { Test, TestingModule } from '@nestjs/testing';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('PredictiveAnalyticsService', () => {
  let service: PredictiveAnalyticsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      lead: {
        findMany: jest.fn(),
      },
      application: {
        count: jest.fn(),
      },
      predictiveForecastRecord: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictiveAnalyticsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PredictiveAnalyticsService>(PredictiveAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRevenueForecast', () => {
    it('should calculate weighted revenue and optimistic/conservative confidence bounds', async () => {
      const mockLeads = [
        { id: 'l1', status: 'PROPOSAL_SENT', leadScore: 90, serviceInterest: 'pvt-ltd-incorporation' },
        { id: 'l2', status: 'QUALIFIED', leadScore: 75, serviceInterest: 'trademark-registration' },
      ];

      prisma.lead.findMany.mockResolvedValue(mockLeads);
      prisma.predictiveForecastRecord.upsert.mockResolvedValue({ id: 'rec-1' });

      const res = await service.getRevenueForecast('NEXT_30_DAYS', null, { organizationId: 'org-1' });

      expect(res.baseRevenue).toBeGreaterThan(0);
      expect(res.optimisticRevenue).toBeGreaterThan(res.baseRevenue);
      expect(res.conservativeRevenue).toBeLessThan(res.baseRevenue);
      expect(res.projectedConversions).toBeGreaterThan(0);
      expect(res.projectedPartnerCommissions).toBeGreaterThan(0);
    });
  });

  describe('getTurnaroundAnalytics', () => {
    it('should compute stage turnaround stats and bottleneck identification', async () => {
      prisma.application.count.mockResolvedValue(25);

      const res = await service.getTurnaroundAnalytics(null, { organizationId: 'org-1' });

      expect(res.overallAvgHours).toBeDefined();
      expect(res.fastestStageName).toBe('Digital Signature & KYC');
      expect(res.slowestStageName).toBe('MCA / CRC Government Approval');
      expect(res.stagesAtRiskCount).toBe(3);
    });
  });

  describe('getBottleneckRadar', () => {
    it('should return prioritized list of stages at risk of SLA breach', async () => {
      const res = await service.getBottleneckRadar({ organizationId: 'org-1' });

      expect(res.length).toBeGreaterThan(0);
      expect(res[0].stageName).toContain('MCA');
      expect(res[0].bottleneckSeverity).toBe('HIGH');
      expect(res[0].breachRiskProbability).toBeGreaterThan(0.5);
    });
  });
});
