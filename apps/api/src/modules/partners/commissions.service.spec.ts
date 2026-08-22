import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from './commissions.service';
import { PayoutsService } from './payouts.service';
import { PartnersService } from './partners.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@cc/types';

describe('Partner Management & Commission Engine (Vertical Slice 1.9 - ADR-011 & ADR-014)', () => {
  let commissionsService: CommissionsService;
  let payoutsService: PayoutsService;
  let partnersService: PartnersService;
  let prisma: any;
  let notificationsService: any;

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

  const mockEmployee = {
    id: 'user-emp-1',
    organizationId: 'org-test-1',
    email: 'ops@crazycapital.in',
    roles: [UserRole.EMPLOYEE],
  };

  const mockPartnerUser = {
    id: 'user-partner-1',
    organizationId: 'org-test-1',
    firstName: 'Vikram',
    lastName: 'Aditya',
    email: 'vikram@adityaca.com',
    mobile: '+919811122233',
    roles: [UserRole.PARTNER],
  };

  const mockApplication = {
    id: 'app-101',
    organizationId: 'org-test-1',
    partnerId: 'user-partner-1',
    applicationNumber: 'CC-2026-000042',
    status: 'IN_PROGRESS',
    customer: {
      id: 'cust-1',
      firstName: 'Ankit',
      lastName: 'Verma',
      email: 'ankit@verma.in',
      mobile: '+919988776655',
    },
  };

  const mockService = {
    id: 'srv-1',
    name: 'Private Limited Company Incorporation',
    slug: 'pvt-ltd-incorporation',
  };

  const mockPendingCommission = {
    id: 'comm-101',
    applicationId: 'app-101',
    serviceId: 'srv-1',
    partnerId: 'user-partner-1',
    baseAmount: '14999.00',
    rate: '10.00',
    amount: '1499.90',
    status: 'PENDING',
    approvedById: null,
    approvedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    application: mockApplication,
    service: mockService,
    partner: mockPartnerUser,
    payouts: [],
  };

  beforeEach(async () => {
    prisma = {
      commission: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      payout: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      lead: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      leadSource: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      leadActivity: {
        create: jest.fn(),
      },
      servicePricing: {
        findFirst: jest.fn(),
      },
      application: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    notificationsService = {
      dispatchMultiChannel: jest.fn().mockResolvedValue([{ id: 'log-1', status: 'SENT' }]),
      send: jest.fn().mockResolvedValue({ id: 'log-1', status: 'SENT' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        PayoutsService,
        PartnersService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    commissionsService = module.get<CommissionsService>(CommissionsService);
    payoutsService = module.get<PayoutsService>(PayoutsService);
    partnersService = module.get<PartnersService>(PartnersService);
  });

  describe('1. Commission Calculation Engine', () => {
    it('should calculate standard 10% commission and create PENDING record', async () => {
      prisma.commission.findFirst.mockResolvedValue(null);
      prisma.servicePricing.findFirst.mockResolvedValue(null); // default 10%
      prisma.commission.create.mockResolvedValue(mockPendingCommission);

      const result = await commissionsService.calculateCommission({
        applicationId: 'app-101',
        serviceId: 'srv-1',
        partnerId: 'user-partner-1',
        baseAmount: 14999,
        organizationId: 'org-test-1',
      });

      expect(result.status).toBe('PENDING');
      expect(result.amount).toBe(1499.9);
      expect(prisma.commission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            partnerId: 'user-partner-1',
          }),
        }),
      );
      expect(notificationsService.dispatchMultiChannel).toHaveBeenCalled();
    });
  });

  describe('2. ADR-011: Admin-Only Commission Approval Enforcement', () => {
    it('should allow Admin to approve commission, transition to APPROVED, queue payout, and dispatch notification', async () => {
      prisma.commission.findUnique.mockResolvedValue(mockPendingCommission);
      prisma.commission.update.mockResolvedValue({
        ...mockPendingCommission,
        status: 'APPROVED',
        approvedById: mockAdminUser.id,
        approvedAt: new Date(),
      });
      prisma.payout.create.mockResolvedValue({
        id: 'payout-1',
        commissionId: 'comm-101',
        status: 'PENDING_PAYOUT',
      });

      const result = await commissionsService.approveCommission(
        'comm-101',
        { notes: 'Verified GST invoice and client delivery' },
        mockAdminUser,
      );

      expect(result.status).toBe('APPROVED');
      expect(prisma.commission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comm-101' },
          data: expect.objectContaining({ status: 'APPROVED', approvedById: mockAdminUser.id }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'commission.approve' }),
        }),
      );
      expect(notificationsService.dispatchMultiChannel).toHaveBeenCalled();
    });

    it('should REJECT Branch Manager approval with 403 Forbidden under ADR-011', async () => {
      await expect(
        commissionsService.approveCommission('comm-101', {}, mockBranchManager),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.commission.update).not.toHaveBeenCalled();
    });

    it('should REJECT Employee approval with 403 Forbidden under ADR-011', async () => {
      await expect(
        commissionsService.approveCommission('comm-101', {}, mockEmployee),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. ADR-011: Commission Rejection with Reason', () => {
    it('should allow Admin to reject commission and record structured reason', async () => {
      prisma.commission.findUnique.mockResolvedValue(mockPendingCommission);
      prisma.commission.update.mockResolvedValue({
        ...mockPendingCommission,
        status: 'REJECTED',
        rejectionReason: 'Referred lead was already an existing direct customer',
      });

      const result = await commissionsService.rejectCommission(
        'comm-101',
        { reason: 'Referred lead was already an existing direct customer' },
        mockAdminUser,
      );

      expect(result.status).toBe('REJECTED');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('4. ADR-014: Manual UTR Bank Payout Recording', () => {
    it('should record manual UTR payout, transition Commission & Payout to PAID, and notify partner', async () => {
      const approvedCommission = {
        ...mockPendingCommission,
        status: 'APPROVED',
        payouts: [
          {
            id: 'payout-1',
            status: 'PENDING_PAYOUT',
            amount: '1499.90',
          },
        ],
      };

      prisma.commission.findUnique.mockResolvedValue(approvedCommission);
      prisma.payout.update.mockResolvedValue({
        id: 'payout-1',
        commissionId: 'comm-101',
        partnerId: 'user-partner-1',
        amount: '1499.90',
        paymentMethod: 'BANK_TRANSFER',
        status: 'PAID',
        referenceNumber: 'AXISN26223847291',
        paidAt: new Date(),
        partner: mockPartnerUser,
        commission: approvedCommission,
      });

      const result = await payoutsService.recordManualPayout(
        {
          commissionId: 'comm-101',
          referenceNumber: 'AXISN26223847291',
          paymentMethod: 'BANK_TRANSFER',
          notes: 'NEFT transferred to Axis Bank A/c ending 4821',
        },
        mockAdminUser,
      );

      expect(result.status).toBe('PAID');
      expect(result.referenceNumber).toBe('AXISN26223847291');
      expect(prisma.commission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comm-101' },
          data: { status: 'PAID' },
        }),
      );
      expect(notificationsService.dispatchMultiChannel).toHaveBeenCalled();
    });

    it('should block non-Admin from recording manual payouts', async () => {
      await expect(
        payoutsService.recordManualPayout(
          { commissionId: 'comm-101', referenceNumber: 'UTR-123' },
          mockEmployee,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Partner Referral Lead Submission & Case Tracker', () => {
    it('should submit lead tagged to partner and record lead activity', async () => {
      prisma.leadSource.findFirst.mockResolvedValue({ id: 'src-partner', code: 'PARTNER_REFERRAL' });
      prisma.lead.create.mockResolvedValue({
        id: 'lead-201',
        firstName: 'Siddharth',
        lastName: 'Rao',
        mobile: '+919765432109',
        status: 'NEW',
        createdAt: new Date(),
      });

      const result = await partnersService.submitPartnerLead(
        {
          firstName: 'Siddharth',
          lastName: 'Rao',
          mobile: '+919765432109',
          email: 'siddharth@raoenterprises.com',
          companyName: 'Rao Enterprises',
          serviceInterest: 'GST Registration',
          notes: 'Urgent filing required before end of month',
        },
        mockPartnerUser,
      );

      expect(result.success).toBe(true);
      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            partnerId: mockPartnerUser.id,
            firstName: 'Siddharth',
          }),
        }),
      );
      expect(notificationsService.dispatchMultiChannel).toHaveBeenCalled();
    });

    it('should return partner statistics correctly', async () => {
      prisma.lead.count
        .mockResolvedValueOnce(12) // total leads
        .mockResolvedValueOnce(5); // converted leads
      prisma.application.count.mockResolvedValue(3); // active cases
      prisma.commission.findMany.mockResolvedValue([
        { amount: '1500.00', status: 'PAID' },
        { amount: '2500.00', status: 'APPROVED' },
        { amount: '1000.00', status: 'PENDING' },
      ]);

      const stats = await partnersService.getPartnerStats(mockPartnerUser);

      expect(stats.totalLeads).toBe(12);
      expect(stats.convertedLeads).toBe(5);
      expect(stats.activeCases).toBe(3);
      expect(stats.totalCommissionEarned).toBe(5000);
      expect(stats.paidCommission).toBe(1500);
      expect(stats.approvedCommission).toBe(2500);
      expect(stats.pendingCommission).toBe(1000);
    });
  });
});
