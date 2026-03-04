import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { DcaBotController } from './dca-bot.controller';
import { DcaBotService } from './dca-bot.service';

@Module({
  imports: [],
  controllers: [DcaBotController],
  providers: [DcaBotService],
})
export class DcaBotModule {}

async function bootstrap() {
  const app = await NestFactory.create(DcaBotModule);
  app.setGlobalPrefix('api/dca-bot');
  await app.listen(3000);
  console.log('DCA Bot API running on http://localhost:3000/api/dca-bot');
}
bootstrap();
