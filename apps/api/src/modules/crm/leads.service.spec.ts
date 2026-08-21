import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LeadActivityType, LeadStatus, UserRole } from '@cc/types';

describe('LeadsService (Sprint 2 Acceptance Suite)', () => {
  let service: LeadsService;
  let prisma: any;

  const mockOrgId = 'org-cc-001';
  const mockOtherOrgId = 'org-other-999';
  const mockBranchId = 'branch-noida-01';
  const mockOtherBranchId = 'branch-delhi-01';
  const mockUserId = 'user-emp-001';

  const mockAdminContext = {
    id: 'user-admin-001',
    organizationId: mockOrgId,
    branchId: mockBranchId,
    roles: [UserRole.ADMIN],
  };

  const mockEmployeeContext = {
    id: mockUserId,
    organizationId: mockOrgId,
    branchId: mockBranchId,
    roles: [UserRole.EMPLOYEE],
  };

  const mockOtherOrgContext = {
    id: 'user-hacker-001',
    organizationId: mockOtherOrgId,
    branchId: 'branch-other-01',
    roles: [UserRole.ADMIN],
  };

  const mockLead = {
    id: 'lead-123',
    organizationId: mockOrgId,
    branchId: mockBranchId,
    firstName: 'Rajesh',
    lastName: 'Gupta',
    email: 'rajesh@apextech.in',
    mobile: '9876543210',
    companyName: 'Apex Technologies Pvt Ltd',
    status: LeadStatus.NEW,
    leadScore: 80,
    sourceId: 'src-web-01',
    assignedToId: mockUserId,
    notes: 'Inquiry for Pvt Ltd incorporation',
    campaign: 'GOOGLE_ADS',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    source: { id: 'src-web-01', name: 'Website', code: 'WEBSITE' },
    branch: { id: mockBranchId, name: 'Noida Branch', code: 'NOIDA_01' },
    assignedTo: { id: mockUserId, firstName: 'Priya', lastName: 'Verma', email: 'priya@crazycapital.in' },
    activities: [],
    assignments: [],
  };

  const mockPrisma = {
    organization: {
      findFirst: jest.fn(),
    },
    lead: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    leadSource: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    branch: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    leadActivity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    leadAssignment: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockPrisma));
  });

  describe('1. Lead Creation & Capture', () => {
    it('should create a lead with organization scope and default website source', async () => {
      mockPrisma.leadSource.findUnique.mockResolvedValue({ id: 'src-web-01', code: 'WEBSITE' });
      mockPrisma.branch.findFirst.mockResolvedValue({ id: mockBranchId });
      mockPrisma.lead.create.mockResolvedValue(mockLead);

      const dto = {
        firstName: 'Rajesh',
        lastName: 'Gupta',
        email: 'rajesh@apextech.in',
        mobile: '9876543210',
        companyName: 'Apex Technologies Pvt Ltd',
      };

      const result = await service.create(dto, mockAdminContext);

      expect(result).toBeDefined();
      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: mockOrgId,
            firstName: 'Rajesh',
            lastName: 'Gupta',
            mobile: '9876543210',
            status: LeadStatus.NEW,
          }),
        }),
      );
    });

    it('should fallback to default org for public inquiries without user context', async () => {
      mockPrisma.organization.findFirst.mockResolvedValue({
        id: 'org-default',
        branches: [{ id: 'branch-default-ho' }],
      });
      mockPrisma.leadSource.findUnique.mockResolvedValue({ id: 'src-web-01', code: 'WEBSITE' });
      mockPrisma.lead.create.mockResolvedValue({ ...mockLead, organizationId: 'org-default' });

      const dto = {
        firstName: 'Public',
        lastName: 'Visitor',
        mobile: '9876543210',
      };

      const result = await service.create(dto, undefined);

      expect(result).toBeDefined();
      expect(mockPrisma.organization.findFirst).toHaveBeenCalled();
    });
  });

  describe('2. Multi-Tenant Isolation & Security', () => {
    it('should block Organization B from accessing Organization A lead', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('lead-123', mockOtherOrgContext),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.lead.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'lead-123',
            organizationId: mockOtherOrgId,
          }),
        }),
      );
    });

    it('should block employee from viewing unassigned lead from another branch', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({
        ...mockLead,
        branchId: mockOtherBranchId,
        assignedToId: 'other-emp',
      });

      await expect(
        service.findOne('lead-123', mockEmployeeContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should enforce branch scoping on lead listing for employees', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([mockLead]);
      mockPrisma.lead.count.mockResolvedValue(1);

      await service.findAll({}, mockEmployeeContext);

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrgId,
            OR: [
              { assignedToId: mockUserId },
              { branchId: mockBranchId },
            ],
          }),
        }),
      );
    });
  });

  describe('3. State Machine Lifecycle Transitions', () => {
    it('should allow valid transition NEW -> CONTACTED', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ ...mockLead, status: LeadStatus.NEW });
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, status: LeadStatus.CONTACTED });

      const result = await service.updateStatus('lead-123', { status: LeadStatus.CONTACTED, remarks: 'Client contacted via phone' }, mockAdminContext);

      expect(result.status).toEqual(LeadStatus.CONTACTED);
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'lead-123',
            activityType: 'STATUS_CHANGE',
          }),
        }),
      );
    });

    it('should reject invalid transition NEW -> PROPOSAL with 400 BadRequestException', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ ...mockLead, status: LeadStatus.NEW });

      await expect(
        service.updateStatus('lead-123', { status: LeadStatus.PROPOSAL }, mockAdminContext),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject transitions out of terminal status CONVERTED', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ ...mockLead, status: LeadStatus.CONVERTED });

      await expect(
        service.updateStatus('lead-123', { status: LeadStatus.NEW }, mockAdminContext),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid transitions out of terminal status LOST', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ ...mockLead, status: LeadStatus.LOST });

      await expect(
        service.updateStatus('lead-123', { status: LeadStatus.QUALIFIED }, mockAdminContext),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Lead Assignment & Immutable History', () => {
    it('should reassign lead and record immutable entry in lead_assignments', async () => {
      const newAssigneeId = 'user-emp-002';
      mockPrisma.lead.findFirst.mockResolvedValue(mockLead);
      mockPrisma.user.findFirst.mockResolvedValue({ id: newAssigneeId, organizationId: mockOrgId });
      mockPrisma.lead.update.mockResolvedValue({ ...mockLead, assignedToId: newAssigneeId });

      await service.assign('lead-123', { assignedToUserId: newAssigneeId, remarks: 'Reassigned for territory coverage' }, mockAdminContext);

      expect(mockPrisma.leadAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'lead-123',
            assignedFrom: mockAdminContext.id,
            assignedTo: newAssigneeId,
          }),
        }),
      );
    });

    it('should throw NotFoundException if assignee belongs to a different organization', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(mockLead);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.assign('lead-123', { assignedToUserId: 'hacker-user' }, mockAdminContext),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('5. Activity Logging & Timeline', () => {
    it('should log activity of type CALL with author and timestamp', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(mockLead);
      mockPrisma.leadActivity.create.mockResolvedValue({
        id: 'act-001',
        leadId: 'lead-123',
        activityType: LeadActivityType.CALL,
        notes: 'Discussed pricing quote',
        performedById: mockUserId,
        createdAt: new Date(),
      });

      const result = await service.addActivity('lead-123', { activityType: LeadActivityType.CALL, notes: 'Discussed pricing quote' }, mockEmployeeContext);

      expect(result).toBeDefined();
      expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'lead-123',
            activityType: LeadActivityType.CALL,
            performedById: mockUserId,
          }),
        }),
      );
    });
  });
});
