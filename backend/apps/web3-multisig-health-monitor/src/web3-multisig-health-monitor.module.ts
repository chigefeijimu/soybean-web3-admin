import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Web3MultisigHealthMonitorController } from './controller/web3-multisig-health-monitor.controller';
import { Web3MultisigHealthMonitorService } from './service/web3-multisig-health-monitor.service';

@Module({
  imports: [HttpModule],
  controllers: [Web3MultisigHealthMonitorController],
  providers: [Web3MultisigHealthMonitorService],
  exports: [Web3MultisigHealthMonitorService],
})
export class Web3MultisigHealthMonitorModule {}
