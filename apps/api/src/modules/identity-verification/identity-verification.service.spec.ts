import { Test, TestingModule } from '@nestjs/testing';
import { IdentityVerificationService } from './identity-verification.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PanVerificationProvider } from './providers/pan-verification.provider';
import { GstVerificationProvider } from './providers/gst-verification.provider';
import { DigiLockerProvider } from './providers/digilocker.provider';
import { VerificationType, VerificationStatus } from '@cc/types';

describe('IdentityVerificationService', () => {
  let service: IdentityVerificationService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      identityVerificationRecord: {
        create: jest.fn().mockImplementation(({ data }) => ({
          ...data,
          id: 'rec-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      partnerProfile: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityVerificationService,
        PanVerificationProvider,
        GstVerificationProvider,
        DigiLockerProvider,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<IdentityVerificationService>(IdentityVerificationService);
  });

  it('should verify PAN and return masked identifier (AB•••••4F)', async () => {
    const result = await service.verifyPan('org-1', {
      pan: 'ABCDE1234F',
      expectedName: 'VIKRAM ADITYA',
    });

    expect(result.verificationType).toBe(VerificationType.PAN);
    expect(result.identifierMasked).toBe('AB•••••4F');
    expect(result.verificationStatus).toBe(VerificationStatus.VERIFIED);
  });

  it('should verify GSTIN and return state details', async () => {
    const result = await service.verifyGst('org-1', {
      gstin: '09AAACC1206D1ZH',
      expectedTradeName: 'CRAZY CAPITAL TECH',
    });

    expect(result.verificationType).toBe(VerificationType.GSTIN);
    expect(result.verificationStatus).toBe(VerificationStatus.VERIFIED);
    expect(result.identifierMasked).toContain('••••••');
  });

  it('should verify DigiLocker Aadhaar document with masked output', async () => {
    const result = await service.verifyDigiLocker('org-1', {
      documentType: 'AADHAAR',
      partnerId: 'user-partner-1',
    });

    expect(result.verificationType).toBe(VerificationType.DIGILOCKER);
    expect(result.identifierMasked).toBe('•••• •••• 9812');
    expect(result.verificationStatus).toBe(VerificationStatus.VERIFIED);
    expect(prisma.partnerProfile.updateMany).toHaveBeenCalled();
  });
});
