import { Test, TestingModule } from '@nestjs/testing';
import { PayoutsService } from './payouts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RazorpayXPayoutProvider } from './providers/razorpayx-payout.provider';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@cc/types';

describe('PayoutsService (Vertical Slice 2.5 — RazorpayX Automated Partner Payouts)', () => {
  let payoutsService: PayoutsService;
  let prisma: any;
  let notificationsService: any;
  let payoutProvider: any;

  const mockAdminUser = {
    id: 'user-admin-1',
    organizationId: 'org-test-1',
    email: 'admin@crazycapital.in',
    roles: [UserRole.ADMIN],
  };

  const mockBranchManager = {
    id: 'user-bm-1',
    organizationId: 'org-test-1',
    email: 'bm.noida@crazycapital.in',
    roles: [UserRole.BRANCH_MANAGER],
  };

  const mockPartnerUser = {
    id: 'user-partner-1',
    organizationId: 'org-test-1',
    firstName: 'Vikram',
    lastName: 'Aditya',
    email: 'vikram@adityaca.com',
    mobile: '+919811122233',
    bankAccountNumber: '50100456789123',
    bankIfsc: 'HDFC0001234',
    bankAccountName: 'Aditya & Associates',
    roles: [UserRole.PARTNER],
  };

  const mockApprovedCommission = {
    id: 'comm-100',
    applicationId: 'app-42',
    serviceId: 'srv-pvt-ltd',
    partnerId: 'user-partner-1',
    baseAmount: 7999,
    rate: 10,
    amount: 799.9,
    status: 'APPROVED',
    approvedById: 'user-admin-1',
    approvedAt: new Date(),
    partner: mockPartnerUser,
    service: { id: 'srv-pvt-ltd', name: 'Private Limited Incorporation' },
    application: { id: 'app-42', applicationNumber: 'CC-2026-000042' },
    payouts: [],
  };

  beforeEach(async () => {
    prisma = {
      payout: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'payout-1',
            amount: 799.9,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }),
        ),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'payout-1',
            amount: 799.9,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }),
        ),
        count: jest.fn().mockResolvedValue(1),
      },
      commission: {
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
    };

    notificationsService = {
      dispatchMultiChannel: jest.fn().mockResolvedValue({ success: true }),
    };

    payoutProvider = {
      isConfigured: jest.fn().mockReturnValue(false), // Mock mode
      initiatePayout: jest.fn().mockResolvedValue({
        success: true,
        providerPayoutId: 'pout_mock_12345',
        fundAccountId: 'fa_mock_123',
        contactId: 'cont_mock_123',
        status: 'PAID',
        utr: 'UTR998877665544',
      }),
      getPayoutStatus: jest.fn().mockResolvedValue({
        providerPayoutId: 'pout_mock_12345',
        status: 'PAID',
        utr: 'UTR998877665544',
      }),
      getAccountBalance: jest.fn().mockResolvedValue({
        balance: 1450000.0,
        currency: 'INR',
        accountNumber: '2323230045678901',
        isSandbox: true,
        status: 'ACTIVE_HEALTHY',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: RazorpayXPayoutProvider, useValue: payoutProvider },
      ],
    }).compile();

    payoutsService = module.get<PayoutsService>(PayoutsService);
  });

  describe('1. Role-Based Authorization & Approval Boundaries (ADR-011)', () => {
    it('should reject non-admin users attempting to execute automated payouts with 403 Forbidden', async () => {
      await expect(
        payoutsService.executePayout(
          { commissionId: 'comm-100' },
          mockBranchManager,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        payoutsService.executePayout(
          { commissionId: 'comm-100' },
          mockPartnerUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Super Admin or Admin to execute automated payouts', async () => {
      prisma.commission.findUnique.mockResolvedValueOnce({
        ...mockApprovedCommission,
        payouts: [],
      });

      const result = await payoutsService.executePayout(
        { commissionId: 'comm-100', mode: 'IMPS' },
        mockAdminUser,
      );

      expect(result).toBeDefined();
      expect(result.amount).toBe(799.9);
      expect(payoutProvider.initiatePayout).toHaveBeenCalled();
    });
  });

  describe('2. Financial Invariants & Commission Status Validation', () => {
    it('should throw NotFoundException if commission does not exist', async () => {
      prisma.commission.findUnique.mockResolvedValueOnce(null);

      await expect(
        payoutsService.executePayout(
          { commissionId: 'non-existent-comm' },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if commission is still PENDING approval', async () => {
      prisma.commission.findUnique.mockResolvedValueOnce({
        ...mockApprovedCommission,
        status: 'PENDING',
      });

      await expect(
        payoutsService.executePayout(
          { commissionId: 'comm-100' },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent duplicate payouts for already PAID or PROCESSING commissions', async () => {
      prisma.commission.findUnique.mockResolvedValueOnce({
        ...mockApprovedCommission,
        payouts: [
          {
            id: 'existing-payout-1',
            status: 'PAID',
            amount: 799.9,
          },
        ],
      });

      await expect(
        payoutsService.executePayout(
          { commissionId: 'comm-100' },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Idempotent Execution & Automated Payout Flow', () => {
    it('should derive payable amount server-side from commission and disburse via RazorpayX', async () => {
      prisma.commission.findUnique.mockResolvedValueOnce({
        ...mockApprovedCommission,
        payouts: [],
      });

      const result = await payoutsService.executePayout(
        {
          commissionId: 'comm-100',
          mode: 'IMPS',
          notes: 'Automated referral fee disbursement',
        },
        mockAdminUser,
      );

      expect(payoutProvider.initiatePayout).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 799.9,
          currency: 'INR',
          mode: 'IMPS',
          idempotencyKey: expect.stringContaining('payout:comm_comm-100:'),
        }),
      );

      expect(prisma.commission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comm-100' },
          data: { status: 'PAID' },
        }),
      );

      expect(notificationsService.dispatchMultiChannel).toHaveBeenCalledWith(
        'payout.processed',
        expect.objectContaining({ email: 'vikram@adityaca.com' }),
        expect.objectContaining({ amount: 799.9, referenceNumber: 'UTR998877665544' }),
        expect.any(Object),
      );
    });

    it('should handle provider failure safely without crashing transaction', async () => {
      prisma.commission.findUnique.mockResolvedValueOnce({
        ...mockApprovedCommission,
        payouts: [],
      });

      payoutProvider.initiatePayout.mockResolvedValueOnce({
        success: false,
        providerPayoutId: 'pout_err_123',
        status: 'FAILED',
        failureReason: 'Beneficiary Bank IFSC code invalid or branch merged',
      });

      const result = await payoutsService.executePayout(
        { commissionId: 'comm-100', mode: 'IMPS' },
        mockAdminUser,
      );

      expect(result.status).toBe('FAILED');
      expect(result.failureReason).toBe(
        'Beneficiary Bank IFSC code invalid or branch merged',
      );
      // Commission should NOT be marked PAID
      expect(prisma.commission.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'PAID' } }),
      );
    });
  });

  describe('4. Payout Retry Flow & Operational Health', () => {
    it('should allow retrying a FAILED payout with new idempotency key', async () => {
      prisma.payout.findUnique.mockResolvedValueOnce({
        id: 'payout-failed-1',
        commissionId: 'comm-100',
        partnerId: 'user-partner-1',
        status: 'FAILED',
        amount: 799.9,
        payoutMode: 'IMPS',
        failureReason: 'Bank network timeout',
        commission: {
          ...mockApprovedCommission,
          payouts: [],
        },
      });

      prisma.commission.findUnique.mockResolvedValueOnce({
        ...mockApprovedCommission,
        payouts: [],
      });

      const result = await payoutsService.retryPayout(
        'payout-failed-1',
        { newMode: 'NEFT', notes: 'Retrying with NEFT route' },
        mockAdminUser,
      );

      expect(result).toBeDefined();
      expect(payoutProvider.initiatePayout).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'NEFT',
          idempotencyKey: expect.stringContaining('retry:'),
        }),
      );
    });

    it('should retrieve live RazorpayX operational account balance for Admin', async () => {
      const balance = await payoutsService.getRazorpayXBalance(mockAdminUser);
      expect(balance.balance).toBe(1450000.0);
      expect(balance.isSandbox).toBe(true);
      expect(balance.status).toBe('ACTIVE_HEALTHY');
    });
  });
});
