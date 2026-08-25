import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { FranchisesService } from './franchises.service';
import { FranchisePricingService } from './franchise-pricing.service';
import { FranchiseSettlementsService } from './franchise-settlements.service';
import { FranchisesController } from './franchises.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FranchisesController],
  providers: [
    FranchisesService,
    FranchisePricingService,
    FranchiseSettlementsService,
  ],
  exports: [
    FranchisesService,
    FranchisePricingService,
    FranchiseSettlementsService,
  ],
})
export class FranchisesModule {}
