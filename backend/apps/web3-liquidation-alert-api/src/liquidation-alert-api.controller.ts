import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { LiquidationAlertApiService, LiquidationPosition, AlertSubscription, AlertTrigger } from './liquidation-alert-api.service';

class GetPositionsDto {
  @ApiQuery({ required: false })
  chain?: string;

  @ApiQuery({ required: false })
  protocol?: string;

  @ApiQuery({ required: false })
  riskLevel?: string;

  @ApiQuery({ required: false })
  minHealthFactor?: number;

  @ApiQuery({ required: false, description: 'Limit number of results' })
  limit?: number;

  @ApiQuery({ required: false, description: 'Offset for pagination' })
  offset?: number;
}

class GetOpportunitiesDto {
  @ApiQuery({ required: false })
  chain?: string;

  @ApiQuery({ required: false })
  protocol?: string;

  @ApiQuery({ required: false })
  limit?: number;
}

class GetPositionByAddressDto {
  @ApiParam({ name: 'address', description: 'Wallet address to query' })
  address: string;

  @ApiQuery({ required: false })
  chain?: string;
}

class CreateSubscriptionDto {
  @ApiBody({ schema: { example: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00', chains: ['ethereum', 'polygon'], protocols: ['aave'], healthFactorThreshold: 1.2, webhookUrl: 'https://example.com/webhook' } } })
  address: string;
  chains?: string[];
  protocols?: string[];
  healthFactorThreshold?: number;
  webhookUrl?: string;
  email?: string;
  telegram?: string;
}

class UpdateSubscriptionDto {
  chains?: string[];
  protocols?: string[];
  healthFactorThreshold?: number;
  webhookUrl?: string;
  email?: string;
  telegram?: string;
  isActive?: boolean;
}

class GetAlertsDto {
  @ApiQuery({ required: false })
  subscriptionId?: string;

  @ApiQuery({ required: false })
  address?: string;

  @ApiQuery({ required: false })
  from?: string;

  @ApiQuery({ required: false })
  to?: string;

  @ApiQuery({ required: false })
  limit?: number;

  @ApiQuery({ required: false })
  offset?: number;
}

@ApiTags('liquidation')
@Controller('api/v1/liquidation')
export class LiquidationAlertApiController {
  constructor(private readonly liquidationService: LiquidationAlertApiService) {}

  @Get('positions')
  @ApiOperation({ summary: 'Get liquidation positions with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of positions with pagination info' })
  async getPositions(@Query() query: GetPositionsDto) {
    return this.liquidationService.getPositions({
      chain: query.chain,
      protocol: query.protocol,
      riskLevel: query.riskLevel,
      minHealthFactor: query.minHealthFactor ? Number(query.minHealthFactor) : undefined,
      limit: query.limit ? Number(query.limit) : 20,
      offset: query.offset ? Number(query.offset) : 0,
    });
  }

  @Get('positions/:address')
  @ApiOperation({ summary: 'Get positions for a specific wallet address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiQuery({ required: false, name: 'chain' })
  async getPositionByAddress(@Param('address') address: string, @Query('chain') chain?: string) {
    return this.liquidationService.getPositionByAddress(address, chain);
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Get liquidation opportunities (high risk positions)' })
  @ApiQuery({ required: false, name: 'chain' })
  @ApiQuery({ required: false, name: 'protocol' })
  @ApiQuery({ required: false, name: 'limit' })
  async getLiquidationOpportunities(@Query() query: GetOpportunitiesDto) {
    return this.liquidationService.getLiquidationOpportunities({
      chain: query.chain,
      protocol: query.protocol,
      limit: query.limit ? Number(query.limit) : 10,
    });
  }

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create a new liquidation alert subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(@Body() body: CreateSubscriptionDto) {
    return this.liquidationService.createSubscription(body);
  }

  @Get('subscriptions/:address')
  @ApiOperation({ summary: 'Get all subscriptions for a wallet address' })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  async getSubscriptions(@Param('address') address: string) {
    return this.liquidationService.getSubscriptions(address);
  }

  @Put('subscriptions/:id')
  @ApiOperation({ summary: 'Update an existing subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  async updateSubscription(@Param('id') id: string, @Body() body: UpdateSubscriptionDto) {
    return this.liquidationService.updateSubscription(id, body);
  }

  @Delete('subscriptions/:id')
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  async deleteSubscription(@Param('id') id: string) {
    return this.liquidationService.deleteSubscription(id);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get triggered alerts with optional filtering' })
  @ApiQuery({ required: false, name: 'subscriptionId' })
  @ApiQuery({ required: false, name: 'address' })
  @ApiQuery({ required: false, name: 'from' })
  @ApiQuery({ required: false, name: 'to' })
  @ApiQuery({ required: false, name: 'limit' })
  @ApiQuery({ required: false, name: 'offset' })
  async getAlerts(@Query() query: GetAlertsDto) {
    return this.liquidationService.getAlerts({
      subscriptionId: query.subscriptionId,
      address: query.address,
      from: query.from,
      to: query.to,
      limit: query.limit ? Number(query.limit) : 20,
      offset: query.offset ? Number(query.offset) : 0,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get market statistics for liquidation risk' })
  async getMarketStats() {
    return this.liquidationService.getMarketStats();
  }

  @Get('networks')
  @ApiOperation({ summary: 'Get supported chains and protocols' })
  async getSupportedNetworks() {
    return this.liquidationService.getSupportedNetworks();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return {
      status: 'ok',
      service: 'liquidation-alert-api',
      timestamp: new Date().toISOString(),
    };
  }
}
