import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { DocumentTypesService } from './document-types.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';

@ApiTags('Document Types')
@Controller('document-types')
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all standard and custom KYC/compliance document types' })
  findAll() {
    return this.documentTypesService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get document type by UUID' })
  findOne(@Param('id') id: string) {
    return this.documentTypesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @RequirePermissions('document_type.create')
  @ApiOperation({ summary: 'Create a new document type (Admin only)' })
  create(@Body() dto: CreateDocumentTypeDto) {
    return this.documentTypesService.create(dto);
  }

  @Post('seed-defaults')
  @ApiBearerAuth()
  @RequirePermissions('document_type.manage')
  @ApiOperation({ summary: 'Seed standard Indian compliance document types (Admin only)' })
  seedDefaults() {
    return this.documentTypesService.seedDefaults();
  }
}
