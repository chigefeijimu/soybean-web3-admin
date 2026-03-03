import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface MempoolTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  timestamp: number;
  nonce: number;
  chainId: number;
}

export interface MempoolStats {
  chainId: number;
  totalPending: number;
  avgGasPrice: string;
  minGasPrice: string;
  maxGasPrice: string;
  totalValue: string;
  byType: {
    transfer: number;
    swap: number;
    contractCall: number;
    unknown: number;
  };
}

@Injectable()
export class MempoolMonitorService {
  private readonly chainRpcUrls: Record<number, string> = {
    1: process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    56: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
    8453: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    43114: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
  };

  // Simulated mempool data (in production, this would come from mempool APIs)
  private mempoolCache: Map<number, MempoolTransaction[]> = new Map();
  private lastUpdate: Map<number, number> = new Map();

  constructor(private readonly httpService: HttpService) {
    this.initializeMempoolData();
  }

  private async initializeMempoolData() {
    // Initialize with sample data for demo
    const sampleData: MempoolTransaction[] = [
      {
        hash: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d000000000000000000000000',
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
        to: '0x7a250d5630B4cF539739DF2C5dAcB4c659F2488D',
        value: '1.5',
        gasPrice: '50000000000',
        gasUsed: '21000',
        timestamp: Date.now() - 60000,
        nonce: 42,
        chainId: 1
      },
      {
        hash: '0x8f3cf7a23f6c8092e7c0a7c0e9b2d3f4a5c6b7e8',
        from: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
        to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        value: '0.8',
        gasPrice: '45000000000',
        gasUsed: '65000',
        timestamp: Date.now() - 120000,
        nonce: 18,
        chainId: 1
      },
      {
        hash: '0x9c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
        from: '0xE37e799D5076792e5833E27306a3F5cC50e3c3Ed',
        to: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        value: '2.3',
        gasPrice: '55000000000',
        gasUsed: '85000',
        timestamp: Date.now() - 180000,
        nonce: 156,
        chainId: 1
      },
      {
        hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
        from: '0xACa94C352e5b10b5E89E7b8F0d8B9C0D1E2F3A4B',
        to: '0x5C69bEe701ef814a2B6fe3f4ccd085c2f3eD5fA',
        value: '0.5',
        gasPrice: '60000000000',
        gasUsed: '120000',
        timestamp: Date.now() - 240000,
        nonce: 89,
        chainId: 1
      },
      {
        hash: '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
        from: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        value: '10.0',
        gasPrice: '48000000000',
        gasUsed: '21000',
        timestamp: Date.now() - 300000,
        nonce: 234,
        chainId: 1
      }
    ];

    this.mempoolCache.set(1, sampleData);

    // Add sample data for other chains
    const polygonData = sampleData.map(tx => ({ ...tx, chainId: 137, gasPrice: '80000000000' }));
    this.mempoolCache.set(137, polygonData);

    const arbitrumData = sampleData.map(tx => ({ ...tx, chainId: 42161, gasPrice: '100000000' }));
    this.mempoolCache.set(42161, arbitrumData);

    const optimismData = sampleData.map(tx => ({ ...tx, chainId: 10, gasPrice: '2000000000' }));
    this.mempoolCache.set(10, optimismData);

    const bscData = sampleData.map(tx => ({ ...tx, chainId: 56, gasPrice: '3000000000' }));
    this.mempoolCache.set(56, bscData);
  }

  async getMempoolTransactions(
    chainId: number,
    limit: number = 50,
    minGas: number = 0,
    address?: string
  ): Promise<MempoolTransaction[]> {
    let transactions = this.mempoolCache.get(chainId) || [];

    // Filter by minimum gas price
    if (minGas > 0) {
      transactions = transactions.filter(tx => parseFloat(tx.gasPrice) >= minGas);
    }

    // Filter by address (from or to)
    if (address) {
      const addrLower = address.toLowerCase();
      transactions = transactions.filter(
        tx => tx.from.toLowerCase() === addrLower || tx.to.toLowerCase() === addrLower
      );
    }

    // Sort by gas price (highest first)
    transactions.sort((a, b) => parseFloat(b.gasPrice) - parseFloat(a.gasPrice));

    return transactions.slice(0, limit);
  }

  async getPendingTransactionsByAddress(address: string, chainId: number): Promise<MempoolTransaction[]> {
    const transactions = this.mempoolCache.get(chainId) || [];
    const addrLower = address.toLowerCase();
    return transactions.filter(
      tx => tx.from.toLowerCase() === addrLower || tx.to.toLowerCase() === addrLower
    );
  }

  async getMempoolStats(chainId: number): Promise<MempoolStats> {
    const transactions = this.mempoolCache.get(chainId) || [];
    
    if (transactions.length === 0) {
      return {
        chainId,
        totalPending: 0,
        avgGasPrice: '0',
        minGasPrice: '0',
        maxGasPrice: '0',
        totalValue: '0',
        byType: { transfer: 0, swap: 0, contractCall: 0, unknown: 0 }
      };
    }

    const gasPrices = transactions.map(tx => parseFloat(tx.gasPrice));
    const avgGasPrice = gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length;
    
    const values = transactions.map(tx => parseFloat(tx.value));
    const totalValue = values.reduce((a, b) => a + b, 0);

    // Count transaction types
    const byType = {
      transfer: transactions.filter(tx => tx.to.length === 42).length,
      swap: transactions.filter(tx => 
        tx.to.toLowerCase() === '0x7a250d5630b4cf539739df2c5dacb4c659f2488d' || // Uniswap
        tx.to.toLowerCase() === '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f'    // Sushiswap
      ).length,
      contractCall: transactions.filter(tx => parseInt(tx.gasUsed) > 21000).length,
      unknown: 0
    };
    byType.unknown = transactions.length - byType.transfer - byType.swap - byType.contractCall;

    return {
      chainId,
      totalPending: transactions.length,
      avgGasPrice: avgGasPrice.toFixed(0),
      minGasPrice: Math.min(...gasPrices).toFixed(0),
      maxGasPrice: Math.max(...gasPrices).toFixed(0),
      totalValue: totalValue.toFixed(4),
      byType
    };
  }

  async getGasPriceTrend(chainId: number, hours: number = 24): Promise<any> {
    // Generate sample gas price trend data
    const now = Date.now();
    const dataPoints = hours * 4; // 4 data points per hour (every 15 minutes)
    const trend = [];
    
    let baseGasPrice = 40000000000; // 40 Gwei base
    
    for (let i = dataPoints; i >= 0; i--) {
      const timestamp = now - (i * 15 * 60 * 1000);
      // Add some variation
      const variation = (Math.random() - 0.5) * 20000000000;
      const gasPrice = Math.max(1000000000, baseGasPrice + variation);
      
      trend.push({
        timestamp,
        gasPrice: gasPrice.toFixed(0),
        date: new Date(timestamp).toISOString()
      });
      
      // Gradually adjust base
      baseGasPrice += (Math.random() - 0.5) * 1000000000;
    }

    return {
      chainId,
      timeRange: `${hours}h`,
      data: trend,
      summary: {
        avg: trend.reduce((sum, p) => sum + parseFloat(p.gasPrice), 0) / trend.length,
        min: Math.min(...trend.map(p => parseFloat(p.gasPrice))),
        max: Math.max(...trend.map(p => parseFloat(p.gasPrice)))
      }
    };
  }

  async getTopPendingTransactions(chainId: number, limit: number = 10): Promise<MempoolTransaction[]> {
    const transactions = this.mempoolCache.get(chainId) || [];
    return transactions
      .sort((a, b) => parseFloat(b.gasPrice) - parseFloat(a.gasPrice))
      .slice(0, limit);
  }

  // Helper method to get chain name
  getChainName(chainId: number): string {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      56: 'BSC',
      8453: 'Base',
      43114: 'Avalanche'
    };
    return chains[chainId] || `Chain ${chainId}`;
  }
}
