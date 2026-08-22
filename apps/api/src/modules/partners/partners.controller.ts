import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerLeadDto } from './dto/create-partner-lead.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Partners Portal & Referrals')
@ApiBearerAuth()
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post('leads')
  @ApiOperation({ summary: 'Submit new client referral into central CRM' })
  @ApiResponse({ status: 201, description: 'Referral lead submitted successfully' })
  submitLead(@Body() dto: CreatePartnerLeadDto, @CurrentUser() user: any) {
    return this.partnersService.submitPartnerLead(dto, user);
  }

  @Get('cases')
  @ApiOperation({ summary: 'Track referred cases without internal employee notes' })
  @ApiResponse({ status: 200, description: 'List of partner referred cases' })
  getCases(@CurrentUser() user: any, @Query() query: any) {
    return this.partnersService.getPartnerCases(user, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get partner earnings and referral statistics' })
  @ApiResponse({ status: 200, description: 'Partner KPI summary' })
  getStats(@CurrentUser() user: any) {
    return this.partnersService.getPartnerStats(user);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Get partner commissions log' })
  @ApiResponse({ status: 200, description: 'Partner commissions list' })
  getCommissions(@CurrentUser() user: any, @Query() query: any) {
    return this.partnersService.getPartnerCommissions(user, query);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get partner payout disbursement history' })
  @ApiResponse({ status: 200, description: 'Partner payouts list' })
  getPayouts(@CurrentUser() user: any, @Query() query: any) {
    return this.partnersService.getPartnerPayouts(user, query);
  }
}
