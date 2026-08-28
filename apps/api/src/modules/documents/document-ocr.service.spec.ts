import { Test, TestingModule } from '@nestjs/testing';
import { DocumentOcrService } from './document-ocr.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IntelligentOcrProvider } from './ocr/intelligent-ocr.provider';
import { DocumentOcrMatchStatus, DocumentOcrSuggestedAction } from '@cc/types';

describe('DocumentOcrService', () => {
  let service: DocumentOcrService;
  let prisma: any;
  let ocrProvider: IntelligentOcrProvider;

  beforeEach(async () => {
    prisma = {
      document: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      documentOcrRecord: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      documentVerification: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentOcrService,
        IntelligentOcrProvider,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DocumentOcrService>(DocumentOcrService);
    ocrProvider = module.get<IntelligentOcrProvider>(IntelligentOcrProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processDocumentOcr', () => {
    it('should extract PAN card fields and return FULL_MATCH when applicant name matches', async () => {
      const mockDoc = {
        id: 'doc-pan-1',
        organizationId: 'org-1',
        fileName: 'PAN_ABCDE1234F.jpg',
        mimeType: 'image/jpeg',
        customer: {
          firstName: 'Ankit',
          lastName: 'Sharma',
          pan: 'ABCDE1234F',
        },
        documentType: {
          code: 'PAN',
        },
      };

      prisma.document.findUnique.mockResolvedValue(mockDoc);
      prisma.documentOcrRecord.upsert.mockImplementation(({ create }: any) => ({
        id: 'ocr-rec-1',
        ...create,
        confidenceScore: 96.0,
        clarityScore: 92.5,
        processedAt: new Date(),
      }));

      const result = await service.processDocumentOcr('doc-pan-1');

      expect(result.extractedData.panNumber).toBe('ABCDE1234F');
      expect(result.extractedData.name).toBe('Ankit Sharma');
      expect(result.matchStatus).toBe(DocumentOcrMatchStatus.FULL_MATCH);
      expect(result.suggestedAction).toBe(DocumentOcrSuggestedAction.AUTO_APPROVE);
      expect(result.discrepancies.length).toBe(0);
    });

    it('should flag discrepancy when document name differs from customer profile', async () => {
      const mockDoc = {
        id: 'doc-pan-2',
        organizationId: 'org-1',
        fileName: 'PAN_ABCDE1234F.jpg',
        mimeType: 'image/jpeg',
        customer: {
          firstName: 'Vikram',
          lastName: 'Singhania',
          pan: 'ABCDE1234F',
        },
        documentType: {
          code: 'PAN',
        },
      };

      prisma.document.findUnique.mockResolvedValue(mockDoc);
      prisma.documentOcrRecord.upsert.mockImplementation(({ create }: any) => ({
        id: 'ocr-rec-2',
        ...create,
        confidenceScore: 96.0,
        clarityScore: 92.5,
        processedAt: new Date(),
      }));

      const result = await service.processDocumentOcr('doc-pan-2');

      expect(result.discrepancies.length).toBeGreaterThan(0);
      expect(result.discrepancies[0].field).toBe('Legal / Applicant Name');
      expect(result.matchStatus).toBe(DocumentOcrMatchStatus.MISMATCH);
    });
  });

  describe('autoVerify', () => {
    it('should update document status to VERIFIED and log verification entry on approval', async () => {
      const mockOcrResult = {
        id: 'ocr-1',
        organizationId: 'org-1',
        documentId: 'doc-1',
        documentType: 'PAN',
        extractedData: {},
        confidenceScore: 95,
        tamperCheckPassed: true,
        matchStatus: DocumentOcrMatchStatus.FULL_MATCH,
        discrepancies: [],
        suggestedAction: DocumentOcrSuggestedAction.AUTO_APPROVE,
        ocrProvider: 'INTELLIGENT_OCR_SANDBOX',
        processedAt: new Date(),
      };

      jest.spyOn(service, 'getOcrResult').mockResolvedValue(mockOcrResult);
      prisma.document.update.mockResolvedValue({ id: 'doc-1', status: 'VERIFIED' });
      prisma.documentVerification.create.mockResolvedValue({ id: 'ver-1', status: 'VERIFIED' });

      const res = await service.autoVerify('doc-1', undefined, undefined, { id: 'admin-1' });

      expect(res.document.status).toBe('VERIFIED');
      expect(prisma.documentVerification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          documentId: 'doc-1',
          status: 'VERIFIED',
          verifiedById: 'admin-1',
        }),
      });
    });
  });
});
