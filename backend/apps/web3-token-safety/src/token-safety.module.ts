import { Module } from '@nestjs/common';
import { TokenSafetyController } from './token-safety.controller';
import { TokenSafetyService } from './token-safety.service';
import { GasAnalyzerController } from './gas-analyzer.controller';
import { GasAnalyzerService } from './gas-analyzer.service';
import { WalletTrackerController } from './wallet-tracker.controller';
import { WalletTrackerService } from './wallet-tracker.service';
import { TokenUnlockController } from './token-unlock.controller';
import { TokenUnlockService } from './token-unlock.service';

@Module({
  controllers: [TokenSafetyController, GasAnalyzerController, WalletTrackerController, TokenUnlockController],
  providers: [TokenSafetyService, GasAnalyzerService, WalletTrackerService, TokenUnlockService],
  exports: [TokenSafetyService, GasAnalyzerService, WalletTrackerService, TokenUnlockService],
})
export class TokenSafetyModule {}
