import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  NotificationChannel,
  NotificationEventType,
  NotificationStatus,
  NotificationLogDto,
  UserRole,
} from '@cc/types';
import { ResendEmailAdapter } from './providers/resend-email.adapter';
import { Msg91SmsAdapter } from './providers/msg91-sms.adapter';
import { InteraktWhatsappAdapter } from './providers/interakt-whatsapp.adapter';
import { NotificationChannelProvider } from './providers/provider.interface';
import { compileNotificationTemplate } from './templates/notification-templates';
import { SendNotificationDto } from './dto/send-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { TestDispatchDto } from './dto/test-dispatch.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly providerMap: Map<NotificationChannel, NotificationChannelProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly resendAdapter: ResendEmailAdapter,
    private readonly msg91Adapter: Msg91SmsAdapter,
    private readonly interaktAdapter: InteraktWhatsappAdapter,
  ) {
    this.providerMap = new Map<NotificationChannel, NotificationChannelProvider>([
      ['EMAIL', this.resendAdapter],
      ['SMS', this.msg91Adapter],
      ['WHATSAPP', this.interaktAdapter],
    ]);
  }

  /**
   * Core dispatch method: Non-blocking, idempotent, persistent audit log
   */
  async send(dto: SendNotificationDto, organizationId?: string): Promise<NotificationLogDto> {
    const {
      channel,
      eventType,
      recipient,
      subject: customSubject,
      body: customBody,
      userId,
      templateData = {},
      idempotencyKey,
      metadata = {},
    } = dto;

    // 1. Idempotency Check: if already SENT, return existing record
    if (idempotencyKey) {
      const existing = await this.prisma.notificationLog.findUnique({
        where: { idempotencyKey },
      });

      if (existing && existing.status === 'SENT') {
        this.logger.debug(
          `Idempotent hit: Notification with key '${idempotencyKey}' already sent. Skipping.`,
        );
        return this.mapToDto(existing);
      }
    }

    // 2. Template Compilation
    const compiled = compileNotificationTemplate(eventType, channel, templateData);
    const finalSubject = customSubject || compiled.subject;
    const finalBody = customBody || compiled.body;

    // 3. Create or update initial PENDING log in database
    let logRecord: any;
    try {
      if (idempotencyKey) {
        logRecord = await this.prisma.notificationLog.upsert({
          where: { idempotencyKey },
          create: {
            organizationId: organizationId || null,
            userId: userId || null,
            channel,
            eventType: String(eventType),
            recipient,
            subject: finalSubject,
            body: finalBody,
            status: 'PENDING',
            provider: 'MOCK',
            idempotencyKey,
            metadata: { ...metadata, templateData },
          },
          update: {
            attempts: { increment: 1 },
            status: 'PENDING',
          },
        });
      } else {
        logRecord = await this.prisma.notificationLog.create({
          data: {
            organizationId: organizationId || null,
            userId: userId || null,
            channel,
            eventType: String(eventType),
            recipient,
            subject: finalSubject,
            body: finalBody,
            status: 'PENDING',
            provider: 'MOCK',
            metadata: { ...metadata, templateData },
          },
        });
      }
    } catch (err: any) {
      this.logger.error(`Failed to create notification log record: ${err.message}`);
    }

    // 4. Resolve Provider Adapter
    const provider = this.providerMap.get(channel);
    if (!provider) {
      this.logger.warn(`No provider adapter registered for channel '${channel}'`);
      if (logRecord) {
        const updated = await this.prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status: 'FAILED',
            errorMessage: `Unsupported channel: ${channel}`,
          },
        });
        return this.mapToDto(updated);
      }
      return {
        id: 'failed-unsupported',
        organizationId: organizationId || null,
        userId: userId || null,
        channel,
        eventType,
        recipient,
        body: finalBody,
        status: 'FAILED',
        provider: 'MOCK',
        attempts: 1,
        errorMessage: `Unsupported channel: ${channel}`,
        createdAt: new Date().toISOString(),
      };
    }

    // 5. Execute Provider Dispatch
    try {
      const result = await provider.send({
        recipient,
        subject: finalSubject,
        body: finalBody,
        html: compiled.html,
        templateId: compiled.templateId,
        templateData: compiled.templateData,
        metadata,
      });

      const updatedStatus: NotificationStatus = result.success ? 'SENT' : 'FAILED';

      if (logRecord) {
        const updated = await this.prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status: updatedStatus,
            provider: result.provider,
            providerMessageId: result.providerMessageId || null,
            errorMessage: result.errorMessage || null,
            sentAt: result.success ? new Date() : null,
            metadata: {
              ...(logRecord.metadata as object),
              providerResponse: result.rawResponse,
            },
          },
        });
        return this.mapToDto(updated);
      }

      return {
        id: `temp-${Date.now()}`,
        organizationId: organizationId || null,
        userId: userId || null,
        channel,
        eventType,
        recipient,
        subject: finalSubject,
        body: finalBody,
        status: updatedStatus,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        attempts: 1,
        errorMessage: result.errorMessage,
        sentAt: result.success ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
      };
    } catch (err: any) {
      this.logger.error(`Unhandled error in notification dispatch: ${err.message}`);
      if (logRecord) {
        const updated = await this.prisma.notificationLog.update({
          where: { id: logRecord.id },
          data: {
            status: 'FAILED',
            errorMessage: err.message,
          },
        });
        return this.mapToDto(updated);
      }
      return {
        id: `failed-${Date.now()}`,
        organizationId: organizationId || null,
        userId: userId || null,
        channel,
        eventType,
        recipient,
        body: finalBody,
        status: 'FAILED',
        provider: 'MOCK',
        attempts: 1,
        errorMessage: err.message,
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Multi-channel broadcast helper for business events
   */
  async dispatchMultiChannel(
    eventType: NotificationEventType,
    recipients: { email?: string | null; mobile?: string | null },
    data: Record<string, any>,
    context: {
      organizationId?: string;
      userId?: string;
      idempotencyPrefix?: string;
    } = {},
  ): Promise<NotificationLogDto[]> {
    const promises: Promise<NotificationLogDto>[] = [];

    // 1. Email Channel
    if (recipients.email) {
      const emailIdempotencyKey = context.idempotencyPrefix
        ? `${context.idempotencyPrefix}:EMAIL`
        : undefined;

      promises.push(
        this.send(
          {
            channel: 'EMAIL',
            eventType,
            recipient: recipients.email,
            userId: context.userId,
            templateData: data,
            idempotencyKey: emailIdempotencyKey,
          },
          context.organizationId,
        ),
      );
    }

    // 2. WhatsApp Channel
    if (recipients.mobile) {
      const whatsappIdempotencyKey = context.idempotencyPrefix
        ? `${context.idempotencyPrefix}:WHATSAPP`
        : undefined;

      promises.push(
        this.send(
          {
            channel: 'WHATSAPP',
            eventType,
            recipient: recipients.mobile,
            userId: context.userId,
            templateData: data,
            idempotencyKey: whatsappIdempotencyKey,
          },
          context.organizationId,
        ),
      );
    }

    const results = await Promise.allSettled(promises);
    return results
      .filter((r): r is PromiseFulfilledResult<NotificationLogDto> => r.status === 'fulfilled')
      .map((r) => r.value);
  }

  /**
   * Query & filter notification delivery logs (Admin)
   */
  async findAll(query: QueryNotificationsDto, user: any) {
    const organizationId = user.organizationId;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (query.channel) {
      where.channel = query.channel;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.eventType) {
      where.eventType = { contains: query.eventType, mode: 'insensitive' };
    }

    if (query.recipient) {
      where.recipient = { contains: query.recipient, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { recipient: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
        { eventType: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, logs] = await Promise.all([
      this.prisma.notificationLog.count({ where }),
      this.prisma.notificationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: logs.map((log) => this.mapToDto(log)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find single log by ID
   */
  async findOne(id: string, user: any) {
    const log = await this.prisma.notificationLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Notification log '${id}' not found`);
    }

    // Role isolation
    if (
      user.roles?.includes(UserRole.CUSTOMER) &&
      log.userId !== user.customerId &&
      log.userId !== user.userId
    ) {
      throw new NotFoundException(`Notification log '${id}' not found`);
    }

    return this.mapToDto(log);
  }

  /**
   * Query user / customer notification history with role scoping & read filtering
   */
  async findCustomerNotifications(user: any, unreadOnly?: boolean) {
    const userId = user.sub || user.userId || user.id || user.customerId;
    const userEmail = user.email;
    const userMobile = user.mobile;

    const userFilters: any[] = [];
    if (userId) userFilters.push({ userId });
    if (userEmail) userFilters.push({ recipient: userEmail });
    if (userMobile) userFilters.push({ recipient: userMobile });

    const where: any = {
      OR: userFilters.length > 0 ? userFilters : undefined,
    };

    if (unreadOnly) {
      where.readAt = null;
    }

    const logs = await this.prisma.notificationLog.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => this.mapToDto(log));
  }

  /**
   * Get unread notification count for authenticated user
   */
  async getUnreadCount(user: any): Promise<{ unreadCount: number }> {
    const userId = user.sub || user.userId || user.id || user.customerId;
    const userEmail = user.email;
    const userMobile = user.mobile;

    const userFilters: any[] = [];
    if (userId) userFilters.push({ userId });
    if (userEmail) userFilters.push({ recipient: userEmail });
    if (userMobile) userFilters.push({ recipient: userMobile });

    if (userFilters.length === 0) {
      return { unreadCount: 0 };
    }

    const count = await this.prisma.notificationLog.count({
      where: {
        OR: userFilters,
        readAt: null,
      },
    });

    return { unreadCount: count };
  }

  /**
   * Mark individual notification as read
   */
  async markAsRead(id: string, user: any): Promise<NotificationLogDto> {
    const log = await this.prisma.notificationLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Notification log '${id}' not found`);
    }

    const updated = await this.prisma.notificationLog.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return this.mapToDto(updated);
  }

  /**
   * Mark all unread notifications as read for current user
   */
  async markAllAsRead(user: any): Promise<{ updatedCount: number }> {
    const userId = user.sub || user.userId || user.id || user.customerId;
    const userEmail = user.email;
    const userMobile = user.mobile;

    const userFilters: any[] = [];
    if (userId) userFilters.push({ userId });
    if (userEmail) userFilters.push({ recipient: userEmail });
    if (userMobile) userFilters.push({ recipient: userMobile });

    if (userFilters.length === 0) {
      return { updatedCount: 0 };
    }

    const result = await this.prisma.notificationLog.updateMany({
      where: {
        OR: userFilters,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  }

  /**
   * Retry a failed notification
   */
  async retry(id: string, user: any): Promise<NotificationLogDto> {
    const log = await this.prisma.notificationLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Notification log '${id}' not found`);
    }

    this.logger.log(`Retrying notification dispatch: ${log.id} (${log.channel} ➔ ${log.recipient})`);

    const result = await this.send(
      {
        channel: log.channel as NotificationChannel,
        eventType: log.eventType,
        recipient: log.recipient,
        subject: log.subject || undefined,
        body: log.body,
        userId: log.userId || undefined,
        idempotencyKey: log.idempotencyKey ? `${log.idempotencyKey}:retry-${Date.now()}` : undefined,
      },
      user.organizationId || log.organizationId || undefined,
    );

    return result;
  }

  /**
   * Staging Test Dispatch Tool
   */
  async testDispatch(dto: TestDispatchDto, user: any): Promise<NotificationLogDto> {
    this.logger.log(`Staging test dispatch requested by ${user.email} (${dto.channel} ➔ ${dto.recipient})`);

    return this.send(
      {
        channel: dto.channel,
        eventType: dto.eventType || 'test.dispatch',
        recipient: dto.recipient,
        subject: dto.subject,
        body: dto.customMessage,
        templateData: {
          customMessage: dto.customMessage,
          subject: dto.subject,
          tester: user.email,
        },
      },
      user.organizationId,
    );
  }

  private mapToDto(log: any): NotificationLogDto {
    return {
      id: log.id,
      organizationId: log.organizationId,
      userId: log.userId,
      channel: log.channel as NotificationChannel,
      eventType: log.eventType,
      recipient: log.recipient,
      subject: log.subject,
      body: log.body,
      status: log.status as NotificationStatus,
      provider: log.provider,
      providerMessageId: log.providerMessageId,
      idempotencyKey: log.idempotencyKey,
      attempts: log.attempts || 1,
      errorMessage: log.errorMessage,
      metadata: {
        ...(log.metadata || {}),
        readAt: log.readAt ? log.readAt.toISOString() : null,
        isRead: !!log.readAt,
      },
      sentAt: log.sentAt ? log.sentAt.toISOString() : null,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
