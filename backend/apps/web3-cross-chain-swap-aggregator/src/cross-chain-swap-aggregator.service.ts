import { Injectable } from '@nestjs/common';

interface SwapRoute {
  routeId: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amountIn: string;
  amountOut: string;
  estimatedGas: string;
  gasCost: string;
  totalCost: string;
  priceImpact: number;
  dex: string;
  hops: number;
  path: string[];
  duration: number;
  slippage: number;
  confidence: number;
}

interface QuoteRequest {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number;
}

@Injectable()
export class CrossChainSwapAggregatorService {
  private supportedChains = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', chainId: 1 },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', chainId: 137 },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', chainId: 42161 },
    { id: 'optimism', name: 'Optimism', symbol: 'ETH', chainId: 10 },
    { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', chainId: 56 },
    { id: 'base', name: 'Base', symbol: 'ETH', chainId: 8453 },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', chainId: 43114 },
    { id: 'solana', name: 'Solana', symbol: 'SOL', chainId: -1 },
  ];

  private supportedDexs = [
    { id: 'uniswap_v3', name: 'Uniswap V3', chain: 'ethereum', type: 'AMM' },
    { id: 'uniswap_v2', name: 'Uniswap V2', chain: 'ethereum', type: 'AMM' },
    { id: 'sushiswap', name: 'SushiSwap', chain: 'ethereum', type: 'AMM' },
    { id: 'curve', name: 'Curve', chain: 'ethereum', type: 'StableSwap' },
    { id: 'balancer', name: 'Balancer', chain: 'ethereum', type: 'AMM' },
    { id: 'pancakeswap', name: 'PancakeSwap', chain: 'bsc', type: 'AMM' },
    { id: 'quickswap', name: 'QuickSwap', chain: 'polygon', type: 'AMM' },
    { id: 'aerodrome', name: 'Aerodrome', chain: 'base', type: 'AMM' },
    { id: 'velodrome', name: 'Velodrome', chain: 'optimism', type: 'AMM' },
    { id: 'trader_joe', name: 'Trader Joe', chain: 'avalanche', type: 'AMM' },
    { id: 'orca', name: 'Orca', chain: 'solana', type: 'AMM' },
    { id: 'raydium', name: 'Raydium', chain: 'solana', type: 'AMM' },
  ];

  private tokenList: Record<string, any[]> = {
    ethereum: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6 },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
      { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave', decimals: 18 },
      { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    ],
    polygon: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'MATIC', name: 'Polygon', decimals: 18 },
      { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether', decimals: 6 },
      { address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
      { address: '0x53E0bca35eC356BD5ddDFEbdD1Fc0fD03FaBad9', symbol: 'LINK', name: 'Chainlink', decimals: 18 },
    ],
    arbitrum: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', symbol: 'USDT', name: 'Tether', decimals: 6 },
      { address: '0x2f2a2543B76A4166549F7aaB2e75Bef0a1C71A1c', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    ],
    optimism: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'Tether', decimals: 6 },
    ],
    bsc: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'BNB', name: 'BNB', decimals: 18 },
      { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether', decimals: 18 },
      { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
    ],
    base: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18 },
      { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    ],
    avalanche: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'AVAX', name: 'Avalanche', decimals: 18 },
      { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { address: '0x9702230A8Ea53601f5cD2dc6f84F11d8d0E2C84', symbol: 'USDT', name: 'Tether', decimals: 6 },
    ],
    solana: [
      { address: 'So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', decimals: 9 },
      { address: 'EPjFWdd5AufqSSFqMlwBcJib2MaxQxiNU6GPV8VSE93', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    ],
  };

  private tokenPrices: Record<string, number> = {
    ETH: 2450.5,
    USDC: 1.0,
    USDT: 1.0,
    WBTC: 68500.0,
    MATIC: 0.85,
    BNB: 580.0,
    AVAX: 38.5,
    SOL: 185.0,
    AAVE: 280.0,
    LINK: 18.5,
  };

  getSupportedChains() {
    return {
      chains: this.supportedChains,
      total: this.supportedChains.length,
    };
  }

  getSupportedDexs() {
    return {
      dexs: this.supportedDexs,
      total: this.supportedDexs.length,
    };
  }

  getSupportedTokens(chain: string) {
    const tokens = this.tokenList[chain] || [];
    return {
      chain,
      tokens,
      total: tokens.length,
    };
  }

  getTokenPrice(chain: string, token: string) {
    const tokenData = this.tokenList[chain]?.find(t => 
      t.symbol.toUpperCase() === token.toUpperCase()
    );
    const price = this.tokenPrices[token.toUpperCase()] || 0;
    
    return {
      chain,
      token,
      symbol: tokenData?.symbol || token,
      name: tokenData?.name || token,
      price,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getQuote(quoteRequest: QuoteRequest): Promise<any> {
    const { fromChain, toChain, fromToken, toToken, amount, slippage = 0.5 } = quoteRequest;
    const amountNum = parseFloat(amount);
    
    const fromPrice = this.tokenPrices[fromToken.toUpperCase()] || 100;
    const toPrice = this.tokenPrices[toToken.toUpperCase()] || 1;
    
    const baseOutput = (amountNum * fromPrice) / toPrice;
    const priceImpact = Math.random() * 0.03;
    const outputAfterImpact = baseOutput * (1 - priceImpact);
    const gasCostUSD = fromChain === toChain ? 5 : 25;
    
    const routes = this.generateRoutes(fromChain, toChain, fromToken, toToken, amount, outputAfterImpact);
    const bestRoute = routes[0];
    
    return {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amountIn: amount,
      amountOut: outputAfterImpact.toFixed(6),
      priceImpact: (priceImpact * 100).toFixed(2),
      gasCost: gasCostUSD.toFixed(2),
      totalCost: (outputAfterImpact - gasCostUSD / toPrice).toFixed(6),
      slippage,
      estimatedDuration: fromChain === toChain ? 60 : 300,
      routes: routes.slice(0, 3),
      bestRoute,
      timestamp: new Date().toISOString(),
    };
  }

  async compareRoutes(routeRequest: any): Promise<any> {
    const routes = this.generateRoutes(
      routeRequest.fromChain,
      routeRequest.toChain,
      routeRequest.fromToken,
      routeRequest.toToken,
      routeRequest.amount,
      parseFloat(routeRequest.amount) * 0.99
    );

    return {
      fromChain: routeRequest.fromChain,
      toChain: routeRequest.toChain,
      fromToken: routeRequest.fromToken,
      toToken: routeRequest.toToken,
      amount: routeRequest.amount,
      routes: routes.map((route, index) => ({
        rank: index + 1,
        ...route,
      })),
      bestRoute: routes[0],
      timestamp: new Date().toISOString(),
    };
  }

  async findBestRoute(routeRequest: any): Promise<any> {
    const { fromChain, toChain, fromToken, toToken, amount, preference = 'best' } = routeRequest;
    
    const routes = this.generateRoutes(fromChain, toChain, fromToken, toToken, amount, parseFloat(amount) * 0.99);
    
    let sortedRoutes = [...routes];
    if (preference === 'cheapest') {
      sortedRoutes.sort((a, b) => parseFloat(a.totalCost) - parseFloat(b.totalCost));
    } else if (preference === 'fastest') {
      sortedRoutes.sort((a, b) => a.duration - b.duration);
    } else {
      sortedRoutes.sort((a, b) => b.confidence - a.confidence);
    }

    return {
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      preference,
      bestRoute: sortedRoutes[0],
      alternatives: sortedRoutes.slice(1, 4),
      timestamp: new Date().toISOString(),
    };
  }

  private generateRoutes(
    fromChain: string,
    toChain: string,
    fromToken: string,
    toToken: string,
    amount: string,
    outputAmount: number
  ): SwapRoute[] {
    const routes: SwapRoute[] = [];
    const amountNum = parseFloat(amount);
    const fromPrice = this.tokenPrices[fromToken.toUpperCase()] || 100;
    const toPrice = this.tokenPrices[toToken.toUpperCase()] || 1;
    const isCrossChain = fromChain !== toChain;
    
    const dexOptions = this.supportedDexs.filter(d => 
      fromChain === 'solana' ? ['orca', 'raydium'].includes(d.id) : !['orca', 'raydium'].includes(d.id)
    );

    const dexes = isCrossChain 
      ? ['uniswap_v3', 'sushiswap', 'pancakeswap']
      : dexOptions.slice(0, 5).map(d => d.id);

    dexes.forEach((dex, index) => {
      const gasCost = isCrossChain ? (15 + Math.random() * 20) : (3 + Math.random() * 5);
      const slippage = 0.1 + Math.random() * 0.4;
      const output = outputAmount * (1 - slippage * 0.01);
      
      routes.push({
        routeId: `route_${index + 1}`,
        fromChain,
        toChain,
        fromToken,
        toToken,
        amountIn: amount,
        amountOut: output.toFixed(6),
        estimatedGas: Math.floor(100000 + Math.random() * 200000).toString(),
        gasCost: gasCost.toFixed(2),
        totalCost: (output - gasCost / toPrice).toFixed(6),
        priceImpact: (slippage * 0.1),
        dex,
        hops: isCrossChain ? 2 : 1,
        path: isCrossChain 
          ? [fromToken, 'WETH', toToken]
          : [fromToken, toToken],
        duration: isCrossChain ? 180 + Math.random() * 300 : 30 + Math.random() * 60,
        slippage,
        confidence: 85 + Math.random() * 15,
      });
    });

    return routes.sort((a, b) => parseFloat(b.amountOut) - parseFloat(a.amountOut));
  }

  async getMarketOverview(): Promise<any> {
    const totalVolume = 2500000000 + Math.random() * 500000000;
    const activeSwappers = 150000 + Math.floor(Math.random() * 50000);
    
    return {
      totalVolume24h: totalVolume.toFixed(2),
      activeSwappers,
      avgSlippage: (0.3 + Math.random() * 0.3).toFixed(2),
      avgGasCost: (8 + Math.random() * 5).toFixed(2),
      topChains: this.supportedChains.slice(0, 5).map(c => ({
        name: c.name,
        volume: (totalVolume * (0.4 - Math.random() * 0.2)).toFixed(2),
        share: (40 - Math.random() * 20).toFixed(1),
      })),
      topDexs: this.supportedDexs.slice(0, 5).map(d => ({
        name: d.name,
        volume: (totalVolume * (0.3 - Math.random() * 0.15)).toFixed(2),
        share: (30 - Math.random() * 15).toFixed(1),
      })),
      popularPairs: [
        { from: 'ETH', to: 'USDC', volume: (totalVolume * 0.15).toFixed(2) },
        { from: 'USDC', to: 'USDT', volume: (totalVolume * 0.12).toFixed(2) },
        { from: 'WBTC', to: 'ETH', volume: (totalVolume * 0.1).toFixed(2) },
        { from: 'ETH', to: 'USDT', volume: (totalVolume * 0.08).toFixed(2) },
        { from: 'MATIC', to: 'USDC', volume: (totalVolume * 0.06).toFixed(2) },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  async getSwapEstimate(estimateRequest: any): Promise<any> {
    const { fromChain, fromToken, toToken, amount, dex } = estimateRequest;
    const amountNum = parseFloat(amount);
    
    const fromPrice = this.tokenPrices[fromToken.toUpperCase()] || 100;
    const toPrice = this.tokenPrices[toToken.toUpperCase()] || 1;
    
    const output = (amountNum * fromPrice) / toPrice;
    const priceImpact = Math.random() * 0.02;
    const outputAfterImpact = output * (1 - priceImpact);
    const gasEstimate = dex === 'curve' ? 150000 : 200000;
    
    return {
      fromChain,
      fromToken,
      toToken,
      amountIn: amount,
      amountOutMin: (outputAfterImpact * 0.99).toFixed(6),
      amountOut: outputAfterImpact.toFixed(6),
      priceImpact: (priceImpact * 100).toFixed(2),
      gasEstimate,
      gasCostUSD: (gasEstimate * 0.00000001 * 2500).toFixed(4),
      dex: dex || 'uniswap_v3',
      route: [fromToken, toToken],
      timestamp: new Date().toISOString(),
    };
  }

  async getPopularRoutes(): Promise<any> {
    return {
      routes: [
        { fromChain: 'ethereum', toChain: 'polygon', fromToken: 'ETH', toToken: 'MATIC', swaps: 12500 },
        { fromChain: 'ethereum', toChain: 'arbitrum', fromToken: 'ETH', toToken: 'ETH', swaps: 10200 },
        { fromChain: 'ethereum', toChain: 'bsc', fromToken: 'ETH', toToken: 'BNB', swaps: 8900 },
        { fromChain: 'polygon', toChain: 'avalanche', fromToken: 'MATIC', toToken: 'AVAX', swaps: 6700 },
        { fromChain: 'arbitrum', toChain: 'optimism', fromToken: 'ETH', toToken: 'ETH', swaps: 5400 },
        { fromChain: 'bsc', toChain: 'ethereum', fromToken: 'BNB', toToken: 'ETH', swaps: 4800 },
        { fromChain: 'base', toChain: 'ethereum', fromToken: 'ETH', toToken: 'ETH', swaps: 3200 },
        { fromChain: 'ethereum', toChain: 'avalanche', fromToken: 'ETH', toToken: 'AVAX', swaps: 2100 },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  async getRouteDetails(routeRequest: any): Promise<any> {
    const { fromChain, toChain, fromToken, toToken, amount } = routeRequest;
    const isCrossChain = fromChain !== toChain;
    
    const details = {
      fromChain: {
        ...this.supportedChains.find(c => c.id === fromChain),
        token: fromToken,
      },
      toChain: isCrossChain ? {
        ...this.supportedChains.find(c => c.id === toChain),
        token: toToken,
      } : null,
      isCrossChain,
      steps: isCrossChain ? [
        {
          step: 1,
          action: 'Swap',
          fromToken,
          toToken: fromChain === 'solana' ? 'SOL' : 'WETH',
          dex: 'orca',
          description: `Swap ${fromToken} to bridge token on ${fromChain}`,
        },
        {
          step: 2,
          action: 'Bridge',
          fromToken: fromChain === 'solana' ? 'SOL' : 'WETH',
          toToken: toChain === 'solana' ? 'SOL' : 'WETH',
          bridge: 'LayerZero',
          description: `Bridge assets from ${fromChain} to ${toChain}`,
        },
        {
          step: 3,
          action: 'Swap',
          fromToken: toChain === 'solana' ? 'SOL' : 'WETH',
          toToken,
          dex: 'raydium',
          description: `Swap bridge token to ${toToken} on ${toChain}`,
        },
      ] : [
        {
          step: 1,
          action: 'Swap',
          fromToken,
          toToken,
          dex: 'uniswap_v3',
          description: `Direct swap ${fromToken} to ${toToken}`,
        },
      ],
      estimatedTime: isCrossChain ? '3-5 minutes' : '30-60 seconds',
      totalGas: isCrossChain ? '$20-35' : '$3-8',
      successRate: '99.5%',
      risks: [
        'Slippage risk',
        'Bridge delay risk',
        'Price impact',
      ],
      recommendations: [
        'Set slippage tolerance at 0.5% or higher for cross-chain',
        'Allow extra time for bridge confirmation',
        'Consider gas costs when swapping small amounts',
      ],
      timestamp: new Date().toISOString(),
    };

    return details;
  }
}
