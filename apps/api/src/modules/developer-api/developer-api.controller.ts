import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeveloperApiService } from './developer-api.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import {
  createApiKeySchema,
  createWebhookSubscriptionSchema,
  updateWebhookSubscriptionSchema,
} from '@cc/validation';
import {
  CreateApiKeyInput,
  CreateWebhookSubscriptionInput,
  UpdateWebhookSubscriptionInput,
} from '@cc/types';

@Controller('developer')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DeveloperApiController {
  constructor(private readonly developerApiService: DeveloperApiService) {}

  // ─── API Keys Endpoints ──────────────────────────────────────────────────

  @Get('keys')
  @RequirePermissions('system:manage')
  async listApiKeys(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.developerApiService.listApiKeys(organizationId);
  }

  @Post('keys')
  @RequirePermissions('system:manage')
  async createApiKey(@Req() req: any, @Body() body: any) {
    const validated = createApiKeySchema.parse(body);
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    return this.developerApiService.createApiKey(userId, organizationId, validated as CreateApiKeyInput);
  }

  @Delete('keys/:id')
  @RequirePermissions('system:manage')
  async revokeApiKey(@Req() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.developerApiService.revokeApiKey(organizationId, id);
  }

  // ─── Webhooks Endpoints ──────────────────────────────────────────────────

  @Get('webhooks')
  @RequirePermissions('system:manage')
  async listWebhooks(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.developerApiService.listWebhookSubscriptions(organizationId);
  }

  @Post('webhooks')
  @RequirePermissions('system:manage')
  async createWebhook(@Req() req: any, @Body() body: any) {
    const validated = createWebhookSubscriptionSchema.parse(body);
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    return this.developerApiService.createWebhookSubscription(userId, organizationId, validated as CreateWebhookSubscriptionInput);
  }

  @Patch('webhooks/:id')
  @RequirePermissions('system:manage')
  async updateWebhook(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const validated = updateWebhookSubscriptionSchema.parse(body);
    const organizationId = req.user.organizationId;
    return this.developerApiService.updateWebhookSubscription(organizationId, id, validated as UpdateWebhookSubscriptionInput);
  }

  @Delete('webhooks/:id')
  @RequirePermissions('system:manage')
  async deleteWebhook(@Req() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.developerApiService.deleteWebhookSubscription(organizationId, id);
  }

  @Post('webhooks/:id/test')
  @RequirePermissions('system:manage')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Req() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.developerApiService.testWebhookSubscription(organizationId, id);
  }

  @Get('webhooks/:id/deliveries')
  @RequirePermissions('system:manage')
  async getWebhookDeliveries(@Req() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.developerApiService.getWebhookDeliveries(organizationId, id);
  }

  // ─── Usage Stats ─────────────────────────────────────────────────────────

  @Get('usage')
  @RequirePermissions('system:manage')
  async getUsageStats(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.developerApiService.getUsageStats(organizationId);
  }
}
