import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Historial de Eventos')
@Controller('event-store')
export class EventStoreController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener historial de eventos guardados' })
  @ApiResponse({ status: 200, description: 'Retorna todos los eventos filtrados.' })
  async getEvents(
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('sourceModule') sourceModule?: string,
  ) {
    const where: any = {};
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (sourceModule) where.sourceModule = sourceModule;

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

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas agregadas de eventos' })
  @ApiResponse({ status: 200, description: 'Retorna conteos y estadísticas de severidad.' })
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
}
