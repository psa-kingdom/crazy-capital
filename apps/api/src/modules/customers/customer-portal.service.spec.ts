import { Test, TestingModule } from '@nestjs/testing';
import { CustomerPortalService } from './customer-portal.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@cc/types';

describe('Customer Self-Service Portal (Vertical Slice 1.11)', () => {
  let customerPortalService: CustomerPortalService;
  let prisma: any;

  const mockCustomerUser = {
    id: 'user-cust-1',
    organizationId: 'org-test-1',
    firstName: 'Rohan',
    lastName: 'Sharma',
    email: 'rohan@sharmaholdings.in',
    mobile: '+919876543210',
    roles: [UserRole.CUSTOMER],
  };

  const mockCustomer = {
    id: 'cust-101',
    organizationId: 'org-test-1',
    firstName: 'Rohan',
    lastName: 'Sharma',
    email: 'rohan@sharmaholdings.in',
    mobile: '+919876543210',
    companyName: 'Sharma Holdings Pvt Ltd',
  };

  const mockService = {
    id: 'srv-pvt-ltd',
    name: 'Private Limited Company Incorporation',
    slug: 'pvt-ltd-incorporation',
    description: 'Complete MCA incorporation with DIN, DSC, PAN, and TAN',
    requiredDocuments: [
      {
        documentTypeId: 'dt-pan',
        isMandatory: true,
        documentType: { id: 'dt-pan', name: 'PAN Card', code: 'PAN' },
      },
      {
        documentTypeId: 'dt-aadhaar',
        isMandatory: true,
        documentType: { id: 'dt-aadhaar', name: 'Aadhaar Card', code: 'AADHAAR' },
      },
    ],
    workflow: {
      id: 'wf-1',
      stages: [
        { id: 'st-1', name: 'Document Collection', stageOrder: 1, stageType: 'START' },
        { id: 'st-2', name: 'Name Approval (RUN)', stageOrder: 2, stageType: 'PROCESSING' },
        { id: 'st-3', name: 'SPICe+ MCA Filing', stageOrder: 3, stageType: 'APPROVAL' },
        { id: 'st-4', name: 'COI Certificate Issued', stageOrder: 4, stageType: 'COMPLETION' },
      ],
    },
  };

  const mockApplication = {
    id: 'app-501',
    customerId: 'cust-101',
    serviceId: 'srv-pvt-ltd',
    applicationNumber: 'CC-2026-000088',
    status: 'IN_PROGRESS',
    createdAt: new Date(),
    updatedAt: new Date(),
    service: mockService,
    workflowInstance: {
      id: 'wfi-1',
      currentStageId: 'st-2',
      currentStage: { id: 'st-2', name: 'Name Approval (RUN)', stageOrder: 2, stageType: 'PROCESSING' },
    },
    documents: [
      {
        id: 'doc-1',
        documentTypeId: 'dt-pan',
        fileName: 'PAN_Rohan_Sharma.pdf',
        status: 'VERIFIED',
        createdAt: new Date(),
        verifications: [{ remarks: 'Verified with ITD database' }],
      },
    ],
    invoices: [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2026-000012',
        amount: '14999.00',
        taxAmount: '2287.98',
        status: 'SENT',
        createdAt: new Date(),
        updatedAt: new Date(),
        payments: [],
      },
    ],
    assignedTo: {
      firstName: 'Pooja',
      lastName: 'Hegde',
      email: 'pooja.ops@crazycapital.in',
    },
  };

  beforeEach(async () => {
    prisma = {
      customer: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      application: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      document: {
        findMany: jest.fn(),
      },
      invoice: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerPortalService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    customerPortalService = module.get<CustomerPortalService>(CustomerPortalService);
  });

  describe('1. Customer Overview Dashboard', () => {
    it('should aggregate active applications, progress percentage, missing documents, and unpaid invoices', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.application.findMany.mockResolvedValue([mockApplication]);
      prisma.invoice.findMany.mockResolvedValue(mockApplication.invoices);

      const dashboard = await customerPortalService.getDashboard(mockCustomerUser);

      expect(dashboard.customer.email).toBe(mockCustomerUser.email);
      expect(dashboard.stats.totalApplications).toBe(1);
      expect(dashboard.stats.activeApplications).toBe(1);
      // PAN is uploaded, Aadhaar is missing
      expect(dashboard.stats.missingDocumentsCount).toBe(1);
      expect(dashboard.stats.unpaidInvoicesCount).toBe(1);
      expect(dashboard.stats.unpaidAmount).toBe(14999);

      // Stage 2 of 4 = 25%
      expect(dashboard.activeApplications[0].progressPercent).toBe(25);
      expect(dashboard.activeApplications[0].currentStageName).toBe('Name Approval (RUN)');
    });
  });

  describe('2. Application Detail Hub & Workflow Stepper', () => {
    it('should return detailed application with stage stepper, document checklist, and invoices', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.application.findUnique.mockResolvedValue(mockApplication);

      const detail = await customerPortalService.getApplicationDetail('app-501', mockCustomerUser);

      expect(detail.id).toBe('app-501');
      expect(detail.stages.length).toBe(4);
      // Stage 1 completed, Stage 2 current
      expect(detail.stages[0].isCompleted).toBe(true);
      expect(detail.stages[1].isCurrent).toBe(true);
      expect(detail.stages[2].isCompleted).toBe(false);

      // Documents: PAN is uploaded, Aadhaar is not
      expect(detail.documents.length).toBe(2);
      expect(detail.documents[0].uploadedDocument?.status).toBe('VERIFIED');
      expect(detail.documents[1].uploadedDocument).toBeNull();
      expect(detail.invoices.length).toBe(1);
    });

    it('should block customer from accessing another customer application with 403 Forbidden', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: 'other-cust', email: 'other@client.in' });
      prisma.application.findUnique.mockResolvedValue(mockApplication);

      await expect(
        customerPortalService.getApplicationDetail('app-501', { email: 'unauthorized@client.in' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('3. Customer Document Vault & Checklist', () => {
    it('should list customer documents and identify missing mandatory requirements across cases', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.document.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          fileName: 'PAN_Rohan_Sharma.pdf',
          status: 'VERIFIED',
          documentType: { id: 'dt-pan', name: 'PAN Card', code: 'PAN' },
          createdAt: new Date(),
          verifications: [],
        },
      ]);
      prisma.application.findMany.mockResolvedValue([mockApplication]);

      const vault = await customerPortalService.getMyVault(mockCustomerUser);

      expect(vault.documents.length).toBe(1);
      expect(vault.missingRequirements.length).toBe(1);
      expect(vault.missingRequirements[0].documentTypeCode).toBe('AADHAAR');
    });
  });
});
