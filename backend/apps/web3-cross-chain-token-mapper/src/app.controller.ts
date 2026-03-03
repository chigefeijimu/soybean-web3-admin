import { Controller, Get, Param, Query } from '@nestjs/common';
import { CrossChainTokenMapperService } from './app.service';

@Controller('cross-chain-token-mapper')
export class CrossChainTokenMapperController {
  constructor(
    private readonly crossChainTokenMapperService: CrossChainTokenMapperService,
  ) {}

  @Get('chains')
  getSupportedChains() {
    return this.crossChainTokenMapperService.getSupportedChains();
  }

  @Get('tokens')
  getAllTokens() {
    return this.crossChainTokenMapperService.getAllTokenMappings();
  }

  @Get('tokens/popular')
  getPopularTokens() {
    return this.crossChainTokenMapperService.getPopularTokens();
  }

  @Get('tokens/search')
  searchTokens(@Query('q') query: string) {
    return this.crossChainTokenMapperService.searchTokens(query || '');
  }

  @Get('tokens/:symbol')
  getTokenBySymbol(@Param('symbol') symbol: string) {
    return this.crossChainTokenMapperService.getTokenMappingWithPrices(symbol);
  }

  @Get('tokens/:symbol/comparison')
  getCrossChainComparison(@Param('symbol') symbol: string) {
    return this.crossChainTokenMapperService.getCrossChainComparison(symbol);
  }

  @Get('chain/:chain/tokens')
  getTokensByChain(@Param('chain') chain: string) {
    return this.crossChainTokenMapperService.getTokensByChain(chain);
  }

  @Get('address/:address/lookup')
  getTokenByAddress(@Param('address') address: string) {
    return this.crossChainTokenMapperService.getTokenByAddress(address);
  }

  @Get('chain/:chain/id')
  getChainId(@Param('chain') chain: string) {
    return {
      chain,
      chainId: this.crossChainTokenMapperService.getChainId(chain),
    };
  }
}
