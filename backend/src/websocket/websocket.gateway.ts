import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  SubscribeMessage 
} from '@nestjs/websockets';
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
    // Por defecto, suscribir al cliente a la sala global
    client.join('room:all');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado de WebSocket: ID ${client.id}`);
  }

  @SubscribeMessage('subscribe_to_room')
  handleRoomSubscription(client: Socket, room: string) {
    // Buscar y salir de salas de monitoreo anteriores para no duplicar datos
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
    this.logger.log(`[WebsocketGateway] Distribuyendo evento a salas correspondientes: ${payload.type}`);
    
    // 1. Enviar a sala global
    this.server.to('room:all').emit('event_received', payload);

    // 2. Enviar a salas de severidad
    if (payload.severity === 'CRITICAL') {
      this.server.to('room:critical').emit('event_received', payload);
      this.server.to('room:warning-critical').emit('event_received', payload);
    } else if (payload.severity === 'WARNING') {
      this.server.to('room:warning-critical').emit('event_received', payload);
    }

    // 3. Enviar a salas de módulo de origen
    if (payload.sourceModule) {
      this.server.to(`room:${payload.sourceModule}`).emit('event_received', payload);
    }
  }
}
