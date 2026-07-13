import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Notificaciones')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener lista de notificaciones de alertas' })
  @ApiResponse({ status: 200, description: 'Retorna la lista de notificaciones.' })
  async getNotifications() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        eventLog: {
          select: { type: true, severity: true, sourceModule: true },
        },
      },
    });
  }
}
