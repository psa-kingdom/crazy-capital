import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { COMPLIANCE_KNOWLEDGE_BASE } from './compliance-knowledge';
import {
  AiCopilotSessionDto,
  AiCopilotMessage,
  ChatCopilotInput,
  DraftFollowupInput,
  ComplianceKnowledgeItem,
} from '@cc/types';

@Injectable()
export class AiCopilotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1. Multi-Turn Interactive Copilot Chat
   */
  async chat(
    input: ChatCopilotInput,
    currentUser: { organizationId: string; id: string; firstName?: string },
  ): Promise<{
    sessionId: string;
    reply: string;
    citations: string[];
    suggestedActions: string[];
    draftPayload?: any;
  }> {
    const orgId = currentUser.organizationId;
    const userId = currentUser.id;
    const contextType = input.contextType || 'GENERAL';
    const contextId = input.contextId;

    let session: any = null;

    if (input.sessionId) {
      session = await this.prisma.aiCopilotSession.findUnique({
        where: { id: input.sessionId },
      });
    }

    if (!session) {
      session = await this.prisma.aiCopilotSession.create({
        data: {
          organizationId: orgId,
          userId,
          title: `Copilot: ${input.message.slice(0, 40)}...`,
          contextType,
          contextId,
          messagesJson: [],
        },
      });
    }

    const messages: AiCopilotMessage[] = (session.messagesJson as any) || [];

    // Context Injection from Database
    let contextSummary = '';
    let linkedApplication: any = null;
    let linkedLead: any = null;

    if (contextId) {
      if (contextType === 'APPLICATION') {
        linkedApplication = await this.prisma.application.findUnique({
          where: { id: contextId },
          include: {
            customer: true,
            service: true,
            workflowInstance: {
              include: { currentStage: true },
            },
            documents: { include: { documentType: true } },
            invoices: true,
          },
        });
        if (linkedApplication) {
          const pendingDocs = linkedApplication.documents.filter((d: any) => d.status !== 'VERIFIED').map((d: any) => d.documentType.name);
          const unpaidInvoices = linkedApplication.invoices.filter((i: any) => i.status !== 'PAID');
          contextSummary = `[Context: Application ${linkedApplication.applicationNumber} | Service: ${linkedApplication.service.name} | Customer: ${linkedApplication.customer.firstName} ${linkedApplication.customer.lastName} | Stage: ${linkedApplication.workflowInstance?.currentStage?.name || linkedApplication.status} | Pending Docs: ${pendingDocs.join(', ') || 'None'} | Unpaid Invoices: ${unpaidInvoices.length}]`;
        }
      } else if (contextType === 'LEAD') {
        linkedLead = await this.prisma.lead.findUnique({
          where: { id: contextId },
          include: { source: true },
        });
        if (linkedLead) {
          contextSummary = `[Context: Lead ${linkedLead.firstName} ${linkedLead.lastName} | Phone: ${linkedLead.mobile} | Service: ${linkedLead.serviceInterest || 'General'} | Status: ${linkedLead.status} | AI Score: ${linkedLead.leadScore}]`;
        }
      }
    }

    // Knowledge Base Retrieval
    const relevantKb = this.findRelevantKnowledge(input.message);
    const citations: string[] = relevantKb.map(kb => `${kb.topic} (${kb.applicableActs.join(', ')})`);

    // Intelligent Synthesis Engine
    const { reply, suggestedActions, draftPayload } = this.generateCopilotResponse(
      input.message,
      contextSummary,
      relevantKb,
      linkedApplication,
      linkedLead,
    );

    const now = new Date().toISOString();
    const userMessage: AiCopilotMessage = {
      role: 'user',
      content: input.message,
      timestamp: now,
    };

    const assistantMessage: AiCopilotMessage = {
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
      citations,
      suggestedActions,
      draftPayload,
    };

    const updatedMessages = [...messages, userMessage, assistantMessage];

    await this.prisma.aiCopilotSession.update({
      where: { id: session.id },
      data: {
        messagesJson: updatedMessages as any,
        lastMessageAt: new Date(),
      },
    });

    return {
      sessionId: session.id,
      reply,
      citations,
      suggestedActions,
      draftPayload,
    };
  }

  /**
   * 2. Draft Follow-up Communication for Email, WhatsApp, or SMS
   */
  async draftFollowup(
    input: DraftFollowupInput,
    currentUser: { organizationId: string; id: string },
  ): Promise<{
    channel: string;
    subject?: string;
    recipientName: string;
    recipientContact: string;
    body: string;
    suggestedSendAction: string;
  }> {
    let recipientName = 'Valued Client';
    let recipientContact = '';
    let serviceName = 'your compliance service';
    let appNumber = '';
    let pendingDocList = 'mandatory statutory documents';
    let payableAmount = 'the outstanding service fee';
    let paymentLink = 'https://crazycapital.in/customer/billing';

    if (input.applicationId) {
      const app = await this.prisma.application.findUnique({
        where: { id: input.applicationId },
        include: {
          customer: true,
          service: true,
          documents: { include: { documentType: true } },
          invoices: true,
        },
      });

      if (app) {
        recipientName = `${app.customer.firstName} ${app.customer.lastName}`;
        recipientContact = input.channel === 'EMAIL' ? app.customer.email || '' : app.customer.mobile;
        serviceName = app.service.name;
        appNumber = app.applicationNumber;

        const missing = app.documents.filter(d => d.status !== 'VERIFIED').map(d => d.documentType.name);
        if (missing.length > 0) {
          pendingDocList = missing.join(', ');
        }

        const unpaid = app.invoices.find(i => i.status !== 'PAID');
        if (unpaid) {
          payableAmount = `₹${(Number(unpaid.amount) + Number(unpaid.taxAmount)).toLocaleString('en-IN')}`;
          paymentLink = `https://crazycapital.in/customer/billing?invoice=${unpaid.invoiceNumber}`;
        }
      }
    } else if (input.leadId) {
      const lead = await this.prisma.lead.findUnique({
        where: { id: input.leadId },
      });
      if (lead) {
        recipientName = `${lead.firstName} ${lead.lastName}`;
        recipientContact = input.channel === 'EMAIL' ? lead.email || '' : lead.mobile;
        serviceName = lead.serviceInterest || 'Crazy Capital Corporate Services';
      }
    }

    let subject = '';
    let body = '';

    if (input.intent === 'DOCUMENT_MISSING') {
      if (input.channel === 'EMAIL') {
        subject = `Action Required: Documents needed for your ${serviceName} [Ref: ${appNumber || 'Crazy Capital'}]`;
        body = `Dear ${recipientName},\n\nWe are currently processing your application for ${serviceName} (Ref: ${appNumber}). To proceed with the statutory MCA/filing stage, please upload the following documents:\n\n• ${pendingDocList}\n\nYou can upload them directly through your secure customer vault: https://crazycapital.in/customer/documents\n\nIf you have any questions, feel free to reply to this email.\n\nWarm regards,\nCrazy Capital Operations Team`;
      } else if (input.channel === 'WHATSAPP') {
        body = `Hello ${recipientName}! 📋\n\nWe are actively working on your *${serviceName}* (Application: ${appNumber}).\n\nTo fast-track your filing with the Registrar, kindly share/upload:\n👉 *${pendingDocList}*\n\nUpload link: https://crazycapital.in/customer/documents\n\nLet us know once uploaded! 🙏`;
      } else {
        body = `Crazy Capital: Dear ${recipientName}, please upload pending documents (${pendingDocList}) for your ${serviceName} application ${appNumber} at https://crazycapital.in/customer`;
      }
    } else if (input.intent === 'PAYMENT_PENDING') {
      if (input.channel === 'EMAIL') {
        subject = `Invoice Payment Pending for ${serviceName} [${appNumber}]`;
        body = `Dear ${recipientName},\n\nYour application for ${serviceName} is ready for processing. Please complete the invoice payment of ${payableAmount} to initiate the statutory filings.\n\nPay securely online: ${paymentLink}\n\nThank you for choosing Crazy Capital.\n\nBest regards,\nAccounts & Finance Team`;
      } else if (input.channel === 'WHATSAPP') {
        body = `Hi ${recipientName}! 💳\n\nYour invoice for *${serviceName}* (${payableAmount}) is ready for payment.\n\nPay instantly via UPI, Card, or Netbanking:\n🔗 ${paymentLink}\n\nOur team will begin processing immediately upon receipt. Thank you!`;
      } else {
        body = `Crazy Capital: Dear ${recipientName}, complete payment of ${payableAmount} for ${serviceName} at ${paymentLink} to start processing.`;
      }
    } else {
      // STAGE_UPDATE or WELCOME
      if (input.channel === 'WHATSAPP') {
        body = `Namaste ${recipientName}! 🚀\n\nGreat news! Your *${serviceName}* application (${appNumber}) has successfully advanced to the next processing stage.\n\nTrack real-time progress: https://crazycapital.in/customer/applications\n\nTeam Crazy Capital`;
      } else {
        subject = `Update on your ${serviceName} Application [${appNumber}]`;
        body = `Dear ${recipientName},\n\nWe are pleased to inform you that your application for ${serviceName} (Ref: ${appNumber}) has advanced to the next milestone in our operations workflow.\n\nTrack live updates: https://crazycapital.in/customer/applications\n\nWarm regards,\nCrazy Capital Team`;
      }
    }

    return {
      channel: input.channel,
      subject: subject || undefined,
      recipientName,
      recipientContact,
      body,
      suggestedSendAction: `Send via ${input.channel} Gateway`,
    };
  }

  /**
   * 3. Next Action Recommendations for an Application
   */
  async suggestNextAction(
    applicationId: string,
    currentUser?: { organizationId: string },
  ): Promise<{
    applicationNumber: string;
    currentStageName: string;
    recommendations: {
      actionTitle: string;
      description: string;
      priority: 'URGENT' | 'HIGH' | 'MEDIUM';
      category: 'DOCUMENT' | 'PAYMENT' | 'WORKFLOW' | 'FILING';
      actionPayload?: any;
    }[];
  }> {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        customer: true,
        service: true,
        workflowInstance: {
          include: {
            currentStage: {
              include: {
                rules: true,
              },
            },
          },
        },
        documents: { include: { documentType: true } },
        invoices: true,
      },
    });

    if (!app) {
      throw new NotFoundException(`Application ${applicationId} not found`);
    }

    const currentStageName = app.workflowInstance?.currentStage?.name || app.status;
    const recommendations: any[] = [];

    // Check Documents
    const pendingDocs = app.documents.filter(d => d.status !== 'VERIFIED');
    if (pendingDocs.length > 0) {
      recommendations.push({
        actionTitle: 'Verify Pending Statutory Documents',
        description: `${pendingDocs.length} documents (${pendingDocs.map(d => d.documentType.name).join(', ')}) require OCR verification or approval before advancing stage.`,
        priority: 'URGENT',
        category: 'DOCUMENT',
        actionPayload: { documentIds: pendingDocs.map(d => d.id) },
      });
    }

    // Check Invoices
    const unpaidInvoices = app.invoices.filter(i => i.status !== 'PAID');
    if (unpaidInvoices.length > 0) {
      recommendations.push({
        actionTitle: 'Collect Outstanding Service Fee',
        description: `Invoice ${unpaidInvoices[0].invoiceNumber} for ₹${Number(unpaidInvoices[0].amount).toLocaleString('en-IN')} is unpaid. Dispatch WhatsApp payment reminder.`,
        priority: 'HIGH',
        category: 'PAYMENT',
        actionPayload: { invoiceId: unpaidInvoices[0].id },
      });
    }

    // Check MCA / Filing readiness
    if (pendingDocs.length === 0 && unpaidInvoices.length === 0) {
      recommendations.push({
        actionTitle: 'Ready for Next Workflow Stage Transition',
        description: `All stage gates (Documents + Invoices) are satisfied. Advance ${app.applicationNumber} to the next operational phase.`,
        priority: 'HIGH',
        category: 'WORKFLOW',
        actionPayload: { stageId: app.workflowInstance?.currentStageId },
      });
    }

    // Statutory tips based on service
    if (app.service.slug?.includes('pvt-ltd')) {
      recommendations.push({
        actionTitle: 'Initiate SPICe+ Part A Name Reservation',
        description: 'Verify 2 proposed company names on MCA master data to avoid resubmission objections.',
        priority: 'MEDIUM',
        category: 'FILING',
      });
    } else if (app.service.slug?.includes('trademark')) {
      recommendations.push({
        actionTitle: 'Conduct Comprehensive NICE Class Search',
        description: 'Check IP India public search for identical phonetic marks in the target class.',
        priority: 'MEDIUM',
        category: 'FILING',
      });
    }

    return {
      applicationNumber: app.applicationNumber,
      currentStageName,
      recommendations,
    };
  }

  /**
   * 4. Search Compliance Knowledge Base
   */
  searchKnowledge(query: string): ComplianceKnowledgeItem[] {
    return this.findRelevantKnowledge(query);
  }

  /**
   * Private Helper: Search Knowledge Base
   */
  private findRelevantKnowledge(query: string): ComplianceKnowledgeItem[] {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      return COMPLIANCE_KNOWLEDGE_BASE.slice(0, 4);
    }

    const stopWords = new Set(['what', 'the', 'for', 'are', 'under', 'how', 'with', 'and', 'can', 'you', 'tell', 'about', 'explain', 'give', 'details', 'requirements']);
    const words = q.split(/[^a-z0-9+]+/).filter(w => w.length >= 2 && !stopWords.has(w));

    return COMPLIANCE_KNOWLEDGE_BASE.filter(item => {
      const fullText = `${item.topic} ${item.category} ${item.summary} ${item.keyRequirements.join(' ')} ${item.applicableActs.join(' ')}`.toLowerCase();
      if (fullText.includes(q)) return true;
      const matchCount = words.filter(w => fullText.includes(w)).length;
      return matchCount >= 1;
    });
  }

  /**
   * Private Helper: AI Response Generation
   */
  private generateCopilotResponse(
    userMessage: string,
    contextSummary: string,
    kbList: ComplianceKnowledgeItem[],
    application?: any,
    lead?: any,
  ): { reply: string; suggestedActions: string[]; draftPayload?: any } {
    const lower = userMessage.toLowerCase();

    // 1. Follow-up drafting query
    if (lower.includes('draft') || lower.includes('whatsapp') || lower.includes('email') || lower.includes('follow up') || lower.includes('remind')) {
      const isWhatsApp = lower.includes('whatsapp');
      const channel = isWhatsApp ? 'WHATSAPP' : 'EMAIL';
      const channelLabel = isWhatsApp ? 'WhatsApp' : 'Email';
      const clientName = application?.customer?.firstName || lead?.firstName || 'Client';
      const serviceName = application?.service?.name || lead?.serviceInterest || 'your compliance registration';

      let reply = `Here is a drafted ${channelLabel} follow-up for **${clientName}**:\n\n`;
      let draftText = '';

      if (isWhatsApp) {
        draftText = `Namaste ${clientName}! 📋\n\nRegarding your *${serviceName}* with Crazy Capital:\nKindly upload the required statutory documents so our team can initiate your government portal filing today.\n\n🔗 Upload here: https://crazycapital.in/customer/documents\n\nLet us know once done!`;
      } else {
        draftText = `Subject: Action Required: Mandatory Documents for ${serviceName}\n\nDear ${clientName},\n\nWe are ready to proceed with your ${serviceName}. Please upload the pending statutory documents to your secure vault (https://crazycapital.in/customer/documents).\n\nBest regards,\nCrazy Capital Team`;
      }

      reply += `> ${draftText.replace(/\n/g, '\n> ')}\n\nWould you like me to dispatch this through our notification gateway?`;

      return {
        reply,
        suggestedActions: [`Send via ${channelLabel}`, 'Edit Draft', 'View Application Hub'],
        draftPayload: { channel, body: draftText, recipientName: clientName },
      };
    }

    // 2. Statutory / Compliance Legal Query (Check KB if available)
    if (kbList.length > 0) {
      const topKb = kbList[0];
      let reply = `### ${topKb.topic}\n\n${topKb.summary}\n\n**Key Statutory Requirements:**\n`;
      for (const req of topKb.keyRequirements.slice(0, 5)) {
        reply += `• ${req}\n`;
      }
      reply += `\n**Statutory Timelines:** ${topKb.statutoryTimelines}\n`;
      if (topKb.penaltiesForNonCompliance) {
        reply += `**Compliance Alert:** ${topKb.penaltiesForNonCompliance}\n`;
      }

      return {
        reply,
        suggestedActions: ['Create Service Checklist', 'Draft Client Guide', 'Search Related Acts'],
      };
    }

    // 2. Next action / Status query
    if (lower.includes('next step') || lower.includes('what should i do') || lower.includes('status') || lower.includes('how to proceed')) {
      if (application) {
        const stageName = application.workflowInstance?.currentStage?.name || application.status;
        const pendingDocs = application.documents.filter((d: any) => d.status !== 'VERIFIED');

        let reply = `### Application Analysis for **${application.applicationNumber}**\n\n`;
        reply += `• **Current Stage:** ${stageName}\n`;
        reply += `• **Service:** ${application.service.name}\n`;
        reply += `• **Customer:** ${application.customer.firstName} ${application.customer.lastName}\n\n`;

        if (pendingDocs.length > 0) {
          reply += `⚠️ **Key Blocker:** There are ${pendingDocs.length} pending document(s) (${pendingDocs.map((d: any) => d.documentType.name).join(', ')}). Run OCR auto-verification or request re-upload.\n\n`;
        } else {
          reply += `✅ **Gate Status:** All mandatory documents and invoices are verified. You can safely advance to the next workflow stage.\n\n`;
        }

        reply += `**Recommended Operations Actions:**\n1. Run OCR batch check on uploaded client proofs.\n2. Send a WhatsApp progress summary to the client.\n3. Transition case to government portal filing queue.`;

        return {
          reply,
          suggestedActions: ['Run OCR Verification', 'Draft WhatsApp Update', 'Advance Workflow Stage'],
        };
      }
    }

    // 3. Statutory / Compliance Legal Query
    if (kbList.length > 0) {
      const topKb = kbList[0];
      let reply = `### ${topKb.topic}\n\n${topKb.summary}\n\n**Key Statutory Requirements:**\n`;
      for (const req of topKb.keyRequirements.slice(0, 5)) {
        reply += `• ${req}\n`;
      }
      reply += `\n**Statutory Timelines:** ${topKb.statutoryTimelines}\n`;
      if (topKb.penaltiesForNonCompliance) {
        reply += `**Compliance Alert:** ${topKb.penaltiesForNonCompliance}\n`;
      }

      return {
        reply,
        suggestedActions: ['Create Service Checklist', 'Draft Client Guide', 'Search Related Acts'],
      };
    }

    // Default General Assistant Reply
    let reply = `I am your **Crazy Capital AI Operations Copilot**.\n\nI can assist you with:\n• **Workflow Recommendations**: Analyzing stage blockers and gate rules\n• **Customer Communication**: Drafting personalized WhatsApp, Email, or SMS updates\n• **Indian Regulatory Compliance**: MCA SPICe+, GST REG-01, Trademark Class classification, DPIIT Startup benefits\n• **Document Intelligence**: Interpreting OCR extraction results and PAN/GST mismatches.`;

    if (contextSummary) {
      reply += `\n\n*Currently active context:* ${contextSummary}`;
    }

    return {
      reply,
      suggestedActions: ['Draft WhatsApp Reminder', 'Check Compliance Rules', 'Application Health Check'],
    };
  }
}
