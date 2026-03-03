import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

class FindRouteDto {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: string;
}

class GetQuotesDto {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
}

class GetLiquidityDto {
  chain: string;
  token: string;
}

class CompareRoutesDto {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
}

@Controller()
@ApiTags('Cross-chain Liquidity Router')
export class LiquidityRouterController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Post('find-route')
  @ApiOperation({ summary: 'Find optimal route for cross-chain swap' })
  findRoute(@Body() dto: FindRouteDto) {
    return this.appService.findRoute(dto);
  }

  @Post('get-quotes')
  @ApiOperation({ summary: 'Get quotes from multiple bridges' })
  getQuotes(@Body() dto: GetQuotesDto) {
    return this.appService.getQuotes(dto);
  }

  @Post('get-liquidity')
  @ApiOperation({ summary: 'Get liquidity pools for a token on a chain' })
  getLiquidity(@Body() dto: GetLiquidityDto) {
    return this.appService.getLiquidity(dto);
  }

  @Post('compare-routes')
  @ApiOperation({ summary: 'Compare multiple routes for best execution' })
  compareRoutes(@Body() dto: CompareRoutesDto) {
    return this.appService.compareRoutes(dto);
  }

  @Get('supported-chains')
  @ApiOperation({ summary: 'Get list of supported chains' })
  getSupportedChains() {
    return this.appService.getSupportedChains();
  }

  @Get('supported-bridges')
  @ApiOperation({ summary: 'Get list of supported bridges' })
  getSupportedBridges() {
    return this.appService.getSupportedBridges();
  }

  @Get('popular-routes')
  @ApiOperation({ summary: 'Get popular cross-chain routes' })
  getPopularRoutes() {
    return this.appService.getPopularRoutes();
  }
}

@Module({
  imports: [],
  controllers: [LiquidityRouterController],
  providers: [AppService],
})
export class LiquidityRouterModule {}

class AppService {
  private readonly supportedChains = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', chainId: 1 },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', chainId: 137 },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', chainId: 42161 },
    { id: 'optimism', name: 'Optimism', symbol: 'ETH', chainId: 10 },
    { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', chainId: 56 },
    { id: 'base', name: 'Base', symbol: 'ETH', chainId: 8453 },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', chainId: 43114 },
    { id: 'solana', name: 'Solana', symbol: 'SOL', chainId: -1 },
    { id: 'zksync', name: 'zkSync Era', symbol: 'ETH', chainId: 324 },
    { id: 'starknet', name: 'Starknet', symbol: 'ETH', chainId: -2 },
    { id: 'linea', name: 'Linea', symbol: 'ETH', chainId: 59144 },
    { id: 'scroll', name: 'Scroll', symbol: 'ETH', chainId: 534352 },
    { id: 'mantle', name: 'Mantle', symbol: 'MNT', chainId: 5000 },
  ];

  private readonly supportedBridges = [
    { id: 'layerzero', name: 'LayerZero', type: 'omnichain', fee: 0.001, avgTime: '2-10min', security: 95 },
    { id: 'stargate', name: 'Stargate', type: 'bridge', fee: 0.005, avgTime: '5-15min', security: 92 },
    { id: 'across', name: 'Across', type: 'bridge', fee: 0.002, avgTime: '1-5min', security: 90 },
    { id: 'hop', name: 'Hop', type: 'bridge', fee: 0.003, avgTime: '5-30min', security: 88 },
    { id: 'wormhole', name: 'Wormhole', type: 'bridge', fee: 0.002, avgTime: '5-20min', security: 85 },
    { id: 'celer', name: 'Celer', type: 'bridge', fee: 0.004, avgTime: '10-30min', security: 82 },
    { id: 'axelar', name: 'Axelar', type: 'omnichain', fee: 0.003, avgTime: '5-15min', security: 88 },
    { id: 'orbiter', name: 'Orbiter', type: 'bridge', fee: 0.001, avgTime: '1-3min', security: 75 },
  ];

  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  findRoute(dto: FindRouteDto): any {
    const { fromChain, toChain, fromToken, toToken, amount, slippage = '0.5' } = dto;
    const amountNum = parseFloat(amount);
    
    // Generate multiple route options
    const routes = this.generateRoutes(fromChain, toChain, fromToken, toToken, amountNum, parseFloat(slippage));
    
    // Sort by total value received (best route first)
    routes.sort((a, b) => b.outputAmount - a.outputAmount);

    const bestRoute = routes[0];
    
    return {
      success: true,
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      inputAmount: amount,
      outputAmount: bestRoute.outputAmount.toFixed(6),
      outputAmountUSD: (bestRoute.outputAmount * this.getMockPrice(toToken)).toFixed(2),
      route: bestRoute,
      alternatives: routes.slice(1, 4).map((r, i) => ({
        rank: i + 2,
        outputAmount: r.outputAmount.toFixed(6),
        outputAmountUSD: (r.outputAmount * this.getMockPrice(toToken)).toFixed(2),
        route: r,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  getQuotes(dto: GetQuotesDto): any {
    const { fromChain, toChain, fromToken, toToken, amount } = dto;
    const amountNum = parseFloat(amount);
    
    const quotes = this.supportedBridges.map(bridge => {
      const outputAmount = this.calculateOutput(amountNum, bridge.id, fromChain, toChain, fromToken, toToken);
      const bridgeFee = amountNum * bridge.fee;
      const gasEstimate = this.estimateGas(fromChain, toChain);
      
      return {
        bridge: bridge.name,
        bridgeId: bridge.id,
        inputAmount: amount,
        outputAmount: outputAmount.toFixed(6),
        outputAmountUSD: (outputAmount * this.getMockPrice(toToken)).toFixed(2),
        bridgeFee: bridgeFee.toFixed(6),
        bridgeFeeUSD: (bridgeFee * this.getMockPrice(fromToken)).toFixed(2),
        estimatedTime: bridge.avgTime,
        securityScore: bridge.security,
        gasEstimate: gasEstimate.toFixed(6),
        totalCost: (bridgeFee + gasEstimate).toFixed(6),
        route: this.generateHopPath(bridge.id, fromChain, toChain),
      };
    });

    // Sort by output amount
    quotes.sort((a, b) => parseFloat(b.outputAmount) - parseFloat(a.outputAmount));

    return {
      success: true,
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      quotes,
      bestQuote: quotes[0],
      timestamp: new Date().toISOString(),
    };
  }

  getLiquidity(dto: GetLiquidityDto): any {
    const { chain, token } = dto;
    
    // Generate mock liquidity pools
    const pools = this.supportedBridges.slice(0, 5).map((bridge, i) => ({
      id: `${bridge.id}-${chain}-${token}`,
      bridge: bridge.name,
      chain,
      token,
      liquidity: (Math.random() * 50000000 + 1000000).toFixed(2),
      liquidityUSD: (Math.random() * 50000000 + 1000000).toFixed(2),
      volume24h: (Math.random() * 10000000 + 100000).toFixed(2),
      apy: (Math.random() * 10 + 2).toFixed(2),
      tvl: (Math.random() * 100000000 + 10000000).toFixed(2),
      utilization: (Math.random() * 60 + 20).toFixed(2),
    }));

    const totalLiquidity = pools.reduce((sum, p) => sum + parseFloat(p.liquidity), 0);
    const totalVolume24h = pools.reduce((sum, p) => sum + parseFloat(p.volume24h), 0);

    return {
      success: true,
      chain,
      token,
      pools,
      totalLiquidity: totalLiquidity.toFixed(2),
      totalVolume24h: totalVolume24h.toFixed(2),
      poolCount: pools.length,
      timestamp: new Date().toISOString(),
    };
  }

  compareRoutes(dto: CompareRoutesDto): any {
    const { fromChain, toChain, fromToken, toToken, amount } = dto;
    const amountNum = parseFloat(amount);
    
    // Generate different route types
    const directRoute = this.generateDirectRoute(fromChain, toChain, fromToken, toToken, amountNum);
    const hopRoute = this.generateHopRoute(fromChain, toChain, fromToken, toToken, amountNum);
    const bridgeRoute = this.generateBridgeRoute(fromChain, toChain, fromToken, toToken, amountNum);

    const routes = [directRoute, hopRoute, bridgeRoute].filter(r => r !== null);
    routes.sort((a, b) => b.outputAmount - a.outputAmount);

    return {
      success: true,
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      routes,
      recommendation: routes[0],
      timestamp: new Date().toISOString(),
    };
  }

  getSupportedChains() {
    return {
      success: true,
      chains: this.supportedChains,
      count: this.supportedChains.length,
    };
  }

  getSupportedBridges() {
    return {
      success: true,
      bridges: this.supportedBridges,
      count: this.supportedBridges.length,
    };
  }

  getPopularRoutes() {
    const popularRoutes = [
      { from: 'ethereum', to: 'arbitrum', fromToken: 'ETH', toToken: 'ETH', volume24h: '125000000' },
      { from: 'ethereum', to: 'optimism', fromToken: 'ETH', toToken: 'ETH', volume24h: '98000000' },
      { from: 'ethereum', to: 'polygon', fromToken: 'USDC', toToken: 'USDC', volume24h: '85000000' },
      { from: 'ethereum', to: 'base', fromToken: 'ETH', toToken: 'ETH', volume24h: '72000000' },
      { from: 'bsc', to: 'arbitrum', fromToken: 'BNB', toToken: 'BNB', volume24h: '65000000' },
      { from: 'avalanche', to: 'ethereum', fromToken: 'AVAX', toToken: 'AVAX', volume24h: '58000000' },
      { from: 'ethereum', to: 'avalanche', fromToken: 'USDT', toToken: 'USDT', volume24h: '52000000' },
      { from: 'polygon', to: 'arbitrum', fromToken: 'MATIC', toToken: 'MATIC', volume24h: '45000000' },
    ];

    return {
      success: true,
      routes: popularRoutes,
      count: popularRoutes.length,
    };
  }

  // Helper methods
  private generateRoutes(fromChain: string, toChain: string, fromToken: string, toToken: string, amount: number, slippage: number) {
    return this.supportedBridges.slice(0, 5).map(bridge => {
      const outputAmount = this.calculateOutput(amount, bridge.id, fromChain, toChain, fromToken, toToken);
      const bridgeFee = amount * bridge.fee;
      
      return {
        bridge: bridge.name,
        bridgeId: bridge.id,
        path: this.generateHopPath(bridge.id, fromChain, toChain),
        inputAmount: amount,
        outputAmount: outputAmount * (1 - slippage / 100),
        fees: {
          bridgeFee,
          estimatedGas: this.estimateGas(fromChain, toChain),
        },
        estimatedTime: bridge.avgTime,
        securityScore: bridge.security,
        steps: this.generateRouteSteps(bridge.id, fromChain, toChain, fromToken, toToken),
      };
    });
  }

  private calculateOutput(amount: number, bridgeId: string, fromChain: string, toChain: string, fromToken: string, toToken: string): number {
    // Mock calculation - in production this would query actual DEX/pricing data
    const bridgeEfficiency: Record<string, number> = {
      layerzero: 0.995,
      stargate: 0.99,
      across: 0.992,
      hop: 0.991,
      wormhole: 0.99,
      celer: 0.988,
      axelar: 0.99,
      orbiter: 0.993,
    };
    
    const efficiency = bridgeEfficiency[bridgeId] || 0.99;
    const crossChainMultiplier = fromChain !== toChain ? 0.98 : 1;
    
    return amount * efficiency * crossChainMultiplier;
  }

  private estimateGas(fromChain: string, toChain: string): number {
    if (fromChain === toChain) return 0.001;
    
    const gasMap: Record<string, number> = {
      'ethereum-arbitrum': 0.002,
      'ethereum-optimism': 0.002,
      'ethereum-polygon': 0.001,
      'ethereum-base': 0.0015,
      'polygon-arbitrum': 0.001,
      'bsc-arbitrum': 0.003,
    };
    
    const key = `${fromChain}-${toChain}`;
    return gasMap[key] || 0.002;
  }

  private generateHopPath(bridgeId: string, fromChain: string, toChain: string): string[] {
    if (fromChain === toChain) return [fromChain];
    
    const paths: Record<string, string[]> = {
      layerzero: [fromChain, toChain],
      stargate: [fromChain, 'stargate-pool', toChain],
      across: [fromChain, 'across-bridge', toChain],
      hop: [fromChain, 'hop-bridge', toChain],
      wormhole: [fromChain, 'wormhole-vaa', toChain],
    };
    
    return paths[bridgeId] || [fromChain, toChain];
  }

  private generateRouteSteps(bridgeId: string, fromChain: string, toChain: string, fromToken: string, toToken: string) {
    const steps = [
      {
        step: 1,
        action: 'approve',
        description: `Approve ${fromToken} for bridge`,
        fromChain,
        fromToken,
        estimatedTime: '30sec',
      },
    ];

    if (fromChain !== toChain) {
      steps.push({
        step: 2,
        action: 'bridge',
        description: `Bridge ${fromToken} from ${fromChain} to ${toChain}`,
        fromChain,
        toChain,
        bridge: bridgeId,
        estimatedTime: this.supportedBridges.find(b => b.id === bridgeId)?.avgTime || '5-10min',
      });
    }

    if (fromToken !== toToken) {
      steps.push({
        step: steps.length + 1,
        action: 'swap',
        description: `Swap ${fromToken} to ${toToken} on ${toChain}`,
        chain: toChain,
        protocol: 'uniswap-v3',
        estimatedTime: '30sec',
      });
    }

    return steps;
  }

  private generateDirectRoute(fromChain: string, toChain: string, fromToken: string, toToken: string, amount: number) {
    const bridge = this.supportedBridges[0];
    const outputAmount = this.calculateOutput(amount, bridge.id, fromChain, toChain, fromToken, toToken);
    
    return {
      type: 'direct',
      name: `${bridge.name} Direct`,
      bridge: bridge.name,
      outputAmount,
      outputAmountUSD: outputAmount * this.getMockPrice(toToken),
      totalFees: amount * bridge.fee + this.estimateGas(fromChain, toChain),
      estimatedTime: bridge.avgTime,
      hops: fromChain === toChain ? 1 : 2,
    };
  }

  private generateHopRoute(fromChain: string, toChain: string, fromToken: string, toToken: string, amount: number) {
    const bridge = this.supportedBridges[2]; // Across
    const outputAmount = this.calculateOutput(amount, bridge.id, fromChain, toChain, fromToken, toToken) * 0.995;
    
    return {
      type: 'hop',
      name: 'Hop via Middle Chain',
      bridge: bridge.name,
      outputAmount,
      outputAmountUSD: outputAmount * this.getMockPrice(toToken),
      totalFees: amount * bridge.fee + this.estimateGas(fromChain, toChain) * 1.2,
      estimatedTime: '10-20min',
      hops: 3,
      middleChain: 'polygon',
    };
  }

  private generateBridgeRoute(fromChain: string, toChain: string, fromToken: string, toToken: string, amount: number) {
    const bridge = this.supportedBridges[4]; // Wormhole
    const outputAmount = this.calculateOutput(amount, bridge.id, fromChain, toChain, fromToken, toToken) * 0.992;
    
    return {
      type: 'bridge',
      name: 'Wormhole Bridge',
      bridge: bridge.name,
      outputAmount,
      outputAmountUSD: outputAmount * this.getMockPrice(toToken),
      totalFees: amount * bridge.fee + this.estimateGas(fromChain, toChain) * 1.1,
      estimatedTime: bridge.avgTime,
      hops: 2,
    };
  }

  private getMockPrice(token: string): number {
    const prices: Record<string, number> = {
      ETH: 2500,
      WETH: 2500,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      MATIC: 0.85,
      BNB: 580,
      AVAX: 35,
      SOL: 120,
      ARB: 1.2,
      OP: 2.5,
      LINK: 15,
      UNI: 8,
      AAVE: 95,
      MKR: 1500,
    };
    
    return prices[token.toUpperCase()] || 1;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(LiquidityRouterModule);
  app.enableCors();
  await app.listen(3000);
  console.log('Cross-chain Liquidity Router API running on port 3000');
}
bootstrap();
