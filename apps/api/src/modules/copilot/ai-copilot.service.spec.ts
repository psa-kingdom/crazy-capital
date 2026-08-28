import { Test, TestingModule } from '@nestjs/testing';
import { AiCopilotService } from './ai-copilot.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AiCopilotService', () => {
  let service: AiCopilotService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      aiCopilotSession: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      application: {
        findUnique: jest.fn(),
      },
      lead: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiCopilotService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AiCopilotService>(AiCopilotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should answer MCA compliance questions using knowledge base with citations', async () => {
      prisma.aiCopilotSession.create.mockResolvedValue({
        id: 'session-1',
        messagesJson: [],
      });
      prisma.aiCopilotSession.update.mockResolvedValue({
        id: 'session-1',
      });

      const result = await service.chat(
        { message: 'What are the requirements for Pvt Ltd incorporation under SPICe+?' },
        { organizationId: 'org-1', id: 'user-1' },
      );

      expect(result.reply).toContain('Private Limited Company Incorporation');
      expect(result.reply).toContain('Minimum 2 Directors');
      expect(result.citations.length).toBeGreaterThan(0);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
    });

    it('should draft a personalized WhatsApp follow-up when prompted', async () => {
      prisma.aiCopilotSession.create.mockResolvedValue({
        id: 'session-2',
        messagesJson: [],
      });
      prisma.aiCopilotSession.update.mockResolvedValue({ id: 'session-2' });

      const result = await service.chat(
        { message: 'Draft a WhatsApp message to remind client for pending documents' },
        { organizationId: 'org-1', id: 'user-1' },
      );

      expect(result.reply).toContain('WhatsApp');
      expect(result.draftPayload).toBeDefined();
      expect(result.draftPayload.channel).toBe('WHATSAPP');
    });
  });

  describe('draftFollowup', () => {
    it('should generate structured WhatsApp reminder for application with missing docs', async () => {
      const mockApp = {
        id: 'app-1',
        applicationNumber: 'CC-2026-000100',
        customer: {
          firstName: 'Ankit',
          lastName: 'Sharma',
          mobile: '9876543210',
          email: 'ankit@example.com',
        },
        service: {
          name: 'Private Limited Company Incorporation',
        },
        documents: [
          { status: 'PENDING', documentType: { name: 'Director PAN Card' } },
        ],
        invoices: [],
      };

      prisma.application.findUnique.mockResolvedValue(mockApp);

      const res = await service.draftFollowup(
        {
          applicationId: 'app-1',
          channel: 'WHATSAPP',
          intent: 'DOCUMENT_MISSING',
        },
        { organizationId: 'org-1', id: 'user-1' },
      );

      expect(res.channel).toBe('WHATSAPP');
      expect(res.recipientName).toBe('Ankit Sharma');
      expect(res.recipientContact).toBe('9876543210');
      expect(res.body).toContain('Director PAN Card');
      expect(res.body).toContain('CC-2026-000100');
    });
  });

  describe('suggestNextAction', () => {
    it('should flag pending document blockers on application', async () => {
      const mockApp = {
        id: 'app-2',
        applicationNumber: 'CC-2026-000200',
        status: 'IN_PROGRESS',
        customer: { firstName: 'Rohan', lastName: 'Gupta' },
        service: { name: 'Trademark Registration', slug: 'trademark-registration' },
        workflowInstance: {
          currentStageId: 'stage-1',
          currentStage: { name: 'Document Verification' },
        },
        documents: [
          { id: 'doc-1', status: 'PENDING', documentType: { name: 'TM User Affidavit' } },
        ],
        invoices: [],
      };

      prisma.application.findUnique.mockResolvedValue(mockApp);

      const res = await service.suggestNextAction('app-2', { organizationId: 'org-1' });

      expect(res.applicationNumber).toBe('CC-2026-000200');
      expect(res.currentStageName).toBe('Document Verification');
      expect(res.recommendations.length).toBeGreaterThan(0);
      expect(res.recommendations[0].category).toBe('DOCUMENT');
    });
  });
});
