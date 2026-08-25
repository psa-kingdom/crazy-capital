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
import { FranchisesService } from './franchises.service';
import { FranchisePricingService } from './franchise-pricing.service';
import { FranchiseSettlementsService } from './franchise-settlements.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@cc/types';

@ApiTags('Franchise Management & Revenue Sharing')
@ApiBearerAuth()
@Controller('franchises')
export class FranchisesController {
  constructor(
    private readonly franchisesService: FranchisesService,
    private readonly pricingService: FranchisePricingService,
    private readonly settlementsService: FranchiseSettlementsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all franchises with regional hierarchy' })
  listFranchises(@CurrentUser() user: any, @Query('regionId') regionId?: string) {
    return this.franchisesService.listFranchises(user.organizationId, regionId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Onboard and activate a new franchise instance' })
  createFranchise(@CurrentUser() user: any, @Body() body: any) {
    return this.franchisesService.createFranchise(user.organizationId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get franchise operational and pricing details' })
  getFranchise(@Param('id') id: string, @CurrentUser() user: any) {
    return this.franchisesService.getFranchise(id, user.organizationId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update franchise parameters or status' })
  updateFranchise(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.franchisesService.updateFranchise(id, user.organizationId, body);
  }

  // ─── LOCALIZED PRICING OVERRIDES ──────────────────────────────────────────

  @Get(':id/pricing')
  @ApiOperation({ summary: 'List localized pricing overrides for a franchise' })
  listPricingOverrides(@Param('id') franchiseId: string) {
    return this.pricingService.listOverrides(franchiseId);
  }

  @Post(':id/pricing/override')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Set custom localized price for a service under a franchise' })
  setPricingOverride(@Param('id') franchiseId: string, @Body() body: any) {
    return this.pricingService.setPricingOverride({
      ...body,
      franchiseId,
    });
  }

  // ─── REVENUE SHARING SETTLEMENTS ──────────────────────────────────────────

  @Get(':id/settlements')
  @ApiOperation({ summary: 'List revenue share settlements for a franchise' })
  listSettlements(@Param('id') franchiseId: string) {
    return this.settlementsService.listSettlements(franchiseId);
  }

  @Post(':id/settlements/generate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate monthly revenue sharing settlement calculation' })
  generateSettlement(@Param('id') franchiseId: string, @Body() body: any) {
    return this.settlementsService.generateSettlement({
      ...body,
      franchiseId,
    });
  }

  @Patch('settlements/:settlementId/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin approve a franchise revenue share settlement' })
  approveSettlement(@Param('settlementId') settlementId: string, @CurrentUser() user: any) {
    return this.settlementsService.approveSettlement(settlementId, user.id);
  }
}
