import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { InvoiceStatus, UserRole } from '@cc/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate next sequential invoice number in format: INV-YYYY-XXXXXX (e.g. INV-2026-000001)
   */
  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    const count = await this.prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
        customer: {
          organizationId,
        },
      },
    });

    const sequence = String(count + 1).padStart(6, '0');
    return `${prefix}${sequence}`;
  }

  async create(dto: CreateInvoiceDto, user: any) {
    const organizationId = user.organizationId;

    // Validate customer exists within tenant
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        organizationId,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer '${dto.customerId}' not found in your organization`);
    }

    // Customer role boundary: customer cannot create invoices directly
    if (user.roles?.includes(UserRole.CUSTOMER) && !user.roles?.some((r: any) => [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.EMPLOYEE].includes(r))) {
      throw new ForbiddenException('Customers are not authorized to generate new invoices');
    }

    // Validate application if provided
    if (dto.applicationId) {
      const application = await this.prisma.application.findFirst({
        where: {
          id: dto.applicationId,
          organizationId,
          customerId: dto.customerId,
        },
      });

      if (!application) {
        throw new NotFoundException(`Application '${dto.applicationId}' not found for customer '${dto.customerId}'`);
      }
    }

    // Calculate tax: 18% GST by default if not explicitly specified
    const baseAmount = Number(dto.baseAmount);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      throw new BadRequestException('Base amount must be a positive number');
    }

    const taxAmount =
      dto.taxAmount !== undefined
        ? Number(dto.taxAmount)
        : Math.round(baseAmount * 0.18 * 100) / 100;

    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    const invoice = await this.prisma.invoice.create({
      data: {
        customerId: dto.customerId,
        applicationId: dto.applicationId || null,
        invoiceNumber,
        amount: new Prisma.Decimal(baseAmount),
        taxAmount: new Prisma.Decimal(taxAmount),
        status: InvoiceStatus.DRAFT,
      },
      include: {
        customer: true,
        application: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
    });

    const customerName = `${customer.firstName} ${customer.lastName}`;
    this.logger.log(`Created Invoice '${invoiceNumber}' for customer '${customerName}' (Total: ₹${baseAmount + taxAmount})`);

    return this.mapToDto(invoice);
  }

  async findAll(query: QueryInvoicesDto, user: any) {
    const organizationId = user.organizationId;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      customer: {
        organizationId,
      },
    };

    // If caller is CUSTOMER, restrict strictly to their own customer profile
    if (user.roles?.includes(UserRole.CUSTOMER) && user.customerId) {
      where.customerId = user.customerId;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.applicationId) {
      where.applicationId = query.applicationId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
        { customer: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { customer: { companyName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          application: {
            include: {
              service: true,
            },
          },
          payments: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map((inv) => this.mapToDto(inv)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    const organizationId = user.organizationId;

    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        application: {
          include: {
            service: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice || invoice.customer.organizationId !== organizationId) {
      throw new NotFoundException(`Invoice '${id}' not found`);
    }

    // Role check: customer can only view their own invoice
    if (user.roles?.includes(UserRole.CUSTOMER) && user.customerId && invoice.customerId !== user.customerId) {
      throw new ForbiddenException('You can only view invoices issued to your account');
    }

    return this.mapToDto(invoice);
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto, user: any) {
    const invoice = await this.findOne(id, user);

    if (invoice.status === InvoiceStatus.PAID && dto.status !== InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot change status of an already PAID invoice');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        customer: true,
        application: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
    });

    this.logger.log(`Invoice '${invoice.invoiceNumber}' status transitioned: ${invoice.status} ➔ ${dto.status}`);

    return this.mapToDto(updated);
  }

  private mapToDto(invoice: any) {
    const baseAmount = Number(invoice.amount);
    const taxAmount = Number(invoice.taxAmount);
    const totalAmount = Math.round((baseAmount + taxAmount) * 100) / 100;

    return {
      id: invoice.id,
      customerId: invoice.customerId,
      applicationId: invoice.applicationId,
      invoiceNumber: invoice.invoiceNumber,
      amount: baseAmount,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      status: invoice.status,
      customer: invoice.customer
        ? {
            id: invoice.customer.id,
            fullName: invoice.customer.fullName || `${invoice.customer.firstName} ${invoice.customer.lastName}`,
            companyName: invoice.customer.companyName,
            email: invoice.customer.email,
            mobile: invoice.customer.mobile,
            gstin: invoice.customer.gstin,
          }
        : undefined,
      application: invoice.application
        ? {
            id: invoice.application.id,
            applicationNumber: invoice.application.applicationNumber,
            service: invoice.application.service
              ? {
                  id: invoice.application.service.id,
                  name: invoice.application.service.name,
                  code: invoice.application.service.code,
                  basePrice: Number(invoice.application.service.basePrice),
                }
              : undefined,
          }
        : null,
      payments: invoice.payments?.map((p: any) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        gateway: p.gateway,
        gatewayReference: p.gatewayReference,
        amount: Number(p.amount),
        status: p.status,
        rawPayload: p.rawPayload,
        createdAt: p.createdAt.toISOString(),
      })),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }
}
