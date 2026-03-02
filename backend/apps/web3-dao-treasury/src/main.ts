import { NestFactory } from '@nestjs/core';
import { DaoTreasuryModule } from './dao-treasury.module';

async function bootstrap() {
  const app = await NestFactory.create(DaoTreasuryModule);
  await app.listen(3020);
  console.log('DAO Treasury Dashboard service running on port 3020');
}
bootstrap();
