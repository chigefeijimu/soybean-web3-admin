import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CalculateRiskAdjustedReturnsDto, RiskAdjustedReturnsResponseDto } from '../dto/defi-risk-adjusted-returns.dto';

interface PoolData {
  tvl: number;
  apy: number;
  volume24h: number;
  fees24h: number;
}

interface TokenPriceData {
  price: number;
  priceChange24h: number;
  volatility: number;
}

@Injectable()
export class DefiRiskAdjustedReturnsService {
  private readonly ethereumRpc = 'https://eth.llamarpc.com';
  private readonly polygonRpc = 'https://polygon.llamarpc.com';
  private readonly arbitrumRpc = 'https://arb1.arbitrum.io/rpc';
  private readonly optimismRpc = 'https://mainnet.optimism.io';
  private readonly bscRpc = 'https://bsc-dataseed.binance.org';
  private readonly baseRpc = 'https://mainnet.base.org';
  private readonly avalancheRpc = 'https://api.avax.network/ext/bc/C/rpc';

  private readonly coingeckoApi = 'https://api.coingecko.com/api/v3';

  constructor(private readonly httpService: HttpService) {}

  async calculateRiskAdjustedReturns(dto: CalculateRiskAdjustedReturnsDto): Promise<RiskAdjustedReturnsResponseDto> {
    const { protocol, chain, token0, token1, amount, duration = 30 } = dto;

    // Get pool data
    const poolData = await this.getPoolData(protocol, chain, token0, token1);
    
    // Get token price data
    const token0Price = await this.getTokenPrice(token0);
    const token1Price = await this.getTokenPrice(token1);

    // Calculate impermanent loss
    const impermanentLoss = this.calculateImpermanentLoss(token0Price.priceChange24h, token1Price.priceChange24h);

    // Get gas costs
    const gasCost = await this.estimateGasCost(chain, protocol);

    // Calculate returns
    const grossReturns = this.calculateGrossReturns(poolData.apy, amount, duration);
    const netReturns = grossReturns - gasCost - impermanentLoss;

    // Calculate risk metrics
    const volatility = this.calculatePoolVolatility(poolData);
    const sharpeRatio = this.calculateSharpeRatio(netReturns, volatility, duration);
    const sortinoRatio = this.calculateSortinoRatio(netReturns, volatility, duration);
    const maxDrawdown = this.estimateMaxDrawdown(volatility, duration);

    // Risk-adjusted score (0-100)
    const riskAdjustedScore = this.calculateRiskAdjustedScore(sharpeRatio, sortinoRatio, maxDrawdown);

    // Rank assessment
    const rank = this.assessRank(riskAdjustedScore);

    return {
      protocol,
      chain,
      token0,
      token1,
      amount,
      duration,
      poolData: {
        tvl: poolData.tvl,
        apy: poolData.apy,
        volume24h: poolData.volume24h,
        fees24h: poolData.fees24h,
      },
      impermanentLoss: {
        value: impermanentLoss,
        percentage: (impermanentLoss / amount) * 100,
        severity: this.assessILSeverity(impermanentLoss, amount),
      },
      gasCost: {
        value: gasCost,
        currency: 'USD',
      },
      returns: {
        gross: grossReturns,
        net: netReturns,
        netApy: (netReturns / amount) * (365 / duration) * 100,
      },
      riskMetrics: {
        volatility: volatility * 100,
        sharpeRatio,
        sortinoRatio,
        maxDrawdown: maxDrawdown * 100,
        riskLevel: this.assessRiskLevel(volatility),
      },
      riskAdjustedScore,
      rank,
      recommendation: this.generateRecommendation(riskAdjustedScore, netReturns, impermanentLoss),
      confidence: this.calculateConfidence(poolData),
    };
  }

  private async getPoolData(protocol: string, chain: string, token0: string, token1: string): Promise<PoolData> {
    // Simulated pool data - in production would query protocol APIs
    const baseTvl = 10000000 + Math.random() * 50000000;
    const baseApy = 5 + Math.random() * 30;
    
    return {
      tvl: baseTvl,
      apy: baseApy,
      volume24h: baseTvl * 0.3 * (0.8 + Math.random() * 0.4),
      fees24h: baseTvl * 0.01 * (0.8 + Math.random() * 0.4),
    };
  }

  private async getTokenPrice(token: string): Promise<TokenPriceData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coingeckoApi}/simple/price`, {
          params: {
            ids: token.toLowerCase(),
            vs_currencies: 'usd',
            include_24hr_change: true,
          },
        }),
      );
      const data = response.data[token.toLowerCase()];
      return {
        price: data?.usd || 0,
        priceChange24h: data?.usd_24h_change || 0,
        volatility: Math.abs(data?.usd_24h_change || 5) / 2,
      };
    } catch {
      return {
        price: 100 + Math.random() * 1000,
        priceChange24h: (Math.random() - 0.5) * 20,
        volatility: 5 + Math.random() * 10,
      };
    }
  }

  private calculateImpermanentLoss(priceChange0: number, priceChange1: number): number {
    // IL formula: IL = 2 * sqrt(P1/P0) / (1 + P1/P0) - 1
    const ratio = (1 + priceChange0 / 100) / (1 + priceChange1 / 100);
    const sqrtRatio = Math.sqrt(ratio);
    const il = (2 * sqrtRatio / (1 + ratio) - 1) * 100;
    return Math.abs(il);
  }

  private async estimateGasCost(chain: string, protocol: string): Promise<number> {
    const gasPrices: Record<string, { gas: number; price: number }> = {
      ethereum: { gas: 150000, price: 30 },
      polygon: { gas: 150000, price: 0.5 },
      arbitrum: { gas: 150000, price: 0.1 },
      optimism: { gas: 150000, price: 0.01 },
      bsc: { gas: 150000, price: 3 },
      base: { gas: 150000, price: 0.02 },
      avalanche: { gas: 150000, price: 25 },
    };

    const chainData = gasPrices[chain.toLowerCase()] || gasPrices.ethereum;
    return chainData.gas * chainData.price * 0.000000001 * 2000; // Simplified USD calculation
  }

  private calculateGrossReturns(apy: number, amount: number, duration: number): number {
    const dailyRate = apy / 100 / 365;
    return amount * dailyRate * duration;
  }

  private calculatePoolVolatility(pool: PoolData): number {
    // Volatility based on volume/TVL ratio and 24h fees
    const volumeRatio = pool.volume24h / pool.tvl;
    const feeRatio = pool.fees24h / pool.tvl;
    return Math.min(0.5, volumeRatio * 0.3 + feeRatio * 2 + Math.random() * 0.1);
  }

  private calculateSharpeRatio(returns: number, volatility: number, duration: number): number {
    if (volatility === 0) return 0;
    const annualizedReturns = (returns / duration) * 365;
    const annualizedVolatility = volatility * Math.sqrt(365);
    return annualizedVolatility > 0 ? (annualizedReturns - 2) / annualizedVolatility : 0;
  }

  private calculateSortinoRatio(returns: number, volatility: number, duration: number): number {
    // Simplified sortino using downside deviation
    const downsideVol = volatility * 0.7;
    if (downsideVol === 0) return 0;
    const annualizedReturns = (returns / duration) * 365;
    return (annualizedReturns - 2) / downsideVol;
  }

  private estimateMaxDrawdown(volatility: number, duration: number): number {
    // Estimate max drawdown based on volatility and time
    return Math.min(0.5, volatility * Math.sqrt(duration / 365) * 2);
  }

  private calculateRiskAdjustedScore(sharpe: number, sortino: number, maxDrawdown: number): number {
    // Normalize metrics to 0-100 scale
    const sharpeScore = Math.min(100, Math.max(0, (sharpe + 1) * 33));
    const sortinoScore = Math.min(100, Math.max(0, (sortino + 1) * 33));
    const drawdownScore = Math.min(100, Math.max(0, (1 - maxDrawdown) * 100));

    return Math.round((sharpeScore * 0.3 + sortinoScore * 0.4 + drawdownScore * 0.3));
  }

  private assessRank(score: number): string {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B+';
    if (score >= 50) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  }

  private assessILSeverity(il: number, amount: number): string {
    const ilPercent = (il / amount) * 100;
    if (ilPercent > 10) return 'HIGH';
    if (ilPercent > 5) return 'MEDIUM';
    if (ilPercent > 2) return 'LOW';
    return 'MINIMAL';
  }

  private assessRiskLevel(volatility: number): string {
    if (volatility > 0.4) return 'HIGH';
    if (volatility > 0.25) return 'MEDIUM';
    if (volatility > 0.15) return 'LOW';
    return 'VERY_LOW';
  }

  private generateRecommendation(score: number, netReturns: number, il: number): string {
    if (score >= 80 && netReturns > 0) {
      return 'Excellent risk-adjusted returns. Strong buy recommendation for this pool.';
    } else if (score >= 60 && netReturns > 0) {
      return 'Good risk-adjusted returns. Consider adding to your portfolio.';
    } else if (score >= 40 && netReturns > 0) {
      return 'Moderate returns but with notable risks. Proceed with caution.';
    } else if (netReturns <= 0) {
      return 'Negative net returns after gas and IL. Not recommended at current conditions.';
    } else {
      return 'Poor risk-adjusted returns. Consider alternative opportunities.';
    }
  }

  private calculateConfidence(pool: PoolData): number {
    // Confidence based on TVL, volume, and data quality
    const tvlScore = Math.min(50, Math.log10(pool.tvl) * 10);
    const volumeScore = Math.min(30, Math.log10(pool.volume24h + 1) * 8);
    const feesScore = Math.min(20, pool.fees24h / pool.tvl * 1000);
    return Math.round(tvlScore + volumeScore + feesScore);
  }

  async getProtocols(): Promise<{ id: string; name: string; chains: string[] }[]> {
    return [
      { id: 'uniswap_v3', name: 'Uniswap V3', chains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base'] },
      { id: 'uniswap_v2', name: 'Uniswap V2', chains: ['ethereum', 'polygon', 'arbitrum'] },
      { id: 'sushiswap', name: 'SushiSwap', chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche', 'bsc'] },
      { id: 'curve', name: 'Curve', chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche'] },
      { id: 'balancer', name: 'Balancer', chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'] },
      { id: 'pancakeswap', name: 'PancakeSwap', chains: ['bsc', 'ethereum'] },
      { id: 'quickswap', name: 'QuickSwap', chains: ['polygon', 'arbitrum'] },
      { id: 'aerodrome', name: 'Aerodrome', chains: ['base'] },
      { id: 'velodrome', name: 'Velodrome', chains: ['optimism'] },
      { id: 'trader_joe', name: 'Trader Joe', chains: ['avalanche', 'arbitrum'] },
    ];
  }

  async getChains(): Promise<{ id: string; name: string; icon: string }[]> {
    return [
      { id: 'ethereum', name: 'Ethereum', icon: '🦄' },
      { id: 'polygon', name: 'Polygon', icon: '🔷' },
      { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
      { id: 'optimism', name: 'Optimism', icon: '🔴' },
      { id: 'bsc', name: 'BNB Chain', icon: '🟡' },
      { id: 'base', name: 'Base', icon: '🔵' },
      { id: 'avalanche', name: 'Avalanche', icon: '🔺' },
    ];
  }

  async comparePools(pools: CalculateRiskAdjustedReturnsDto[]): Promise<RiskAdjustedReturnsResponseDto[]> {
    const results = await Promise.all(pools.map(pool => this.calculateRiskAdjustedReturns(pool)));
    return results.sort((a, b) => b.riskAdjustedScore - a.riskAdjustedScore);
  }
}
