import { Module } from '@nestjs/common';
import { OnchainDataQueryController } from './onchain-data-query.controller';
import { OnchainDataQueryService } from './onchain-data-query.service';

@Module({
  controllers: [OnchainDataQueryController],
  providers: [OnchainDataQueryService],
  exports: [OnchainDataQueryService],
})
export class OnchainDataQueryModule {}
