import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GasPriceApiController } from './controllers/gas-price-api.controller';
import { GasPriceApiService } from './services/gas-price-api.service';
import { GasPriceApiCacheService } from './services/gas-price-api-cache.service';

@Module({
  imports: [HttpModule.register({ timeout: 10000 })],
  controllers: [GasPriceApiController],
  providers: [GasPriceApiService, GasPriceApiCacheService],
  exports: [GasPriceApiService],
})
export class GasPriceApiModule {}
