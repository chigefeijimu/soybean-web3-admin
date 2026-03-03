import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CrossChainAnalyticsService } from './cross-chain-analytics.service';
import { JwtAuthGuard } from '../../base-system/base-auth/guards/jwt-auth.guard';
import { Public } from '../../base-system/base-auth/decorators/public.decorator';

class AnalyticsQueryDto {
  @ApiQuery({ required: false, description: 'Time range: 24h, 7d, 30d, 90d' })
  @Query()
  range?: string = '7d';

  @ApiQuery({ required: false, description: 'Comma-separated chain IDs' })
  @Query()
  chains?: string;
}

class ChainOverviewDto {
  @ApiQuery({ required: false, description: 'Chain ID (e.g., eth, polygon, arbitrum)' })
  @Query()
  chainId?: string;
}

@ApiTags('Cross-chain Analytics')
@Controller('cross-chain-analytics')
export class CrossChainAnalyticsController {
  constructor(private readonly analyticsService: CrossChainAnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get cross-chain analytics overview' })
  async getOverview(@Query(new ValidationPipe({ transform: true })) query: AnalyticsQueryDto) {
    return this.analyticsService.getOverview(query.range, query.chains);
  }

  @Get('chain/:chainId')
  @ApiOperation({ summary: 'Get specific chain analytics' })
  async getChainAnalytics(@Query('chainId') chainId: string) {
    return this.analyticsService.getChainAnalytics(chainId);
  }

  @Get('tvl-comparison')
  @ApiOperation({ summary: 'Compare TVL across chains' })
  async getTvlComparison(@Query(new ValidationPipe({ transform: true })) query: AnalyticsQueryDto) {
    return this.analyticsService.getTvlComparison(query.range);
  }

  @Get('transaction-volume')
  @ApiOperation({ summary: 'Get transaction volume analytics' })
  async getTransactionVolume(@Query(new ValidationPipe({ transform: true })) query: AnalyticsQueryDto) {
    return this.analyticsService.getTransactionVolume(query.range, query.chains);
  }

  @Get('gas-prices')
  @ApiOperation({ summary: 'Get gas prices across chains' })
  async getGasPrices() {
    return this.analyticsService.getGasPrices();
  }

  @Get('active-addresses')
  @ApiOperation({ summary: 'Get active addresses analytics' })
  async getActiveAddresses(@Query(new ValidationPipe({ transform: true })) query: AnalyticsQueryDto) {
    return this.analyticsService.getActiveAddresses(query.range, query.chains);
  }

  @Get('chain-health')
  @ApiOperation({ summary: 'Get chain health metrics' })
  async getChainHealth() {
    return this.analyticsService.getChainHealth();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get cross-chain trends' })
  async getTrends(@Query(new ValidationPipe({ transform: true })) query: AnalyticsQueryDto) {
    return this.analyticsService.getTrends(query.range);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get chain ranking by various metrics' })
  async getChainRanking(@Query('metric') metric: string = 'tvl') {
    return this.analyticsService.getChainRanking(metric);
  }

  @Get('historical')
  @ApiOperation({ summary: 'Get historical analytics data' })
  async getHistorical(
    @Query('chainId') chainId: string,
    @Query('metric') metric: string,
    @Query('range') range: string = '30d',
  ) {
    return this.analyticsService.getHistorical(chainId, metric, range);
  }
}
