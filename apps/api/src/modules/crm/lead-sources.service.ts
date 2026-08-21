import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLeadSourceDto, UpdateLeadSourceDto } from './dto/lead-source.dto';

@Injectable()
export class LeadSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.leadSource.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const source = await this.prisma.leadSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!source) {
      throw new NotFoundException(`Lead source with ID ${id} not found`);
    }

    return source;
  }

  async findByCode(code: string) {
    return this.prisma.leadSource.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  async create(dto: CreateLeadSourceDto) {
    const normalizedCode = dto.code.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.findByCode(normalizedCode);
    if (existing) {
      throw new ConflictException(`Lead source with code '${normalizedCode}' already exists`);
    }

    return this.prisma.leadSource.create({
      data: {
        name: dto.name.trim(),
        code: normalizedCode,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async update(id: string, dto: UpdateLeadSourceDto) {
    await this.findOne(id);

    const dataToUpdate: any = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name.trim();
    if (dto.isActive !== undefined) dataToUpdate.isActive = dto.isActive;
    if (dto.code !== undefined) {
      const normalizedCode = dto.code.trim().toUpperCase().replace(/\s+/g, '_');
      const existing = await this.findByCode(normalizedCode);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Lead source with code '${normalizedCode}' already exists`);
      }
      dataToUpdate.code = normalizedCode;
    }

    return this.prisma.leadSource.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: string) {
    const source = await this.findOne(id);
    // If leads are associated, deactivate instead of hard delete
    const leadsCount = await this.prisma.lead.count({ where: { sourceId: id } });
    if (leadsCount > 0) {
      return this.prisma.leadSource.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.leadSource.delete({
      where: { id },
    });
  }
}
