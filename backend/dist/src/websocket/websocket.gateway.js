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
var WebsocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const messaging_service_1 = require("../messaging/messaging.service");
let WebsocketGateway = WebsocketGateway_1 = class WebsocketGateway {
    messagingService;
    logger = new common_1.Logger(WebsocketGateway_1.name);
    server;
    constructor(messagingService) {
        this.messagingService = messagingService;
    }
    handleConnection(client) {
        this.logger.log(`Cliente conectado por WebSocket: ID ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Cliente desconectado de WebSocket: ID ${client.id}`);
    }
    async handleRabbitEvent(payload) {
        this.broadcastEvent(payload);
    }
    async handleLocalEvent(payload) {
        if (!this.messagingService.isConnected()) {
            this.broadcastEvent(payload);
        }
    }
    broadcastEvent(payload) {
        this.logger.log(`[WebsocketGateway] Emitiendo evento en tiempo real a clientes: ${payload.type}`);
        this.server.emit('event_received', payload);
    }
};
exports.WebsocketGateway = WebsocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, event_emitter_1.OnEvent)('internal.event.store'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleRabbitEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('events.*'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleLocalEvent", null);
exports.WebsocketGateway = WebsocketGateway = WebsocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [messaging_service_1.MessagingService])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map