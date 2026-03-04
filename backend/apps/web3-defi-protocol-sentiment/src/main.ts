import { NestFactory } from '@nestjs/core';
import { DefiProtocolSentimentModule } from './defi-protocol-sentiment.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiProtocolSentimentModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  await app.listen(3006);
  console.log('DeFi Protocol Sentiment API is running on http://localhost:3006');
}

bootstrap();
