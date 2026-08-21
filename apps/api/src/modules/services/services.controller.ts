import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';
import { CreateServiceDocumentDto } from './dto/create-service-document.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('Service Catalog')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiBearerAuth()
  @RequirePermissions('service.manage')
  @ApiOperation({ summary: 'Create a new service with pricing and doc requirements (Admin only)' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  async create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List services with pagination, category filter and search (Public)' })
  async findAll(@Query() query: QueryServicesDto) {
    // If not authenticated admin, onlyActive is enforced
    const onlyActive = query.isActive !== undefined ? query.isActive : true;
    return this.servicesService.findAll(query, onlyActive);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get service detail by ID with pricing, doc requirements and workflow blueprint (Public)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @RequirePermissions('service.manage')
  @ApiOperation({ summary: 'Update service metadata (Admin only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @RequirePermissions('service.manage')
  @ApiOperation({ summary: 'Toggle service active / inactive status (Admin only)' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.servicesService.updateStatus(id, isActive);
  }

  @Post(':id/pricing')
  @ApiBearerAuth()
  @RequirePermissions('service.manage')
  @ApiOperation({ summary: 'Add or update service pricing tier (Admin only)' })
  async addPricing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServicePricingDto,
  ) {
    return this.servicesService.addPricing(id, dto);
  }

  @Post(':id/documents')
  @ApiBearerAuth()
  @RequirePermissions('service.manage')
  @ApiOperation({ summary: 'Add required document type to service (Admin only)' })
  async addRequiredDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceDocumentDto,
  ) {
    return this.servicesService.addRequiredDocument(id, dto);
  }

  @Delete(':id/documents/:documentTypeId')
  @ApiBearerAuth()
  @RequirePermissions('service.manage')
  @ApiOperation({ summary: 'Remove document requirement from service (Admin only)' })
  async removeRequiredDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('documentTypeId', ParseUUIDPipe) documentTypeId: string,
  ) {
    return this.servicesService.removeRequiredDocument(id, documentTypeId);
  }
}
