import { Module } from '@nestjs/common';
import { GovernanceDelegateSearchController } from './governance-delegate-search.controller';
import { GovernanceDelegateSearchService } from './governance-delegate-search.service';

@Module({
  imports: [],
  controllers: [GovernanceDelegateSearchController],
  providers: [GovernanceDelegateSearchService],
})
export class AppModule {}
