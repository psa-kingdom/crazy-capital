import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateServiceCategoryDto) {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);

    const existingSlug = await this.prisma.serviceCategory.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Service category with slug '${slug}' already exists`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.serviceCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category with id '${dto.parentId}' not found`);
      }
    }

    return this.prisma.serviceCategory.create({
      data: {
        parentId: dto.parentId || null,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        isActive: dto.isActive ?? true,
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findAll(onlyActive = false) {
    const where = onlyActive ? { isActive: true } : {};
    return this.prisma.serviceCategory.findMany({
      where: {
        ...where,
        parentId: null, // Return root categories with children nested
      },
      include: {
        children: {
          where,
          include: {
            _count: {
              select: { services: true },
            },
          },
        },
        _count: {
          select: { services: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        services: {
          include: {
            pricing: true,
            requiredDocuments: {
              include: { documentType: true },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Service category '${id}' not found`);
    }

    return category;
  }

  async update(id: string, dto: UpdateServiceCategoryDto) {
    await this.findOne(id);

    let slug: string | undefined;
    if (dto.slug || dto.name) {
      slug = dto.slug ? this.slugify(dto.slug) : dto.name ? this.slugify(dto.name) : undefined;
      if (slug) {
        const existing = await this.prisma.serviceCategory.findUnique({
          where: { slug },
        });
        if (existing && existing.id !== id) {
          throw new ConflictException(`Service category with slug '${slug}' already exists`);
        }
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }
      const parent = await this.prisma.serviceCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category '${dto.parentId}' not found`);
      }
    }

    return this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(slug && { slug }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.serviceCategory.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
