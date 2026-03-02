import { Module } from '@nestjs/common';
import { NftPortfolioTrackerController } from './nft-portfolio-tracker.controller';
import { NftPortfolioTrackerService } from './nft-portfolio-tracker.service';

@Module({
  controllers: [NftPortfolioTrackerController],
  providers: [NftPortfolioTrackerService],
  exports: [NftPortfolioTrackerService],
})
export class NftPortfolioTrackerModule {}
