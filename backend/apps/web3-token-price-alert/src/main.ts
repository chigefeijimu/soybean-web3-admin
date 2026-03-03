import { NestFactory } from '@nestjs/core';
import { AppModule } from './web3-token-price-alert.module';
import { Web3TokenPriceAlertService } from './web3-token-price-alert.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Get service to initialize data
  const service = app.get(Web3TokenPriceAlertService);
  
  const port = process.env.PORT || 3008;
  await app.listen(port);
  console.log(`[Token Price Alert] API running on port ${port}`);
}

bootstrap();
