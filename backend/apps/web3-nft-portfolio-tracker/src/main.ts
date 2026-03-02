import { NestFactory } from '@nestjs/core';
import { NftPortfolioTrackerModule } from './nft-portfolio-tracker.module';

async function bootstrap() {
  const app = await NestFactory.create(NftPortfolioTrackerModule);
  await app.listen(3000);
  console.log('NFT Portfolio Tracker API running on port 3000');
}
bootstrap();
