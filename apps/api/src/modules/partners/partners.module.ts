import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CommissionsController, PayoutsController, PartnersController],
  providers: [CommissionsService, PayoutsService, PartnersService],
  exports: [CommissionsService, PayoutsService, PartnersService],
})
export class PartnersModule {}
