import { NestFactory } from '@nestjs/core';
import { TokenHistoryModule } from './token-history.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenHistoryModule);
  app.enableCors();
  await app.listen(3000);
  console.log('Token History API running on http://localhost:3000');
}
bootstrap();
