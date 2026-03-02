import { NestFactory } from '@nestjs/core';
import { GasHistoryModule } from './gas-history.module';

async function bootstrap() {
  const app = await NestFactory.create(GasHistoryModule);
  await app.listen(3000);
  console.log('Gas History API is running on http://localhost:3000');
}
bootstrap();
