import { Test, TestingModule } from '@nestjs/testing';
import { LeadScoringService } from './lead-scoring.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LeadScoreGrade } from '@cc/types';

describe('LeadScoringService', () => {
  let service: LeadScoringService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      lead: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      leadScoreRecord: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadScoringService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LeadScoringService>(LeadScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateScore', () => {
    it('should assign A_HOT grade (>80) for high-intent fresh Pvt Ltd inquiry with company and corporate email', async () => {
      const mockLead = {
        id: 'lead-123',
        organizationId: 'org-1',
        firstName: 'Ankit',
        lastName: 'Sharma',
        email: 'ankit@innovatetech.io',
        mobile: '9876543210',
        companyName: 'Innovate Tech Solutions Pvt Ltd',
        serviceInterest: 'pvt-ltd-incorporation',
        utmSource: 'WEBSITE',
        createdAt: new Date(),
        activities: [{ id: 'act-1' }, { id: 'act-2' }, { id: 'act-3' }],
        partnerId: 'partner-1',
        source: { code: 'WEBSITE', name: 'Direct Website' },
      };

      prisma.lead.findUnique.mockResolvedValue(mockLead);
      prisma.leadScoreRecord.create.mockImplementation(({ data }: any) => ({
        id: 'score-rec-1',
        ...data,
        calculatedAt: new Date(),
      }));
      prisma.lead.update.mockResolvedValue(mockLead);

      const result = await service.calculateScore('lead-123');

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.grade).toBe(LeadScoreGrade.A_HOT);
      expect(result.conversionProbability).toBe(0.85);
      expect(result.predictedDealValue).toBe(9999);
      expect(result.scoreFactors.length).toBe(5);
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-123' },
        data: { leadScore: result.score },
      });
    });

    it('should assign D_UNQUALIFIED (<40) for cold incomplete lead', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

      const mockLead = {
        id: 'lead-cold-1',
        organizationId: 'org-1',
        firstName: 'Test',
        lastName: 'User',
        email: null,
        mobile: '12345',
        companyName: null,
        serviceInterest: null,
        utmSource: 'COLD_OUTREACH',
        createdAt: pastDate,
        activities: [],
        partnerId: null,
        source: { code: 'COLD_OUTREACH', name: 'Cold Outreach' },
      };

      prisma.lead.findUnique.mockResolvedValue(mockLead);
      prisma.leadScoreRecord.create.mockImplementation(({ data }: any) => ({
        id: 'score-rec-2',
        ...data,
        calculatedAt: new Date(),
      }));
      prisma.lead.update.mockResolvedValue(mockLead);

      const result = await service.calculateScore('lead-cold-1');

      expect(result.score).toBeLessThan(40);
      expect(result.grade).toBe(LeadScoreGrade.D_UNQUALIFIED);
      expect(result.conversionProbability).toBe(0.10);
    });
  });

  describe('getPriorityQueue', () => {
    it('should return ranked leads sorted by score', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          firstName: 'Rahul',
          lastName: 'Mehta',
          mobile: '9811122233',
          leadScore: 92,
          serviceInterest: 'pvt-ltd-incorporation',
          status: 'NEW',
          updatedAt: new Date(),
          createdAt: new Date(),
          scoreRecords: [{ score: 92, grade: 'A_HOT', conversionProbability: 0.85, predictedDealValue: 9999, recommendedAction: 'Call now' }],
        },
      ];

      prisma.lead.findMany.mockResolvedValue(mockLeads);
      prisma.lead.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      const result = await service.getPriorityQueue({}, { organizationId: 'org-1' });

      expect(result.items.length).toBe(1);
      expect(result.items[0].score).toBe(92);
      expect(result.items[0].priorityRank).toBe('URGENT');
      expect(result.highPriorityCount).toBe(1);
    });
  });
});
