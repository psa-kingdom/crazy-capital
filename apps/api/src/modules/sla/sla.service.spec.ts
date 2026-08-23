import { Test, TestingModule } from '@nestjs/testing';
import { SlaService } from './sla.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '@cc/types';

describe('SlaService (Slice 2.2 — SLA & 4-Level Auto-Escalation Engine)', () => {
  let service: SlaService;
  let mockPrisma: any;
  let mockNotificationsService: any;

  const mockOrgId = 'org-100';
  const mockUserId = 'user-admin-1';
  const mockUser = {
    id: mockUserId,
    organizationId: mockOrgId,
    role: UserRole.ADMIN,
  };

  const createMockInstance = (hoursAgo: number, slaHours = 24, warningHours = 18) => {
    const startedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return {
      id: 'inst-test-1',
      workflowId: 'wf-1',
      applicationId: 'app-1',
      currentStageId: 'stage-1',
      stageEnteredAt: startedAt,
      startedAt,
      slaStatus: 'ON_TRACK',
      escalationLevel: 0,
      completedAt: null,
      currentStage: {
        id: 'stage-1',
        name: 'MCA SPICe+ Drafting',
        code: 'SPICE_DRAFTING',
        stageOrder: 2,
        stageType: 'PROCESSING',
        slaHours,
        warningHours,
        department: 'Legal & Corporate Desk',
      },
      application: {
        id: 'app-1',
        organizationId: mockOrgId,
        branchId: 'branch-1',
        applicationNumber: 'CC-2026-000101',
        service: { id: 'srv-1', name: 'Private Limited Company Incorporation' },
        customer: { id: 'cust-1', firstName: 'Aarav', lastName: 'Sharma', mobile: '9876543210' },
        branch: { id: 'branch-1', name: 'Noida Hub' },
        assignedTo: { id: 'exec-1', name: 'Rohan Gupta', email: 'rohan.gupta@crazycapital.in', mobile: '9811122233' },
      },
    };
  };

  beforeEach(async () => {
    mockPrisma = {
      workflowInstance: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'inst-test-1', ...data })),
      },
      workflowSlaEscalation: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'esc-1', ...data })),
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'esc-1', ...data })),
        count: jest.fn().mockResolvedValue(0),
      },
      applicationActivity: {
        create: jest.fn().mockResolvedValue({ id: 'act-1' }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-tl-1',
          name: 'Priya Sharma (Team Lead)',
          email: 'priya.sharma@crazycapital.in',
        }),
      },
    };

    mockNotificationsService = {
      send: jest.fn().mockResolvedValue({ id: 'notif-1', status: 'SENT' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<SlaService>(SlaService);
  });

  describe('SLA Timer & Warning / Breach Calculation', () => {
    it('should classify instance as ON_TRACK with 0 escalations when elapsed < warningHours (e.g. 10h / 24h SLA)', async () => {
      const instance = createMockInstance(10, 24, 18);
      mockPrisma.workflowInstance.findMany.mockResolvedValueOnce([instance]);

      const result = await service.evaluateAllActiveWorkflows(mockOrgId);

      expect(result.evaluatedCount).toBe(1);
      expect(result.warningTriggeredCount).toBe(0);
      expect(result.breachTriggeredCount).toBe(0);
      expect(result.escalationsCreatedCount).toBe(0);

      expect(mockPrisma.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slaStatus: 'ON_TRACK',
            escalationLevel: 0,
          }),
        }),
      );
      expect(mockNotificationsService.send).not.toHaveBeenCalled();
    });

    it('should trigger WARNING status & Level 1 Escalation when elapsed is between warning and SLA (e.g. 20h / 24h SLA)', async () => {
      const instance = createMockInstance(20, 24, 18);
      mockPrisma.workflowInstance.findMany.mockResolvedValueOnce([instance]);
      mockPrisma.workflowSlaEscalation.findUnique.mockResolvedValueOnce(null); // No existing esc

      const result = await service.evaluateAllActiveWorkflows(mockOrgId);

      expect(result.warningTriggeredCount).toBe(1);
      expect(result.breachTriggeredCount).toBe(0);
      expect(result.escalationsCreatedCount).toBe(1);

      expect(mockPrisma.workflowSlaEscalation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escalationLevel: 1,
            levelName: 'ASSIGNED_EXECUTIVE',
            recipientRole: 'ASSIGNED_EXECUTIVE',
            status: 'TRIGGERED',
          }),
        }),
      );

      expect(mockPrisma.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slaStatus: 'WARNING',
            escalationLevel: 1,
          }),
        }),
      );

      expect(mockNotificationsService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'workflow.sla_warning',
          recipient: 'rohan.gupta@crazycapital.in',
        }),
        mockOrgId,
      );
    });

    it('should trigger BREACHED status & Level 2 Escalation (Team Lead) when elapsed >= SLA (e.g. 28h / 24h SLA)', async () => {
      const instance = createMockInstance(28, 24, 18);
      mockPrisma.workflowInstance.findMany.mockResolvedValueOnce([instance]);
      // Level 1 already exists, Level 2 does not exist
      mockPrisma.workflowSlaEscalation.findUnique
        .mockResolvedValueOnce({ id: 'esc-lvl1-existing' }) // lvl 1
        .mockResolvedValueOnce(null); // lvl 2

      const result = await service.evaluateAllActiveWorkflows(mockOrgId);

      expect(result.breachTriggeredCount).toBe(1);
      expect(result.escalationsCreatedCount).toBe(1);

      expect(mockPrisma.workflowSlaEscalation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escalationLevel: 2,
            levelName: 'TEAM_LEAD',
            status: 'TRIGGERED',
          }),
        }),
      );

      expect(mockPrisma.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slaStatus: 'BREACHED',
            escalationLevel: 2,
          }),
        }),
      );
    });

    it('should trigger ESCALATED status & Level 3 Escalation (Branch Manager) when breach >= 12h (e.g. 40h / 24h SLA)', async () => {
      const instance = createMockInstance(40, 24, 18);
      mockPrisma.workflowInstance.findMany.mockResolvedValueOnce([instance]);
      mockPrisma.workflowSlaEscalation.findUnique
        .mockResolvedValueOnce({ id: 'esc-1' }) // lvl 1
        .mockResolvedValueOnce({ id: 'esc-2' }) // lvl 2
        .mockResolvedValueOnce(null); // lvl 3

      const result = await service.evaluateAllActiveWorkflows(mockOrgId);

      expect(result.escalationsCreatedCount).toBe(1);
      expect(mockPrisma.workflowSlaEscalation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escalationLevel: 3,
            levelName: 'BRANCH_MANAGER',
          }),
        }),
      );

      expect(mockPrisma.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slaStatus: 'ESCALATED',
            escalationLevel: 3,
          }),
        }),
      );
    });

    it('should trigger ESCALATED status & Level 4 Critical Red Alert (Super Admin) when breach >= 24h (e.g. 52h / 24h SLA)', async () => {
      const instance = createMockInstance(52, 24, 18);
      mockPrisma.workflowInstance.findMany.mockResolvedValueOnce([instance]);
      mockPrisma.workflowSlaEscalation.findUnique
        .mockResolvedValueOnce({ id: 'esc-1' })
        .mockResolvedValueOnce({ id: 'esc-2' })
        .mockResolvedValueOnce({ id: 'esc-3' })
        .mockResolvedValueOnce(null); // lvl 4

      const result = await service.evaluateAllActiveWorkflows(mockOrgId);

      expect(result.escalationsCreatedCount).toBe(1);
      expect(mockPrisma.workflowSlaEscalation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            escalationLevel: 4,
            levelName: 'SUPER_ADMIN',
          }),
        }),
      );

      expect(mockPrisma.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slaStatus: 'ESCALATED',
            escalationLevel: 4,
          }),
        }),
      );
    });
  });

  describe('Duplicate Suppression & Storm Prevention (Idempotency)', () => {
    it('should NOT create duplicate escalations or dispatch repeated notifications on consecutive evaluator runs', async () => {
      const instance = createMockInstance(30, 24, 18);
      mockPrisma.workflowInstance.findMany.mockResolvedValueOnce([instance]);
      // Both Level 1 and Level 2 already exist in database
      mockPrisma.workflowSlaEscalation.findUnique
        .mockResolvedValueOnce({ id: 'esc-lvl1-already-sent' })
        .mockResolvedValueOnce({ id: 'esc-lvl2-already-sent' });

      const result = await service.evaluateAllActiveWorkflows(mockOrgId);

      expect(result.escalationsCreatedCount).toBe(0);
      expect(result.notificationsDispatchedCount).toBe(0);
      expect(mockPrisma.workflowSlaEscalation.create).not.toHaveBeenCalled();
      expect(mockNotificationsService.send).not.toHaveBeenCalled();
    });
  });

  describe('Escalation Lifecycle Management', () => {
    it('should acknowledge an active escalation with remarks and audit activity', async () => {
      mockPrisma.workflowSlaEscalation.findFirst.mockResolvedValueOnce({
        id: 'esc-1',
        organizationId: mockOrgId,
        escalationLevel: 2,
        remarks: null,
        instance: { applicationId: 'app-1' },
      });

      const res = await service.acknowledgeEscalation(
        'esc-1',
        { remarks: 'Contacted Registrar of Companies to expedite scrutinization' },
        mockUser,
      );

      expect(mockPrisma.workflowSlaEscalation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'esc-1' },
          data: expect.objectContaining({
            status: 'ACKNOWLEDGED',
            remarks: 'Contacted Registrar of Companies to expedite scrutinization',
          }),
        }),
      );

      expect(mockPrisma.applicationActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: 'ESCALATION_ACKNOWLEDGED',
          }),
        }),
      );
    });

    it('should resolve an active escalation when bottleneck is resolved', async () => {
      mockPrisma.workflowSlaEscalation.findFirst.mockResolvedValueOnce({
        id: 'esc-1',
        organizationId: mockOrgId,
        escalationLevel: 2,
        remarks: 'In review',
        instance: { applicationId: 'app-1' },
      });

      await service.resolveEscalation(
        'esc-1',
        { remarks: 'SPICe+ submission cleared and approved by MCA' },
        mockUser,
      );

      expect(mockPrisma.workflowSlaEscalation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'esc-1' },
          data: expect.objectContaining({
            status: 'RESOLVED',
            remarks: 'SPICe+ submission cleared and approved by MCA',
          }),
        }),
      );
    });
  });
});
