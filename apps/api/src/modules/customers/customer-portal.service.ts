import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CustomerDashboardDto,
  CustomerApplicationDetailDto,
  CustomerDocumentRequirementDto,
  CustomerStageProgressDto,
  InvoiceDto,
} from '@cc/types';

@Injectable()
export class CustomerPortalService {
  private readonly logger = new Logger(CustomerPortalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Resolves or ensures a Customer record exists for the authenticated user
   */
  async resolveCustomer(user: any) {
    let customer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          { email: user.email },
          { id: user.id },
        ],
        deletedAt: null,
      },
    });

    if (!customer) {
      // Auto-provision Customer entity for authenticated user if not present
      customer = await this.prisma.customer.create({
        data: {
          organizationId: user.organizationId || 'org-crazy-capital',
          branchId: user.branchId || null,
          firstName: user.firstName || 'Customer',
          lastName: user.lastName || '',
          email: user.email,
          mobile: user.mobile || '+919000000000',
          status: 'ACTIVE',
        },
      });
    }

    return customer;
  }

  /**
   * Customer Overview Dashboard: Aggregated metrics, active applications, missing docs, unpaid invoices
   */
  async getDashboard(user: any): Promise<CustomerDashboardDto> {
    const customer = await this.resolveCustomer(user);

    // Fetch customer applications
    const applications = await this.prisma.application.findMany({
      where: {
        customerId: customer.id,
        deletedAt: null,
      },
      include: {
        service: {
          include: {
            requiredDocuments: {
              include: {
                documentType: true,
              },
            },
            workflow: {
              include: {
                stages: {
                  orderBy: { stageOrder: 'asc' },
                },
              },
            },
          },
        },
        workflowInstance: {
          include: {
            currentStage: true,
          },
        },
        documents: {
          where: { deletedAt: null },
        },
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let activeApplicationsCount = 0;
    let completedApplicationsCount = 0;
    let totalMissingDocsCount = 0;

    const activeApplicationsList: CustomerDashboardDto['activeApplications'] = [];

    for (const app of applications) {
      const isCompleted = app.status === 'COMPLETED';
      if (isCompleted) {
        completedApplicationsCount++;
      } else {
        activeApplicationsCount++;
      }

      // Calculate missing mandatory documents
      const requiredDocs = app.service?.requiredDocuments || [];
      const uploadedDocTypeIds = new Set(
        app.documents
          .filter((d) => d.status === 'VERIFIED' || d.status === 'UPLOADED' || d.status === 'PENDING')
          .map((d) => d.documentTypeId),
      );

      const missingForThisApp = requiredDocs.filter(
        (rd) => rd.isMandatory && !uploadedDocTypeIds.has(rd.documentTypeId),
      ).length;

      if (!isCompleted) {
        totalMissingDocsCount += missingForThisApp;
      }

      // Calculate workflow progress %
      const stages = app.service?.workflow?.stages || [];
      const currentStageOrder = app.workflowInstance?.currentStage?.stageOrder || 1;
      const totalStages = Math.max(stages.length, 1);
      const progressPercent = isCompleted
        ? 100
        : Math.min(100, Math.round(((currentStageOrder - 1) / totalStages) * 100));

      if (!isCompleted) {
        activeApplicationsList.push({
          id: app.id,
          applicationNumber: app.applicationNumber,
          serviceName: app.service?.name || 'Financial Service',
          status: app.status,
          currentStageName: app.workflowInstance?.currentStage?.name || app.status,
          progressPercent,
          missingDocsCount: missingForThisApp,
          createdAt: app.createdAt.toISOString(),
        });
      }
    }

    // Fetch customer invoices
    const invoices = await this.prisma.invoice.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        application: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const unpaidInvoices = invoices.filter((inv) => inv.status === 'SENT' || inv.status === 'DRAFT');
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

    return {
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        mobile: customer.mobile,
        companyName: customer.companyName,
      },
      stats: {
        totalApplications: applications.length,
        activeApplications: activeApplicationsCount,
        completedApplications: completedApplicationsCount,
        missingDocumentsCount: totalMissingDocsCount,
        unpaidInvoicesCount: unpaidInvoices.length,
        unpaidAmount: Math.round(unpaidAmount * 100) / 100,
      },
      activeApplications: activeApplicationsList,
      recentInvoices: invoices.slice(0, 5).map((inv) => this.mapInvoiceToDto(inv)),
    };
  }

  /**
   * List all applications for the logged-in customer
   */
  async getMyApplications(user: any) {
    const customer = await this.resolveCustomer(user);

    const applications = await this.prisma.application.findMany({
      where: {
        customerId: customer.id,
        deletedAt: null,
      },
      include: {
        service: true,
        workflowInstance: {
          include: {
            currentStage: true,
          },
        },
        documents: true,
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((app) => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      serviceName: app.service.name,
      status: app.status,
      currentStage: app.workflowInstance?.currentStage?.name || app.status,
      documentsCount: app.documents.length,
      invoicesCount: app.invoices.length,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }));
  }

  /**
   * Detailed Application View with Stage Progress Stepper and Checklist
   */
  async getApplicationDetail(applicationId: string, user: any): Promise<CustomerApplicationDetailDto> {
    const customer = await this.resolveCustomer(user);

    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        customer: true,
        service: {
          include: {
            requiredDocuments: {
              include: {
                documentType: true,
              },
            },
            workflow: {
              include: {
                stages: {
                  orderBy: { stageOrder: 'asc' },
                },
              },
            },
          },
        },
        workflowInstance: {
          include: {
            currentStage: true,
          },
        },
        documents: {
          where: { deletedAt: null },
          include: {
            documentType: true,
            verifications: {
              orderBy: { verifiedAt: 'desc' },
              take: 1,
            },
          },
        },
        invoices: {
          include: {
            payments: true,
          },
        },
        assignedTo: true,
      },
    });

    if (!app || app.deletedAt) {
      throw new NotFoundException(`Application '${applicationId}' not found`);
    }

    // Customer Isolation Check
    if (app.customerId !== customer.id && app.customer?.email !== user.email) {
      throw new ForbiddenException('You do not have access to this application record');
    }

    const allStages = app.service?.workflow?.stages || [];
    const currentOrder = app.workflowInstance?.currentStage?.stageOrder || 1;
    const isAppCompleted = app.status === 'COMPLETED';

    const stages: CustomerStageProgressDto[] = allStages.map((st) => ({
      id: st.id,
      name: st.name,
      stageOrder: st.stageOrder,
      stageType: st.stageType,
      isCurrent: !isAppCompleted && st.id === app.workflowInstance?.currentStageId,
      isCompleted: isAppCompleted || st.stageOrder < currentOrder,
    }));

    const progressPercent = isAppCompleted
      ? 100
      : Math.min(100, Math.round(((currentOrder - 1) / Math.max(allStages.length, 1)) * 100));

    // Map Document Checklist
    const uploadedDocsMap = new Map<string, any>();
    for (const d of app.documents) {
      uploadedDocsMap.set(d.documentTypeId, d);
    }

    const documents: CustomerDocumentRequirementDto[] = (app.service?.requiredDocuments || []).map((rd) => {
      const uploaded = uploadedDocsMap.get(rd.documentTypeId);
      return {
        documentTypeId: rd.documentTypeId,
        name: rd.documentType.name,
        code: rd.documentType.code,
        description: rd.documentType.description,
        isMandatory: rd.isMandatory,
        uploadedDocument: uploaded
          ? {
              id: uploaded.id,
              fileName: uploaded.fileName,
              fileSize: uploaded.fileSize,
              fileType: uploaded.mimeType,
              status: uploaded.status,
              rejectionReason: uploaded.verifications?.[0]?.remarks || null,
              uploadedAt: uploaded.createdAt.toISOString(),
            }
          : null,
      };
    });

    return {
      id: app.id,
      applicationNumber: app.applicationNumber,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      service: {
        id: app.service.id,
        name: app.service.name,
        slug: app.service.slug,
        description: app.service.description,
      },
      currentStage: {
        id: app.workflowInstance?.currentStage?.id || 'stage-init',
        name: app.workflowInstance?.currentStage?.name || app.status,
        stageOrder: currentOrder,
        stageType: app.workflowInstance?.currentStage?.stageType || 'START',
      },
      stages,
      progressPercent,
      documents,
      invoices: app.invoices.map((inv) => this.mapInvoiceToDto(inv)),
      assignedTo: app.assignedTo
        ? {
            name: `${app.assignedTo.firstName} ${app.assignedTo.lastName}`,
            email: app.assignedTo.email,
          }
        : null,
    };
  }

  /**
   * Customer Document Vault: All documents and missing mandatory checklists
   */
  async getMyVault(user: any) {
    const customer = await this.resolveCustomer(user);

    const [documents, activeApplications] = await Promise.all([
      this.prisma.document.findMany({
        where: {
          customerId: customer.id,
          deletedAt: null,
        },
        include: {
          documentType: true,
          application: {
            include: {
              service: true,
            },
          },
          verifications: {
            orderBy: { verifiedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.findMany({
        where: {
          customerId: customer.id,
          status: { in: ['SUBMITTED', 'IN_PROGRESS'] },
          deletedAt: null,
        },
        include: {
          service: {
            include: {
              requiredDocuments: {
                include: {
                  documentType: true,
                },
              },
            },
          },
          documents: {
            where: { deletedAt: null },
          },
        },
      }),
    ]);

    // Find missing requirements across all active applications
    const missingRequirements: any[] = [];
    for (const app of activeApplications) {
      const uploadedDocTypeIds = new Set(
        app.documents
          .filter((d) => d.status !== 'REJECTED')
          .map((d) => d.documentTypeId),
      );

      for (const rd of app.service.requiredDocuments) {
        if (rd.isMandatory && !uploadedDocTypeIds.has(rd.documentTypeId)) {
          missingRequirements.push({
            applicationId: app.id,
            applicationNumber: app.applicationNumber,
            serviceName: app.service.name,
            documentTypeId: rd.documentTypeId,
            documentTypeName: rd.documentType.name,
            documentTypeCode: rd.documentType.code,
          });
        }
      }
    }

    return {
      documents: documents.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        fileSize: d.fileSize,
        fileType: d.mimeType,
        status: d.status,
        documentType: {
          id: d.documentType.id,
          name: d.documentType.name,
          code: d.documentType.code,
        },
        application: d.application
          ? {
              id: d.application.id,
              applicationNumber: d.application.applicationNumber,
              serviceName: d.application.service?.name,
            }
          : null,
        rejectionReason: d.verifications?.[0]?.remarks || null,
        createdAt: d.createdAt.toISOString(),
      })),
      missingRequirements,
    };
  }

  /**
   * Customer Billing & Invoices
   */
  async getMyBilling(user: any) {
    const customer = await this.resolveCustomer(user);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        application: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => this.mapInvoiceToDto(inv));
  }

  private mapInvoiceToDto(inv: any): InvoiceDto {
    const totalAmount = Number(inv.amount || 0);
    const taxAmount = Number(inv.taxAmount || 0);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      applicationId: inv.applicationId,
      customerId: inv.customerId,
      amount: totalAmount,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      status: inv.status,
      createdAt: inv.createdAt ? (inv.createdAt instanceof Date ? inv.createdAt.toISOString() : new Date(inv.createdAt).toISOString()) : new Date().toISOString(),
      updatedAt: inv.updatedAt ? (inv.updatedAt instanceof Date ? inv.updatedAt.toISOString() : new Date(inv.updatedAt).toISOString()) : new Date().toISOString(),
      payments: inv.payments?.map((p: any) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        gateway: p.gateway,
        gatewayReference: p.gatewayReference,
        amount: Number(p.amount),
        status: p.status,
        createdAt: p.createdAt ? (p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date(p.createdAt).toISOString()) : new Date().toISOString(),
      })),
    };
  }
}
