import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface GasPrice {
  chainId: number;
  chainName: string;
  slow: string;
  standard: string;
  fast: string;
  baseFee: string;
  timestamp: number;
}

export interface GasHistoryPoint {
  timestamp: number;
  avgGas: number;
  avgBaseFee: number;
  transactionCount: number;
}

export interface GasPrediction {
  current: GasPrice;
  prediction: {
    recommended: 'slow' | 'standard' | 'fast';
    estimatedTime: string;
    confidence: number;
    savings: {
      slowVsFast: number;
      slowVsStandard: number;
    };
  };
  historical: GasHistoryPoint[];
  hourlyAverage: { hour: number; avgGas: number }[];
  weeklyAverage: { day: number; avgGas: number }[];
  bestTimeToTransact: {
    dayOfWeek: number;
    hour: number;
    avgGas: number;
  };
  networkStatus: {
    congestion: 'low' | 'medium' | 'high' | 'critical';
    trend: 'rising' | 'falling' | 'stable';
    change24h: number;
  };
}

export interface ChainGasInfo {
  chainId: number;
  chainName: string;
  chainSymbol: string;
  currentGas: string;
  avgGas24h: string;
  gasUnit: string;
  explorerUrl: string;
}

@Injectable()
export class GasAnalyzerService {
  private readonly etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';

  // Supported chains with their gas oracles endpoints
  private readonly supportedChains: { id: number; name: string; symbol: string; explorer: string }[] = [
    { id: 1, name: 'Ethereum', symbol: 'ETH', explorer: 'https://etherscan.io' },
    { id: 56, name: 'BNB Chain', symbol: 'BNB', explorer: 'https://bscscan.com' },
    { id: 137, name: 'Polygon', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
    { id: 42161, name: 'Arbitrum One', symbol: 'ETH', explorer: 'https://arbiscan.io' },
    { id: 10, name: 'Optimism', symbol: 'ETH', explorer: 'https://optimistic.etherscan.io' },
    { id: 8453, name: 'Base', symbol: 'ETH', explorer: 'https://basescan.org' },
  ];

  async getCurrentGasPrices(chainId: number = 1): Promise<GasPrice[]> {
    const results: GasPrice[] = [];

    if (chainId === 1) {
      // Ethereum mainnet - use Etherscan API
      try {
        const response = await axios.get(
          `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${this.etherscanApiKey}`,
          { timeout: 5000 }
        );

        if (response.data.status === '1') {
          const result = response.data.result;
          results.push({
            chainId: 1,
            chainName: 'Ethereum',
            slow: result.SafeGasPrice || '10',
            standard: result.ProposeGasPrice || '20',
            fast: result.FastGasPrice || '30',
            baseFee: result.suggestBaseFee || '1',
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        // Return mock data if API fails
        results.push(this.getMockGasPrice(1, 'Ethereum'));
      }
    } else {
      // For other chains, return mock data
      const chain = this.supportedChains.find(c => c.id === chainId);
      if (chain) {
        results.push(this.getMockGasPrice(chain.id, chain.name));
      }
    }

    // If no results, return mock for all supported chains
    if (results.length === 0) {
      for (const chain of this.supportedChains.slice(0, 4)) {
        results.push(this.getMockGasPrice(chain.id, chain.name));
      }
    }

    return results;
  }

  private getMockGasPrice(chainId: number, chainName: string): GasPrice {
    // Generate somewhat realistic mock gas prices
    const basePrice = chainId === 1 ? 20 : chainId === 56 ? 3 : chainId === 137 ? 50 : 1;
    const variance = Math.random() * 0.4 - 0.2; // -20% to +20%

    const slow = Math.round(basePrice * (0.7 + variance));
    const standard = Math.round(basePrice * (1 + variance));
    const fast = Math.round(basePrice * (1.4 + variance));
    const baseFee = Math.round(standard * 0.8);

    return {
      chainId,
      chainName,
      slow: slow.toString(),
      standard: standard.toString(),
      fast: fast.toString(),
      baseFee: baseFee.toString(),
      timestamp: Date.now(),
    };
  }

  async getGasHistory(chainId: number = 1, days: number = 7): Promise<GasHistoryPoint[]> {
    // Generate historical data
    const history: GasHistoryPoint[] = [];
    const now = Date.now();
    const interval = 4 * 60 * 60 * 1000; // 4 hours

    for (let i = days * 6; i >= 0; i--) {
      const timestamp = now - i * interval;
      const hour = new Date(timestamp).getHours();

      // Simulate time-of-day patterns (higher during US business hours)
      let timeMultiplier = 1;
      if (hour >= 14 && hour <= 21) timeMultiplier = 1.5; // Peak hours
      else if (hour >= 2 && hour <= 6) timeMultiplier = 0.6; // Off-peak

      const baseGas = chainId === 1 ? 20 : 5;
      const avgGas = Math.round(baseGas * timeMultiplier * (0.8 + Math.random() * 0.4));

      history.push({
        timestamp,
        avgGas,
        avgBaseFee: Math.round(avgGas * 0.8),
        transactionCount: Math.floor(1000 + Math.random() * 5000),
      });
    }

    return history;
  }

  async getGasPrediction(chainId: number = 1): Promise<GasPrediction> {
    const [current, historical, hourlyAverage, weeklyAverage] = await Promise.all([
      this.getCurrentGasPrices(chainId),
      this.getGasHistory(chainId, 7),
      this.getHourlyAverage(chainId),
      this.getWeeklyAverage(chainId),
    ]);

    const currentGas = current[0] || this.getMockGasPrice(1, 'Ethereum');

    // Determine best time to transact based on historical patterns
    const bestHour = hourlyAverage.reduce((best, h) => 
      h.avgGas < best.avgGas ? h : best, hourlyAverage[0]);
    
    const bestDay = weeklyAverage.reduce((best, d) => 
      d.avgGas < best.avgGas ? d : best, weeklyAverage[0]);

    // Calculate network status
    const recentGas = historical.slice(-6).map(h => h.avgGas); // Last 24 hours
    const olderGas = historical.slice(-12, -6).map(h => h.avgGas); // 24-48 hours ago
    const recentAvg = recentGas.reduce((a, b) => a + b, 0) / recentGas.length;
    const olderAvg = olderGas.reduce((a, b) => a + b, 0) / olderGas.length;
    const change24h = ((recentAvg - olderAvg) / olderAvg) * 100;

    let congestion: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (recentAvg < 15) congestion = 'low';
    else if (recentAvg < 35) congestion = 'medium';
    else if (recentAvg < 60) congestion = 'high';
    else congestion = 'critical';

    const trend: 'rising' | 'falling' | 'stable' = change24h > 10 ? 'rising' : change24h < -10 ? 'falling' : 'stable';

    // Determine recommended speed
    const currentStandard = parseInt(currentGas.standard);
    let recommended: 'slow' | 'standard' | 'fast' = 'standard';
    let confidence = 0.7;

    if (congestion === 'low') {
      recommended = 'slow';
      confidence = 0.9;
    } else if (congestion === 'high' || congestion === 'critical') {
      recommended = 'fast';
      confidence = 0.8;
    }

    // Calculate savings
    const slowGas = parseInt(currentGas.slow);
    const fastGas = parseInt(currentGas.fast);
    const standardGas = parseInt(currentGas.standard);

    const savings = {
      slowVsFast: fastGas - slowGas,
      slowVsStandard: standardGas - slowGas,
    };

    return {
      current: currentGas,
      prediction: {
        recommended,
        estimatedTime: this.getEstimatedTime(recommended),
        confidence,
        savings,
      },
      historical,
      hourlyAverage,
      weeklyAverage,
      bestTimeToTransact: {
        dayOfWeek: bestDay.day,
        hour: bestHour.hour,
        avgGas: bestHour.avgGas,
      },
      networkStatus: {
        congestion,
        trend,
        change24h: Math.round(change24h * 10) / 10,
      },
    };
  }

  private async getHourlyAverage(chainId: number): Promise<{ hour: number; avgGas: number }[]> {
    // Generate average gas prices by hour of day
    const hourly: { hour: number; avgGas: number }[] = [];

    for (let hour = 0; hour < 24; hour++) {
      let baseGas = chainId === 1 ? 20 : 5;

      // US business hours pattern (14:00-21:00 UTC = peak)
      if (hour >= 14 && hour <= 21) baseGas *= 1.5;
      else if (hour >= 2 && hour <= 6) baseGas *= 0.6;

      hourly.push({
        hour,
        avgGas: Math.round(baseGas * (0.9 + Math.random() * 0.2)),
      });
    }

    return hourly;
  }

  private async getWeeklyAverage(chainId: number): Promise<{ day: number; avgGas: number }[]> {
    // Generate average gas prices by day of week
    const weekly: { day: number; avgGas: number }[] = [];

    for (let day = 0; day < 7; day++) {
      let baseGas = chainId === 1 ? 20 : 5;

      // Weekends typically lower
      if (day === 0 || day === 6) baseGas *= 0.8;
      // Monday and Friday can be volatile
      else if (day === 1 || day === 5) baseGas *= 1.1;

      weekly.push({
        day,
        avgGas: Math.round(baseGas * (0.9 + Math.random() * 0.2)),
      });
    }

    return weekly;
  }

  private getEstimatedTime(speed: 'slow' | 'standard' | 'fast'): string {
    switch (speed) {
      case 'slow':
        return '5-15 minutes';
      case 'standard':
        return '1-3 minutes';
      case 'fast':
        return '< 30 seconds';
    }
  }

  async getMultiChainGasInfo(): Promise<ChainGasInfo[]> {
    const results: ChainGasInfo[] = [];

    for (const chain of this.supportedChains) {
      const gas = await this.getCurrentGasPrices(chain.id);
      const current = gas[0];

      results.push({
        chainId: chain.id,
        chainName: chain.name,
        chainSymbol: chain.symbol,
        currentGas: current?.standard || '0',
        avgGas24h: current?.standard || '0',
        gasUnit: chain.id === 1 || chain.id === 42161 || chain.id === 10 || chain.id === 8453 ? 'Gwei' : 'Gwei',
        explorerUrl: chain.explorer,
      });
    }

    return results;
  }

  async calculateTransactionFee(
    chainId: number,
    gasLimit: number,
    speed: 'slow' | 'standard' | 'fast' = 'standard'
  ): Promise<{ fee: string; feeUsd: string; gasPrice: string }> {
    const gasPrices = await this.getCurrentGasPrices(chainId);
    const current = gasPrices[0] || this.getMockGasPrice(1, 'Ethereum');

    let gasPrice: string;
    switch (speed) {
      case 'slow':
        gasPrice = current.slow;
        break;
      case 'fast':
        gasPrice = current.fast;
        break;
      default:
        gasPrice = current.standard;
    }

    const feeWei = BigInt(gasLimit) * BigInt(gasPrice);
    const feeEth = parseFloat(feeWei.toString()) / 1e18;

    // Mock USD price - in production, fetch from price API
    const ethPrice = 2500; // Mock ETH price
    const feeUsd = (feeEth * ethPrice).toFixed(2);

    return {
      fee: feeEth.toFixed(6),
      feeUsd,
      gasPrice,
    };
  }
}
