import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { Web3PortfolioController } from './web3-portfolio.controller';
import { Web3PriceAlertController } from './web3-price-alert.controller';
import { Web3PriceAlertService } from './web3-price-alert.service';
import { Web3MultisigController } from './web3-multisig.controller';
import { Web3DaoController } from './web3-dao.controller';
import { Web3GasController } from './web3-gas.controller';
import { Web3GasService } from './web3-gas.service';
import { Web3HealthController } from './web3-health.controller';
import { Web3HealthService } from './web3-health.service';
import { Web3YieldController } from './web3-yield.controller';
import { Web3AnalyticsController } from './web3-analytics.controller';
import { Web3AnalyticsService } from './web3-analytics.service';
import { Web3SimulatorController } from './web3-simulator.controller';
import { Web3CrossChainController } from './web3-cross-chain.controller';
import { Web3SecurityController } from './web3-security.controller';
import { Web3ContractController } from './web3-contract.controller';
import { Web3ContractService } from './web3-contract.service';
import { Web3LaunchController } from './web3-launch.controller';
import { Web3LaunchService } from './web3-launch.service';
import { Web3GasOptimizerController } from './web3-gas-optimizer.controller';
import { Web3GasOptimizerService } from './web3-gas-optimizer.service';
import { Web3EnsController } from './web3-ens.controller';
import { Web3EnsService } from './web3-ens.service';
import { Web3TxDecoderController } from './web3-tx-decoder.controller';
import { Web3DefiController } from './web3-defi.controller';
import { TokenPriceController } from './web3-token-price.controller';
import { TokenPriceService } from './web3-token-price.service';
import { DataVizController } from './web3-data-viz.controller';
import { DataVizService } from './web3-data-viz.service';
import { Web3RugpullController } from './web3-rugpull.controller';
import { Web3RugpullService } from './web3-rugpull.service';
import { WhaleTrackerController } from './whale-tracker.controller';
import { WhaleTrackerService } from './whale-tracker.service';
import { AirdropTrackerController } from './airdrop-tracker.controller';
import { AirdropTrackerService } from './airdrop-tracker.service';
import { DefiPortfolioController } from './defi-portfolio.controller';
import { DefiPortfolioService } from './defi-portfolio.service';
import { FearGreedController } from './web3-fear-greed.controller';
import { FearGreedService } from './web3-fear-greed.service';
import { FlashloanDetectorController } from './flashloan-detector.controller';
import { FlashloanDetectorService } from './flashloan-detector.service';
import { TokenVestingController } from './web3-token-vesting.controller';
import { TokenVestingService } from './web3-token-vesting.service';
import { AddressInteractionController } from './address-interaction.controller';
import { AddressInteractionService } from './address-interaction.service';
import { CrossChainTransferController } from './cross-chain-transfer.controller';
import { DappBrowserController } from './dapp-browser.controller';
import { DappBrowserService } from './dapp-browser.service';
import { DexAggregatorController } from './dex-aggregator.controller';
import { DexAggregatorService } from './dex-aggregator.service';
import { FundFlowAnalyzerController } from './fund-flow-analyzer.controller';
import { FundFlowAnalyzerService } from './fund-flow-analyzer.service';
import { NftPortfolioController } from './nft-portfolio.controller';
import { NftPortfolioService } from './nft-portfolio.service';
import { DefiTvlController } from './defi-tvl.controller';
import { DefiTvlService } from './defi-tvl.service';
import { AddressLabelController } from './address-label.controller';
import { AddressLabelService } from './address-label.service';
import { TaxReportController } from './tax-report/tax-report.controller';
import { TaxReportService } from './tax-report/tax-report.service';
import { LiquidityPoolController } from './liquidity-pool.controller';
import { LiquidityPoolService } from './liquidity-pool.service';
import { MevProtectController } from './mev-protect.controller';
import { MevProtectService } from './mev-protect.service';
import { Web3PriorityFeeController } from './web3-priority-fee.controller';
import { CrossChainBalanceController } from './cross-chain-balance.controller';
import { PortfolioExportController } from './portfolio-export.controller';
import { PortfolioExportService } from './portfolio-export.service';
import { TransactionSchedulerController } from './web3-transaction-scheduler.controller';
import { ContractMethodSelectorController } from './contract-method-selector.controller';
import { NetworkStatusController } from './network-status.controller';
import { WalletGroupController } from './wallet-group/wallet-group.controller';
import { WalletGroupService } from './wallet-group/wallet-group.service';
import { TokenInsiderTrackerController } from './token-insider-tracker.controller';
import { DefiYieldCompareController } from './defi-yield-compare.controller';
import { DefiYieldCompareService } from './defi-yield-compare.service';
import { WalletSnapshotController } from './wallet-snapshot.controller';
import { TokenInflationController } from './token-inflation.controller';
import { TokenInflationService } from './token-inflation.service';
import { TxQueueController } from './tx-queue.controller';

@Module({
  imports: [HttpModule],
  controllers: [
    Web3PortfolioController,
    Web3PriceAlertController,
    Web3MultisigController,
    Web3DaoController,
    Web3GasController,
    Web3HealthController,
    Web3YieldController,
    Web3AnalyticsController,
    Web3SimulatorController,
    Web3CrossChainController,
    Web3SecurityController,
    Web3ContractController,
    Web3LaunchController,
    Web3GasOptimizerController,
    Web3EnsController,
    Web3TxDecoderController,
    Web3DefiController,
    TokenPriceController,
    DataVizController,
    Web3RugpullController,
    WhaleTrackerController,
    AirdropTrackerController,
    DefiPortfolioController,
    FearGreedController,
    FlashloanDetectorController,
    TokenVestingController,
    AddressInteractionController,
    CrossChainTransferController,
    DappBrowserController,
    DexAggregatorController,
    FundFlowAnalyzerController,
    NftPortfolioController,
    DefiTvlController,
    AddressLabelController,
    TaxReportController,
    LiquidityPoolController,
    MevProtectController,
    Web3PriorityFeeController,
    CrossChainBalanceController,
    PortfolioExportController,
    TransactionSchedulerController,
    ContractMethodSelectorController,
    NetworkStatusController,
    WalletGroupController,
    TokenInsiderTrackerController,
    DefiYieldCompareController,
    WalletSnapshotController,
    TokenInflationController,
    TxQueueController,
  ],
  providers: [Web3PriceAlertService, Web3GasService, Web3HealthService, Web3AnalyticsService, Web3ContractService, Web3LaunchService, Web3GasOptimizerService, Web3EnsService, TokenPriceService, DataVizService, Web3RugpullService, WhaleTrackerService, AirdropTrackerService, DefiPortfolioService, FearGreedService, FlashloanDetectorService, TokenVestingService, AddressInteractionService, DappBrowserService, DexAggregatorService, FundFlowAnalyzerService, NftPortfolioService, DefiTvlService, AddressLabelService, TaxReportService, LiquidityPoolService, MevProtectService, PortfolioExportService, WalletGroupService, DefiYieldCompareService, TokenInflationService],
})
export class Web3PortfolioModule {}
