import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ChangeLeadStatusDto } from './dto/change-lead-status.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { LeadStatus, UserRole } from '@cc/types';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- 1. Create Lead (Public capture & Authenticated) ---
  async create(dto: CreateLeadDto, currentUser?: { organizationId: string; branchId: string | null; id: string }) {
    let orgId = currentUser?.organizationId;
    let branchId = dto.branchId || currentUser?.branchId;

    if (!orgId) {
      // Public inquiry: fallback to default primary organization
      const defaultOrg = await this.prisma.organization.findFirst({
        where: { status: 'ACTIVE' },
        include: { branches: { where: { code: 'HO' } } },
      });
      if (!defaultOrg) {
        throw new BadRequestException('Organization context missing');
      }
      orgId = defaultOrg.id;
      branchId = branchId || defaultOrg.branches[0]?.id || null;
    }

    // Resolve source
    let sourceId = dto.sourceId;
    if (!sourceId) {
      const sourceCode = (dto.sourceCode || 'WEBSITE').toUpperCase();
      const source = await this.prisma.leadSource.findUnique({
        where: { code: sourceCode },
      });
      if (source) {
        sourceId = source.id;
      }
    }

    // Create lead with initial activity in transaction
    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          organizationId: orgId,
          branchId,
          sourceId,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email?.toLowerCase().trim() || null,
          mobile: dto.mobile.trim(),
          companyName: dto.companyName?.trim() || null,
          status: LeadStatus.NEW,
          leadScore: dto.leadScore ?? 0,
          notes: dto.notes?.trim() || null,
          campaign: dto.campaign?.trim() || null,
          utmSource: dto.utmSource?.trim() || null,
          utmMedium: dto.utmMedium?.trim() || null,
          utmCampaign: dto.utmCampaign?.trim() || dto.campaign?.trim() || null,
          serviceInterest: dto.serviceInterest?.trim() || null,
        },
        include: {
          source: true,
          branch: true,
        },
      });

      // Log creation activity
      const activityNotes = [
        'Lead captured',
        dto.serviceInterest ? `Service: ${dto.serviceInterest}` : null,
        dto.utmSource ? `Source: ${dto.utmSource}` : null,
        dto.utmCampaign ? `Campaign: ${dto.utmCampaign}` : null,
      ].filter(Boolean).join(' | ');

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          performedById: currentUser?.id || null,
          activityType: 'NOTE',
          notes: activityNotes,
        },
      });

      return lead;
    });
  }

  // --- 2. Find All Leads (Multi-tenant Scoped & Paginated) ---
  async findAll(query: QueryLeadsDto, currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {
      organizationId: currentUser.organizationId,
      deletedAt: null,
    };

    // Role-based scope isolation
    const isSuperAdminOrAdmin = currentUser.roles.some(
      (r) => r === UserRole.SUPER_ADMIN || r === UserRole.ADMIN,
    );
    const isBranchManager = currentUser.roles.includes(UserRole.BRANCH_MANAGER);
    const isEmployee = currentUser.roles.includes(UserRole.EMPLOYEE);

    if (!isSuperAdminOrAdmin) {
      if (isBranchManager && currentUser.branchId) {
        where.branchId = currentUser.branchId;
      } else if (isEmployee) {
        where.OR = [
          { assignedToId: currentUser.id },
          ...(currentUser.branchId ? [{ branchId: currentUser.branchId }] : []),
        ];
      }
    }

    // Filters
    if (query.status) {
      where.status = query.status;
    }
    if (query.branchId) {
      where.branchId = query.branchId;
    }
    if (query.sourceId) {
      where.sourceId = query.sourceId;
    }
    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }
    if (query.createdAtFrom || query.createdAtTo) {
      where.createdAt = {};
      if (query.createdAtFrom) where.createdAt.gte = new Date(query.createdAtFrom);
      if (query.createdAtTo) where.createdAt.lte = new Date(query.createdAtTo);
    }
    if (query.search) {
      const s = query.search.trim();
      where.AND = [
        {
          OR: [
            { firstName: { contains: s, mode: 'insensitive' } },
            { lastName: { contains: s, mode: 'insensitive' } },
            { email: { contains: s, mode: 'insensitive' } },
            { mobile: { contains: s, mode: 'insensitive' } },
            { companyName: { contains: s, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Sort order
    const orderBy: Prisma.LeadOrderByWithRelationInput = {};
    if (query.sortBy === 'leadScore') {
      orderBy.leadScore = query.sortOrder || 'desc';
    } else if (query.sortBy === 'firstName') {
      orderBy.firstName = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = query.sortOrder || 'desc';
    }

    const [total, leads] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          source: true,
          branch: {
            select: { id: true, name: true, code: true, city: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true, mobile: true },
          },
          _count: {
            select: { activities: true },
          },
        },
      }),
    ]);

    return {
      data: leads,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // --- 3. Find One Lead (Full Detail + Activities + Assignments) ---
  async findOne(id: string, currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] }) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        organizationId: currentUser.organizationId,
        deletedAt: null,
      },
      include: {
        source: true,
        branch: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true, mobile: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    // Role-based verification
    const isSuperAdminOrAdmin = currentUser.roles.some(
      (r) => r === UserRole.SUPER_ADMIN || r === UserRole.ADMIN,
    );
    if (!isSuperAdminOrAdmin) {
      if (currentUser.roles.includes(UserRole.BRANCH_MANAGER) && lead.branchId && lead.branchId !== currentUser.branchId) {
        throw new ForbiddenException('You do not have permission to view leads outside your branch');
      }
      if (currentUser.roles.includes(UserRole.EMPLOYEE) && lead.assignedToId !== currentUser.id && lead.branchId !== currentUser.branchId) {
        throw new ForbiddenException('You do not have permission to view this lead');
      }
    }

    return lead;
  }

  // --- 4. Update Lead Details ---
  async update(id: string, dto: UpdateLeadDto, currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] }) {
    await this.findOne(id, currentUser);

    const dataToUpdate: Prisma.LeadUpdateInput = {};
    if (dto.firstName !== undefined) dataToUpdate.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) dataToUpdate.lastName = dto.lastName.trim();
    if (dto.email !== undefined) dataToUpdate.email = dto.email ? dto.email.toLowerCase().trim() : null;
    if (dto.mobile !== undefined) dataToUpdate.mobile = dto.mobile.trim();
    if (dto.companyName !== undefined) dataToUpdate.companyName = dto.companyName ? dto.companyName.trim() : null;
    if (dto.notes !== undefined) dataToUpdate.notes = dto.notes ? dto.notes.trim() : null;
    if (dto.campaign !== undefined) dataToUpdate.campaign = dto.campaign ? dto.campaign.trim() : null;
    if (dto.leadScore !== undefined) dataToUpdate.leadScore = dto.leadScore;
    if (dto.sourceId !== undefined) {
      dataToUpdate.source = dto.sourceId ? { connect: { id: dto.sourceId } } : { disconnect: true };
    }
    if (dto.branchId !== undefined) {
      dataToUpdate.branch = dto.branchId ? { connect: { id: dto.branchId } } : { disconnect: true };
    }

    return this.prisma.lead.update({
      where: { id },
      data: dataToUpdate,
      include: {
        source: true,
        branch: true,
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  // --- 5. State Machine: Update Lead Status ---
  async updateStatus(id: string, dto: ChangeLeadStatusDto, currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] }) {
    const lead = await this.findOne(id, currentUser);

    const validTransitions: Record<string, string[]> = {
      NEW: ['CONTACTED', 'LOST'],
      CONTACTED: ['QUALIFIED', 'LOST'],
      QUALIFIED: ['PROPOSAL', 'LOST'],
      PROPOSAL: ['CONVERTED', 'LOST'],
      LOST: ['NEW'],
      CONVERTED: [], // Once converted, terminal state
    };

    const allowed = validTransitions[lead.status] || [];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${lead.status} to ${dto.status}. Allowed transitions: ${allowed.join(', ') || 'None'}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id },
        data: {
          status: dto.status,
        },
        include: {
          source: true,
          branch: true,
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Record immutable activity log
      await tx.leadActivity.create({
        data: {
          leadId: id,
          performedById: currentUser.id,
          activityType: 'STATUS_CHANGE',
          notes: `Status changed from ${lead.status} to ${dto.status}${dto.remarks ? ` — Remarks: ${dto.remarks}` : ''}`,
        },
      });

      return updated;
    });
  }

  // --- 6. Assign Lead to Employee ---
  async assign(id: string, dto: AssignLeadDto, currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] }) {
    const lead = await this.findOne(id, currentUser);

    // Validate target assignee
    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: dto.assignedToUserId,
        organizationId: currentUser.organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`Active employee with ID ${dto.assignedToUserId} not found in this organization`);
    }

    return this.prisma.$transaction(async (tx) => {
      const previousAssigneeId = lead.assignedToId;

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          assignedToId: targetUser.id,
          // Sync branch if lead branch is not set
          branchId: lead.branchId || targetUser.branchId,
        },
        include: {
          source: true,
          branch: true,
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Record immutable assignment record
      await tx.leadAssignment.create({
        data: {
          leadId: id,
          assignedFrom: currentUser.id,
          assignedTo: targetUser.id,
        },
      });

      // Record activity log
      await tx.leadActivity.create({
        data: {
          leadId: id,
          performedById: currentUser.id,
          activityType: 'NOTE',
          notes: `Lead assigned to ${targetUser.firstName} ${targetUser.lastName}${dto.remarks ? ` — ${dto.remarks}` : ''}`,
        },
      });

      return updatedLead;
    });
  }

  // --- 7. Log Activity (Call, Meeting, Email, WhatsApp, Note) ---
  async addActivity(id: string, dto: CreateLeadActivityDto, currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] }) {
    await this.findOne(id, currentUser);

    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.leadActivity.create({
        data: {
          leadId: id,
          performedById: currentUser.id,
          activityType: dto.activityType,
          notes: dto.notes.trim(),
        },
        include: {
          performedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Update lead updatedAt timestamp
      await tx.lead.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return activity;
    });
  }

  // --- 8. Soft Delete Lead ---
  async remove(id: string, currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] }) {
    await this.findOne(id, currentUser);

    return this.prisma.lead.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
