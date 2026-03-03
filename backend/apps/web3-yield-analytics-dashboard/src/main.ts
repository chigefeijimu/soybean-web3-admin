import { NestFactory } from '@nestjs/core';
import { YieldAnalyticsModule } from './yield-analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(YieldAnalyticsModule);
  await app.listen(3000);
  console.log('Yield Analytics Dashboard API is running on port 3000');
}
bootstrap();
