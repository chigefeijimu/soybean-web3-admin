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

@Module({
  imports: [HttpModule],
  controllers: [Web3PortfolioController, Web3PriceAlertController, Web3MultisigController, Web3DaoController, Web3GasController, Web3HealthController, Web3YieldController],
  providers: [Web3PriceAlertService, Web3GasService, Web3HealthService],
})
export class Web3PortfolioModule {}
