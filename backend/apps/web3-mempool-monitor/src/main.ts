import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { MempoolMonitorModule } from './mempool-monitor.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    MempoolMonitorModule,
    new FastifyAdapter()
  );
  
  app.setGlobalPrefix('api');
  
  await app.listen(3000, '0.0.0.0');
  console.log('Mempool Monitor API running on http://localhost:3000/api');
}

bootstrap();
