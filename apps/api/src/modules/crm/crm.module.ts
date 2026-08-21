import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadSourcesService } from './lead-sources.service';
import { LeadSourcesController } from './lead-sources.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LeadsController, LeadSourcesController],
  providers: [LeadsService, LeadSourcesService],
  exports: [LeadsService, LeadSourcesService],
})
export class CrmModule {}
