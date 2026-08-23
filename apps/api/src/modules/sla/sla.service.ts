import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { QueryEscalationsDto } from './dto/query-escalations.dto';
import { AcknowledgeEscalationDto } from './dto/acknowledge-escalation.dto';
import {
  ActiveInstanceSlaTrackerDto,
  EscalationLevel,
  EscalationRecipientRole,
  SlaDashboardStatsDto,
  SlaEvaluationResultDto,
  SlaStatus,
  UserRole,
  WorkflowSlaEscalationDto,
} from '@cc/types';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Evaluates all active workflow instances across an organization (or all organizations)
   */
  async evaluateAllActiveWorkflows(
    organizationId?: string,
    referenceTime?: Date,
  ): Promise<SlaEvaluationResultDto> {
    const startTime = Date.now();
    const evalTime = referenceTime || new Date();

    const whereClause: any = {
      completedAt: null,
      currentStage: {
        slaHours: { not: null },
      },
    };

    if (organizationId) {
      whereClause.application = { organizationId, deletedAt: null };
    } else {
      whereClause.application = { deletedAt: null };
    }

    const activeInstances = await this.prisma.workflowInstance.findMany({
      where: whereClause,
      include: {
        currentStage: true,
        application: {
          include: {
            service: true,
            customer: true,
            branch: true,
            assignedTo: true,
          },
        },
      },
    });

    let warningTriggeredCount = 0;
    let breachTriggeredCount = 0;
    let escalationsCreatedCount = 0;
    let notificationsDispatchedCount = 0;

    for (const instance of activeInstances) {
      const res = await this.evaluateInstance(instance, evalTime);
      if (res.warningTriggered) warningTriggeredCount++;
      if (res.breachTriggered) breachTriggeredCount++;
      escalationsCreatedCount += res.escalationsCreated;
      notificationsDispatchedCount += res.notificationsDispatched;
    }

    const durationMs = Date.now() - startTime;
    this.logger.log(
      `SLA Evaluation completed for ${activeInstances.length} instances in ${durationMs}ms. Escalations created: ${escalationsCreatedCount}.`,
    );

    return {
      evaluatedCount: activeInstances.length,
      warningTriggeredCount,
      breachTriggeredCount,
      escalationsCreatedCount,
      notificationsDispatchedCount,
      durationMs,
      timestamp: evalTime.toISOString(),
    };
  }

  /**
   * Deterministic evaluation of a single workflow instance
   */
  async evaluateInstanceById(
    instanceId: string,
    referenceTime?: Date,
  ): Promise<ActiveInstanceSlaTrackerDto> {
    const evalTime = referenceTime || new Date();

    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        currentStage: true,
        application: {
          include: {
            service: true,
            customer: true,
            branch: true,
            assignedTo: true,
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException(`Workflow instance '${instanceId}' not found`);
    }

    await this.evaluateInstance(instance, evalTime);
    return this.mapToTrackerDto(instance, evalTime);
  }

  /**
   * Core SLA Engine evaluation & 4-tier escalation state machine
   */
  private async evaluateInstance(
    instance: any,
    now: Date,
  ): Promise<{
    warningTriggered: boolean;
    breachTriggered: boolean;
    escalationsCreated: number;
    notificationsDispatched: number;
  }> {
    const stage = instance.currentStage;
    if (!stage || !stage.slaHours) {
      return {
        warningTriggered: false,
        breachTriggered: false,
        escalationsCreated: 0,
        notificationsDispatched: 0,
      };
    }

    const stageEnteredAt = new Date(instance.stageEnteredAt || instance.startedAt);
    const elapsedMs = Math.max(0, now.getTime() - stageEnteredAt.getTime());
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    const slaHours = stage.slaHours;
    const warningHours = stage.warningHours || Math.max(1, Math.round(slaHours * 0.75));

    let calculatedStatus: SlaStatus = 'ON_TRACK';
    let targetEscalationLevel = 0;

    // ─── 4-TIER ESCALATION EVALUATION MATRIX ─────────────────────────────────
    // Level 1: Warning Trigger (elapsed >= warningHours & < slaHours)
    // Level 2: Initial Breach (elapsed >= slaHours & < slaHours + 12h)
    // Level 3: Extended Breach (elapsed >= slaHours + 12h & < slaHours + 24h)
    // Level 4: Critical Red Alert (elapsed >= slaHours + 24h)

    if (elapsedHours >= slaHours + 24) {
      calculatedStatus = 'ESCALATED';
      targetEscalationLevel = 4;
    } else if (elapsedHours >= slaHours + 12) {
      calculatedStatus = 'ESCALATED';
      targetEscalationLevel = 3;
    } else if (elapsedHours >= slaHours) {
      calculatedStatus = 'BREACHED';
      targetEscalationLevel = 2;
    } else if (elapsedHours >= warningHours) {
      calculatedStatus = 'WARNING';
      targetEscalationLevel = 1;
    } else {
      calculatedStatus = 'ON_TRACK';
      targetEscalationLevel = 0;
    }

    let escalationsCreated = 0;
    let notificationsDispatched = 0;
    let warningTriggered = false;
    let breachTriggered = false;

    // Process escalations from Level 1 up to targetEscalationLevel
    if (targetEscalationLevel >= 1) {
      for (let lvl = 1; lvl <= targetEscalationLevel; lvl++) {
        const created = await this.triggerEscalationTier(
          instance,
          stage,
          lvl as EscalationLevel,
          elapsedHours,
          slaHours,
          warningHours,
          now,
        );
        if (created) {
          escalationsCreated++;
          notificationsDispatched++;
          if (lvl === 1) warningTriggered = true;
          if (lvl >= 2) breachTriggered = true;
        }
      }
    }

    // Update WorkflowInstance current status
    await this.prisma.workflowInstance.update({
      where: { id: instance.id },
      data: {
        slaStatus: calculatedStatus,
        escalationLevel: targetEscalationLevel,
        lastSlaCheckAt: now,
      },
    });

    return {
      warningTriggered,
      breachTriggered,
      escalationsCreated,
      notificationsDispatched,
    };
  }

  /**
   * Triggers a specific escalation tier with duplicate suppression & idempotency
   */
  private async triggerEscalationTier(
    instance: any,
    stage: any,
    level: EscalationLevel,
    elapsedHours: number,
    slaHours: number,
    warningHours: number,
    now: Date,
  ): Promise<boolean> {
    const orgId = instance.application.organizationId;

    // 1. Idempotency Check: verify if escalation for [instance, stage, level] already exists
    const existing = await this.prisma.workflowSlaEscalation.findUnique({
      where: {
        workflowInstanceId_stageId_escalationLevel: {
          workflowInstanceId: instance.id,
          stageId: stage.id,
          escalationLevel: level,
        },
      },
    });

    if (existing) {
      // Already recorded and triggered, avoid duplicate escalation storm
      return false;
    }

    // 2. Resolve recipient details according to tier
    const recipientInfo = await this.resolveEscalationRecipient(instance, level);

    const levelNames: Record<number, string> = {
      1: 'ASSIGNED_EXECUTIVE',
      2: 'TEAM_LEAD',
      3: 'BRANCH_MANAGER',
      4: 'SUPER_ADMIN',
    };
    const levelName = levelNames[level] || 'EXECUTIVE';

    const channels = level === 1 ? ['IN_APP', 'EMAIL'] : ['IN_APP', 'EMAIL', 'WHATSAPP'];

    // 3. Create persistent escalation record
    await this.prisma.workflowSlaEscalation.create({
      data: {
        organizationId: orgId,
        workflowInstanceId: instance.id,
        stageId: stage.id,
        escalationLevel: level,
        levelName,
        recipientUserId: recipientInfo.userId,
        recipientRole: recipientInfo.role,
        recipientEmail: recipientInfo.email,
        channels: channels as any,
        status: 'TRIGGERED',
        remarks: `Auto-escalation Level ${level} (${levelName}) triggered at ${Math.round(elapsedHours)}h elapsed (SLA: ${slaHours}h).`,
        triggeredAt: now,
      },
    });

    // 4. Log application audit activity
    await this.prisma.applicationActivity.create({
      data: {
        applicationId: instance.application.id,
        activityType: 'ESCALATION_TRIGGERED',
        notes: `[SLA Auto-Escalation Level ${level}] Stage "${stage.name}" exceeded target SLA (${Math.round(elapsedHours)}h elapsed). Alerted ${recipientInfo.role} (${recipientInfo.email || 'System'}).`,
        performedById: recipientInfo.userId || null,
      },
    });

    // 5. Dispatch non-blocking notification via NotificationsService
    const remainingHours = Math.max(0, Math.round((slaHours - elapsedHours) * 10) / 10);
    const eventType = level === 1 ? 'workflow.sla_warning' : 'workflow.sla_escalation';

    const templateData = {
      applicationNumber: instance.application.applicationNumber,
      serviceName: instance.application.service.name,
      stageName: stage.name,
      slaHours,
      warningHours,
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      remainingHours,
      escalationLevel: level,
      levelName,
      recipientName: recipientInfo.name,
      recipientRole: recipientInfo.role,
      assignedOfficer: instance.application.assignedTo?.name || 'Assigned Executive',
    };

    const idempotencyKey = `sla_esc_${instance.id}_${stage.id}_lvl${level}`;

    if (recipientInfo.email) {
      this.notificationsService
        .send(
          {
            channel: 'EMAIL',
            eventType,
            recipient: recipientInfo.email,
            userId: recipientInfo.userId || undefined,
            templateData,
            idempotencyKey: `${idempotencyKey}_email`,
            metadata: { workflowInstanceId: instance.id, stageId: stage.id, level },
          },
          orgId,
        )
        .catch((err) =>
          this.logger.warn(`Failed to dispatch email escalation notification: ${err.message}`),
        );
    }

    if (level >= 2 && (instance.application.assignedTo?.mobile || instance.application.customer?.mobile)) {
      const phone = instance.application.assignedTo?.mobile || '9999999999';
      this.notificationsService
        .send(
          {
            channel: 'WHATSAPP',
            eventType,
            recipient: phone,
            userId: recipientInfo.userId || undefined,
            templateData,
            idempotencyKey: `${idempotencyKey}_whatsapp`,
            metadata: { workflowInstanceId: instance.id, stageId: stage.id, level },
          },
          orgId,
        )
        .catch((err) =>
          this.logger.warn(`Failed to dispatch WhatsApp escalation notification: ${err.message}`),
        );
    }

    return true;
  }

  /**
   * Resolves recipient for each escalation tier
   */
  private async resolveEscalationRecipient(
    instance: any,
    level: EscalationLevel,
  ): Promise<{ userId?: string | null; name: string; email?: string | null; role: string }> {
    const orgId = instance.application.organizationId;
    const branchId = instance.application.branchId;

    switch (level) {
      case 1: {
        // Level 1: Assigned Officer
        if (instance.application.assignedTo) {
          const assigned = instance.application.assignedTo;
          const assignedName = assigned.name || `${assigned.firstName || ''} ${assigned.lastName || ''}`.trim() || 'Assigned Officer';
          return {
            userId: assigned.id,
            name: assignedName,
            email: assigned.email,
            role: 'ASSIGNED_EXECUTIVE',
          };
        }
        break;
      }

      case 2: {
        // Level 2: Department Lead / Team Lead
        const deptName = instance.currentStage.department;
        if (deptName) {
          const deptUser = await this.prisma.user.findFirst({
            where: {
              organizationId: orgId,
              status: 'ACTIVE',
              deletedAt: null,
              userRoles: {
                some: {
                  role: {
                    code: { in: [UserRole.BRANCH_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN] },
                  },
                },
              },
            },
          });
          if (deptUser) {
            const userName = `${deptUser.firstName} ${deptUser.lastName || ''}`.trim() || deptUser.email;
            return {
              userId: deptUser.id,
              name: userName,
              email: deptUser.email,
              role: 'TEAM_LEAD',
            };
          }
        }
        break;
      }

      case 3: {
        // Level 3: Branch Manager
        if (branchId) {
          const branchManager = await this.prisma.user.findFirst({
            where: {
              organizationId: orgId,
              branchId,
              status: 'ACTIVE',
              deletedAt: null,
              userRoles: {
                some: {
                  role: {
                    code: UserRole.BRANCH_MANAGER,
                  },
                },
              },
            },
          });
          if (branchManager) {
            const bmName = `${branchManager.firstName} ${branchManager.lastName || ''}`.trim() || branchManager.email;
            return {
              userId: branchManager.id,
              name: bmName,
              email: branchManager.email,
              role: 'BRANCH_MANAGER',
            };
          }
        }
        break;
      }

      case 4:
      default: {
        // Level 4: Super Admin / System Admin
        const superAdmin = await this.prisma.user.findFirst({
          where: {
            organizationId: orgId,
            status: 'ACTIVE',
            deletedAt: null,
            userRoles: {
              some: {
                role: {
                  code: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
                },
              },
            },
          },
        });
        if (superAdmin) {
          const saName = `${superAdmin.firstName} ${superAdmin.lastName || ''}`.trim() || superAdmin.email;
          return {
            userId: superAdmin.id,
            name: saName,
            email: superAdmin.email,
            role: 'SUPER_ADMIN',
          };
        }
        break;
      }
    }

    // Default fallback
    return {
      userId: null,
      name: 'Operations Central Desk',
      email: 'ops@crazycapital.in',
      role: level === 1 ? 'ASSIGNED_EXECUTIVE' : level === 2 ? 'TEAM_LEAD' : level === 3 ? 'BRANCH_MANAGER' : 'SUPER_ADMIN',
    };
  }

  /**
   * Get SLA Dashboard statistics, active trackers, and recent escalations
   */
  async getSlaDashboard(organizationId: string, user: any): Promise<SlaDashboardStatsDto> {
    const isBranchManager = user.role === UserRole.BRANCH_MANAGER;
    const branchFilter = isBranchManager && user.branchId ? { branchId: user.branchId } : {};

    const activeInstances = await this.prisma.workflowInstance.findMany({
      where: {
        completedAt: null,
        currentStage: {
          slaHours: { not: null },
        },
        application: {
          organizationId,
          deletedAt: null,
          ...branchFilter,
        },
      },
      include: {
        currentStage: true,
        application: {
          include: {
            service: true,
            customer: true,
            branch: true,
            assignedTo: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });

    const now = new Date();
    const activeTrackers: ActiveInstanceSlaTrackerDto[] = activeInstances.map((inst) =>
      this.mapToTrackerDto(inst, now),
    );

    let onTrackCount = 0;
    let warningCount = 0;
    let breachedCount = 0;
    let escalatedCount = 0;

    for (const tracker of activeTrackers) {
      if (tracker.slaStatus === 'ON_TRACK') onTrackCount++;
      else if (tracker.slaStatus === 'WARNING') warningCount++;
      else if (tracker.slaStatus === 'BREACHED') breachedCount++;
      else if (tracker.slaStatus === 'ESCALATED') escalatedCount++;
    }

    const escalations = await this.prisma.workflowSlaEscalation.findMany({
      where: {
        organizationId,
        ...(isBranchManager && user.branchId
          ? {
              instance: {
                application: {
                  branchId: user.branchId,
                },
              },
            }
          : {}),
      },
      include: {
        stage: true,
        instance: {
          include: {
            application: {
              include: {
                service: true,
                customer: true,
                branch: true,
              },
            },
          },
        },
        recipient: true,
      },
      orderBy: { triggeredAt: 'desc' },
      take: 50,
    });

    const levelCounts = { level1: 0, level2: 0, level3: 0, level4: 0 };
    for (const esc of escalations) {
      if (esc.escalationLevel === 1) levelCounts.level1++;
      if (esc.escalationLevel === 2) levelCounts.level2++;
      if (esc.escalationLevel === 3) levelCounts.level3++;
      if (esc.escalationLevel === 4) levelCounts.level4++;
    }

    const recentEscalations: WorkflowSlaEscalationDto[] = escalations.map((e) =>
      this.mapToEscalationDto(e),
    );

    return {
      totalActiveTracked: activeTrackers.length,
      onTrackCount,
      warningCount,
      breachedCount,
      escalatedCount,
      escalationsByLevel: levelCounts,
      recentEscalations,
      activeTrackers,
    };
  }

  /**
   * Query all escalations with pagination & status filters
   */
  async getEscalations(query: QueryEscalationsDto, organizationId: string, user: any) {
    const { page = 1, limit = 20, status, escalationLevel, branchId, stageId, search } = query;
    const skip = (page - 1) * limit;

    const isBranchManager = user.role === UserRole.BRANCH_MANAGER;
    const scopedBranchId = isBranchManager ? user.branchId : branchId;

    const where: any = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }
    if (escalationLevel) {
      where.escalationLevel = escalationLevel;
    }
    if (stageId) {
      where.stageId = stageId;
    }
    if (scopedBranchId) {
      where.instance = {
        application: {
          branchId: scopedBranchId,
        },
      };
    }
    if (search) {
      where.OR = [
        {
          instance: {
            application: {
              applicationNumber: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          instance: {
            application: {
              customer: {
                firstName: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
        {
          levelName: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.workflowSlaEscalation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { triggeredAt: 'desc' },
        include: {
          stage: true,
          recipient: true,
          instance: {
            include: {
              application: {
                include: {
                  service: true,
                  customer: true,
                  branch: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.workflowSlaEscalation.count({ where }),
    ]);

    return {
      items: items.map((e) => this.mapToEscalationDto(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Acknowledge an escalation incident
   */
  async acknowledgeEscalation(
    id: string,
    dto: AcknowledgeEscalationDto,
    user: any,
  ): Promise<WorkflowSlaEscalationDto> {
    const escalation = await this.prisma.workflowSlaEscalation.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        stage: true,
        instance: {
          include: {
            application: {
              include: {
                service: true,
                customer: true,
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!escalation) {
      throw new NotFoundException(`Escalation '${id}' not found in your organization`);
    }

    const updated = await this.prisma.workflowSlaEscalation.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        remarks: dto.remarks || escalation.remarks,
      },
      include: {
        stage: true,
        recipient: true,
        instance: {
          include: {
            application: {
              include: {
                service: true,
                customer: true,
                branch: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.applicationActivity.create({
      data: {
        applicationId: escalation.instance.applicationId,
        performedById: user.id,
        activityType: 'ESCALATION_ACKNOWLEDGED',
        notes: `SLA Escalation Level ${escalation.escalationLevel} acknowledged by ${user.name || user.email}. Notes: ${dto.remarks || 'Under active review'}.`,
      },
    });

    return this.mapToEscalationDto(updated);
  }

  /**
   * Resolve an escalation incident
   */
  async resolveEscalation(
    id: string,
    dto: AcknowledgeEscalationDto,
    user: any,
  ): Promise<WorkflowSlaEscalationDto> {
    const escalation = await this.prisma.workflowSlaEscalation.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        stage: true,
        instance: {
          include: {
            application: {
              include: {
                service: true,
                customer: true,
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!escalation) {
      throw new NotFoundException(`Escalation '${id}' not found in your organization`);
    }

    const updated = await this.prisma.workflowSlaEscalation.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        remarks: dto.remarks || escalation.remarks,
      },
      include: {
        stage: true,
        recipient: true,
        instance: {
          include: {
            application: {
              include: {
                service: true,
                customer: true,
                branch: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.applicationActivity.create({
      data: {
        applicationId: escalation.instance.applicationId,
        performedById: user.id,
        activityType: 'ESCALATION_RESOLVED',
        notes: `SLA Escalation Level ${escalation.escalationLevel} resolved by ${user.name || user.email}. Resolution: ${dto.remarks || 'Bottleneck unblocked'}.`,
      },
    });

    return this.mapToEscalationDto(updated);
  }

  /**
   * Helper mapping to ActiveInstanceSlaTrackerDto
   */
  private mapToTrackerDto(inst: any, now: Date): ActiveInstanceSlaTrackerDto {
    const stage = inst.currentStage;
    const stageEnteredAt = new Date(inst.stageEnteredAt || inst.startedAt);
    const elapsedMs = Math.max(0, now.getTime() - stageEnteredAt.getTime());
    const elapsedHours = Math.round((elapsedMs / (1000 * 60 * 60)) * 10) / 10;
    const slaHours = stage.slaHours || 24;
    const warningHours = stage.warningHours || Math.round(slaHours * 0.75);
    const remainingHours = Math.max(0, Math.round((slaHours - elapsedHours) * 10) / 10);
    const percentElapsed = Math.min(100, Math.round((elapsedHours / slaHours) * 100));

    const levelNames: Record<number, string> = {
      1: 'Level 1 (Assigned Executive)',
      2: 'Level 2 (Team Lead)',
      3: 'Level 3 (Branch Manager)',
      4: 'Level 4 (Super Admin)',
    };

    return {
      instanceId: inst.id,
      applicationId: inst.application.id,
      applicationNumber: inst.application.applicationNumber,
      serviceName: inst.application.service?.name || 'Service',
      customerName: inst.application.customer
        ? `${inst.application.customer.firstName} ${inst.application.customer.lastName || ''}`.trim()
        : 'Customer',
      branchName: inst.application.branch?.name || 'Headquarters',
      currentStageId: stage.id,
      currentStageName: stage.name,
      currentStageCode: stage.code,
      stageType: stage.stageType,
      department: stage.department || 'Operations Desk',
      assignedOfficerName: inst.application.assignedTo?.name || 'Unassigned',
      assignedOfficerEmail: inst.application.assignedTo?.email || null,
      stageEnteredAt: stageEnteredAt.toISOString(),
      slaHours,
      warningHours,
      elapsedHours,
      remainingHours,
      percentElapsed,
      slaStatus: (inst.slaStatus || 'ON_TRACK') as SlaStatus,
      escalationLevel: inst.escalationLevel || 0,
      activeEscalationLevelName: levelNames[inst.escalationLevel] || undefined,
      lastSlaCheckAt: inst.lastSlaCheckAt?.toISOString(),
    };
  }

  /**
   * Helper mapping to WorkflowSlaEscalationDto
   */
  private mapToEscalationDto(e: any): WorkflowSlaEscalationDto {
    return {
      id: e.id,
      organizationId: e.organizationId,
      workflowInstanceId: e.workflowInstanceId,
      stageId: e.stageId,
      stageName: e.stage?.name || 'Stage',
      stageCode: e.stage?.code || 'STAGE',
      applicationId: e.instance?.application?.id || '',
      applicationNumber: e.instance?.application?.applicationNumber || 'CC-2026',
      serviceName: e.instance?.application?.service?.name || 'Service',
      customerName: e.instance?.application?.customer
        ? `${e.instance.application.customer.firstName} ${e.instance.application.customer.lastName || ''}`.trim()
        : 'Customer',
      branchName: e.instance?.application?.branch?.name || 'Headquarters',
      escalationLevel: e.escalationLevel,
      levelName: e.levelName,
      recipientUserId: e.recipientUserId,
      recipientName: e.recipient?.name || e.recipientRole,
      recipientRole: e.recipientRole,
      recipientEmail: e.recipientEmail || e.recipient?.email || null,
      channels: Array.isArray(e.channels) ? e.channels : ['IN_APP'],
      status: e.status,
      remarks: e.remarks,
      triggeredAt: (e.triggeredAt instanceof Date
        ? e.triggeredAt
        : new Date(e.triggeredAt || Date.now())
      ).toISOString(),
      acknowledgedAt: e.acknowledgedAt
        ? (e.acknowledgedAt instanceof Date
            ? e.acknowledgedAt
            : new Date(e.acknowledgedAt)
          ).toISOString()
        : null,
      resolvedAt: e.resolvedAt
        ? (e.resolvedAt instanceof Date
            ? e.resolvedAt
            : new Date(e.resolvedAt)
          ).toISOString()
        : null,
    };
  }
}
