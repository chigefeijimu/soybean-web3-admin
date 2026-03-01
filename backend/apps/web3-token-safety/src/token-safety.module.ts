import { Module } from '@nestjs/common';
import { TokenSafetyController } from './token-safety.controller';
import { TokenSafetyService } from './token-safety.service';
import { GasAnalyzerController } from './gas-analyzer.controller';
import { GasAnalyzerService } from './gas-analyzer.service';
import { WalletTrackerController } from './wallet-tracker.controller';
import { WalletTrackerService } from './wallet-tracker.service';
import { TokenUnlockController } from './token-unlock.controller';
import { TokenUnlockService } from './token-unlock.service';
import { BlockchainHeatmapController } from './blockchain-heatmap.controller';
import { BlockchainHeatmapService } from './blockchain-heatmap.service';

@Module({
  controllers: [TokenSafetyController, GasAnalyzerController, WalletTrackerController, TokenUnlockController, BlockchainHeatmapController],
  providers: [TokenSafetyService, GasAnalyzerService, WalletTrackerService, TokenUnlockService, BlockchainHeatmapService],
  exports: [TokenSafetyService, GasAnalyzerService, WalletTrackerService, TokenUnlockService, BlockchainHeatmapService],
})
export class TokenSafetyModule {}
