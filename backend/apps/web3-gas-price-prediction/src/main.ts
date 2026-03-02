import { NestFactory } from '@nestjs/core';
import { AppModule } from './gas-price-prediction.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3007;
  await app.listen(port);
  console.log(`🚀 Gas Price Prediction API running on http://localhost:${port}`);
}
bootstrap();
