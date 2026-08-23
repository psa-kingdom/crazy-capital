import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ApplicationStatus, TaskStatus, UserRole } from '@cc/types';
import { TasksService } from '../tasks/tasks.service';

describe('Application Lifecycle & Processing Matrix (Vertical Slice 1.6)', () => {
  let applicationsService: ApplicationsService;
  let prisma: PrismaService;

  const mockTasksService = {
    createStageTask: jest.fn().mockResolvedValue({ id: 'task-1' }),
  };

  const mockPrisma = {
    customer: {
      findFirst: jest.fn(),
    },
    service: {
      findFirst: jest.fn(),
    },
    application: {
      create: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    workflowInstance: {
      create: jest.fn(),
      update: jest.fn(),
    },
    workflowTransition: {
      findFirst: jest.fn(),
    },
    workflowSlaEscalation: {
      updateMany: jest.fn(),
    },
    workflowHistory: {
      create: jest.fn(),
    },
    applicationActivity: {
      create: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockUserAdmin = {
    id: 'user-admin-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    roles: [UserRole.ADMIN],
  };

  const mockUserEmployee = {
    id: 'user-emp-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    roles: [UserRole.EMPLOYEE],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compile();


    applicationsService = module.get<ApplicationsService>(ApplicationsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Application Registration & Workflow Instantiation', () => {
    it('1. should create application with CC-YYYY-XXXXXX number and instantiate workflow at start stage', async () => {
      mockPrisma.customer.findFirst.mockResolvedValueOnce({
        id: 'cust-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
      });
      mockPrisma.service.findFirst.mockResolvedValueOnce({
        id: 'srv-1',
        name: 'Private Limited Company Incorporation',
        isActive: true,
        workflow: {
          id: 'wf-1',
          stages: [
            { id: 'st-intake', name: 'Intake', stageOrder: 1, isStartStage: true },
            { id: 'st-filing', name: 'MCA SPICe+ Filing', stageOrder: 2, isStartStage: false },
          ],
        },
      });

      mockPrisma.application.count.mockResolvedValueOnce(0); // 0 applications this year
      mockPrisma.application.findUnique.mockResolvedValueOnce(null); // no collision

      const currentYear = new Date().getFullYear();
      const expectedAppNum = `CC-${currentYear}-000001`;

      mockPrisma.application.create.mockResolvedValueOnce({
        id: 'app-1',
        organizationId: 'org-1',
        customerId: 'cust-1',
        serviceId: 'srv-1',
        applicationNumber: expectedAppNum,
        status: ApplicationStatus.SUBMITTED,
      });

      mockPrisma.workflowInstance.create.mockResolvedValueOnce({
        id: 'inst-1',
        workflowId: 'wf-1',
        applicationId: 'app-1',
        currentStageId: 'st-intake',
      });

      mockPrisma.applicationActivity.create.mockResolvedValueOnce({ id: 'act-1' });

      mockPrisma.application.findUnique.mockResolvedValueOnce({
        id: 'app-1',
        applicationNumber: expectedAppNum,
        status: ApplicationStatus.SUBMITTED,
        workflowInstance: { id: 'inst-1', currentStage: { name: 'Intake' } },
      });

      const res = await applicationsService.create(
        {
          customerId: 'cust-1',
          serviceId: 'srv-1',
        },
        mockUserAdmin,
      );

      expect(res.applicationNumber).toBe(expectedAppNum);
      expect(mockPrisma.workflowInstance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workflowId: 'wf-1',
            applicationId: 'app-1',
            currentStageId: 'st-intake',
          }),
        }),
      );
    });

    it('2. should reject application creation if requested service is inactive', async () => {
      mockPrisma.customer.findFirst.mockResolvedValueOnce({ id: 'cust-1', organizationId: 'org-1' });
      mockPrisma.service.findFirst.mockResolvedValueOnce({
        id: 'srv-inactive',
        name: 'Obsolete Filing',
        isActive: false,
      });

      await expect(
        applicationsService.create({ customerId: 'cust-1', serviceId: 'srv-inactive' }, mockUserAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('3. should reject application creation if service lacks an active workflow blueprint', async () => {
      mockPrisma.customer.findFirst.mockResolvedValueOnce({ id: 'cust-1', organizationId: 'org-1' });
      mockPrisma.service.findFirst.mockResolvedValueOnce({
        id: 'srv-no-wf',
        name: 'New Service',
        isActive: true,
        workflow: null, // no workflow
      });

      await expect(
        applicationsService.create({ customerId: 'cust-1', serviceId: 'srv-no-wf' }, mockUserAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('4. should reject application creation for a customer belonging to a different tenant', async () => {
      mockPrisma.customer.findFirst.mockResolvedValueOnce(null); // not found in org-1

      await expect(
        applicationsService.create({ customerId: 'cust-org-2', serviceId: 'srv-1' }, mockUserAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Multi-Tenancy & Branch Scoping', () => {
    it('5. should block cross-tenant application retrieval (Org B cannot query Org A application)', async () => {
      mockPrisma.application.findFirst.mockResolvedValueOnce(null); // not found in org-2

      const userOrgB = { id: 'u-org-b', organizationId: 'org-2', roles: [UserRole.ADMIN] };

      await expect(
        applicationsService.findOne('app-org-1', userOrgB),
      ).rejects.toThrow(NotFoundException);
    });

    it('6. should block branch employee from accessing applications from other branches', async () => {
      mockPrisma.application.findFirst.mockResolvedValueOnce({
        id: 'app-1',
        organizationId: 'org-1',
        branchId: 'branch-mumbai',
        assignedToId: 'other-user',
      });

      const userDelhiEmployee = {
        id: 'u-delhi',
        organizationId: 'org-1',
        branchId: 'branch-delhi',
        roles: [UserRole.EMPLOYEE],
      };

      await expect(
        applicationsService.findOne('app-1', userDelhiEmployee),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Operations Tasks & Assignment Lifecycle', () => {
    it('7. should reassign application and record immutable assignment activity', async () => {
      mockPrisma.application.findFirst.mockResolvedValueOnce({
        id: 'app-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
      });
      mockPrisma.user.findFirst.mockResolvedValueOnce({
        id: 'user-ops-2',
        firstName: 'Priya',
        lastName: 'Verma',
        organizationId: 'org-1',
        isActive: true,
      });
      mockPrisma.application.update.mockResolvedValueOnce({
        id: 'app-1',
        assignedToId: 'user-ops-2',
      });
      mockPrisma.applicationActivity.create.mockResolvedValueOnce({ id: 'act-assign' });

      await applicationsService.assign(
        'app-1',
        { assignedToUserId: 'user-ops-2', remarks: 'Assigned to Senior Executive' },
        mockUserAdmin,
      );

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: { assignedToId: 'user-ops-2' },
        }),
      );
      expect(mockPrisma.applicationActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: 'ASSIGNMENT',
            performedById: 'user-admin-1',
          }),
        }),
      );
    });

    it('8. should create operational task linked to application', async () => {
      mockPrisma.application.findFirst.mockResolvedValueOnce({ id: 'app-1', organizationId: 'org-1' });
      mockPrisma.task.create.mockResolvedValueOnce({
        id: 'task-1',
        title: 'Verify DSC tokens',
        status: TaskStatus.PENDING,
      });
      mockPrisma.applicationActivity.create.mockResolvedValueOnce({ id: 'act-task' });

      const task = await applicationsService.createTask(
        'app-1',
        { title: 'Verify DSC tokens' },
        mockUserAdmin,
      );

      expect(task.title).toBe('Verify DSC tokens');
      expect(mockPrisma.task.create).toHaveBeenCalled();
    });

    it('9. should mark task as COMPLETED and set completedAt timestamp', async () => {
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        title: 'Verify DSC tokens',
        applicationId: 'app-1',
        application: { organizationId: 'org-1' },
      });
      mockPrisma.task.update.mockResolvedValueOnce({
        id: 'task-1',
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      });
      mockPrisma.applicationActivity.create.mockResolvedValueOnce({ id: 'act-done' });

      const updated = await applicationsService.updateTask(
        'task-1',
        { status: TaskStatus.COMPLETED },
        mockUserAdmin,
      );

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({
            status: TaskStatus.COMPLETED,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('10. should record custom operational note on application timeline', async () => {
      mockPrisma.application.findFirst.mockResolvedValueOnce({ id: 'app-1', organizationId: 'org-1' });
      mockPrisma.applicationActivity.create.mockResolvedValueOnce({
        id: 'act-note',
        activityType: 'NOTE',
        notes: 'Customer provided alternate trade name',
      });

      const act = await applicationsService.addActivity(
        'app-1',
        { activityType: 'NOTE', notes: 'Customer provided alternate trade name' },
        mockUserAdmin,
      );

      expect(act.notes).toBe('Customer provided alternate trade name');
      expect(mockPrisma.applicationActivity.create).toHaveBeenCalled();
    });
  });
});
