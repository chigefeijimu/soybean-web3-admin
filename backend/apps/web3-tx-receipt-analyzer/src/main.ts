import { NestFactory } from '@nestjs/core';
import { TxReceiptAnalyzerModule } from './tx-receipt-analyzer.module';

async function bootstrap() {
  const app = await NestFactory.create(TxReceiptAnalyzerModule);
  app.enableCors();
  await app.listen(3000);
  console.log('Tx Receipt Analyzer service running on http://localhost:3000');
}
bootstrap();
