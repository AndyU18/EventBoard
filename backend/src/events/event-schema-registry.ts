import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export const EventSchemas: Record<string, z.ZodObject<any>> = {
  USER_CREATED: z.object({
    email: z.string().email('El correo electrónico en el payload no es válido'),
    name: z.string().min(2, 'El nombre en el payload debe tener al menos 2 caracteres'),
  }),
  
  DOCUMENT_APPROVED: z.object({
    documentId: z.string().min(1, 'El documentId es obligatorio'),
    approvedBy: z.string().min(1, 'El nombre del aprobador es obligatorio'),
    title: z.string().optional(),
  }),

  SYSTEM_ALERT_CRITICAL: z.object({
    server: z.string().min(1, 'El identificador del servidor es obligatorio'),
    usageCpu: z.string().min(1, 'El uso de CPU es obligatorio'),
    temperature: z.string().optional(),
  }),

  PAYMENT_RECEIVED: z.object({
    invoiceId: z.string().min(1, 'El invoiceId es obligatorio'),
    amount: z.number().positive('El monto debe ser un número positivo'),
    method: z.string().optional(),
  }),

  SECURITY_ALERT_LOGIN: z.object({
    attemptsCount: z.number().int().positive('Los intentos de login deben ser un entero positivo'),
    ipAddress: z.string().min(7, 'Dirección IP inválida'),
    email: z.string().email('Correo de intento de login inválido').optional(),
  }),

  INCIDENT_REPORTED: z.object({
    ticketId: z.string().min(1, 'El ticketId es obligatorio'),
    issue: z.string().min(3, 'La descripción del problema es obligatoria'),
    severity: z.string().optional(),
  }),
};

/**
 * Valida el payload de un evento contra su esquema registrado.
 * Si el tipo de evento no tiene esquema registrado, se permite por defecto.
 */
export function validateEventPayload(type: string, payload: any) {
  const schema = EventSchemas[type];
  if (!schema) {
    return payload;
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    const errorMessages = result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
    throw new BadRequestException(`Validación de Payload fallida para "${type}": ${errorMessages}`);
  }

  return result.data;
}
