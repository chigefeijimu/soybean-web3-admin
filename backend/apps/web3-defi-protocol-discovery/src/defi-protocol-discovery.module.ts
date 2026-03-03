import { Module } from '@nestjs/common';
import { DefiProtocolDiscoveryController } from './defi-protocol-discovery.controller';
import { DefiProtocolDiscoveryService } from './defi-protocol-discovery.service';

@Module({
  imports: [],
  controllers: [DefiProtocolDiscoveryController],
  providers: [DefiProtocolDiscoveryService],
})
export class DefiProtocolDiscoveryModule {}
