import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Invoices & Billing')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @RequirePermissions('invoice.create')
  @ApiOperation({ summary: 'Generate a new invoice with automated GST breakdown' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: any) {
    return this.invoicesService.create(dto, user);
  }

  @Get()
  @RequirePermissions('invoice.read')
  @ApiOperation({ summary: 'List and search invoices with pagination and status filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of invoices' })
  findAll(@Query() query: QueryInvoicesDto, @CurrentUser() user: any) {
    return this.invoicesService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('invoice.read')
  @ApiOperation({ summary: 'Get invoice details by ID with line items and payments' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoicesService.findOne(id, user);
  }

  @Patch(':id/status')
  @RequirePermissions('invoice.update')
  @ApiOperation({ summary: 'Update invoice status (e.g. mark SENT or CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Invoice status updated' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.updateStatus(id, dto, user);
  }
}

