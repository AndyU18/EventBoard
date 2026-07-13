import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
export declare class NotificationsConsumer {
    private readonly prisma;
    private readonly messagingService;
    private readonly logger;
    constructor(prisma: PrismaService, messagingService: MessagingService);
    handleRabbitEvent(payload: any): Promise<void>;
    handleLocalEvent(payload: any): Promise<void>;
    private processNotification;
    private findEventLogWithRetry;
}
