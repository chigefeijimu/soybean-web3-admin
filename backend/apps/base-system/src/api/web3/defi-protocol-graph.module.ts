import { Module } from '@nestjs/common';
import { DefiProtocolGraphController } from './defi-protocol-graph.controller';
import { DefiProtocolGraphService } from './defi-protocol-graph.service';

@Module({
  controllers: [DefiProtocolGraphController],
  providers: [DefiProtocolGraphService],
  exports: [DefiProtocolGraphService],
})
export class DefiProtocolGraphModule {}
