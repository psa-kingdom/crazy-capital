import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole } from '@cc/types';

describe('TasksService (Slice 2.3 — Intelligent Task Engine & Workload Balancing)', () => {
  let service: TasksService;
  let mockPrisma: any;

  const mockOrgId = 'org-100';
  const mockBranchId = 'branch-100';

  const mockUserAdmin = {
    id: 'user-admin-1',
    organizationId: mockOrgId,
    role: UserRole.ADMIN,
  };

  const mockUserEmployee = {
    id: 'user-emp-1',
    organizationId: mockOrgId,
    branchId: mockBranchId,
    role: UserRole.EMPLOYEE,
  };

  beforeEach(async () => {
    mockPrisma = {
      application: {
        findUnique: jest.fn(),
      },
      workflowStage: {
        findUnique: jest.fn(),
      },
      task: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'task-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }),
        ),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'task-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }),
        ),
        count: jest.fn().mockResolvedValue(0),
      },
      taskAssignmentHistory: {
        create: jest.fn().mockResolvedValue({ id: 'hist-1' }),
      },
      applicationActivity: {
        create: jest.fn().mockResolvedValue({ id: 'act-1' }),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('1. Automatic Stage Task Creation & Idempotency', () => {
    it('should auto-create a stage task with intelligent routing and SLA linkage', async () => {
      mockPrisma.application.findUnique.mockResolvedValueOnce({
        id: 'app-1',
        applicationNumber: 'CC-2026-000101',
        branchId: mockBranchId,
        service: { id: 'srv-1', name: 'Private Limited Company Incorporation' },
        customer: { firstName: 'Aarav', lastName: 'Sharma' },
        workflowInstance: { id: 'wf-inst-1' },
      });

      mockPrisma.workflowStage.findUnique.mockResolvedValueOnce({
        id: 'stg-1',
        name: 'MCA SPICe+ Drafting',
        slaHours: 24,
        department: 'Legal & Corporate',
        requiredSkill: 'COMPANY_LAW',
        defaultTaskTitle: 'MCA SPICe+ Drafting — Incorporation Filing',
        defaultTaskDesc: 'Draft and review Articles of Association & Memorandum of Association.',
      });

      mockPrisma.task.findFirst.mockResolvedValueOnce(null); // No existing task

      // Mock user candidates
      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'emp-1',
          firstName: 'Rohan',
          lastName: 'Gupta',
          email: 'rohan.gupta@crazycapital.in',
          department: 'Legal & Corporate',
          branchId: mockBranchId,
          skills: ['COMPANY_LAW', 'MCA_FILING'],
          maxConcurrentTasks: 5,
          assignedTasks: [],
        },
      ]);

      const result = await service.createStageTask('app-1', 'stg-1', mockOrgId);

      expect(result.id).toBe('task-1');
      expect(result.title).toBe('MCA SPICe+ Drafting — Incorporation Filing');
      expect(result.assignedToId).toBe('emp-1');
      expect(result.priority).toBe('MEDIUM');
      expect(mockPrisma.task.create).toHaveBeenCalled();
      expect(mockPrisma.taskAssignmentHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            toUserId: 'emp-1',
          }),
        }),
      );
    });

    it('should be IDEMPOTENT and return existing task without creating duplicates on repeated calls', async () => {
      mockPrisma.application.findUnique.mockResolvedValueOnce({
        id: 'app-1',
        service: { name: 'Pvt Ltd' },
      });
      mockPrisma.workflowStage.findUnique.mockResolvedValueOnce({
        id: 'stg-1',
        name: 'SPICe+ Drafting',
      });

      mockPrisma.task.findFirst.mockResolvedValueOnce({
        id: 'task-existing-1',
        applicationId: 'app-1',
        workflowStageId: 'stg-1',
        title: 'SPICe+ Drafting',
        status: 'PENDING',
        priority: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createStageTask('app-1', 'stg-1', mockOrgId);

      expect(result.id).toBe('task-existing-1');
      expect(mockPrisma.task.create).not.toHaveBeenCalled();
    });
  });

  describe('2. Intelligent Routing Algorithm & Workload Scoring', () => {
    it('should select candidate with skill match and department match over generic staff', async () => {
      const staffList = [
        {
          id: 'staff-general',
          firstName: 'General',
          lastName: 'Officer',
          email: 'gen@crazycapital.in',
          department: 'Operations Central',
          branchId: 'branch-other',
          skills: ['OPERATIONS'],
          maxConcurrentTasks: 5,
          assignedTasks: [], // 0 tasks
        },
        {
          id: 'staff-specialist',
          firstName: 'Legal',
          lastName: 'Specialist',
          email: 'legal@crazycapital.in',
          department: 'Legal & Corporate',
          branchId: mockBranchId,
          skills: ['COMPANY_LAW', 'SPICE_PLUS'],
          maxConcurrentTasks: 5,
          assignedTasks: [{ id: 't-1' }], // 1 task
        },
      ];

      mockPrisma.user.findMany.mockResolvedValueOnce(staffList);

      const best = await service.findBestAssignee(
        mockOrgId,
        'Legal & Corporate',
        'COMPANY_LAW',
        mockBranchId,
      );

      expect(best).not.toBeNull();
      expect(best?.userId).toBe('staff-specialist');
      expect(best?.skillMatch).toBe(true);
      expect(best?.suitabilityScore).toBeGreaterThan(80);
    });

    it('should penalize overloaded staff and route to available team members', async () => {
      const staffList = [
        {
          id: 'staff-overloaded',
          firstName: 'Busy',
          lastName: 'Legal Lead',
          email: 'busy@crazycapital.in',
          department: 'Legal & Corporate',
          branchId: mockBranchId,
          skills: ['COMPANY_LAW'],
          maxConcurrentTasks: 3,
          assignedTasks: [{ id: 't1' }, { id: 't2' }, { id: 't3' }], // 3/3 tasks (100% capacity)
        },
        {
          id: 'staff-available',
          firstName: 'Free',
          lastName: 'Legal Executive',
          email: 'free@crazycapital.in',
          department: 'Legal & Corporate',
          branchId: mockBranchId,
          skills: ['COMPANY_LAW'],
          maxConcurrentTasks: 5,
          assignedTasks: [{ id: 't4' }], // 1/5 tasks (20% capacity)
        },
      ];

      mockPrisma.user.findMany.mockResolvedValueOnce(staffList);

      const best = await service.findBestAssignee(
        mockOrgId,
        'Legal & Corporate',
        'COMPANY_LAW',
        mockBranchId,
      );

      expect(best?.userId).toBe('staff-available');
      expect(best?.utilizationPercent).toBe(20);
    });
  });

  describe('3. Task Reassignment & Lifecycle Management', () => {
    it('should reassign task, record assignment history, and log activity', async () => {
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        organizationId: mockOrgId,
        applicationId: 'app-1',
        assignedToId: 'emp-1',
        title: 'MCA SPICe+ Drafting',
      });

      mockPrisma.user.findFirst.mockResolvedValueOnce({
        id: 'emp-2',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@crazycapital.in',
      });

      await service.reassignTask(
        'task-1',
        { assignedToId: 'emp-2', reason: 'Rebalancing branch workload' },
        mockUserAdmin,
      );

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({
            assignedToId: 'emp-2',
          }),
        }),
      );

      expect(mockPrisma.taskAssignmentHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taskId: 'task-1',
            fromUserId: 'emp-1',
            toUserId: 'emp-2',
            assignedById: 'user-admin-1',
          }),
        }),
      );
    });

    it('should complete task with completion notes and timestamp', async () => {
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        organizationId: mockOrgId,
        applicationId: 'app-1',
        title: 'MCA Drafting',
      });

      await service.completeTask(
        'task-1',
        'Drafting verified and SPICe+ submitted to MCA portal.',
        mockUserAdmin,
      );

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({
            status: 'COMPLETED',
            completionNotes: 'Drafting verified and SPICe+ submitted to MCA portal.',
          }),
        }),
      );
    });
  });

  describe('4. Dashboard & Workload Aggregation', () => {
    it('should aggregate team capacity, department distribution, and staff utilization', async () => {
      mockPrisma.task.findMany.mockResolvedValueOnce([
        {
          id: 't-1',
          status: 'PENDING',
          priority: 'HIGH',
          department: 'Legal & Corporate',
          createdAt: new Date(),
        },
        {
          id: 't-2',
          status: 'COMPLETED',
          priority: 'MEDIUM',
          department: 'Tax & Compliance',
          createdAt: new Date(Date.now() - 4 * 3600 * 1000),
          completedAt: new Date(),
        },
      ]);

      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'emp-1',
          firstName: 'Rohan',
          lastName: 'Gupta',
          email: 'rohan.gupta@crazycapital.in',
          department: 'Legal & Corporate',
          skills: ['COMPANY_LAW'],
          maxConcurrentTasks: 5,
          assignedTasks: [{ id: 't-1' }],
        },
      ]);

      const dashboard = await service.getTaskDashboard(mockOrgId, mockUserAdmin);

      expect(dashboard.totalTasks).toBe(2);
      expect(dashboard.pendingCount).toBe(1);
      expect(dashboard.completedCount).toBe(1);
      expect(dashboard.employeeWorkloads.length).toBe(1);
      expect(dashboard.employeeWorkloads[0].activeTaskCount).toBe(1);
      expect(dashboard.employeeWorkloads[0].utilizationPercent).toBe(20);
    });
  });
});
