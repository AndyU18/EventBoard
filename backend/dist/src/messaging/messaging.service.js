"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessagingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const amqplib_1 = require("amqplib");
let MessagingService = MessagingService_1 = class MessagingService {
    eventEmitter;
    logger = new common_1.Logger(MessagingService_1.name);
    connection = null;
    channel = null;
    isRabbitConnected = false;
    exchangeName = 'eventboard-exchange';
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    async onModuleInit() {
        const amqpUrl = process.env.RABBITMQ_URL;
        if (!amqpUrl) {
            this.logger.warn('RABBITMQ_URL no configurada. Usando fallback en memoria (EventEmitter).');
            return;
        }
        try {
            this.logger.log(`Intentando conectar a RabbitMQ en: ${amqpUrl}`);
            this.connection = await (0, amqplib_1.connect)(amqpUrl);
            this.channel = await this.connection.createChannel();
            await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
            this.isRabbitConnected = true;
            this.logger.log('Conexión a RabbitMQ establecida correctamente.');
            await this.setupConsumers();
        }
        catch (error) {
            this.logger.error(`Error al conectar a RabbitMQ: ${error.message}. Activando fallback local (EventEmitter).`);
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
        }
        catch (e) {
            this.logger.error('Error al cerrar la conexión de RabbitMQ', e);
        }
    }
    async publish(routingKey, message) {
        const payloadBuffer = Buffer.from(JSON.stringify(message));
        if (this.isRabbitConnected && this.channel) {
            try {
                this.channel.publish(this.exchangeName, routingKey, payloadBuffer, {
                    persistent: true,
                });
                this.logger.log(`[RabbitMQ] Evento publicado con key "${routingKey}": ${JSON.stringify(message)}`);
                return;
            }
            catch (err) {
                this.logger.error(`[RabbitMQ] Error al publicar, recurriendo a emisor local: ${err.message}`);
            }
        }
        this.logger.log(`[Local Bus] Emitiendo evento local "${routingKey}": ${JSON.stringify(message)}`);
        this.eventEmitter.emit(routingKey, message);
    }
    async setupConsumers() {
        if (!this.channel)
            return;
        const dlxExchangeName = 'dlx-exchange';
        const dlqQueueName = 'dlq-queue';
        await this.channel.assertExchange(dlxExchangeName, 'topic', { durable: true });
        await this.channel.assertQueue(dlqQueueName, { durable: true });
        await this.channel.bindQueue(dlqQueueName, dlxExchangeName, 'dead-letter.#');
        const dlqChannel = this.channel;
        await dlqChannel.consume(dlqQueueName, (msg) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    const originalRoutingKey = msg.fields.routingKey;
                    this.logger.error(`🚨 [DLQ - MESSAGE REJECTED] Mensaje desviado a la DLQ. Routing Key original: ${originalRoutingKey}. Payload: ${JSON.stringify(content)}`);
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
                }
                catch (err) {
                    this.logger.error('Error procesando mensaje en la DLQ', err);
                    dlqChannel.ack(msg);
                }
            }
        });
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
        await storeChannel.consume(eventStoreQueue, (msg) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    this.logger.log(`[RabbitMQ Consumer] Recibido en ${eventStoreQueue}: ${content.type}`);
                    if (content.payload && content.payload.simulate_error === true) {
                        throw new Error('Simulated processing failure for DLQ demonstration');
                    }
                    this.eventEmitter.emit('internal.event.store', content);
                    storeChannel.ack(msg);
                }
                catch (err) {
                    this.logger.error(`[RabbitMQ Consumer] Error procesando mensaje de ${eventStoreQueue}: ${err.message}. Enviando a DLQ.`);
                    storeChannel.nack(msg, false, false);
                }
            }
        });
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
        await notifChannel.consume(notificationsQueue, (msg) => {
            if (msg) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    this.logger.log(`[RabbitMQ Consumer] Recibido en ${notificationsQueue}: ${content.type}`);
                    if (content.payload && content.payload.simulate_error === true) {
                        throw new Error('Simulated notification processing failure for DLQ');
                    }
                    this.eventEmitter.emit('internal.notifications', content);
                    notifChannel.ack(msg);
                }
                catch (err) {
                    this.logger.error(`[RabbitMQ Consumer] Error procesando mensaje de ${notificationsQueue}: ${err.message}. Enviando a DLQ.`);
                    notifChannel.nack(msg, false, false);
                }
            }
        });
    }
    isConnected() {
        return this.isRabbitConnected;
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map