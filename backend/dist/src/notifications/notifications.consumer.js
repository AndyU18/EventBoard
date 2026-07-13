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
var NotificationsConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsConsumer = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const messaging_service_1 = require("../messaging/messaging.service");
const client_1 = require("@prisma/client");
let NotificationsConsumer = NotificationsConsumer_1 = class NotificationsConsumer {
    prisma;
    messagingService;
    logger = new common_1.Logger(NotificationsConsumer_1.name);
    constructor(prisma, messagingService) {
        this.prisma = prisma;
        this.messagingService = messagingService;
    }
    async handleRabbitEvent(payload) {
        this.logger.log(`[Notifications] Evaluando alerta desde RabbitMQ: ${payload.type}`);
        await this.processNotification(payload);
    }
    async handleLocalEvent(payload) {
        if (!this.messagingService.isConnected()) {
            this.logger.log(`[Notifications] Evaluando alerta local (fallback): ${payload.type}`);
            await this.processNotification(payload);
        }
    }
    async handleDlqAlert(payload) {
        this.logger.warn(`[Notifications] Procesando alerta de DLQ: ${payload.payload.originalRoutingKey}`);
        try {
            const eventLog = await this.prisma.eventLog.create({
                data: {
                    type: 'DEAD_LETTER_EVENT',
                    sourceModule: 'rabbitmq',
                    payload: payload.payload,
                    severity: client_1.Severity.CRITICAL,
                },
            });
            const message = `🚨 [DLQ Alert]: Mensaje rechazado en la cola original. Reenviado a la DLQ. Routing Key original: "${payload.payload.originalRoutingKey}".`;
            await this.prisma.notification.create({
                data: {
                    recipient: 'admin@eventboard.com',
                    message,
                    status: client_1.NotificationStatus.SENT,
                    eventLogId: eventLog.id,
                },
            });
            this.logger.log(`[Notifications] Alerta de DLQ registrada exitosamente en DB: ID ${eventLog.id}`);
        }
        catch (error) {
            this.logger.error(`[Notifications] Error al registrar alerta de DLQ: ${error.message}`, error);
        }
    }
    async processNotification(data) {
        if (data.isReplay) {
            this.logger.log(`[Notifications] Ignorando alerta de repetición (Replay): ${data.type}`);
            return;
        }
        const isCritical = data.severity === client_1.Severity.CRITICAL || data.severity === client_1.Severity.WARNING;
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
                        status: client_1.NotificationStatus.SENT,
                        eventLogId: eventLog.id,
                    },
                });
                this.logger.log(`[Notifications] Notificación guardada exitosamente en DB para evento ${eventLog.id}`);
            }
            catch (error) {
                this.logger.error(`[Notifications] Error al procesar la notificación: ${error.message}`, error);
            }
        }
    }
    async findEventLogWithRetry(type, createdAtStr, retries = 3) {
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
            if (log)
                return log;
            await new Promise((resolve) => setTimeout(resolve, 150));
        }
        return null;
    }
};
exports.NotificationsConsumer = NotificationsConsumer;
__decorate([
    (0, event_emitter_1.OnEvent)('internal.notifications'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsConsumer.prototype, "handleRabbitEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('events.*'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsConsumer.prototype, "handleLocalEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('internal.dlq.alert'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsConsumer.prototype, "handleDlqAlert", null);
exports.NotificationsConsumer = NotificationsConsumer = NotificationsConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService])
], NotificationsConsumer);
//# sourceMappingURL=notifications.consumer.js.map