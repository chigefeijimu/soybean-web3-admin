import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PortfolioBackupController } from './portfolio-backup.controller';
import { PortfolioBackupService } from './portfolio-backup.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [PortfolioBackupController],
  providers: [PortfolioBackupService],
})
export class PortfolioBackupModule {}

async function bootstrap() {
  const app = await NestFactory.create(PortfolioBackupModule);
  app.enableCors();
  await app.listen(3000);
  console.log('Portfolio Backup API running on port 3000');
}
bootstrap();
