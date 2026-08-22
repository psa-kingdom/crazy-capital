import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCustomerDto, CustomerAddressInputDto, CustomerContactInputDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { UserRole } from '@cc/types';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  // --- 1. Atomic Lead to Customer Conversion (Vertical Slice 1.3 / ADR-015) ---
  async convertLead(
    leadId: string,
    dto: ConvertLeadDto,
    currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] },
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId: currentUser.organizationId,
        deletedAt: null,
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    if (lead.status === 'CONVERTED' || lead.convertedToId) {
      throw new ConflictException(`Lead ${leadId} is already converted to customer ID ${lead.convertedToId}`);
    }

    const email = lead.email ? lead.email.toLowerCase().trim() : `${lead.mobile}@customer.crazycapital.in`;
    const mobile = lead.mobile.trim();

    // Check duplicate customer (Rule C3: Single master profile per organization)
    const existingByMobile = await this.prisma.customer.findUnique({
      where: {
        organizationId_mobile: {
          organizationId: currentUser.organizationId,
          mobile,
        },
      },
    });

    if (existingByMobile) {
      throw new ConflictException(
        `Customer profile already exists with mobile ${mobile} (Customer ID: ${existingByMobile.id}). Multiple master records are not permitted (Rule C3).`,
      );
    }

    const existingByEmail = await this.prisma.customer.findUnique({
      where: {
        organizationId_email: {
          organizationId: currentUser.organizationId,
          email,
        },
      },
    });

    if (existingByEmail) {
      throw new ConflictException(
        `Customer profile already exists with email ${email} (Customer ID: ${existingByEmail.id}). Multiple master records are not permitted (Rule C3).`,
      );
    }

    // Execute atomic conversion transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Customer
      const customer = await tx.customer.create({
        data: {
          organizationId: currentUser.organizationId,
          branchId: lead.branchId || currentUser.branchId,
          customerType: dto.customerType || 'INDIVIDUAL',
          firstName: lead.firstName.trim(),
          lastName: lead.lastName.trim(),
          email,
          mobile,
          companyName: dto.companyName?.trim() || lead.companyName?.trim() || null,
          pan: dto.pan?.toUpperCase().trim() || null,
          gstin: dto.gstin?.toUpperCase().trim() || null,
          status: 'ACTIVE',
        },
      });

      // 2. Create Initial Address if provided
      if (dto.address) {
        await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            type: dto.address.type || 'REGISTERED',
            addressLine1: dto.address.addressLine1.trim(),
            addressLine2: dto.address.addressLine2?.trim() || null,
            city: dto.address.city.trim(),
            state: dto.address.state.trim(),
            country: dto.address.country?.trim() || 'India',
            pincode: dto.address.pincode.trim(),
          },
        });
      }

      // 3. Create Initial Contact if provided
      if (dto.contact) {
        await tx.customerContact.create({
          data: {
            customerId: customer.id,
            name: dto.contact.name.trim(),
            mobile: dto.contact.mobile.trim(),
            email: dto.contact.email?.toLowerCase().trim() || null,
            designation: dto.contact.designation?.trim() || null,
          },
        });
      }

      // 4. Update Lead to CONVERTED atomically
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          convertedToId: customer.id,
        },
      });

      // 5. Create Lead Activity
      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          performedById: currentUser.id,
          activityType: 'STATUS_CHANGE',
          notes: `Lead successfully converted to Customer master profile (Customer ID: ${customer.id})`,
        },
      });

      // 6. Record Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: currentUser.organizationId,
          userId: currentUser.id,
          action: 'lead.convert',
          entityType: 'customer',
          entityId: customer.id,
          newValues: {
            leadId: lead.id,
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            mobile: customer.mobile,
          },
        },
      });

      // Return fully formed customer
      return tx.customer.findUnique({
        where: { id: customer.id },
        include: {
          addresses: true,
          contacts: true,
          branch: true,
        },
      });
    });
  }

  // --- 2. Direct Customer Creation ---
  async create(
    dto: CreateCustomerDto,
    currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] },
  ) {
    const email = dto.email.toLowerCase().trim();
    const mobile = dto.mobile.trim();

    // Check duplicate customer (Rule C3)
    const existingByMobile = await this.prisma.customer.findUnique({
      where: {
        organizationId_mobile: {
          organizationId: currentUser.organizationId,
          mobile,
        },
      },
    });
    if (existingByMobile) {
      throw new ConflictException(`Customer already exists with mobile ${mobile}`);
    }

    const existingByEmail = await this.prisma.customer.findUnique({
      where: {
        organizationId_email: {
          organizationId: currentUser.organizationId,
          email,
        },
      },
    });
    if (existingByEmail) {
      throw new ConflictException(`Customer already exists with email ${email}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          organizationId: currentUser.organizationId,
          branchId: dto.branchId || currentUser.branchId,
          customerType: dto.customerType || 'INDIVIDUAL',
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email,
          mobile,
          companyName: dto.companyName?.trim() || null,
          pan: dto.pan?.toUpperCase().trim() || null,
          gstin: dto.gstin?.toUpperCase().trim() || null,
          status: 'ACTIVE',
        },
      });

      if (dto.addresses && dto.addresses.length > 0) {
        for (const addr of dto.addresses) {
          await tx.customerAddress.create({
            data: {
              customerId: customer.id,
              type: addr.type || 'REGISTERED',
              addressLine1: addr.addressLine1.trim(),
              addressLine2: addr.addressLine2?.trim() || null,
              city: addr.city.trim(),
              state: addr.state.trim(),
              country: addr.country?.trim() || 'India',
              pincode: addr.pincode.trim(),
            },
          });
        }
      }

      if (dto.contacts && dto.contacts.length > 0) {
        for (const c of dto.contacts) {
          await tx.customerContact.create({
            data: {
              customerId: customer.id,
              name: c.name.trim(),
              mobile: c.mobile.trim(),
              email: c.email?.toLowerCase().trim() || null,
              designation: c.designation?.trim() || null,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          organizationId: currentUser.organizationId,
          userId: currentUser.id,
          action: 'customer.create',
          entityType: 'customer',
          entityId: customer.id,
          newValues: {
            customerId: customer.id,
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
          },
        },
      });

      return tx.customer.findUnique({
        where: { id: customer.id },
        include: {
          addresses: true,
          contacts: true,
          branch: true,
        },
      });
    });
  }

  // --- 3. Find All Customers (Paginated & Multi-tenant) ---
  async findAll(
    query: QueryCustomersDto,
    currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      organizationId: currentUser.organizationId,
      deletedAt: null,
    };

    // Branch isolation for branch managers/employees
    const isSuperAdminOrAdmin = currentUser.roles.some(
      (r) => r === UserRole.SUPER_ADMIN || r === UserRole.ADMIN,
    );
    if (!isSuperAdminOrAdmin && currentUser.branchId) {
      where.branchId = currentUser.branchId;
    }

    if (query.branchId) {
      where.branchId = query.branchId;
    }
    if (query.customerType) {
      where.customerType = query.customerType;
    }
    if (query.status) {
      where.status = query.status;
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
            { pan: { contains: s, mode: 'insensitive' } },
            { gstin: { contains: s, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    if (query.sortBy === 'firstName') {
      orderBy.firstName = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = query.sortOrder || 'desc';
    }

    const [total, customers] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          branch: {
            select: { id: true, name: true, code: true },
          },
          addresses: true,
          contacts: true,
          _count: {
            select: {
              applications: true,
              documents: true,
              invoices: true,
            },
          },
        },
      }),
    ]);

    return {
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // --- 4. Customer 360 View (Profile, Addresses, Contacts, Applications, Invoices, Docs) ---
  async findOne(
    id: string,
    currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] },
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        organizationId: currentUser.organizationId,
        deletedAt: null,
      },
      include: {
        branch: true,
        addresses: {
          orderBy: { createdAt: 'asc' },
        },
        contacts: {
          orderBy: { createdAt: 'asc' },
        },
        applications: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            service: {
              select: { id: true, name: true, slug: true },
            },
            assignedTo: {
              select: { id: true, firstName: true, lastName: true },
            },
            workflowInstance: {
              include: {
                currentStage: true,
              },
            },
          },
        },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            documentType: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            payments: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  // --- 5. Update Customer Profile ---
  async update(
    id: string,
    dto: UpdateCustomerDto,
    currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] },
  ) {
    await this.findOne(id, currentUser);

    const dataToUpdate: Prisma.CustomerUpdateInput = {};
    if (dto.firstName !== undefined) dataToUpdate.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) dataToUpdate.lastName = dto.lastName.trim();
    if (dto.companyName !== undefined) dataToUpdate.companyName = dto.companyName ? dto.companyName.trim() : null;
    if (dto.pan !== undefined) dataToUpdate.pan = dto.pan ? dto.pan.toUpperCase().trim() : null;
    if (dto.gstin !== undefined) dataToUpdate.gstin = dto.gstin ? dto.gstin.toUpperCase().trim() : null;
    if (dto.status !== undefined) dataToUpdate.status = dto.status;
    if (dto.customerType !== undefined) dataToUpdate.customerType = dto.customerType;
    if (dto.branchId !== undefined) {
      dataToUpdate.branch = dto.branchId ? { connect: { id: dto.branchId } } : { disconnect: true };
    }

    return this.prisma.customer.update({
      where: { id },
      data: dataToUpdate,
      include: {
        addresses: true,
        contacts: true,
        branch: true,
      },
    });
  }

  // --- 6. Add Customer Address ---
  async addAddress(
    id: string,
    dto: CustomerAddressInputDto,
    currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] },
  ) {
    await this.findOne(id, currentUser);

    return this.prisma.customerAddress.create({
      data: {
        customerId: id,
        type: dto.type || 'REGISTERED',
        addressLine1: dto.addressLine1.trim(),
        addressLine2: dto.addressLine2?.trim() || null,
        city: dto.city.trim(),
        state: dto.state.trim(),
        country: dto.country?.trim() || 'India',
        pincode: dto.pincode.trim(),
      },
    });
  }

  // --- 7. Add Customer Contact ---
  async addContact(
    id: string,
    dto: CustomerContactInputDto,
    currentUser: { organizationId: string; branchId: string | null; id: string; roles: UserRole[] },
  ) {
    await this.findOne(id, currentUser);

    return this.prisma.customerContact.create({
      data: {
        customerId: id,
        name: dto.name.trim(),
        mobile: dto.mobile.trim(),
        email: dto.email?.toLowerCase().trim() || null,
        designation: dto.designation?.trim() || null,
      },
    });
  }
}
