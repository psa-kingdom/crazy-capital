import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RecordManualPaymentDto } from './dto/record-manual-payment.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Payments & Gateway')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @ApiBearerAuth()
  @RequirePermissions('invoice.read')
  @ApiOperation({ summary: 'Create a Razorpay payment order for an invoice' })
  @ApiResponse({ status: 201, description: 'Order created with keyId and orderId' })
  createOrder(@Body() dto: CreatePaymentOrderDto, @CurrentUser() user: any) {
    return this.paymentsService.createPaymentOrder(dto, user);
  }

  @Post('verify')
  @ApiBearerAuth()
  @RequirePermissions('invoice.read')
  @ApiOperation({ summary: 'Verify client checkout payment signature and capture payment' })
  @ApiResponse({ status: 200, description: 'Payment verified and captured' })
  verifyPayment(@Body() dto: VerifyPaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.verifyClientPayment(dto, user);
  }

  @Post('manual-record')
  @ApiBearerAuth()
  @RequirePermissions('invoice.update')
  @ApiOperation({ summary: 'Record an offline/manual payment (Bank Transfer / NEFT / Cheque / Cash)' })
  @ApiResponse({ status: 201, description: 'Manual payment recorded' })
  recordManual(@Body() dto: RecordManualPaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.recordManualPayment(dto, user);
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Idempotent webhook receiver for Razorpay server notifications' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Headers('x-razorpay-signature') signature: string,
    @Body() payload: any,
    @Req() req: any,
  ) {
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : JSON.stringify(payload);
    return this.paymentsService.handleWebhook(rawBody, signature || '', payload);
  }
}
