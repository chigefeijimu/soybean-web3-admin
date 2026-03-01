import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { Web3PortfolioController } from './web3-portfolio.controller';

@Module({
  imports: [HttpModule],
  controllers: [Web3PortfolioController],
})
export class Web3PortfolioModule {}
