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
var EventStoreConsumer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStoreConsumer = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const messaging_service_1 = require("../messaging/messaging.service");
const client_1 = require("@prisma/client");
let EventStoreConsumer = EventStoreConsumer_1 = class EventStoreConsumer {
    prisma;
    messagingService;
    logger = new common_1.Logger(EventStoreConsumer_1.name);
    constructor(prisma, messagingService) {
        this.prisma = prisma;
        this.messagingService = messagingService;
    }
    async handleRabbitEvent(payload) {
        this.logger.log(`[EventStore] Procesando evento desde RabbitMQ: ${payload.type}`);
        await this.saveEvent(payload);
    }
    async handleLocalEvent(payload) {
        if (!this.messagingService.isConnected()) {
            this.logger.log(`[EventStore] Procesando evento local (fallback): ${payload.type}`);
            await this.saveEvent(payload);
        }
    }
    async saveEvent(data) {
        if (data.isReplay) {
            this.logger.log(`[EventStore] Ignorando evento de repetición (Replay): ${data.type}`);
            return;
        }
        try {
            const eventLog = await this.prisma.eventLog.create({
                data: {
                    type: data.type,
                    sourceModule: data.sourceModule || 'unknown',
                    payload: data.payload || {},
                    userId: data.userId || null,
                    severity: data.severity || client_1.Severity.INFO,
                },
            });
            this.logger.log(`[EventStore] Evento guardado con éxito en DB: ID ${eventLog.id}`);
        }
        catch (error) {
            this.logger.error(`[EventStore] Error al guardar el evento en DB: ${error.message}`, error);
        }
    }
};
exports.EventStoreConsumer = EventStoreConsumer;
__decorate([
    (0, event_emitter_1.OnEvent)('internal.event.store'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventStoreConsumer.prototype, "handleRabbitEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('events.*'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventStoreConsumer.prototype, "handleLocalEvent", null);
exports.EventStoreConsumer = EventStoreConsumer = EventStoreConsumer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService])
], EventStoreConsumer);
//# sourceMappingURL=event-store.consumer.js.map