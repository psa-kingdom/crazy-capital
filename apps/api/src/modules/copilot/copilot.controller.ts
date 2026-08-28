import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiCopilotService } from './ai-copilot.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtPayload } from '@cc/types';

@ApiTags('AI Operations Copilot')
@ApiBearerAuth('bearer')
@Controller('copilot')
export class CopilotController {
  constructor(private readonly copilotService: AiCopilotService) {}

  @Post('chat')
  @RequirePermissions('application.read')
  @ApiOperation({
    summary: 'Multi-turn AI Operations Copilot chat',
    description: 'Ask compliance questions, analyze workflows, or draft client messages.',
  })
  @ApiResponse({ status: 200, description: 'Copilot synthesis response' })
  async chat(
    @Body() body: { sessionId?: string; message: string; contextType?: string; contextId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.copilotService.chat(body, {
      organizationId: user.organizationId,
      id: user.sub,
      firstName: (user as any).firstName,
    });
  }

  @Post('draft-followup')
  @RequirePermissions('application.read')
  @ApiOperation({
    summary: 'Generate personalized Email, WhatsApp, or SMS communication draft',
  })
  @ApiResponse({ status: 200, description: 'Personalized message payload' })
  async draftFollowup(
    @Body() body: {
      leadId?: string;
      applicationId?: string;
      channel: 'EMAIL' | 'WHATSAPP' | 'SMS';
      intent: 'DOCUMENT_MISSING' | 'PAYMENT_PENDING' | 'STAGE_UPDATE' | 'WELCOME_PROPOSAL' | 'GENERAL';
      customInstructions?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.copilotService.draftFollowup(body, {
      organizationId: user.organizationId,
      id: user.sub,
    });
  }

  @Get('suggest-action/:applicationId')
  @RequirePermissions('application.read')
  @ApiOperation({
    summary: 'Analyze application state and get prioritized operations recommendations',
  })
  @ApiResponse({ status: 200, description: 'Top recommended actions' })
  async suggestAction(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.copilotService.suggestNextAction(applicationId, {
      organizationId: user.organizationId,
    });
  }

  @Get('knowledge')
  @RequirePermissions('application.read')
  @ApiOperation({
    summary: 'Search Indian statutory compliance and regulatory knowledge base',
  })
  @ApiResponse({ status: 200, description: 'List of matching compliance rules' })
  searchKnowledge(@Query('q') query?: string) {
    return this.copilotService.searchKnowledge(query || '');
  }
}
