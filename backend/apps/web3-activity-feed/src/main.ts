import { NestFactory } from '@nestjs/core';
import { ActivityFeedModule } from './activity-feed.module';

async function bootstrap() {
  const app = await NestFactory.create(ActivityFeedModule);
  
  app.setGlobalPrefix('api');
  
  await app.listen(3000);
  console.log('Activity Feed API running on http://localhost:3000/api');
}

bootstrap();
