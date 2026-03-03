import { Injectable } from '@nestjs/common';
import { QueryDto } from '../dto/query.dto';

interface QueryResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
  rowCount?: number;
}

interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockTime: number;
  explorer: string;
}

@Injectable()
export class OnchainDataQueryService {
  private chains: Map<string, ChainConfig> = new Map([
    ['ethereum', { name: 'Ethereum', chainId: 1, rpcUrl: 'https://eth.llamarpc.com', blockTime: 12, explorer: 'https://etherscan.io' }],
    ['polygon', { name: 'Polygon', chainId: 137, rpcUrl: 'https://polygon-rpc.com', blockTime: 2, explorer: 'https://polygonscan.com' }],
    ['arbitrum', { name: 'Arbitrum One', chainId: 42161, rpcUrl: 'https://arb1.arbitrum.io/rpc', blockTime: 0.25, explorer: 'https://arbiscan.io' }],
    ['optimism', { name: 'Optimism', chainId: 10, rpcUrl: 'https://mainnet.optimism.io', blockTime: 2, explorer: 'https://optimistic.etherscan.io' }],
    ['bsc', { name: 'BNB Chain', chainId: 56, rpcUrl: 'https://bsc-dataseed.binance.org', blockTime: 3, explorer: 'https://bscscan.com' }],
    ['base', { name: 'Base', chainId: 8453, rpcUrl: 'https://mainnet.base.org', blockTime: 2, explorer: 'https://basescan.org' }],
    ['avalanche', { name: 'Avalanche', chainId: 43114, rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', blockTime: 2, explorer: 'https://snowtrace.io' }],
  ]);

  private queryTemplates = [
    {
      name: 'Get Native Balance',
      query: 'SELECT balance FROM native_balance WHERE chain = "ethereum" AND address = "0x..."',
      description: 'Query native token balance for an address',
    },
    {
      name: 'Get Token Balance',
      query: 'SELECT balance, decimals FROM token_balance WHERE chain = "ethereum" AND address = "0x..." AND token = "0x..."',
      description: 'Query ERC20 token balance for an address',
    },
    {
      name: 'Get Transaction History',
      query: 'SELECT hash, from, to, value, gas_used, timestamp FROM transactions WHERE chain = "ethereum" AND address = "0x..." LIMIT 100',
      description: 'Get transaction history for an address',
    },
    {
      name: 'Get Token Transfers',
      query: 'SELECT token, from, to, value, timestamp FROM token_transfers WHERE chain = "ethereum" AND address = "0x..." ORDER BY block_number DESC LIMIT 50',
      description: 'Get token transfer history',
    },
    {
      name: 'Get Contract Interactions',
      query: 'SELECT contract_address, method_id, count(*) as tx_count FROM transactions WHERE chain = "ethereum" AND address = "0x..." GROUP BY contract_address ORDER BY tx_count DESC',
      description: 'Analyze contract interaction patterns',
    },
    {
      name: 'Get Gas Spending',
      query: 'SELECT sum(gas_used * gas_price) as total_gas, count(*) as tx_count FROM transactions WHERE chain = "ethereum" AND address = "0x..." AND timestamp > NOW() - 30 days',
      description: 'Calculate total gas spent in the last 30 days',
    },
    {
      name: 'Get Large Transfers',
      query: 'SELECT hash, from, to, value FROM transactions WHERE chain = "ethereum" AND value > 1000000000000000000 ORDER BY value DESC LIMIT 20',
      description: 'Find large value transfers',
    },
    {
      name: 'Get Block Statistics',
      query: 'SELECT block_number, count(*) as tx_count, sum(gas_used) as total_gas, avg(gas_price) as avg_gas FROM transactions WHERE chain = "ethereum" AND block_number > 19000000 GROUP BY block_number',
      description: 'Get block-level transaction statistics',
    },
  ];

  async executeQuery(queryDto: QueryDto): Promise<QueryResult> {
    const startTime = Date.now();
    const { query, chain = 'ethereum' } = queryDto;

    try {
      // Simulate query parsing and execution
      const normalizedQuery = query.toLowerCase().trim();
      
      // Validate chain
      if (!this.chains.has(chain)) {
        return {
          success: false,
          error: `Unsupported chain: ${chain}. Supported chains: ${Array.from(this.chains.keys()).join(', ')}`,
        };
      }

      // Parse and execute different query types
      let result;
      if (normalizedQuery.includes('from native_balance')) {
        result = await this.queryNativeBalance(queryDto);
      } else if (normalizedQuery.includes('from token_balance')) {
        result = await this.queryTokenBalance(queryDto);
      } else if (normalizedQuery.includes('from transactions')) {
        result = await this.queryTransactions(queryDto);
      } else if (normalizedQuery.includes('from token_transfers')) {
        result = await this.queryTokenTransfers(queryDto);
      } else if (normalizedQuery.includes('from blocks')) {
        result = await this.queryBlocks(queryDto);
      } else {
        // Default to simulated transaction query
        result = await this.queryTransactions(queryDto);
      }

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        rowCount: Array.isArray(result) ? result.length : 1,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Query execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private async queryNativeBalance(queryDto: QueryDto): Promise<any[]> {
    // Simulate native balance query
    const address = this.extractAddress(queryDto.query);
    return [{
      address: address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
      balance: '2.5432',
      balanceWei: '2543200000000000000',
      chain: queryDto.chain || 'ethereum',
      unit: 'ETH',
    }];
  }

  private async queryTokenBalance(queryDto: QueryDto): Promise<any[]> {
    // Simulate token balance query
    const address = this.extractAddress(queryDto.query);
    const token = this.extractToken(queryDto.query);
    return [{
      address: address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
      token: token || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      balance: '12500.50',
      balanceWei: '12500500000000',
      decimals: 6,
      chain: queryDto.chain || 'ethereum',
    }];
  }

  private async queryTransactions(queryDto: QueryDto): Promise<any[]> {
    // Simulate transaction query
    const address = this.extractAddress(queryDto.query);
    const limit = this.extractLimit(queryDto.query);
    
    const txs = [];
    for (let i = 0; i < Math.min(limit, 10); i++) {
      txs.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: 19000000 + i,
        from: address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
        to: `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`,
        value: (Math.random() * 10).toFixed(8),
        gasUsed: Math.floor(Math.random() * 100000) + 21000,
        gasPrice: (Math.random() * 50 * 1e9).toFixed(0),
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        status: 'success',
        chain: queryDto.chain || 'ethereum',
      });
    }
    return txs;
  }

  private async queryTokenTransfers(queryDto: QueryDto): Promise<any[]> {
    // Simulate token transfers query
    const transfers = [];
    for (let i = 0; i < 10; i++) {
      transfers.push({
        token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        from: `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`,
        to: `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`,
        value: (Math.random() * 10000).toFixed(2),
        blockNumber: 19000000 + i,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        chain: queryDto.chain || 'ethereum',
      });
    }
    return transfers;
  }

  private async queryBlocks(queryDto: QueryDto): Promise<any[]> {
    // Simulate block query
    const blocks = [];
    for (let i = 0; i < 10; i++) {
      blocks.push({
        blockNumber: 19000000 + i,
        timestamp: new Date(Date.now() - i * 12000).toISOString(),
        txCount: Math.floor(Math.random() * 200) + 50,
        gasUsed: Math.floor(Math.random() * 15000000) + 5000000,
        gasLimit: 30000000,
        miner: `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`,
        difficulty: Math.floor(Math.random() * 10000000000000),
        chain: queryDto.chain || 'ethereum',
      });
    }
    return blocks;
  }

  private extractAddress(query: string): string | null {
    const match = query.match(/(?:0x[a-fA-F0-9]{40})/);
    return match ? match[0] : null;
  }

  private extractToken(query: string): string | null {
    const match = query.match(/token\s*=\s*"(0x[a-fA-F0-9]{40})"/i);
    return match ? match[1] : null;
  }

  private extractLimit(query: string): number {
    const match = query.match(/limit\s+(\d+)/i);
    return match ? parseInt(match[1]) : 50;
  }

  async getChainStats(chain: string): Promise<any> {
    const chainConfig = this.chains.get(chain);
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    return {
      chain,
      name: chainConfig.name,
      chainId: chainConfig.chainId,
      currentBlock: 19000000 + Math.floor(Math.random() * 10000),
      latestBlock: 19000000 + Math.floor(Math.random() * 10000),
      avgBlockTime: chainConfig.blockTime,
      gasPrice: (Math.random() * 50).toFixed(2),
      gasPriceUnit: 'Gwei',
      tps: Math.floor(Math.random() * 50) + 10,
      totalTransactions: 1800000000 + Math.floor(Math.random() * 100000000),
      totalAddresses: 250000000 + Math.floor(Math.random() * 10000000),
      tvl: (Math.random() * 50000000000).toFixed(0),
      explorer: chainConfig.explorer,
    };
  }

  async getBlockData(chain: string, blockNumber: number): Promise<any> {
    const chainConfig = this.chains.get(chain);
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    return {
      blockNumber,
      timestamp: new Date(Date.now() - (19000000 - blockNumber) * 12000).toISOString(),
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      parentHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      nonce: `0x${Math.random().toString(16).substr(2, 16)}`,
      difficulty: Math.floor(Math.random() * 10000000000000),
      gasLimit: 30000000,
      gasUsed: Math.floor(Math.random() * 15000000) + 5000000,
      miner: `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`,
      transactions: Array.from({ length: Math.floor(Math.random() * 100) + 10 }, (_, i) => ({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`,
        to: `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`,
        value: (Math.random() * 10).toFixed(8),
        gasUsed: Math.floor(Math.random() * 50000) + 21000,
      })),
      chain,
    };
  }

  async getTransactions(
    chain: string,
    address: string,
    fromBlock: number,
    toBlock: number,
    limit: number,
  ): Promise<any[]> {
    const txs = [];
    for (let i = 0; i < Math.min(limit, 50); i++) {
      txs.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: fromBlock + i,
        from: address || '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
        to: `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`,
        value: (Math.random() * 10).toFixed(8),
        gasUsed: Math.floor(Math.random() * 100000) + 21000,
        gasPrice: (Math.random() * 50 * 1e9).toFixed(0),
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        status: Math.random() > 0.05 ? 'success' : 'failed',
        chain,
      });
    }
    return txs;
  }

  async getTokenTransfers(
    chain: string,
    address: string,
    tokenAddress: string,
    fromBlock: number,
    toBlock: number,
    limit: number,
  ): Promise<any[]> {
    const transfers = [];
    for (let i = 0; i < Math.min(limit, 50); i++) {
      transfers.push({
        token: tokenAddress || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        from: Math.random() > 0.5 ? address : `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}`,
        to: Math.random() > 0.5 ? `0x${Math.random().toString(16).substr(2, 40).padStart(40, '0')}` : address,
        value: (Math.random() * 10000).toFixed(6),
        blockNumber: fromBlock + i,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        chain,
      });
    }
    return transfers;
  }

  async getNativeBalanceHistory(
    chain: string,
    address: string,
    fromBlock: number,
    toBlock: number,
  ): Promise<any[]> {
    const history = [];
    const blocks = toBlock - fromBlock;
    const step = Math.max(1, Math.floor(blocks / 10));
    
    for (let i = 0; i < 10; i++) {
      const block = fromBlock + (i * step);
      history.push({
        blockNumber: block,
        balance: (Math.random() * 10).toFixed(8),
        balanceWei: Math.floor(Math.random() * 1e18).toString(),
        timestamp: new Date(Date.now() - (toBlock - block) * 12000).toISOString(),
        chain,
        address,
      });
    }
    return history;
  }

  getSupportedChains(): any[] {
    return Array.from(this.chains.entries()).map(([key, config]) => ({
      id: key,
      name: config.name,
      chainId: config.chainId,
      blockTime: config.blockTime,
      explorer: config.explorer,
    }));
  }

  getQueryTemplates(): any[] {
    return this.queryTemplates;
  }
}
