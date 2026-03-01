import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  tokenTransfers?: TokenTransfer[];
}

interface TokenTransfer {
  from: string;
  to: string;
  token: string;
  value: string;
  tokenSymbol: string;
}

interface InteractionStats {
  totalTransactions: number;
  totalValue: string;
  firstInteraction: number;
  lastInteraction: number;
  interactionFrequency: number;
  address1ToAddress2: number;
  address2ToAddress1: number;
  commonContracts: string[];
}

interface TimelineEvent {
  type: 'transfer' | 'swap' | 'contract_call' | 'token_transfer';
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  details?: any;
}

@Injectable()
export class AddressInteractionService {
  private readonly etherscanApiKeys: Record<number, string> = {
    1: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken',
    5: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken',
    137: process.env.POLYGONSCAN_API_KEY || 'YourApiKeyToken',
    80001: process.env.POLYGONSCAN_API_KEY || 'YourApiKeyToken',
    42161: process.env.ARBISCAN_API_KEY || 'YourApiKeyToken',
    421613: process.env.ARBISCAN_API_KEY || 'YourApiKeyToken',
  };

  private readonly baseUrls: Record<number, string> = {
    1: 'https://api.etherscan.io/api',
    5: 'https://api-goerli.etherscan.io/api',
    137: 'https://api.polygonscan.com/api',
    80001: 'https://api-mumbai.polygonscan.com/api',
    42161: 'https://api.arbiscan.io/api',
    421613: 'https://api-goerli.arbiscan.io/api',
  };

  constructor(private readonly httpService: HttpService) {}

  private getBaseUrl(chainId: number): string {
    return this.baseUrls[chainId] || this.baseUrls[1];
  }

  private getApiKey(chainId: number): string {
    return this.etherscanApiKeys[chainId] || this.etherscanApiKeys[1];
  }

  async analyzeInteraction(
    address1: string,
    address2: string,
    chainId: number,
  ): Promise<{
    relationship: string;
    confidence: number;
    details: InteractionStats;
    sharedContracts: string[];
  }> {
    const address1Lower = address1.toLowerCase();
    const address2Lower = address2.toLowerCase();

    // Get transactions for both addresses
    const [txs1, txs2] = await Promise.all([
      this.getTransactions(address1, chainId),
      this.getTransactions(address2, chainId),
    ]);

    // Find common transactions
    const commonTxs = this.findCommonTransactions(txs1, txs2, address1Lower, address2Lower);

    // Get unique contracts both addresses interacted with
    const contracts1 = new Set(txs1.map((tx) => tx.to).filter(Boolean));
    const contracts2 = new Set(txs2.map((tx) => tx.to).filter(Boolean));
    const sharedContracts = [...contracts1].filter((c) => contracts2.has(c));

    // Calculate relationship
    const stats = this.calculateStats(txs1, txs2, address1Lower, address2Lower);
    const relationship = this.determineRelationship(stats, commonTxs.length);
    const confidence = this.calculateConfidence(stats, commonTxs.length);

    return {
      relationship,
      confidence,
      details: stats,
      sharedContracts,
    };
  }

  async getCommonTransactions(
    address1: string,
    address2: string,
    chainId: number,
  ): Promise<Transaction[]> {
    const address1Lower = address1.toLowerCase();
    const address2Lower = address2.toLowerCase();

    const [txs1, txs2] = await Promise.all([
      this.getTransactions(address1, chainId),
      this.getTransactions(address2, chainId),
    ]);

    return this.findCommonTransactions(txs1, txs2, address1Lower, address2Lower);
  }

  async getInteractionTimeline(
    address1: string,
    address2: string,
    chainId: number,
    limit: number = 50,
  ): Promise<TimelineEvent[]> {
    const address1Lower = address1.toLowerCase();
    const address2Lower = address2.toLowerCase();

    const [txs1, txs2] = await Promise.all([
      this.getTransactions(address1, chainId),
      this.getTransactions(address2, chainId),
    ]);

    // Find common transactions and interactions
    const timeline: TimelineEvent[] = [];

    // Direct ETH transfers between the two addresses
    for (const tx of txs1) {
      if (tx.to?.toLowerCase() === address2Lower) {
        timeline.push({
          type: 'transfer',
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          timestamp: tx.timestamp,
          blockNumber: tx.blockNumber,
        });
      }
    }

    for (const tx of txs2) {
      if (tx.to?.toLowerCase() === address1Lower) {
        timeline.push({
          type: 'transfer',
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          timestamp: tx.timestamp,
          blockNumber: tx.blockNumber,
        });
      }
    }

    // Sort by timestamp descending and limit
    return timeline.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  async getInteractionStats(
    address1: string,
    address2: string,
    chainId: number,
  ): Promise<InteractionStats> {
    const address1Lower = address1.toLowerCase();
    const address2Lower = address2.toLowerCase();

    const [txs1, txs2] = await Promise.all([
      this.getTransactions(address1, chainId),
      this.getTransactions(address2, chainId),
    ]);

    return this.calculateStats(txs1, txs2, address1Lower, address2Lower);
  }

  private async getTransactions(address: string, chainId: number): Promise<Transaction[]> {
    try {
      const baseUrl = this.getBaseUrl(chainId);
      const apiKey = this.getApiKey(chainId);
      
      // Get normal transactions
      const url = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${apiKey}`;
      
      const response = await this.httpService.axiosRef.get(url);
      
      if (response.data.status === '1' && response.data.result) {
        return response.data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          timestamp: parseInt(tx.timeStamp) * 1000,
          blockNumber: parseInt(tx.blockNumber),
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  private findCommonTransactions(
    txs1: Transaction[],
    txs2: Transaction[],
    address1: string,
    address2: string,
  ): Transaction[] {
    const txHashes2 = new Set(txs2.map((tx) => tx.hash.toLowerCase()));
    
    return txs1.filter(
      (tx) =>
        txHashes2.has(tx.hash.toLowerCase()) ||
        tx.to?.toLowerCase() === address2 ||
        tx.from?.toLowerCase() === address2,
    );
  }

  private calculateStats(
    txs1: Transaction[],
    txs2: Transaction[],
    address1: string,
    address2: string,
  ): InteractionStats {
    let totalValue = 0;
    let address1ToAddress2 = 0;
    let address2ToAddress1 = 0;

    for (const tx of txs1) {
      if (tx.to?.toLowerCase() === address2) {
        totalValue += parseFloat(tx.value);
        address1ToAddress2++;
      }
    }

    for (const tx of txs2) {
      if (tx.to?.toLowerCase() === address1) {
        totalValue += parseFloat(tx.value);
        address2ToAddress1++;
      }
    }

    const allTxs = [...txs1, ...txs2];
    const timestamps = allTxs
      .map((tx) => tx.timestamp)
      .filter((t) => t > 0)
      .sort((a, b) => a - b);

    const contracts1 = new Set(txs1.map((tx) => tx.to).filter(Boolean));
    const contracts2 = new Set(txs2.map((tx) => tx.to).filter(Boolean));
    const commonContracts = [...contracts1].filter((c) => contracts2.has(c));

    const firstInteraction = timestamps[0] || 0;
    const lastInteraction = timestamps[timestamps.length - 1] || 0;
    const timeDiff = lastInteraction - firstInteraction;
    const interactionFrequency =
      timeDiff > 0 ? ((txs1.length + txs2.length) / timeDiff) * 86400000 : 0;

    return {
      totalTransactions: txs1.length + txs2.length,
      totalValue: totalValue.toString(),
      firstInteraction,
      lastInteraction,
      interactionFrequency,
      address1ToAddress2,
      address2ToAddress1,
      commonContracts,
    };
  }

  private determineRelationship(stats: InteractionStats, commonTxCount: number): string {
    const { address1ToAddress2, address2ToAddress1 } = stats;
    const totalDirect = address1ToAddress2 + address2ToAddress1;

    if (totalDirect === 0 && commonTxCount === 0) {
      return 'No direct interaction detected';
    }

    if (totalDirect > 10) {
      return 'Frequent interactor';
    }

    if (address1ToAddress2 > 0 && address2ToAddress1 === 0) {
      return 'One-way sender';
    }

    if (address2ToAddress1 > 0 && address1ToAddress2 === 0) {
      return 'One-way receiver';
    }

    if (address1ToAddress2 > 0 && address2ToAddress1 > 0) {
      return 'Bidirectional interactor';
    }

    return 'Indirect connection';
  }

  private calculateConfidence(stats: InteractionStats, commonTxCount: number): number {
    const { totalTransactions, commonContracts } = stats;
    
    let confidence = 0.3; // Base confidence

    if (totalTransactions > 100) confidence += 0.3;
    else if (totalTransactions > 50) confidence += 0.2;
    else if (totalTransactions > 20) confidence += 0.1;

    if (commonContracts.length > 5) confidence += 0.2;
    else if (commonContracts.length > 0) confidence += 0.1;

    if (commonTxCount > 0) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }
}
