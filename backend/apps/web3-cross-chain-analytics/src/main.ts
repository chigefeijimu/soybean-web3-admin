import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { CrossChainAnalyticsModule } from './cross-chain-analytics.module';

async function bootstrap() {
  const app = await NestFactory.create(CrossChainAnalyticsModule);
  
  const config = new DocumentBuilder()
    .setTitle('Cross-chain Analytics API')
    .setDescription('Unified cross-chain analytics dashboard with TVL, transaction volume, gas prices, and active addresses across multiple blockchains')
    .setVersion('1.0')
    .addTag('Cross-chain Analytics')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/cross-chain-analytics', app, document);

  await app.listen(3000);
  console.log('Cross-chain Analytics API running on http://localhost:3000');
}

bootstrap();
