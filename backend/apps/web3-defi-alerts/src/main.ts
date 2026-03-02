import { NestFactory } from '@nestjs/core';
import { DefiAlertsModule } from './defi-alerts.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(DefiAlertsModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const logger = new Logger('DefiAlerts');
  const port = process.env.DEFI_ALERTS_PORT || 3016;
  
  await app.listen(port);
  logger.log(`DeFi Alerts Service running on port ${port}`);
}

bootstrap();
