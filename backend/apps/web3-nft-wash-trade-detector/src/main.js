import { NestFactory } from '@nestjs/core';
import { Module, Controller } from '@nestjs/common';
import { NftWashTradeController } from './nft-wash-trade.controller';

@Module({
  controllers: [NftWashTradeController],
})
class NftWashTradeModule {}

async function bootstrap() {
  const app = await NestFactory.create(NftWashTradeModule);
  app.enableCors();
  await app.listen(3007);
  console.log('NFT Wash Trade Detector API running on http://localhost:3007');
}
bootstrap();
