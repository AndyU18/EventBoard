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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const messaging_service_1 = require("../messaging/messaging.service");
const publish_event_dto_1 = require("./dto/publish-event.dto");
const event_schema_registry_1 = require("./event-schema-registry");
let EventsController = class EventsController {
    messagingService;
    constructor(messagingService) {
        this.messagingService = messagingService;
    }
    async publishEvent(publishEventDto) {
        const validatedPayload = (0, event_schema_registry_1.validateEventPayload)(publishEventDto.type, publishEventDto.payload);
        const eventMessage = {
            ...publishEventDto,
            payload: validatedPayload,
            createdAt: new Date().toISOString(),
        };
        const routingKey = `events.${publishEventDto.type.toLowerCase()}`;
        await this.messagingService.publish(routingKey, eventMessage);
        return {
            success: true,
            message: `Evento de tipo '${publishEventDto.type}' publicado con routingKey '${routingKey}'`,
            rabbitmqConnected: this.messagingService.isConnected(),
            data: eventMessage,
        };
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Post)('publish'),
    (0, swagger_1.ApiOperation)({ summary: 'Simular y publicar un evento en el bus' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Evento publicado en el bus con éxito.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Datos del evento inválidos.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [publish_event_dto_1.PublishEventDto]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "publishEvent", null);
exports.EventsController = EventsController = __decorate([
    (0, swagger_1.ApiTags)('Simulador de Eventos'),
    (0, common_1.Controller)('events'),
    __metadata("design:paramtypes", [messaging_service_1.MessagingService])
], EventsController);
//# sourceMappingURL=events.controller.js.map