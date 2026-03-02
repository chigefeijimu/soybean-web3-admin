import { NestFactory } from '@nestjs/core';
import { Web3GasFaucetModule } from './web3-gas-faucet.module';

async function bootstrap() {
  const app = await NestFactory.create(Web3GasFaucetModule);
  app.enableCors();
  await app.listen(3035);
  console.log('Gas Faucet service running on port 3035');
}
bootstrap();
