import { Test, TestingModule } from '@nestjs/testing';
import { SaasService } from './saas.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('SaasService', () => {
  let service: SaasService;
  let prisma: any;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaasService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SaasService>(SaasService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTenant', () => {
    it('should create a new white-label tenant successfully', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({
        id: 'tenant-1',
        organizationId: 'org-1',
        name: 'Apex Financial Advisors',
        slug: 'apex-financial',
        subdomain: 'apex',
        customDomain: 'portal.apexfin.com',
        cnameTarget: 'cname.crazycapital.in',
        domainVerified: false,
        isWhiteLabel: true,
        planType: 'ENTERPRISE',
        status: 'ACTIVE',
        themeConfigJson: { primaryColor: '#059669', logoUrl: '/logos/apex.png' },
      });

      const result = await service.createTenant('org-1', {
        name: 'Apex Financial Advisors',
        slug: 'apex-financial',
        subdomain: 'apex',
        customDomain: 'portal.apexfin.com',
        themeConfig: {
          primaryColor: '#059669',
          secondaryColor: '#0284c7',
          accentColor: '#f59e0b',
          logoUrl: '/logos/apex.png',
          fontHeading: 'Manrope',
          fontBody: 'Inter',
          borderRadius: '0.75rem',
          darkThemeEnabled: false,
        },
      });

      expect(result.subdomain).toBe('apex');
      expect(result.isWhiteLabel).toBe(true);
      expect(mockPrismaService.tenant.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if subdomain is already taken', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue({ id: 'existing-tenant', subdomain: 'apex' });

      await expect(
        service.createTenant('org-1', {
          name: 'Apex Financial',
          slug: 'apex',
          subdomain: 'apex',
          themeConfig: {
            primaryColor: '#000000',
            secondaryColor: '#ffffff',
            accentColor: '#123456',
            logoUrl: 'logo.png',
            fontHeading: 'Manrope',
            fontBody: 'Inter',
            borderRadius: '0.5rem',
            darkThemeEnabled: false,
          },
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('resolveTenant', () => {
    it('should resolve tenant by subdomain', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        id: 'tenant-1',
        organizationId: 'org-1',
        name: 'Apex Financial Advisors',
        slug: 'apex',
        subdomain: 'apex',
        status: 'ACTIVE',
      });

      const tenant = await service.resolveTenant('apex.crazycapital.in');
      expect(tenant.subdomain).toBe('apex');
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);

      await expect(service.resolveTenant('nonexistent.crazycapital.in')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Strict Tenant Isolation & IDOR Protection', () => {
    it('should pass if user organization matches target resource organization', () => {
      expect(() => {
        service.assertTenantAccess('org-apex-123', 'org-apex-123');
      }).not.toThrow();
    });

    it('should throw ForbiddenException if user from Tenant A tries to access Tenant B resource', () => {
      expect(() => {
        service.assertTenantAccess('org-tenant-A', 'org-tenant-B');
      }).toThrow(ForbiddenException);
    });
  });

  describe('verifyCustomDomain', () => {
    it('should verify valid domain and update verified status', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue({
        id: 'tenant-1',
        organizationId: 'org-1',
        cnameTarget: 'cname.crazycapital.in',
      });
      mockPrismaService.tenant.update.mockResolvedValue({
        id: 'tenant-1',
        domainVerified: true,
      });

      const res = await service.verifyCustomDomain('org-1', 'portal.apexfin.com');
      expect(res.isVerified).toBe(true);
      expect(res.cnameTarget).toBe('cname.crazycapital.in');
      expect(res.dnsRecordsChecked[0].status).toBe('MATCH');
    });
  });
});
