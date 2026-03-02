import { Module } from '@nestjs/common';
import { NetworkStatusController } from './network-status.controller';

@Module({
  controllers: [NetworkStatusController],
  providers: [],
  exports: [],
})
export class NetworkStatusModule {}
