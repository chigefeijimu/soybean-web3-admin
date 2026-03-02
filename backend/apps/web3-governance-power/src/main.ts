import { NestFactory } from '@nestjs/core';
import { GovernancePowerModule } from './governance-power.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(GovernancePowerModule);
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  app.setGlobalPrefix('api/governance-power');
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.GOVERNANCE_POWER_PORT || 3009;
  await app.listen(port);
  console.log(`🚀 Governance Power API running on http://localhost:${port}/api/governance-power`);
}

bootstrap();
