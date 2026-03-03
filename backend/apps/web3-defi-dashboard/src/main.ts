import { NestFactory } from '@nestjs/core';
import { DefiDashboardModule } from './defi-dashboard.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiDashboardModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  const port = process.env.PORT || 3018;
  await app.listen(port);
  console.log(`DeFi Dashboard API running on port ${port}`);
}
bootstrap();
