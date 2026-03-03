import { NestFactory } from '@nestjs/core';
import { DefiUsageAnalyticsModule } from './defi-usage-analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiUsageAnalyticsModule);
  
  // Enable CORS
  app.enableCors();
  
  const port = process.env.PORT || 3019;
  await app.listen(port);
  console.log(`DefiUsageAnalytics service running on port ${port}`);
}

bootstrap();
