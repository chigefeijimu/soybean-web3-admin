import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ArbitrageController } from './arbitrage.controller';
import { ArbitrageService } from './arbitrage.service';

@Module({
  imports: [HttpModule],
  controllers: [ArbitrageController],
  providers: [ArbitrageService],
  exports: [ArbitrageService]
})
export class ArbitrageModule {}
