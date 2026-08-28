import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IntelligentOcrProvider } from './ocr/intelligent-ocr.provider';
import {
  DocumentOcrMatchStatus,
  DocumentOcrSuggestedAction,
  DocumentOcrRecordDto,
  OcrDiscrepancy,
} from '@cc/types';

@Injectable()
export class DocumentOcrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ocrProvider: IntelligentOcrProvider,
  ) {}

  /**
   * Helper: Compute Levenshtein string similarity ratio (0.0 to 1.0)
   */
  private computeSimilarity(s1: string, s2: string): number {
    const clean1 = (s1 || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const clean2 = (s2 || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

    if (!clean1 || !clean2) return 0;
    if (clean1 === clean2) return 1.0;

    const track = Array(clean2.length + 1).fill(null).map(() =>
      Array(clean1.length + 1).fill(null));
    for (let i = 0; i <= clean1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= clean2.length; j += 1) {
      track[j][0] = j;
    }
    for (let j = 1; j <= clean2.length; j += 1) {
      for (let i = 1; i <= clean1.length; i += 1) {
        const indicator = clean1[i - 1] === clean2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    const distance = track[clean2.length][clean1.length];
    const maxLen = Math.max(clean1.length, clean2.length);
    return maxLen === 0 ? 1.0 : (maxLen - distance) / maxLen;
  }

  /**
   * Run OCR & Cross-Verification against Application and Customer data
   */
  async processDocumentOcr(
    documentId: string,
    currentUser?: { organizationId: string; id: string },
  ): Promise<DocumentOcrRecordDto> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        customer: true,
        application: {
          include: {
            service: true,
          },
        },
        documentType: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Run OCR Extraction
    const extraction = await this.ocrProvider.extractFields(
      document.fileName,
      document.mimeType,
      undefined,
      document.documentType?.code,
    );

    const discrepancies: OcrDiscrepancy[] = [];
    const customerFullName = `${document.customer.firstName} ${document.customer.lastName}`.trim();

    // 1. Check Name Match
    if (extraction.extractedData.name) {
      const nameRatio = this.computeSimilarity(customerFullName, extraction.extractedData.name);
      if (nameRatio < 0.85) {
        discrepancies.push({
          field: 'Legal / Applicant Name',
          applicationValue: customerFullName,
          ocrValue: extraction.extractedData.name,
          matchRatio: Math.round(nameRatio * 100) / 100,
        });
      }
    }

    // 2. Check PAN Match
    if (extraction.extractedData.panNumber && document.customer.pan) {
      const panRatio = this.computeSimilarity(document.customer.pan, extraction.extractedData.panNumber);
      if (panRatio < 1.0) {
        discrepancies.push({
          field: 'PAN Number',
          applicationValue: document.customer.pan,
          ocrValue: extraction.extractedData.panNumber,
          matchRatio: Math.round(panRatio * 100) / 100,
        });
      }
    }

    // 3. Check GSTIN Match
    if (extraction.extractedData.gstin && document.customer.gstin) {
      const gstRatio = this.computeSimilarity(document.customer.gstin, extraction.extractedData.gstin);
      if (gstRatio < 1.0) {
        discrepancies.push({
          field: 'GSTIN',
          applicationValue: document.customer.gstin,
          ocrValue: extraction.extractedData.gstin,
          matchRatio: Math.round(gstRatio * 100) / 100,
        });
      }
    }

    // Determine Match Status & Suggested Action
    let matchStatus: DocumentOcrMatchStatus = DocumentOcrMatchStatus.MANUAL_REVIEW_REQUIRED;
    let suggestedAction: DocumentOcrSuggestedAction = DocumentOcrSuggestedAction.MANUAL_REVIEW;

    if (!extraction.tamperCheckPassed) {
      matchStatus = DocumentOcrMatchStatus.MISMATCH;
      suggestedAction = DocumentOcrSuggestedAction.REJECT_TAMPERED;
    } else if (discrepancies.length === 0 && extraction.confidenceScore >= 90) {
      matchStatus = DocumentOcrMatchStatus.FULL_MATCH;
      suggestedAction = DocumentOcrSuggestedAction.AUTO_APPROVE;
    } else if (discrepancies.length === 1 && discrepancies[0].matchRatio >= 0.70) {
      matchStatus = DocumentOcrMatchStatus.PARTIAL_MATCH;
      suggestedAction = DocumentOcrSuggestedAction.MANUAL_REVIEW;
    } else if (discrepancies.some(d => d.matchRatio < 0.50)) {
      matchStatus = DocumentOcrMatchStatus.MISMATCH;
      suggestedAction = DocumentOcrSuggestedAction.REQUEST_REUPLOAD;
    }

    // Upsert OCR Record
    const record = await this.prisma.documentOcrRecord.upsert({
      where: { documentId },
      create: {
        organizationId: document.organizationId,
        documentId: document.id,
        documentType: document.documentType?.code || 'GENERAL',
        extractedDataJson: extraction.extractedData as any,
        confidenceScore: extraction.confidenceScore,
        clarityScore: extraction.clarityScore,
        tamperCheckPassed: extraction.tamperCheckPassed,
        matchStatus,
        discrepanciesJson: discrepancies as any,
        suggestedAction,
        ocrProvider: extraction.provider,
      },
      update: {
        extractedDataJson: extraction.extractedData as any,
        confidenceScore: extraction.confidenceScore,
        clarityScore: extraction.clarityScore,
        tamperCheckPassed: extraction.tamperCheckPassed,
        matchStatus,
        discrepanciesJson: discrepancies as any,
        suggestedAction,
        ocrProvider: extraction.provider,
        processedAt: new Date(),
      },
    });

    return {
      id: record.id,
      organizationId: record.organizationId,
      documentId: record.documentId,
      documentType: record.documentType,
      extractedData: (record.extractedDataJson as any) || {},
      confidenceScore: Number(record.confidenceScore),
      clarityScore: record.clarityScore ? Number(record.clarityScore) : null,
      tamperCheckPassed: record.tamperCheckPassed,
      matchStatus: record.matchStatus,
      discrepancies: (record.discrepanciesJson as any) || [],
      suggestedAction: record.suggestedAction,
      ocrProvider: record.ocrProvider,
      processedAt: record.processedAt,
    };
  }

  /**
   * Get OCR Result for a Document
   */
  async getOcrResult(documentId: string): Promise<DocumentOcrRecordDto> {
    const record = await this.prisma.documentOcrRecord.findUnique({
      where: { documentId },
    });

    if (!record) {
      // Process on-the-fly
      return this.processDocumentOcr(documentId);
    }

    return {
      id: record.id,
      organizationId: record.organizationId,
      documentId: record.documentId,
      documentType: record.documentType,
      extractedData: (record.extractedDataJson as any) || {},
      confidenceScore: Number(record.confidenceScore),
      clarityScore: record.clarityScore ? Number(record.clarityScore) : null,
      tamperCheckPassed: record.tamperCheckPassed,
      matchStatus: record.matchStatus,
      discrepancies: (record.discrepanciesJson as any) || [],
      suggestedAction: record.suggestedAction,
      ocrProvider: record.ocrProvider,
      processedAt: record.processedAt,
    };
  }

  /**
   * Auto-Verify or Operator-Verify Document based on OCR
   */
  async autoVerify(
    documentId: string,
    remarks?: string,
    overrideDecision?: 'APPROVE' | 'REJECT',
    currentUser?: { id: string },
  ) {
    const ocr = await this.getOcrResult(documentId);

    const isApproval = overrideDecision
      ? overrideDecision === 'APPROVE'
      : ocr.suggestedAction === DocumentOcrSuggestedAction.AUTO_APPROVE || ocr.matchStatus === DocumentOcrMatchStatus.FULL_MATCH;

    const newStatus = isApproval ? 'VERIFIED' : 'REJECTED';
    const auditRemarks = remarks || (isApproval ? `OCR Auto-Verified with ${ocr.confidenceScore}% confidence` : `OCR Discrepancy Flagged: ${ocr.suggestedAction}`);

    return this.prisma.$transaction(async (tx) => {
      const doc = await tx.document.update({
        where: { id: documentId },
        data: { status: newStatus },
      });

      const verification = await tx.documentVerification.create({
        data: {
          documentId,
          verifiedById: currentUser?.id || null,
          status: newStatus,
          remarks: auditRemarks,
        },
      });

      return {
        document: doc,
        verification,
        ocrResult: ocr,
      };
    });
  }
}
