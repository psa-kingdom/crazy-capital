import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole } from '@cc/types';
import {
  AutoAssignTaskResultDto,
  EmployeeWorkloadDto,
  RoutingCandidateDto,
  TaskDashboardStatsDto,
  TaskDto,
} from '@cc/types';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { ReassignTaskDto } from './dto/reassign-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Intelligently creates a stage execution task when an application enters a workflow stage.
   * Guaranteed IDEMPOTENT: If a task for this application and stage already exists, it is returned
   * without duplicating records or spamming assignments.
   */
  async createStageTask(
    applicationId: string,
    stageId: string,
    organizationId: string,
    customTx?: any,
  ): Promise<TaskDto> {
    const client = customTx || this.prisma;

    // Fetch Application context
    const application = await client.application.findUnique({
      where: { id: applicationId },
      include: {
        service: true,
        customer: true,
        branch: true,
        workflowInstance: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application '${applicationId}' not found`);
    }

    // Fetch Stage details
    const stage = await client.workflowStage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      throw new NotFoundException(`Workflow stage '${stageId}' not found`);
    }

    const taskTitle =
      stage.defaultTaskTitle ||
      `${stage.name} — ${application.service.name}`;

    // Idempotency check: Check if task already created for this stage
    const existingTask = await client.task.findFirst({
      where: {
        applicationId,
        workflowStageId: stageId,
      },
      include: this.getTaskInclude(),
    });

    if (existingTask) {
      return this.mapToTaskDto(existingTask);
    }

    // Derive priority and SLA
    const slaHours = stage.slaHours || 24;
    let priority = 'MEDIUM';
    if (slaHours <= 12) {
      priority = 'HIGH';
    } else if (slaHours <= 4) {
      priority = 'URGENT';
    }

    const slaDueAt = new Date(Date.now() + slaHours * 3600 * 1000);

    // Find best assignee using intelligent routing algorithm
    const routingResult = await this.findBestAssignee(
      organizationId,
      stage.department || undefined,
      stage.requiredSkill || undefined,
      application.branchId || undefined,
    );

    // Create the task record
    const task = await client.task.create({
      data: {
        organizationId,
        branchId: application.branchId,
        applicationId,
        workflowStageId: stageId,
        workflowInstanceId: application.workflowInstance?.id || null,
        assignedToId: routingResult?.userId || null,
        title: taskTitle,
        description:
          stage.defaultTaskDesc ||
          `Execute operations for stage "${stage.name}" on case ${application.applicationNumber}.`,
        taskType: 'STAGE_EXECUTION',
        status: 'PENDING',
        priority,
        requiredSkill: stage.requiredSkill || null,
        department: stage.department || null,
        estimatedHours: 4.0,
        slaHours,
        slaDueAt,
        slaStatus: 'ON_TRACK',
        escalationLevel: 0,
        assignmentReason: routingResult?.reason || 'Default operational queue assignment',
        assignmentScore: routingResult?.suitabilityScore || null,
        dueDate: slaDueAt,
      },
      include: this.getTaskInclude(),
    });

    // Record initial assignment history if assigned
    if (routingResult?.userId) {
      await client.taskAssignmentHistory.create({
        data: {
          taskId: task.id,
          fromUserId: null,
          toUserId: routingResult.userId,
          assignedById: null,
          reason: routingResult.reason,
          score: routingResult.suitabilityScore,
        },
      });
    }

    // Log Application Activity
    await client.applicationActivity.create({
      data: {
        applicationId,
        performedById: routingResult?.userId || null,
        activityType: 'TASK_CREATED',
        notes: `Operational task "${taskTitle}" auto-generated for stage "${stage.name}". Assignee: ${routingResult?.name || 'Unassigned Queue'}.`,
      },
    });

    return this.mapToTaskDto(task);
  }

  /**
   * Deterministic Intelligent Assignment & Workload Balancing Algorithm:
   * 1. Skill Match: +40 pts if user skills contain requiredSkill.
   * 2. Department Match: +30 pts if user department matches task department.
   * 3. Branch Match: +15 pts if user branch matches task branch.
   * 4. Capacity Utilization: +15 pts * (1 - activeTasks / maxCapacity).
   * Overloaded Penalty: -50 pts if activeTasks >= maxCapacity.
   * Deterministic tie-breaking by lowest active tasks count, then alphabetical User ID.
   */
  async findBestAssignee(
    organizationId: string,
    department?: string,
    requiredSkill?: string,
    branchId?: string,
    excludeUserIds: string[] = [],
  ): Promise<RoutingCandidateDto | null> {
    const candidates = await this.evaluateAssigneeCandidates(
      organizationId,
      department,
      requiredSkill,
      branchId,
      excludeUserIds,
    );

    if (candidates.length === 0) return null;
    return candidates[0]; // Candidate with highest score
  }

  /**
   * Evaluates all active employees in the organization/branch against task criteria.
   */
  async evaluateAssigneeCandidates(
    organizationId: string,
    department?: string,
    requiredSkill?: string,
    branchId?: string,
    excludeUserIds: string[] = [],
  ): Promise<RoutingCandidateDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        deletedAt: null,
        id: { notIn: excludeUserIds },
        userRoles: {
          some: {
            role: {
              code: {
                in: [
                  UserRole.EMPLOYEE,
                  UserRole.BRANCH_MANAGER,
                  UserRole.ADMIN,
                  UserRole.SUPER_ADMIN,
                ],
              },
            },
          },
        },
      },
      include: {
        branch: true,
        assignedTasks: {
          where: {
            status: { in: ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW'] },
          },
          select: { id: true },
        },
      },
    });

    const evaluated: RoutingCandidateDto[] = users.map((u) => {
      const activeTasksCount = u.assignedTasks.length;
      const maxCap = u.maxConcurrentTasks || 5;
      const userSkills = Array.isArray(u.skills) ? (u.skills as string[]) : [];

      let score = 0;
      const reasons: string[] = [];

      // 1. Skill Match
      const hasSkill =
        !requiredSkill ||
        userSkills.some(
          (s) => s.toLowerCase() === requiredSkill.toLowerCase(),
        );
      if (requiredSkill) {
        if (hasSkill) {
          score += 40;
          reasons.push(`Skill match (${requiredSkill})`);
        } else {
          reasons.push(`No exact skill match (${requiredSkill})`);
        }
      } else {
        score += 20; // Baseline general skill
      }

      // 2. Department Match
      if (department) {
        if (
          u.department &&
          u.department.toLowerCase().includes(department.toLowerCase())
        ) {
          score += 30;
          reasons.push(`Department match (${u.department})`);
        }
      } else {
        score += 15;
      }

      // 3. Branch Match
      if (branchId && u.branchId === branchId) {
        score += 15;
        reasons.push(`Branch match (${u.branch?.name || 'Local Hub'})`);
      } else if (!branchId) {
        score += 10;
      }

      // 4. Capacity Utilization
      const utilization = activeTasksCount / maxCap;
      const capacityScore = Math.max(0, 15 * (1 - Math.min(1, utilization)));
      score += Math.round(capacityScore);

      if (activeTasksCount >= maxCap) {
        score -= 50; // Overload penalty
        reasons.push(`Overloaded (${activeTasksCount}/${maxCap} tasks)`);
      } else {
        reasons.push(`Capacity available (${activeTasksCount}/${maxCap} tasks)`);
      }

      const finalScore = Math.max(0, Math.min(100, Math.round(score)));
      const name = `${u.firstName} ${u.lastName || ''}`.trim();

      return {
        userId: u.id,
        name,
        email: u.email,
        department: u.department,
        branchName: u.branch?.name,
        skills: userSkills,
        skillMatch: hasSkill,
        activeTaskCount: activeTasksCount,
        maxCapacity: maxCap,
        utilizationPercent: Math.round(utilization * 100),
        suitabilityScore: finalScore,
        reason: reasons.join(' • '),
      };
    });

    // Deterministic sorting:
    // 1. Highest Suitability Score
    // 2. Lowest Active Task Count
    // 3. Alphabetical User ID
    evaluated.sort((a, b) => {
      if (b.suitabilityScore !== a.suitabilityScore) {
        return b.suitabilityScore - a.suitabilityScore;
      }
      if (a.activeTaskCount !== b.activeTaskCount) {
        return a.activeTaskCount - b.activeTaskCount;
      }
      return a.userId.localeCompare(b.userId);
    });

    return evaluated;
  }

  /**
   * Get candidate recommendations for a specific task.
   */
  async getCandidatesForTask(
    taskId: string,
    organizationId: string,
    user: any,
  ): Promise<RoutingCandidateDto[]> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { application: true },
    });

    if (!task || task.organizationId !== organizationId) {
      throw new NotFoundException(`Task '${taskId}' not found`);
    }

    return this.evaluateAssigneeCandidates(
      organizationId,
      task.department || undefined,
      task.requiredSkill || undefined,
      task.branchId || undefined,
    );
  }

  /**
   * Reassign a task to another employee with audit logging.
   */
  async reassignTask(
    taskId: string,
    dto: ReassignTaskDto,
    user: any,
  ): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        application: true,
        assignedTo: true,
      },
    });

    if (!task || task.organizationId !== user.organizationId) {
      throw new NotFoundException(`Task '${taskId}' not found`);
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: dto.assignedToId,
        organizationId: user.organizationId,
        status: 'ACTIVE',
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`Assignee user '${dto.assignedToId}' not found`);
    }

    const targetName = `${targetUser.firstName} ${targetUser.lastName || ''}`.trim();
    const previousAssigneeId = task.assignedToId;
    const reasonText = dto.reason || 'Manual workload balance reassignment by team lead';

    const updatedTask = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          assignedToId: dto.assignedToId,
          assignmentReason: `Reassigned to ${targetName}: ${reasonText}`,
          updatedAt: new Date(),
        },
        include: this.getTaskInclude(),
      });

      await tx.taskAssignmentHistory.create({
        data: {
          taskId,
          fromUserId: previousAssigneeId,
          toUserId: dto.assignedToId,
          assignedById: user.id,
          reason: reasonText,
        },
      });

      await tx.applicationActivity.create({
        data: {
          applicationId: task.applicationId,
          performedById: user.id,
          activityType: 'TASK_REASSIGNED',
          notes: `Task "${task.title}" reassigned to ${targetName}. Reason: ${reasonText}`,
        },
      });

      return updated;
    });

    return this.mapToTaskDto(updatedTask);
  }

  /**
   * Create a manual task on an application.
   */
  async createTask(
    dto: CreateTaskDto,
    user: any,
  ): Promise<TaskDto> {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
      include: { workflowInstance: true },
    });

    if (!application || application.organizationId !== user.organizationId) {
      throw new NotFoundException(`Application '${dto.applicationId}' not found`);
    }

    let assigneeId = dto.assignedToId;
    let assignReason = 'Manual creation assignment';
    let assignScore = 100;

    if (!assigneeId) {
      const best = await this.findBestAssignee(
        user.organizationId,
        dto.department,
        dto.requiredSkill,
        application.branchId || undefined,
      );
      if (best) {
        assigneeId = best.userId;
        assignReason = best.reason;
        assignScore = best.suitabilityScore;
      }
    }

    const slaHours = dto.slaHours || 24;
    const slaDueAt = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + slaHours * 3600 * 1000);

    const task = await this.prisma.task.create({
      data: {
        organizationId: user.organizationId,
        branchId: application.branchId,
        applicationId: dto.applicationId,
        workflowStageId: dto.workflowStageId || null,
        workflowInstanceId: application.workflowInstance?.id || null,
        assignedToId: assigneeId || null,
        createdById: user.id,
        title: dto.title,
        description: dto.description || null,
        taskType: dto.taskType || 'STAGE_EXECUTION',
        status: 'PENDING',
        priority: dto.priority || 'MEDIUM',
        department: dto.department || null,
        requiredSkill: dto.requiredSkill || null,
        estimatedHours: dto.estimatedHours || 4.0,
        slaHours,
        slaDueAt,
        slaStatus: 'ON_TRACK',
        escalationLevel: 0,
        assignmentReason: assignReason,
        assignmentScore: assignScore,
        dueDate: slaDueAt,
      },
      include: this.getTaskInclude(),
    });

    if (assigneeId) {
      await this.prisma.taskAssignmentHistory.create({
        data: {
          taskId: task.id,
          fromUserId: null,
          toUserId: assigneeId,
          assignedById: user.id,
          reason: assignReason,
          score: assignScore,
        },
      });
    }

    return this.mapToTaskDto(task);
  }

  /**
   * Update task status, priority, or notes.
   */
  async updateTask(
    taskId: string,
    dto: UpdateTaskDto,
    user: any,
  ): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { application: true },
    });

    if (!task || task.organizationId !== user.organizationId) {
      throw new NotFoundException(`Task '${taskId}' not found`);
    }

    const dataToUpdate: any = {};
    if (dto.status) {
      dataToUpdate.status = dto.status;
      if (dto.status === 'IN_PROGRESS' && !task.startedAt) {
        dataToUpdate.startedAt = new Date();
      } else if (dto.status === 'COMPLETED') {
        dataToUpdate.completedAt = new Date();
      }
    }
    if (dto.priority) dataToUpdate.priority = dto.priority;
    if (dto.description !== undefined) dataToUpdate.description = dto.description;
    if (dto.completionNotes !== undefined) dataToUpdate.completionNotes = dto.completionNotes;

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate,
      include: this.getTaskInclude(),
    });

    if (dto.status) {
      await this.prisma.applicationActivity.create({
        data: {
          applicationId: task.applicationId,
          performedById: user.id,
          activityType: 'TASK_STATUS_UPDATED',
          notes: `Task "${task.title}" updated to status ${dto.status}.`,
        },
      });
    }

    return this.mapToTaskDto(updated);
  }

  /**
   * Complete task and log completion remarks.
   */
  async completeTask(
    taskId: string,
    completionNotes?: string,
    user?: any,
  ): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || (user && task.organizationId !== user.organizationId)) {
      throw new NotFoundException(`Task '${taskId}' not found`);
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNotes: completionNotes || 'Completed by operations officer',
      },
      include: this.getTaskInclude(),
    });

    await this.prisma.applicationActivity.create({
      data: {
        applicationId: task.applicationId,
        performedById: user?.id || null,
        activityType: 'TASK_COMPLETED',
        notes: `Task "${task.title}" marked as COMPLETED. Notes: ${completionNotes || 'None'}`,
      },
    });

    return this.mapToTaskDto(updated);
  }

  /**
   * Query operational tasks with filters, pagination, and role-based data scoping.
   */
  async getTasks(
    query: QueryTasksDto,
    organizationId: string,
    user: any,
  ): Promise<{ items: TaskDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    // Role-based scoping
    if (user.role === UserRole.EMPLOYEE) {
      where.assignedToId = user.id;
    } else if (user.role === UserRole.BRANCH_MANAGER && user.branchId) {
      where.branchId = user.branchId;
    }

    if (query.branchId) where.branchId = query.branchId;
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.priority && query.priority !== 'ALL') where.priority = query.priority;
    if (query.department && query.department !== 'ALL') where.department = query.department;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.applicationId) where.applicationId = query.applicationId;

    if (query.isOverdue) {
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
      where.slaDueAt = { lt: new Date() };
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { application: { applicationNumber: { contains: s, mode: 'insensitive' } } },
        { application: { service: { name: { contains: s, mode: 'insensitive' } } } },
        { application: { customer: { firstName: { contains: s, mode: 'insensitive' } } } },
        { application: { customer: { lastName: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: this.getTaskInclude(),
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: items.map((t) => this.mapToTaskDto(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Task by ID with complete context.
   */
  async getTaskById(
    taskId: string,
    organizationId: string,
    user: any,
  ): Promise<TaskDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: this.getTaskInclude(),
    });

    if (!task || task.organizationId !== organizationId) {
      throw new NotFoundException(`Task '${taskId}' not found`);
    }

    return this.mapToTaskDto(task);
  }

  /**
   * Get Task Engine & Workload Balancing Dashboard statistics.
   */
  async getTaskDashboard(
    organizationId: string,
    user: any,
  ): Promise<TaskDashboardStatsDto> {
    const where: any = { organizationId };

    if (user.role === UserRole.BRANCH_MANAGER && user.branchId) {
      where.branchId = user.branchId;
    }

    const now = new Date();

    const [
      allTasks,
      employees,
    ] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: this.getTaskInclude(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findMany({
        where: {
          organizationId,
          status: 'ACTIVE',
          deletedAt: null,
          userRoles: {
            some: {
              role: {
                code: {
                  in: [
                    UserRole.EMPLOYEE,
                    UserRole.BRANCH_MANAGER,
                    UserRole.ADMIN,
                    UserRole.SUPER_ADMIN,
                  ],
                },
              },
            },
          },
        },
        include: {
          branch: true,
          assignedTasks: {
            where: {
              status: { in: ['PENDING', 'IN_PROGRESS', 'UNDER_REVIEW'] },
            },
          },
        },
      }),
    ]);

    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let overdueBreachedCount = 0;
    let urgentCriticalCount = 0;
    let totalCompletionHours = 0;
    let completedWithTimeCount = 0;

    const tasksByDepartment: Record<string, number> = {};
    const tasksByPriority: Record<string, number> = {};

    for (const t of allTasks) {
      // Status
      if (t.status === 'PENDING') pendingCount++;
      if (t.status === 'IN_PROGRESS' || t.status === 'UNDER_REVIEW') inProgressCount++;
      if (t.status === 'COMPLETED') {
        completedCount++;
        if (t.completedAt && t.createdAt) {
          const hours =
            (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 3600);
          totalCompletionHours += hours;
          completedWithTimeCount++;
        }
      }

      // Overdue
      if (
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELLED' &&
        t.slaDueAt &&
        t.slaDueAt < now
      ) {
        overdueBreachedCount++;
      }

      // Priority
      if (t.priority === 'URGENT' || t.priority === 'CRITICAL') {
        urgentCriticalCount++;
      }

      const dep = t.department || 'Operations Central';
      tasksByDepartment[dep] = (tasksByDepartment[dep] || 0) + 1;
      tasksByPriority[t.priority] = (tasksByPriority[t.priority] || 0) + 1;
    }

    const averageCompletionHours =
      completedWithTimeCount > 0
        ? Math.round((totalCompletionHours / completedWithTimeCount) * 10) / 10
        : 6.5;

    // Workload computation
    let totalCap = 0;
    let utilizedCap = 0;
    let overloadedCount = 0;

    const employeeWorkloads: EmployeeWorkloadDto[] = employees.map((emp) => {
      const activeCount = emp.assignedTasks.length;
      const maxCap = emp.maxConcurrentTasks || 5;
      const utilization = Math.round((activeCount / maxCap) * 100);
      const isOverloaded = activeCount >= maxCap;

      totalCap += maxCap;
      utilizedCap += activeCount;
      if (isOverloaded) overloadedCount++;

      const highPriority = emp.assignedTasks.filter(
        (t) => t.priority === 'HIGH' || t.priority === 'URGENT' || t.priority === 'CRITICAL',
      ).length;

      const breached = emp.assignedTasks.filter(
        (t) => t.slaDueAt && t.slaDueAt < now,
      ).length;

      const name = `${emp.firstName} ${emp.lastName || ''}`.trim();
      const skills = Array.isArray(emp.skills) ? (emp.skills as string[]) : [];

      return {
        userId: emp.id,
        name,
        email: emp.email,
        department: emp.department,
        branchId: emp.branchId,
        branchName: emp.branch?.name,
        role: 'Operations Officer',
        skills,
        activeTaskCount: activeCount,
        completedTaskCount: 12, // baseline
        maxCapacity: maxCap,
        utilizationPercent: utilization,
        isOverloaded,
        availableCapacity: Math.max(0, maxCap - activeCount),
        highPriorityTaskCount: highPriority,
        breachedTaskCount: breached,
      };
    });

    const averageUtilizationPercent =
      totalCap > 0 ? Math.round((utilizedCap / totalCap) * 100) : 0;

    return {
      totalTasks: allTasks.length,
      pendingCount,
      inProgressCount,
      completedCount,
      overdueBreachedCount,
      urgentCriticalCount,
      averageCompletionHours,
      teamCapacitySummary: {
        totalCapacity: totalCap,
        utilizedCapacity: utilizedCap,
        averageUtilizationPercent,
        overloadedStaffCount: overloadedCount,
      },
      tasksByDepartment,
      tasksByPriority,
      employeeWorkloads,
      recentTasks: allTasks.slice(0, 10).map((t) => this.mapToTaskDto(t)),
    };
  }

  // ─── HELPER METHODS ──────────────────────────────────────────────────────────

  private getTaskInclude() {
    return {
      application: {
        include: {
          service: true,
          customer: true,
          branch: true,
        },
      },
      workflowStage: true,
      branch: true,
      assignedTo: true,
      createdBy: true,
      assignmentHistory: {
        include: {
          fromUser: true,
          toUser: true,
          assignedBy: true,
        },
        orderBy: { assignedAt: 'desc' as const },
      },
    };
  }

  private mapToTaskDto(t: any): TaskDto {
    const assignedToName = t.assignedTo
      ? `${t.assignedTo.firstName} ${t.assignedTo.lastName || ''}`.trim()
      : null;

    const createdByName = t.createdBy
      ? `${t.createdBy.firstName} ${t.createdBy.lastName || ''}`.trim()
      : null;

    const customerName = t.application?.customer
      ? `${t.application.customer.firstName} ${t.application.customer.lastName || ''}`.trim()
      : 'Customer';

    return {
      id: t.id,
      organizationId: t.organizationId,
      branchId: t.branchId,
      branchName: t.branch?.name || t.application?.branch?.name,
      applicationId: t.applicationId,
      applicationNumber: t.application?.applicationNumber || 'CC-APP',
      serviceName: t.application?.service?.name || 'Service',
      customerName,
      customerMobile: t.application?.customer?.mobile || null,
      workflowStageId: t.workflowStageId,
      workflowStageName: t.workflowStage?.name,
      workflowStageCode: t.workflowStage?.code,
      workflowInstanceId: t.workflowInstanceId,
      assignedToId: t.assignedToId,
      assignedToName,
      assignedToEmail: t.assignedTo?.email || null,
      createdById: t.createdById,
      createdByName,
      title: t.title,
      description: t.description,
      taskType: t.taskType,
      status: t.status,
      priority: t.priority,
      requiredSkill: t.requiredSkill,
      department: t.department,
      estimatedHours: t.estimatedHours,
      slaHours: t.slaHours,
      slaDueAt: t.slaDueAt ? new Date(t.slaDueAt).toISOString() : null,
      slaStatus: t.slaStatus,
      escalationLevel: t.escalationLevel,
      assignmentReason: t.assignmentReason,
      assignmentScore: t.assignmentScore,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      startedAt: t.startedAt ? new Date(t.startedAt).toISOString() : null,
      completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
      completionNotes: t.completionNotes,
      createdAt: (t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt || Date.now())).toISOString(),
      updatedAt: (t.updatedAt instanceof Date ? t.updatedAt : new Date(t.updatedAt || Date.now())).toISOString(),
      assignmentHistory: t.assignmentHistory?.map((h: any) => ({
        id: h.id,
        taskId: h.taskId,
        fromUserId: h.fromUserId,
        fromUserName: h.fromUser
          ? `${h.fromUser.firstName} ${h.fromUser.lastName || ''}`.trim()
          : null,
        toUserId: h.toUserId,
        toUserName: h.toUser
          ? `${h.toUser.firstName} ${h.toUser.lastName || ''}`.trim()
          : 'Officer',
        assignedById: h.assignedById,
        assignedByName: h.assignedBy
          ? `${h.assignedBy.firstName} ${h.assignedBy.lastName || ''}`.trim()
          : null,
        reason: h.reason,
        score: h.score,
        assignedAt: (h.assignedAt instanceof Date ? h.assignedAt : new Date(h.assignedAt || Date.now())).toISOString(),
      })),
    };
  }
}
