import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from '../messaging/messaging.service';
export declare class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly messagingService;
    private readonly logger;
    server: Server;
    constructor(messagingService: MessagingService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleRabbitEvent(payload: any): Promise<void>;
    handleLocalEvent(payload: any): Promise<void>;
    private broadcastEvent;
}
