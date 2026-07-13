import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class MessagingService implements OnModuleInit, OnModuleDestroy {
    private readonly eventEmitter;
    private readonly logger;
    private connection;
    private channel;
    private isRabbitConnected;
    private readonly exchangeName;
    constructor(eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publish(routingKey: string, message: any): Promise<void>;
    private setupConsumers;
    isConnected(): boolean;
}
