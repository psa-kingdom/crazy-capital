import { Test, TestingModule } from '@nestjs/testing';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('ReferralsService', () => {
  let service: ReferralsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      partnerProfile: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      referralAttribution: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      partnerReferralTree: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  it('should block self-referral attempts', async () => {
    prisma.partnerProfile.findUnique.mockResolvedValue({
      userId: 'user-partner-1',
      partnerCode: 'CC-PTR-0001',
    });

    await expect(
      service.attributeReferral({
        referralCode: 'CC-PTR-0001',
        referredUserId: 'user-partner-1', // Self referral
        organizationId: 'org-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should detect and prevent circular referral hierarchies (A -> B -> A)', async () => {
    // Tree: user-B's parent is user-A
    prisma.partnerReferralTree.findUnique
      .mockResolvedValueOnce({ parentPartnerId: 'user-A' })
      .mockResolvedValueOnce(null);

    const isCircular = await service.checkCircularReferral('user-B', 'user-A');
    expect(isCircular).toBe(true);
  });

  it('should successfully attribute direct referral when valid', async () => {
    prisma.partnerProfile.findUnique.mockResolvedValue({
      userId: 'user-partner-1',
      partnerCode: 'CC-PTR-0001',
    });
    prisma.referralAttribution.findFirst.mockResolvedValue(null);
    prisma.referralAttribution.create.mockResolvedValue({
      id: 'attr-1',
      referrerId: 'user-partner-1',
      leadId: 'lead-1',
      referralCode: 'CC-PTR-0001',
      tierLevel: 'TIER_1_DIRECT',
      status: 'PENDING',
      attributedAt: new Date(),
    });

    const result = await service.attributeReferral({
      referralCode: 'CC-PTR-0001',
      leadId: 'lead-1',
      organizationId: 'org-1',
    });

    expect(result.referralCode).toBe('CC-PTR-0001');
    expect(result.tierLevel).toBe('TIER_1_DIRECT');
  });
});
