import { NestFactory } from '@nestjs/core';
import { WalletGroupPortfolioModule } from './wallet-group-portfolio.module';

async function bootstrap() {
  const app = await NestFactory.create(WalletGroupPortfolioModule);
  await app.listen(3000);
  console.log('Wallet Group Portfolio API running on http://localhost:3000');
}
bootstrap();
