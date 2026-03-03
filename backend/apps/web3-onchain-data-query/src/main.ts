import { NestFactory } from '@nestjs/core';
import { OnchainDataQueryModule } from './onchain-data-query.module';

async function bootstrap() {
  const app = await NestFactory.create(OnchainDataQueryModule);
  await app.listen(3000);
  console.log('Onchain Data Query service is running on http://localhost:3000');
}

bootstrap();
