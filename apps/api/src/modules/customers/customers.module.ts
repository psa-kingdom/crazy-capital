import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { CustomerPortalService } from './customer-portal.service';
import { CustomerPortalController } from './customer-portal.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomersController, CustomerPortalController],
  providers: [CustomersService, CustomerPortalService],
  exports: [CustomersService, CustomerPortalService],
})
export class CustomersModule {}

