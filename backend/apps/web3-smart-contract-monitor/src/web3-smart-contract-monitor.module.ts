import { Module } from '@nestjs/common';
import { Web3SmartContractMonitorController } from './web3-smart-contract-monitor.controller';
import { Web3SmartContractMonitorService } from './web3-smart-contract-monitor.service';

@Module({
  controllers: [Web3SmartContractMonitorController],
  providers: [Web3SmartContractMonitorService],
})
export class Web3SmartContractMonitorModule {}
