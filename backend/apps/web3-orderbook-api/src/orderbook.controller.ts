import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrderbookService } from './orderbook.service';
import { GetOrderbookDto, GetMarketDepthDto, GetOrderbookHistoryDto } from './dto/orderbook.dto';

@ApiTags('Orderbook')
@Controller('api/v1/orderbook')
export class OrderbookController {
  constructor(private readonly orderbookService: OrderbookService) {}

  @Get()
  @ApiOperation({ summary: 'Get orderbook data for a token pair' })
  @ApiQuery({ name: 'token', description: 'Base token symbol (e.g., ETH, WBTC)', required: true })
  @ApiQuery({ name: 'quote', description: 'Quote token symbol (e.g., USDC, USDT)', required: true })
  @ApiQuery({ name: 'chain', description: 'Blockchain network', enum: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'avalanche'], required: false })
  @ApiQuery({ name: 'limit', description: 'Number of price levels', required: false })
  @ApiResponse({ status: 200, description: 'Orderbook data retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async getOrderbook(
    @Query(new ValidationPipe({ transform: true })) query: GetOrderbookDto,
  ) {
    return this.orderbookService.getOrderbook(
      query.token,
      query.quote,
      query.chain || 'ethereum',
      query.limit || 20,
    );
  }

  @Get('depth')
  @ApiOperation({ summary: 'Get market depth data for a token pair' })
  @ApiQuery({ name: 'token', description: 'Base token symbol', required: true })
  @ApiQuery({ name: 'quote', description: 'Quote token symbol', required: true })
  @ApiQuery({ name: 'chain', description: 'Blockchain network', required: false })
  @ApiQuery({ name: 'depthPercent', description: 'Depth percentage from mid price', required: false })
  @ApiResponse({ status: 200, description: 'Market depth data retrieved successfully' })
  async getMarketDepth(
    @Query(new ValidationPipe({ transform: true })) query: GetMarketDepthDto,
  ) {
    return this.orderbookService.getMarketDepth(
      query.token,
      query.quote,
      query.chain || 'ethereum',
      query.depthPercent || 5,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get historical orderbook data' })
  @ApiQuery({ name: 'token', description: 'Base token symbol', required: true })
  @ApiQuery({ name: 'quote', description: 'Quote token symbol', required: true })
  @ApiQuery({ name: 'chain', description: 'Blockchain network', required: false })
  @ApiQuery({ name: 'timeframe', description: 'Time range', enum: ['15m', '1h', '4h', '24h'], required: false })
  @ApiResponse({ status: 200, description: 'Historical orderbook data retrieved successfully' })
  async getOrderbookHistory(
    @Query(new ValidationPipe({ transform: true })) query: GetOrderbookHistoryDto,
  ) {
    return this.orderbookService.getOrderbookHistory(
      query.token,
      query.quote,
      query.chain || 'ethereum',
      query.timeframe || '1h',
    );
  }

  @Get('pairs')
  @ApiOperation({ summary: 'Get supported trading pairs' })
  @ApiResponse({ status: 200, description: 'List of supported token pairs' })
  async getSupportedPairs() {
    return this.orderbookService.getSupportedPairs();
  }
}
