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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStoreController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
let EventStoreController = class EventStoreController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getEvents(type, severity, sourceModule) {
        const where = {};
        if (type)
            where.type = type;
        if (severity)
            where.severity = severity;
        if (sourceModule)
            where.sourceModule = sourceModule;
        return this.prisma.eventLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
        });
    }
    async getStats() {
        const total = await this.prisma.eventLog.count();
        const severityGroups = await this.prisma.eventLog.groupBy({
            by: ['severity'],
            _count: true,
        });
        const moduleGroups = await this.prisma.eventLog.groupBy({
            by: ['sourceModule'],
            _count: true,
        });
        return {
            total,
            severities: severityGroups,
            modules: moduleGroups,
        };
    }
};
exports.EventStoreController = EventStoreController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener historial de eventos guardados' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Retorna todos los eventos filtrados.' }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('severity')),
    __param(2, (0, common_1.Query)('sourceModule')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EventStoreController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener estadísticas agregadas de eventos' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Retorna conteos y estadísticas de severidad.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventStoreController.prototype, "getStats", null);
exports.EventStoreController = EventStoreController = __decorate([
    (0, swagger_1.ApiTags)('Historial de Eventos'),
    (0, common_1.Controller)('event-store'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventStoreController);
//# sourceMappingURL=event-store.controller.js.map