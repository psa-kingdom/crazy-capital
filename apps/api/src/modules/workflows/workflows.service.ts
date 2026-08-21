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
import { ApplicationStatus, WorkflowRuleType, WorkflowStageType } from '@cc/types';

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

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
        service: true,
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
        stages: {
          orderBy: { stageOrder: 'asc' },
          include: {
            rules: true,
            fromTransitions: {
              include: { toStage: true },
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

    // Tenant boundary check if organizationId provided
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
          // Check application's documents
          const docs = await this.prisma.document.findMany({
            where: { applicationId: instance.applicationId },
          });

          // Check if any mandatory document is not verified
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
    }

    // 3. Execute atomic transition
    return this.prisma.$transaction(async (tx) => {
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

      // Record application activity
      await tx.applicationActivity.create({
        data: {
          applicationId: instance.applicationId,
          performedById: performedByUserId || null,
          activityType: 'WORKFLOW_TRANSITION',
          notes: `Workflow stage advanced to '${targetStage.name}'${dto.remarks ? `. Remarks: ${dto.remarks}` : ''}`,
        },
      });

      return {
        instance: updatedInstance,
        history,
      };
    });
  }

  async getHistory(instanceId: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });
    if (!instance) {
      throw new NotFoundException(`Workflow instance '${instanceId}' not found`);
    }

    return this.prisma.workflowHistory.findMany({
      where: { workflowInstanceId: instanceId },
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
      orderBy: { createdAt: 'desc' },
    });
  }
}
