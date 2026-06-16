// src/infrastructure/services/PollExpirationScheduler.ts

import { IPollRepository } from '../../domain/repositories/IPollRepository';
import { ClosePollUseCase } from '../../application/use-cases/ClosePollUseCase';
import { ISubject } from '../../domain/observer/ISubject';
import { SOCKET_EVENTS } from '../../shared/constants';
import { logger } from '../../shared/logger';

export class PollExpirationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly pollRepo: IPollRepository,
    private readonly closePollUseCase: ClosePollUseCase,
    private readonly chatSubject: ISubject,
    private readonly intervalMs: number = 60_000 // 60 segundos por defecto
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }

    logger.info('PollExpirationScheduler: started');
    this.timer = setInterval(() => this.checkExpiredPolls(), this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('PollExpirationScheduler: stopped');
    }
  }

  private async checkExpiredPolls(): Promise<void> {
    // Evitar ejecuciones superpuestas si una corrida tarda más que el intervalo
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const expiredPolls = await this.pollRepo.listExpiredNotClosed();

      if (expiredPolls.length > 0) {
        logger.info(`PollExpirationScheduler: found ${expiredPolls.length} expired polls to close`);
      }

      for (const poll of expiredPolls) {
        try {
          const result = await this.closePollUseCase.execute(poll.id);

          // Notificar a través del subject para que se emita en tiempo real
          this.chatSubject.notify(SOCKET_EVENTS.WALL_POLL_CLOSED, {
            poll: result.poll,
            groupId: result.groupId,
          });

          logger.info(`PollExpirationScheduler: successfully closed poll ${poll.id}`);
        } catch (error: any) {
          logger.error(`PollExpirationScheduler: error closing poll ${poll.id}`, {
            error: error.message,
          });
        }
      }
    } catch (error: any) {
      logger.error('PollExpirationScheduler: error checking expired polls', {
        error: error.message,
      });
    } finally {
      this.isRunning = false;
    }
  }
}
