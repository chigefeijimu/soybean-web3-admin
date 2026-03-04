import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GasStationNetworkModule } from './src/gas-station-network.module';

async function bootstrap() {
  const app = await NestFactory.create(GasStationNetworkModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Cross-chain Gas Station Network API')
    .setDescription('AI-driven gas price optimization service across multiple chains')
    .setVersion('1.0')
    .addTag('gas-station-network')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs/gas-station-network', app, document);

  const port = process.env.PORT || 3025;
  await app.listen(port);
  console.log(`Gas Station Network API is running on port ${port}`);
}

bootstrap();
