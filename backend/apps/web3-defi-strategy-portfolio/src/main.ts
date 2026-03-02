import { NestFactory } from '@nestjs/core';
import { DefiStrategyPortfolioModule } from './defi-strategy-portfolio.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiStrategyPortfolioModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  const port = process.env.PORT || 3006;
  await app.listen(port);
  console.log(`🚀 DeFi Strategy Portfolio API running on port ${port}`);
}

bootstrap();
