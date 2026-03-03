import { NestFactory } from '@nestjs/core';
import { WalletReputationModule } from './wallet-reputation.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(WalletReputationModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  const port = process.env.PORT || 3024;
  await app.listen(port);
  
  console.log(`Wallet Reputation API is running on port ${port}`);
  console.log(`Endpoints:`);
  console.log(`  GET  /web3/wallet-reputation/score/:address`);
  console.log(`  GET  /web3/wallet-reputation/batch?addresses=...`);
  console.log(`  GET  /web3/wallet-reputation/factors/:address`);
  console.log(`  GET  /web3/wallet-reputation/leaderboard?chain=...&limit=...`);
  console.log(`  GET  /web3/wallet-reputation/compare?addresses=...`);
}

bootstrap();
