import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, NotificationProvider } from '@cc/types';
import {
  NotificationChannelProvider,
  NotificationProviderPayload,
  NotificationProviderResult,
} from './provider.interface';

@Injectable()
export class ResendEmailAdapter implements NotificationChannelProvider {
  private readonly logger = new Logger(ResendEmailAdapter.name);
  readonly channel: NotificationChannel = 'EMAIL';
  readonly providerName: NotificationProvider = 'RESEND';

  private readonly apiKey: string | null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY') || null;
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ||
      'Crazy Capital <notifications@crazycapital.in>';

    if (!this.apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not configured. Operating in graceful Mock Email dispatch mode.',
      );
    }
  }

  async send(payload: NotificationProviderPayload): Promise<NotificationProviderResult> {
    const { recipient, subject = 'Crazy Capital Notification', body, html } = payload;

    // Validate email format
    if (!recipient || !recipient.includes('@')) {
      return {
        success: false,
        provider: this.providerName,
        errorMessage: `Invalid email recipient address: '${recipient}'`,
      };
    }

    // Mock Mode Fallback
    if (!this.apiKey) {
      const mockMessageId = `msg_mock_resend_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      this.logger.log(
        `[MOCK RESEND] Email dispatched to ${recipient} | Subject: "${subject}" | ProviderId: ${mockMessageId}`,
      );
      return {
        success: true,
        provider: 'MOCK',
        providerMessageId: mockMessageId,
        rawResponse: {
          mock: true,
          provider: 'RESEND',
          to: recipient,
          subject,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Live Resend REST API integration
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [recipient],
          subject,
          html: html || body,
          text: body,
        }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        const errorMsg = data?.message || data?.error?.message || response.statusText;
        this.logger.error(`Resend API error (${response.status}): ${errorMsg}`);
        return {
          success: false,
          provider: this.providerName,
          errorMessage: errorMsg,
          rawResponse: data,
        };
      }

      const messageId = data?.id || `resend_${Date.now()}`;
      this.logger.log(`Resend Email sent to ${recipient} (ID: ${messageId})`);

      return {
        success: true,
        provider: this.providerName,
        providerMessageId: messageId,
        rawResponse: data,
      };
    } catch (err: any) {
      this.logger.error(`Network error sending email via Resend: ${err.message}`);
      return {
        success: false,
        provider: this.providerName,
        errorMessage: err.message,
      };
    }
  }
}
