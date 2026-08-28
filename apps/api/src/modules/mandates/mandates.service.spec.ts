import { Test, TestingModule } from '@nestjs/testing';
import { MandatesService } from './mandates.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const mockPrismaService = {
  customer: {
    findFirst: jest.fn(),
  },
  subscriptionMandate: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('MandatesService', () => {
  let service: MandatesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MandatesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MandatesService>(MandatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMandate', () => {
    it('should create an active subscription mandate', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'cust-1',
        firstName: 'Vikas',
        lastName: 'Gupta',
      });

      mockPrismaService.subscriptionMandate.create.mockResolvedValue({
        id: 'mandate-1',
        organizationId: 'org-1',
        customerId: 'cust-1',
        planName: 'Annual ROC Compliance Retainer',
        frequency: 'MONTHLY',
        amount: 2999,
        status: 'ACTIVE',
        gatewayMandateId: 'mandate_rzp_12345',
        paymentMethod: 'UPI_AUTOPAY',
        nextBillingDate: new Date(),
        lastBilledDate: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: { firstName: 'Vikas', lastName: 'Gupta' },
        service: { name: 'ROC Annual Compliance' },
      });

      const res = await service.createMandate('org-1', {
        customerId: 'cust-1',
        planName: 'Annual ROC Compliance Retainer',
        frequency: 'MONTHLY',
        amount: 2999,
        paymentMethod: 'UPI_AUTOPAY',
      });

      expect(res.id).toBe('mandate-1');
      expect(res.customerName).toBe('Vikas Gupta');
      expect(res.amount).toBe(2999);
      expect(res.status).toBe('ACTIVE');
    });
  });

  describe('executeDebit', () => {
    it('should process auto-debit and update next billing date', async () => {
      mockPrismaService.subscriptionMandate.findFirst.mockResolvedValue({
        id: 'mandate-1',
        organizationId: 'org-1',
        customerId: 'cust-1',
        planName: 'Annual ROC Compliance Retainer',
        frequency: 'MONTHLY',
        amount: 2999,
        status: 'ACTIVE',
        paymentMethod: 'UPI_AUTOPAY',
        nextBillingDate: new Date(),
        customer: { firstName: 'Vikas', lastName: 'Gupta' },
      });

      mockPrismaService.subscriptionMandate.update.mockResolvedValue({
        id: 'mandate-1',
      });

      const result = await service.executeDebit('org-1', 'mandate-1');
      expect(result.success).toBe(true);
      expect(result.status).toBe('CAPTURED');
      expect(result.amountDebited).toBe(2999);
      expect(result.transactionId).toBeDefined();
    });
  });
});
