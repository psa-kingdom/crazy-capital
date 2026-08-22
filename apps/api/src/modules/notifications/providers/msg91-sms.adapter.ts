import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationProvider } from '@cc/types';
import {
  NotificationChannelProvider,
  NotificationProviderPayload,
  NotificationProviderResult,
} from './provider.interface';

@Injectable()
export class Msg91SmsAdapter implements NotificationChannelProvider {
  private readonly logger = new Logger(Msg91SmsAdapter.name);
  readonly channel: NotificationChannel = 'SMS';
  readonly providerName: NotificationProvider = 'MSG91';

  private readonly authKey: string | null;
  private readonly senderId: string;
  private readonly dltTemplateId: string | null;

  constructor(private readonly configService: ConfigService) {
    this.authKey = this.configService.get<string>('MSG91_AUTH_KEY') || null;
    this.senderId = this.configService.get<string>('MSG91_SENDER_ID') || 'CRZYCP';
    this.dltTemplateId = this.configService.get<string>('MSG91_DLT_TE_ID') || null;

    if (!this.authKey) {
      this.logger.warn(
        'MSG91_AUTH_KEY not configured. Operating in graceful Mock SMS dispatch mode.',
      );
    }
  }

  async send(payload: NotificationProviderPayload): Promise<NotificationProviderResult> {
    const { recipient, body, templateId = this.dltTemplateId, templateData = {} } = payload;

    // Sanitize phone number (strip whitespace, ensure country code)
    const cleanPhone = recipient.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        provider: this.providerName,
        errorMessage: `Invalid mobile recipient number: '${recipient}'`,
      };
    }

    // Mock Mode Fallback
    if (!this.authKey) {
      const mockReqId = `req_mock_msg91_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      // Sanitize OTP/sensitive content from logs
      const sanitizedBody = body.replace(/\b\d{4,6}\b/g, '******');
      this.logger.log(
        `[MOCK MSG91] SMS dispatched to ${cleanPhone} | Body: "${sanitizedBody}" | ProviderId: ${mockReqId}`,
      );
      return {
        success: true,
        provider: 'MOCK',
        providerMessageId: mockReqId,
        rawResponse: {
          mock: true,
          provider: 'MSG91',
          mobile: cleanPhone,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Live MSG91 Flow API integration
    try {
      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: this.authKey,
        },
        body: JSON.stringify({
          template_id: templateId,
          sender: this.senderId,
          short_url: '0',
          recipients: [
            {
              mobiles: cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone,
              ...templateData,
              message: body,
            },
          ],
        }),
      });

      const data: any = await response.json();

      if (!response.ok || data?.type === 'error') {
        const errorMsg = data?.message || response.statusText;
        this.logger.error(`MSG91 API error (${response.status}): ${errorMsg}`);
        return {
          success: false,
          provider: this.providerName,
          errorMessage: errorMsg,
          rawResponse: data,
        };
      }

      const requestId = data?.request_id || data?.message || `msg91_${Date.now()}`;
      this.logger.log(`MSG91 SMS sent to ${cleanPhone} (Request ID: ${requestId})`);

      return {
        success: true,
        provider: this.providerName,
        providerMessageId: requestId,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`Network error sending SMS via MSG91: ${err.message}`);
      return {
        success: false,
        provider: this.providerName,
        errorMessage: err.message,
      };
    }
  }
}
