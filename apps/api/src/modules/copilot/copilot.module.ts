import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AiCopilotService } from './ai-copilot.service';
import { CopilotController } from './copilot.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CopilotController],
  providers: [AiCopilotService],
  exports: [AiCopilotService],
})
export class CopilotModule {}
