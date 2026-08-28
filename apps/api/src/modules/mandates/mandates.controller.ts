import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MandatesService } from './mandates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  createSubscriptionMandateSchema,
  executeMandateDebitSchema,
  updateSubscriptionMandateStatusSchema,
} from '@cc/validation';

@Controller('mandates')
@UseGuards(JwtAuthGuard, RbacGuard)
export class MandatesController {
  constructor(private readonly mandatesService: MandatesService) {}

  @Post()
  @RequirePermissions('system:manage')
  @HttpCode(HttpStatus.CREATED)
  async createMandate(
    @CurrentUser('organizationId') organizationId: string,
    @Body() body: any,
  ) {
    const validated = createSubscriptionMandateSchema.parse(body);
    const result = await this.mandatesService.createMandate(organizationId, validated as any);
    return {
      success: true,
      data: result,
      message: 'Subscription mandate created successfully',
    };
  }

  @Get()
  @RequirePermissions('system:view')
  async listMandates(
    @CurrentUser('organizationId') organizationId: string,
    @Query('customerId') customerId?: string,
  ) {
    const data = await this.mandatesService.listMandates(organizationId, customerId);
    return {
      success: true,
      data,
    };
  }

  @Post(':id/debit')
  @RequirePermissions('system:manage')
  @HttpCode(HttpStatus.OK)
  async executeDebit(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') mandateId: string,
    @Body() body: any,
  ) {
    const validated = executeMandateDebitSchema.parse({ ...body, mandateId });
    const result = await this.mandatesService.executeDebit(organizationId, mandateId, validated as any);
    return {
      success: true,
      data: result,
    };
  }

  @Patch(':id/status')
  @RequirePermissions('system:manage')
  async updateStatus(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') mandateId: string,
    @Body() body: any,
  ) {
    const validated = updateSubscriptionMandateStatusSchema.parse(body);
    const result = await this.mandatesService.updateStatus(
      organizationId,
      mandateId,
      validated.status as any,
    );
    return {
      success: true,
      data: result,
    };
  }
}
