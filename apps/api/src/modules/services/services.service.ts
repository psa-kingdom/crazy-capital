import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';
import { CreateServiceDocumentDto } from './dto/create-service-document.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PricingType } from '@cc/types';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateServiceDto) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category '${dto.categoryId}' not found`);
    }

    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    const existingSlug = await this.prisma.service.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Service with slug '${slug}' already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim() || null,
          isActive: dto.isActive ?? true,
        },
      });

      // Add standard price if provided
      if (dto.standardPrice !== undefined) {
        await tx.servicePricing.create({
          data: {
            serviceId: service.id,
            pricingType: PricingType.STANDARD,
            amount: dto.standardPrice,
          },
        });
      }

      // Add partner price if provided
      if (dto.partnerPrice !== undefined) {
        await tx.servicePricing.create({
          data: {
            serviceId: service.id,
            pricingType: PricingType.PARTNER,
            amount: dto.partnerPrice,
          },
        });
      }

      // Add required documents if provided
      if (dto.requiredDocuments && dto.requiredDocuments.length > 0) {
        for (const docReq of dto.requiredDocuments) {
          const docType = await tx.documentType.findUnique({
            where: { id: docReq.documentTypeId },
          });
          if (!docType) {
            throw new NotFoundException(`Document type '${docReq.documentTypeId}' not found`);
          }

          await tx.serviceDocument.create({
            data: {
              serviceId: service.id,
              documentTypeId: docReq.documentTypeId,
              isMandatory: docReq.isMandatory ?? true,
            },
          });
        }
      }

      return tx.service.findUnique({
        where: { id: service.id },
        include: {
          category: true,
          pricing: true,
          requiredDocuments: {
            include: { documentType: true },
          },
          workflow: true,
        },
      });
    });
  }

  async findAll(query: QueryServicesDto, onlyActive = true) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      ...(onlyActive && { isActive: true }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          pricing: true,
          requiredDocuments: {
            include: { documentType: true },
          },
          workflow: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },
        },
        orderBy: { name: 'asc' },
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

  async findOne(id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        pricing: true,
        requiredDocuments: {
          include: { documentType: true },
        },
        workflow: {
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
            transitions: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service '${id}' not found`);
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);

    let slug: string | undefined;
    if (dto.slug || dto.name) {
      slug = dto.slug ? this.slugify(dto.slug) : dto.name ? this.slugify(dto.name) : undefined;
      if (slug) {
        const existing = await this.prisma.service.findUnique({
          where: { slug },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException(`Service with slug '${slug}' already exists`);
        }
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.serviceCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category '${dto.categoryId}' not found`);
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(slug && { slug }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        category: true,
        pricing: true,
        requiredDocuments: {
          include: { documentType: true },
        },
        workflow: true,
      },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: { isActive },
      include: {
        category: true,
        pricing: true,
      },
    });
  }

  async addPricing(serviceId: string, dto: CreateServicePricingDto) {
    await this.findOne(serviceId);

    // If a pricing of this type exists with no effectiveTo, close it or upsert
    const existing = await this.prisma.servicePricing.findFirst({
      where: {
        serviceId,
        pricingType: dto.pricingType,
        effectiveTo: null,
      },
    });

    if (existing) {
      await this.prisma.servicePricing.update({
        where: { id: existing.id },
        data: { effectiveTo: new Date() },
      });
    }

    return this.prisma.servicePricing.create({
      data: {
        serviceId,
        pricingType: dto.pricingType,
        amount: dto.amount,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date(),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      },
    });
  }

  async addRequiredDocument(serviceId: string, dto: CreateServiceDocumentDto) {
    await this.findOne(serviceId);

    const docType = await this.prisma.documentType.findUnique({
      where: { id: dto.documentTypeId },
    });
    if (!docType) {
      throw new NotFoundException(`Document type '${dto.documentTypeId}' not found`);
    }

    const existing = await this.prisma.serviceDocument.findUnique({
      where: {
        serviceId_documentTypeId: {
          serviceId,
          documentTypeId: dto.documentTypeId,
        },
      },
    });

    if (existing) {
      return this.prisma.serviceDocument.update({
        where: { id: existing.id },
        data: { isMandatory: dto.isMandatory ?? true },
        include: { documentType: true },
      });
    }

    return this.prisma.serviceDocument.create({
      data: {
        serviceId,
        documentTypeId: dto.documentTypeId,
        isMandatory: dto.isMandatory ?? true,
      },
      include: { documentType: true },
    });
  }

  async removeRequiredDocument(serviceId: string, documentTypeId: string) {
    const existing = await this.prisma.serviceDocument.findUnique({
      where: {
        serviceId_documentTypeId: {
          serviceId,
          documentTypeId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Service document requirement not found');
    }

    return this.prisma.serviceDocument.delete({
      where: { id: existing.id },
    });
  }
}
