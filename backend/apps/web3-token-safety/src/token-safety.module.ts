import { Module } from '@nestjs/common';
import { TokenSafetyController } from './token-safety.controller';
import { TokenSafetyService } from './token-safety.service';
import { GasAnalyzerController } from './gas-analyzer.controller';
import { GasAnalyzerService } from './gas-analyzer.service';
import { WalletTrackerController } from './wallet-tracker.controller';
import { WalletTrackerService } from './wallet-tracker.service';

@Module({
  controllers: [TokenSafetyController, GasAnalyzerController, WalletTrackerController],
  providers: [TokenSafetyService, GasAnalyzerService, WalletTrackerService],
  exports: [TokenSafetyService, GasAnalyzerService, WalletTrackerService],
})
export class TokenSafetyModule {}
