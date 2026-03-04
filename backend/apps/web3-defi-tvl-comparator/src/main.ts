import { NestFactory } from '@nestjs/core';
import { DefiTvlComparatorModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiTvlComparatorModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`DeFi TVL Comparator API is running on port ${port}`);
}

bootstrap();
