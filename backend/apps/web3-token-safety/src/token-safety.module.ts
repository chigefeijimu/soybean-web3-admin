import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TokenSafetyController } from './token-safety.controller';
import { TokenSafetyService } from './token-safety.service';
import { GasAnalyzerController } from './gas-analyzer.controller';
import { GasAnalyzerService } from './gas-analyzer.service';
import { WalletTrackerController } from './wallet-tracker.controller';
import { WalletTrackerService } from './wallet-tracker.service';
import { TokenUnlockController } from './token-unlock/controller';
import { TokenUnlockService } from './token-unlock/service';
import { BlockchainHeatmapController } from './blockchain-heatmap.controller';
import { BlockchainHeatmapService } from './blockchain-heatmap.service';
import { Web3NewsController } from './web3-news.controller';
import { WhaleTrackerController } from '../web3-whale-tracker/src/whale-tracker.controller';
import { WhaleTrackerService } from '../web3-whale-tracker/src/whale-tracker.service';

@Module({
  imports: [HttpModule],
  controllers: [TokenSafetyController, GasAnalyzerController, WalletTrackerController, TokenUnlockController, BlockchainHeatmapController, Web3NewsController, WhaleTrackerController],
  providers: [TokenSafetyService, GasAnalyzerService, WalletTrackerService, TokenUnlockService, BlockchainHeatmapService, WhaleTrackerService],
  exports: [TokenSafetyService, GasAnalyzerService, WalletTrackerService, TokenUnlockService, BlockchainHeatmapService, WhaleTrackerService],
})
export class TokenSafetyModule {}
