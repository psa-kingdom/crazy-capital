import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { R2StorageService } from './storage/r2-storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '@cc/types';

describe('DocumentsService (Vertical Slice 1.7 - Secure Document Vault)', () => {
  let service: DocumentsService;
  let prisma: any;
  let storage: any;

  const mockAdminUser = {
    id: 'user-admin-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    roles: [UserRole.ADMIN],
    firstName: 'Admin',
    lastName: 'User',
  };

  const mockCustomerUser = {
    id: 'user-cust-1',
    organizationId: 'org-1',
    customerId: 'cust-1',
    roles: [UserRole.CUSTOMER],
    firstName: 'Ramesh',
    lastName: 'Kumar',
  };

  const mockEmployeeUser = {
    id: 'user-emp-1',
    organizationId: 'org-1',
    branchId: 'branch-1',
    roles: [UserRole.EMPLOYEE],
    firstName: 'Suresh',
    lastName: 'Patel',
  };

  const mockOtherBranchEmployee = {
    id: 'user-emp-2',
    organizationId: 'org-1',
    branchId: 'branch-2',
    roles: [UserRole.EMPLOYEE],
    firstName: 'Pooja',
    lastName: 'Sharma',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      customer: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      application: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      documentType: {
        findUnique: jest.fn(),
      },
      document: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      documentVerification: {
        create: jest.fn(),
      },
      applicationActivity: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(mockPrismaService);
      }),
    };

    const mockStorageService = {
      getPresignedUploadUrl: jest.fn().mockResolvedValue({
        url: 'https://r2.cloudflarestorage.com/vault/presigned-put-url',
        storageKey: 'org_org-1/cust_cust-1/pan/file_123.pdf',
        expiresInSeconds: 900,
      }),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue(
        'https://r2.cloudflarestorage.com/vault/presigned-get-url',
      ),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: R2StorageService, useValue: mockStorageService },
        {
          provide: NotificationsService,
          useValue: {
            send: jest.fn().mockResolvedValue({ id: 'log-1', status: 'SENT' }),
            dispatchMultiChannel: jest.fn().mockResolvedValue([{ id: 'log-1', status: 'SENT' }]),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    prisma = module.get<PrismaService>(PrismaService);
    storage = module.get<R2StorageService>(R2StorageService);
  });

  describe('1. Request Presigned Upload (Customer Flow)', () => {
    it('should create PENDING document and return presigned S3/R2 upload URL', async () => {
      prisma.customer.findFirst.mockResolvedValue({
        id: 'cust-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
      });

      prisma.documentType.findUnique.mockResolvedValue({
        id: 'dtype-pan',
        code: 'PAN',
        name: 'PAN Card',
      });

      prisma.document.create.mockResolvedValue({
        id: 'doc-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        customerId: 'cust-1',
        documentTypeId: 'dtype-pan',
        fileName: 'pan.pdf',
        filePath: 'org_org-1/cust_cust-1/pan/uuid_pan.pdf',
        fileSize: 102400,
        mimeType: 'application/pdf',
        status: 'PENDING',
      });

      const result = await service.requestPresignedUpload(
        {
          customerId: 'cust-1',
          documentTypeId: 'dtype-pan',
          fileName: 'pan.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
        },
        mockCustomerUser,
      );

      expect(result).toBeDefined();
      expect(result.uploadUrl).toContain('https://r2.cloudflarestorage.com');
      expect(result.documentId).toBe('doc-1');
      expect(result.expiresInSeconds).toBe(900);
      expect(prisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            organizationId: 'org-1',
          }),
        }),
      );
    });

    it('should reject upload request if customer does not exist in tenant', async () => {
      prisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.requestPresignedUpload(
          {
            customerId: 'cust-invalid',
            documentTypeId: 'dtype-pan',
            fileName: 'pan.pdf',
            fileSize: 102400,
            mimeType: 'application/pdf',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject if customer tries to upload for another customer profile', async () => {
      prisma.customer.findFirst.mockResolvedValue({
        id: 'cust-2',
        organizationId: 'org-1',
      });

      await expect(
        service.requestPresignedUpload(
          {
            customerId: 'cust-2',
            documentTypeId: 'dtype-pan',
            fileName: 'pan.pdf',
            fileSize: 102400,
            mimeType: 'application/pdf',
          },
          mockCustomerUser, // has customerId: 'cust-1'
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('2. Confirm Upload Flow', () => {
    it('should transition status from PENDING to UPLOADED and record timeline activity', async () => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc-1',
        organizationId: 'org-1',
        customerId: 'cust-1',
        applicationId: 'app-1',
        status: 'PENDING',
        filePath: 'org_org-1/cust_cust-1/app_app-1/pan/file.pdf',
        fileSize: 102400,
        fileName: 'pan.pdf',
        mimeType: 'application/pdf',
        documentType: { name: 'PAN Card' },
      });

      prisma.document.update.mockResolvedValue({
        id: 'doc-1',
        status: 'UPLOADED',
        applicationId: 'app-1',
        documentType: { name: 'PAN Card' },
      });

      const result = await service.confirmUpload(
        'doc-1',
        { fileSize: 102400 },
        mockCustomerUser,
      );

      expect(result.status).toBe('UPLOADED');
      expect(prisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-1' },
          data: expect.objectContaining({ status: 'UPLOADED' }),
        }),
      );
      expect(prisma.applicationActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationId: 'app-1',
            activityType: 'DOCUMENT_UPLOADED',
          }),
        }),
      );
    });

    it('should reject confirming an already VERIFIED document', async () => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc-1',
        organizationId: 'org-1',
        customerId: 'cust-1',
        status: 'VERIFIED',
      });

      await expect(
        service.confirmUpload('doc-1', { fileSize: 102400 }, mockCustomerUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Preview and Download Signed URL Flow', () => {
    it('should return temporary signed download URL', async () => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        customerId: 'cust-1',
        filePath: 'org_org-1/cust_cust-1/pan/file.pdf',
        fileName: 'pan.pdf',
        mimeType: 'application/pdf',
        status: 'UPLOADED',
      });

      const result = await service.getPreviewUrl('doc-1', mockEmployeeUser);

      expect(result).toBeDefined();
      expect(result.downloadUrl).toContain('https://r2.cloudflarestorage.com');
      expect(result.fileName).toBe('pan.pdf');
      expect(result.expiresInSeconds).toBe(900);
    });

    it('should forbid employee from accessing documents of another branch', async () => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc-1',
        organizationId: 'org-1',
        branchId: 'branch-1', // Document belongs to branch-1
        customerId: 'cust-1',
        filePath: 'org_org-1/cust_cust-1/pan/file.pdf',
      });

      await expect(
        service.getPreviewUrl('doc-1', mockOtherBranchEmployee), // User belongs to branch-2
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('4. Operations Verification Flow', () => {
    it('should verify document and create verification audit record', async () => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        customerId: 'cust-1',
        applicationId: 'app-1',
        status: 'UPLOADED',
        documentType: { name: 'PAN Card' },
      });

      prisma.document.update.mockResolvedValue({
        id: 'doc-1',
        status: 'VERIFIED',
        applicationId: 'app-1',
        documentType: { name: 'PAN Card' },
      });

      const result = await service.verifyDocument(
        'doc-1',
        { remarks: 'PAN format verified with NSDL database' },
        mockEmployeeUser,
      );

      expect(result.status).toBe('VERIFIED');
      expect(prisma.documentVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentId: 'doc-1',
            verifiedById: 'user-emp-1',
            status: 'VERIFIED',
            remarks: 'PAN format verified with NSDL database',
          }),
        }),
      );
      expect(prisma.applicationActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: 'DOCUMENT_VERIFIED',
          }),
        }),
      );
    });

    it('should reject document with structured rejection reason', async () => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        customerId: 'cust-1',
        applicationId: 'app-1',
        status: 'UPLOADED',
        documentType: { name: 'PAN Card' },
      });

      prisma.document.update.mockResolvedValue({
        id: 'doc-1',
        status: 'REJECTED',
        applicationId: 'app-1',
        documentType: { name: 'PAN Card' },
      });

      const result = await service.rejectDocument(
        'doc-1',
        { rejectionReason: 'Illegible image. Signature is cut off.' },
        mockEmployeeUser,
      );

      expect(result.status).toBe('REJECTED');
      expect(prisma.documentVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentId: 'doc-1',
            verifiedById: 'user-emp-1',
            status: 'REJECTED',
            remarks: 'Illegible image. Signature is cut off.',
          }),
        }),
      );
      expect(prisma.applicationActivity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: 'DOCUMENT_REJECTED',
          }),
        }),
      );
    });
  });

  describe('5. Multi-Tenant Scoping and Deletion', () => {
    it('should scope document queries strictly by organizationId', async () => {
      prisma.document.findMany.mockResolvedValue([]);
      prisma.document.count.mockResolvedValue(0);

      await service.findAll({}, mockAdminUser);

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-1',
            deletedAt: null,
          }),
        }),
      );
    });

    it('should soft delete document and invoke object storage deletion', async () => {
      prisma.document.findFirst.mockResolvedValue({
        id: 'doc-1',
        organizationId: 'org-1',
        branchId: 'branch-1',
        customerId: 'cust-1',
        filePath: 'org_org-1/cust_cust-1/pan/file.pdf',
        fileName: 'pan.pdf',
      });

      prisma.document.update.mockResolvedValue({
        id: 'doc-1',
        deletedAt: new Date(),
      });

      const result = await service.delete('doc-1', mockAdminUser);

      expect(result.success).toBe(true);
      expect(prisma.document.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(storage.deleteObject).toHaveBeenCalledWith('org_org-1/cust_cust-1/pan/file.pdf');
    });
  });
});
