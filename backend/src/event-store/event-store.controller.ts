import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService } from '../messaging/messaging.service';

@ApiTags('Historial de Eventos')
@Controller('event-store')
export class EventStoreController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

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

  @Post('replay')
  @ApiOperation({ summary: 'Reemitir eventos históricos en el bus (Event Replay)' })
  @ApiResponse({ status: 200, description: 'Eventos reemitidos con éxito en segundo plano.' })
  async replayEvents(
    @Body('startDate') startDate?: string,
    @Body('endDate') endDate?: string,
    @Body('sourceModule') sourceModule?: string,
  ) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (sourceModule) where.sourceModule = sourceModule;

    // Obtener los eventos ordenados por fecha ascendente para simular el orden cronológico
    const events = await this.prisma.eventLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // Despachar los eventos de forma secuencial con delay
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const replayMessage = {
        id: event.id,
        type: event.type,
        sourceModule: event.sourceModule,
        payload: event.payload,
        userId: event.userId,
        severity: event.severity,
        createdAt: event.createdAt,
        isReplay: true,
      };

      setTimeout(async () => {
        const routingKey = `events.${event.type.toLowerCase()}`;
        await this.messagingService.publish(routingKey, replayMessage);
      }, i * 200);
    }

    return {
      success: true,
      message: `Iniciada la repetición de ${events.length} eventos históricos en segundo plano.`,
      count: events.length,
    };
  }
}
