import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MessagingService } from '../messaging/messaging.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly messagingService: MessagingService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado por WebSocket: ID ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado de WebSocket: ID ${client.id}`);
  }

  @OnEvent('internal.event.store')
  async handleRabbitEvent(payload: any) {
    this.broadcastEvent(payload);
  }

  @OnEvent('events.*')
  async handleLocalEvent(payload: any) {
    if (!this.messagingService.isConnected()) {
      this.broadcastEvent(payload);
    }
  }

  private broadcastEvent(payload: any) {
    this.logger.log(`[WebsocketGateway] Emitiendo evento en tiempo real a clientes: ${payload.type}`);
    this.server.emit('event_received', payload);
  }
}
