import { Module } from '@nestjs/common';
import { WalletBehaviorPatternController } from './wallet-behavior-pattern.controller';
import { WalletBehaviorPatternService } from './wallet-behavior-pattern.service';

@Module({
  imports: [],
  controllers: [WalletBehaviorPatternController],
  providers: [WalletBehaviorPatternService],
})
export class AppModule {}
