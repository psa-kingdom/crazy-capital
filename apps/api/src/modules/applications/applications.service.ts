import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { AssignApplicationDto } from './dto/assign-application.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateApplicationActivityDto } from './dto/create-application-activity.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { ApplicationStatus, TaskStatus, UserRole } from '@cc/types';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateApplicationNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CC-${year}-`;

    const count = await this.prisma.application.count({
      where: {
        applicationNumber: {
          startsWith: prefix,
        },
      },
    });

    let nextNumber = count + 1;
    let applicationNumber = `${prefix}${String(nextNumber).padStart(6, '0')}`;

    // Collision check loop
    while (await this.prisma.application.findUnique({ where: { applicationNumber } })) {
      nextNumber++;
      applicationNumber = `${prefix}${String(nextNumber).padStart(6, '0')}`;
    }

    return applicationNumber;
  }

  async create(dto: CreateApplicationDto, user: any) {
    const orgId = user.organizationId;

    // 1. Verify customer exists in user organization
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId: orgId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException(`Customer '${dto.customerId}' not found in your organization`);
    }

    // 2. Verify service is active and has configured workflow
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, deletedAt: null },
      include: {
        workflow: {
          include: {
            stages: { orderBy: { stageOrder: 'asc' } },
          },
        },
      },
    });
    if (!service) {
      throw new NotFoundException(`Service '${dto.serviceId}' not found`);
    }
    if (!service.isActive) {
      throw new BadRequestException(`Service '${service.name}' is currently inactive`);
    }
    if (!service.workflow || service.workflow.stages.length === 0) {
      throw new BadRequestException(
        `Service '${service.name}' does not have an active workflow blueprint configured (ADR-012)`,
      );
    }

    // 3. Find workflow start stage
    const startStage =
      service.workflow.stages.find((s) => s.isStartStage) || service.workflow.stages[0];

    // 4. Branch assignment
    const branchId = dto.branchId || customer.branchId || user.branchId || null;

    // 5. Generate application number CC-YYYY-XXXXXX
    const applicationNumber = await this.generateApplicationNumber(orgId);

    // 6. Execute atomic creation
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          organizationId: orgId,
          branchId,
          customerId: customer.id,
          serviceId: service.id,
          applicationNumber,
          status: ApplicationStatus.SUBMITTED,
          assignedToId: dto.assignedToId || null,
        },
      });

      // Create linked WorkflowInstance
      const instance = await tx.workflowInstance.create({
        data: {
          workflowId: service.workflow!.id,
          applicationId: application.id,
          currentStageId: startStage.id,
        },
      });

      // Initial application activity
      await tx.applicationActivity.create({
        data: {
          applicationId: application.id,
          performedById: user.id,
          activityType: 'CREATED',
          notes: `Application ${applicationNumber} registered for ${service.name}. Workflow initiated at stage '${startStage.name}'.`,
        },
      });

      if (dto.notes) {
        await tx.applicationActivity.create({
          data: {
            applicationId: application.id,
            performedById: user.id,
            activityType: 'NOTE',
            notes: dto.notes.trim(),
          },
        });
      }

      return tx.application.findUnique({
        where: { id: application.id },
        include: {
          customer: true,
          service: true,
          branch: true,
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          workflowInstance: {
            include: {
              currentStage: true,
            },
          },
          activities: true,
        },
      });
    });
  }

  async findAll(query: QueryApplicationsDto, user: any) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const isEmployee = user.roles?.includes(UserRole.EMPLOYEE);
    const isBranchManager = user.roles?.includes(UserRole.BRANCH_MANAGER);

    const where: any = {
      organizationId: user.organizationId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.serviceId && { serviceId: query.serviceId }),
      ...(query.assignedToId && { assignedToId: query.assignedToId }),
      ...(query.branchId && { branchId: query.branchId }),
      ...(query.search && {
        OR: [
          { applicationNumber: { contains: query.search, mode: 'insensitive' } },
          {
            customer: {
              OR: [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { mobile: { contains: query.search } },
                { companyName: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          },
          { service: { name: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    // Branch scoping for employees / branch managers
    if (isEmployee && !isBranchManager) {
      if (user.branchId) {
        where.AND = [
          {
            OR: [
              { branchId: user.branchId },
              { assignedToId: user.id },
            ],
          },
        ];
      } else {
        where.assignedToId = user.id;
      }
    } else if (isBranchManager && user.branchId) {
      where.branchId = user.branchId;
    }

    const [total, data] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              companyName: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          branch: {
            select: { id: true, name: true, code: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          workflowInstance: {
            include: {
              currentStage: {
                select: { id: true, name: true, code: true, stageOrder: true, stageType: true },
              },
            },
          },
          _count: {
            select: { tasks: true, documents: true, activities: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    const application = await this.prisma.application.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        customer: {
          include: {
            addresses: true,
            contacts: true,
          },
        },
        service: {
          include: {
            category: true,
            pricing: true,
            requiredDocuments: {
              include: { documentType: true },
            },
          },
        },
        branch: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, mobile: true },
        },
        workflowInstance: {
          include: {
            currentStage: {
              include: {
                rules: true,
                fromTransitions: {
                  include: { toStage: true },
                },
              },
            },
            workflow: {
              include: {
                stages: { orderBy: { stageOrder: 'asc' } },
              },
            },
            history: {
              include: {
                performedBy: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          include: {
            performedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          include: { documentType: true },
        },
        invoices: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application '${id}' not found`);
    }

    // Branch scoping
    const isEmployee = user.roles?.includes(UserRole.EMPLOYEE);
    const isBranchManager = user.roles?.includes(UserRole.BRANCH_MANAGER);
    if (isEmployee && !isBranchManager && user.branchId && application.branchId && application.branchId !== user.branchId && application.assignedToId !== user.id) {
      throw new ForbiddenException('You do not have permission to access applications outside your branch');
    }

    return application;
  }

  async assign(id: string, dto: AssignApplicationDto, user: any) {
    const application = await this.findOne(id, user);

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: dto.assignedToUserId,
        organizationId: user.organizationId,
        status: 'ACTIVE',
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`User '${dto.assignedToUserId}' not found in your organization`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: { assignedToId: targetUser.id },
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await tx.applicationActivity.create({
        data: {
          applicationId: id,
          performedById: user.id,
          activityType: 'ASSIGNMENT',
          notes: `Application assigned to ${targetUser.firstName} ${targetUser.lastName}${dto.remarks ? `. Remarks: ${dto.remarks}` : ''}`,
        },
      });

      return updated;
    });
  }

  async createTask(id: string, dto: CreateTaskDto, user: any) {
    await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          applicationId: id,
          workflowStageId: dto.workflowStageId || null,
          assignedToId: dto.assignedToId || user.id,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          status: TaskStatus.PENDING,
        },
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await tx.applicationActivity.create({
        data: {
          applicationId: id,
          performedById: user.id,
          activityType: 'TASK_CREATED',
          notes: `Task created: "${task.title}"`,
        },
      });

      return task;
    });
  }

  async updateTask(taskId: string, dto: UpdateTaskDto, user: any) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { application: true },
    });

    if (!task || task.application.organizationId !== user.organizationId) {
      throw new NotFoundException(`Task '${taskId}' not found`);
    }

    const isCompleted = dto.status === TaskStatus.COMPLETED;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          ...(dto.title && { title: dto.title.trim() }),
          ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
          ...(dto.status && { status: dto.status }),
          ...(dto.assignedToId && { assignedToId: dto.assignedToId }),
          ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
          ...(isCompleted && { completedAt: new Date() }),
        },
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      if (dto.status) {
        await tx.applicationActivity.create({
          data: {
            applicationId: task.applicationId,
            performedById: user.id,
            activityType: 'TASK_UPDATED',
            notes: `Task "${task.title}" marked as ${dto.status}`,
          },
        });
      }

      return updated;
    });
  }

  async addActivity(id: string, dto: CreateApplicationActivityDto, user: any) {
    await this.findOne(id, user);

    return this.prisma.applicationActivity.create({
      data: {
        applicationId: id,
        performedById: user.id,
        activityType: dto.activityType || 'NOTE',
        notes: dto.notes.trim(),
      },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async transitionStage(id: string, targetStageId: string, user: any, notes?: string) {
    const app = await this.findOne(id, user);
    if (!app.workflowInstance) {
      throw new BadRequestException(
        `Application ${app.applicationNumber} does not have an active workflow instance`,
      );
    }

    const currentStageId = app.workflowInstance.currentStageId;
    const transition = await this.prisma.workflowTransition.findFirst({
      where: {
        workflowId: app.workflowInstance.workflowId,
        fromStageId: currentStageId,
        toStageId: targetStageId,
      },
      include: { toStage: true, fromStage: true },
    });

    if (!transition) {
      throw new BadRequestException(
        `Invalid workflow transition from current stage to requested target stage`,
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Update WorkflowInstance with reset SLA timer
      const updatedInstance = await tx.workflowInstance.update({
        where: { id: app.workflowInstance!.id },
        data: {
          currentStageId: targetStageId,
          stageEnteredAt: now,
          slaStatus: 'ON_TRACK',
          escalationLevel: 0,
          lastSlaCheckAt: now,
          ...(transition.toStage.isEndStage && { completedAt: now }),
        },
        include: { currentStage: true },
      });

      // 2. Resolve any active escalations from previous stage
      await tx.workflowSlaEscalation.updateMany({
        where: {
          workflowInstanceId: app.workflowInstance!.id,
          stageId: currentStageId,
          status: 'TRIGGERED',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: now,
          remarks: `Auto-resolved on stage transition to ${transition.toStage.name}`,
        },
      });

      // 3. Record WorkflowHistory
      await tx.workflowHistory.create({
        data: {
          workflowInstanceId: app.workflowInstance!.id,
          fromStageId: currentStageId,
          toStageId: targetStageId,
          performedById: user.id,
          remarks: notes || `Advanced to ${transition.toStage.name}`,
        },
      });

      // 4. Record ApplicationActivity
      await tx.applicationActivity.create({
        data: {
          applicationId: app.id,
          performedById: user.id,
          activityType: 'STAGE_CHANGED',
          notes: `Stage transitioned from "${transition.fromStage.name}" to "${transition.toStage.name}". SLA timer reset.`,
        },
      });

      // 5. Update application status if terminal stage
      if (transition.toStage.isEndStage) {
        await tx.application.update({
          where: { id: app.id },
          data: { status: ApplicationStatus.COMPLETED },
        });
      }

      return updatedInstance;
    });
  }
}

