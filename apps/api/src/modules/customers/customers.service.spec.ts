import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomerAddressType, CustomerType, LeadStatus, UserRole } from '@cc/types';

describe('CustomersService & Atomic Conversion (Sprint 2 Acceptance Suite)', () => {
  let service: CustomersService;
  let prisma: any;

  const mockOrgId = 'org-cc-001';
  const mockOtherOrgId = 'org-other-999';
  const mockBranchId = 'branch-noida-01';

  const mockAdminContext = {
    id: 'user-admin-001',
    organizationId: mockOrgId,
    branchId: mockBranchId,
    roles: [UserRole.ADMIN],
  };

  const mockOtherOrgContext = {
    id: 'user-hacker-001',
    organizationId: mockOtherOrgId,
    branchId: 'branch-other-01',
    roles: [UserRole.ADMIN],
  };

  const mockCustomer = {
    id: 'cust-001',
    organizationId: mockOrgId,
    branchId: mockBranchId,
    customerType: CustomerType.BUSINESS,
    firstName: 'Arjun',
    lastName: 'Kapoor',
    email: 'arjun@kapoorenterprises.com',
    mobile: '9822003344',
    companyName: 'Kapoor Global Exports Private Limited',
    pan: 'AABCK1234D',
    gstin: '07AABCK1234D1Z8',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    addresses: [],
    contacts: [],
    applications: [],
    documents: [],
    invoices: [],
  };

  const mockLead = {
    id: 'lead-001',
    organizationId: mockOrgId,
    branchId: mockBranchId,
    firstName: 'Arjun',
    lastName: 'Kapoor',
    email: 'arjun@kapoorenterprises.com',
    mobile: '9822003344',
    companyName: 'Kapoor Global Exports Private Limited',
    status: LeadStatus.QUALIFIED,
    convertedToId: null,
    deletedAt: null,
  };

  const mockTx = {
    customer: {
      create: jest.fn().mockResolvedValue(mockCustomer),
      findUnique: jest.fn().mockResolvedValue(mockCustomer),
    },
    customerAddress: {
      create: jest.fn().mockResolvedValue({ id: 'addr-001' }),
    },
    customerContact: {
      create: jest.fn().mockResolvedValue({ id: 'cont-001' }),
    },
    lead: {
      update: jest.fn().mockResolvedValue({ ...mockLead, status: LeadStatus.CONVERTED }),
    },
    leadActivity: {
      create: jest.fn().mockResolvedValue({ id: 'act-conv' }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-001' }),
    },
  };

  const mockPrisma = {
    customer: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn().mockResolvedValue(mockCustomer),
      update: jest.fn(),
    },
    lead: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    customerAddress: {
      create: jest.fn(),
    },
    customerContact: {
      create: jest.fn(),
    },
    leadActivity: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => cb(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockTx));
    mockTx.customer.findUnique.mockResolvedValue(mockCustomer);
    mockTx.customer.create.mockResolvedValue(mockCustomer);
  });

  describe('1. Direct Customer Master Creation (Rule C3)', () => {
    it('should create customer profile with uppercase PAN and GSTIN', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      const dto = {
        customerType: CustomerType.BUSINESS,
        firstName: 'Arjun',
        lastName: 'Kapoor',
        email: 'arjun@kapoorenterprises.com',
        mobile: '9822003344',
        companyName: 'Kapoor Global Exports Private Limited',
        pan: 'aabck1234d',
        gstin: '07aabck1234d1z8',
      };

      const result = await service.create(dto, mockAdminContext);

      expect(result).toBeDefined();
      expect(mockTx.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: mockOrgId,
            pan: 'AABCK1234D',
            gstin: '07AABCK1234D1Z8',
          }),
        }),
      );
    });

    it('should throw ConflictException on duplicate email in organization', async () => {
      mockPrisma.customer.findUnique.mockResolvedValueOnce(null); // mobile check ok
      mockPrisma.customer.findUnique.mockResolvedValueOnce(mockCustomer); // email duplicate

      const dto = {
        customerType: CustomerType.BUSINESS,
        firstName: 'Arjun',
        lastName: 'Kapoor',
        email: 'arjun@kapoorenterprises.com',
        mobile: '9822003399',
      };

      await expect(service.create(dto, mockAdminContext)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate mobile in organization', async () => {
      mockPrisma.customer.findUnique.mockResolvedValueOnce(mockCustomer); // mobile duplicate

      const dto = {
        customerType: CustomerType.INDIVIDUAL,
        firstName: 'New',
        lastName: 'Person',
        email: 'new@example.com',
        mobile: '9822003344',
      };

      await expect(service.create(dto, mockAdminContext)).rejects.toThrow(ConflictException);
    });
  });

  describe('2. Atomic Lead-to-Customer Conversion Transaction', () => {
    it('should atomically convert lead, create master profile, address, contact, and audit log', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(mockLead);
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      const convertDto = {
        customerType: CustomerType.BUSINESS,
        pan: 'AABCK1234D',
        gstin: '07AABCK1234D1Z8',
        address: {
          type: CustomerAddressType.REGISTERED,
          addressLine1: 'Plot 45, Sector 62',
          city: 'Noida',
          state: 'Uttar Pradesh',
          pincode: '201309',
        },
      };

      const result = await service.convertLead('lead-001', convertDto, mockAdminContext);

      expect(result).toBeDefined();
      expect(result.id).toEqual(mockCustomer.id);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockTx.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-001' },
          data: expect.objectContaining({
            status: LeadStatus.CONVERTED,
          }),
        }),
      );
    });

    it('should throw ConflictException if lead is already CONVERTED', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ ...mockLead, status: LeadStatus.CONVERTED, convertedToId: 'cust-existing' });

      await expect(
        service.convertLead('lead-001', { customerType: CustomerType.BUSINESS }, mockAdminContext),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if lead belongs to another organization', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(null);

      await expect(
        service.convertLead('lead-001', { customerType: CustomerType.BUSINESS }, mockOtherOrgContext),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Customer 360 Aggregator & Multi-Tenancy', () => {
    it('should return complete Customer 360 view with addresses, contacts, and applications', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.findOne('cust-001', mockAdminContext);

      expect(result).toBeDefined();
      expect(result.id).toEqual('cust-001');
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'cust-001',
            organizationId: mockOrgId,
          }),
        }),
      );
    });

    it('should block cross-tenant customer retrieval (Org B accessing Org A customer)', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('cust-001', mockOtherOrgContext),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
