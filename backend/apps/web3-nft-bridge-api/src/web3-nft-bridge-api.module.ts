import { Module } from '@nestjs/common';
import { Web3NftBridgeApiController } from './web3-nft-bridge-api.controller';
import { Web3NftBridgeApiService } from './web3-nft-bridge-api.service';

@Module({
  controllers: [Web3NftBridgeApiController],
  providers: [Web3NftBridgeApiService],
  exports: [Web3NftBridgeApiService],
})
export class Web3NftBridgeApiModule {}
