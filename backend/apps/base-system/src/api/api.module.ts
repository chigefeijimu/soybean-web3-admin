import { Module } from '@nestjs/common';

import { AccessKeyInfraModule } from '@app/base-system/infra/bounded-contexts/access-key/access_key.infra.module';
import { ApiEndpointInfraModule } from '@app/base-system/infra/bounded-contexts/api-endpoint/api-endpoint/api-endpoint.infra.module';
import { IamModule } from '@app/base-system/infra/bounded-contexts/iam/authentication/iam.module';
import { DomainInfraModule } from '@app/base-system/infra/bounded-contexts/iam/domain/domain-infra.module';
import { MenuInfraModule } from '@app/base-system/infra/bounded-contexts/iam/menu/menu.infra.module';
import { RoleInfraModule } from '@app/base-system/infra/bounded-contexts/iam/role/role.infra.module';
import { TokensInfraModule } from '@app/base-system/infra/bounded-contexts/iam/tokens/tokens.infra.module';
import { LoginLogInfraModule } from '@app/base-system/infra/bounded-contexts/log-audit/login-log/login-log.infra.module';
import { OperationLogInfraModule } from '@app/base-system/infra/bounded-contexts/log-audit/operation-log/operation-log.infra.module';
import { Web3PortfolioModule } from './web3/web3-portfolio.module';
import { WalletGroupModule } from './web3/wallet-group/wallet-group.module';
import { CrossChainTxTrackerModule } from './web3/cross-chain-tx-tracker.module';
import { TokenSignalAnalyzerModule } from './web3/token-signal-analyzer.module';
import { LiquidationScannerModule } from './web3/liquidation-scanner.module';
import { DefiPositionManagerModule } from './web3/defi-position-manager.module';
import { TokenCorrelationModule } from './web3/token-correlation.module';
import { Web3DefiAnalyticsModule } from './web3/web3-defi-analytics.module';
import { CrossChainPriceApiModule } from './web3/cross-chain-price-api.module';
import { EventMonitorModule } from './web3/event-monitor/event-monitor.module';
import { CrossChainRebalancerModule } from './web3/cross-chain-rebalancer/cross-chain-rebalancer.module';
import { DefiStrategyBuilderModule } from './web3/defi-strategy-builder.module';
import { TokenSentimentApiModule } from './web3/token-sentiment-api.module';
import { TxSimulatorModule } from './web3/tx-simulator.module';
import { TokenLaunchScannerModule } from './web3/token-launch-scanner/token-launch-scanner.module';
import { DefiRiskCalculatorModule } from './web3/defi-risk-calculator.module';
import { ContractSecurityAuditModule } from './web3/contract-security-audit.module';

import { Controllers as AccessKeyRest } from './access-key/rest';
import { Controllers as EndpointRest } from './endpoint/rest';
import { Controllers as IamRest } from './iam/rest';
import { Controllers as LoginLogRest } from './log-audit/login-log/rest';
import { Controllers as OperationLogRest } from './log-audit/operation-log/rest';
import { Web3DefiAnalyticsController } from './web3/web3-defi-analytics.controller';
import { EventMonitorController } from './web3/event-monitor/event-monitor.controller';
import { CrossChainRebalancerController } from './web3/cross-chain-rebalancer/cross-chain-rebalancer.controller';
import { DefiStrategyBuilderController } from './web3/defi-strategy-builder.controller';
import { TokenSentimentController } from './web3/token-sentiment.controller';
import { TxSimulatorController } from './web3/tx-simulator.controller';
import { NftCollectionAnalyticsController } from './web3/nft-collection-analytics.controller';
import { TokenLaunchScannerController } from './web3/token-launch-scanner/token-launch-scanner.controller';
import { DefiRiskCalculatorController } from './web3/defi-risk-calculator.controller';
import { ContractSecurityAuditController } from './web3/contract-security-audit.controller';

@Module({
  imports: [
    IamModule,
    MenuInfraModule,
    RoleInfraModule,
    DomainInfraModule,
    ApiEndpointInfraModule,
    OperationLogInfraModule,
    LoginLogInfraModule,
    TokensInfraModule,
    AccessKeyInfraModule,
    Web3PortfolioModule,
    WalletGroupModule,
    CrossChainTxTrackerModule,
    TokenSignalAnalyzerModule,
    LiquidationScannerModule,
    DefiPositionManagerModule,
    TokenCorrelationModule,
    CrossChainPriceApiModule,
    EventMonitorModule,
    CrossChainRebalancerModule,
    Web3DefiAnalyticsModule,
    DefiStrategyBuilderModule,
    TokenSentimentApiModule,
    TxSimulatorModule,
    TokenLaunchScannerModule,
    DefiRiskCalculatorModule,
    ContractSecurityAuditModule,
  ],
  controllers: [
    ...IamRest,
    ...EndpointRest,
    ...LoginLogRest,
    ...OperationLogRest,
    ...AccessKeyRest,
    Web3DefiAnalyticsController,
    EventMonitorController,
    CrossChainRebalancerController,
    DefiStrategyBuilderController,
    TokenSentimentController,
    TxSimulatorController,
    NftCollectionAnalyticsController,
    TokenLaunchScannerController,
    DefiRiskCalculatorController,
    ContractSecurityAuditController,
  ],
})
export class ApiModule {}
