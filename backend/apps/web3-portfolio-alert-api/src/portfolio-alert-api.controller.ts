import { Controller, Get, Post, Delete, Param, Query, Body } from '@nestjs/common';
import { PortfolioAlertApiService, Alert, TokenPrice, PortfolioResponse, GasPriceResponse, TrendingToken } from './portfolio-alert-api.service';

class CreatePriceAlertDto {
  userId: string;
  token: string;
  chain: string;
  condition: 'above' | 'below';
  threshold: number;
  webhookUrl?: string;
}

class CreateHoldingAlertDto {
  userId: string;
  token: string;
  chain: string;
  changePercent: number;
  webhookUrl?: string;
}

class CreateGasAlertDto {
  userId: string;
  chain: string;
  condition: 'above' | 'below';
  threshold: number;
  webhookUrl?: string;
}

class ToggleAlertDto {
  userId: string;
  enabled: boolean;
}

class BatchPricesDto {
  symbols: string[];
  chain?: string;
}

@Controller('api')
export class PortfolioAlertApiController {
  constructor(private readonly portfolioAlertApiService: PortfolioAlertApiService) {}

  // ============ 价格接口 ============

  @Get('price/:symbol')
  async getTokenPrice(
    @Param('symbol') symbol: string,
    @Query('chain') chain: string = 'eth',
  ): Promise<TokenPrice | { error: string }> {
    const price = await this.portfolioAlertApiService.getTokenPrice(symbol, chain);
    if (!price) {
      return { error: 'Token not found' };
    }
    return price;
  }

  @Post('prices')
  async getBatchPrices(@Body() body: BatchPricesDto): Promise<TokenPrice[]> {
    return this.portfolioAlertApiService.getBatchPrices(body.symbols, body.chain || 'eth');
  }

  @Get('trending')
  async getTrendingTokens(@Query('limit') limit: string = '10'): Promise<TrendingToken[]> {
    return this.portfolioAlertApiService.getTrendingTokens(parseInt(limit) || 10);
  }

  // ============ 持仓接口 ============

  @Get('portfolio/:address')
  async getWalletPortfolio(
    @Param('address') address: string,
    @Query('chain') chain: string = 'eth',
  ): Promise<PortfolioResponse> {
    return this.portfolioAlertApiService.getWalletPortfolio(address, chain);
  }

  // ============ 提醒接口 ============

  @Post('alerts/price')
  async createPriceAlert(@Body() body: CreatePriceAlertDto): Promise<Alert> {
    return this.portfolioAlertApiService.createPriceAlert({
      userId: body.userId,
      token: body.token,
      chain: body.chain,
      condition: body.condition,
      threshold: body.threshold,
      webhookUrl: body.webhookUrl,
    });
  }

  @Post('alerts/holding')
  async createHoldingAlert(@Body() body: CreateHoldingAlertDto): Promise<Alert> {
    return this.portfolioAlertApiService.createHoldingAlert({
      userId: body.userId,
      token: body.token,
      chain: body.chain,
      changePercent: body.changePercent,
      webhookUrl: body.webhookUrl,
    });
  }

  @Post('alerts/gas')
  async createGasAlert(@Body() body: CreateGasAlertDto): Promise<Alert> {
    return this.portfolioAlertApiService.createGasAlert({
      userId: body.userId,
      chain: body.chain,
      condition: body.condition,
      threshold: body.threshold,
      webhookUrl: body.webhookUrl,
    });
  }

  @Get('alerts')
  async getUserAlerts(@Query('userId') userId: string): Promise<Alert[]> {
    return this.portfolioAlertApiService.getUserAlerts(userId);
  }

  @Get('alerts/price/:symbol')
  async getPriceAlerts(
    @Param('symbol') symbol: string,
    @Query('chain') chain: string = 'eth',
  ) {
    return this.portfolioAlertApiService.getPriceAlerts(symbol, chain);
  }

  @Delete('alerts/:id')
  async deleteAlert(
    @Param('id') alertId: string,
    @Query('userId') userId: string,
  ): Promise<{ success: boolean }> {
    const result = await this.portfolioAlertApiService.deleteAlert(alertId, userId);
    return { success: result };
  }

  @Post('alerts/:id/toggle')
  async toggleAlert(
    @Param('id') alertId: string,
    @Body() body: ToggleAlertDto,
  ): Promise<Alert | { error: string }> {
    const alert = await this.portfolioAlertApiService.toggleAlert(alertId, body.userId, body.enabled);
    if (!alert) {
      return { error: 'Alert not found or unauthorized' };
    }
    return alert;
  }

  @Get('alerts/history')
  async getAlertHistory(
    @Query('userId') userId: string,
    @Query('limit') limit: string = '50',
  ) {
    return this.portfolioAlertApiService.getAlertHistory(userId, parseInt(limit) || 50);
  }

  @Post('alerts/check')
  async checkAlerts() {
    const triggered = await this.portfolioAlertApiService.checkAlerts();
    return { triggered: triggered.length, alerts: triggered };
  }

  // ============ Gas价格接口 ============

  @Get('gas/:chain')
  async getGasPrice(@Param('chain') chain: string): Promise<GasPriceResponse | { error: string }> {
    const price = await this.portfolioAlertApiService.getGasPrice(chain);
    if (!price) {
      return { error: 'Chain not supported' };
    }
    return price;
  }

  @Post('gas/batch')
  async getBatchGasPrices(@Body() body: { chains: string[] }): Promise<GasPriceResponse[]> {
    return this.portfolioAlertApiService.getBatchGasPrices(body.chains);
  }

  // ============ 系统接口 ============

  @Get('health')
  async healthCheck() {
    return this.portfolioAlertApiService.healthCheck();
  }

  @Get('info')
  async getApiInfo() {
    return this.portfolioAlertApiService.getApiInfo();
  }
}
