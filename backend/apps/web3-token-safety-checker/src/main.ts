import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api/v1');
  
  const port = process.env.PORT || 3024;
  await app.listen(port);
  console.log(`Token Safety Checker running on port ${port}`);
}
bootstrap();
