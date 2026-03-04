import { Module } from '@nestjs/common';
import { GasStationNetworkController } from './gas-station-network.controller';
import { GasStationNetworkService } from './gas-station-network.service';

@Module({
  imports: [],
  controllers: [GasStationNetworkController],
  providers: [GasStationNetworkService],
})
export class GasStationNetworkModule {}
