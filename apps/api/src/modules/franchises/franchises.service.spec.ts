import { Test, TestingModule } from '@nestjs/testing';
import { FranchisesService } from './franchises.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('FranchisesService', () => {
  let service: FranchisesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      franchise: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FranchisesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FranchisesService>(FranchisesService);
  });

  it('should create franchise instance with default 70% revenue share', async () => {
    prisma.franchise.findUnique.mockResolvedValue(null);
    prisma.franchise.create.mockResolvedValue({
      id: 'fr-1',
      organizationId: 'org-1',
      name: 'Noida Central Franchise',
      code: 'FR-NOIDA-01',
      franchiseType: 'CITY_FRANCHISE',
      revenueSharePct: 70.0,
      settlementFrequency: 'MONTHLY',
      securityDeposit: 500000,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createFranchise('org-1', {
      name: 'Noida Central Franchise',
      code: 'FR-NOIDA-01',
    });

    expect(result.code).toBe('FR-NOIDA-01');
    expect(result.revenueSharePct).toBe(70.0);
  });
});
