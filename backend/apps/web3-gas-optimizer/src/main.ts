import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GasOptimizerController } from './gas-optimizer.controller';
import { GasOptimizerService } from './gas-optimizer.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [GasOptimizerController],
  providers: [GasOptimizerService],
})
export class GasOptimizerModule {}

async function bootstrap() {
  const app = await NestFactory.create(GasOptimizerModule);
  app.enableCors();
  await app.listen(3000);
  console.log('Gas Optimizer API running on port 3000');
}
bootstrap();
