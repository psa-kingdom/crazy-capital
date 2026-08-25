import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { PayoutsService } from './payouts.service';
import { PayoutsController } from './payouts.controller';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { PartnerProfileService } from './partner-profile.service';
import { CommissionSlabsService } from './commission-slabs.service';
import { ReferralsService } from './referrals.service';
import { CouponsService } from './coupons.service';
import { IncentivesService } from './incentives.service';
import { RazorpayXPayoutProvider } from './providers/razorpayx-payout.provider';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CommissionsController, PayoutsController, PartnersController],
  providers: [
    CommissionsService,
    PayoutsService,
    PartnersService,
    PartnerProfileService,
    CommissionSlabsService,
    ReferralsService,
    CouponsService,
    IncentivesService,
    RazorpayXPayoutProvider,
  ],
  exports: [
    CommissionsService,
    PayoutsService,
    PartnersService,
    PartnerProfileService,
    CommissionSlabsService,
    ReferralsService,
    CouponsService,
    IncentivesService,
    RazorpayXPayoutProvider,
  ],
})
export class PartnersModule {}
