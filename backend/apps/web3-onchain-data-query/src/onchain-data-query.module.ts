import { Module } from '@nestjs/common';
import { OnchainDataQueryController } from './controllers/onchain-data-query.controller';
import { OnchainDataQueryService } from './services/onchain-data-query.service';

@Module({
  controllers: [OnchainDataQueryController],
  providers: [OnchainDataQueryService],
  exports: [OnchainDataQueryService],
})
export class OnchainDataQueryModule {}
