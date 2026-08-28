import { DocumentOcrExtractedData } from '@cc/types';

export interface OcrExtractionResult {
  extractedData: DocumentOcrExtractedData;
  rawText: string;
  confidenceScore: number;
  clarityScore: number;
  tamperCheckPassed: boolean;
  provider: string;
}

export interface IOcrProvider {
  /**
   * Run OCR extraction on a document file/stream/path
   */
  extractFields(
    fileName: string,
    mimeType: string,
    fileBuffer?: Buffer,
    expectedDocType?: string,
  ): Promise<OcrExtractionResult>;
}
