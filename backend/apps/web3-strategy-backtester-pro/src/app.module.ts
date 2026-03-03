import { Module } from '@nestjs/common';
import { BacktesterController } from './backtester.controller';
import { BacktesterService } from './backtester.service';

@Module({
  imports: [],
  controllers: [BacktesterController],
  providers: [BacktesterService],
})
export class AppModule {}
