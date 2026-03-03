import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmartMoneyAlertController } from './smart-money-alert.controller';
import { SmartMoneyAlertService } from './smart-money-alert.service';

@Module({
  imports: [HttpModule],
  controllers: [SmartMoneyAlertController],
  providers: [SmartMoneyAlertService],
  exports: [SmartMoneyAlertService],
})
export class SmartMoneyAlertModule {}
