import { NestFactory } from '@nestjs/core';
import { TxPatternAnalyzerModule } from './tx-pattern-analyzer.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(TxPatternAnalyzerModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 TX Pattern Analyzer running on port ${port}`);
}

bootstrap();
