import { NestFactory } from '@nestjs/core';
import { YieldAggregatorModule } from './yield-aggregator.module';

async function bootstrap() {
  const app = await NestFactory.create(YieldAggregatorModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  
  const port = process.env.PORT || 3008;
  await app.listen(port);
  console.log(`🌾 Yield Aggregator API running on http://localhost:${port}/api`);
}

bootstrap();
