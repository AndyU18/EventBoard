import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { Severity } from '@prisma/client';

@Injectable()
export class EventStoreConsumer {
  private readonly logger = new Logger(EventStoreConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

  @OnEvent('internal.event.store')
  async handleRabbitEvent(payload: any) {
    this.logger.log(`[EventStore] Procesando evento desde RabbitMQ: ${payload.type}`);
    await this.saveEvent(payload);
  }

  @OnEvent('events.*')
  async handleLocalEvent(payload: any) {
    // Si RabbitMQ no está conectado, procesamos el evento local
    if (!this.messagingService.isConnected()) {
      this.logger.log(`[EventStore] Procesando evento local (fallback): ${payload.type}`);
      await this.saveEvent(payload);
    }
  }

  private async saveEvent(data: any) {
    try {
      const eventLog = await this.prisma.eventLog.create({
        data: {
          type: data.type,
          sourceModule: data.sourceModule || 'unknown',
          payload: data.payload || {},
          userId: data.userId || null,
          severity: (data.severity as Severity) || Severity.INFO,
        },
      });
      this.logger.log(`[EventStore] Evento guardado con éxito en DB: ID ${eventLog.id}`);
    } catch (error) {
      this.logger.error(`[EventStore] Error al guardar el evento en DB: ${(error as Error).message}`, error);
    }
  }
}
