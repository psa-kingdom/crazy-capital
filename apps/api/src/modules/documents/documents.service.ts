import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { R2StorageService } from './storage/r2-storage.service';
import { RequestPresignedUploadDto } from './dto/request-presigned-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { RejectDocumentDto } from './dto/reject-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';
import { UserRole } from '@cc/types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: R2StorageService,
  ) {}

  /**
   * Step 1 of Upload: Validate constraints, create PENDING Document record, and issue presigned S3/R2 upload URL
   */
  async requestPresignedUpload(dto: RequestPresignedUploadDto, user: any) {
    const organizationId = user.organizationId;

    // Validate customer exists within tenant
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        organizationId,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer '${dto.customerId}' not found in your organization`);
    }

    // Customer role check: customer can only upload for their own account
    if (user.roles?.includes(UserRole.CUSTOMER) && user.customerId && user.customerId !== dto.customerId) {
      throw new ForbiddenException('You can only upload documents for your own customer profile');
    }

    // Validate application if provided
    let branchId = customer.branchId;
    if (dto.applicationId) {
      const application = await this.prisma.application.findFirst({
        where: {
          id: dto.applicationId,
          organizationId,
          customerId: dto.customerId,
        },
      });

      if (!application) {
        throw new NotFoundException(`Application '${dto.applicationId}' not found for customer '${dto.customerId}'`);
      }
      if (application.branchId) {
        branchId = application.branchId;
      }
    }

    // Validate document type exists
    const docType = await this.prisma.documentType.findUnique({
      where: { id: dto.documentTypeId },
    });

    if (!docType) {
      throw new NotFoundException(`DocumentType '${dto.documentTypeId}' not found`);
    }

    // Safe sanitized filename and unique storage key
    const sanitizedFileName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileId = uuidv4();
    const storageKey = `org_${organizationId}/cust_${dto.customerId}/${
      dto.applicationId ? `app_${dto.applicationId}/` : ''
    }${docType.code.toLowerCase()}/${uniqueFileId}_${sanitizedFileName}`;

    // Create Document record in PENDING state
    const document = await this.prisma.document.create({
      data: {
        organizationId,
        branchId,
        customerId: dto.customerId,
        applicationId: dto.applicationId || null,
        documentTypeId: dto.documentTypeId,
        fileName: dto.fileName,
        filePath: storageKey,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        status: 'PENDING',
        uploadedById: user.id || null,
      },
      include: {
        documentType: true,
      },
    });

    // Request signed upload URL from storage provider (valid 15 mins)
    const presignedResult = await this.storageService.getPresignedUploadUrl(
      storageKey,
      dto.mimeType,
      900,
    );

    return {
      uploadUrl: presignedResult.url,
      documentId: document.id,
      storageKey: document.filePath,
      expiresInSeconds: presignedResult.expiresInSeconds,
      document,
    };
  }

  /**
   * Step 2 of Upload: Client confirms binary upload to storage has finished
   */
  async confirmUpload(id: string, dto: ConfirmUploadDto, user: any) {
    const document = await this.findOne(id, user);

    if (document.status === 'VERIFIED') {
      throw new BadRequestException('Cannot re-upload or confirm an already VERIFIED document');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.update({
        where: { id },
        data: {
          status: 'UPLOADED',
          fileSize: dto.fileSize || document.fileSize,
          updatedAt: new Date(),
        },
        include: {
          documentType: true,
          customer: true,
        },
      });

      // If attached to application, log timeline activity
      if (doc.applicationId) {
        await tx.applicationActivity.create({
          data: {
            applicationId: doc.applicationId,
            activityType: 'DOCUMENT_UPLOADED',
            notes: `Document '${doc.documentType.name}' (${doc.fileName}) uploaded by ${user.firstName || 'User'}`,
            performedById: user.id || null,
          },
        });
      }

      return doc;
    });

    return updated;
  }

  /**
   * Get secure temporary presigned download/view URL
   */
  async getPreviewUrl(id: string, user: any) {
    const document = await this.findOne(id, user);

    const downloadUrl = await this.storageService.getPresignedDownloadUrl(
      document.filePath,
      900,
    );

    return {
      downloadUrl,
      fileName: document.fileName,
      mimeType: document.mimeType,
      expiresInSeconds: 900,
    };
  }

  /**
   * Operations/Admin: Verify document
   */
  async verifyDocument(id: string, dto: VerifyDocumentDto, user: any) {
    const document = await this.findOne(id, user);

    if (document.status !== 'UPLOADED' && document.status !== 'PENDING') {
      throw new BadRequestException(`Cannot verify document in '${document.status}' status. Document must be UPLOADED first.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.document.update({
        where: { id },
        data: {
          status: 'VERIFIED',
        },
        include: {
          documentType: true,
          verifications: {
            include: {
              verifiedBy: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
            orderBy: { verifiedAt: 'desc' },
          },
        },
      });

      await tx.documentVerification.create({
        data: {
          documentId: id,
          verifiedById: user.id,
          status: 'VERIFIED',
          remarks: dto.remarks || null,
        },
      });

      if (updated.applicationId) {
        await tx.applicationActivity.create({
          data: {
            applicationId: updated.applicationId,
            activityType: 'DOCUMENT_VERIFIED',
            notes: `Document '${updated.documentType.name}' was VERIFIED by ${user.firstName || 'Compliance Officer'}`,
            performedById: user.id,
          },
        });
      }

      return updated;
    });
  }

  /**
   * Operations/Admin: Reject document with structured rejection reason
   */
  async rejectDocument(id: string, dto: RejectDocumentDto, user: any) {
    const document = await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.document.update({
        where: { id },
        data: {
          status: 'REJECTED',
        },
        include: {
          documentType: true,
          verifications: {
            include: {
              verifiedBy: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
            orderBy: { verifiedAt: 'desc' },
          },
        },
      });

      await tx.documentVerification.create({
        data: {
          documentId: id,
          verifiedById: user.id,
          status: 'REJECTED',
          remarks: dto.rejectionReason,
        },
      });

      if (updated.applicationId) {
        await tx.applicationActivity.create({
          data: {
            applicationId: updated.applicationId,
            activityType: 'DOCUMENT_REJECTED',
            notes: `Document '${updated.documentType.name}' was REJECTED: ${dto.rejectionReason}`,
            performedById: user.id,
          },
        });
      }

      return updated;
    });
  }

  /**
   * Paginated document query with strict tenant and branch/customer isolation
   */
  async findAll(query: QueryDocumentsDto, user: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: user.organizationId,
      deletedAt: null,
    };

    if (query.customerId) where.customerId = query.customerId;
    if (query.applicationId) where.applicationId = query.applicationId;
    if (query.documentTypeId) where.documentTypeId = query.documentTypeId;
    if (query.status) where.status = query.status;

    // Customer scoping
    if (user.roles?.includes(UserRole.CUSTOMER) && user.customerId) {
      where.customerId = user.customerId;
    }

    // Branch scoping for employees
    const isEmployee = user.roles?.includes(UserRole.EMPLOYEE);
    const isBranchManager = user.roles?.includes(UserRole.BRANCH_MANAGER);
    if (isEmployee && !isBranchManager && user.branchId) {
      where.branchId = user.branchId;
    }

    if (query.search) {
      where.OR = [
        { fileName: { contains: query.search, mode: 'insensitive' } },
        { documentType: { name: { contains: query.search, mode: 'insensitive' } } },
        { customer: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { customer: { companyName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          documentType: true,
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, mobile: true, companyName: true },
          },
          verifications: {
            include: {
              verifiedBy: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
            orderBy: { verifiedAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.document.count({ where }),
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

  /**
   * Find single document by UUID
   */
  async findOne(id: string, user: any) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        documentType: true,
        customer: true,
        application: true,
        verifications: {
          include: {
            verifiedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { verifiedAt: 'desc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document '${id}' not found`);
    }

    // Customer scoping check
    if (user.roles?.includes(UserRole.CUSTOMER) && user.customerId && document.customerId !== user.customerId) {
      throw new ForbiddenException('You do not have permission to view documents belonging to other customers');
    }

    // Branch scoping check
    const isEmployee = user.roles?.includes(UserRole.EMPLOYEE);
    const isBranchManager = user.roles?.includes(UserRole.BRANCH_MANAGER);
    if (isEmployee && !isBranchManager && user.branchId && document.branchId && document.branchId !== user.branchId) {
      throw new ForbiddenException('You do not have permission to access documents outside your branch');
    }

    return document;
  }

  /**
   * Soft delete document and remove from object storage
   */
  async delete(id: string, user: any) {
    const document = await this.findOne(id, user);

    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Delete object asynchronously from R2 storage
    this.storageService.deleteObject(document.filePath).catch((err) => {
      this.logger.error(`Failed to delete object '${document.filePath}' from storage: ${err.message}`);
    });

    return { success: true, message: `Document '${document.fileName}' deleted successfully` };
  }
}
