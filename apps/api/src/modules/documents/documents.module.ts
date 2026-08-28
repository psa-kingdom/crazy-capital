import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { R2StorageService } from './storage/r2-storage.service';
import { DocumentTypesService } from './document-types.service';
import { DocumentTypesController } from './document-types.controller';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DocumentOcrService } from './document-ocr.service';
import { IntelligentOcrProvider } from './ocr/intelligent-ocr.provider';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [DocumentTypesController, DocumentsController],
  providers: [
    R2StorageService,
    DocumentTypesService,
    DocumentsService,
    DocumentOcrService,
    IntelligentOcrProvider,
  ],
  exports: [
    R2StorageService,
    DocumentTypesService,
    DocumentsService,
    DocumentOcrService,
  ],
})
export class DocumentsModule {}
