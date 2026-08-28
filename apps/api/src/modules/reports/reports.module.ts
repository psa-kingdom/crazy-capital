import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportsController],
  providers: [ReportsService, PredictiveAnalyticsService],
  exports: [ReportsService, PredictiveAnalyticsService],
})
export class ReportsModule {}
