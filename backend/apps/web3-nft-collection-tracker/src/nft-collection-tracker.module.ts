import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NftCollectionTrackerController } from './nft-collection-tracker.controller';

@Module({
  imports: [HttpModule],
  controllers: [NftCollectionTrackerController],
  providers: [],
})
export class NftCollectionTrackerModule {}
