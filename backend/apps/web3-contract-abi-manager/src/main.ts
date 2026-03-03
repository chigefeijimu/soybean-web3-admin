import { NestFactory } from '@nestjs/core';
import { ContractAbiManagerModule } from './contract-abi-manager.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ContractAbiManagerModule);
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  app.enableCors();
  
  const port = process.env.PORT || 3023;
  await app.listen(port);
  console.log(`🚀 Smart Contract ABI Manager running on port ${port}`);
}

bootstrap();
