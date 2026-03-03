import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('AI Portfolio Advisor API')
    .setDescription('AI-powered portfolio analysis and recommendation service')
    .setVersion('1.0')
    .addTag('AI Portfolio Advisor')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/ai-portfolio-advisor', app, document);

  const port = process.env.PORT || 3018;
  await app.listen(port);
  console.log(`AI Portfolio Advisor running on port ${port}`);
}
bootstrap();
