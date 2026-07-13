import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { Severity, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsConsumer {
  private readonly logger = new Logger(NotificationsConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

  @OnEvent('internal.notifications')
  async handleRabbitEvent(payload: any) {
    this.logger.log(`[Notifications] Evaluando alerta desde RabbitMQ: ${payload.type}`);
    await this.processNotification(payload);
  }

  @OnEvent('events.*')
  async handleLocalEvent(payload: any) {
    if (!this.messagingService.isConnected()) {
      this.logger.log(`[Notifications] Evaluando alerta local (fallback): ${payload.type}`);
      await this.processNotification(payload);
    }
  }

  private async processNotification(data: any) {
    const isCritical = data.severity === Severity.CRITICAL || data.severity === Severity.WARNING;
    const isSystemAlert = data.type && data.type.startsWith('SYSTEM_ALERT');

    if (isCritical || isSystemAlert) {
      try {
        let eventLog = await this.findEventLogWithRetry(data.type, data.createdAt);

        if (!eventLog) {
          this.logger.warn(`[Notifications] No se encontró el EventLog en base de datos para crear la notificación.`);
          return;
        }

        const message = `Alerta Detectada: El módulo "${data.sourceModule}" ha emitido un evento de tipo "${data.type}" con severidad "${data.severity}".`;
        
        await this.prisma.notification.create({
          data: {
            recipient: 'admin@eventboard.com',
            message,
            status: NotificationStatus.SENT,
            eventLogId: eventLog.id,
          },
        });

        this.logger.log(`[Notifications] Notificación guardada exitosamente en DB para evento ${eventLog.id}`);
      } catch (error) {
        this.logger.error(`[Notifications] Error al procesar la notificación: ${(error as Error).message}`, error);
      }
    }
  }

  private async findEventLogWithRetry(type: string, createdAtStr: string, retries = 3): Promise<any> {
    const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();
    
    for (let i = 0; i < retries; i++) {
      const log = await this.prisma.eventLog.findFirst({
        where: {
          type,
          createdAt: {
            gte: new Date(createdAt.getTime() - 2000),
            lte: new Date(createdAt.getTime() + 2000),
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (log) return log;

      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return null;
  }
}
