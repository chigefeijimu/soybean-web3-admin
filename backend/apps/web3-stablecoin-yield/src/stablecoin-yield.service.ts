import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface ProtocolYield {
  protocol: string;
  logo: string;
  token: string;
  apy: number;
  tvl: number;
  chain: string;
}

export interface StablecoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export interface YieldComparison {
  stablecoin: StablecoinData;
  yields: ProtocolYield[];
  bestYield: ProtocolYield | null;
  averageApy: number;
}

@Injectable()
export class StablecoinYieldService {
  // Common stablecoin addresses on Ethereum
  private readonly stablecoins = [
    { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
    { symbol: 'USDT', name: 'Tether', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
    { symbol: 'DAI', name: 'Dai', address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
    { symbol: 'FRAX', name: 'Frax', address: '0x853d955acef822db058eb8505911ed77f175b99e' },
    { symbol: 'USDD', name: 'USDD', address: '0x0c9f3d5e8e2c5a3a8a8b4e5d2c6f8a1b3d5e7f9' },
  ];

  // Mock yield data (in production, this would come from DeFi APIs)
  private readonly mockYields: ProtocolYield[] = [
    // Aave V3
    { protocol: 'Aave V3', logo: '👻', token: 'USDC', apy: 4.82, tvl: 5200000000, chain: 'Ethereum' },
    { protocol: 'Aave V3', logo: '👻', token: 'USDT', apy: 4.65, tvl: 3800000000, chain: 'Ethereum' },
    { protocol: 'Aave V3', logo: '👻', token: 'DAI', apy: 4.21, tvl: 1200000000, chain: 'Ethereum' },
    { protocol: 'Aave V3', logo: '👻', token: 'USDC', apy: 5.12, tvl: 800000000, chain: 'Arbitrum' },
    { protocol: 'Aave V3', logo: '👻', token: 'USDC', apy: 4.95, tvl: 600000000, chain: 'Polygon' },
    
    // Compound
    { protocol: 'Compound', logo: '🔷', token: 'USDC', apy: 4.32, tvl: 2100000000, chain: 'Ethereum' },
    { protocol: 'Compound', logo: '🔷', token: 'USDT', apy: 4.18, tvl: 1500000000, chain: 'Ethereum' },
    { protocol: 'Compound', logo: '🔷', token: 'DAI', apy: 3.95, tvl: 800000000, chain: 'Ethereum' },
    
    // Curve
    { protocol: 'Curve', logo: '💚', token: 'USDC', apy: 3.85, tvl: 850000000, chain: 'Ethereum' },
    { protocol: 'Curve', logo: '💚', token: 'USDT', apy: 3.72, tvl: 620000000, chain: 'Ethereum' },
    { protocol: 'Curve', logo: '💚', token: 'DAI', apy: 3.65, tvl: 450000000, chain: 'Ethereum' },
    { protocol: 'Curve', logo: '💚', token: 'FRAX', apy: 4.52, tvl: 380000000, chain: 'Ethereum' },
    
    // Yearn
    { protocol: 'Yearn', logo: '🧙', token: 'USDC', apy: 5.15, tvl: 1200000000, chain: 'Ethereum' },
    { protocol: 'Yearn', logo: '🧙', token: 'USDT', apy: 4.98, tvl: 950000000, chain: 'Ethereum' },
    { protocol: 'Yearn', logo: '🧙', token: 'DAI', apy: 4.75, tvl: 620000000, chain: 'Ethereum' },
    
    // Lido
    { protocol: 'Lido', logo: '🦦', token: 'USDC', apy: 4.25, tvl: 520000000, chain: 'Ethereum' },
    
    // Rocket Pool
    { protocol: 'Rocket Pool', logo: '🚀', token: 'USDC', apy: 4.08, tvl: 280000000, chain: 'Ethereum' },
    
    // Synthetix
    { protocol: 'Synthetix', logo: '🦑', token: 'USDC', apy: 5.45, tvl: 420000000, chain: 'Ethereum' },
    
    // Euler
    { protocol: 'Euler', logo: '🔮', token: 'USDC', apy: 5.82, tvl: 180000000, chain: 'Ethereum' },
    { protocol: 'Euler', logo: '🔮', token: 'USDT', apy: 5.65, tvl: 150000000, chain: 'Ethereum' },
    
    // Morpho
    { protocol: 'Morpho', logo: '🟣', token: 'USDC', apy: 4.92, tvl: 650000000, chain: 'Ethereum' },
    { protocol: 'Morpho', logo: '🟣', token: 'USDT', apy: 4.78, tvl: 480000000, chain: 'Ethereum' },
    
    // Arbitrum specific
    { protocol: 'GMX', logo: '🦊', token: 'USDC', apy: 6.25, tvl: 380000000, chain: 'Arbitrum' },
    { protocol: 'Radiant', logo: '💎', token: 'USDC', apy: 5.85, tvl: 420000000, chain: 'Arbitrum' },
    
    // Polygon specific
    { protocol: 'Aave V3', logo: '👻', token: 'USDC', apy: 5.45, tvl: 350000000, chain: 'Polygon' },
    { protocol: 'QuickSwap', logo: '⚡', token: 'USDC', apy: 6.12, tvl: 280000000, chain: 'Polygon' },
  ];

  /**
   * Get all yields for a specific stablecoin
   */
  async getYieldsByToken(tokenSymbol: string): Promise<ProtocolYield[]> {
    const token = tokenSymbol.toUpperCase();
    return this.mockYields.filter(y => y.token.toUpperCase() === token);
  }

  /**
   * Get all yields for a specific chain
   */
  async getYieldsByChain(chain: string): Promise<ProtocolYield[]> {
    return this.mockYields.filter(y => y.chain.toLowerCase() === chain.toLowerCase());
  }

  /**
   * Get comprehensive yield comparison across all stablecoins
   */
  async getYieldComparison(): Promise<YieldComparison[]> {
    const results: YieldComparison[] = [];
    
    for (const stablecoin of this.stablecoins) {
      const yields = this.mockYields.filter(y => y.token === stablecoin.symbol);
      
      // Get mock price data
      const priceData = this.getMockPrice(stablecoin.symbol);
      
      // Calculate best yield
      let bestYield: ProtocolYield | null = null;
      let maxApy = -1;
      
      for (const yieldItem of yields) {
        if (yieldItem.apy > maxApy) {
          maxApy = yieldItem.apy;
          bestYield = yieldItem;
        }
      }
      
      // Calculate average APY
      const averageApy = yields.length > 0
        ? yields.reduce((sum, y) => sum + y.apy, 0) / yields.length
        : 0;
      
      results.push({
        stablecoin: {
          symbol: stablecoin.symbol,
          name: stablecoin.name,
          ...priceData
        },
        yields,
        bestYield,
        averageApy: Math.round(averageApy * 100) / 100
      });
    }
    
    return results;
  }

  /**
   * Get top yields sorted by APY
   */
  async getTopYields(limit: number = 10): Promise<ProtocolYield[]> {
    const sorted = [...this.mockYields].sort((a, b) => b.apy - a.apy);
    return sorted.slice(0, limit);
  }

  /**
   * Get yield data for a specific protocol
   */
  async getProtocolYields(protocol: string): Promise<ProtocolYield[]> {
    return this.mockYields.filter(y => 
      y.protocol.toLowerCase().includes(protocol.toLowerCase())
    );
  }

  /**
   * Get all supported chains
   */
  async getSupportedChains(): Promise<string[]> {
    const chains = new Set(this.mockYields.map(y => y.chain));
    return Array.from(chains);
  }

  /**
   * Get all supported protocols
   */
  async getSupportedProtocols(): Promise<string[]> {
    const protocols = new Set(this.mockYields.map(y => y.protocol));
    return Array.from(protocols);
  }

  /**
   * Calculate potential earnings
   */
  async calculateEarnings(
    principal: number,
    token: string,
    days: number = 30
  ): Promise<{ earnings: number; finalAmount: number; apy: number }> {
    const yields = await this.getYieldsByToken(token);
    
    if (yields.length === 0) {
      return { earnings: 0, finalAmount: principal, apy: 0 };
    }
    
    // Use the best APY
    const bestApy = Math.max(...yields.map(y => y.apy));
    
    // Simple interest calculation (in production, use compound interest)
    const dailyRate = bestApy / 100 / 365;
    const earnings = principal * dailyRate * days;
    const finalAmount = principal + earnings;
    
    return {
      earnings: Math.round(earnings * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      apy: bestApy
    };
  }

  // Mock price data
  private getMockPrice(symbol: string): { price: number; change24h: number } {
    const prices: Record<string, { price: number; change24h: number }> = {
      'USDC': { price: 1.0, change24h: 0.01 },
      'USDT': { price: 1.0, change24h: -0.02 },
      'DAI': { price: 1.0, change24h: 0.03 },
      'FRAX': { price: 1.0, change24h: -0.05 },
      'USDD': { price: 1.0, change24h: 0.02 },
    };
    
    return prices[symbol] || { price: 1.0, change24h: 0 };
  }
}
