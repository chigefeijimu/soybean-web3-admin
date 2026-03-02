import { NestFactory } from '@nestjs/core';
import { AppModule } from './validator-tracker.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3017;
  await app.listen(port);
  console.log(`🚀 Validator Performance Tracker API running on http://localhost:${port}`);
  console.log(`📊 API Documentation: http://localhost:${port}/api/validator`);
}

bootstrap();
