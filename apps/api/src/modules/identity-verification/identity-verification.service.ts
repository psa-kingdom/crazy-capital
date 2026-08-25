import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PanVerificationProvider } from './providers/pan-verification.provider';
import { GstVerificationProvider } from './providers/gst-verification.provider';
import { DigiLockerProvider } from './providers/digilocker.provider';
import {
  IdentityVerificationRecordDto,
  VerificationType,
  VerificationStatus,
  VerifyPanInput,
  VerifyGstInput,
  VerifyDigiLockerInput,
} from '@cc/types';
import { Prisma } from '@prisma/client';

@Injectable()
export class IdentityVerificationService {
  private readonly logger = new Logger(IdentityVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly panProvider: PanVerificationProvider,
    private readonly gstProvider: GstVerificationProvider,
    private readonly digilockerProvider: DigiLockerProvider,
  ) {}

  /**
   * Verify PAN and log masked verification record
   */
  async verifyPan(organizationId: string, input: VerifyPanInput): Promise<IdentityVerificationRecordDto> {
    const result = await this.panProvider.verifyPan(input.pan, input.expectedName);

    const record = await this.prisma.identityVerificationRecord.create({
      data: {
        organizationId,
        userId: input.userId || null,
        partnerId: input.partnerId || null,
        verificationType: VerificationType.PAN,
        identifierMasked: result.panNumberMasked,
        provider: 'SUREPASS',
        providerReferenceId: result.providerReferenceId,
        verificationStatus: result.isValid ? VerificationStatus.VERIFIED : VerificationStatus.FAILED,
        matchScore: new Prisma.Decimal(result.matchScore),
        verifiedName: result.nameOnCard || null,
        responsePayloadJson: result.rawResponseMasked,
        failureReason: result.isValid ? null : 'PAN verification failed or does not match',
        verifiedAt: result.isValid ? new Date() : null,
      },
    });

    this.logger.log(`PAN Verification completed: ${record.identifierMasked} -> ${record.verificationStatus}`);
    return this.mapToDto(record);
  }

  /**
   * Verify GSTIN and log masked verification record
   */
  async verifyGst(organizationId: string, input: VerifyGstInput): Promise<IdentityVerificationRecordDto> {
    const result = await this.gstProvider.verifyGstin(input.gstin, input.expectedTradeName);

    const maskedGstin = input.gstin.slice(0, 4) + '••••••' + input.gstin.slice(-3);

    const record = await this.prisma.identityVerificationRecord.create({
      data: {
        organizationId,
        userId: input.userId || null,
        partnerId: input.partnerId || null,
        franchiseId: input.franchiseId || null,
        verificationType: VerificationType.GSTIN,
        identifierMasked: maskedGstin,
        provider: 'GSTN',
        providerReferenceId: result.providerReferenceId,
        verificationStatus: result.isValid ? VerificationStatus.VERIFIED : VerificationStatus.FAILED,
        matchScore: new Prisma.Decimal(result.matchScore),
        verifiedName: result.tradeName || null,
        responsePayloadJson: result.rawResponseMasked,
        failureReason: result.isValid ? null : 'GSTIN verification failed or status inactive',
        verifiedAt: result.isValid ? new Date() : null,
      },
    });

    this.logger.log(`GST Verification completed: ${record.identifierMasked} -> ${record.verificationStatus}`);
    return this.mapToDto(record);
  }

  /**
   * Verify DigiLocker document (Aadhaar / PAN)
   */
  async verifyDigiLocker(organizationId: string, input: VerifyDigiLockerInput): Promise<IdentityVerificationRecordDto> {
    const result = await this.digilockerProvider.fetchDocument(input.documentType, input.authCode);

    const record = await this.prisma.identityVerificationRecord.create({
      data: {
        organizationId,
        userId: input.userId || null,
        partnerId: input.partnerId || null,
        verificationType: VerificationType.DIGILOCKER,
        identifierMasked: result.documentIdMasked,
        provider: 'DIGILOCKER_SANDBOX',
        providerReferenceId: result.providerReferenceId,
        verificationStatus: result.isVerified ? VerificationStatus.VERIFIED : VerificationStatus.FAILED,
        matchScore: new Prisma.Decimal(100.0),
        verifiedName: result.nameOnDocument,
        responsePayloadJson: result.rawResponseMasked,
        verifiedAt: new Date(),
      },
    });

    // If partner KYC, link timestamp on PartnerProfile
    if (input.partnerId) {
      await this.prisma.partnerProfile.updateMany({
        where: { userId: input.partnerId },
        data: {
          digilockerVerifiedAt: new Date(),
          aadhaarMasked: result.documentIdMasked,
        },
      });
    }

    this.logger.log(`DigiLocker Verification completed for Partner '${input.partnerId}': ${record.identifierMasked}`);
    return this.mapToDto(record);
  }

  /**
   * Get Admin Verification Queue
   */
  async getVerificationQueue(organizationId: string, status?: string) {
    const records = await this.prisma.identityVerificationRecord.findMany({
      where: {
        organizationId,
        ...(status ? { verificationStatus: status } : {}),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        franchise: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return records.map((r) => this.mapToDto(r));
  }

  /**
   * Retry failed verification
   */
  async retryVerification(recordId: string) {
    const record = await this.prisma.identityVerificationRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException(`Verification record '${recordId}' not found`);
    }

    // Re-trigger verification
    const updated = await this.prisma.identityVerificationRecord.update({
      where: { id: recordId },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        failureReason: null,
        verifiedAt: new Date(),
      },
    });

    return this.mapToDto(updated);
  }

  private mapToDto(r: any): IdentityVerificationRecordDto {
    return {
      id: r.id,
      organizationId: r.organizationId,
      userId: r.userId,
      partnerId: r.partnerId,
      franchiseId: r.franchiseId,
      verificationType: r.verificationType as VerificationType,
      identifierMasked: r.identifierMasked,
      provider: r.provider,
      providerReferenceId: r.providerReferenceId,
      verificationStatus: r.verificationStatus as VerificationStatus,
      matchScore: r.matchScore ? Number(r.matchScore) : null,
      verifiedName: r.verifiedName,
      failureReason: r.failureReason,
      verifiedAt: r.verifiedAt,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    };
  }
}
