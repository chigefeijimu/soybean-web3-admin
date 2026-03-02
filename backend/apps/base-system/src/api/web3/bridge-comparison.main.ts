import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { BridgeComparisonModule } from './bridge-comparison.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    BridgeComparisonModule,
    new FastifyAdapter(),
  );
  await app.listen(3024);
  console.log('Bridge Comparison service running on port 3024');
}
bootstrap();
