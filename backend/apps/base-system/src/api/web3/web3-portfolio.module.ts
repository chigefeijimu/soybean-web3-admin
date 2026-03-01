import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { Web3PortfolioController } from './web3-portfolio.controller';
import { Web3PriceAlertController } from './web3-price-alert.controller';
import { Web3PriceAlertService } from './web3-price-alert.service';
import { Web3MultisigController } from './web3-multisig.controller';
import { Web3DaoController } from './web3-dao.controller';

@Module({
  imports: [HttpModule],
  controllers: [Web3PortfolioController, Web3PriceAlertController, Web3MultisigController, Web3DaoController],
  providers: [Web3PriceAlertService],
})
export class Web3PortfolioModule {}
