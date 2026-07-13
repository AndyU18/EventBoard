import { PrismaService } from '../prisma/prisma.service';
export declare class EventStoreController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getEvents(type?: string, severity?: string, sourceModule?: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        type: string;
        sourceModule: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        severity: import("@prisma/client").$Enums.Severity;
        userId: string | null;
    })[]>;
    getStats(): Promise<{
        total: number;
        severities: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.EventLogGroupByOutputType, "severity"[]> & {
            _count: number;
        })[];
        modules: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.EventLogGroupByOutputType, "sourceModule"[]> & {
            _count: number;
        })[];
    }>;
}
