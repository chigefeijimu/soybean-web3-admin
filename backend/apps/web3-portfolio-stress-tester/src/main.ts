import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PortfolioStressTesterModule } from './portfolio-stress-tester.module';

async function bootstrap() {
  const app = await NestFactory.create(PortfolioStressTesterModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Portfolio Stress Tester API')
    .setDescription('Cross-chain DeFi Portfolio Stress Tester - Analyze portfolio resilience under various market crash scenarios')
    .setVersion('1.0')
    .addTag('Portfolio Stress Tester')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3105;
  await app.listen(port);
  console.log(`Portfolio Stress Tester running on port ${port}`);
}

bootstrap();
