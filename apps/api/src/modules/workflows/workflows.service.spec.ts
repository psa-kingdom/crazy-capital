import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ApplicationStatus, WorkflowRuleType, WorkflowStageType } from '@cc/types';
import { NotificationsService } from '../notifications/notifications.service';

describe('Configurable Workflow Engine (Vertical Slice 1.5 - ADR-012)', () => {
  let workflowsService: WorkflowsService;
  let prisma: PrismaService;

  const mockPrisma = {
    service: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    workflow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workflowStage: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    workflowTransition: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    workflowRule: {
      create: jest.fn(),
    },
    workflowInstance: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workflowHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    document: {
      findMany: jest.fn(),
    },
    serviceDocument: {
      findMany: jest.fn(),
    },
    application: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    applicationActivity: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: NotificationsService,
          useValue: {
            send: jest.fn().mockResolvedValue({ id: 'log-1', status: 'SENT' }),
            dispatchMultiChannel: jest.fn().mockResolvedValue([{ id: 'log-1', status: 'SENT' }]),
          },
        },
      ],
    }).compile();

    workflowsService = module.get<WorkflowsService>(WorkflowsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Workflow Blueprint Creation & ADR-012 Enforcement', () => {
    it('1. should create workflow blueprint with auto-generated code', async () => {
      mockPrisma.service.findUnique.mockResolvedValueOnce({
        id: 'srv-pvt',
        name: 'Private Limited Company Incorporation',
        workflow: null,
      });
      mockPrisma.workflow.findUnique.mockResolvedValueOnce(null); // code check
      mockPrisma.workflow.create.mockResolvedValueOnce({
        id: 'wf-1',
        serviceId: 'srv-pvt',
        name: 'Pvt Ltd Flow',
        code: 'WF_PVT_LTD_FLOW',
      });
      mockPrisma.workflow.findUnique.mockResolvedValueOnce({
        id: 'wf-1',
        name: 'Pvt Ltd Flow',
        code: 'WF_PVT_LTD_FLOW',
        stages: [],
      });

      const res = await workflowsService.create({
        serviceId: 'srv-pvt',
        name: 'Pvt Ltd Flow',
      });

      expect(res.code).toBe('WF_PVT_LTD_FLOW');
      expect(mockPrisma.workflow.create).toHaveBeenCalled();
    });

    it('2. should strictly enforce ADR-012 (1:1 Service-to-Workflow) by rejecting second workflow', async () => {
      mockPrisma.service.findUnique.mockResolvedValueOnce({
        id: 'srv-pvt',
        name: 'Private Limited Company Incorporation',
        workflow: { id: 'wf-existing-1', name: 'Existing Workflow' },
      });

      await expect(
        workflowsService.create({
          serviceId: 'srv-pvt',
          name: 'Duplicate Flow',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('3. should add ordered stages and reject duplicate stage codes in same workflow', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValueOnce({ id: 'wf-1', name: 'Incorporation Flow' });
      mockPrisma.workflowStage.findUnique.mockResolvedValueOnce({ id: 'st-old', code: 'DOC_VERIFICATION' }); // duplicate code check

      await expect(
        workflowsService.addStage('wf-1', {
          name: 'Doc Verification',
          code: 'DOC_VERIFICATION',
          stageOrder: 2,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('4. should reset previous start stage when a new start stage is added', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValueOnce({ id: 'wf-1' });
      mockPrisma.workflowStage.findUnique
        .mockResolvedValueOnce(null) // code check
        .mockResolvedValueOnce(null); // order check
      mockPrisma.workflowStage.updateMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.workflowStage.create.mockResolvedValueOnce({
        id: 'st-new-start',
        name: 'Intake',
        isStartStage: true,
      });

      const res = await workflowsService.addStage('wf-1', {
        name: 'Intake',
        code: 'INTAKE',
        stageOrder: 1,
        isStartStage: true,
      });

      expect(mockPrisma.workflowStage.updateMany).toHaveBeenCalledWith({
        where: { workflowId: 'wf-1', isStartStage: true },
        data: { isStartStage: false },
      });
      expect(res.isStartStage).toBe(true);
    });

    it('5. should reject self-transitions (stage transitioning to itself)', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValueOnce({ id: 'wf-1' });

      await expect(
        workflowsService.addTransition('wf-1', {
          fromStageId: 'st-1',
          toStageId: 'st-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Workflow Execution & Gate Rules', () => {
    const mockWorkflow = {
      id: 'wf-1',
      transitions: [
        { fromStageId: 'st-1', toStageId: 'st-2', requiresApproval: false },
        { fromStageId: 'st-2', toStageId: 'st-3', requiresApproval: false },
      ],
      stages: [
        { id: 'st-1', name: 'Document Collection', stageType: 'START', isEndStage: false },
        { id: 'st-2', name: 'MCA SPICe+ Filing', stageType: 'PROCESSING', isEndStage: false },
        { id: 'st-3', name: 'Incorporation Certificate Issued', stageType: 'COMPLETION', isEndStage: true },
      ],
    };

    it('6. should execute valid workflow stage transition and record immutable history', async () => {
      mockPrisma.workflowInstance.findUnique.mockResolvedValueOnce({
        id: 'inst-1',
        applicationId: 'app-1',
        currentStageId: 'st-1',
        completedAt: null,
        currentStage: { id: 'st-1', name: 'Document Collection', rules: [] },
        workflow: mockWorkflow,
        application: { id: 'app-1', organizationId: 'org-1', status: 'SUBMITTED' },
      });

      mockPrisma.workflowInstance.update.mockResolvedValueOnce({
        id: 'inst-1',
        currentStageId: 'st-2',
      });
      mockPrisma.workflowHistory.create.mockResolvedValueOnce({
        id: 'wh-1',
        fromStageId: 'st-1',
        toStageId: 'st-2',
        performedById: 'user-admin',
      });

      const res = await workflowsService.transitionInstance(
        'inst-1',
        { targetStageId: 'st-2', remarks: 'Docs verified' },
        'user-admin',
        'org-1',
      );

      expect(mockPrisma.workflowHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fromStageId: 'st-1',
            toStageId: 'st-2',
            performedById: 'user-admin',
          }),
        }),
      );
      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-1' },
          data: { status: ApplicationStatus.IN_PROGRESS },
        }),
      );
    });

    it('7. should reject unauthorized non-sequential transition with 400 BadRequestException', async () => {
      mockPrisma.workflowInstance.findUnique.mockResolvedValueOnce({
        id: 'inst-1',
        applicationId: 'app-1',
        currentStageId: 'st-1',
        completedAt: null,
        currentStage: { id: 'st-1', name: 'Document Collection', rules: [] },
        workflow: mockWorkflow, // only st-1 -> st-2 exists, not st-1 -> st-3
        application: { id: 'app-1', organizationId: 'org-1', status: 'SUBMITTED' },
      });

      await expect(
        workflowsService.transitionInstance(
          'inst-1',
          { targetStageId: 'st-3' }, // invalid jump
          'user-admin',
          'org-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('8. should enforce Document Gate rule by blocking transition if mandatory docs are unverified', async () => {
      mockPrisma.workflowInstance.findUnique.mockResolvedValueOnce({
        id: 'inst-1',
        applicationId: 'app-1',
        currentStageId: 'st-1',
        completedAt: null,
        currentStage: {
          id: 'st-1',
          name: 'Document Collection',
          rules: [
            {
              ruleType: WorkflowRuleType.DOCUMENT_GATE,
              ruleConfig: { requireAllVerified: true },
            },
          ],
        },
        workflow: mockWorkflow,
        application: { id: 'app-1', organizationId: 'org-1', serviceId: 'srv-pvt', status: 'SUBMITTED' },
      });

      // Mandatory docs required
      mockPrisma.serviceDocument.findMany.mockResolvedValueOnce([
        { documentTypeId: 'dt-pan', isMandatory: true },
      ]);
      // Document in vault is only 'PENDING', not 'VERIFIED'
      mockPrisma.document.findMany.mockResolvedValueOnce([
        { documentTypeId: 'dt-pan', status: 'PENDING' },
      ]);

      await expect(
        workflowsService.transitionInstance(
          'inst-1',
          { targetStageId: 'st-2' },
          'user-admin',
          'org-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('9. should mark workflow and application as COMPLETED when entering terminal end stage', async () => {
      mockPrisma.workflowInstance.findUnique.mockResolvedValueOnce({
        id: 'inst-1',
        applicationId: 'app-1',
        currentStageId: 'st-2',
        completedAt: null,
        currentStage: { id: 'st-2', name: 'MCA SPICe+ Filing', rules: [] },
        workflow: mockWorkflow,
        application: { id: 'app-1', organizationId: 'org-1', status: 'IN_PROGRESS' },
      });

      mockPrisma.workflowInstance.update.mockResolvedValueOnce({
        id: 'inst-1',
        currentStageId: 'st-3',
        completedAt: new Date(),
      });
      mockPrisma.workflowHistory.create.mockResolvedValueOnce({ id: 'wh-2' });

      await workflowsService.transitionInstance(
        'inst-1',
        { targetStageId: 'st-3', remarks: 'Certificate generated' },
        'user-admin',
        'org-1',
      );

      expect(mockPrisma.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            currentStageId: 'st-3',
            completedAt: expect.any(Date),
          }),
        }),
      );
      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: ApplicationStatus.COMPLETED },
        }),
      );
    });

    it('10. should block transitioning an already completed workflow instance', async () => {
      mockPrisma.workflowInstance.findUnique.mockResolvedValueOnce({
        id: 'inst-1',
        completedAt: new Date(),
        application: { organizationId: 'org-1' },
      });

      await expect(
        workflowsService.transitionInstance('inst-1', { targetStageId: 'st-2' }, 'user-admin', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Visual Workflow Builder & DAG Graph Engine (Slice 2.1)', () => {
    it('11. should compute DAG graph structure with nodes, edges and reachability analysis', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValueOnce({
        id: 'wf-1',
        serviceId: 'srv-1',
        name: 'Private Limited Incorporation',
        code: 'WF_PVT_LTD',
        isActive: true,
        service: { id: 'srv-1', name: 'Pvt Ltd' },
        stages: [
          {
            id: 'st-1',
            name: 'Document Collection',
            code: 'DOC_COLLECTION',
            stageOrder: 1,
            stageType: 'START',
            isStartStage: true,
            isEndStage: false,
            isMandatory: true,
            slaHours: 24,
            warningHours: 18,
            canvasX: 100,
            canvasY: 150,
            rules: [{ id: 'r-1', ruleType: 'DOCUMENT_GATE', ruleConfig: {} }],
          },
          {
            id: 'st-2',
            name: 'MCA SPICe+ Filing',
            code: 'MCA_FILING',
            stageOrder: 2,
            stageType: 'PROCESSING',
            isStartStage: false,
            isEndStage: false,
            isMandatory: true,
            slaHours: 48,
            warningHours: 36,
            canvasX: 400,
            canvasY: 150,
            rules: [],
          },
          {
            id: 'st-3',
            name: 'Incorporation Certificate Issued',
            code: 'COI_ISSUED',
            stageOrder: 3,
            stageType: 'COMPLETION',
            isStartStage: false,
            isEndStage: true,
            isMandatory: true,
            slaHours: null,
            canvasX: 700,
            canvasY: 150,
            rules: [],
          },
        ],
        transitions: [
          {
            id: 'tr-1',
            fromStageId: 'st-1',
            toStageId: 'st-2',
            requiresApproval: false,
            conditionLabel: 'Docs Verified',
          },
          {
            id: 'tr-2',
            fromStageId: 'st-2',
            toStageId: 'st-3',
            requiresApproval: true,
            conditionLabel: 'MCA Approved',
          },
        ],
      });

      const graph = await workflowsService.getGraph('wf-1');

      expect(graph.workflowId).toBe('wf-1');
      expect(graph.nodes).toHaveLength(3);
      expect(graph.edges).toHaveLength(2);
      expect(graph.startNodeId).toBe('st-1');
      expect(graph.terminalNodeIds).toContain('st-3');
      expect(graph.validationErrors).toHaveLength(0);
      expect(graph.validationWarnings).toHaveLength(0);
    });

    it('12. should perform atomic bulk update on graph stages, layout coordinates and transitions', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValueOnce({
        id: 'wf-1',
        name: 'Workflow 1',
        stages: [],
        transitions: [],
      });

      mockPrisma.workflowStage.findMany = jest.fn().mockResolvedValueOnce([]);
      mockPrisma.workflowStage.create = jest.fn().mockResolvedValue({ id: 'new-st-1' });
      mockPrisma.workflowTransition.deleteMany = jest.fn().mockResolvedValue({ count: 0 });
      mockPrisma.workflowTransition.create = jest.fn().mockResolvedValue({ id: 'new-tr-1' });

      mockPrisma.workflow.findUnique.mockResolvedValueOnce({
        id: 'wf-1',
        name: 'Workflow 1',
        stages: [{ id: 'new-st-1', code: 'START_STAGE' }],
        transitions: [],
      });

      const result = await workflowsService.bulkUpdateGraph('wf-1', {
        stages: [
          {
            name: 'Start Stage',
            code: 'START_STAGE',
            stageOrder: 1,
            stageType: WorkflowStageType.START,
            isStartStage: true,
            isEndStage: false,
            slaHours: 12,
            canvasX: 50,
            canvasY: 50,
          },
        ],
        transitions: [],
      });

      expect(result).toBeDefined();
    });

    it('13. should clone an entire workflow blueprint with stages and transitions for another service', async () => {
      mockPrisma.workflow.findUnique.mockResolvedValueOnce({
        id: 'wf-src',
        name: 'Source Flow',
        description: 'Standard incorporation flow',
        stages: [
          {
            id: 'st-old-1',
            name: 'Stage 1',
            code: 'ST_1',
            stageOrder: 1,
            stageType: 'START',
            isStartStage: true,
            isEndStage: false,
            isMandatory: true,
            slaHours: 24,
            rules: [],
          },
        ],
        transitions: [],
      });

      mockPrisma.service.findUnique.mockResolvedValueOnce({
        id: 'srv-target',
        name: 'Target Service',
        workflow: null,
      });

      mockPrisma.workflow.create = jest.fn().mockResolvedValueOnce({ id: 'wf-cloned' });
      mockPrisma.workflowStage.create = jest.fn().mockResolvedValueOnce({ id: 'st-new-1' });
      mockPrisma.workflow.findUnique.mockResolvedValueOnce({
        id: 'wf-cloned',
        name: 'Cloned Flow',
        stages: [{ id: 'st-new-1' }],
        transitions: [],
      });

      const cloned = await workflowsService.cloneWorkflow('wf-src', {
        targetServiceId: 'srv-target',
        name: 'Cloned Flow',
      });

      expect(cloned).toBeDefined();
    });

    it('14. should block deleting a workflow stage if active instances reside on it', async () => {
      mockPrisma.workflowStage.findUnique = jest.fn().mockResolvedValueOnce({
        id: 'st-active',
        name: 'Active Processing',
      });
      mockPrisma.workflowInstance.count = jest.fn().mockResolvedValueOnce(3);

      await expect(workflowsService.deleteStage('st-active')).rejects.toThrow(BadRequestException);
    });
  });
});

