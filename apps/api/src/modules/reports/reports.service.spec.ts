import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@cc/types';
import { ReportType, ExportFormat } from './dto/export-report.dto';

describe('Operational Dashboards & Reporting Engine (Vertical Slice 1.12)', () => {
  let reportsService: ReportsService;
  let prisma: any;

  const mockAdminUser = {
    id: 'user-admin-1',
    organizationId: 'org-test-1',
    roles: [UserRole.ADMIN],
  };

  const mockSuperAdminUser = {
    id: 'user-superadmin-1',
    organizationId: 'org-test-1',
    roles: [UserRole.SUPER_ADMIN],
  };

  const mockBranchManagerUser = {
    id: 'user-bm-1',
    organizationId: 'org-test-1',
    branchId: 'b-noida',
    roles: [UserRole.BRANCH_MANAGER],
  };

  const mockEmployeeUser = {
    id: 'user-emp-1',
    organizationId: 'org-test-1',
    roles: [UserRole.EMPLOYEE],
  };

  beforeEach(async () => {
    prisma = {
      branch: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
      },
      lead: {
        findMany: jest.fn(),
      },
      application: {
        findMany: jest.fn(),
      },
      commission: {
        findMany: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
      },
      document: {
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    reportsService = module.get<ReportsService>(ReportsService);
  });

  describe('1. RBAC & Data Isolation Scoping', () => {
    it('should allow Admin to view organization-wide metrics', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        { amount: '50000.00', status: 'PAID', taxAmount: '7627.12' },
      ]);
      prisma.lead.findMany.mockResolvedValue([
        { status: 'CONVERTED', sourceId: 'WEBSITE', leadScore: 90, createdAt: new Date() },
      ]);
      prisma.application.findMany.mockResolvedValue([]);
      prisma.commission.findMany.mockResolvedValue([]);
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await reportsService.getDashboard(mockAdminUser, {});
      expect(result.scope.isOrganizationWide).toBe(true);
      expect(result.kpis.totalRevenue).toBe(50000);
      expect(result.kpis.totalCollected).toBe(50000);
      expect(result.kpis.conversionRate).toBe(100);
    });

    it('should strictly lock Branch Manager to their assigned branch', async () => {
      prisma.branch.findUnique.mockResolvedValue({ name: 'Noida Branch' });
      prisma.invoice.findMany.mockResolvedValue([]);
      prisma.lead.findMany.mockResolvedValue([]);
      prisma.application.findMany.mockResolvedValue([]);
      prisma.commission.findMany.mockResolvedValue([]);
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await reportsService.getDashboard(mockBranchManagerUser, { branchId: 'b-mumbai' });
      // Forced to b-noida
      expect(result.scope.branchId).toBe('b-noida');
      expect(result.scope.branchName).toBe('Noida Branch');
      expect(result.scope.isOrganizationWide).toBe(false);
    });

    it('should throw ForbiddenException if user lacks executive or branch management role', async () => {
      await expect(
        reportsService.getDashboard(mockEmployeeUser, {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Revenue Analytics', () => {
    it('should aggregate revenue trends, service breakdowns, and 18% tax collections', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          amount: '20000.00',
          taxAmount: '3050.85',
          status: 'PAID',
          createdAt: new Date('2026-08-01T10:00:00Z'),
          application: {
            service: { id: 'srv-pvt', name: 'Pvt Ltd Incorporation' },
            branch: { id: 'b-noida', name: 'Noida Branch' },
          },
          customer: { branch: { id: 'b-noida', name: 'Noida Branch' } },
        },
        {
          id: 'inv-2',
          amount: '10000.00',
          taxAmount: '1525.42',
          status: 'SENT',
          createdAt: new Date('2026-08-02T10:00:00Z'),
          application: {
            service: { id: 'srv-gst', name: 'GST Registration' },
            branch: { id: 'b-delhi', name: 'Delhi Branch' },
          },
          customer: { branch: { id: 'b-delhi', name: 'Delhi Branch' } },
        },
      ];

      prisma.invoice.findMany.mockResolvedValue(mockInvoices);

      const report = await reportsService.getRevenueReport(mockAdminUser, {});

      expect(report.summary.totalInvoiced).toBe(30000);
      expect(report.summary.totalCollected).toBe(20000);
      expect(report.summary.paidInvoicesCount).toBe(1);
      expect(report.summary.invoicesCount).toBe(2);
      expect(report.trend.length).toBe(2);
      expect(report.byService.length).toBe(2);
      expect(report.byBranch.length).toBe(2);
    });
  });

  describe('3. CRM Leads & Conversion Reporting', () => {
    it('should aggregate lead volume, conversion rate, channels, and employee metrics', async () => {
      prisma.lead.findMany.mockResolvedValue([
        {
          id: 'l-1',
          status: 'CONVERTED',
          sourceId: 'PARTNER_REFERRAL',
          leadScore: 90,
          assignments: [{ assignedTo: 'user-emp-1' }],
        },
        {
          id: 'l-2',
          status: 'NEW',
          sourceId: 'WEBSITE',
          leadScore: 60,
          assignments: [{ assignedTo: 'user-emp-1' }],
        },
      ]);

      prisma.user.findMany.mockResolvedValue([
        { id: 'user-emp-1', firstName: 'Ravi', lastName: 'Kumar', email: 'ravi@crazycapital.in' },
      ]);

      const report = await reportsService.getLeadsReport(mockAdminUser, {});

      expect(report.summary.totalLeads).toBe(2);
      expect(report.summary.convertedLeads).toBe(1);
      expect(report.summary.conversionRate).toBe(50);
      expect(report.summary.avgScore).toBe(75);
      expect(report.bySource.length).toBe(2);
      expect(report.byEmployee.length).toBe(1);
      expect(report.byEmployee[0].conversionRate).toBe(50);
    });
  });

  describe('4. Operations & Fulfillment Reporting', () => {
    it('should aggregate active applications, workflow stages, and document verification stats', async () => {
      prisma.application.findMany.mockResolvedValue([
        {
          id: 'app-1',
          status: 'IN_PROGRESS',
          serviceId: 'srv-pvt',
          service: { name: 'Pvt Ltd Incorporation' },
          workflowInstance: {
            currentStage: { id: 'st-doc', name: 'Document Collection' },
          },
        },
        {
          id: 'app-2',
          status: 'COMPLETED',
          serviceId: 'srv-gst',
          service: { name: 'GST Filing' },
          workflowInstance: {
            currentStage: { id: 'st-done', name: 'Completed' },
          },
        },
      ]);

      prisma.document.findMany.mockResolvedValue([
        { status: 'VERIFIED' },
        { status: 'PENDING' },
        { status: 'REJECTED' },
      ]);

      const report = await reportsService.getOperationsReport(mockAdminUser, {});

      expect(report.summary.totalApplications).toBe(2);
      expect(report.summary.inProgress).toBe(1);
      expect(report.summary.completed).toBe(1);
      expect(report.byService.length).toBe(2);
      expect(report.byStage.length).toBe(2);
      expect(report.documentsStatus.totalUploaded).toBe(3);
      expect(report.documentsStatus.verified).toBe(1);
      expect(report.documentsStatus.rejected).toBe(1);
    });
  });

  describe('5. Branch Comparison Reporting', () => {
    it('should calculate performance metrics across all branches for Admin', async () => {
      prisma.branch.findMany.mockResolvedValue([
        {
          id: 'b-noida',
          name: 'Noida Branch',
          code: 'NOIDA_01',
          city: 'Noida',
          state: 'Uttar Pradesh',
          users: [{ id: 'u-1' }, { id: 'u-2' }],
          leads: [{ status: 'CONVERTED' }, { status: 'NEW' }],
          applications: [
            {
              status: 'COMPLETED',
              invoices: [{ amount: '25000.00', status: 'PAID' }],
            },
          ],
        },
      ]);

      const report = await reportsService.getBranchComparison(mockAdminUser, {});

      expect(report.branches.length).toBe(1);
      expect(report.branches[0].branchCode).toBe('NOIDA_01');
      expect(report.branches[0].employeeCount).toBe(2);
      expect(report.branches[0].leadCount).toBe(2);
      expect(report.branches[0].conversionRate).toBe(50);
      expect(report.branches[0].totalRevenue).toBe(25000);
    });
  });

  describe('6. Report Exporting', () => {
    it('should export Revenue report to formatted CSV', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        {
          amount: '15000.00',
          taxAmount: '2288.14',
          status: 'PAID',
          createdAt: new Date('2026-08-15'),
          application: { service: { id: 'srv-1', name: 'Private Limited' }, branch: { id: 'b-1', name: 'HO' } },
          customer: { branch: { id: 'b-1', name: 'HO' } },
        },
      ]);

      const result = await reportsService.exportReport(mockAdminUser, {
        reportType: ReportType.REVENUE,
        format: ExportFormat.CSV,
      });

      expect(result.mimeType).toBe('text/csv');
      expect(result.content).toContain('Revenue Analytics Report - Crazy Capital');
      expect(result.content).toContain('Total Invoiced,15000');
      expect(result.content).toContain('Private Limited');
    });
  });
});
