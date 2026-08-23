import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  PayoutProvider,
  InitiatePayoutParams,
  PayoutResult,
  PayoutStatusResult,
  AccountBalanceResult,
} from './payout-provider.interface';

@Injectable()
export class RazorpayXPayoutProvider implements PayoutProvider {
  private readonly logger = new Logger(RazorpayXPayoutProvider.name);
  private readonly keyId: string | undefined;
  private readonly keySecret: string | undefined;
  private readonly accountNumber: string | undefined;
  private readonly isLiveConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.keyId =
      this.configService.get<string>('RAZORPAYX_KEY_ID') ||
      this.configService.get<string>('RAZORPAY_KEY_ID');
    this.keySecret =
      this.configService.get<string>('RAZORPAYX_KEY_SECRET') ||
      this.configService.get<string>('RAZORPAY_KEY_SECRET');
    this.accountNumber =
      this.configService.get<string>('RAZORPAYX_ACCOUNT_NUMBER') ||
      '2323230045678901'; // Default sandbox virtual account

    if (this.keyId && this.keySecret && !this.keyId.includes('mock')) {
      this.isLiveConfigured = true;
      this.logger.log('✅ RazorpayX Live/Test Payout Gateway Provider initialized');
    } else {
      this.isLiveConfigured = false;
      this.logger.warn(
        '⚠️ RazorpayX live credentials not provided — using Deterministic Mock Payout Engine (Slice 2.5)',
      );
    }
  }

  isConfigured(): boolean {
    return this.isLiveConfigured;
  }

  async initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult> {
    const currency = params.currency || 'INR';
    const amountInPaise = Math.round(params.amount * 100);
    const mode = params.mode || 'IMPS';

    if (this.isLiveConfigured && this.keyId && this.keySecret) {
      try {
        const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

        // 1. Create or get Contact on RazorpayX
        const contactRes = await fetch('https://api.razorpay.com/v1/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            name: params.contact.name,
            email: params.contact.email,
            contact: params.contact.contact || undefined,
            type: 'vendor',
            reference_id: params.contact.referenceId,
            notes: params.notes || {},
          }),
        });

        if (!contactRes.ok) {
          const errText = await contactRes.text();
          this.logger.error(`RazorpayX contact creation failed: ${errText}`);
          throw new Error(`RazorpayX contact creation failed: ${contactRes.statusText}`);
        }
        const contactData: any = await contactRes.json();
        const contactId = contactData.id;

        // 2. Create Fund Account on RazorpayX
        const fundAccountPayload: any = {
          contact_id: contactId,
          account_type: params.fundAccount.accountType,
        };

        if (params.fundAccount.accountType === 'bank_account' && params.fundAccount.bankAccount) {
          fundAccountPayload.bank_account = {
            name: params.fundAccount.bankAccount.name,
            ifsc: params.fundAccount.bankAccount.ifsc,
            account_number: params.fundAccount.bankAccount.accountNumber,
          };
        } else if (params.fundAccount.accountType === 'vpa' && params.fundAccount.vpa) {
          fundAccountPayload.vpa = {
            address: params.fundAccount.vpa.address,
          };
        }

        const faRes = await fetch('https://api.razorpay.com/v1/fund_accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify(fundAccountPayload),
        });

        if (!faRes.ok) {
          const errText = await faRes.text();
          this.logger.error(`RazorpayX fund account creation failed: ${errText}`);
          throw new Error(`RazorpayX fund account creation failed: ${faRes.statusText}`);
        }
        const faData: any = await faRes.json();
        const fundAccountId = faData.id;

        // 3. Initiate Payout on RazorpayX with Idempotency Key
        const payoutRes = await fetch('https://api.razorpay.com/v1/payouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authHeader}`,
            'X-Payout-Idempotency': params.idempotencyKey,
          },
          body: JSON.stringify({
            account_number: this.accountNumber,
            fund_account_id: fundAccountId,
            amount: amountInPaise,
            currency,
            mode,
            purpose: 'payout',
            queue_if_low_balance: true,
            reference_id: params.referenceId,
            narration: params.narration || 'Commission Payout',
            notes: params.notes || {},
          }),
        });

        if (!payoutRes.ok) {
          const errData: any = await payoutRes.json().catch(() => ({}));
          const errMsg = errData?.error?.description || payoutRes.statusText;
          this.logger.error(`RazorpayX Payout API rejected: ${JSON.stringify(errData)}`);
          return {
            success: false,
            providerPayoutId: `pout_err_${Date.now()}`,
            fundAccountId,
            contactId,
            status: 'FAILED',
            failureReason: errMsg,
            rawResponse: errData,
          };
        }

        const payoutData: any = await payoutRes.json();
        const status = this.mapProviderStatus(payoutData.status);

        return {
          success: status === 'PAID' || status === 'PROCESSING',
          providerPayoutId: payoutData.id,
          fundAccountId,
          contactId,
          status,
          utr: payoutData.utr || undefined,
          failureReason: payoutData.failure_reason || undefined,
          rawResponse: payoutData,
        };
      } catch (err: any) {
        this.logger.error(`RazorpayX API execution error: ${err.message}`);
        return {
          success: false,
          providerPayoutId: `pout_err_${Date.now()}`,
          status: 'FAILED',
          failureReason: err.message,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DETERMINISTIC MOCK PAYOUT ENGINE (For Safe Development & Real Chrome QA)
    // ─────────────────────────────────────────────────────────────────────────
    const mockPayoutId = `pout_mock_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const mockContactId = `cont_mock_${crypto.randomBytes(4).toString('hex')}`;
    const mockFundAccountId = `fa_mock_${crypto.randomBytes(4).toString('hex')}`;
    const mockUtr = `UTR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

    this.logger.log(
      `[MockRazorpayX] Executed automated payout '${mockPayoutId}' for ₹${params.amount} via ${mode} to '${params.contact.name}' (UTR: ${mockUtr})`,
    );

    return {
      success: true,
      providerPayoutId: mockPayoutId,
      fundAccountId: mockFundAccountId,
      contactId: mockContactId,
      status: 'PAID', // Mock IMPS settles immediately
      utr: mockUtr,
      rawResponse: {
        id: mockPayoutId,
        entity: 'payout',
        fund_account_id: mockFundAccountId,
        amount: amountInPaise,
        currency,
        status: 'processed',
        utr: mockUtr,
        mode,
        reference_id: params.referenceId,
      },
    };
  }

  async getPayoutStatus(providerPayoutId: string): Promise<PayoutStatusResult> {
    if (this.isLiveConfigured && this.keyId && this.keySecret && !providerPayoutId.startsWith('pout_mock_')) {
      try {
        const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const response = await fetch(`https://api.razorpay.com/v1/payouts/${providerPayoutId}`, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${authHeader}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch payout status: ${response.statusText}`);
        }

        const data: any = await response.json();
        return {
          providerPayoutId: data.id,
          status: this.mapProviderStatus(data.status),
          utr: data.utr || undefined,
          failureReason: data.failure_reason || undefined,
          rawResponse: data,
        };
      } catch (err: any) {
        this.logger.error(`Failed to query RazorpayX payout status: ${err.message}`);
        return {
          providerPayoutId,
          status: 'PROCESSING',
          failureReason: err.message,
        };
      }
    }

    // Mock Status Return
    return {
      providerPayoutId,
      status: 'PAID',
      utr: `UTR${Date.now()}`,
    };
  }

  async getAccountBalance(): Promise<AccountBalanceResult> {
    if (this.isLiveConfigured && this.keyId && this.keySecret && this.accountNumber) {
      try {
        const authHeader = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        const response = await fetch(
          `https://api.razorpay.com/v1/banking/accounts/${this.accountNumber}/balance`,
          {
            method: 'GET',
            headers: {
              Authorization: `Basic ${authHeader}`,
            },
          },
        );

        if (response.ok) {
          const data: any = await response.json();
          return {
            balance: Number(data.balance) / 100,
            currency: data.currency || 'INR',
            accountNumber: this.accountNumber,
            isSandbox: false,
            status: 'ACTIVE',
          };
        }
      } catch (err: any) {
        this.logger.warn(`RazorpayX live balance check failed: ${err.message}`);
      }
    }

    // Mock Operational Balance
    return {
      balance: 1450000.0, // ₹14.50 Lakhs available operational balance
      currency: 'INR',
      accountNumber: this.accountNumber || '2323230045678901',
      isSandbox: !this.isLiveConfigured,
      status: 'ACTIVE_HEALTHY',
    };
  }

  private mapProviderStatus(
    status: string,
  ): 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED' {
    switch (status?.toLowerCase()) {
      case 'processed':
        return 'PAID';
      case 'processing':
      case 'queued':
      case 'pending':
        return 'PROCESSING';
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return 'FAILED';
      case 'reversed':
        return 'REVERSED';
      default:
        return 'PROCESSING';
    }
  }
}
