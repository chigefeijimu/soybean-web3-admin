import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  const port = process.env.PORT || 3024;
  await app.listen(port, '0.0.0.0');
  console.log(`DeFi Protocol Revenue Tracker API is running on http://localhost:${port}`);
}
bootstrap();
