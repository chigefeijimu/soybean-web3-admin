import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LiquidationAlertApiModule } from './liquidation-alert-api.module';

async function bootstrap() {
  const app = await NestFactory.create(LiquidationAlertApiModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Cross-chain Liquidation Alert API')
    .setDescription('API for monitoring DeFi liquidation risks across multiple chains')
    .setVersion('1.0')
    .addTag('liquidation')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header', description: 'API Key for authentication' })
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3014;
  await app.listen(port);
  console.log(`🚀 Liquidation Alert API running on http://localhost:${port}`);
  console.log(`📚 API Docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
