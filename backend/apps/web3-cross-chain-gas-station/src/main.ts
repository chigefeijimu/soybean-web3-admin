import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GasStationModule } from './gas-station.module';

async function bootstrap() {
  const app = await NestFactory.create(GasStationModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  const config = new DocumentBuilder()
    .setTitle('Cross-chain Gas Station API')
    .setDescription('Pay gas fees with any token across multiple chains')
    .setVersion('1.0')
    .addTag('gas-station')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs/gas-station', app, document);
  
  await app.listen(3000);
  console.log('🌈 Cross-chain Gas Station API running on http://localhost:3000');
}
bootstrap();
