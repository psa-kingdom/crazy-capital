import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationProvider } from '@cc/types';
import {
  NotificationChannelProvider,
  NotificationProviderPayload,
  NotificationProviderResult,
} from './provider.interface';

@Injectable()
export class InteraktWhatsappAdapter implements NotificationChannelProvider {
  private readonly logger = new Logger(InteraktWhatsappAdapter.name);
  readonly channel: NotificationChannel = 'WHATSAPP';
  readonly providerName: NotificationProvider = 'INTERAKT';

  private readonly apiKey: string | null;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('INTERAKT_API_KEY') || null;
    this.baseUrl =
      this.configService.get<string>('INTERAKT_BASE_URL') ||
      'https://api.interakt.ai/v1/public/message/';

    if (!this.apiKey) {
      this.logger.warn(
        'INTERAKT_API_KEY not configured. Operating in graceful Mock WhatsApp dispatch mode.',
      );
    }
  }

  async send(payload: NotificationProviderPayload): Promise<NotificationProviderResult> {
    const { recipient, body, templateId = 'crazy_capital_generic_alert', templateData = {} } = payload;

    // Sanitize phone number (strip spaces/symbols)
    const cleanPhone = recipient.replace(/[^0-9+]/g, '');
    let countryCode = '+91';
    let phoneNumber = cleanPhone;

    if (cleanPhone.startsWith('+91')) {
      countryCode = '+91';
      phoneNumber = cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('+')) {
      countryCode = cleanPhone.substring(0, cleanPhone.length - 10);
      phoneNumber = cleanPhone.substring(cleanPhone.length - 10);
    } else if (cleanPhone.length === 10) {
      countryCode = '+91';
      phoneNumber = cleanPhone;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      return {
        success: false,
        provider: this.providerName,
        errorMessage: `Invalid WhatsApp mobile recipient: '${recipient}'`,
      };
    }

    // Mock Mode Fallback
    if (!this.apiKey) {
      const mockMsgId = `msg_mock_interakt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      this.logger.log(
        `[MOCK INTERAKT] WhatsApp message dispatched to ${countryCode}${phoneNumber} | Template: "${templateId}" | ProviderId: ${mockMsgId}`,
      );
      return {
        success: true,
        provider: 'MOCK',
        providerMessageId: mockMsgId,
        rawResponse: {
          mock: true,
          provider: 'INTERAKT',
          recipient: `${countryCode}${phoneNumber}`,
          template: templateId,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Live Interakt WhatsApp Cloud API integration
    try {
      const bodyValues = Object.values(templateData).map((val) => String(val));

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.apiKey}`,
        },
        body: JSON.stringify({
          countryCode,
          phoneNumber,
          type: 'Template',
          template: {
            name: templateId,
            languageCode: 'en',
            bodyValues: bodyValues.length > 0 ? bodyValues : [body.substring(0, 120)],
          },
        }),
      });

      const data: any = await response.json();

      if (!response.ok || data?.result === false) {
        const errorMsg = data?.message || response.statusText;
        this.logger.error(`Interakt API error (${response.status}): ${errorMsg}`);
        return {
          success: false,
          provider: this.providerName,
          errorMessage: errorMsg,
          rawResponse: data,
        };
      }

      const messageId = data?.id || data?.data?.id || `interakt_${Date.now()}`;
      this.logger.log(`Interakt WhatsApp message sent to ${countryCode}${phoneNumber} (ID: ${messageId})`);

      return {
        success: true,
        provider: this.providerName,
        providerMessageId: messageId,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`Network error sending WhatsApp via Interakt: ${err.message}`);
      return {
        success: false,
        provider: this.providerName,
        errorMessage: err.message,
      };
    }
  }
}
