import { Module } from '@nestjs/common';
import { NotificationsConsumer } from './notifications.consumer';
import { NotificationsController } from './notifications.controller';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsConsumer],
})
export class NotificationsModule {}
