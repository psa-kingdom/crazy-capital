import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      coupon: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      couponRedemption: {
        count: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((fn) => Promise.all(fn)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  it('should validate percentage coupon and apply max discount cap', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: 'cpn-1',
      code: 'DIWALI20',
      discountType: 'PERCENTAGE',
      discountValue: 20, // 20%
      maxDiscountAmount: 2000, // Capped at ₹2,000
      status: 'ACTIVE',
      currentUsageCount: 5,
      maxTotalUsage: 100,
      maxUsagePerCustomer: 1,
      applicableServiceIds: [],
      applicableFranchiseIds: [],
    });
    prisma.couponRedemption.count.mockResolvedValue(0);

    // Order amount = ₹20,000. 20% is ₹4,000, but capped at ₹2,000
    const result = await service.validateCoupon({
      code: 'DIWALI20',
      customerId: 'cust-1',
      serviceId: 'srv-1',
      orderAmount: 20000,
    });

    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(2000);
    expect(result.finalAmount).toBe(18000);
  });

  it('should reject coupon if customer usage limit exceeded', async () => {
    prisma.coupon.findUnique.mockResolvedValue({
      id: 'cpn-1',
      code: 'WELCOME500',
      status: 'ACTIVE',
      maxUsagePerCustomer: 1,
      currentUsageCount: 10,
      applicableServiceIds: [],
      applicableFranchiseIds: [],
    });
    prisma.couponRedemption.count.mockResolvedValue(1); // Already used once

    await expect(
      service.validateCoupon({
        code: 'WELCOME500',
        customerId: 'cust-1',
        serviceId: 'srv-1',
        orderAmount: 5000,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
