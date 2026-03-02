import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { PortfolioAlertApiModule } from './portfolio-alert-api.module';
import { PortfolioAlertApiController } from './portfolio-alert-api.controller';
import { PortfolioAlertApiService } from './portfolio-alert-api.service';

@Module({
  imports: [PortfolioAlertApiModule],
  controllers: [PortfolioAlertApiController],
  providers: [PortfolioAlertApiService],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  
  // 启用CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`🌐 Web3 Portfolio Alert API running on http://localhost:${port}`);
  console.log(`📋 API Docs available at http://localhost:${port}/api/info`);
}

bootstrap();
