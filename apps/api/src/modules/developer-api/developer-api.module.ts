import { Module } from '@nestjs/common';
import { DeveloperApiService } from './developer-api.service';
import { DeveloperApiController } from './developer-api.controller';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeveloperApiController],
  providers: [DeveloperApiService, ApiKeyAuthGuard],
  exports: [DeveloperApiService, ApiKeyAuthGuard],
})
export class DeveloperApiModule {}
