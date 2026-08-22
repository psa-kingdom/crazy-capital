import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RazorpayGatewayService } from './gateway/razorpay-gateway.service';

@Module({
  controllers: [InvoicesController, PaymentsController],
  providers: [InvoicesService, PaymentsService, RazorpayGatewayService],
  exports: [InvoicesService, PaymentsService, RazorpayGatewayService],
})
export class BillingModule {}
