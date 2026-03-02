import { NestFactory } from '@nestjs/core';
import { VolatilityAnalyzerModule } from './volatility-analyzer.module';

async function bootstrap() {
  const app = await NestFactory.create(VolatilityAnalyzerModule);
  await app.listen(3000);
  console.log('Volatility Analyzer API is running on http://localhost:3000');
}
bootstrap();
