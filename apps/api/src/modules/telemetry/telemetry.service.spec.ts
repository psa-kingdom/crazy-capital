import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const mockPrismaService = {
  $queryRaw: jest.fn().mockResolvedValue([{ '1': 1 }]),
  systemTelemetryProbe: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemHealthSummary', () => {
    it('should return unified system health summary across DB, storage, payments, and statutory gateways', async () => {
      const summary = await service.getSystemHealthSummary();
      expect(summary.status).toBe('OPTIMAL');
      expect(summary.components.length).toBeGreaterThanOrEqual(6);
      expect(summary.region).toBe('ap-south-1 (Mumbai)');
      expect(summary.uptimePct).toBeGreaterThanOrEqual(99.9);
    });
  });

  describe('recordProbe', () => {
    it('should record a synthetic telemetry probe', async () => {
      mockPrismaService.systemTelemetryProbe.create.mockResolvedValue({
        id: 'probe-1',
        serviceName: 'POSTGRESQL',
        endpoint: 'tcp://postgres:5432',
        statusCode: 200,
        latencyMs: 12,
        status: 'HEALTHY',
      });

      const res = await service.recordProbe({
        serviceName: 'POSTGRESQL',
        endpoint: 'tcp://postgres:5432',
        statusCode: 200,
        latencyMs: 12,
      });

      expect(res.id).toBe('probe-1');
      expect(res.serviceName).toBe('POSTGRESQL');
    });
  });
});
