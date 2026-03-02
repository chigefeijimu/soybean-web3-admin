import { NestFactory } from '@nestjs/core';
import { AppModule } from './portfolio-analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3014;
  await app.listen(port);
  console.log(`Wallet Portfolio Analytics API is running on: http://localhost:${port}`);
}

bootstrap();
