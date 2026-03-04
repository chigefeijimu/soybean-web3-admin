import { NestFactory } from '@nestjs/core';
import { AppModule } from './liquidity-pool-scanner.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Cross-chain Liquidity Pool Scanner API')
    .setDescription('Cross-chain Liquidity Pool Scanner - Discover and analyze liquidity pools across multiple DEXes')
    .setVersion('1.0')
    .addTag('Liquidity Pool Scanner')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  app.setGlobalPrefix('api/v1/liquidity-pools');
  await app.listen(3000);
  console.log('Liquidity Pool Scanner API running on http://localhost:3000');
}
bootstrap();
