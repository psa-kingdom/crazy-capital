import { Test, TestingModule } from '@nestjs/testing';
import { FranchiseSettlementsService } from './franchise-settlements.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('FranchiseSettlementsService', () => {
  let service: FranchiseSettlementsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      franchise: {
        findUnique: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
      },
      franchiseSettlement: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FranchiseSettlementsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FranchiseSettlementsService>(FranchiseSettlementsService);
  });

  it('should calculate accurate 70% franchise share and 30% Crazy Capital retained revenue', async () => {
    prisma.franchise.findUnique.mockResolvedValue({
      id: 'fr-1',
      name: 'Delhi Connaught Place Hub',
      branchId: 'br-delhi',
      revenueSharePct: 70.0,
    });

    prisma.invoice.findMany.mockResolvedValue([
      { amount: 100000, taxAmount: 0 },
      { amount: 100000, taxAmount: 0 },
    ]); // Gross = ₹200,000

    prisma.franchiseSettlement.create.mockImplementation(({ data }) => ({
      ...data,
      id: 'fset-1',
    }));

    const result = await service.generateSettlement({
      franchiseId: 'fr-1',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
    });

    expect(Number(result.grossRevenue)).toBe(200000);
    expect(Number(result.franchiseShareAmount)).toBe(140000); // 70% of 200k
    expect(Number(result.crazyCapitalRetainedAmount)).toBe(60000); // 30% of 200k
    expect(Number(result.netPayableAmount)).toBe(140000);
  });
});
