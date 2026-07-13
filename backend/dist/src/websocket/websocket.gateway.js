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
        client.join('room:all');
    }
    handleDisconnect(client) {
        this.logger.log(`Cliente desconectado de WebSocket: ID ${client.id}`);
    }
    handleRoomSubscription(client, room) {
        const rooms = Array.from(client.rooms);
        rooms.forEach((r) => {
            if (r.startsWith('room:')) {
                client.leave(r);
            }
        });
        client.join(room);
        this.logger.log(`Cliente ID ${client.id} se suscribió a la sala: ${room}`);
        return { success: true, room };
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
        this.logger.log(`[WebsocketGateway] Distribuyendo evento a salas correspondientes: ${payload.type}`);
        this.server.to('room:all').emit('event_received', payload);
        if (payload.severity === 'CRITICAL') {
            this.server.to('room:critical').emit('event_received', payload);
            this.server.to('room:warning-critical').emit('event_received', payload);
        }
        else if (payload.severity === 'WARNING') {
            this.server.to('room:warning-critical').emit('event_received', payload);
        }
        if (payload.sourceModule) {
            this.server.to(`room:${payload.sourceModule}`).emit('event_received', payload);
        }
    }
};
exports.WebsocketGateway = WebsocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_to_room'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleRoomSubscription", null);
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