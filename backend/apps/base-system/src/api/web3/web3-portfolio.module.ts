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
  ],
  providers: [Web3PriceAlertService, Web3GasService, Web3HealthService, Web3AnalyticsService, Web3ContractService, Web3LaunchService, Web3GasOptimizerService, Web3EnsService],
})
export class Web3PortfolioModule {}
