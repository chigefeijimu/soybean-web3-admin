import { NestFactory } from '@nestjs/core';
import { TokenCorrelationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenCorrelationModule);
  await app.listen(3000);
  console.log('Token Correlation API is running on http://localhost:3000');
}

bootstrap();
