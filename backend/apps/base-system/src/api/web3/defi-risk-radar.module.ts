import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Web3DefiRiskRadarController } from './web3-defi-risk-radar.controller';
import { Web3DefiRiskRadarService } from './web3-defi-risk-radar.service';

@Module({
  imports: [HttpModule],
  controllers: [Web3DefiRiskRadarController],
  providers: [Web3DefiRiskRadarService],
  exports: [Web3DefiRiskRadarService],
})
export class Web3DefiRiskRadarModule {}
