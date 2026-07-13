import { Module } from '@nestjs/common';
import { EventStoreConsumer } from './event-store.consumer';
import { EventStoreController } from './event-store.controller';

@Module({
  controllers: [EventStoreController],
  providers: [EventStoreConsumer],
})
export class EventStoreModule {}
