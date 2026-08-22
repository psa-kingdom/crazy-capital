import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { ApproveCommissionDto } from './dto/approve-commission.dto';
import { RejectCommissionDto } from './dto/reject-commission.dto';
import { QueryCommissionsDto } from './dto/query-commissions.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Partner Commissions')
@ApiBearerAuth()
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @RequirePermissions('commission.read')
  @ApiOperation({ summary: 'List and filter partner commissions' })
  @ApiResponse({ status: 200, description: 'Paginated list of commissions' })
  findAll(@Query() query: QueryCommissionsDto, @CurrentUser() user: any) {
    return this.commissionsService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('commission.read')
  @ApiOperation({ summary: 'Get single commission details' })
  @ApiResponse({ status: 200, description: 'Commission details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commissionsService.findOne(id, user);
  }

  @Patch(':id/approve')
  @RequirePermissions('commission.approve')
  @ApiOperation({ summary: 'ADR-011: Admin-only approval of partner commission' })
  @ApiResponse({ status: 200, description: 'Commission approved and queued for payout' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveCommissionDto,
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.approveCommission(id, dto, user);
  }

  @Patch(':id/reject')
  @RequirePermissions('commission.approve')
  @ApiOperation({ summary: 'ADR-011: Admin-only rejection of partner commission' })
  @ApiResponse({ status: 200, description: 'Commission rejected' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectCommissionDto,
    @CurrentUser() user: any,
  ) {
    return this.commissionsService.rejectCommission(id, dto, user);
  }
}
