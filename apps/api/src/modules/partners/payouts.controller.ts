import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { RecordPayoutDto } from './dto/record-payout.dto';
import { QueryPayoutsDto } from './dto/query-payouts.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Partner Payouts')
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

  @Post()
  @RequirePermissions('payout.create')
  @ApiOperation({ summary: 'ADR-014: Record manual / offline bank transfer payout with UTR reference number' })
  @ApiResponse({ status: 201, description: 'Manual payout recorded' })
  recordManualPayout(@Body() dto: RecordPayoutDto, @CurrentUser() user: any) {
    return this.payoutsService.recordManualPayout(dto, user);
  }
}
