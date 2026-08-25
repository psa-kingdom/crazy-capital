export interface PanVerificationResult {
  isValid: boolean;
  panNumberMasked: string;
  nameOnCard?: string;
  panStatus: 'VALID' | 'INVALID' | 'DEACTIVATED';
  matchScore: number;
  providerReferenceId: string;
  rawResponseMasked: any;
}

export interface GstVerificationResult {
  isValid: boolean;
  gstin: string;
  tradeName?: string;
  legalName?: string;
  taxpayerType?: string;
  stateCode?: string;
  gstStatus: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED' | 'INVALID';
  matchScore: number;
  providerReferenceId: string;
  rawResponseMasked: any;
}

export interface DigiLockerAuthResult {
  consentUrl: string;
  state: string;
  expiresInSeconds: number;
}

export interface DigiLockerDocumentResult {
  documentType: string;
  documentIdMasked: string;
  issuer: string;
  nameOnDocument: string;
  dob?: string;
  isVerified: boolean;
  providerReferenceId: string;
  rawResponseMasked: any;
}
