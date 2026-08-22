import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ResendEmailAdapter } from './providers/resend-email.adapter';
import { Msg91SmsAdapter } from './providers/msg91-sms.adapter';
import { InteraktWhatsappAdapter } from './providers/interakt-whatsapp.adapter';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ResendEmailAdapter,
    Msg91SmsAdapter,
    InteraktWhatsappAdapter,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
