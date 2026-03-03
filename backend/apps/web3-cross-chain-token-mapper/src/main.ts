import { NestFactory } from '@nestjs/core';
import { CrossChainTokenMapperModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(CrossChainTokenMapperModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3046;
  await app.listen(port);
  console.log(`CrossChain Token Mapper API is running on port ${port}`);
}

bootstrap();
