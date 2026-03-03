import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DefiPortfolioSimulatorModule } from './defi-portfolio-simulator.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiPortfolioSimulatorModule);
  
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
    .setTitle('DeFi Portfolio Simulator API')
    .setDescription('Simulate and analyze DeFi portfolio strategies')
    .setVersion('1.0')
    .addTag('DeFi Portfolio Simulator')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/defi-portfolio-simulator', app, document);

  const port = process.env.PORT || 3008;
  await app.listen(port);
  console.log(`DeFi Portfolio Simulator running on port ${port}`);
}

bootstrap();
