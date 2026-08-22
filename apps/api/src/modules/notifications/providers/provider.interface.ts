import { NotificationChannel, NotificationProvider } from '@cc/types';

export interface NotificationProviderPayload {
  recipient: string; // Email address, E.164 phone number, etc.
  subject?: string;
  body: string; // Plain text or HTML body
  html?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface NotificationProviderResult {
  success: boolean;
  provider: NotificationProvider;
  providerMessageId?: string;
  errorMessage?: string;
  rawResponse?: Record<string, any>;
}

export interface NotificationChannelProvider {
  readonly channel: NotificationChannel;
  readonly providerName: NotificationProvider;

  send(payload: NotificationProviderPayload): Promise<NotificationProviderResult>;
}
