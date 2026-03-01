import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Web3StakingController } from './web3-staking.controller';

@Module({
  imports: [HttpModule],
  controllers: [Web3StakingController],
  providers: [],
  exports: [],
})
export class Web3StakingModule {}
