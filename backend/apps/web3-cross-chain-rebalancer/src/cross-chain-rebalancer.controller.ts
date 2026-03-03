import { Controller, Get, Post, Query, Body, Param } from '@nestjs/common';
import { CrossChainRebalancerService } from './cross-chain-rebalancer.service';

interface RebalanceRequest {
  walletAddress: string;
  targetAllocations: {
    chain: string;
    token: string;
    percentage: number;
  }[];
  threshold?: number;
}

interface PortfolioQuery {
  walletAddress: string;
  chains?: string;
}

@Controller('api/cross-chain-rebalancer')
export class CrossChainRebalancerController {
  constructor(private readonly rebalancerService: CrossChainRebalancerService) {}

  /**
   * GET /api/cross-chain-rebalancer/portfolio/:address
   * Get current portfolio allocation across chains
   */
  @Get('portfolio/:address')
  async getPortfolio(
    @Param('address') address: string,
    @Query('chains') chains: string = 'ethereum,polygon,arbitrum,optimism,bsc,base,avalanche',
  ) {
    const chainList = chains.split(',');
    const portfolio = await this.rebalancerService.getPortfolioAllocation(address, chainList);
    return {
      success: true,
      data: portfolio,
    };
  }

  /**
   * POST /api/cross-chain-rebalancer/analyze
   * Analyze portfolio and suggest rebalancing
   */
  @Post('analyze')
  async analyzePortfolio(@Body() request: RebalanceRequest) {
    const analysis = await this.rebalancerService.analyzeRebalance(
      request.walletAddress,
      request.targetAllocations,
      request.threshold || 5,
    );
    return {
      success: true,
      data: analysis,
    };
  }

  /**
   * POST /api/cross-chain-rebalancer/rebalance
   * Generate rebalancing transactions
   */
  @Post('rebalance')
  async generateRebalanceTx(@Body() request: RebalanceRequest) {
    const txs = await this.rebalancerService.generateRebalanceTransactions(
      request.walletAddress,
      request.targetAllocations,
    );
    return {
      success: true,
      data: txs,
    };
  }

  /**
   * GET /api/cross-chain-rebalancer/chains
   * Get supported chains info
   */
  @Get('chains')
  async getSupportedChains() {
    const chains = this.rebalancerService.getSupportedChains();
    return {
      success: true,
      data: chains,
    };
  }

  /**
   * GET /api/cross-chain-rebalancer/opportunities
   * Find cross-chain arbitrage opportunities
   */
  @Get('opportunities')
  async findOpportunities(@Query('minProfit') minProfit: string = '1') {
    const opportunities = await this.rebalancerService.findArbitrageOpportunities(
      parseFloat(minProfit),
    );
    return {
      success: true,
      data: opportunities,
    };
  }

  /**
   * GET /api/cross-chain-rebalancer/history/:address
   * Get rebalancing history
   */
  @Get('history/:address')
  async getHistory(
    @Param('address') address: string,
    @Query('limit') limit: string = '10',
  ) {
    const history = await this.rebalancerService.getRebalanceHistory(
      address,
      parseInt(limit),
    );
    return {
      success: true,
      data: history,
    };
  }
}
