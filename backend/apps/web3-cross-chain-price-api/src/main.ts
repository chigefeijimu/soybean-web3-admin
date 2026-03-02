import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CrossChainPriceModule } from './cross-chain-price.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const crossChainPriceModule = app.get(CrossChainPriceModule);
  console.log('CrossChainPriceModule loaded:', crossChainPriceModule);
}

bootstrap();
