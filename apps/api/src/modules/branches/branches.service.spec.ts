import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole } from '@cc/types';

describe('BranchesService (Slice 2.4 — Branch Hierarchy & Regional Operations Hubs)', () => {
  let service: BranchesService;
  let mockPrisma: any;

  const mockOrgId = 'org-100';
  const mockRegionId = 'reg-north-1';
  const mockBranchId = 'branch-noida-1';

  const mockUserAdmin = {
    id: 'user-admin-1',
    organizationId: mockOrgId,
    roles: [UserRole.ADMIN],
  };

  const mockUserRegionalMgr = {
    id: 'user-reg-mgr-1',
    organizationId: mockOrgId,
    roles: ['REGIONAL_MANAGER'],
  };

  const mockUserBranchMgr = {
    id: 'user-branch-mgr-1',
    organizationId: mockOrgId,
    branchId: mockBranchId,
    roles: [UserRole.BRANCH_MANAGER],
  };

  beforeEach(async () => {
    mockPrisma = {
      region: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: mockRegionId,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }),
        ),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: mockRegionId,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }),
        ),
      },
      branch: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: mockBranchId,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }),
        ),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: mockBranchId,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          }),
        ),
      },
      branchTarget: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        upsert: jest.fn().mockImplementation(({ create, update }) =>
          Promise.resolve({
            id: 'target-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            branch: { name: 'Noida Branch', code: 'NOIDA_01' },
            region: { name: 'North Operations Hub', code: 'NORTH_HUB' },
            ...(create || update),
          }),
        ),
      },
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      application: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  describe('1. Regional Hub Hierarchy & Scoping', () => {
    it('should create a new Regional Hub with unique code (Admin only)', async () => {
      mockPrisma.region.findFirst.mockResolvedValueOnce(null); // No duplicate
      mockPrisma.user.findFirst.mockResolvedValueOnce({ id: 'user-reg-mgr-1' });

      const result = await service.createRegion(
        {
          name: 'North Operations Hub',
          code: 'NORTH_HUB',
          description: 'NCR, Punjab, Haryana & UP branches',
          regionalManagerId: 'user-reg-mgr-1',
        },
        mockUserAdmin,
      );

      expect(result.id).toBe(mockRegionId);
      expect(result.name).toBe('North Operations Hub');
      expect(result.code).toBe('NORTH_HUB');
      expect(mockPrisma.region.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if region code already exists in organization', async () => {
      mockPrisma.region.findFirst.mockResolvedValueOnce({ id: 'reg-existing', code: 'NORTH_HUB' });

      await expect(
        service.createRegion(
          { name: 'North Hub Duplicate', code: 'NORTH_HUB' },
          mockUserAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent non-admin from creating or updating regional hubs', async () => {
      await expect(
        service.createRegion(
          { name: 'Illegal Region', code: 'ILLEGAL' },
          mockUserBranchMgr,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent deleting a regional hub if active branches exist', async () => {
      mockPrisma.region.findUnique.mockResolvedValueOnce({
        id: mockRegionId,
        organizationId: mockOrgId,
        name: 'North Hub',
        branches: [{ id: 'b1' }, { id: 'b2' }],
      });

      await expect(service.deleteRegion(mockRegionId, mockUserAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('2. Branch Management & Role-Based Scoping', () => {
    it('should create an operating branch linked to a region and branch manager', async () => {
      mockPrisma.branch.findFirst.mockResolvedValueOnce(null); // No duplicate code
      mockPrisma.region.findFirst.mockResolvedValueOnce({ id: mockRegionId }); // Region valid
      mockPrisma.user.findFirst.mockResolvedValueOnce({ id: 'user-branch-mgr-1' }); // Manager valid

      const result = await service.createBranch(
        {
          name: 'Noida Sector 62 Branch',
          code: 'NOIDA_01',
          regionId: mockRegionId,
          branchManagerId: 'user-branch-mgr-1',
          branchType: 'METRO_BRANCH',
          city: 'Noida',
          state: 'Uttar Pradesh',
        },
        mockUserAdmin,
      );

      expect(result.id).toBe(mockBranchId);
      expect(result.name).toBe('Noida Sector 62 Branch');
      expect(result.code).toBe('NOIDA_01');
      expect(mockPrisma.branch.create).toHaveBeenCalled();
    });

    it('should strictly scope getBranches to assigned branch for Branch Manager', async () => {
      mockPrisma.branch.findMany.mockResolvedValueOnce([
        {
          id: mockBranchId,
          organizationId: mockOrgId,
          name: 'Noida Sector 62 Branch',
          code: 'NOIDA_01',
          branchType: 'METRO_BRANCH',
          status: 'ACTIVE',
          users: [{ id: 'u1' }],
          applications: [],
          targets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const branches = await service.getBranches(mockUserBranchMgr);

      expect(branches.length).toBe(1);
      expect(mockPrisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockBranchId,
            organizationId: mockOrgId,
          }),
        }),
      );
    });

    it('should allow Super Admin to query all branches across regions', async () => {
      mockPrisma.branch.findMany.mockResolvedValueOnce([
        {
          id: 'b1',
          organizationId: mockOrgId,
          name: 'Noida Branch',
          code: 'NOIDA_01',
          users: [],
          applications: [],
          targets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'b2',
          organizationId: mockOrgId,
          name: 'Mumbai Branch',
          code: 'MUMBAI_01',
          users: [],
          applications: [],
          targets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const branches = await service.getBranches(mockUserAdmin);

      expect(branches.length).toBe(2);
      expect(mockPrisma.branch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: mockOrgId,
          }),
        }),
      );
    });
  });

  describe('3. Target Management & Authoritative Calculations', () => {
    it('should set branch target and compute attainment percentage and variance', async () => {
      mockPrisma.branch.findUnique.mockResolvedValueOnce({
        id: mockBranchId,
        organizationId: mockOrgId,
        name: 'Noida Branch',
        regionId: mockRegionId,
      });

      // Mock realized revenue & completed applications
      mockPrisma.application.findMany.mockResolvedValueOnce([
        {
          id: 'app-1',
          invoices: [{ amount: 450000, status: 'PAID' }],
        },
      ]);
      mockPrisma.application.count.mockResolvedValueOnce(35);

      const target = await service.setBranchTarget(
        {
          branchId: mockBranchId,
          targetPeriod: '2026-08',
          periodType: 'MONTHLY',
          revenueTarget: 500000,
          caseTarget: 40,
        },
        mockUserAdmin,
      );

      expect(target.revenueTarget).toBe(500000);
      expect(target.caseTarget).toBe(40);
      expect(target.achievedRevenue).toBe(450000);
      expect(target.achievedCases).toBe(35);
      expect(target.revenueAttainmentPercent).toBe(90); // 450,000 / 500,000 * 100
      expect(target.caseAttainmentPercent).toBe(87.5); // 35 / 40 * 100
      expect(target.varianceRevenue).toBe(-50000);
      expect(target.varianceCases).toBe(-5);
    });
  });

  describe('4. Regional Rollups & Performance Matrix', () => {
    it('should aggregate branch metrics up to regional hubs and organization totals', async () => {
      // Mock regions
      mockPrisma.region.findMany.mockResolvedValueOnce([
        {
          id: mockRegionId,
          organizationId: mockOrgId,
          name: 'North Operations Hub',
          code: 'NORTH_HUB',
          status: 'ACTIVE',
          regionalManager: { firstName: 'Suresh', lastName: 'Kumar', email: 'suresh@crazycapital.in' },
          branches: [
            {
              id: mockBranchId,
              name: 'Noida Branch',
              code: 'NOIDA_01',
              users: [{ id: 'u1' }],
              applications: [{ status: 'IN_PROGRESS' }],
              targets: [
                {
                  revenueTarget: 500000,
                  achievedRevenue: 550000,
                  caseTarget: 30,
                  achievedCases: 32,
                },
              ],
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Mock branch targets
      mockPrisma.branchTarget.findMany.mockResolvedValueOnce([
        {
          id: 't-1',
          organizationId: mockOrgId,
          branchId: mockBranchId,
          regionId: mockRegionId,
          targetPeriod: '2026-08',
          periodType: 'MONTHLY',
          revenueTarget: 500000,
          achievedRevenue: 550000,
          caseTarget: 30,
          achievedCases: 32,
          status: 'ACHIEVED',
          branch: { name: 'Noida Branch', code: 'NOIDA_01' },
          region: { name: 'North Operations Hub', code: 'NORTH_HUB' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Mock branches
      mockPrisma.branch.findMany.mockResolvedValueOnce([
        {
          id: mockBranchId,
          organizationId: mockOrgId,
          name: 'Noida Branch',
          code: 'NOIDA_01',
          branchType: 'METRO_BRANCH',
          status: 'ACTIVE',
          users: [{ id: 'u1' }],
          applications: [{ status: 'IN_PROGRESS' }],
          targets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const matrix = await service.getPerformanceMatrix(mockUserAdmin, '2026-08');

      expect(matrix.targetPeriod).toBe('2026-08');
      expect(matrix.organizationSummary.totalBranches).toBe(1);
      expect(matrix.organizationSummary.totalRegions).toBe(1);
      expect(matrix.organizationSummary.totalRevenueTarget).toBe(500000);
      expect(matrix.organizationSummary.totalAchievedRevenue).toBe(550000);
      expect(matrix.organizationSummary.revenueAttainmentPercent).toBe(110);
      expect(matrix.organizationSummary.achievedCount).toBe(1);
      expect(matrix.regionalRollups.length).toBe(1);
      expect(matrix.regionalRollups[0].regionName).toBe('North Operations Hub');
      expect(matrix.regionalRollups[0].revenueAttainmentPercent).toBe(110);
    });
  });
});
