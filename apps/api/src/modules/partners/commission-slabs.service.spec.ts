import { Test, TestingModule } from '@nestjs/testing';
import { CommissionSlabsService } from './commission-slabs.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PartnerTier } from '@cc/types';

describe('CommissionSlabsService', () => {
  let service: CommissionSlabsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      partnerProfile: {
        findUnique: jest.fn(),
      },
      service: {
        findUnique: jest.fn(),
      },
      commissionSlabRule: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionSlabsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CommissionSlabsService>(CommissionSlabsService);
  });

  it('should resolve default baseline rates when no custom commission slab exists (Silver=10%, Gold=15%, Platinum=20%)', async () => {
    prisma.partnerProfile.findUnique.mockResolvedValue({ tier: PartnerTier.GOLD });
    prisma.service.findUnique.mockResolvedValue({ id: 'srv-1', categoryId: 'cat-1' });
    prisma.commissionSlabRule.findFirst.mockResolvedValue(null);

    const result = await service.getApplicableRate({
      partnerId: 'p-1',
      serviceId: 'srv-1',
      organizationId: 'org-1',
    });

    expect(result.rate).toBe(15.0);
    expect(result.tier).toBe('GOLD');
    expect(result.flatBonus).toBe(0);
  });

  it('should prioritize service-specific slab rule when configured', async () => {
    prisma.partnerProfile.findUnique.mockResolvedValue({ tier: PartnerTier.PLATINUM });
    prisma.service.findUnique.mockResolvedValue({ id: 'srv-pvt-ltd', categoryId: 'cat-incorp' });
    prisma.commissionSlabRule.findFirst.mockResolvedValue({
      id: 'slab-custom-1',
      ratePercentage: 25.0,
      flatBonusAmount: 500,
      tier: 'PLATINUM',
    });

    const result = await service.getApplicableRate({
      partnerId: 'p-1',
      serviceId: 'srv-pvt-ltd',
      organizationId: 'org-1',
    });

    expect(result.rate).toBe(25.0);
    expect(result.flatBonus).toBe(500);
    expect(result.ruleId).toBe('slab-custom-1');
  });
});
