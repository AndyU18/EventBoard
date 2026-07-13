import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MessagingService } from '../messaging/messaging.service';
import { PublishEventDto } from './dto/publish-event.dto';

@ApiTags('Simulador de Eventos')
@Controller('events')
export class EventsController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('publish')
  @ApiOperation({ summary: 'Simular y publicar un evento en el bus' })
  @ApiResponse({ status: 201, description: 'Evento publicado en el bus con éxito.' })
  @ApiResponse({ status: 400, description: 'Datos del evento inválidos.' })
  async publishEvent(@Body() publishEventDto: PublishEventDto) {
    const eventMessage = {
      ...publishEventDto,
      createdAt: new Date().toISOString(),
    };

    const routingKey = `events.${publishEventDto.type.toLowerCase()}`;
    await this.messagingService.publish(routingKey, eventMessage);

    return {
      success: true,
      message: `Evento de tipo '${publishEventDto.type}' publicado con routingKey '${routingKey}'`,
      rabbitmqConnected: this.messagingService.isConnected(),
      data: eventMessage,
    };
  }
}
