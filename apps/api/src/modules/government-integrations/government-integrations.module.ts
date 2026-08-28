import { Module } from '@nestjs/common';
import { GovernmentIntegrationsService } from './government-integrations.service';
import { GovernmentIntegrationsController } from './government-integrations.controller';
import { McaV3Provider } from './providers/mca-v3.provider';
import { GstnProvider } from './providers/gstn.provider';
import { AccountAggregatorProvider } from './providers/account-aggregator.provider';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GovernmentIntegrationsController],
  providers: [
    GovernmentIntegrationsService,
    McaV3Provider,
    GstnProvider,
    AccountAggregatorProvider,
  ],
  exports: [GovernmentIntegrationsService],
})
export class GovernmentIntegrationsModule {}
