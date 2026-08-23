import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { RecordPayoutDto } from './dto/record-payout.dto';
import { QueryPayoutsDto } from './dto/query-payouts.dto';
import { ExecutePayoutDto } from './dto/execute-payout.dto';
import { RetryPayoutDto } from './dto/retry-payout.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Partner Payouts (Slice 2.5: RazorpayX Automated Disbursements)')
@ApiBearerAuth()
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  @RequirePermissions('payout.read')
  @ApiOperation({ summary: 'List and filter partner payouts' })
  @ApiResponse({ status: 200, description: 'Paginated list of payouts' })
  findAll(@Query() query: QueryPayoutsDto, @CurrentUser() user: any) {
    return this.payoutsService.findAll(query, user);
  }

  @Get('razorpayx/balance')
  @RequirePermissions('payout.create')
  @ApiOperation({ summary: 'Get operational RazorpayX balance and gateway status' })
  getRazorpayXBalance(@CurrentUser() user: any) {
    return this.payoutsService.getRazorpayXBalance(user);
  }

  @Get(':id')
  @RequirePermissions('payout.read')
  @ApiOperation({ summary: 'Get payout detail and audit linkage' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payoutsService.findOne(id, user);
  }

  @Post('execute')
  @RequirePermissions('payout.create')
  @ApiOperation({ summary: 'Slice 2.5: Execute automated direct bank payout via RazorpayX' })
  @ApiResponse({ status: 201, description: 'Automated payout initiated/settled' })
  executePayout(@Body() dto: ExecutePayoutDto, @CurrentUser() user: any) {
    return this.payoutsService.executePayout(dto, user);
  }

  @Post(':id/sync')
  @RequirePermissions('payout.read')
  @ApiOperation({ summary: 'Reconcile and sync live status from RazorpayX' })
  syncStatus(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payoutsService.syncPayoutStatus(id, user);
  }

  @Post(':id/retry')
  @RequirePermissions('payout.create')
  @ApiOperation({ summary: 'Retry a previously FAILED payout' })
  retryPayout(
    @Param('id') id: string,
    @Body() dto: RetryPayoutDto,
    @CurrentUser() user: any,
  ) {
    return this.payoutsService.retryPayout(id, dto, user);
  }

  @Post('manual')
  @RequirePermissions('payout.create')
  @ApiOperation({ summary: 'ADR-014: Record manual / offline bank transfer payout with UTR reference number' })
  @ApiResponse({ status: 201, description: 'Manual payout recorded' })
  recordManualPayout(@Body() dto: RecordPayoutDto, @CurrentUser() user: any) {
    return this.payoutsService.recordManualPayout(dto, user);
  }
}
