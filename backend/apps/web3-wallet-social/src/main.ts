import { NestFactory } from '@nestjs/core';
import { AppModule } from './wallet-social.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3025;
  await app.listen(port);
  console.log(`Wallet Social API is running on: http://localhost:${port}`);
}

bootstrap();
