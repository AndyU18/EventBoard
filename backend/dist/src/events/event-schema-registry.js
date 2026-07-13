"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSchemas = void 0;
exports.validateEventPayload = validateEventPayload;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
exports.EventSchemas = {
    USER_CREATED: zod_1.z.object({
        email: zod_1.z.string().email('El correo electrónico en el payload no es válido'),
        name: zod_1.z.string().min(2, 'El nombre en el payload debe tener al menos 2 caracteres'),
    }),
    DOCUMENT_APPROVED: zod_1.z.object({
        documentId: zod_1.z.string().min(1, 'El documentId es obligatorio'),
        approvedBy: zod_1.z.string().min(1, 'El nombre del aprobador es obligatorio'),
        title: zod_1.z.string().optional(),
    }),
    SYSTEM_ALERT_CRITICAL: zod_1.z.object({
        server: zod_1.z.string().min(1, 'El identificador del servidor es obligatorio'),
        usageCpu: zod_1.z.string().min(1, 'El uso de CPU es obligatorio'),
        temperature: zod_1.z.string().optional(),
    }),
    PAYMENT_RECEIVED: zod_1.z.object({
        invoiceId: zod_1.z.string().min(1, 'El invoiceId es obligatorio'),
        amount: zod_1.z.number().positive('El monto debe ser un número positivo'),
        method: zod_1.z.string().optional(),
    }),
    SECURITY_ALERT_LOGIN: zod_1.z.object({
        attemptsCount: zod_1.z.number().int().positive('Los intentos de login deben ser un entero positivo'),
        ipAddress: zod_1.z.string().min(7, 'Dirección IP inválida'),
        email: zod_1.z.string().email('Correo de intento de login inválido').optional(),
    }),
    INCIDENT_REPORTED: zod_1.z.object({
        ticketId: zod_1.z.string().min(1, 'El ticketId es obligatorio'),
        issue: zod_1.z.string().min(3, 'La descripción del problema es obligatoria'),
        severity: zod_1.z.string().optional(),
    }),
};
function validateEventPayload(type, payload) {
    const schema = exports.EventSchemas[type];
    if (!schema) {
        return payload;
    }
    const result = schema.safeParse(payload);
    if (!result.success) {
        const errorMessages = result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new common_1.BadRequestException(`Validación de Payload fallida para "${type}": ${errorMessages}`);
    }
    return result.data;
}
//# sourceMappingURL=event-schema-registry.js.map