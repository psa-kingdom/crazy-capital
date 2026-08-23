import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { CreateWorkflowStageDto } from './dto/create-workflow-stage.dto';
import { CreateWorkflowTransitionDto } from './dto/create-workflow-transition.dto';
import { CreateWorkflowRuleDto } from './dto/create-workflow-rule.dto';
import { TransitionWorkflowInstanceDto } from './dto/transition-instance.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { BulkUpdateWorkflowGraphDto } from './dto/bulk-update-graph.dto';
import { UpdateWorkflowStageDto } from './dto/update-stage.dto';
import { CloneWorkflowDto } from './dto/clone-workflow.dto';
import {
  ApplicationStatus,
  WorkflowGraphDto,
  WorkflowNodeDto,
  WorkflowEdgeDto,
  WorkflowRuleType,
  WorkflowStageType,
} from '@cc/types';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private generateCode(name: string): string {
    return (
      'WF_' +
      name
        .toUpperCase()
        .trim()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    );
  }

  async findAll() {
    return this.prisma.workflow.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            rules: true,
          },
        },
        transitions: {
          include: {
            fromStage: true,
            toStage: true,
          },
        },
        _count: {
          select: {
            instances: true,
            stages: true,
            transitions: true,
          },
        },
      },
    });
  }

  async create(dto: CreateWorkflowDto) {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: { workflow: true },
    });

    if (!service) {
      throw new NotFoundException(`Service '${dto.serviceId}' not found`);
    }

    // ADR-012: Exactly one workflow per service (1:1)
    if (service.workflow) {
      throw new ConflictException(
        `Service '${service.name}' already has a workflow configured (ADR-012: 1:1 service-to-workflow mapping enforced)`,
      );
    }

    const code = dto.code ? dto.code.trim().toUpperCase() : this.generateCode(dto.name);
    const existingCode = await this.prisma.workflow.findUnique({
      where: { code },
    });
    if (existingCode) {
      throw new ConflictException(`Workflow with code '${code}' already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const workflow = await tx.workflow.create({
        data: {
          serviceId: dto.serviceId,
          name: dto.name.trim(),
          code,
          description: dto.description?.trim() || null,
          isActive: dto.isActive ?? true,
        },
      });

      // If stages provided, create them in sequence
      if (dto.stages && dto.stages.length > 0) {
        let hasStart = false;
        for (const st of dto.stages) {
          const isStart = st.isStartStage || (!hasStart && st.stageOrder === 1);
          if (isStart) hasStart = true;

          await tx.workflowStage.create({
            data: {
              workflowId: workflow.id,
              name: st.name.trim(),
              code: st.code.trim().toUpperCase(),
              stageOrder: st.stageOrder,
              stageType: st.stageType || (isStart ? WorkflowStageType.START : WorkflowStageType.PROCESSING),
              isStartStage: isStart,
              isEndStage: st.isEndStage ?? false,
              isMandatory: st.isMandatory ?? true,
              slaHours: st.slaHours || null,
            },
          });
        }
      }

      return tx.workflow.findUnique({
        where: { id: workflow.id },
        include: {
          stages: { orderBy: { stageOrder: 'asc' } },
          transitions: true,
          service: true,
        },
      });
    });
  }

  async findOne(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            rules: true,
            fromTransitions: {
              include: { toStage: true },
            },
            toTransitions: {
              include: { fromStage: true },
            },
          },
        },
        transitions: {
          include: {
            fromStage: true,
            toStage: true,
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow '${id}' not found`);
    }

    return workflow;
  }

  async findByServiceId(serviceId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { serviceId },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            rules: true,
            fromTransitions: {
              include: { toStage: true },
            },
            toTransitions: {
              include: { fromStage: true },
            },
          },
        },
        transitions: {
          include: {
            fromStage: true,
            toStage: true,
          },
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException(`No workflow configured for service '${serviceId}'`);
    }

    return workflow;
  }

  async update(id: string, dto: UpdateWorkflowDto) {
    await this.findOne(id);

    return this.prisma.workflow.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        stages: { orderBy: { stageOrder: 'asc' } },
        transitions: true,
      },
    });
  }

  async getGraph(id: string): Promise<WorkflowGraphDto> {
    const workflow = await this.findOne(id);

    const validationWarnings: string[] = [];
    const validationErrors: string[] = [];

    // Map stages to Visual Graph Nodes with layout coordinates
    const nodes: WorkflowNodeDto[] = workflow.stages.map((st, idx) => {
      const x = st.canvasX ?? 100 + (idx % 4) * 260;
      const y = st.canvasY ?? 100 + Math.floor(idx / 4) * 180;

      let nodeType: 'start' | 'processing' | 'approval' | 'completion' | 'rejection' = 'processing';
      if (st.isStartStage || st.stageType === 'START') nodeType = 'start';
      else if (st.stageType === 'APPROVAL') nodeType = 'approval';
      else if (st.stageType === 'COMPLETION' || st.isEndStage) nodeType = 'completion';
      else if (st.stageType === 'REJECTION') nodeType = 'rejection';

      return {
        id: st.id,
        type: nodeType,
        label: st.name,
        code: st.code,
        stageOrder: st.stageOrder,
        stageType: st.stageType,
        slaHours: st.slaHours,
        warningHours: st.warningHours,
        isStartStage: st.isStartStage,
        isEndStage: st.isEndStage,
        isMandatory: st.isMandatory,
        rulesCount: st.rules ? st.rules.length : 0,
        rules: st.rules
          ? st.rules.map((r) => ({
              id: r.id,
              stageId: r.stageId,
              ruleType: r.ruleType,
              ruleConfig: r.ruleConfig as any,
            }))
          : [],
        position: { x, y },
      };
    });

    // Map transitions to Visual Graph Edges
    const edges: WorkflowEdgeDto[] = workflow.transitions.map((tr) => ({
      id: tr.id,
      source: tr.fromStageId,
      target: tr.toStageId,
      label: tr.conditionLabel || (tr.requiresApproval ? 'Requires Approval' : undefined),
      requiresApproval: tr.requiresApproval,
      animated: tr.requiresApproval,
    }));

    // Graph Analysis: Start Node & Terminals
    const startNodes = nodes.filter((n) => n.isStartStage || n.stageType === 'START');
    if (startNodes.length === 0 && nodes.length > 0) {
      validationErrors.push('Workflow has no designated Start stage.');
    } else if (startNodes.length > 1) {
      validationErrors.push(`Workflow has ${startNodes.length} Start stages (only 1 allowed).`);
    }

    const startNodeId = startNodes[0]?.id || null;
    const terminalNodeIds = nodes.filter((n) => n.isEndStage || n.stageType === 'COMPLETION').map((n) => n.id);

    if (terminalNodeIds.length === 0 && nodes.length > 0) {
      validationWarnings.push('Workflow has no designated Completion or End stage.');
    }

    // Reachability Analysis from Start Node
    if (startNodeId) {
      const visited = new Set<string>();
      const queue = [startNodeId];
      visited.add(startNodeId);

      const adjList = new Map<string, string[]>();
      for (const e of edges) {
        if (!adjList.has(e.source)) adjList.set(e.source, []);
        adjList.get(e.source)!.push(e.target);
      }

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = adjList.get(curr) || [];
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        }
      }

      for (const node of nodes) {
        if (!visited.has(node.id)) {
          validationWarnings.push(`Stage '${node.label}' (${node.code}) is unreachable from Start stage.`);
        }
      }
    }

    return {
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowCode: workflow.code,
      serviceId: workflow.serviceId,
      serviceName: workflow.service?.name || '',
      isActive: workflow.isActive,
      nodes,
      edges,
      isCyclic: false, // Directed Acyclic or Controlled Flow
      startNodeId,
      terminalNodeIds,
      validationWarnings,
      validationErrors,
    };
  }

  async bulkUpdateGraph(id: string, dto: BulkUpdateWorkflowGraphDto) {
    const workflow = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert / update stages
      const existingStages = await tx.workflowStage.findMany({
        where: { workflowId: id },
      });
      const existingMap = new Map(existingStages.map((s) => [s.code, s]));
      const stageCodeToId = new Map<string, string>();

      // Delete stages no longer present if no active instances
      const incomingCodes = new Set(dto.stages.map((s) => s.code.trim().toUpperCase()));
      for (const s of existingStages) {
        if (!incomingCodes.has(s.code)) {
          const activeInstancesCount = await tx.workflowInstance.count({
            where: { currentStageId: s.id },
          });
          if (activeInstancesCount > 0) {
            throw new BadRequestException(
              `Cannot delete stage '${s.name}' (${s.code}) because ${activeInstancesCount} active applications are in this stage.`,
            );
          }
          await tx.workflowStage.delete({ where: { id: s.id } });
        }
      }

      // Upsert stages
      for (const st of dto.stages) {
        const code = st.code.trim().toUpperCase();
        const existing = existingMap.get(code);

        if (existing) {
          const updated = await tx.workflowStage.update({
            where: { id: existing.id },
            data: {
              name: st.name.trim(),
              stageOrder: st.stageOrder,
              stageType: st.stageType || existing.stageType,
              isStartStage: st.isStartStage ?? false,
              isEndStage: st.isEndStage ?? false,
              isMandatory: st.isMandatory ?? true,
              slaHours: st.slaHours ?? null,
              warningHours: st.warningHours ?? null,
              department: st.department?.trim() || null,
              canvasX: st.canvasX ?? existing.canvasX,
              canvasY: st.canvasY ?? existing.canvasY,
            },
          });
          stageCodeToId.set(code, updated.id);
        } else {
          const created = await tx.workflowStage.create({
            data: {
              workflowId: id,
              name: st.name.trim(),
              code,
              stageOrder: st.stageOrder,
              stageType: st.stageType || WorkflowStageType.PROCESSING,
              isStartStage: st.isStartStage ?? false,
              isEndStage: st.isEndStage ?? false,
              isMandatory: st.isMandatory ?? true,
              slaHours: st.slaHours ?? null,
              warningHours: st.warningHours ?? null,
              department: st.department?.trim() || null,
              canvasX: st.canvasX ?? null,
              canvasY: st.canvasY ?? null,
            },
          });
          stageCodeToId.set(code, created.id);
        }
      }

      // 2. Re-create transitions
      await tx.workflowTransition.deleteMany({
        where: { workflowId: id },
      });

      for (const tr of dto.transitions) {
        const fromStageId = stageCodeToId.get(tr.fromStageCode.trim().toUpperCase());
        const toStageId = stageCodeToId.get(tr.toStageCode.trim().toUpperCase());

        if (fromStageId && toStageId && fromStageId !== toStageId) {
          await tx.workflowTransition.create({
            data: {
              workflowId: id,
              fromStageId,
              toStageId,
              requiresApproval: tr.requiresApproval ?? false,
              conditionLabel: tr.conditionLabel?.trim() || null,
            },
          });
        }
      }

      // 3. Upsert rules if provided
      if (dto.rules && dto.rules.length > 0) {
        for (const rule of dto.rules) {
          const stageId = stageCodeToId.get(rule.stageCode.trim().toUpperCase());
          if (stageId) {
            await tx.workflowRule.create({
              data: {
                stageId,
                ruleType: rule.ruleType,
                ruleConfig: rule.ruleConfig,
              },
            });
          }
        }
      }

      return this.findOne(id);
    });
  }

  async updateStage(stageId: string, dto: UpdateWorkflowStageDto) {
    const stage = await this.prisma.workflowStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) {
      throw new NotFoundException(`Stage '${stageId}' not found`);
    }

    return this.prisma.workflowStage.update({
      where: { id: stageId },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.stageOrder && { stageOrder: dto.stageOrder }),
        ...(dto.stageType && { stageType: dto.stageType }),
        ...(dto.isStartStage !== undefined && { isStartStage: dto.isStartStage }),
        ...(dto.isEndStage !== undefined && { isEndStage: dto.isEndStage }),
        ...(dto.isMandatory !== undefined && { isMandatory: dto.isMandatory }),
        ...(dto.slaHours !== undefined && { slaHours: dto.slaHours }),
        ...(dto.warningHours !== undefined && { warningHours: dto.warningHours }),
        ...(dto.department !== undefined && { department: dto.department?.trim() || null }),
        ...(dto.canvasX !== undefined && { canvasX: dto.canvasX }),
        ...(dto.canvasY !== undefined && { canvasY: dto.canvasY }),
      },
    });
  }

  async deleteStage(stageId: string) {
    const stage = await this.prisma.workflowStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) {
      throw new NotFoundException(`Stage '${stageId}' not found`);
    }

    const activeCount = await this.prisma.workflowInstance.count({
      where: { currentStageId: stageId },
    });
    if (activeCount > 0) {
      throw new BadRequestException(
        `Cannot delete stage '${stage.name}' because ${activeCount} active application(s) are currently in this stage.`,
      );
    }

    return this.prisma.workflowStage.delete({
      where: { id: stageId },
    });
  }

  async deleteTransition(transitionId: string) {
    const transition = await this.prisma.workflowTransition.findUnique({
      where: { id: transitionId },
    });
    if (!transition) {
      throw new NotFoundException(`Transition '${transitionId}' not found`);
    }

    return this.prisma.workflowTransition.delete({
      where: { id: transitionId },
    });
  }

  async deleteRule(ruleId: string) {
    const rule = await this.prisma.workflowRule.findUnique({
      where: { id: ruleId },
    });
    if (!rule) {
      throw new NotFoundException(`Rule '${ruleId}' not found`);
    }

    return this.prisma.workflowRule.delete({
      where: { id: ruleId },
    });
  }

  async cloneWorkflow(sourceWorkflowId: string, dto: CloneWorkflowDto) {
    const source = await this.findOne(sourceWorkflowId);

    const targetService = await this.prisma.service.findUnique({
      where: { id: dto.targetServiceId },
      include: { workflow: true },
    });
    if (!targetService) {
      throw new NotFoundException(`Target service '${dto.targetServiceId}' not found`);
    }
    if (targetService.workflow) {
      throw new ConflictException(
        `Target service '${targetService.name}' already has a workflow configured (ADR-012: 1:1 mapping)`,
      );
    }

    const code = dto.code ? dto.code.trim().toUpperCase() : this.generateCode(dto.name);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create cloned master workflow
      const cloned = await tx.workflow.create({
        data: {
          serviceId: dto.targetServiceId,
          name: dto.name.trim(),
          code,
          description: source.description ? `Cloned from ${source.name}: ${source.description}` : `Cloned from ${source.name}`,
          isActive: true,
        },
      });

      // 2. Clone stages
      const stageMap = new Map<string, string>(); // oldStageId -> newStageId
      for (const st of source.stages) {
        const newStage = await tx.workflowStage.create({
          data: {
            workflowId: cloned.id,
            name: st.name,
            code: st.code,
            stageOrder: st.stageOrder,
            stageType: st.stageType,
            isStartStage: st.isStartStage,
            isEndStage: st.isEndStage,
            isMandatory: st.isMandatory,
            slaHours: st.slaHours,
            warningHours: st.warningHours,
            department: st.department,
            canvasX: st.canvasX,
            canvasY: st.canvasY,
          },
        });
        stageMap.set(st.id, newStage.id);

        // Clone rules on this stage
        if (st.rules && st.rules.length > 0) {
          for (const r of st.rules) {
            await tx.workflowRule.create({
              data: {
                stageId: newStage.id,
                ruleType: r.ruleType,
                ruleConfig: r.ruleConfig as any,
              },
            });
          }
        }
      }

      // 3. Clone transitions
      for (const tr of source.transitions) {
        const newFromId = stageMap.get(tr.fromStageId);
        const newToId = stageMap.get(tr.toStageId);
        if (newFromId && newToId) {
          await tx.workflowTransition.create({
            data: {
              workflowId: cloned.id,
              fromStageId: newFromId,
              toStageId: newToId,
              requiresApproval: tr.requiresApproval,
              conditionLabel: tr.conditionLabel,
            },
          });
        }
      }

      return tx.workflow.findUnique({
        where: { id: cloned.id },
        include: {
          stages: { orderBy: { stageOrder: 'asc' }, include: { rules: true } },
          transitions: true,
          service: true,
        },
      });
    });
  }

  async addStage(workflowId: string, dto: CreateWorkflowStageDto) {
    await this.findOne(workflowId);

    const existingCode = await this.prisma.workflowStage.findUnique({
      where: {
        workflowId_code: {
          workflowId,
          code: dto.code.trim().toUpperCase(),
        },
      },
    });
    if (existingCode) {
      throw new ConflictException(`Stage code '${dto.code}' already exists in this workflow`);
    }

    const existingOrder = await this.prisma.workflowStage.findUnique({
      where: {
        workflowId_stageOrder: {
          workflowId,
          stageOrder: dto.stageOrder,
        },
      },
    });
    if (existingOrder) {
      throw new ConflictException(`Stage order '${dto.stageOrder}' is already assigned to '${existingOrder.name}'`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isStartStage) {
        await tx.workflowStage.updateMany({
          where: { workflowId, isStartStage: true },
          data: { isStartStage: false },
        });
      }

      return tx.workflowStage.create({
        data: {
          workflowId,
          name: dto.name.trim(),
          code: dto.code.trim().toUpperCase(),
          stageOrder: dto.stageOrder,
          stageType: dto.stageType || WorkflowStageType.PROCESSING,
          isStartStage: dto.isStartStage ?? false,
          isEndStage: dto.isEndStage ?? false,
          isMandatory: dto.isMandatory ?? true,
          slaHours: dto.slaHours || null,
        },
      });
    });
  }

  async addTransition(workflowId: string, dto: CreateWorkflowTransitionDto) {
    await this.findOne(workflowId);

    if (dto.fromStageId === dto.toStageId) {
      throw new BadRequestException('A stage cannot transition to itself');
    }

    const [fromStage, toStage] = await Promise.all([
      this.prisma.workflowStage.findFirst({
        where: { id: dto.fromStageId, workflowId },
      }),
      this.prisma.workflowStage.findFirst({
        where: { id: dto.toStageId, workflowId },
      }),
    ]);

    if (!fromStage) {
      throw new NotFoundException(`From Stage '${dto.fromStageId}' does not belong to this workflow`);
    }
    if (!toStage) {
      throw new NotFoundException(`To Stage '${dto.toStageId}' does not belong to this workflow`);
    }

    const existing = await this.prisma.workflowTransition.findUnique({
      where: {
        workflowId_fromStageId_toStageId: {
          workflowId,
          fromStageId: dto.fromStageId,
          toStageId: dto.toStageId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Transition already exists between these stages');
    }

    return this.prisma.workflowTransition.create({
      data: {
        workflowId,
        fromStageId: dto.fromStageId,
        toStageId: dto.toStageId,
        requiresApproval: dto.requiresApproval ?? false,
      },
      include: {
        fromStage: true,
        toStage: true,
      },
    });
  }

  async addRule(stageId: string, dto: CreateWorkflowRuleDto) {
    const stage = await this.prisma.workflowStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) {
      throw new NotFoundException(`Workflow stage '${stageId}' not found`);
    }

    return this.prisma.workflowRule.create({
      data: {
        stageId,
        ruleType: dto.ruleType,
        ruleConfig: dto.ruleConfig,
      },
    });
  }

  async transitionInstance(
    instanceId: string,
    dto: TransitionWorkflowInstanceDto,
    performedByUserId?: string,
    organizationId?: string,
  ) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: {
          include: {
            transitions: true,
            stages: true,
          },
        },
        currentStage: {
          include: {
            rules: true,
          },
        },
        application: true,
      },
    });

    if (!instance) {
      throw new NotFoundException(`Workflow instance '${instanceId}' not found`);
    }

    if (organizationId && instance.application.organizationId !== organizationId) {
      throw new NotFoundException(`Workflow instance '${instanceId}' not found`);
    }

    if (instance.completedAt) {
      throw new BadRequestException('Workflow instance is already in a completed/terminal state');
    }

    // 1. Verify allowable transition exists
    const validTransition = instance.workflow.transitions.find(
      (t) => t.fromStageId === instance.currentStageId && t.toStageId === dto.targetStageId,
    );

    const targetStage = instance.workflow.stages.find((s) => s.id === dto.targetStageId);
    if (!targetStage) {
      throw new NotFoundException(`Target stage '${dto.targetStageId}' does not belong to this workflow`);
    }

    if (!validTransition) {
      throw new BadRequestException(
        `Invalid workflow transition: '${instance.currentStage.name}' ➔ '${targetStage.name}' is not an authorized transition`,
      );
    }

    // 2. Validate Gate Rules on current stage
    for (const rule of instance.currentStage.rules) {
      if (rule.ruleType === WorkflowRuleType.DOCUMENT_GATE) {
        const config = rule.ruleConfig as any;
        if (config?.requireAllVerified) {
          const docs = await this.prisma.document.findMany({
            where: { applicationId: instance.applicationId },
          });

          const mandatoryDocRequirements = await this.prisma.serviceDocument.findMany({
            where: { serviceId: instance.application.serviceId, isMandatory: true },
          });

          for (const req of mandatoryDocRequirements) {
            const uploaded = docs.find((d) => d.documentTypeId === req.documentTypeId);
            if (!uploaded || uploaded.status !== 'VERIFIED') {
              throw new BadRequestException(
                `Document Gate check failed: All mandatory documents must be verified before leaving '${instance.currentStage.name}'`,
              );
            }
          }
        }
      }

      if (rule.ruleType === WorkflowRuleType.PAYMENT_GATE || rule.ruleType === 'PAYMENT_GATE') {
        const invoices = await this.prisma.invoice.findMany({
          where: { applicationId: instance.applicationId },
          include: { payments: true },
        });

        if (invoices.length === 0) {
          throw new BadRequestException(
            `Payment Gate check failed: No invoice has been generated for application '${instance.application.applicationNumber}'`,
          );
        }

        const isPaid = invoices.some(
          (inv) =>
            inv.status === 'PAID' ||
            inv.payments.some((p) => p.status === 'CAPTURED'),
        );

        if (!isPaid) {
          throw new BadRequestException(
            `Payment Gate check failed: Invoice payment must be completed before leaving '${instance.currentStage.name}'`,
          );
        }
      }
    }

    // 3. Execute atomic transition
    const result = await this.prisma.$transaction(async (tx) => {
      const isCompleted = targetStage.isEndStage;

      const updatedInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          currentStageId: dto.targetStageId,
          completedAt: isCompleted ? new Date() : null,
        },
        include: {
          currentStage: true,
          workflow: true,
          application: true,
        },
      });

      // Record immutable workflow audit history
      const history = await tx.workflowHistory.create({
        data: {
          workflowInstanceId: instanceId,
          fromStageId: instance.currentStageId,
          toStageId: dto.targetStageId,
          performedById: performedByUserId || null,
          remarks: dto.remarks?.trim() || `Transitioned from ${instance.currentStage.name} to ${targetStage.name}`,
        },
      });

      // Update linked Application status if needed
      let nextAppStatus: ApplicationStatus | undefined;
      if (targetStage.stageType === WorkflowStageType.COMPLETION || targetStage.isEndStage) {
        nextAppStatus = ApplicationStatus.COMPLETED;
      } else if (targetStage.stageType === WorkflowStageType.REJECTION) {
        nextAppStatus = ApplicationStatus.REJECTED;
      } else if (instance.application.status === ApplicationStatus.SUBMITTED) {
        nextAppStatus = ApplicationStatus.IN_PROGRESS;
      }

      if (nextAppStatus) {
        await tx.application.update({
          where: { id: instance.applicationId },
          data: { status: nextAppStatus },
        });
      }

      return {
        instance: updatedInstance,
        history,
      };
    });

    // 4. Dispatch Async Multi-Channel Notifications (Non-blocking ADR-020)
    try {
      if (result.instance.application.customerId) {
        const customer = await this.prisma.customer.findUnique({
          where: { id: result.instance.application.customerId },
        });

        if (customer && customer.email) {
          await this.notificationsService.send({
            channel: 'EMAIL',
            eventType: 'workflow.transition',
            recipient: customer.email,
            subject: `Update on Application #${result.instance.application.applicationNumber}`,
            body: `Your application has progressed to stage: ${targetStage.name}. Current Status: ${targetStage.isEndStage ? 'Completed' : 'Processing'}.`,
            metadata: {
              applicationId: instance.applicationId,
              applicationNumber: result.instance.application.applicationNumber,
              targetStage: targetStage.name,
            },
          });
        }
      }
    } catch (notifErr) {
      // Graceful error isolation
    }

    return result;
  }

  async getInstanceHistory(instanceId: string) {
    return this.prisma.workflowHistory.findMany({
      where: { workflowInstanceId: instanceId },
      orderBy: { createdAt: 'asc' },
      include: {
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}

