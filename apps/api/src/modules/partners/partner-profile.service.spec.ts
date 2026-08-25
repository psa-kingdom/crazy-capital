import { Test, TestingModule } from '@nestjs/testing';
import { PartnerProfileService } from './partner-profile.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PartnerTier, PartnerKycStatus, PartnerType } from '@cc/types';

describe('PartnerProfileService', () => {
  let service: PartnerProfileService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      partnerProfile: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn().mockResolvedValue(5),
      },
      commission: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      payout: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      lead: {
        count: jest.fn().mockResolvedValue(12),
      },
      application: {
        count: jest.fn().mockResolvedValue(8),
      },
      user: {
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerProfileService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PartnerProfileService>(PartnerProfileService);
  });

  it('should initialize a new PartnerProfile with unique partnerCode if none exists', async () => {
    prisma.partnerProfile.findUnique.mockResolvedValue(null);
    prisma.partnerProfile.create.mockResolvedValue({
      id: 'prof-1',
      userId: 'user-p1',
      partnerCode: 'CC-PTR-0006',
      partnerType: 'INDIVIDUAL',
      tier: 'SILVER',
      kycStatus: 'PENDING_KYC',
      lifetimeEarnings: 0,
      lifetimeConversions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.getOrCreateProfile('user-p1', 'org-1');
    expect(result.partnerCode).toBe('CC-PTR-0006');
    expect(result.tier).toBe('SILVER');
    expect(prisma.partnerProfile.create).toHaveBeenCalled();
  });

  it('should mask PAN, Aadhaar, and Bank Account on KYC submission', async () => {
    prisma.partnerProfile.findUnique.mockResolvedValue({
      id: 'prof-1',
      userId: 'user-p1',
      partnerCode: 'CC-PTR-0001',
      tier: 'SILVER',
      kycStatus: 'PENDING_KYC',
      lifetimeEarnings: 0,
      lifetimeConversions: 0,
    });

    prisma.partnerProfile.update.mockImplementation(({ data }) => ({
      id: 'prof-1',
      userId: 'user-p1',
      partnerCode: 'CC-PTR-0001',
      tier: 'SILVER',
      kycStatus: data.kycStatus,
      panMasked: data.panMasked,
      aadhaarMasked: data.aadhaarMasked,
      bankAccountNumberMasked: data.bankAccountNumberMasked,
      lifetimeEarnings: 0,
      lifetimeConversions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const updated = await service.updateKyc('user-p1', {
      pan: 'ABCDE1234F',
      aadhaar: '123456789012',
      bankAccountNumber: '9876543210',
      bankIfsc: 'HDFC0001234',
    });

    expect(updated.panMasked).toBe('AB•••••4F');
    expect(updated.aadhaarMasked).toBe('•••• •••• 9012');
    expect(updated.bankAccountNumberMasked).toBe('••••••••3210');
    expect(updated.kycStatus).toBe('UNDER_REVIEW');
  });

  it('should upgrade partner tier to GOLD and PLATINUM upon reaching conversion milestones', async () => {
    prisma.partnerProfile.findUnique.mockResolvedValue({
      id: 'prof-1',
      userId: 'user-p1',
      tier: 'SILVER',
      lifetimeEarnings: 30000,
      lifetimeConversions: 20, // Threshold for GOLD is 15
    });

    prisma.partnerProfile.update.mockResolvedValue({});

    const result = await service.recalculateTier('user-p1');
    expect(result.upgraded).toBe(true);
    expect(result.newTier).toBe(PartnerTier.GOLD);
  });
});
