import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { DocumentsService } from './documents.service';
import { DocumentOcrService } from './document-ocr.service';
import { RequestPresignedUploadDto } from './dto/request-presigned-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { RejectDocumentDto } from './dto/reject-document.dto';
import { QueryDocumentsDto } from './dto/query-documents.dto';

@ApiTags('Document Vault')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentOcrService: DocumentOcrService,
  ) {}

  @Post('presigned-upload')
  @RequirePermissions('document.upload')
  @ApiOperation({ summary: 'Request a secure presigned upload URL for direct S3/R2 binary upload' })
  requestPresignedUpload(
    @Body() dto: RequestPresignedUploadDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.requestPresignedUpload(dto, user);
  }

  @Post(':id/confirm-upload')
  @RequirePermissions('document.upload')
  @ApiOperation({ summary: 'Confirm that client direct upload to storage was completed' })
  async confirmUpload(
    @Param('id') id: string,
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: any,
  ) {
    const res = await this.documentsService.confirmUpload(id, dto, user);
    // Asynchronously trigger OCR extraction
    this.documentOcrService.processDocumentOcr(id, user).catch(() => {});
    return res;
  }

  @Get(':id/preview-url')
  @RequirePermissions('document.read')
  @ApiOperation({ summary: 'Get a temporary, secure presigned download/preview URL' })
  getPreviewUrl(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.getPreviewUrl(id, user);
  }

  @Post(':id/ocr')
  @RequirePermissions('document.read')
  @ApiOperation({ summary: 'Run OCR extraction & statutory matching on document' })
  runOcr(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentOcrService.processDocumentOcr(id, user);
  }

  @Get(':id/ocr')
  @RequirePermissions('document.read')
  @ApiOperation({ summary: 'Get latest OCR results, extracted fields, and match status' })
  getOcrResult(@Param('id') id: string) {
    return this.documentOcrService.getOcrResult(id);
  }

  @Patch(':id/auto-verify')
  @RequirePermissions('document.verify')
  @ApiOperation({ summary: 'Apply OCR Auto-Verification or manual verification override' })
  autoVerify(
    @Param('id') id: string,
    @Body() body: { remarks?: string; overrideDecision?: 'APPROVE' | 'REJECT' },
    @CurrentUser() user: any,
  ) {
    return this.documentOcrService.autoVerify(id, body?.remarks, body?.overrideDecision, user);
  }

  @Patch(':id/verify')
  @RequirePermissions('document.verify')
  @ApiOperation({ summary: 'Verify document (Operations / Compliance Officer only)' })
  verifyDocument(
    @Param('id') id: string,
    @Body() dto: VerifyDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.verifyDocument(id, dto, user);
  }

  @Patch(':id/reject')
  @RequirePermissions('document.verify')
  @ApiOperation({ summary: 'Reject document with structured reason (Operations / Compliance Officer only)' })
  rejectDocument(
    @Param('id') id: string,
    @Body() dto: RejectDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.rejectDocument(id, dto, user);
  }

  @Get()
  @RequirePermissions('document.read')
  @ApiOperation({ summary: 'List and search documents in the vault with tenant and branch isolation' })
  findAll(@Query() query: QueryDocumentsDto, @CurrentUser() user: any) {
    return this.documentsService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('document.read')
  @ApiOperation({ summary: 'Get document details and verification audit trail' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.findOne(id, user);
  }

  @Delete(':id')
  @RequirePermissions('document.delete')
  @ApiOperation({ summary: 'Delete document from vault and object storage' })
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.delete(id, user);
  }
}
