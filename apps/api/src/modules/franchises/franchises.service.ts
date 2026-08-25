import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  FranchiseDto,
  CreateFranchiseInput,
  UpdateFranchiseInput,
  FranchiseStatus,
  FranchiseType,
} from '@cc/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class FranchisesService {
  private readonly logger = new Logger(FranchisesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new franchise instance under an organization and optional regional hub
   */
  async createFranchise(organizationId: string, input: CreateFranchiseInput): Promise<FranchiseDto> {
    const existing = await this.prisma.franchise.findUnique({
      where: { code: input.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException(`Franchise code '${input.code}' already exists`);
    }

    const franchise = await this.prisma.franchise.create({
      data: {
        organizationId,
        regionId: input.regionId || null,
        branchId: input.branchId || null,
        managerId: input.managerId || null,
        name: input.name,
        code: input.code.toUpperCase(),
        franchiseType: input.franchiseType || FranchiseType.CITY_FRANCHISE,
        legalEntityName: input.legalEntityName || null,
        cinGstin: input.cinGstin || null,
        primaryContactName: input.primaryContactName || null,
        phone: input.phone || null,
        email: input.email || null,
        addressLine: input.addressLine || null,
        city: input.city || null,
        state: input.state || null,
        pincode: input.pincode || null,
        agreementStartDate: input.agreementStartDate ? new Date(input.agreementStartDate) : null,
        agreementEndDate: input.agreementEndDate ? new Date(input.agreementEndDate) : null,
        revenueSharePct: new Prisma.Decimal(input.revenueSharePct !== undefined ? input.revenueSharePct : 70.0),
        settlementFrequency: input.settlementFrequency || 'MONTHLY',
        securityDeposit: new Prisma.Decimal(input.securityDeposit || 0),
        status: FranchiseStatus.ACTIVE,
      },
    });

    this.logger.log(`Created Franchise '${franchise.name}' (${franchise.code}) with ${franchise.revenueSharePct}% revenue share`);
    return this.mapToDto(franchise);
  }

  /**
   * List all franchises for an organization with optional region filter
   */
  async listFranchises(organizationId: string, regionId?: string): Promise<FranchiseDto[]> {
    const franchises = await this.prisma.franchise.findMany({
      where: {
        organizationId,
        ...(regionId ? { regionId } : {}),
        deletedAt: null,
      },
      include: {
        pricingOverrides: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return franchises.map((f) => ({
      ...this.mapToDto(f),
      pricingOverridesCount: f.pricingOverrides?.length || 0,
    }));
  }

  /**
   * Get single franchise details by ID
   */
  async getFranchise(id: string, organizationId: string): Promise<FranchiseDto> {
    const franchise = await this.prisma.franchise.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        pricingOverrides: {
          include: { service: true },
        },
      },
    });

    if (!franchise) {
      throw new NotFoundException(`Franchise '${id}' not found`);
    }

    return this.mapToDto(franchise);
  }

  /**
   * Update franchise details or status
   */
  async updateFranchise(id: string, organizationId: string, input: UpdateFranchiseInput): Promise<FranchiseDto> {
    const existing = await this.prisma.franchise.findFirst({
      where: { id, organizationId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Franchise '${id}' not found`);
    }

    const updated = await this.prisma.franchise.update({
      where: { id },
      data: {
        name: input.name || undefined,
        regionId: input.regionId !== undefined ? input.regionId : undefined,
        branchId: input.branchId !== undefined ? input.branchId : undefined,
        managerId: input.managerId !== undefined ? input.managerId : undefined,
        franchiseType: input.franchiseType || undefined,
        legalEntityName: input.legalEntityName !== undefined ? input.legalEntityName : undefined,
        cinGstin: input.cinGstin !== undefined ? input.cinGstin : undefined,
        primaryContactName: input.primaryContactName !== undefined ? input.primaryContactName : undefined,
        phone: input.phone !== undefined ? input.phone : undefined,
        email: input.email !== undefined ? input.email : undefined,
        addressLine: input.addressLine !== undefined ? input.addressLine : undefined,
        city: input.city !== undefined ? input.city : undefined,
        state: input.state !== undefined ? input.state : undefined,
        pincode: input.pincode !== undefined ? input.pincode : undefined,
        status: input.status || undefined,
        agreementStartDate: input.agreementStartDate ? new Date(input.agreementStartDate) : undefined,
        agreementEndDate: input.agreementEndDate ? new Date(input.agreementEndDate) : undefined,
        revenueSharePct: input.revenueSharePct !== undefined ? new Prisma.Decimal(input.revenueSharePct) : undefined,
        settlementFrequency: input.settlementFrequency || undefined,
        securityDeposit: input.securityDeposit !== undefined ? new Prisma.Decimal(input.securityDeposit) : undefined,
      },
    });

    this.logger.log(`Updated Franchise '${id}': ${updated.name}`);
    return this.mapToDto(updated);
  }

  private mapToDto(f: any): FranchiseDto {
    return {
      id: f.id,
      organizationId: f.organizationId,
      regionId: f.regionId,
      branchId: f.branchId,
      managerId: f.managerId,
      name: f.name,
      code: f.code,
      franchiseType: f.franchiseType as FranchiseType,
      legalEntityName: f.legalEntityName,
      cinGstin: f.cinGstin,
      primaryContactName: f.primaryContactName,
      phone: f.phone,
      email: f.email,
      addressLine: f.addressLine,
      city: f.city,
      state: f.state,
      pincode: f.pincode,
      status: f.status as FranchiseStatus,
      agreementStartDate: f.agreementStartDate,
      agreementEndDate: f.agreementEndDate,
      revenueSharePct: Number(f.revenueSharePct),
      settlementFrequency: f.settlementFrequency,
      securityDeposit: Number(f.securityDeposit),
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    };
  }
}
