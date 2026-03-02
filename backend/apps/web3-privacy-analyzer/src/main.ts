import { NestFactory } from '@nestjs/core';
import { PrivacyAnalyzerModule } from './privacy-analyzer.module';

async function bootstrap() {
  const app = await NestFactory.create(PrivacyAnalyzerModule);
  app.setGlobalPrefix('api');
  await app.listen(3002);
  console.log('Privacy Analyzer running on http://localhost:3002');
}
bootstrap();
