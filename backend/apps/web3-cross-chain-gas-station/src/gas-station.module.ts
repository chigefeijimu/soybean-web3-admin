import { Module } from '@nestjs/common';
import { GasStationController } from './gas-station.controller';
import { GasStationService } from './gas-station.service';

@Module({
  imports: [],
  controllers: [GasStationController],
  providers: [GasStationService],
})
export class GasStationModule {}
