import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GovernanceAggregatorController } from './controllers/governance-aggregator.controller';
import { GovernanceAggregatorService } from './services/governance-aggregator.service';
import { GovernanceAggregator, GovernanceDelegate, GovernanceStats } from './entities/governance-aggregator.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GovernanceAggregator, GovernanceDelegate, GovernanceStats]),
  ],
  controllers: [GovernanceAggregatorController],
  providers: [GovernanceAggregatorService],
  exports: [GovernanceAggregatorService],
})
export class GovernanceAggregatorModule {}
