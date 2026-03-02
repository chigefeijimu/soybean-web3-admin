import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface TokenInflationData {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  totalSupply: string;
  circulatingSupply: string;
  maxSupply: string | null;
  inflationRate: number;
  lastUpdated: number;
}

export interface TokenSupplyHistory {
  timestamp: number;
  date: string;
  totalSupply: string;
  change: number;
  changePercent: number;
}

export interface InflationAnalysis {
  address: string;
  symbol: string;
  name: string;
  chain: string;
  currentSupply: string;
  supplyChange24h: number;
  supplyChange7d: number;
  supplyChange30d: number;
  inflationRate24h: number;
  inflationRate7d: number;
  inflationRate30d: number;
  isDeflationary: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  analysis: string;
  recommendations: string[];
}

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  total_supply: number | null;
  circulating_supply: number;
  max_supply: number | null;
}

@Injectable()
export class TokenInflationService {
  private readonly coingeckoBase = 'https://api.coingecko.com/api/v3';
  private readonly chains: Record<string, { coingecko: string; chainId: number }> = {
    eth: { coingecko: 'ethereum', chainId: 1 },
    polygon: { coingecko: 'matic-network', chainId: 137 },
    bsc: { coingecko: 'binancecoin', chainId: 56 },
    arbitrum: { coingecko: 'arbitrum', chainId: 42161 },
    optimism: { coingecko: 'optimism', chainId: 10 },
    avalanche: { coingecko: 'avalanche-2', chainId: 43114 },
    solana: { coingecko: 'solana', chainId: 101 },
    base: { coingecko: 'base', chainId: 8453 },
  };

  private readonly popularTokens: Record<string, { address: string; coingeckoId: string }[]> = {
    eth: [
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', coingeckoId: 'wrapped-bitcoin' },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', coingeckoId: 'usd-coin' },
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', coingeckoId: 'tether' },
    ],
    bsc: [
      { address: '0x55d398326f99059fF775485246999027B3197955', coingeckoId: 'binance-usd' },
      { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', coingeckoId: 'busd' },
    ],
  };

  constructor(private readonly httpService: HttpService) {}

  async getTokenSupply(chain: string, address: string): Promise<TokenInflationData> {
    try {
      const normalizedAddress = address.toLowerCase();
      
      // Try to get data from CoinGecko
      const tokenInfo = await this.searchTokenOnCoingecko(chain, normalizedAddress);
      
      if (tokenInfo) {
        return {
          address: normalizedAddress,
          symbol: tokenInfo.symbol.toUpperCase(),
          name: tokenInfo.name,
          chain,
          totalSupply: tokenInfo.total_supply?.toString() || '0',
          circulatingSupply: tokenInfo.circulating_supply?.toString() || '0',
          maxSupply: tokenInfo.max_supply?.toString() || null,
          inflationRate: this.calculateSupplyInflationRate(
            tokenInfo.total_supply,
            tokenInfo.circulating_supply
          ),
          lastUpdated: Date.now(),
        };
      }

      // Fallback to mock data for demonstration
      return this.getMockSupplyData(chain, address);
    } catch (error) {
      console.error('Error fetching token supply:', error);
      return this.getMockSupplyData(chain, address);
    }
  }

  async getSupplyHistory(chain: string, address: string, days: number = 30): Promise<TokenSupplyHistory[]> {
    try {
      const tokenInfo = await this.searchTokenOnCoingecko(chain, address.toLowerCase());
      
      if (tokenInfo && tokenInfo.id) {
        const response = await firstValueFrom(
          this.httpService.get(`${this.coingeckoBase}/coins/${tokenInfo.id}/market_chart`, {
            params: { vs_currency: 'usd', days },
          })
        );
        
        const prices = response.data.prices || [];
        const supplies = response.data.total_supplies || [];
        
        const history: TokenSupplyHistory[] = [];
        const baseSupply = supplies.length > 0 ? parseFloat(supplies[0][1]) : 1000000000;
        
        for (let i = 0; i < prices.length; i += Math.max(1, Math.floor(prices.length / 30))) {
          const timestamp = prices[i][0];
          const supply = supplies.length > i ? parseFloat(supplies[i][1]) : baseSupply;
          const change = supply - baseSupply;
          const changePercent = (change / baseSupply) * 100;
          
          history.push({
            timestamp,
            date: new Date(timestamp).toISOString().split('T')[0],
            totalSupply: supply.toString(),
            change,
            changePercent,
          });
        }
        
        return history;
      }
      
      return this.getMockSupplyHistory(days);
    } catch (error) {
      console.error('Error fetching supply history:', error);
      return this.getMockSupplyHistory(days);
    }
  }

  async getInflationAnalysis(chain: string, address: string): Promise<InflationAnalysis> {
    const supply = await this.getTokenSupply(chain, address);
    const history7d = await this.getSupplyHistory(chain, address, 7);
    const history30d = await this.getSupplyHistory(chain, address, 30);
    
    const change7d = history7d.length > 1 
      ? parseFloat(history7d[history7d.length - 1].totalSupply) - parseFloat(history7d[0].totalSupply)
      : 0;
    const change30d = history30d.length > 1 
      ? parseFloat(history30d[history30d.length - 1].totalSupply) - parseFloat(history30d[0].totalSupply)
      : 0;
    
    const inflationRate7d = (change7d / parseFloat(supply.totalSupply)) * 100;
    const inflationRate30d = (change30d / parseFloat(supply.totalSupply)) * 100;
    
    const isDeflationary = change30d < 0;
    const absInflationRate = Math.abs(inflationRate30d);
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let analysis = '';
    const recommendations: string[] = [];
    
    if (isDeflationary) {
      analysis = `${supply.symbol} is a deflationary token. The total supply has decreased over the past 30 days, which is generally positive for token holders.`;
      riskLevel = 'low';
      recommendations.push('Deflationary tokens can be good store of value');
      recommendations.push('Monitor burn events for sustained deflation');
    } else if (absInflationRate < 1) {
      analysis = `${supply.symbol} has minimal inflation. The supply is relatively stable.`;
      riskLevel = 'low';
      recommendations.push('Low inflation is generally positive for holders');
    } else if (absInflationRate < 10) {
      analysis = `${supply.symbol} has moderate inflation of ${inflationRate30d.toFixed(2)}% over 30 days. This is typical for utility tokens.`;
      riskLevel = 'medium';
      recommendations.push('Consider the token utility and demand when evaluating');
      recommendations.push('Monitor inflation rate trends over time');
    } else {
      analysis = `${supply.symbol} has high inflation of ${inflationRate30d.toFixed(2)}% over 30 days. This could dilute token value.`;
      riskLevel = 'high';
      recommendations.push('High inflation may dilute your holdings');
      recommendations.push('Consider the tokenomics and inflation schedule');
      recommendations.push('Evaluate if inflation is justified by protocol growth');
    }
    
    return {
      address: supply.address,
      symbol: supply.symbol,
      name: supply.name,
      chain,
      currentSupply: supply.totalSupply,
      supplyChange24h: change7d / 4,
      supplyChange7d: change7d,
      supplyChange30d: change30d,
      inflationRate24h: inflationRate30d / 30,
      inflationRate7d: inflationRate7d,
      inflationRate30d: inflationRate30d,
      isDeflationary,
      riskLevel,
      analysis,
      recommendations,
    };
  }

  async getTrendingInflation(chain: string = 'eth', limit: number = 10): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.coingeckoBase}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: limit,
            page: 1,
            sparkline: false,
          },
        })
      );
      
      return (response.data || []).map((coin: CoinGeckoMarketData) => {
        const totalSupply = coin.total_supply || 0;
        const circulatingSupply = coin.circulating_supply || 0;
        
        return {
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          totalSupply: totalSupply.toString(),
          circulatingSupply: circulatingSupply.toString(),
          maxSupply: coin.max_supply?.toString() || null,
          inflationRate: this.calculateSupplyInflationRate(totalSupply, circulatingSupply),
        };
      });
    } catch (error) {
      console.error('Error fetching trending inflation:', error);
      return [];
    }
  }

  async compareTokens(chain: string, addresses: string[]): Promise<InflationAnalysis[]> {
    const analyses: InflationAnalysis[] = [];
    
    for (const address of addresses) {
      try {
        const analysis = await this.getInflationAnalysis(chain, address);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing ${address}:`, error);
      }
    }
    
    return analyses;
  }

  async calculateInflationRate(
    chain: string,
    address: string,
    period: number = 30
  ): Promise<{ dailyRate: number; weeklyRate: number; monthlyRate: number; yearlyRate: number }> {
    const history = await this.getSupplyHistory(chain, address, period);
    
    if (history.length < 2) {
      return { dailyRate: 0, weeklyRate: 0, monthlyRate: 0, yearlyRate: 0 };
    }
    
    const first = parseFloat(history[0].totalSupply);
    const last = parseFloat(history[history.length - 1].totalSupply);
    const change = last - first;
    const days = period;
    
    const dailyRate = (change / first) * (365 / days) / 100;
    const weeklyRate = (change / first) * (365 / 7) / 100;
    const monthlyRate = (change / first) * 12 / 100;
    const yearlyRate = (change / first) * (365 / days) / 100;
    
    return { dailyRate, weeklyRate, monthlyRate, yearlyRate };
  }

  private async searchTokenOnCoingecko(chain: string, address: string): Promise<CoinGeckoMarketData | null> {
    try {
      // Get top coins to match with address
      const response = await firstValueFrom(
        this.httpService.get(`${this.coingeckoBase}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: false,
          },
        })
      );
      
      // Simple matching based on popular token addresses
      const tokenMap: Record<string, string> = {
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'wrapped-bitcoin',
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd-coin',
        '0xdac17f958d2ee523a2206206994597c13d831ec7': 'tether',
        '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'aave',
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'uniswap',
        '0x514910771af9ca656af840dff83e8264ecf986ca': 'chainlink',
        '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': 'matic-network',
        '0x55d398326f99059ff775485246999027b3197955': 'binance-usd',
        '0xe9e7cea3dedca5984780bafc599bd69add087d56': 'binance-usd',
      };
      
      const coingeckoId = tokenMap[address.toLowerCase()];
      if (coingeckoId) {
        const coin = (response.data || []).find((c: CoinGeckoMarketData) => c.id === coingeckoId);
        if (coin) return coin;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  private calculateSupplyInflationRate(totalSupply: number | null, circulatingSupply: number): number {
    if (!totalSupply || totalSupply === 0) return 0;
    return ((totalSupply - circulatingSupply) / totalSupply) * 100;
  }

  private getMockSupplyData(chain: string, address: string): TokenInflationData {
    const mockTokens: Record<string, { symbol: string; name: string; total: string; circulating: string; max: string | null }> = {
      eth: {
        symbol: 'ETH',
        name: 'Ethereum',
        total: '120243500000000000000000000',
        circulating: '120243500000000000000000000',
        max: null,
      },
      bsc: {
        symbol: 'BNB',
        name: 'BNB',
        total: '198412150000000000000000000',
        circulating: '198412150000000000000000000',
        max: '198412150000000000000000000',
      },
      default: {
        symbol: 'TOKEN',
        name: 'Sample Token',
        total: '1000000000000000000000000',
        circulating: '600000000000000000000000',
        max: '1000000000000000000000000',
      },
    };
    
    const token = mockTokens[chain] || mockTokens.default;
    
    return {
      address: address.toLowerCase(),
      symbol: token.symbol,
      name: token.name,
      chain,
      totalSupply: token.total,
      circulatingSupply: token.circulating,
      maxSupply: token.max,
      inflationRate: this.calculateSupplyInflationRate(
        parseFloat(token.total),
        parseFloat(token.circulating)
      ),
      lastUpdated: Date.now(),
    };
  }

  private getMockSupplyHistory(days: number): TokenSupplyHistory[] {
    const history: TokenSupplyHistory[] = [];
    const baseSupply = 1000000000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate slight inflation
      const change = (days - i) * 0.001 * baseSupply;
      const supply = baseSupply + change;
      
      history.push({
        timestamp: date.getTime(),
        date: date.toISOString().split('T')[0],
        totalSupply: supply.toFixed(0),
        change: change,
        changePercent: (change / baseSupply) * 100,
      });
    }
    
    return history;
  }
}
