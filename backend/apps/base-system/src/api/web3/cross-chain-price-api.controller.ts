import { Controller, Get, Param } from '@nestjs/common';
import { CrossChainPriceApiService } from './cross-chain-price-api.service';

@Controller('api/cross-chain-price')
export class CrossChainPriceApiController {
  constructor(private readonly crossChainPriceService: CrossChainPriceApiService) {}

  @Get('chains')
  async getSupportedChains() {
    return {
      success: true,
      data: await this.crossChainPriceService.getSupportedChains(),
    };
  }

  @Get('tokens')
  async getSupportedTokens() {
    return {
      success: true,
      data: await this.crossChainPriceService.getSupportedTokens(),
    };
  }

  @Get('chain/:chain')
  async getPricesByChain(@Param('chain') chain: string) {
    try {
      const prices = await this.crossChainPriceService.getPricesByChain(chain);
      return {
        success: true,
        data: prices,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('token/:symbol')
  async getCrossChainPrice(@Param('symbol') symbol: string) {
    try {
      const price = await this.crossChainPriceService.getCrossChainPrice(symbol);
      return {
        success: true,
        data: price,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('all')
  async getAllCrossChainPrices() {
    try {
      const prices = await this.crossChainPriceService.getAllCrossChainPrices();
      return {
        success: true,
        data: prices,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('comparison/:symbol')
  async getPriceComparison(@Param('symbol') symbol: string) {
    try {
      const comparison = await this.crossChainPriceService.getPriceComparison(symbol);
      return {
        success: true,
        data: comparison,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('market')
  async getMarketOverview() {
    try {
      const overview = await this.crossChainPriceService.getMarketOverview();
      return {
        success: true,
        data: overview,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      service: 'Cross-chain Price API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
