import { z } from 'zod';
export declare const EventSchemas: Record<string, z.ZodObject<any>>;
export declare function validateEventPayload(type: string, payload: any): any;
