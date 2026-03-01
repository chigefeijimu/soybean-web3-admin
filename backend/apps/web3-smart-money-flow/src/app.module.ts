import { Module } from '@nestjs/common';
import { SmartMoneyController } from './smart-money.controller';
import { SmartMoneyService } from './smart-money.service';

@Module({
  imports: [],
  controllers: [SmartMoneyController],
  providers: [SmartMoneyService],
})
export class AppModule {}
