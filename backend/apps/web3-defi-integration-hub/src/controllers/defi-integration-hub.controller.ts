import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DefiIntegrationHubService } from './services/defi-integration-hub.service';
import { PositionDto, PortfolioSummaryDto, ProtocolInteractionDto, RebalanceDto } from './dto/defi-integration.dto';

@ApiTags('Defi Integration Hub')
@Controller('defi-integration-hub')
export class DefiIntegrationHubController {
  constructor(private readonly defiService: DefiIntegrationHubService) {}

  @Get('portfolio/:address')
  @ApiOperation({ summary: 'Get unified portfolio across all DeFi protocols' })
  async getUnifiedPortfolio(@Param('address') address: string) {
    return this.defiService.getUnifiedPortfolio(address);
  }

  @Get('positions/:address')
  @ApiOperation({ summary: 'Get all DeFi positions across protocols' })
  async getAllPositions(@Param('address') address: string) {
    return this.defiService.getAllPositions(address);
  }

  @Post('positions')
  @ApiOperation({ summary: 'Add or update a DeFi position' })
  async addPosition(@Body() dto: PositionDto) {
    return this.defiService.addPosition(dto);
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get supported protocols list' })
  async getSupportedProtocols() {
    return this.defiService.getSupportedProtocols();
  }

  @Get('protocol/:protocol/positions/:address')
  @ApiOperation({ summary: 'Get positions for specific protocol' })
  async getProtocolPositions(
    @Param('protocol') protocol: string,
    @Param('address') address: string,
  ) {
    return this.defiService.getProtocolPositions(protocol, address);
  }

  @Get('summary/:address')
  @ApiOperation({ summary: 'Get portfolio summary with risk analysis' })
  async getPortfolioSummary(@Param('address') address: string) {
    return this.defiService.getPortfolioSummary(address);
  }

  @Post('interact')
  @ApiOperation({ summary: 'Execute protocol interaction' })
  async executeInteraction(@Body() dto: ProtocolInteractionDto) {
    return this.defiService.executeInteraction(dto);
  }

  @Post('rebalance')
  @ApiOperation({ summary: 'Get rebalancing recommendations' })
  async getRebalanceRecommendations(@Body() dto: RebalanceDto) {
    return this.defiService.getRebalanceRecommendations(dto);
  }

  @Get('history/:address')
  @ApiOperation({ summary: 'Get position history' })
  @ApiQuery({ name: 'protocol', required: false })
  async getPositionHistory(
    @Param('address') address: string,
    @Query('protocol') protocol?: string,
  ) {
    return this.defiService.getPositionHistory(address, protocol);
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Find yield opportunities across protocols' })
  @ApiQuery({ name: 'chain', required: false })
  @ApiQuery({ name: 'minTvL', required: false })
  async findYieldOpportunities(
    @Query('chain') chain?: string,
    @Query('minTvL') minTvL?: number,
  ) {
    return this.defiService.findYieldOpportunities(chain, minTvL);
  }

  @Get('health/:address')
  @ApiOperation({ summary: 'Get portfolio health score' })
  async getPortfolioHealth(@Param('address') address: string) {
    return this.defiService.getPortfolioHealth(address);
  }
}
