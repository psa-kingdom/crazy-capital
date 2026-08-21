import { Test, TestingModule } from '@nestjs/testing';
import { LeadSourcesService } from './lead-sources.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('LeadSourcesService (ADR-013 Acceptance Suite)', () => {
  let service: LeadSourcesService;
  let prisma: any;

  const mockSource = {
    id: 'src-1',
    name: 'Website Inquiry',
    code: 'WEBSITE',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    leadSource: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadSourcesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeadSourcesService>(LeadSourcesService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should list all active lead sources', async () => {
    mockPrisma.leadSource.findMany.mockResolvedValue([mockSource]);

    const result = await service.findAll(false);
    expect(result).toHaveLength(1);
    expect(mockPrisma.leadSource.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
      }),
    );
  });

  it('should create a new lead source with normalized uppercase code', async () => {
    mockPrisma.leadSource.findUnique.mockResolvedValue(null);
    mockPrisma.leadSource.create.mockResolvedValue({
      id: 'src-2',
      name: 'Instagram Campaign',
      code: 'INSTAGRAM_CAMPAIGN',
      isActive: true,
    });

    const result = await service.create({
      name: 'Instagram Campaign',
      code: 'instagram campaign',
    });

    expect(result.code).toEqual('INSTAGRAM_CAMPAIGN');
    expect(mockPrisma.leadSource.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: 'INSTAGRAM_CAMPAIGN',
        }),
      }),
    );
  });

  it('should throw ConflictException if lead source code already exists', async () => {
    mockPrisma.leadSource.findUnique.mockResolvedValue(mockSource);

    await expect(
      service.create({ name: 'Website Duplicate', code: 'WEBSITE' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should toggle active status of lead source', async () => {
    mockPrisma.leadSource.findUnique.mockResolvedValue(mockSource);
    mockPrisma.leadSource.update.mockResolvedValue({ ...mockSource, isActive: false });

    const result = await service.update('src-1', { isActive: false });
    expect(result.isActive).toBe(false);
  });
});
