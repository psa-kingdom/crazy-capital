import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerPortalService } from './customer-portal.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Customer Self-Service Portal')
@ApiBearerAuth()
@Controller('customer-portal')
export class CustomerPortalController {
  constructor(private readonly customerPortalService: CustomerPortalService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Customer Overview Dashboard (Aggregated stats, active applications, missing docs, billing)' })
  @ApiResponse({ status: 200, description: 'Customer dashboard data' })
  getDashboard(@CurrentUser() user: any) {
    return this.customerPortalService.getDashboard(user);
  }

  @Get('applications')
  @ApiOperation({ summary: 'List customer service applications' })
  @ApiResponse({ status: 200, description: 'List of customer applications' })
  getMyApplications(@CurrentUser() user: any) {
    return this.customerPortalService.getMyApplications(user);
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get detailed application hub with workflow progress stepper & document checklist' })
  @ApiResponse({ status: 200, description: 'Application detail hub' })
  getApplicationDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.customerPortalService.getApplicationDetail(id, user);
  }

  @Get('vault')
  @ApiOperation({ summary: 'Customer Document Vault with missing mandatory checklist' })
  @ApiResponse({ status: 200, description: 'Customer vault documents' })
  getMyVault(@CurrentUser() user: any) {
    return this.customerPortalService.getMyVault(user);
  }

  @Get('billing')
  @ApiOperation({ summary: 'Customer Invoices and Payment History' })
  @ApiResponse({ status: 200, description: 'Customer invoices' })
  getMyBilling(@CurrentUser() user: any) {
    return this.customerPortalService.getMyBilling(user);
  }
}
