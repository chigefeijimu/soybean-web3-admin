import { NestFactory } from '@nestjs/core';
import { IdentityAggregatorModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(IdentityAggregatorModule);
  app.enableCors();
  await app.listen(3000);
  console.log('🌐 Identity Aggregator Service running on http://localhost:3000');
}
bootstrap();
