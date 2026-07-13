import { Severity } from '@prisma/client';
export declare class PublishEventDto {
    type: string;
    sourceModule: string;
    payload: Record<string, any>;
    userId?: string;
    severity?: Severity;
}
