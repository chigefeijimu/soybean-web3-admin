import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DefiRiskAdjustedReturnsModule } from './defi-risk-adjusted-returns.module';

async function bootstrap() {
  const app = await NestFactory.create(DefiRiskAdjustedReturnsModule);

  const config = new DocumentBuilder()
    .setTitle('DeFi Risk-Adjusted Returns API')
    .setDescription(
      'Calculate risk-adjusted returns for DeFi liquidity pool investments. Analyzes APY, impermanent loss, gas costs, and volatility to provide comprehensive investment insights.',
    )
    .setVersion('1.0')
    .addTag('DeFi Risk-Adjusted Returns')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/defi-risk-adjusted-returns', app, document);

  await app.listen(3000);
  console.log('DeFi Risk-Adjusted Returns API running on http://localhost:3000');
  console.log('Swagger docs available at http://localhost:3000/api/docs/defi-risk-adjusted-returns');
}

bootstrap();
