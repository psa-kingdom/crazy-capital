import { Injectable, Logger } from '@nestjs/common';
import { AccountAggregatorConsentDto, InitiateAaConsentInput } from '@cc/types';
import * as crypto from 'crypto';

@Injectable()
export class AccountAggregatorProvider {
  private readonly logger = new Logger(AccountAggregatorProvider.name);

  private readonly fipMap: Record<string, string> = {
    HDFC: 'HDFC Bank Limited',
    ICICI: 'ICICI Bank Limited',
    SBI: 'State Bank of India',
    AXIS: 'Axis Bank Limited',
    KOTAK: 'Kotak Mahindra Bank',
  };

  /**
   * Initiate RBI Account Aggregator Consent Flow
   */
  async initiateConsent(input: InitiateAaConsentInput): Promise<AccountAggregatorConsentDto> {
    const consentId = `AA_CONSENT_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const consentHandle = `handle_${crypto.randomUUID()}`;
    const fipName = this.fipMap[input.fipId.toUpperCase()] || `${input.fipId} Financial Institution`;

    const fromDate = new Date(Date.now() - (input.statementMonthsCount || 6) * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    this.logger.log(`Initiated AA Consent: ${consentId} for customer: ${input.customerId} (FIP: ${fipName})`);

    return {
      consentId,
      consentHandle,
      status: 'PENDING',
      customerId: input.customerId,
      fipId: input.fipId,
      fipName,
      dataRange: {
        from: fromDate,
        to: toDate,
      },
      consentExpiry: expiry,
      redirectUrl: `https://aa.crazycapital.in/consent/redirect?handle=${consentHandle}&fip=${input.fipId}`,
    };
  }

  /**
   * Fetch aggregated financial data once consent is approved
   */
  async fetchAggregatedData(consentId: string) {
    return {
      consentId,
      status: 'ACTIVE',
      accountSummary: {
        accountType: 'CURRENT',
        currency: 'INR',
        availableBalance: 485200.0,
        averageMonthlyCredits: 1250000.0,
        averageMonthlyDebits: 1120000.0,
        highValueTransactionsCount: 14,
        bouncedChequesCount: 0,
      },
      analytics: {
        creditHealthScore: 820,
        debtServiceCoverageRatio: 2.85,
        turnoverConsistency: 'HIGH',
      },
    };
  }
}
