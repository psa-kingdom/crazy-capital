import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const mockPrismaService = {
  auditLog: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  complianceExport: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  customer: {
    count: jest.fn(),
  },
  invoice: {
    count: jest.fn(),
  },
  application: {
    count: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((promises) => Promise.all(promises)),
};

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queryAuditLogs', () => {
    it('should query audit logs and map user names', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          organizationId: 'org-1',
          userId: 'user-1',
          action: 'USER_LOGIN',
          entityType: 'USER',
          entityId: 'user-1',
          createdAt: new Date(),
        },
      ]);
      mockPrismaService.auditLog.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1', firstName: 'Rajesh', lastName: 'Sharma', email: 'rajesh@example.com' },
      ]);

      const result = await service.queryAuditLogs('org-1', { page: 1, limit: 10 });
      expect(result.data.length).toBe(1);
      expect(result.data[0].userName).toBe('Rajesh Sharma');
      expect(result.total).toBe(1);
    });
  });

  describe('createComplianceExport', () => {
    it('should create an immutable compliance export record with SHA-256 checksum', async () => {
      mockPrismaService.auditLog.count.mockResolvedValue(42);
      mockPrismaService.complianceExport.create.mockResolvedValue({
        id: 'export-1',
        organizationId: 'org-1',
        requestedById: 'user-admin',
        exportType: 'AUDIT_TRAIL',
        format: 'JSON',
        status: 'COMPLETED',
        fileUrl: 'https://r2.crazycapital.in/exports/org-1/audit_trail.json',
        recordCount: 42,
        checksumSha256: 'mocked_sha256_hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const exportRes = await service.createComplianceExport('org-1', 'user-admin', {
        exportType: 'AUDIT_TRAIL',
        format: 'JSON',
      });

      expect(exportRes.id).toBe('export-1');
      expect(exportRes.exportType).toBe('AUDIT_TRAIL');
      expect(exportRes.checksumSha256).toBeDefined();
    });
  });

  describe('processDataErasureRequest', () => {
    it('should anonymize personal data and record compliance audit log', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'user-to-erase',
        organizationId: 'org-1',
        firstName: 'John',
        lastName: 'Doe',
      });

      const result = await service.processDataErasureRequest('org-1', 'user-to-erase', 'admin-1');
      expect(result.success).toBe(true);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
