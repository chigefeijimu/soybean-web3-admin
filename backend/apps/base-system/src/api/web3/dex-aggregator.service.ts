import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface DexPrice {
  dex: string;
  price: number;
  liquidity: number;
  volume24h: number;
  path?: string[];
}

interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  priceImpact: string;
  slippage: number;
  dex: string;
  route: string[];
  gasEstimate: string;
  gasUsd: string;
  validUntil: number;
}

interface LiquidityPool {
  dex: string;
  tokenA: string;
  tokenB: string;
  reserveA: string;
  reserveB: string;
  liquidity: number;
  volume24h: number;
  apy: number;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
}

@Injectable()
export class DexAggregatorService {
  private readonly coingeckoApi = 'https://api.coingecko.com/api/v3';
  private readonly dexScreenerApi = 'https://api.dexscreener.com/latest/dex';

  // Common token addresses by chain
  private readonly nativeTokens: Record<string, string> = {
    ethereum: '0x0000000000000000000000000000000000000000',
    polygon: '0x0000000000000000000000000000000000000000',
    arbitrum: '0x0000000000000000000000000000000000000000',
    optimism: '0x0000000000000000000000000000000000000000',
    bsc: '0x0000000000000000000000000000000000000000',
  };

  // Wrapped native token addresses
  private readonly wNativeTokens: Record<string, string> = {
    ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    polygon: '0x0d500B1d8E8aF31D8041cAc1f5c8aB83cA82dF2c', // WMATIC
    arbitrum: '0x82aF49447D8a07e3bd95BD0d56f78341539bc28', // WETH
    optimism: '0x4200000000000000000000000000000000000006', // WETH
    bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
  };

  // Popular tokens cache
  private tokensCache: Map<string, TokenInfo[]> = new Map();

  constructor(private httpService: HttpService) {}

  async getAggregatedPrices(tokenAddress: string, chain: string): Promise<DexPrice[]> {
    const prices: DexPrice[] = [];
    const normalizedChain = chain.toLowerCase();
    
    try {
      // Get prices from DexScreener
      const pairAddress = await this.findPairAddress(tokenAddress, this.wNativeTokens[normalizedChain], normalizedChain);
      if (pairAddress) {
        const dexData = await this.getDexScreenerData(pairAddress);
        if (dexData) {
          prices.push({
            dex: 'Uniswap V3',
            price: dexData.priceUsd,
            liquidity: dexData.liquidity.usd,
            volume24h: dexData.volume.h24,
          });
        }
      }

      // Get Sushiswap data
      const sushiswapData = await this.getSushiSwapPrice(tokenAddress, normalizedChain);
      if (sushiswapData) {
        prices.push(sushiswapData);
      }

      // Add mock data for other DEXs (in production, query actual APIs)
      prices.push({
        dex: 'Curve',
        price: prices[0]?.price * (0.999 + Math.random() * 0.002) || 0,
        liquidity: Math.random() * 10000000 + 1000000,
        volume24h: Math.random() * 5000000 + 500000,
      });

      prices.push({
        dex: 'Balancer',
        price: prices[0]?.price * (0.998 + Math.random() * 0.004) || 0,
        liquidity: Math.random() * 8000000 + 800000,
        volume24h: Math.random() * 3000000 + 300000,
      });

    } catch (error) {
      console.error('Error fetching aggregated prices:', error);
    }

    return prices.sort((a, b) => b.liquidity - a.liquidity);
  }

  async findBestPrice(fromToken: string, toToken: string, amount: string, chain: string): Promise<{
    bestDex: string;
    bestPrice: number;
    expectedOutput: string;
    priceImpact: string;
    savings: number;
  }> {
    const normalizedChain = chain.toLowerCase();
    const prices = await this.getAggregatedPrices(fromToken, normalizedChain);
    
    if (prices.length === 0) {
      return {
        bestDex: 'Unknown',
        bestPrice: 0,
        expectedOutput: '0',
        priceImpact: '0',
        savings: 0,
      };
    }

    // Calculate expected output based on best price
    const bestDex = prices[0];
    const fromTokenData = await this.getTokenInfo(fromToken, normalizedChain);
    const toTokenData = await this.getTokenInfo(toToken, normalizedChain);
    
    const fromAmountUsd = parseFloat(amount) / Math.pow(10, fromTokenData?.decimals || 18) * (fromTokenData?.price || 0);
    const expectedOutput = fromAmountUsd / bestDex.price * Math.pow(10, toTokenData?.decimals || 18);
    
    // Calculate price impact
    const priceImpact = prices.length > 1 
      ? ((prices[1].price - bestDex.price) / prices[1].price * 100).toFixed(2)
      : '0';
    
    // Calculate savings vs worst price
    const worstPrice = prices[prices.length - 1].price;
    const savings = ((worstPrice - bestDex.price) / worstPrice * 100);

    return {
      bestDex: bestDex.dex,
      bestPrice: bestDex.price,
      expectedOutput: expectedOutput.toFixed(6),
      priceImpact,
      savings: parseFloat(savings.toFixed(2)),
    };
  }

  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chain: string,
    slippage: number,
  ): Promise<SwapQuote> {
    const normalizedChain = chain.toLowerCase();
    const best = await this.findBestPrice(fromToken, toToken, amount, normalizedChain);
    
    const fromTokenData = await this.getTokenInfo(fromToken, normalizedChain);
    const toTokenData = await this.getTokenInfo(toToken, normalizedChain);
    
    const fromAmountNum = parseFloat(amount) / Math.pow(10, fromTokenData?.decimals || 18);
    const toAmountNum = fromAmountNum / best.bestPrice;
    
    // Gas estimate (rough estimate)
    const gasEstimate = '210000';
    const gasPriceGwei = await this.getGasPrice(normalizedChain);
    const gasCost = parseFloat(gasEstimate) * gasPriceGwei * 0.000000001 * 3000; // ~$3000/ETH
    const gasUsd = gasCost.toFixed(2);

    return {
      fromToken,
      toToken,
      fromAmount: amount,
      toAmount: (toAmountNum * Math.pow(10, toTokenData?.decimals || 18)).toFixed(0),
      price: best.bestPrice.toFixed(6),
      priceImpact: best.priceImpact,
      slippage,
      dex: best.bestDex,
      route: [fromToken, toToken],
      gasEstimate,
      gasUsd,
      validUntil: Date.now() + 60000, // 1 minute
    };
  }

  async getLiquidityPools(tokenA: string, tokenB: string, chain: string): Promise<LiquidityPool[]> {
    const pools: LiquidityPool[] = [];
    const normalizedChain = chain.toLowerCase();
    
    // Uniswap V3
    pools.push({
      dex: 'Uniswap V3',
      tokenA,
      tokenB,
      reserveA: (Math.random() * 1000000).toFixed(2),
      reserveB: (Math.random() * 1000000).toFixed(2),
      liquidity: Math.random() * 50000000 + 5000000,
      volume24h: Math.random() * 20000000 + 2000000,
      apy: Math.random() * 30 + 5,
    });

    // Sushiswap
    pools.push({
      dex: 'Sushiswap',
      tokenA,
      tokenB,
      reserveA: (Math.random() * 800000).toFixed(2),
      reserveB: (Math.random() * 800000).toFixed(2),
      liquidity: Math.random() * 30000000 + 3000000,
      volume24h: Math.random() * 10000000 + 1000000,
      apy: Math.random() * 25 + 3,
    });

    // Curve (for stable pairs)
    pools.push({
      dex: 'Curve',
      tokenA,
      tokenB,
      reserveA: (Math.random() * 5000000).toFixed(2),
      reserveB: (Math.random() * 5000000).toFixed(2),
      liquidity: Math.random() * 100000000 + 10000000,
      volume24h: Math.random() * 50000000 + 5000000,
      apy: Math.random() * 15 + 2,
    });

    return pools.sort((a, b) => b.liquidity - a.liquidity);
  }

  async getSupportedDexes(): Promise<any[]> {
    return [
      { name: 'Uniswap V3', chain: 'ethereum', tvl: 4500000000, volume24h: 1200000000, pairs: 150000 },
      { name: 'Sushiswap', chain: 'ethereum', tvl: 1800000000, volume24h: 350000000, pairs: 80000 },
      { name: 'Curve', chain: 'ethereum', tvl: 2200000000, volume24h: 800000000, pairs: 2000 },
      { name: 'Balancer', chain: 'ethereum', tvl: 1200000000, volume24h: 180000000, pairs: 1500 },
      { name: 'PancakeSwap', chain: 'bsc', tvl: 2800000000, volume24h: 450000000, pairs: 250000 },
      { name: 'QuickSwap', chain: 'polygon', tvl: 800000000, volume24h: 150000000, pairs: 30000 },
      { name: 'Camelot', chain: 'arbitrum', tvl: 350000000, volume24h: 80000000, pairs: 8000 },
      { name: 'Velodrome', chain: 'optimism', tvl: 450000000, volume24h: 120000000, pairs: 12000 },
    ];
  }

  async searchTokens(query: string, chain: string = 'ethereum'): Promise<TokenInfo[]> {
    // Use cached popular tokens
    const popularTokens: TokenInfo[] = [
      { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18, price: 3000 },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, price: 65000 },
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, price: 1 },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1 },
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6, price: 1 },
      { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave Token', decimals: 18, price: 280 },
      { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18, price: 12 },
      { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink Token', decimals: 18, price: 18 },
      { address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeeb0', symbol: 'MATIC', name: 'Polygon Matic Token', decimals: 18, price: 0.9 },
      { address: '0x0d8775f648430679A709E98d2b0Cb6250d2887EF', symbol: 'BAT', name: 'Basic Attention Token', decimals: 18, price: 0.35 },
      { address: '0x1985365e9f78359a9B6AD760e32412f4a445E862', symbol: 'REP', name: 'Augur', decimals: 18, price: 2.5 },
      { address: '0xE41d2489571d322189246DIFA5FFde2BF27c0eB3', symbol: 'ZRX', name: '0x Protocol Token', decimals: 18, price: 0.45 },
      { address: '0x80fB784B7eD66730e8b1DBd9820f299C90a14A5A', symbol: 'SNX', name: 'Synthetix Network Token', decimals: 18, price: 4.5 },
      { address: '0x0bc529c00C6401aEF6D220BE8C6Ea1665F6ed51b', symbol: 'YFI', name: 'yearn.finance', decimals: 18, price: 12000 },
      { address: '0x2b591e79afDe80CaFe8658aa3b1950F9277C0AdB', symbol: 'YFI', name: 'Ethverse', decimals: 18, price: 0.01 },
    ];

    const normalizedQuery = query.toLowerCase();
    return popularTokens.filter(
      t => t.symbol.toLowerCase().includes(normalizedQuery) || 
           t.name.toLowerCase().includes(normalizedQuery) ||
           t.address.toLowerCase() === normalizedQuery
    );
  }

  private async findPairAddress(tokenA: string, tokenB: string, chain: string): Promise<string | null> {
    try {
      const url = `${this.dexScreenerApi}/pairs/${chain}/${tokenA}`;
      const response = await this.httpService.axiosRef.get(url);
      if (response.data?.pairs?.[0]) {
        return response.data.pairs[0].pairAddress;
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }

  private async getDexScreenerData(pairAddress: string): Promise<any> {
    try {
      const url = `${this.dexScreenerApi}/pairs/${pairAddress}`;
      const response = await this.httpService.axiosRef.get(url);
      return response.data?.pair;
    } catch (error) {
      return null;
    }
  }

  private async getSushiSwapPrice(tokenAddress: string, chain: string): Promise<DexPrice | null> {
    // Mock Sushiswap data
    return {
      dex: 'Sushiswap',
      price: 3000 * (0.999 + Math.random() * 0.002),
      liquidity: Math.random() * 5000000 + 500000,
      volume24h: Math.random() * 2000000 + 200000,
    };
  }

  private async getTokenInfo(address: string, chain: string): Promise<TokenInfo | null> {
    const tokens = await this.searchTokens(address, chain);
    return tokens.find(t => t.address.toLowerCase() === address.toLowerCase()) || null;
  }

  private async getGasPrice(chain: string): Promise<number> {
    const gasPrices: Record<string, number> = {
      ethereum: 30,
      polygon: 80,
      arbitrum: 0.1,
      optimism: 0.001,
      bsc: 5,
    };
    return gasPrices[chain] || 20;
  }
}
