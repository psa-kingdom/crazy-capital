import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LeadSourcesService } from './lead-sources.service';
import { CreateLeadSourceDto, UpdateLeadSourceDto } from './dto/lead-source.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('CRM / Lead Sources')
@Controller('lead-sources')
export class LeadSourcesController {
  constructor(private readonly leadSourcesService: LeadSourcesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all active lead sources (ADR-013)' })
  @ApiResponse({ status: 200, description: 'List of configured lead sources' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.leadSourcesService.findAll(includeInactive === 'true');
  }

  @ApiBearerAuth('bearer')
  @Get(':id')
  @RequirePermissions('lead.view')
  @ApiOperation({ summary: 'Get lead source by ID' })
  @ApiResponse({ status: 200, description: 'Lead source details' })
  async findOne(@Param('id') id: string) {
    return this.leadSourcesService.findOne(id);
  }

  @ApiBearerAuth('bearer')
  @Post()
  @RequirePermissions('user.manage')
  @ApiOperation({ summary: 'Create new lead source (Admin only)' })
  @ApiResponse({ status: 201, description: 'Lead source created successfully' })
  async create(@Body() dto: CreateLeadSourceDto) {
    return this.leadSourcesService.create(dto);
  }

  @ApiBearerAuth('bearer')
  @Patch(':id')
  @RequirePermissions('user.manage')
  @ApiOperation({ summary: 'Update lead source (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lead source updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateLeadSourceDto) {
    return this.leadSourcesService.update(id, dto);
  }

  @ApiBearerAuth('bearer')
  @Delete(':id')
  @RequirePermissions('user.manage')
  @ApiOperation({ summary: 'Delete or deactivate lead source (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lead source removed/deactivated' })
  async remove(@Param('id') id: string) {
    return this.leadSourcesService.remove(id);
  }
}
