import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { TokenPriceService } from './web3-token-price.service';

@Controller('token-price')
export class TokenPriceController {
  constructor(private readonly tokenPriceService: TokenPriceService) {}

  /**
   * Get historical price data for a token
   * @param coinId - CoinGecko coin ID (e.g., 'ethereum', 'bitcoin')
   * @param days - Number of days (1, 7, 30, 90, 365, 'max')
   */
  @Get('history/:coinId')
  async getPriceHistory(
    @Param('coinId') coinId: string,
    @Query('days') days: string = '7'
  ) {
    const daysNum = days === 'max' ? 365 * 10 : parseInt(days, 10) || 7;
    return this.tokenPriceService.getTokenPriceHistory(coinId, daysNum);
  }

  /**
   * Search for coins
   */
  @Get('search')
  async searchCoins(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return [];
    }
    return this.tokenPriceService.searchCoins(query);
  }

  /**
   * Get top coins by market cap
   */
  @Get('top')
  async getTopCoins(@Query('limit') limit: string = '50') {
    return this.tokenPriceService.getTopCoins(parseInt(limit, 10) || 50);
  }

  /**
   * Get multiple coins prices
   */
  @Get('multiple')
  async getMultiplePrices(@Query('ids') ids: string) {
    const coinIds = ids ? ids.split(',') : ['bitcoin', 'ethereum', 'solana'];
    return this.tokenPriceService.getMultiplePrices(coinIds);
  }

  /**
   * Get trending coins
   */
  @Get('trending')
  async getTrending() {
    return this.tokenPriceService.getTrendingCoins();
  }
}
