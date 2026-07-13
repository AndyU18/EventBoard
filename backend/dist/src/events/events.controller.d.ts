import { MessagingService } from '../messaging/messaging.service';
import { PublishEventDto } from './dto/publish-event.dto';
export declare class EventsController {
    private readonly messagingService;
    constructor(messagingService: MessagingService);
    publishEvent(publishEventDto: PublishEventDto): Promise<{
        success: boolean;
        message: string;
        rabbitmqConnected: boolean;
        data: {
            payload: any;
            createdAt: string;
            type: string;
            sourceModule: string;
            userId?: string;
            severity?: import("@prisma/client").Severity;
        };
    }>;
}
