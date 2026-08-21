import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServiceCategoriesService } from './service-categories.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PricingType } from '@cc/types';

describe('Service Catalog Engine (Vertical Slice 1.4)', () => {
  let servicesService: ServicesService;
  let categoriesService: ServiceCategoriesService;
  let prisma: PrismaService;

  const mockPrisma = {
    serviceCategory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    servicePricing: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    serviceDocument: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    documentType: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        ServiceCategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    servicesService = module.get<ServicesService>(ServicesService);
    categoriesService = module.get<ServiceCategoriesService>(ServiceCategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Service Categories', () => {
    it('1. should create a root service category with auto-generated slug', async () => {
      mockPrisma.serviceCategory.findUnique.mockResolvedValueOnce(null); // slug check
      mockPrisma.serviceCategory.create.mockResolvedValueOnce({
        id: 'cat-1',
        name: 'Corporate Law',
        slug: 'corporate-law',
        parentId: null,
        isActive: true,
      });

      const result = await categoriesService.create({ name: 'Corporate Law' });
      expect(result.slug).toBe('corporate-law');
      expect(mockPrisma.serviceCategory.create).toHaveBeenCalled();
    });

    it('2. should reject duplicate category slug with ConflictException', async () => {
      mockPrisma.serviceCategory.findUnique.mockResolvedValueOnce({ id: 'cat-existing', slug: 'tax' });

      await expect(
        categoriesService.create({ name: 'Tax', slug: 'tax' }),
      ).rejects.toThrow(ConflictException);
    });

    it('3. should validate parent category exists when creating subcategory', async () => {
      mockPrisma.serviceCategory.findUnique
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null); // parent check fails

      await expect(
        categoriesService.create({ name: 'Direct Tax', parentId: 'non-existent-parent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('4. should prevent category from becoming its own parent on update', async () => {
      mockPrisma.serviceCategory.findUnique.mockResolvedValueOnce({ id: 'cat-1', name: 'Tax' });

      await expect(
        categoriesService.update('cat-1', { parentId: 'cat-1' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Services & Pricing & Documents', () => {
    it('5. should create service with standard and partner pricing in a single transaction', async () => {
      mockPrisma.serviceCategory.findUnique.mockResolvedValueOnce({ id: 'cat-1', name: 'Registrations' });
      mockPrisma.service.findUnique.mockResolvedValueOnce(null); // slug check
      mockPrisma.service.create.mockResolvedValueOnce({
        id: 'srv-1',
        categoryId: 'cat-1',
        name: 'Private Limited Company Incorporation',
        slug: 'private-limited-company-incorporation',
        isActive: true,
      });
      mockPrisma.service.findUnique.mockResolvedValueOnce({
        id: 'srv-1',
        name: 'Private Limited Company Incorporation',
        pricing: [
          { pricingType: 'STANDARD', amount: 6999 },
          { pricingType: 'PARTNER', amount: 4999 },
        ],
      });

      const result = await servicesService.create({
        categoryId: 'cat-1',
        name: 'Private Limited Company Incorporation',
        standardPrice: 6999,
        partnerPrice: 4999,
      });

      expect(result).toBeDefined();
      expect(mockPrisma.servicePricing.create).toHaveBeenCalledTimes(2);
    });

    it('6. should reject duplicate service slug with ConflictException', async () => {
      mockPrisma.serviceCategory.findUnique.mockResolvedValueOnce({ id: 'cat-1', name: 'Registrations' });
      mockPrisma.service.findUnique.mockResolvedValueOnce({ id: 'srv-existing', slug: 'gst-reg' });

      await expect(
        servicesService.create({
          categoryId: 'cat-1',
          name: 'GST Reg',
          slug: 'gst-reg',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('7. should toggle service active status', async () => {
      mockPrisma.service.findFirst.mockResolvedValueOnce({ id: 'srv-1', name: 'GST Filing' });
      mockPrisma.service.update.mockResolvedValueOnce({ id: 'srv-1', isActive: false });

      const res = await servicesService.updateStatus('srv-1', false);
      expect(res.isActive).toBe(false);
      expect(mockPrisma.service.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'srv-1' },
          data: { isActive: false },
        }),
      );
    });

    it('8. should add a new pricing tier and expire previous active tier', async () => {
      mockPrisma.service.findFirst.mockResolvedValueOnce({ id: 'srv-1', name: 'GST Filing' });
      mockPrisma.servicePricing.findFirst.mockResolvedValueOnce({ id: 'pr-old', amount: 1499 });
      mockPrisma.servicePricing.update.mockResolvedValueOnce({ id: 'pr-old' });
      mockPrisma.servicePricing.create.mockResolvedValueOnce({
        id: 'pr-new',
        serviceId: 'srv-1',
        pricingType: PricingType.STANDARD,
        amount: 1999,
      });

      const res = await servicesService.addPricing('srv-1', {
        pricingType: PricingType.STANDARD,
        amount: 1999,
      });

      expect(mockPrisma.servicePricing.update).toHaveBeenCalled();
      expect(mockPrisma.servicePricing.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amount: 1999 }),
        }),
      );
    });

    it('9. should configure mandatory document requirement on service', async () => {
      mockPrisma.service.findFirst.mockResolvedValueOnce({ id: 'srv-1' });
      mockPrisma.documentType.findUnique.mockResolvedValueOnce({ id: 'dt-pan', name: 'PAN Card' });
      mockPrisma.serviceDocument.findUnique.mockResolvedValueOnce(null);
      mockPrisma.serviceDocument.create.mockResolvedValueOnce({
        id: 'sd-1',
        serviceId: 'srv-1',
        documentTypeId: 'dt-pan',
        isMandatory: true,
      });

      const res = await servicesService.addRequiredDocument('srv-1', {
        documentTypeId: 'dt-pan',
        isMandatory: true,
      });

      expect(res.isMandatory).toBe(true);
      expect(mockPrisma.serviceDocument.create).toHaveBeenCalled();
    });

    it('10. should remove document requirement from service', async () => {
      mockPrisma.serviceDocument.findUnique.mockResolvedValueOnce({
        id: 'sd-1',
        serviceId: 'srv-1',
        documentTypeId: 'dt-pan',
      });
      mockPrisma.serviceDocument.delete.mockResolvedValueOnce({ id: 'sd-1' });

      const res = await servicesService.removeRequiredDocument('srv-1', 'dt-pan');
      expect(res.id).toBe('sd-1');
      expect(mockPrisma.serviceDocument.delete).toHaveBeenCalledWith({ where: { id: 'sd-1' } });
    });
  });
});
