import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DexTradingJournalModule } from './dex-trading-journal.module';

async function bootstrap() {
  const app = await NestFactory.create(DexTradingJournalModule);
  
  const config = new DocumentBuilder()
    .setTitle('DEX Trading Journal API')
    .setDescription('Cross-chain DEX Trading Journal API - Track and analyze your DeFi trading activities')
    .setVersion('1.0')
    .addTag('DEX Trading Journal')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(3000);
  console.log('DEX Trading Journal API is running on http://localhost:3000');
}

bootstrap();
