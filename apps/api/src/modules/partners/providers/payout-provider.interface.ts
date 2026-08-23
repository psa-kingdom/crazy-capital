export interface InitiatePayoutParams {
  amount: number; // in INR
  currency?: string;
  mode?: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI' | 'MANUAL';
  referenceId: string; // Internal payout reference
  narration?: string;
  idempotencyKey: string;
  contact: {
    name: string;
    email: string;
    contact?: string;
    referenceId: string;
  };
  fundAccount: {
    accountType: 'bank_account' | 'vpa';
    bankAccount?: {
      name: string;
      ifsc: string;
      accountNumber: string;
    };
    vpa?: {
      address: string;
    };
  };
  notes?: Record<string, string>;
}

export interface PayoutResult {
  success: boolean;
  providerPayoutId: string;
  fundAccountId?: string;
  contactId?: string;
  status: 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED';
  utr?: string;
  failureReason?: string;
  rawResponse?: any;
}

export interface PayoutStatusResult {
  providerPayoutId: string;
  status: 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED';
  utr?: string;
  failureReason?: string;
  rawResponse?: any;
}

export interface AccountBalanceResult {
  balance: number;
  currency: string;
  accountNumber: string;
  isSandbox: boolean;
  status: string;
}

export interface PayoutProvider {
  isConfigured(): boolean;
  initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult>;
  getPayoutStatus(providerPayoutId: string): Promise<PayoutStatusResult>;
  getAccountBalance(): Promise<AccountBalanceResult>;
}
