import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TxTimelineModule } from './tx-timeline.module';

async function bootstrap() {
  const app = await NestFactory.create(TxTimelineModule);
  
  // Enable CORS
  app.enableCors();
  
  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Transaction Timeline API')
    .setDescription('API for analyzing wallet transaction timelines and patterns')
    .setVersion('1.0')
    .addTag('Transaction Timeline')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT || 3007;
  await app.listen(port);
  console.log(`Transaction Timeline API running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api`);
}
bootstrap();
