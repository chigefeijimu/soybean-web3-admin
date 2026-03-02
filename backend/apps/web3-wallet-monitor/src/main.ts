import { NestFactory } from '@nestjs/core';
import { WalletMonitorModule } from './wallet-monitor.module';

async function bootstrap() {
  const app = await NestFactory.create(WalletMonitorModule);
  app.setGlobalPrefix('api/wallet-monitor');
  app.enableCors();
  
  const port = process.env.PORT || 3018;
  await app.listen(port);
  console.log(`Wallet Monitor API running on port ${port}`);
}

bootstrap();
