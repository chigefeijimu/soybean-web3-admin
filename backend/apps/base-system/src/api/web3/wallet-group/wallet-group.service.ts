import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface WalletToken {
  symbol: string;
  name?: string;
  balance?: number;
  usdValue: number;
  chain: string;
}

interface WalletChainData {
  balanceUSD: number;
  txCount: number;
  tokens: WalletToken[];
  totalInUSD: number;
  totalOutUSD: number;
}

interface WalletData {
  address: string;
  chains: Record<string, WalletChainData>;
  totalBalanceUSD: number;
  transactionCount: number;
  tokens: WalletToken[];
  totalInUSD: number;
  totalOutUSD: number;
}

interface TokenSummary {
  symbol: string;
  count: number;
  totalUSD: number;
}

interface AnalysisResults {
  totalWallets: number;
  chains: string[];
  summary: {
    totalBalanceUSD: number;
    totalTransactions: number;
    uniqueTokens: number;
    commonTokens: TokenSummary[];
  };
  wallets: WalletData[];
  topHoldings: TokenSummary[];
  activityStats: {
    totalIn: number;
    totalOut: number;
    avgDailyTransactions: number;
  };
  riskAssessment: {
    concentrationRisk: string;
    volatilityScore: number;
  };
}

@Injectable()
export class WalletGroupService {
  private readonly rpcUrls: Record<string, string> = {
    eth: 'https://eth.llamarpc.com',
    polygon: 'https://polygon.llamarpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    bsc: 'https://bsc-dataseed.binance.org',
    base: 'https://mainnet.base.org',
    avalanche: 'https://api.avax.network/ext/bc/rpc',
  };

  private readonly chainIds: Record<string, number> = {
    eth: 1,
    polygon: 137,
    arbitrum: 42161,
    optimism: 10,
    bsc: 56,
    base: 8453,
    avalanche: 43114,
  };

  /**
   * Analyze a group of wallets
   */
  async analyzeGroup(addresses: string[], chains: string[] = ['eth']): Promise<AnalysisResults> {
    const results: AnalysisResults = {
      totalWallets: addresses.length,
      chains: chains,
      summary: {
        totalBalanceUSD: 0,
        totalTransactions: 0,
        uniqueTokens: 0,
        commonTokens: [],
      },
      wallets: [],
      topHoldings: [],
      activityStats: {
        totalIn: 0,
        totalOut: 0,
        avgDailyTransactions: 0,
      },
      riskAssessment: {
        concentrationRisk: 'low',
        volatilityScore: 0,
      },
    };

    for (const address of addresses) {
      try {
        const walletData = await this.getWalletData(address, chains);
        results.wallets.push(walletData);
        results.summary.totalBalanceUSD += walletData.totalBalanceUSD;
        results.summary.totalTransactions += walletData.transactionCount;
        results.activityStats.totalIn += walletData.totalInUSD;
        results.activityStats.totalOut += walletData.totalOutUSD;
      } catch (error) {
        console.error(`Error fetching data for ${address}:`, error);
      }
    }

    // Calculate unique tokens across all wallets
    const allTokens = new Map<string, TokenSummary>();
    for (const wallet of results.wallets) {
      for (const token of wallet.tokens) {
        if (allTokens.has(token.symbol)) {
          const existing = allTokens.get(token.symbol)!;
          existing.count += 1;
          existing.totalUSD += token.usdValue;
        } else {
          allTokens.set(token.symbol, {
            symbol: token.symbol,
            count: 1,
            totalUSD: token.usdValue,
          });
        }
      }
    }

    // Find common tokens (held by >50% of wallets)
    const threshold = Math.ceil(addresses.length * 0.5);
    results.summary.commonTokens = Array.from(allTokens.values())
      .filter(t => t.count >= threshold)
      .sort((a, b) => b.totalUSD - a.totalUSD);

    results.summary.uniqueTokens = allTokens.size;

    // Top holdings aggregation
    results.topHoldings = Array.from(allTokens.values())
      .sort((a, b) => b.totalUSD - a.totalUSD)
      .slice(0, 10);

    // Calculate concentration risk
    if (results.summary.totalBalanceUSD > 0 && results.wallets.length > 0) {
      const largestHolder = results.wallets.reduce((max, w) => 
        w.totalBalanceUSD > max.totalBalanceUSD ? w : max
      , results.wallets[0]);
      
      const concentration = largestHolder.totalBalanceUSD / results.summary.totalBalanceUSD;
      results.riskAssessment.concentrationRisk = concentration > 0.5 ? 'high' : concentration > 0.3 ? 'medium' : 'low';
    }

    // Calculate activity stats
    results.activityStats.avgDailyTransactions = results.summary.totalTransactions / 30;

    return results;
  }

  /**
   * Get wallet data for multiple chains
   */
  private async getWalletData(address: string, chains: string[]): Promise<WalletData> {
    const wallet: WalletData = {
      address,
      chains: {},
      totalBalanceUSD: 0,
      transactionCount: 0,
      tokens: [],
      totalInUSD: 0,
      totalOutUSD: 0,
    };

    for (const chain of chains) {
      try {
        const chainData = await this.getChainWalletData(address, chain);
        wallet.chains[chain] = chainData;
        wallet.totalBalanceUSD += chainData.balanceUSD;
        wallet.transactionCount += chainData.txCount;
        wallet.tokens.push(...chainData.tokens);
        wallet.totalInUSD += chainData.totalInUSD;
        wallet.totalOutUSD += chainData.totalOutUSD;
      } catch (error) {
        console.error(`Error fetching ${chain} data for ${address}:`, error);
      }
    }

    return wallet;
  }

  /**
   * Get wallet data for a specific chain
   */
  private async getChainWalletData(address: string, chain: string): Promise<WalletChainData> {
    const rpcUrl = this.rpcUrls[chain];

    if (!rpcUrl) {
      return { balanceUSD: 0, txCount: 0, tokens: [], totalInUSD: 0, totalOutUSD: 0 };
    }

    try {
      // Get ETH balance
      const balanceHex = await this.rpcCall(rpcUrl, {
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      const balanceWei = parseInt(balanceHex, 16);
      const balanceEth = balanceWei / 1e18;
      const ethPrice = await this.getTokenPrice('ethereum', chain);
      const balanceUSD = balanceEth * ethPrice;

      // Get transaction count
      const txCountHex = await this.rpcCall(rpcUrl, {
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
      });
      const txCount = parseInt(txCountHex, 16);

      // Simulate some token data (in production, would query token lists)
      const tokens = this.generateSampleTokens(chain, balanceUSD);

      // Simulate flow data
      const totalInUSD = balanceUSD * (Math.random() * 0.5 + 0.2);
      const totalOutUSD = balanceUSD * (Math.random() * 0.3 + 0.1);

      return {
        balanceUSD,
        txCount,
        tokens,
        totalInUSD,
        totalOutUSD,
      };
    } catch (error) {
      console.error(`Error fetching chain data:`, error);
      return { balanceUSD: 0, txCount: 0, tokens: [], totalInUSD: 0, totalOutUSD: 0 };
    }
  }

  /**
   * Make RPC call
   */
  private async rpcCall(url: string, payload: any): Promise<any> {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return response.data.result;
  }

  /**
   * Get token price
   */
  private async getTokenPrice(tokenId: string, _chain: string): Promise<number> {
    // Mock prices - in production, use CoinGecko API
    const prices: Record<string, number> = {
      ethereum: 2500,
      polygon: 0.85,
      'matic-network': 0.85,
      arbitrum: 1.1,
      optimism: 2.5,
      binancecoin: 580,
      'base-coin': 2.8,
      avalanche: 35,
    };
    return prices[tokenId] || 100;
  }

  /**
   * Generate sample tokens for demo
   */
  private generateSampleTokens(chain: string, totalBalanceUSD: number): WalletToken[] {
    const sampleTokens = [
      { symbol: chain === 'eth' ? 'ETH' : chain.toUpperCase(), name: 'Native Token', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { symbol: 'USDT', name: 'Tether', decimals: 6 },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    ];

    const tokens: WalletToken[] = [];
    const remaining = totalBalanceUSD;
    
    for (let i = 0; i < Math.min(4, sampleTokens.length); i++) {
      const allocation = i === 0 ? 0.6 : (remaining * 0.1) / (sampleTokens.length - 1);
      tokens.push({
        symbol: sampleTokens[i].symbol,
        name: sampleTokens[i].name,
        balance: allocation / 100,
        usdValue: allocation,
        chain,
      });
    }

    return tokens;
  }

  /**
   * Compare two wallet groups
   */
  async compareGroups(group1Addresses: string[], group2Addresses: string[]) {
    const group1 = await this.analyzeGroup(group1Addresses, ['eth', 'polygon', 'arbitrum']);
    const group2 = await this.analyzeGroup(group2Addresses, ['eth', 'polygon', 'arbitrum']);

    return {
      group1: {
        totalBalanceUSD: group1.summary.totalBalanceUSD,
        walletCount: group1.totalWallets,
        avgBalancePerWallet: group1.summary.totalBalanceUSD / group1.totalWallets,
      },
      group2: {
        totalBalanceUSD: group2.summary.totalBalanceUSD,
        walletCount: group2.totalWallets,
        avgBalancePerWallet: group2.summary.totalBalanceUSD / group2.totalWallets,
      },
      comparison: {
        balanceDifference: group1.summary.totalBalanceUSD - group2.summary.totalBalanceUSD,
        ratio: group2.summary.totalBalanceUSD > 0 
          ? group1.summary.totalBalanceUSD / group2.summary.totalBalanceUSD 
          : 0,
      },
    };
  }

  /**
   * Get group activity timeline
   */
  async getGroupActivityTimeline(addresses: string[], days: number = 30) {
    const timeline: Array<{
      date: string;
      transactions: number;
      volumeUSD: number;
      activeWallets: number;
    }> = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * dayMs);
      const dayActivity = {
        date: date.toISOString().split('T')[0],
        transactions: 0,
        volumeUSD: 0,
        activeWallets: 0,
      };

      // Simulate activity data
      for (const address of addresses) {
        if (Math.random() > 0.3) {
          dayActivity.activeWallets++;
          dayActivity.transactions += Math.floor(Math.random() * 10) + 1;
          dayActivity.volumeUSD += Math.random() * 50000;
        }
      }

      timeline.push(dayActivity);
    }

    return timeline;
  }
}
