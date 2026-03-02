import { NestFactory } from '@nestjs/core';
import { LiquidationScannerModule } from './liquidation-scanner.module';

async function bootstrap() {
  const app = await NestFactory.create(LiquidationScannerModule);
  await app.listen(3000);
  console.log('Liquidation Scanner API running on port 3000');
}
bootstrap();
