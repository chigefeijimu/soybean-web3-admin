import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MultisigHealthMonitorController } from './multisig-health-monitor.controller';
import { MultisigHealthMonitorService } from './multisig-health-monitor.service';

@Module({
  imports: [HttpModule],
  controllers: [MultisigHealthMonitorController],
  providers: [MultisigHealthMonitorService],
  exports: [MultisigHealthMonitorService],
})
export class MultisigHealthMonitorModule {}
