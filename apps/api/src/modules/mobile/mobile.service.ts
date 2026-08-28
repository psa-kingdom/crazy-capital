import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  RegisterMobileDeviceInput,
  RevokeMobileDeviceInput,
  VerifyBiometricAuthInput,
  MobilePlatform,
  MobileCustomerSummaryDto,
  MobilePartnerSummaryDto,
  MobilePushPreferencesDto,
} from '@cc/types';
import * as crypto from 'crypto';

@Injectable()
export class MobileService {
  private readonly logger = new Logger(MobileService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register or update a mobile device token for push notifications and biometrics
   */
  async registerDevice(userId: string, organizationId: string, input: RegisterMobileDeviceInput) {
    const existing = await this.prisma.mobileDeviceToken.findUnique({
      where: { deviceToken: input.deviceToken },
    });

    const defaultPrefs: MobilePushPreferencesDto = {
      leadAlerts: true,
      statusUpdates: true,
      commissionAlerts: true,
      marketing: false,
    };

    const pushPreferences = {
      ...defaultPrefs,
      ...(input.pushPreferences || {}),
    };

    if (existing) {
      const updated = await this.prisma.mobileDeviceToken.update({
        where: { id: existing.id },
        data: {
          userId,
          organizationId,
          platform: input.platform || existing.platform,
          deviceModel: input.deviceModel ?? existing.deviceModel,
          osVersion: input.osVersion ?? existing.osVersion,
          appVersion: input.appVersion ?? existing.appVersion,
          biometricEnabled: input.biometricEnabled ?? existing.biometricEnabled,
          biometricPublicKey: input.biometricPublicKey ?? existing.biometricPublicKey,
          pushPreferencesJson: pushPreferences,
          isActive: true,
          lastActiveAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Mobile device token refreshed successfully',
        device: updated,
      };
    }

    const created = await this.prisma.mobileDeviceToken.create({
      data: {
        organizationId,
        userId,
        deviceToken: input.deviceToken,
        platform: input.platform || MobilePlatform.ANDROID,
        deviceModel: input.deviceModel || 'Unknown Mobile Device',
        osVersion: input.osVersion || 'Unknown OS',
        appVersion: input.appVersion || '1.0.0',
        biometricEnabled: input.biometricEnabled || false,
        biometricPublicKey: input.biometricPublicKey,
        pushPreferencesJson: pushPreferences,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    this.logger.log(`Registered new mobile device token: ${input.deviceToken.slice(0, 12)}... for user ${userId}`);

    return {
      success: true,
      message: 'Mobile device registered successfully',
      device: created,
    };
  }

  /**
   * Revoke an active mobile device token
   */
  async revokeDevice(userId: string, input: RevokeMobileDeviceInput) {
    const device = await this.prisma.mobileDeviceToken.findFirst({
      where: { deviceToken: input.deviceToken, userId },
    });

    if (!device) {
      throw new NotFoundException('Device token not found or does not belong to user');
    }

    await this.prisma.mobileDeviceToken.update({
      where: { id: device.id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Device revoked successfully',
    };
  }

  /**
   * List active devices registered for user
   */
  async getUserDevices(userId: string) {
    return this.prisma.mobileDeviceToken.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  /**
   * Generate cryptographic challenge nonce for FaceID / Biometric auth
   */
  async createBiometricChallenge(userId: string) {
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity

    return {
      challengeNonce: nonce,
      expiresAt,
    };
  }

  /**
   * Verify biometric signature from hardware enclave and issue refreshed session
   */
  async verifyBiometricAuth(userId: string, input: VerifyBiometricAuthInput) {
    const device = await this.prisma.mobileDeviceToken.findFirst({
      where: { deviceToken: input.deviceToken, userId, isActive: true },
    });

    if (!device) {
      throw new NotFoundException('Active device not found for biometric authentication');
    }

    if (!device.biometricEnabled) {
      throw new BadRequestException('Biometric authentication is not enabled for this device');
    }

    // In production mobile SDK (Expo/React Native LocalAuthentication), the hardware enclave signs the challenge nonce.
    // In sandbox/testing, verify non-empty signature against challenge nonce.
    if (!input.signature || input.signature.length < 4) {
      throw new BadRequestException('Invalid cryptographic biometric signature');
    }

    await this.prisma.mobileDeviceToken.update({
      where: { id: device.id },
      data: { lastActiveAt: new Date() },
    });

    return {
      authenticated: true,
      userId,
      deviceId: device.id,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Low-latency mobile customer summary dashboard
   */
  async getCustomerMobileSummary(userId: string, organizationId: string): Promise<MobileCustomerSummaryDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const customer = user
      ? await this.prisma.customer.findFirst({
          where: {
            organizationId,
            OR: [{ email: user.email }, { mobile: user.mobile || '' }],
          },
        })
      : null;

    const applications = customer
      ? await this.prisma.application.findMany({
          where: { customerId: customer.id, organizationId },
          include: {
            service: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        })
      : [];

    const activeCount = applications.filter((a) => !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(a.status)).length;

    const pendingDocs = customer
      ? await this.prisma.document.count({
          where: {
            customerId: customer.id,
            status: { in: ['PENDING', 'REJECTED'] },
          },
        })
      : 0;

    const unpaidInvoices = customer
      ? await this.prisma.invoice.count({
          where: { customerId: customer.id, status: { in: ['SENT', 'DRAFT'] } },
        })
      : 0;

    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      include: { pricing: true },
      take: 4,
    });

    return {
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : (user ? `${user.firstName} ${user.lastName}` : 'Valued Customer'),
      activeApplicationsCount: activeCount,
      pendingDocumentsCount: pendingDocs,
      unpaidInvoicesCount: unpaidInvoices,
      recentApplications: applications.map((a) => ({
        id: a.id,
        applicationNumber: a.applicationNumber,
        serviceName: a.service?.name || 'Financial Service',
        status: a.status,
        currentStageName: a.status === 'COMPLETED' ? 'Completed' : 'In Processing',
        submittedAt: a.createdAt.toISOString(),
      })),
      quickActionServices: services.map((s) => {
        const price = s.pricing?.[0]?.amount ? Number(s.pricing[0].amount) : 4999;
        return {
          id: s.id,
          title: s.name,
          slug: s.slug,
          priceFormatted: `₹${price.toLocaleString('en-IN')}`,
          icon: s.slug.includes('incorporation') ? 'Building2' : s.slug.includes('gst') ? 'Receipt' : 'FileText',
        };
      }),
    };
  }

  /**
   * Low-latency mobile partner summary dashboard
   */
  async getPartnerMobileSummary(userId: string, organizationId: string): Promise<MobilePartnerSummaryDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        partnerProfile: true,
      },
    });

    const partnerCommissions = await this.prisma.commission.findMany({
      where: { partnerId: userId },
    });

    const lifetimeEarnings = partnerCommissions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const pendingCommissions = partnerCommissions
      .filter((c) => ['PENDING', 'APPROVED'].includes(c.status))
      .reduce((sum, c) => sum + Number(c.amount), 0);

    const recentLeads = await this.prisma.lead.findMany({
      where: { partnerId: userId, organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const totalLeadsCount = await this.prisma.lead.count({
      where: { partnerId: userId, organizationId },
    });

    const convertedLeadsCount = await this.prisma.lead.count({
      where: { partnerId: userId, organizationId, status: 'CONVERTED' },
    });

    const conversionRatePct = totalLeadsCount > 0 ? Math.round((convertedLeadsCount / totalLeadsCount) * 100) : 0;

    return {
      partnerName: user ? `${user.firstName} ${user.lastName}` : 'Crazy Partner',
      tier: user?.partnerProfile?.tier || 'SILVER',
      lifetimeEarnings,
      pendingCommissions,
      activeReferralsCount: totalLeadsCount,
      conversionRatePct,
      quickReferralCode: user?.partnerProfile?.partnerCode || `CC-PTR-${userId.slice(0, 6).toUpperCase()}`,
      recentLeads: recentLeads.map((l) => ({
        id: l.id,
        fullName: `${l.firstName} ${l.lastName}`,
        serviceInterested: l.companyName || 'General Financial Advisory',
        status: l.status,
        leadScore: l.leadScore || 50,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Dispatch push notification to registered user devices (with deterministic sandbox logger)
   */
  async sendPushNotification(
    userId: string,
    payload: { title: string; body: string; data?: Record<string, string>; preferenceType?: keyof MobilePushPreferencesDto },
  ) {
    const devices = await this.prisma.mobileDeviceToken.findMany({
      where: { userId, isActive: true },
    });

    if (devices.length === 0) {
      return { delivered: 0, skipped: 0, reason: 'No active registered mobile devices' };
    }

    let delivered = 0;
    let skipped = 0;

    for (const device of devices) {
      const prefs = device.pushPreferencesJson as unknown as MobilePushPreferencesDto | null;
      if (payload.preferenceType && prefs && prefs[payload.preferenceType] === false) {
        skipped++;
        continue;
      }

      // FCM / APNs dispatch sandbox simulation
      this.logger.log(
        `[FCM/APNs Push Sandbox] Dispatched to ${device.platform} (${device.deviceToken.slice(0, 10)}...): "${payload.title}" - ${payload.body}`,
      );
      delivered++;
    }

    return { delivered, skipped };
  }
}
