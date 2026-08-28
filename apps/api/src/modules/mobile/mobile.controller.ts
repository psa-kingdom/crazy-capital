import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MobileService } from './mobile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  registerMobileDeviceSchema,
  revokeMobileDeviceSchema,
  verifyBiometricAuthSchema,
  updateMobilePushPreferencesSchema,
} from '@cc/validation';
import {
  RegisterMobileDeviceInput,
  RevokeMobileDeviceInput,
  VerifyBiometricAuthInput,
} from '@cc/types';

@Controller('mobile')
@UseGuards(JwtAuthGuard)
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Post('devices/register')
  @HttpCode(HttpStatus.OK)
  async registerDevice(@Req() req: any, @Body() body: any) {
    const validated = registerMobileDeviceSchema.parse(body);
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    return this.mobileService.registerDevice(userId, organizationId, validated as RegisterMobileDeviceInput);
  }

  @Post('devices/revoke')
  @HttpCode(HttpStatus.OK)
  async revokeDevice(@Req() req: any, @Body() body: any) {
    const validated = revokeMobileDeviceSchema.parse(body);
    const userId = req.user.id;
    return this.mobileService.revokeDevice(userId, validated as RevokeMobileDeviceInput);
  }

  @Get('devices')
  async getDevices(@Req() req: any) {
    const userId = req.user.id;
    return this.mobileService.getUserDevices(userId);
  }

  @Post('biometric/challenge')
  @HttpCode(HttpStatus.OK)
  async getBiometricChallenge(@Req() req: any) {
    const userId = req.user.id;
    return this.mobileService.createBiometricChallenge(userId);
  }

  @Post('biometric/verify')
  @HttpCode(HttpStatus.OK)
  async verifyBiometric(@Req() req: any, @Body() body: any) {
    const validated = verifyBiometricAuthSchema.parse(body);
    const userId = req.user.id;
    return this.mobileService.verifyBiometricAuth(userId, validated as VerifyBiometricAuthInput);
  }

  @Get('customer/summary')
  async getCustomerSummary(@Req() req: any) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    return this.mobileService.getCustomerMobileSummary(userId, organizationId);
  }

  @Get('partner/summary')
  async getPartnerSummary(@Req() req: any) {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    return this.mobileService.getPartnerMobileSummary(userId, organizationId);
  }
}
