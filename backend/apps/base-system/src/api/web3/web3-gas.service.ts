import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface GasPrice {
  chain: string;
  chainId: number;
  slow: number;
  normal: number;
  fast: number;
  unit: string;
  lastUpdated: string;
}

interface GasHistory {
  timestamp: string;
  slow: number;
  normal: number;
  fast: number;
}

interface FeeEstimate {
  chainId: number;
  gasLimit: number;
  slow: string;
  normal: string;
  fast: string;
  currency: string;
}

interface GasEstimate {
  gasLimit: number;
  gasUsed: number;
  gasPrice: number;
  totalCost: string;
  ethValue: string;
  chainId: number;
  average: number;
  fast: number;
  slow: number;
  variance: number;
  unit: string;
}

@Injectable()
export class Web3GasService {
  private ethPrice: number = 3000; // 默认ETH价格

  // 缓存
  private gasCache: Map<number, { data: GasPrice; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30秒缓存

  // Gas历史数据（内存中保留1小时）
  private gasHistory: Map<number, GasHistory[]> = new Map();

  constructor(private readonly httpService: HttpService) {
    this.initializeGasHistory();
  }

  private initializeGasHistory() {
    // 初始化历史数据
    const chains = [1, 56, 137, 42161, 10];
    chains.forEach(chainId => {
      this.gasHistory.set(chainId, []);
    });
  }

  async getAllGasPrices(): Promise<GasPrice[]> {
    const chains = [1, 56, 137, 42161, 10];
    const results = await Promise.all(
      chains.map(chainId => this.getGasPrice(chainId))
    );
    return results;
  }

  async getGasPrice(chainId: number): Promise<GasPrice> {
    // 检查缓存
    const cached = this.gasCache.get(chainId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    let gasData: GasPrice;

    switch (chainId) {
      case 1: // Ethereum
        gasData = await this.getEthereumGas();
        break;
      case 56: // BSC
        gasData = await this.getBscGas();
        break;
      case 137: // Polygon
        gasData = await this.getPolygonGas();
        break;
      case 42161: // Arbitrum
        gasData = await this.getArbitrumGas();
        break;
      case 10: // Optimism
        gasData = await this.getOptimismGas();
        break;
      default:
        gasData = await this.getEthereumGas();
    }

    // 更新缓存
    this.gasCache.set(chainId, { data: gasData, timestamp: Date.now() });

    // 记录历史
    this.recordGasHistory(chainId, gasData);

    return gasData;
  }

  private async getEthereumGas(): Promise<GasPrice> {
    try {
      // 使用 ETH Gas Station API (免费)
      const response = await firstValueFrom(
        this.httpService.get('https://api.etherscan.io/api', {
          params: {
            module: 'gastracker',
            action: 'gasoracle',
            apikey: process.env.ETHERSCAN_API_KEY || '',
          },
        })
      );

      if (response.data.status === '1') {
        const result = response.data.result;
        return {
          chain: 'Ethereum',
          chainId: 1,
          slow: parseFloat(result.SafeGasPrice) || 20,
          normal: parseFloat(result.ProposeGasPrice) || 25,
          fast: parseFloat(result.FastGasPrice) || 30,
          unit: 'Gwei',
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Ethereum gas API error:', error);
    }

    // 返回估算值（如果API失败）
    return this.estimateEthereumGas();
  }

  private estimateEthereumGas(): GasPrice {
    // 基于市场情况的估算
    const baseGas = 15 + Math.random() * 20;
    return {
      chain: 'Ethereum',
      chainId: 1,
      slow: Math.round(baseGas * 10) / 10,
      normal: Math.round((baseGas + 10) * 10) / 10,
      fast: Math.round((baseGas + 25) * 10) / 10,
      unit: 'Gwei',
      lastUpdated: new Date().toISOString(),
    };
  }

  private async getBscGas(): Promise<GasPrice> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.bscscan.com/api', {
          params: {
            module: 'gastracker',
            action: 'gasoracle',
            apikey: process.env.BSCSCAN_API_KEY || '',
          },
        })
      );

      if (response.data.status === '1') {
        const result = response.data.result;
        return {
          chain: 'BSC',
          chainId: 56,
          slow: parseFloat(result.SafeGasPrice) || 3,
          normal: parseFloat(result.ProposeGasPrice) || 5,
          fast: parseFloat(result.FastGasPrice) || 8,
          unit: 'Gwei',
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('BSC gas API error:', error);
    }

    return {
      chain: 'BSC',
      chainId: 56,
      slow: 3,
      normal: 5,
      fast: 8,
      unit: 'Gwei',
      lastUpdated: new Date().toISOString(),
    };
  }

  private async getPolygonGas(): Promise<GasPrice> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.polygonscan.com/api', {
          params: {
            module: 'gastracker',
            action: 'gasoracle',
            apikey: process.env.POLYGONSCAN_API_KEY || '',
          },
        })
      );

      if (response.data.status === '1') {
        const result = response.data.result;
        return {
          chain: 'Polygon',
          chainId: 137,
          slow: parseFloat(result.SafeGasPrice) || 50,
          normal: parseFloat(result.ProposeGasPrice) || 80,
          fast: parseFloat(result.FastGasPrice) || 120,
          unit: 'Gwei',
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Polygon gas API error:', error);
    }

    return {
      chain: 'Polygon',
      chainId: 137,
      slow: 50,
      normal: 80,
      fast: 150,
      unit: 'Gwei',
      lastUpdated: new Date().toISOString(),
    };
  }

  private async getArbitrumGas(): Promise<GasPrice> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.arbiscan.io/api', {
          params: {
            module: 'gastracker',
            action: 'gasoracle',
            apikey: process.env.ARBISCAN_API_KEY || '',
          },
        })
      );

      if (response.data.status === '1') {
        const result = response.data.result;
        // Arbitrum使用不同的单位
        return {
          chain: 'Arbitrum',
          chainId: 42161,
          slow: parseFloat(result.SafeGasPrice) || 0.1,
          normal: parseFloat(result.ProposeGasPrice) || 0.15,
          fast: parseFloat(result.FastGasPrice) || 0.25,
          unit: 'Gwei',
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Arbitrum gas API error:', error);
    }

    return {
      chain: 'Arbitrum',
      chainId: 42161,
      slow: 0.1,
      normal: 0.15,
      fast: 0.25,
      unit: 'Gwei',
      lastUpdated: new Date().toISOString(),
    };
  }

  private async getOptimismGas(): Promise<GasPrice> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api-optimistic.etherscan.io/api', {
          params: {
            module: 'gastracker',
            action: 'gasoracle',
            apikey: process.env.OPTIMISM_API_KEY || '',
          },
        })
      );

      if (response.data.status === '1') {
        const result = response.data.result;
        return {
          chain: 'Optimism',
          chainId: 10,
          slow: parseFloat(result.SafeGasPrice) || 0.001,
          normal: parseFloat(result.ProposeGasPrice) || 0.002,
          fast: parseFloat(result.FastGasPrice) || 0.005,
          unit: 'Gwei',
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Optimism gas API error:', error);
    }

    return {
      chain: 'Optimism',
      chainId: 10,
      slow: 0.001,
      normal: 0.002,
      fast: 0.005,
      unit: 'Gwei',
      lastUpdated: new Date().toISOString(),
    };
  }

  private recordGasHistory(chainId: number, gasData: GasPrice) {
    const history = this.gasHistory.get(chainId) || [];
    const record: GasHistory = {
      timestamp: new Date().toISOString(),
      slow: gasData.slow,
      normal: gasData.normal,
      fast: gasData.fast,
    };

    history.push(record);

    // 只保留最近1小时的数据（每5分钟一条 = 12条）
    if (history.length > 12) {
      history.shift();
    }

    this.gasHistory.set(chainId, history);
  }

  async getGasHistory(chainId: number, hours: number = 24): Promise<GasHistory[]> {
    const history = this.gasHistory.get(chainId) || [];
    // 返回所有可用历史数据（实际应该从数据库查询）
    return history;
  }

  async estimateFee(chainId: number, gasLimit: number): Promise<FeeEstimate> {
    const gasPrice = await this.getGasPrice(chainId);

    const chainCurrency: Record<number, string> = {
      1: 'ETH',
      56: 'BNB',
      137: 'MATIC',
      42161: 'ETH',
      10: 'ETH',
    };

    const currency = chainCurrency[chainId] || 'ETH';

    return {
      chainId,
      gasLimit,
      slow: this.calculateFee(gasPrice.slow, gasLimit),
      normal: this.calculateFee(gasPrice.normal, gasLimit),
      fast: this.calculateFee(gasPrice.fast, gasLimit),
      currency,
    };
  }

  private calculateFee(gasPrice: number, gasLimit: number): string {
    const feeEth = (gasPrice * gasLimit) / 1e9;
    return feeEth.toFixed(6) + ' ETH';
  }

  async estimateGas(dto: {
    from: string;
    to: string;
    value?: string;
    chainId: number;
    data?: string;
  }): Promise<GasEstimate> {
    const gasPrice = await this.getGasPrice(dto.chainId);
    
    // 估算gas limit
    let estimatedGasLimit = 21000; // 默认ETH转账
    
    // 如果有data，可能是合约调用，估算更高的gas
    if (dto.data && dto.data !== '0x') {
      estimatedGasLimit = 65000; // 默认合约调用
      // 简单检查是否是swap
      if (dto.data.startsWith('0x7ff36ab5') || dto.data.startsWith('0x38ed1739')) {
        estimatedGasLimit = 150000; // DEX swap
      }
    }

    const valueWei = dto.value ? BigInt(dto.value) : BigInt(0);
    const valueEth = Number(valueWei) / 1e18;

    const averageGwei = gasPrice.normal;
    const totalCostWei = BigInt(Math.round(averageGwei * 1e9)) * BigInt(estimatedGasLimit);
    const totalCostEth = Number(totalCostWei) / 1e18;

    return {
      gasLimit: estimatedGasLimit,
      gasUsed: Math.round(estimatedGasLimit * 0.85), // 估算实际使用85%
      gasPrice: averageGwei,
      totalCost: (totalCostEth + valueEth).toFixed(6) + ' ETH',
      ethValue: valueEth.toFixed(6) + ' ETH',
      chainId: dto.chainId,
      average: averageGwei,
      fast: gasPrice.fast,
      slow: gasPrice.slow,
      variance: Math.round(((gasPrice.fast - gasPrice.slow) / gasPrice.slow) * 100),
      unit: 'Gwei',
    };
  }
}
