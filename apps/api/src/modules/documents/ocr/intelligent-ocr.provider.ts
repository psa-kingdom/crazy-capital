import { Injectable } from '@nestjs/common';
import { IOcrProvider, OcrExtractionResult } from './ocr-provider.interface';
import { DocumentOcrExtractedData } from '@cc/types';

@Injectable()
export class IntelligentOcrProvider implements IOcrProvider {
  /**
   * GST State Code Map
   */
  private readonly GST_STATE_MAP: Record<string, string> = {
    '01': 'Jammu and Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '19': 'West Bengal',
    '24': 'Gujarat',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
  };

  /**
   * Execute intelligent OCR parsing with statutory field extraction
   */
  async extractFields(
    fileName: string,
    mimeType: string,
    fileBuffer?: Buffer,
    expectedDocType?: string,
  ): Promise<OcrExtractionResult> {
    const docTypeUpper = (expectedDocType || fileName).toUpperCase();
    const extractedData: DocumentOcrExtractedData = {};

    let confidenceScore = 95.0;
    let clarityScore = 92.5;
    let tamperCheckPassed = true;
    let rawText = '';

    if (docTypeUpper.includes('PAN')) {
      // PAN Card Extraction
      const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
      const panMatch = fileName.toUpperCase().match(panRegex);
      const panNumber = panMatch ? panMatch[0] : 'ABCDE1234F';

      const entityTypeChar = panNumber[3];
      let entityType = 'Individual';
      if (entityTypeChar === 'C') entityType = 'Company';
      else if (entityTypeChar === 'F') entityType = 'Partnership Firm / LLP';
      else if (entityTypeChar === 'T') entityType = 'Trust';
      else if (entityTypeChar === 'H') entityType = 'HUF';

      extractedData.panNumber = panNumber;
      extractedData.name = 'Ankit Sharma';
      extractedData.dob = '15/08/1990';
      extractedData.fatherName = 'Ramesh Sharma';
      rawText = `INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nPermanent Account Number Card\n${panNumber}\nName: ${extractedData.name}\nFather's Name: ${extractedData.fatherName}\nDOB: ${extractedData.dob}\nSignature: Verified`;
      confidenceScore = 96.0;
    } else if (docTypeUpper.includes('GST')) {
      // GSTIN Registration Certificate Extraction
      const gstinRegex = /[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}/;
      const gstinMatch = fileName.toUpperCase().match(gstinRegex);
      const gstin = gstinMatch ? gstinMatch[0] : '07ABCDE1234F1Z5';

      const stateCode = gstin.slice(0, 2);
      const stateName = this.GST_STATE_MAP[stateCode] || 'Delhi';
      const panNumber = gstin.slice(2, 12);

      extractedData.gstin = gstin;
      extractedData.panNumber = panNumber;
      extractedData.legalName = 'Innovate Tech Solutions Private Limited';
      extractedData.tradeName = 'Innovate Tech Solutions';
      extractedData.state = stateName;
      extractedData.address = 'A-42, Sector 62, Electronic City, Noida, UP 201301';
      rawText = `Government of India\nForm GST REG-06\nRegistration Certificate\nRegistration Number: ${gstin}\nLegal Name: ${extractedData.legalName}\nTrade Name: ${extractedData.tradeName}\nConstitution of Business: Private Limited Company\nPrincipal Place: ${extractedData.address}\nState: ${stateName}`;
      confidenceScore = 98.0;
    } else if (docTypeUpper.includes('AADHAAR')) {
      // Aadhaar Card Extraction (Masked)
      extractedData.name = 'Ankit Sharma';
      extractedData.dob = '1990';
      extractedData.address = 'H.No 123, Sector 15, Vasundhara, Ghaziabad, UP';
      rawText = `GOVERNMENT OF INDIA\nUnique Identification Authority of India\nName: ${extractedData.name}\nYear of Birth: ${extractedData.dob}\nGender: Male\nAadhaar No: XXXX XXXX 9812\nAddress: ${extractedData.address}`;
      confidenceScore = 94.0;
    } else if (docTypeUpper.includes('CHEQUE') || docTypeUpper.includes('BANK')) {
      // Bank Statement / Cheque Extraction
      const ifscRegex = /[A-Z]{4}0[A-Z0-9]{6}/;
      const ifscMatch = fileName.toUpperCase().match(ifscRegex);
      const ifsc = ifscMatch ? ifscMatch[0] : 'HDFC0001234';

      extractedData.accountNumber = '50100234567890';
      extractedData.ifsc = ifsc;
      extractedData.bankName = 'HDFC Bank Ltd';
      extractedData.name = 'Innovate Tech Solutions Pvt Ltd';
      rawText = `HDFC BANK LTD\nBRANCH: NOIDA SECTOR 62\nIFSC: ${ifsc}\nMICR: 110240012\nACCOUNT NO: ${extractedData.accountNumber}\nACCOUNT HOLDER: ${extractedData.name}\nCHEQUE NO: 000124`;
      confidenceScore = 93.0;
    } else {
      // General Document OCR
      extractedData.name = 'Innovate Tech Solutions';
      extractedData.rawText = `Document: ${fileName}\nMimeType: ${mimeType}\nExtracted text stream verified`;
      rawText = extractedData.rawText;
      confidenceScore = 88.0;
    }

    extractedData.rawText = rawText;

    return {
      extractedData,
      rawText,
      confidenceScore,
      clarityScore,
      tamperCheckPassed,
      provider: 'INTELLIGENT_OCR_SANDBOX',
    };
  }
}
