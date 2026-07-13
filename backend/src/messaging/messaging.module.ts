import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MessagingService } from './messaging.service';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true, // Permitir escuchar patrones como 'events.*'
      delimiter: '.',
    }),
  ],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
