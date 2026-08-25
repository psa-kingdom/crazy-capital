import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IdentityVerificationService } from './identity-verification.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@cc/types';

@ApiTags('Identity & Statutory Verification (DigiLocker, PAN, GST)')
@ApiBearerAuth()
@Controller('identity-verification')
export class IdentityVerificationController {
  constructor(private readonly verificationService: IdentityVerificationService) {}

  @Post('pan')
  @ApiOperation({ summary: 'Instant verification of PAN against Income Tax NSDL/Surepass' })
  verifyPan(@CurrentUser() user: any, @Body() body: any) {
    return this.verificationService.verifyPan(user.organizationId, body);
  }

  @Post('gst')
  @ApiOperation({ summary: 'Instant validation and state retrieval of GSTIN against GSTN' })
  verifyGst(@CurrentUser() user: any, @Body() body: any) {
    return this.verificationService.verifyGst(user.organizationId, body);
  }

  @Post('digilocker')
  @ApiOperation({ summary: 'Instant verification of Aadhaar/PAN via DigiLocker consent' })
  verifyDigiLocker(@CurrentUser() user: any, @Body() body: any) {
    return this.verificationService.verifyDigiLocker(user.organizationId, body);
  }

  @Get('queue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Admin Verification Workbench Queue' })
  getQueue(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.verificationService.getVerificationQueue(user.organizationId, status);
  }

  @Post(':id/retry')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Retry a failed verification record' })
  retryVerification(@Param('id') recordId: string) {
    return this.verificationService.retryVerification(recordId);
  }
}
