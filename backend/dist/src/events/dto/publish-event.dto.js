"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class PublishEventDto {
    type;
    sourceModule;
    payload;
    userId;
    severity;
}
exports.PublishEventDto = PublishEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'USER_CREATED', description: 'El tipo de evento (ej: USER_CREATED, DOCUMENT_APPROVED)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de evento es obligatorio' }),
    __metadata("design:type", String)
], PublishEventDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'auth', description: 'Módulo de origen del evento' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El módulo de origen es obligatorio' }),
    __metadata("design:type", String)
], PublishEventDto.prototype, "sourceModule", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: { email: 'juan@gmail.com', name: 'Juan' }, description: 'Payload del evento con datos específicos' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El payload es obligatorio' }),
    __metadata("design:type", Object)
], PublishEventDto.prototype, "payload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'some-uuid-here', description: 'ID del usuario asociado (opcional)', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PublishEventDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'INFO', enum: client_1.Severity, description: 'Severidad del evento', required: false }),
    (0, class_validator_1.IsEnum)(client_1.Severity, { message: 'La severidad no es válida' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PublishEventDto.prototype, "severity", void 0);
//# sourceMappingURL=publish-event.dto.js.map