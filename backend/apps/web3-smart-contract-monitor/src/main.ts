import { NestFactory } from '@nestjs/core';
import { Web3SmartContractMonitorModule } from './web3-smart-contract-monitor.module';

async function bootstrap() {
  const app = await NestFactory.create(Web3SmartContractMonitorModule);
  
  // Enable CORS
  app.enableCors();
  
  const port = process.env.PORT || 3019;
  await app.listen(port);
  console.log(`[Smart Contract Monitor] API running on port ${port}`);
}

bootstrap();
