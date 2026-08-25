import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { PartnerProfileService } from './partner-profile.service';
import { CommissionSlabsService } from './commission-slabs.service';
import { ReferralsService } from './referrals.service';
import { CouponsService } from './coupons.service';
import { IncentivesService } from './incentives.service';
import { CreatePartnerLeadDto } from './dto/create-partner-lead.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, PartnerKycStatus } from '@cc/types';

@ApiTags('Partners Portal & Nationwide Ecosystem')
@ApiBearerAuth()
@Controller('partners')
export class PartnersController {
  constructor(
    private readonly partnersService: PartnersService,
    private readonly profileService: PartnerProfileService,
    private readonly slabService: CommissionSlabsService,
    private readonly referralsService: ReferralsService,
    private readonly couponsService: CouponsService,
    private readonly incentivesService: IncentivesService,
  ) {}

  // ─── PARTNER SELF-SERVICE (SLICE 3.1) ──────────────────────────────────────

  @Get('me/profile')
  @ApiOperation({ summary: 'Get authenticated partner profile and tier details' })
  getMyProfile(@CurrentUser() user: any) {
    return this.profileService.getOrCreateProfile(user.id, user.organizationId);
  }

  @Patch('me/kyc')
  @ApiOperation({ summary: 'Submit KYC and bank information for partner onboarding' })
  updateKyc(@CurrentUser() user: any, @Body() body: any) {
    return this.profileService.updateKyc(user.id, body);
  }

  @Get('me/analytics')
  @ApiOperation({ summary: 'Get comprehensive earnings, conversion metrics and tier progress' })
  getAnalytics(@CurrentUser() user: any) {
    return this.profileService.getEarningsAnalytics(user.id);
  }

  // ─── ADMIN PARTNER GOVERNANCE ──────────────────────────────────────────────

  @Patch(':id/kyc-review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin review and approve/reject partner KYC' })
  reviewKyc(
    @Param('id') partnerId: string,
    @Body() body: { status: PartnerKycStatus; notes?: string },
  ) {
    return this.profileService.reviewKyc(partnerId, body.status, body.notes);
  }

  // ─── TIERED COMMISSION SLABS (ADMIN & PARTNER) ─────────────────────────────

  @Get('commission-slabs')
  @ApiOperation({ summary: 'List active tiered commission slab rules' })
  listSlabs(@CurrentUser() user: any, @Query('tier') tier?: string) {
    return this.slabService.listSlabs(user.organizationId, tier);
  }

  @Post('commission-slabs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin create a new tiered commission slab' })
  createSlab(@CurrentUser() user: any, @Body() body: any) {
    return this.slabService.createSlab(user.organizationId, body);
  }

  @Patch('commission-slabs/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin update an existing commission slab' })
  updateSlab(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.slabService.updateSlab(id, user.organizationId, body);
  }

  // ─── MULTI-TIER REFERRALS (SLICE 3.3) ──────────────────────────────────────

  @Get('me/referral-code')
  @ApiOperation({ summary: 'Get partner referral code and unique marketing URL' })
  getReferralCode(@CurrentUser() user: any) {
    return this.referralsService.getPartnerReferralCode(user.id);
  }

  @Get('me/referral-tree')
  @ApiOperation({ summary: 'Get partner multi-tier referral tree and attribution log' })
  getReferralTree(@CurrentUser() user: any) {
    return this.referralsService.getReferralTree(user.id);
  }

  @Post('referrals/attribute')
  @ApiOperation({ summary: 'Attribute referral from URL query parameter ref code' })
  attributeReferral(@CurrentUser() user: any, @Body() body: any) {
    return this.referralsService.attributeReferral({
      ...body,
      organizationId: user.organizationId,
    });
  }

  // ─── PROMOTIONAL COUPONS & INCENTIVES (SLICE 3.3) ──────────────────────────

  @Get('coupons')
  @ApiOperation({ summary: 'List active promotional coupons' })
  listCoupons(@Query('partnerId') partnerId?: string) {
    return this.couponsService.listCoupons(partnerId);
  }

  @Post('coupons')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER)
  @ApiOperation({ summary: 'Create a promotional coupon' })
  createCoupon(@Body() body: any) {
    return this.couponsService.createCoupon(body);
  }

  @Post('coupons/validate')
  @ApiOperation({ summary: 'Validate coupon code against order amount and service' })
  validateCoupon(@Body() body: any) {
    return this.couponsService.validateCoupon(body);
  }

  @Get('incentive-rules')
  @ApiOperation({ summary: 'List milestone incentive rules' })
  listIncentiveRules(@CurrentUser() user: any) {
    return this.incentivesService.listIncentiveRules(user.organizationId);
  }

  @Post('incentive-rules')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin create milestone incentive rule' })
  createIncentiveRule(@CurrentUser() user: any, @Body() body: any) {
    return this.incentivesService.createIncentiveRule(user.organizationId, body);
  }

  // ─── EXISTING PHASE 1/2 PARTNER APIS ───────────────────────────────────────

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
