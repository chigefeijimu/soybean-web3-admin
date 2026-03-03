import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DefiNewsController } from './defi-news.controller';
import { DefiNewsService } from './defi-news.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
  ],
  controllers: [DefiNewsController],
  providers: [DefiNewsService],
})
export class DefiNewsModule {}

async function bootstrap() {
  const app = await NestFactory.create(DefiNewsModule);
  await app.listen(3000);
  console.log('DeFi News API running on port 3000');
}
bootstrap();
