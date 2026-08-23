import { Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { SlaEvaluatorService } from './sla-evaluator.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SlaController],
  providers: [SlaService, SlaEvaluatorService],
  exports: [SlaService],
})
export class SlaModule {}
