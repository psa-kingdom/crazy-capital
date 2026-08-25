import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PanVerificationProvider } from './providers/pan-verification.provider';
import { GstVerificationProvider } from './providers/gst-verification.provider';
import { DigiLockerProvider } from './providers/digilocker.provider';
import { IdentityVerificationService } from './identity-verification.service';
import { IdentityVerificationController } from './identity-verification.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IdentityVerificationController],
  providers: [
    PanVerificationProvider,
    GstVerificationProvider,
    DigiLockerProvider,
    IdentityVerificationService,
  ],
  exports: [
    PanVerificationProvider,
    GstVerificationProvider,
    DigiLockerProvider,
    IdentityVerificationService,
  ],
})
export class IdentityVerificationModule {}
