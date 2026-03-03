import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DefiIntegrationHubModule } from './defi-integration-hub.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiIntegrationHubModule);
  
  const config = new DocumentBuilder()
    .setTitle('DeFi Integration Hub API')
    .setDescription('Unified DeFi Protocol Integration Hub - Manage multi-protocol positions across chains')
    .setVersion('1.0')
    .addTag('Defi Integration Hub')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT || 3015;
  await app.listen(port);
  console.log(`DeFi Integration Hub running on port ${port}`);
}

bootstrap();
