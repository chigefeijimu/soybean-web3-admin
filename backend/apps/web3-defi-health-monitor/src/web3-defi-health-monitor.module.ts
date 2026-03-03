import { Module } from '@nestjs/common';
import { Web3DefiHealthMonitorController } from './web3-defi-health-monitor.controller';
import { Web3DefiHealthMonitorService } from './web3-defi-health-monitor.service';

@Module({
  controllers: [Web3DefiHealthMonitorController],
  providers: [Web3DefiHealthMonitorService],
  exports: [Web3DefiHealthMonitorService],
})
export class Web3DefiHealthMonitorModule {}
