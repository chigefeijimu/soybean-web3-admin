import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceAggregatorModule } from './web3-governance-aggregator.module';
import { GovernanceAggregator, GovernanceDelegate, GovernanceStats } from './entities/governance-aggregator.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'podlock',
      entities: [GovernanceAggregator, GovernanceDelegate, GovernanceStats],
      synchronize: true,
    }),
    GovernanceAggregatorModule,
  ],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
  console.log('Governance Aggregator API running on http://localhost:3000/api');
}
bootstrap();
