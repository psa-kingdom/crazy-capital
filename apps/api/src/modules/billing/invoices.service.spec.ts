import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InvoiceStatus, UserRole } from '@cc/types';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: any;

  const mockAdminUser = {
    id: 'user-admin-1',
    organizationId: 'org-test-1',
    roles: [UserRole.ADMIN],
  };

  const mockCustomerUser = {
    id: 'user-cust-1',
    customerId: 'cust-1',
    organizationId: 'org-test-1',
    roles: [UserRole.CUSTOMER],
  };

  const mockCustomer = {
    id: 'cust-1',
    organizationId: 'org-test-1',
    fullName: 'Rajesh Sharma',
    companyName: 'Sharma Tech Solutions Pvt Ltd',
    email: 'rajesh@sharmatech.in',
    mobile: '+919876543210',
    gstin: '09AAACH7409R1ZZ',
  };

  const mockApplication = {
    id: 'app-1',
    organizationId: 'org-test-1',
    customerId: 'cust-1',
    applicationNumber: 'CC-2026-000001',
    service: {
      id: 'srv-1',
      name: 'Private Limited Company Incorporation',
      code: 'PVT_LTD_INC',
      basePrice: '14999.00',
    },
  };

  beforeEach(async () => {
    prisma = {
      customer: {
        findFirst: jest.fn(),
      },
      application: {
        findFirst: jest.fn(),
      },
      invoice: {
        count: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  describe('create', () => {
    it('should generate an invoice with automatic 18% GST calculation', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);
      prisma.application.findFirst.mockResolvedValue(mockApplication);
      prisma.invoice.count.mockResolvedValue(0);

      const baseAmount = 10000;
      const expectedTax = 1800;
      const expectedTotal = 11800;

      prisma.invoice.create.mockResolvedValue({
        id: 'inv-1',
        customerId: 'cust-1',
        applicationId: 'app-1',
        invoiceNumber: 'INV-2026-000001',
        amount: baseAmount,
        taxAmount: expectedTax,
        status: InvoiceStatus.DRAFT,
        customer: mockCustomer,
        application: mockApplication,
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(
        {
          customerId: 'cust-1',
          applicationId: 'app-1',
          baseAmount: 10000,
        },
        mockAdminUser,
      );

      expect(result.invoiceNumber).toBe('INV-2026-000001');
      expect(result.amount).toBe(10000);
      expect(result.taxAmount).toBe(1800);
      expect(result.totalAmount).toBe(11800);
      expect(result.status).toBe(InvoiceStatus.DRAFT);
    });

    it('should forbid customer users from generating invoices directly', async () => {
      prisma.customer.findFirst.mockResolvedValue(mockCustomer);

      await expect(
        service.create(
          { customerId: 'cust-1', baseAmount: 5000 },
          mockCustomerUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if customer not in organization', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          { customerId: 'non-existent', baseAmount: 5000 },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices filtered by tenant organization', async () => {
      prisma.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          customerId: 'cust-1',
          invoiceNumber: 'INV-2026-000001',
          amount: '10000.00',
          taxAmount: '1800.00',
          status: InvoiceStatus.SENT,
          customer: mockCustomer,
          payments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      prisma.invoice.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 }, mockAdminUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].invoiceNumber).toBe('INV-2026-000001');
      expect(result.meta.total).toBe(1);
    });

    it('should restrict customer queries strictly to their own invoices', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);
      prisma.invoice.count.mockResolvedValue(0);

      await service.findAll({}, mockCustomerUser);

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: 'cust-1',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return invoice details with line items and payments', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        customerId: 'cust-1',
        invoiceNumber: 'INV-2026-000001',
        amount: '10000.00',
        taxAmount: '1800.00',
        status: InvoiceStatus.PAID,
        customer: mockCustomer,
        application: mockApplication,
        payments: [
          {
            id: 'pay-1',
            invoiceId: 'inv-1',
            gateway: 'RAZORPAY',
            gatewayReference: 'pay_987654',
            amount: '11800.00',
            status: 'CAPTURED',
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findOne('inv-1', mockAdminUser);

      expect(result.invoiceNumber).toBe('INV-2026-000001');
      expect(result.totalAmount).toBe(11800);
      expect(result.payments).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    it('should update invoice status and disallow reverting a PAID invoice', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        customerId: 'cust-1',
        invoiceNumber: 'INV-2026-000001',
        amount: '10000.00',
        taxAmount: '1800.00',
        status: InvoiceStatus.PAID,
        customer: mockCustomer,
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.updateStatus('inv-1', { status: InvoiceStatus.DRAFT }, mockAdminUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
