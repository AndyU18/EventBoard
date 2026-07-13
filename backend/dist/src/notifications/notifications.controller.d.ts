import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getNotifications(): Promise<({
        eventLog: {
            type: string;
            sourceModule: string;
            severity: import("@prisma/client").$Enums.Severity;
        };
    } & {
        id: string;
        createdAt: Date;
        message: string;
        recipient: string;
        status: import("@prisma/client").$Enums.NotificationStatus;
        eventLogId: string;
    })[]>;
}
