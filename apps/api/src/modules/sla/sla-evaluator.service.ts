import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SlaService } from './sla.service';

@Injectable()
export class SlaEvaluatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SlaEvaluatorService.name);
  private timer: NodeJS.Timeout | null = null;
  private isEvaluating = false;

  constructor(private readonly slaService: SlaService) {}

  onModuleInit() {
    const intervalMs = Number(process.env.SLA_EVAL_INTERVAL_MS) || 60000;
    this.logger.log(`Initializing SLA Evaluator background engine (Interval: ${intervalMs}ms)...`);

    // Initial check after 5s
    setTimeout(() => {
      this.runEvaluationCycle();
    }, 5000);

    this.timer = setInterval(() => {
      this.runEvaluationCycle();
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.logger.log('SLA Evaluator background engine stopped.');
    }
  }

  private async runEvaluationCycle() {
    if (this.isEvaluating) return;
    this.isEvaluating = true;

    try {
      await this.slaService.evaluateAllActiveWorkflows();
    } catch (err: any) {
      this.logger.error(`Error in SLA evaluation cycle: ${err.message}`, err.stack);
    } finally {
      this.isEvaluating = false;
    }
  }
}
