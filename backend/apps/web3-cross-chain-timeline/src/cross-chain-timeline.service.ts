import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CrossChainTimelineService {
  private readonly logger = new Logger(CrossChainTimelineService.name);

  // Chain configurations
  private readonly CHAIN_CONFIG: Record<string, { name: string; explorer: string; rpc: string }> = {
    '1': { name: 'Ethereum', explorer: 'https://api.etherscan.io/api', rpc: 'https://eth.llamarpc.com' },
    '137': { name: 'Polygon', explorer: 'https://api.polygonscan.com/api', rpc: 'https://polygon-rpc.com' },
    '42161': { name: 'Arbitrum', explorer: 'https://api.arbiscan.io/api', rpc: 'https://arb1.arbitrum.io/rpc' },
    '10': { name: 'Optimism', explorer: 'https://api-optimistic.etherscan.io/api', rpc: 'https://mainnet.optimism.io' },
    '56': { name: 'BSC', explorer: 'https://api.bscscan.com/api', rpc: 'https://bsc-dataseed.binance.org' },
    '8453': { name: 'Base', explorer: 'https://api.basescan.org/api', rpc: 'https://mainnet.base.org' },
    '43114': { name: 'Avalanche', explorer: 'https://api.snowtrace.io/api', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  };

  // Supported chains
  private readonly SUPPORTED_CHAINS = ['1', '137', '42161', '10', '56', '8453', '43114'];

  /**
   * Get unified timeline across multiple chains
   */
  async getCrossChainTimeline(address: string, chainIds?: string[], options?: { limit?: number; offset?: number }) {
    const chains = chainIds?.filter(c => this.SUPPORTED_CHAINS.includes(c)) || this.SUPPORTED_CHAINS;
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    try {
      // Fetch transactions from all chains in parallel
      const chainPromises = chains.map(chainId => this.getChainTransactions(address, chainId));
      const results = await Promise.allSettled(chainPromises);

      // Combine and sort all transactions by timestamp
      const allTransactions: any[] = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const chainId = chains[index];
          const txs = result.value.map((tx: any) => ({
            ...tx,
            chainId,
            chainName: this.CHAIN_CONFIG[chainId]?.name || 'Unknown',
          }));
          allTransactions.push(...txs);
        }
      });

      // Sort by timestamp descending
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      // Apply pagination
      const total = allTransactions.length;
      const paginatedTransactions = allTransactions.slice(offset, offset + limit);

      // Group by date
      const groupedByDate = this.groupByDate(paginatedTransactions);

      // Get statistics
      const stats = this.calculateStats(allTransactions);

      return {
        address,
        chains: chains.map(c => ({
          chainId: c,
          chainName: this.CHAIN_CONFIG[c]?.name || 'Unknown',
          transactionCount: allTransactions.filter(tx => tx.chainId === c).length,
        })),
        timeline: groupedByDate,
        statistics: stats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting cross-chain timeline: ${error.message}`);
      return this.getEmptyTimeline(address);
    }
  }

  /**
   * Get timeline for a specific chain
   */
  async getChainTimeline(address: string, chainId: string, options?: { limit?: number; offset?: number }) {
    if (!this.SUPPORTED_CHAINS.includes(chainId)) {
      return { error: 'Unsupported chain', supportedChains: this.SUPPORTED_CHAINS };
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    try {
      const transactions = await this.getChainTransactions(address, chainId);
      const total = transactions.length;
      const paginatedTransactions = transactions.slice(offset, offset + limit);
      const groupedByDate = this.groupByDate(paginatedTransactions);

      return {
        address,
        chainId,
        chainName: this.CHAIN_CONFIG[chainId]?.name || 'Unknown',
        timeline: groupedByDate,
        statistics: this.calculateStats(transactions),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting chain timeline: ${error.message}`);
      return { address, chainId, timeline: [], error: error.message };
    }
  }

  /**
   * Get activity summary across chains
   */
  async getActivitySummary(address: string, chainIds?: string[]) {
    const chains = chainIds?.filter(c => this.SUPPORTED_CHAINS.includes(c)) || this.SUPPORTED_CHAINS;

    try {
      const chainPromises = chains.map(chainId => this.getChainTransactions(address, chainId));
      const results = await Promise.allSettled(chainPromises);

      const summary = {
        address,
        totalTransactions: 0,
        totalGasSpentUSD: 0,
        chains: [] as any[],
        firstActivity: null as string | null,
        lastActivity: null as string | null,
        mostActiveChain: null as string | null,
        activityByChain: [] as any[],
      };

      let maxTxCount = 0;

      results.forEach((result, index) => {
        const chainId = chains[index];
        if (result.status === 'fulfilled') {
          const txs = result.value;
          const txCount = txs.length;
          const gasSpent = txs.reduce((sum: number, tx: any) => sum + (tx.gasValueUSD || 0), 0);

          summary.chains.push({
            chainId,
            chainName: this.CHAIN_CONFIG[chainId]?.name || 'Unknown',
            transactionCount: txCount,
            gasSpentUSD: gasSpent.toFixed(2),
          });

          summary.totalTransactions += txCount;
          summary.totalGasSpentUSD += gasSpent;

          if (txCount > maxTxCount) {
            maxTxCount = txCount;
            summary.mostActiveChain = this.CHAIN_CONFIG[chainId]?.name || chainId;
          }

          // Find first and last activity
          if (txs.length > 0) {
            const earliestTx = txs[txs.length - 1];
            const latestTx = txs[0];
            
            if (!summary.firstActivity || earliestTx.timestamp < new Date(summary.firstActivity).getTime()) {
              summary.firstActivity = earliestTx.date;
            }
            if (!summary.lastActivity || latestTx.timestamp > new Date(summary.lastActivity).getTime()) {
              summary.lastActivity = latestTx.date;
            }
          }
        }
      });

      // Sort activity by transaction count
      summary.activityByChain = summary.chains.sort((a, b) => b.transactionCount - a.transactionCount);

      return summary;
    } catch (error) {
      this.logger.error(`Error getting activity summary: ${error.message}`);
      return { address, error: error.message };
    }
  }

  /**
   * Get transaction details by hash and chain
   */
  async getTransactionDetails(hash: string, chainId: string) {
    if (!this.SUPPORTED_CHAINS.includes(chainId)) {
      return { error: 'Unsupported chain' };
    }

    try {
      const config = this.CHAIN_CONFIG[chainId];
      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
      const url = `${config.explorer}?module=proxy&action=eth_getTransactionBy&txhash=${hash}&apikey=${apiKey}`;

      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.result) {
        const tx = response.data.result;
        return {
          hash: tx.hash,
          chainId,
          chainName: config.name,
          from: tx.from,
          to: tx.to,
          value: (parseInt(tx.value, 16) / 1e18).toString(),
          gasPrice: (parseInt(tx.gasPrice, 16) / 1e9).toString(),
          gasLimit: parseInt(tx.gas, 16).toString(),
          nonce: parseInt(tx.nonce, 16),
          input: tx.input,
          blockNumber: parseInt(tx.blockNumber, 16),
          timestamp: null, // Would need block info for timestamp
        };
      }

      return { error: 'Transaction not found' };
    } catch (error) {
      this.logger.error(`Error getting transaction details: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains() {
    return Object.entries(this.CHAIN_CONFIG).map(([id, config]) => ({
      chainId: id,
      chainName: config.name,
    }));
  }

  // Private helper methods

  private async getChainTransactions(address: string, chainId: string): Promise<any[]> {
    try {
      const config = this.CHAIN_CONFIG[chainId];
      if (!config) return [];

      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
      const url = `${config.explorer}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`;

      const response = await axios.get(url, { timeout: 10000 });
      
      if (response.data.status === '1' && response.data.result) {
        return response.data.result.slice(0, 50).map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          valueUSD: (parseInt(tx.value) / 1e18 * 2500).toFixed(2), // Approximate
          gasUsed: tx.gasUsed,
          gasPrice: tx.gasPrice,
          gasValueUSD: ((parseInt(tx.gasUsed) * parseInt(tx.gasPrice)) / 1e18 * 2500).toFixed(2),
          timestamp: parseInt(tx.timeStamp) * 1000,
          date: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          blockNumber: tx.blockNumber,
          isError: tx.isError === '1',
          input: tx.input,
        }));
      }

      return [];
    } catch (error) {
      this.logger.error(`Error fetching transactions for chain ${chainId}: ${error.message}`);
      return [];
    }
  }

  private groupByDate(transactions: any[]): any[] {
    const grouped: Record<string, { date: string; transactions: any[]; totalValue: number; txCount: number }> = {};

    transactions.forEach(tx => {
      const date = tx.date.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { date, transactions: [], totalValue: 0, txCount: 0 };
      }
      grouped[date].transactions.push(tx);
      grouped[date].totalValue += parseFloat(tx.valueUSD || '0');
      grouped[date].txCount++;
    });

    return Object.values(grouped)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(day => ({
        ...day,
        totalValueUSD: day.totalValue.toFixed(2),
      }));
  }

  private calculateStats(transactions: any[]): any {
    if (!transactions.length) {
      return {
        totalTransactions: 0,
        totalValueUSD: '0',
        totalGasUSD: '0',
        averageTxValue: '0',
        averageGasUSD: '0',
      };
    }

    const totalValue = transactions.reduce((sum, tx) => sum + parseFloat(tx.valueUSD || '0'), 0);
    const totalGas = transactions.reduce((sum, tx) => sum + parseFloat(tx.gasValueUSD || '0'), 0);

    return {
      totalTransactions: transactions.length,
      totalValueUSD: totalValue.toFixed(2),
      totalGasUSD: totalGas.toFixed(2),
      averageTxValue: (totalValue / transactions.length).toFixed(2),
      averageGasUSD: (totalGas / transactions.length).toFixed(2),
    };
  }

  private getEmptyTimeline(address: string) {
    return {
      address,
      chains: [],
      timeline: [],
      statistics: {
        totalTransactions: 0,
        totalValueUSD: '0',
        totalGasUSD: '0',
      },
      pagination: {
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
      },
    };
  }
}
