import { NestFactory } from '@nestjs/core';
import { TokenBalanceHistoryModule } from './token-balance-history.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenBalanceHistoryModule);
  app.enableCors();
  await app.listen(3035);
  console.log('Token Balance History service running on port 3035');
}
bootstrap();
