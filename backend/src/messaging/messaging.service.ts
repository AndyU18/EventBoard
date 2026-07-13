import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { connect } from 'amqplib';

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private connection: any = null;
  private channel: any = null;
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
      
      this.connection = await connect(amqpUrl);
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

    const dlxExchangeName = 'dlx-exchange';
    const dlqQueueName = 'dlq-queue';

    // 1. Declarar Dead Letter Exchange (DLX)
    await this.channel.assertExchange(dlxExchangeName, 'topic', { durable: true });

    // 2. Declarar Dead Letter Queue (DLQ)
    await this.channel.assertQueue(dlqQueueName, { durable: true });

    // 3. Enlazar la DLQ con el DLX para recibir eventos rechazados
    await this.channel.bindQueue(dlqQueueName, dlxExchangeName, 'dead-letter.#');

    // Consumidor de la DLQ para registrar alertas del sistema
    const dlqChannel = this.channel;
    await dlqChannel.consume(dlqQueueName, (msg: any) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          const originalRoutingKey = msg.fields.routingKey;
          this.logger.error(`🚨 [DLQ - MESSAGE REJECTED] Mensaje desviado a la DLQ. Routing Key original: ${originalRoutingKey}. Payload: ${JSON.stringify(content)}`);
          
          // Emitir alerta de DLQ interna
          this.eventEmitter.emit('internal.dlq.alert', {
            type: 'DEAD_LETTER_EVENT',
            sourceModule: 'rabbitmq',
            payload: {
              originalRoutingKey,
              originalMessage: content,
              deathReason: 'rejected_by_consumer_rules',
            },
            severity: 'CRITICAL',
            createdAt: new Date().toISOString(),
          });
          
          dlqChannel.ack(msg);
        } catch (err) {
          this.logger.error('Error procesando mensaje en la DLQ', err);
          dlqChannel.ack(msg);
        }
      }
    });

    // 4. Cola para el Event Store (configurada con DLX)
    const eventStoreQueue = 'event-store-queue';
    await this.channel.assertQueue(eventStoreQueue, { 
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxExchangeName,
        'x-dead-letter-routing-key': 'dead-letter.event-store',
      }
    });
    await this.channel.bindQueue(eventStoreQueue, this.exchangeName, 'events.*');
    
    const storeChannel = this.channel;
    await storeChannel.consume(eventStoreQueue, (msg: any) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          this.logger.log(`[RabbitMQ Consumer] Recibido en ${eventStoreQueue}: ${content.type}`);
          
          // Simulación académica de error de procesamiento
          if (content.payload && content.payload.simulate_error === true) {
            throw new Error('Simulated processing failure for DLQ demonstration');
          }
          
          this.eventEmitter.emit('internal.event.store', content);
          storeChannel.ack(msg);
        } catch (err) {
          this.logger.error(`[RabbitMQ Consumer] Error procesando mensaje de ${eventStoreQueue}: ${(err as Error).message}. Enviando a DLQ.`);
          // nack con requeue=false desvía a la DLQ
          storeChannel.nack(msg, false, false);
        }
      }
    });

    // 5. Cola para Notificaciones (configurada con DLX)
    const notificationsQueue = 'notifications-queue';
    await this.channel.assertQueue(notificationsQueue, { 
      durable: true,
      arguments: {
        'x-dead-letter-exchange': dlxExchangeName,
        'x-dead-letter-routing-key': 'dead-letter.notifications',
      }
    });
    await this.channel.bindQueue(notificationsQueue, this.exchangeName, 'events.*');

    const notifChannel = this.channel;
    await notifChannel.consume(notificationsQueue, (msg: any) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          this.logger.log(`[RabbitMQ Consumer] Recibido en ${notificationsQueue}: ${content.type}`);
          
          if (content.payload && content.payload.simulate_error === true) {
            throw new Error('Simulated notification processing failure for DLQ');
          }

          this.eventEmitter.emit('internal.notifications', content);
          notifChannel.ack(msg);
        } catch (err) {
          this.logger.error(`[RabbitMQ Consumer] Error procesando mensaje de ${notificationsQueue}: ${(err as Error).message}. Enviando a DLQ.`);
          notifChannel.nack(msg, false, false);
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
