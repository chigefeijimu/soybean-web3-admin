import { NestFactory } from '@nestjs/core';
import { TokenEconomicsModule } from './token-economics.module';

async function bootstrap() {
  const app = await NestFactory.create(TokenEconomicsModule);
  await app.listen(3020);
  console.log('Token Economics service running on port 3020');
}
bootstrap();
