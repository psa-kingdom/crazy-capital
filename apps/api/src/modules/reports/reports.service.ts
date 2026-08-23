import {
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueryReportsDto } from './dto/query-reports.dto';
import { ExportReportDto, ReportType, ExportFormat } from './dto/export-report.dto';
import {
  UserRole,
  ExecutiveDashboardDto,
  RevenueReportDto,
  LeadsReportDto,
  OperationsReportDto,
  BranchComparisonReportDto,
} from '@cc/types';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves authorized organization and branch scoping based on user roles
   */
  private resolveScope(user: any, requestedBranchId?: string) {
    const roles: string[] = user.roles || [];
    const isSuperAdmin = roles.includes(UserRole.SUPER_ADMIN);
    const isAdmin = isSuperAdmin || roles.includes(UserRole.ADMIN);
    const isBranchManager = roles.includes(UserRole.BRANCH_MANAGER);

    let branchId: string | undefined = undefined;
    let isOrganizationWide = false;

    if (isAdmin) {
      if (requestedBranchId) {
        branchId = requestedBranchId;
        isOrganizationWide = false;
      } else {
        isOrganizationWide = true;
      }
    } else if (isBranchManager) {
      // Branch Managers are strictly locked to their assigned branch
      if (!user.branchId) {
        throw new ForbiddenException('Branch Manager is not associated with an active branch');
      }
      branchId = user.branchId;
      isOrganizationWide = false;
    } else {
      // Other roles without executive or branch management access
      throw new ForbiddenException('You do not have permission to view organizational reports');
    }

    const organizationId = user.organizationId || 'org-crazy-capital';

    return {
      organizationId,
      branchId,
      isOrganizationWide,
      isAdmin,
    };
  }

  /**
   * Helper: Builds standard Prisma date and branch filters
   */
  private buildWhere(scope: { organizationId: string; branchId?: string }, query: QueryReportsDto) {
    const where: any = {
      organizationId: scope.organizationId,
      deletedAt: null,
    };

    if (scope.branchId) {
      where.branchId = scope.branchId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    return where;
  }

  /**
   * 1. Executive / Branch Consolidated Dashboard
   */
  async getDashboard(user: any, query: QueryReportsDto): Promise<ExecutiveDashboardDto> {
    const scope = this.resolveScope(user, query.branchId);
    const where = this.buildWhere(scope, query);

    let branchName: string | null = null;
    if (scope.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: scope.branchId },
        select: { name: true },
      });
      branchName = branch?.name || null;
    }

    // Concurrent metric retrieval
    const [
      invoices,
      leads,
      applications,
      commissions,
      recentLeads,
      recentApps,
      recentPayments,
    ] = await Promise.all([
      // Invoices
      this.prisma.invoice.findMany({
        where: {
          customer: {
            organizationId: scope.organizationId,
            ...(scope.branchId && { branchId: scope.branchId }),
          },
          ...(where.createdAt && { createdAt: where.createdAt }),
        },
        select: { amount: true, status: true, taxAmount: true },
      }),

      // Leads
      this.prisma.lead.findMany({
        where,
        select: { status: true, sourceId: true, leadScore: true },
      }),

      // Applications with service
      this.prisma.application.findMany({
        where: {
          organizationId: scope.organizationId,
          ...(scope.branchId && { branchId: scope.branchId }),
          deletedAt: null,
          ...(where.createdAt && { createdAt: where.createdAt }),
        },
        select: {
          id: true,
          status: true,
          service: { select: { id: true, name: true } },
          invoices: { select: { amount: true, status: true } },
        },
      }),

      // Commissions
      this.prisma.commission.findMany({
        where: {
          ...(where.createdAt && { createdAt: where.createdAt }),
        },
        select: { amount: true, status: true },
      }),

      // Recent Leads
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, firstName: true, lastName: true, companyName: true, status: true, createdAt: true },
      }),

      // Recent Applications
      this.prisma.application.findMany({
        where: {
          organizationId: scope.organizationId,
          ...(scope.branchId && { branchId: scope.branchId }),
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          customer: { select: { firstName: true, lastName: true } },
          service: { select: { name: true } },
        },
      }),

      // Recent Payments
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          invoice: { select: { invoiceNumber: true } },
        },
      }),
    ]);

    // Financial KPI sums
    let totalRevenue = 0;
    let totalCollected = 0;
    let pendingCollections = 0;

    for (const inv of invoices) {
      const amt = Number(inv.amount || 0);
      totalRevenue += amt;
      if (inv.status === 'PAID') {
        totalCollected += amt;
      } else {
        pendingCollections += amt;
      }
    }

    // Lead metrics & distributions
    const totalLeads = leads.length;
    let convertedLeads = 0;
    const statusMap: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};

    for (const l of leads) {
      statusMap[l.status] = (statusMap[l.status] || 0) + 1;
      const src = l.sourceId || 'DIRECT';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
      if (l.status === 'CONVERTED') {
        convertedLeads++;
      }
    }

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;

    const leadsByStatus = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 1000) / 10 : 0,
    }));

    const leadsBySource = Object.entries(sourceMap).map(([source, count]) => ({
      source,
      count,
    }));

    // Application distributions & top services
    const totalApplications = applications.length;
    let activeApplications = 0;
    let completedApplications = 0;
    const appStatusMap: Record<string, number> = {};
    const serviceAggMap = new Map<string, { id: string; name: string; count: number; revenue: number }>();

    for (const app of applications) {
      appStatusMap[app.status] = (appStatusMap[app.status] || 0) + 1;
      if (app.status === 'COMPLETED') {
        completedApplications++;
      } else if (app.status === 'IN_PROGRESS' || app.status === 'SUBMITTED') {
        activeApplications++;
      }

      if (app.service) {
        const existing = serviceAggMap.get(app.service.id) || {
          id: app.service.id,
          name: app.service.name,
          count: 0,
          revenue: 0,
        };
        existing.count++;
        for (const inv of app.invoices || []) {
          existing.revenue += Number(inv.amount || 0);
        }
        serviceAggMap.set(app.service.id, existing);
      }
    }

    const applicationsByStatus = Object.entries(appStatusMap).map(([status, count]) => ({
      status,
      count,
    }));

    const topServices = Array.from(serviceAggMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        name: s.name,
        applicationsCount: s.count,
        revenue: Math.round(s.revenue * 100) / 100,
      }));

    // Commission metrics
    let totalCommissionsAccrued = 0;
    let totalCommissionsPaid = 0;
    for (const c of commissions) {
      const amt = Number(c.amount || 0);
      totalCommissionsAccrued += amt;
      if (c.status === 'PAID') {
        totalCommissionsPaid += amt;
      }
    }

    // Consolidated Recent Activities feed
    const recentActivities: ExecutiveDashboardDto['recentActivities'] = [];

    for (const l of recentLeads) {
      recentActivities.push({
        type: 'LEAD',
        id: l.id,
        reference: `${l.firstName} ${l.lastName}`.trim(),
        description: `New lead created (${l.companyName || 'Individual'}) - Status: ${l.status}`,
        timestamp: l.createdAt.toISOString(),
      });
    }

    for (const app of recentApps) {
      recentActivities.push({
        type: 'APPLICATION',
        id: app.id,
        reference: app.applicationNumber,
        description: `Filing registered for ${app.service?.name} (${app.customer?.firstName} ${app.customer?.lastName})`,
        timestamp: app.createdAt.toISOString(),
      });
    }

    for (const p of recentPayments) {
      recentActivities.push({
        type: 'PAYMENT',
        id: p.id,
        reference: p.invoice?.invoiceNumber || p.gatewayReference,
        description: `Payment of ₹${Number(p.amount).toLocaleString('en-IN')} captured via ${p.gateway}`,
        amount: Number(p.amount),
        timestamp: p.createdAt.toISOString(),
      });
    }

    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      scope: {
        organizationId: scope.organizationId,
        branchId: scope.branchId || null,
        branchName,
        isOrganizationWide: scope.isOrganizationWide,
      },
      kpis: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        pendingCollections: Math.round(pendingCollections * 100) / 100,
        totalLeads,
        convertedLeads,
        conversionRate,
        totalApplications,
        activeApplications,
        completedApplications,
        totalCommissionsAccrued: Math.round(totalCommissionsAccrued * 100) / 100,
        totalCommissionsPaid: Math.round(totalCommissionsPaid * 100) / 100,
      },
      leadsByStatus,
      leadsBySource,
      applicationsByStatus,
      topServices,
      recentActivities: recentActivities.slice(0, 6),
    };
  }

  /**
   * 2. Revenue & Billing Analytics
   */
  async getRevenueReport(user: any, query: QueryReportsDto): Promise<RevenueReportDto> {
    const scope = this.resolveScope(user, query.branchId);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        customer: {
          organizationId: scope.organizationId,
          ...(scope.branchId && { branchId: scope.branchId }),
        },
        ...(query.serviceId && { application: { serviceId: query.serviceId } }),
        ...(query.startDate || query.endDate
          ? {
              createdAt: {
                ...(query.startDate && { gte: new Date(query.startDate) }),
                ...(query.endDate && { lte: new Date(`${query.endDate}T23:59:59.999Z`) }),
              },
            }
          : {}),
      },
      include: {
        application: {
          include: {
            service: true,
            branch: true,
          },
        },
        customer: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalTax = 0;
    let paidCount = 0;

    const trendMap = new Map<string, { invoiced: number; collected: number }>();
    const serviceMap = new Map<string, { serviceId: string; serviceName: string; totalRevenue: number; invoicesCount: number }>();
    const branchMap = new Map<string, { branchId: string; branchName: string; totalRevenue: number; invoicesCount: number }>();

    for (const inv of invoices) {
      const amt = Number(inv.amount || 0);
      const tax = Number(inv.taxAmount || 0);
      const isPaid = inv.status === 'PAID';

      totalInvoiced += amt;
      totalTax += tax;
      if (isPaid) {
        totalCollected += amt;
        paidCount++;
      }

      // Group by Date (YYYY-MM-DD)
      const dateKey = inv.createdAt.toISOString().split('T')[0];
      const trendEntry = trendMap.get(dateKey) || { invoiced: 0, collected: 0 };
      trendEntry.invoiced += amt;
      if (isPaid) trendEntry.collected += amt;
      trendMap.set(dateKey, trendEntry);

      // Group by Service
      const serviceId = inv.application?.service?.id || 'general-consultation';
      const serviceName = inv.application?.service?.name || 'General Business Services';
      const serviceEntry = serviceMap.get(serviceId) || {
        serviceId,
        serviceName,
        totalRevenue: 0,
        invoicesCount: 0,
      };
      serviceEntry.totalRevenue += amt;
      serviceEntry.invoicesCount++;
      serviceMap.set(serviceId, serviceEntry);

      // Group by Branch
      const branchId = inv.application?.branch?.id || inv.customer?.branch?.id || 'ho-branch';
      const branchName = inv.application?.branch?.name || inv.customer?.branch?.name || 'Head Office';
      const branchEntry = branchMap.get(branchId) || {
        branchId,
        branchName,
        totalRevenue: 0,
        invoicesCount: 0,
      };
      branchEntry.totalRevenue += amt;
      branchEntry.invoicesCount++;
      branchMap.set(branchId, branchEntry);
    }

    const trend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      invoiced: Math.round(data.invoiced * 100) / 100,
      collected: Math.round(data.collected * 100) / 100,
    }));

    const byService = Array.from(serviceMap.values()).map((s) => ({
      ...s,
      totalRevenue: Math.round(s.totalRevenue * 100) / 100,
    }));

    const byBranch = Array.from(branchMap.values()).map((b) => ({
      ...b,
      totalRevenue: Math.round(b.totalRevenue * 100) / 100,
    }));

    return {
      summary: {
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        invoicesCount: invoices.length,
        paidInvoicesCount: paidCount,
      },
      trend,
      byService,
      byBranch,
    };
  }

  /**
   * 3. CRM & Leads Analytics
   */
  async getLeadsReport(user: any, query: QueryReportsDto): Promise<LeadsReportDto> {
    const scope = this.resolveScope(user, query.branchId);
    const where = this.buildWhere(scope, query);

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        assignments: {
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
    });

    const users = await this.prisma.user.findMany({
      where: { organizationId: scope.organizationId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const totalLeads = leads.length;
    let convertedCount = 0;
    let totalScore = 0;

    const statusMap: Record<string, number> = {};
    const sourceMap: Record<string, { count: number; converted: number }> = {};
    const employeeMap = new Map<string, { userId: string; name: string; email: string; assignedCount: number; convertedCount: number }>();

    for (const lead of leads) {
      totalScore += lead.leadScore || 0;
      statusMap[lead.status] = (statusMap[lead.status] || 0) + 1;

      const isConverted = lead.status === 'CONVERTED';
      if (isConverted) convertedCount++;

      // Source grouping
      const src = lead.sourceId || 'DIRECT_CALL';
      const srcEntry = sourceMap[src] || { count: 0, converted: 0 };
      srcEntry.count++;
      if (isConverted) srcEntry.converted++;
      sourceMap[src] = srcEntry;

      // Employee grouping
      const assignedUserId = lead.assignments?.[0]?.assignedTo;
      if (assignedUserId) {
        const u = userMap.get(assignedUserId);
        const empEntry = employeeMap.get(assignedUserId) || {
          userId: assignedUserId,
          name: u ? `${u.firstName} ${u.lastName}`.trim() : 'Operations Staff',
          email: u ? u.email : '',
          assignedCount: 0,
          convertedCount: 0,
        };
        empEntry.assignedCount++;
        if (isConverted) empEntry.convertedCount++;
        employeeMap.set(assignedUserId, empEntry);
      }
    }

    const byStatus = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 1000) / 10 : 0,
    }));

    const bySource = Object.entries(sourceMap).map(([source, data]) => ({
      source,
      count: data.count,
      convertedCount: data.converted,
      conversionRate: data.count > 0 ? Math.round((data.converted / data.count) * 1000) / 10 : 0,
    }));

    const byEmployee = Array.from(employeeMap.values()).map((emp) => ({
      ...emp,
      conversionRate: emp.assignedCount > 0 ? Math.round((emp.convertedCount / emp.assignedCount) * 1000) / 10 : 0,
    }));

    return {
      summary: {
        totalLeads,
        convertedLeads: convertedCount,
        conversionRate: totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 1000) / 10 : 0,
        avgScore: totalLeads > 0 ? Math.round(totalScore / totalLeads) : 0,
      },
      byStatus,
      bySource,
      byEmployee,
    };
  }

  /**
   * 4. Operations & Fulfillment Analytics
   */
  async getOperationsReport(user: any, query: QueryReportsDto): Promise<OperationsReportDto> {
    const scope = this.resolveScope(user, query.branchId);
    const where = this.buildWhere(scope, query);

    const [applications, documents] = await Promise.all([
      this.prisma.application.findMany({
        where: {
          organizationId: scope.organizationId,
          ...(scope.branchId && { branchId: scope.branchId }),
          deletedAt: null,
          ...(where.createdAt && { createdAt: where.createdAt }),
        },
        include: {
          service: true,
          workflowInstance: {
            include: {
              currentStage: true,
            },
          },
        },
      }),

      this.prisma.document.findMany({
        where: {
          organizationId: scope.organizationId,
          ...(scope.branchId && { branchId: scope.branchId }),
          deletedAt: null,
          ...(where.createdAt && { createdAt: where.createdAt }),
        },
        select: { status: true },
      }),
    ]);

    let inProgress = 0;
    let completed = 0;
    let rejected = 0;

    const serviceMap = new Map<string, { serviceId: string; serviceName: string; count: number; completedCount: number }>();
    const stageMap = new Map<string, { stageId: string; stageName: string; count: number }>();

    for (const app of applications) {
      if (app.status === 'COMPLETED') completed++;
      else if (app.status === 'REJECTED') rejected++;
      else inProgress++;

      // By Service
      const serviceId = app.serviceId;
      const serviceName = app.service?.name || 'Service';
      const sEntry = serviceMap.get(serviceId) || {
        serviceId,
        serviceName,
        count: 0,
        completedCount: 0,
      };
      sEntry.count++;
      if (app.status === 'COMPLETED') sEntry.completedCount++;
      serviceMap.set(serviceId, sEntry);

      // By Stage
      const stage = app.workflowInstance?.currentStage;
      if (stage) {
        const stEntry = stageMap.get(stage.id) || {
          stageId: stage.id,
          stageName: stage.name,
          count: 0,
        };
        stEntry.count++;
        stageMap.set(stage.id, stEntry);
      }
    }

    // Document statistics
    let verifiedDocs = 0;
    let pendingDocs = 0;
    let rejectedDocs = 0;

    for (const doc of documents) {
      if (doc.status === 'VERIFIED') verifiedDocs++;
      else if (doc.status === 'REJECTED') rejectedDocs++;
      else pendingDocs++;
    }

    return {
      summary: {
        totalApplications: applications.length,
        inProgress,
        completed,
        rejected,
      },
      byService: Array.from(serviceMap.values()),
      byStage: Array.from(stageMap.values()),
      documentsStatus: {
        totalUploaded: documents.length,
        verified: verifiedDocs,
        pendingReview: pendingDocs,
        rejected: rejectedDocs,
      },
    };
  }

  /**
   * 5. Multi-Branch Comparative Analytics
   */
  async getBranchComparison(user: any, query: QueryReportsDto): Promise<BranchComparisonReportDto> {
    const scope = this.resolveScope(user, query.branchId);

    const branchWhere: any = { organizationId: scope.organizationId };
    if (scope.branchId) {
      branchWhere.id = scope.branchId;
    }

    const branches = await this.prisma.branch.findMany({
      where: branchWhere,
      include: {
        users: { where: { status: 'ACTIVE' } },
        leads: { where: { deletedAt: null } },
        applications: {
          where: { deletedAt: null },
          include: { invoices: { select: { amount: true, status: true } } },
        },
      },
    });

    const reportBranches = branches.map((b) => {
      const leadCount = b.leads.length;
      const convertedLeadCount = b.leads.filter((l) => l.status === 'CONVERTED').length;
      const conversionRate = leadCount > 0 ? Math.round((convertedLeadCount / leadCount) * 1000) / 10 : 0;
      const applicationCount = b.applications.length;
      const completedApplicationCount = b.applications.filter((a) => a.status === 'COMPLETED').length;

      let totalRevenue = 0;
      for (const app of b.applications) {
        for (const inv of app.invoices) {
          totalRevenue += Number(inv.amount || 0);
        }
      }

      return {
        branchId: b.id,
        branchName: b.name,
        branchCode: b.code,
        city: b.city,
        state: b.state,
        employeeCount: b.users.length,
        leadCount,
        convertedLeadCount,
        conversionRate,
        applicationCount,
        completedApplicationCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      };
    });

    return {
      branches: reportBranches,
    };
  }

  /**
   * 6. Streamed / Formatted Report Export (CSV / JSON)
   */
  async exportReport(user: any, dto: ExportReportDto) {
    const format = dto.format || ExportFormat.CSV;
    const queryDto: QueryReportsDto = {
      startDate: dto.startDate,
      endDate: dto.endDate,
      branchId: dto.branchId,
    };

    let filename = `crazy_capital_${dto.reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.${format}`;
    let data: any;

    switch (dto.reportType) {
      case ReportType.REVENUE: {
        const report = await this.getRevenueReport(user, queryDto);
        if (format === ExportFormat.JSON) return { filename, mimeType: 'application/json', content: JSON.stringify(report, null, 2) };
        
        // Format CSV
        let csv = 'Revenue Analytics Report - Crazy Capital\n';
        csv += `Generated At,${new Date().toISOString()}\n\n`;
        csv += 'Summary Metric,Value (INR)\n';
        csv += `Total Invoiced,${report.summary.totalInvoiced}\n`;
        csv += `Total Collected,${report.summary.totalCollected}\n`;
        csv += `18% GST Tax Collected,${report.summary.totalTax}\n`;
        csv += `Total Invoices Generated,${report.summary.invoicesCount}\n`;
        csv += `Settled Invoices Count,${report.summary.paidInvoicesCount}\n\n`;

        csv += 'Daily Revenue Trend\n';
        csv += 'Date,Invoiced Amount,Collected Amount\n';
        for (const t of report.trend) {
          csv += `"${t.date}",${t.invoiced},${t.collected}\n`;
        }

        csv += '\nRevenue By Service Vertical\n';
        csv += 'Service Name,Invoices Count,Total Revenue\n';
        for (const s of report.byService) {
          csv += `"${s.serviceName}",${s.invoicesCount},${s.totalRevenue}\n`;
        }

        return { filename, mimeType: 'text/csv', content: csv };
      }

      case ReportType.LEADS: {
        const report = await this.getLeadsReport(user, queryDto);
        if (format === ExportFormat.JSON) return { filename, mimeType: 'application/json', content: JSON.stringify(report, null, 2) };

        let csv = 'CRM Leads & Conversion Report - Crazy Capital\n';
        csv += `Total Leads,${report.summary.totalLeads}\n`;
        csv += `Converted Leads,${report.summary.convertedLeads}\n`;
        csv += `Overall Conversion Rate,${report.summary.conversionRate}%\n\n`;

        csv += 'Lead Source Performance\n';
        csv += 'Lead Source,Total Inquiries,Converted Inquiries,Conversion Rate\n';
        for (const src of report.bySource) {
          csv += `"${src.source}",${src.count},${src.convertedCount},${src.conversionRate}%\n`;
        }

        csv += '\nEmployee Conversion Velocity\n';
        csv += 'Employee Name,Email,Assigned Leads,Converted Leads,Conversion Rate\n';
        for (const emp of report.byEmployee) {
          csv += `"${emp.name}","${emp.email}",${emp.assignedCount},${emp.convertedCount},${emp.conversionRate}%\n`;
        }

        return { filename, mimeType: 'text/csv', content: csv };
      }

      case ReportType.BRANCHES: {
        const report = await this.getBranchComparison(user, queryDto);
        if (format === ExportFormat.JSON) return { filename, mimeType: 'application/json', content: JSON.stringify(report, null, 2) };

        let csv = 'Branch Performance Comparison Report - Crazy Capital\n';
        csv += 'Branch Name,Code,City,State,Staff Count,Leads,Converted Leads,Conversion %,Applications,Completed Cases,Total Revenue (INR)\n';
        for (const b of report.branches) {
          csv += `"${b.branchName}","${b.branchCode}","${b.city}","${b.state}",${b.employeeCount},${b.leadCount},${b.convertedLeadCount},${b.conversionRate}%,${b.applicationCount},${b.completedApplicationCount},${b.totalRevenue}\n`;
        }

        return { filename, mimeType: 'text/csv', content: csv };
      }

      case ReportType.OPERATIONS:
      case ReportType.DASHBOARD:
      default: {
        const dashboard = await this.getDashboard(user, queryDto);
        if (format === ExportFormat.JSON) return { filename, mimeType: 'application/json', content: JSON.stringify(dashboard, null, 2) };

        let csv = 'Executive Operational Dashboard Summary - Crazy Capital\n';
        csv += `Scope,${dashboard.scope.isOrganizationWide ? 'Organization-Wide' : dashboard.scope.branchName || 'Branch'}\n\n`;
        csv += 'KPI Metric,Value\n';
        csv += `Total Revenue (INR),${dashboard.kpis.totalRevenue}\n`;
        csv += `Total Collected (INR),${dashboard.kpis.totalCollected}\n`;
        csv += `Pending Collections (INR),${dashboard.kpis.pendingCollections}\n`;
        csv += `Total Leads,${dashboard.kpis.totalLeads}\n`;
        csv += `Converted Leads,${dashboard.kpis.convertedLeads}\n`;
        csv += `Conversion Rate,${dashboard.kpis.conversionRate}%\n`;
        csv += `Total Applications,${dashboard.kpis.totalApplications}\n`;
        csv += `Active Cases In Progress,${dashboard.kpis.activeApplications}\n`;
        csv += `Completed Deliveries,${dashboard.kpis.completedApplications}\n`;
        csv += `Partner Commissions Accrued (INR),${dashboard.kpis.totalCommissionsAccrued}\n`;
        csv += `Partner Commissions Paid (INR),${dashboard.kpis.totalCommissionsPaid}\n`;

        return { filename, mimeType: 'text/csv', content: csv };
      }
    }
  }
}
