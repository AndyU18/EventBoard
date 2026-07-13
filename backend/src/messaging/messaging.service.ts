import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as amqp from 'amqplib';

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isRabbitConnected = false;

  private readonly exchangeName = 'eventboard-exchange';

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async onModuleInit() {
    const amqpUrl = process.env.RABBITMQ_URL;
    if (!amqpUrl) {
      this.logger.warn('RABBITMQ_URL no configurada. Usando fallback en memoria (EventEmitter).');
      return;
    }

    try {
      this.logger.log(`Intentando conectar a RabbitMQ en: ${amqpUrl}`);
      
      // Conectar a RabbitMQ con un tiempo de espera implícito
      this.connection = await amqp.connect(amqpUrl);
      this.channel = await this.connection.createChannel();

      // Declarar el exchange de tipo 'topic'
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });

      this.isRabbitConnected = true;
      this.logger.log('Conexión a RabbitMQ establecida correctamente.');

      // Configurar consumidores
      await this.setupConsumers();
    } catch (error) {
      this.logger.error(
        `Error al conectar a RabbitMQ: ${(error as Error).message}. Activando fallback local (EventEmitter).`,
      );
      this.isRabbitConnected = false;
      this.connection = null;
      this.channel = null;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (e) {
      this.logger.error('Error al cerrar la conexión de RabbitMQ', e);
    }
  }

  /**
   * Publica un evento en el bus.
   * Si RabbitMQ está conectado, se publica allí.
   * De lo contrario, se emite localmente usando el EventEmitter de NestJS.
   */
  async publish(routingKey: string, message: any) {
    const payloadBuffer = Buffer.from(JSON.stringify(message));
    
    if (this.isRabbitConnected && this.channel) {
      try {
        this.channel.publish(this.exchangeName, routingKey, payloadBuffer, {
          persistent: true,
        });
        this.logger.log(`[RabbitMQ] Evento publicado con key "${routingKey}": ${JSON.stringify(message)}`);
        return;
      } catch (err) {
        this.logger.error(`[RabbitMQ] Error al publicar, recurriendo a emisor local: ${(err as Error).message}`);
      }
    }

    // Fallback: emitir localmente con EventEmitter2
    this.logger.log(`[Local Bus] Emitiendo evento local "${routingKey}": ${JSON.stringify(message)}`);
    this.eventEmitter.emit(routingKey, message);
  }

  /**
   * Configura las colas y los consumidores en RabbitMQ.
   */
  private async setupConsumers() {
    if (!this.channel) return;

    // 1. Cola para el Event Store (guardar en base de datos)
    const eventStoreQueue = 'event-store-queue';
    await this.channel.assertQueue(eventStoreQueue, { durable: true });
    await this.channel.bindQueue(eventStoreQueue, this.exchangeName, 'events.*');
    
    this.channel.consume(eventStoreQueue, (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          this.logger.log(`[RabbitMQ Consumer] Recibido en ${eventStoreQueue}: ${content.type}`);
          this.eventEmitter.emit('internal.event.store', content);
          this.channel?.ack(msg);
        } catch (err) {
          this.logger.error(`Error procesando mensaje de ${eventStoreQueue}`, err);
          this.channel?.nack(msg, false, false);
        }
      }
    });

    // 2. Cola para Notificaciones
    const notificationsQueue = 'notifications-queue';
    await this.channel.assertQueue(notificationsQueue, { durable: true });
    await this.channel.bindQueue(notificationsQueue, this.exchangeName, 'events.*');

    this.channel.consume(notificationsQueue, (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          this.logger.log(`[RabbitMQ Consumer] Recibido en ${notificationsQueue}: ${content.type}`);
          this.eventEmitter.emit('internal.notifications', content);
          this.channel?.ack(msg);
        } catch (err) {
          this.logger.error(`Error procesando mensaje de ${notificationsQueue}`, err);
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }

  /**
   * Indica si la conexión a RabbitMQ está activa.
   */
  isConnected(): boolean {
    return this.isRabbitConnected;
  }
}
