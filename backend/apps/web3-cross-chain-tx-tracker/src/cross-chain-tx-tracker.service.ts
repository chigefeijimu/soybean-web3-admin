import { Injectable } from '@nestjs/common';

export interface CrossChainTx {
  id: string;
  hash: string;
  srcChain: string;
  destChain: string;
  bridge: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed' | 'completed';
  amount: string;
  token: string;
  sender: string;
  receiver: string;
  srcTxHash: string;
  destTxHash?: string;
  timestamp: number;
  updatedAt: number;
  confirmations: number;
  estimatedTime: number;
  actualTime?: number;
  gasUsed?: string;
  logs?: any[];
}

export interface BridgeQuote {
  bridge: string;
  srcChain: string;
  destChain: string;
  amount: string;
  tokenIn: string;
  tokenOut: string;
  estimatedReceived: string;
  estimatedTime: number;
  gasFee: string;
  bridgeFee: string;
  totalFee: string;
  route: string[];
}

export interface TxHistoryEntry {
  txHash: string;
  address: string;
  chain: string;
  timestamp: number;
  type: 'send' | 'receive' | 'swap' | 'bridge';
  status: 'pending' | 'confirmed' | 'failed';
  value: string;
  token: string;
  hash?: string;
}

@Injectable()
export class CrossChainTxTrackerService {
  private txCache = new Map<string, CrossChainTx>();
  private bridgeEndpoints: Record<string, { api: string; explorer: string }> = {
    layerzero: { api: 'https://api.layerzero-scan.com', explorer: 'https://layerzero-scan.com' },
    stargate: { api: 'https://stargate-api.herokuapp.com', explorer: 'https://stargate.finance' },
    across: { api: 'https://across-api.com', explorer: 'https://across.to' },
    hop: { api: 'https://hop-exchange.github.io/hop-api', explorer: 'https://hop.exchange' },
    celer: { api: 'https://cbridge-api.celer.network', explorer: 'https://cbridge.celer.network' },
    axelar: { api: 'https://api.axelar.network', explorer: 'https://axelar.network' },
    wormhole: { api: 'https://api.wormhole.io', explorer: 'https://wormhole.com' },
    orbiter: { api: 'https://openapi.orbiter.finance', explorer: 'https://orbiter.finance' },
  };

  private supportedChains = [
    'eth', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'avalanche', 
    'zkevm', 'zksync', 'linea', 'mantle', 'scroll', 'sei', 'solana'
  ];

  async getTransactionStatus(
    txHash: string,
    bridge: string,
    srcChain: string,
  ): Promise<CrossChainTx | null> {
    const cacheKey = `${bridge}-${srcChain}-${txHash}`;
    const cached = this.txCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Simulate fetching from bridge API
    const tx = await this.queryBridgeAPI(txHash, bridge, srcChain);
    if (tx) {
      this.txCache.set(cacheKey, tx);
    }
    return tx;
  }

  private async queryBridgeAPI(
    txHash: string,
    bridge: string,
    srcChain: string,
  ): Promise<CrossChainTx | null> {
    // Simulated response - in production would call actual bridge APIs
    const mockTx: CrossChainTx = {
      id: `${bridge}-${txHash}`,
      hash: txHash,
      srcChain,
      destChain: this.getDestinationChain(bridge),
      bridge,
      status: 'confirmed',
      amount: '1000',
      token: 'USDC',
      sender: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb1',
      receiver: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
      srcTxHash: txHash,
      destTxHash: `0x${Math.random().toString(16).slice(2)}${txHash.slice(2)}`,
      timestamp: Date.now() - 3600000,
      updatedAt: Date.now(),
      confirmations: 15,
      estimatedTime: 300,
      actualTime: 280,
    };

    return mockTx;
  }

  private getDestinationChain(bridge: string): string {
    const chains: Record<string, string> = {
      layerzero: 'arbitrum',
      stargate: 'polygon',
      across: 'optimism',
      hop: 'arbitrum',
      celer: 'bsc',
      axelar: 'avalanche',
      wormhole: 'solana',
      orbiter: 'base',
    };
    return chains[bridge] || 'polygon';
  }

  async getBridgeQuotes(
    srcChain: string,
    destChain: string,
    amount: string,
    token: string,
  ): Promise<BridgeQuote[]> {
    const bridges = ['layerzero', 'stargate', 'across', 'hop', 'celer', 'axelar', 'orbiter'];
    const quotes: BridgeQuote[] = [];

    for (const bridge of bridges) {
      const quote = await this.getBridgeQuote(bridge, srcChain, destChain, amount, token);
      if (quote) {
        quotes.push(quote);
      }
    }

    // Sort by total fee
    return quotes.sort((a, b) => parseFloat(a.totalFee) - parseFloat(b.totalFee));
  }

  private async getBridgeQuote(
    bridge: string,
    srcChain: string,
    destChain: string,
    amount: string,
    token: string,
  ): Promise<BridgeQuote | null> {
    const feePercent = { layerzero: 0.003, stargate: 0.002, across: 0.001, hop: 0.002, celer: 0.0025, axelar: 0.003, orbiter: 0.0015 };
    const bridgeFee = feePercent[bridge as keyof typeof feePercent] || 0.002;
    const amountNum = parseFloat(amount);
    const bridgeFeeAmount = amountNum * bridgeFee;
    const gasFee = (Math.random() * 10 + 5).toFixed(2);

    return {
      bridge,
      srcChain,
      destChain,
      amount,
      tokenIn: token,
      tokenOut: token,
      estimatedReceived: (amountNum - bridgeFeeAmount).toFixed(2),
      estimatedTime: Math.floor(Math.random() * 600 + 180),
      gasFee: `$${gasFee}`,
      bridgeFee: `${(bridgeFee * 100).toFixed(2)}%`,
      totalFee: (parseFloat(gasFee) + bridgeFeeAmount).toFixed(2),
      route: [srcChain, bridge, destChain],
    };
  }

  async getTransactionHistory(
    address: string,
    chains: string[] = [],
    limit: number = 50,
  ): Promise<TxHistoryEntry[]> {
    const history: TxHistoryEntry[] = [];
    const targetChains = chains.length > 0 ? chains : this.supportedChains;

    for (const chain of targetChains) {
      const txs = await this.fetchChainTransactions(address, chain, limit);
      history.push(...txs);
    }

    return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  private async fetchChainTransactions(
    address: string,
    chain: string,
    limit: number,
  ): Promise<TxHistoryEntry[]> {
    // Simulated - would call actual chain explorers
    const count = Math.min(limit, 5);
    const txs: TxHistoryEntry[] = [];

    for (let i = 0; i < count; i++) {
      const types: Array<'send' | 'receive' | 'swap' | 'bridge'> = ['send', 'receive', 'swap', 'bridge'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      txs.push({
        txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        address,
        chain,
        timestamp: Date.now() - Math.random() * 86400000 * 30,
        type,
        status: Math.random() > 0.1 ? 'confirmed' : 'pending',
        value: (Math.random() * 10000).toFixed(2),
        token: ['USDC', 'USDT', 'ETH', 'WBTC', 'DAI'][Math.floor(Math.random() * 5)],
      });
    }

    return txs;
  }

  async getSupportedBridges(): Promise<{ name: string; logo: string; chains: string[]; url: string }[]> {
    return [
      { name: 'LayerZero', logo: 'lz', chains: ['eth', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche', 'base'], url: 'https://layerzero.network' },
      { name: 'Stargate', logo: 'stg', chains: ['eth', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche', 'base'], url: 'https://stargate.finance' },
      { name: 'Across', logo: 'across', chains: ['eth', 'arbitrum', 'optimism', 'polygon', 'bsc'], url: 'https://across.to' },
      { name: 'Hop', logo: 'hop', chains: ['eth', 'arbitrum', 'optimism', 'polygon', 'gnosis'], url: 'https://hop.exchange' },
      { name: 'Celer cBridge', logo: 'celer', chains: ['eth', 'polygon', 'bsc', 'avalanche', 'arbitrum'], url: 'https://cbridge.celer.network' },
      { name: 'Axelar', logo: 'axl', chains: ['eth', 'polygon', 'avalanche', 'bsc', 'osmosis'], url: 'https://axelar.network' },
      { name: 'Wormhole', logo: 'wh', chains: ['eth', 'solana', 'polygon', 'avalanche', 'bsc', 'terra'], url: 'https://wormhole.com' },
      { name: 'Orbiter', logo: 'orb', chains: ['eth', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'zksync'], url: 'https://orbiter.finance' },
    ];
  }

  async getSupportedChains(): Promise<{ id: string; name: string; logo: string; type: string }[]> {
    return [
      { id: 'eth', name: 'Ethereum', logo: 'eth', type: 'evm' },
      { id: 'arbitrum', name: 'Arbitrum One', logo: 'arb', type: 'evm' },
      { id: 'optimism', name: 'Optimism', logo: 'op', type: 'evm' },
      { id: 'polygon', name: 'Polygon', logo: 'matic', type: 'evm' },
      { id: 'bsc', name: 'BNB Chain', logo: 'bnb', type: 'evm' },
      { id: 'base', name: 'Base', logo: 'base', type: 'evm' },
      { id: 'avalanche', name: 'Avalanche', logo: 'avax', type: 'evm' },
      { id: 'zkevm', name: 'zkEVM', logo: 'zkevm', type: 'evm' },
      { id: 'zksync', name: 'zkSync Era', logo: 'zksync', type: 'evm' },
      { id: 'linea', name: 'Linea', logo: 'linea', type: 'evm' },
      { id: 'mantle', name: 'Mantle', logo: 'mnt', type: 'evm' },
      { id: 'scroll', name: 'Scroll', logo: 'scroll', type: 'evm' },
      { id: 'solana', name: 'Solana', logo: 'sol', type: 'solana' },
    ];
  }

  async trackTransaction(
    hash: string,
    bridge: string,
    srcChain: string,
    destChain: string,
    sender: string,
    receiver: string,
    amount: string,
    token: string,
  ): Promise<CrossChainTx> {
    const tx: CrossChainTx = {
      id: `${bridge}-${hash}`,
      hash,
      srcChain,
      destChain,
      bridge,
      status: 'pending',
      amount,
      token,
      sender,
      receiver,
      srcTxHash: hash,
      timestamp: Date.now(),
      updatedAt: Date.now(),
      confirmations: 0,
      estimatedTime: 300,
    };

    const cacheKey = `${bridge}-${srcChain}-${hash}`;
    this.txCache.set(cacheKey, tx);

    return tx;
  }

  async getTrackedTransactions(address?: string): Promise<CrossChainTx[]> {
    const txs = Array.from(this.txCache.values());
    if (address) {
      return txs.filter(tx => tx.sender.toLowerCase() === address.toLowerCase() || tx.receiver.toLowerCase() === address.toLowerCase());
    }
    return txs;
  }

  async cancelTrackedTransaction(txId: string): Promise<boolean> {
    const tx = Array.from(this.txCache.values()).find(t => t.id === txId);
    if (tx && tx.status === 'pending') {
      tx.status = 'failed';
      tx.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  healthCheck(): { status: string; timestamp: number; bridges: number; chains: number } {
    return {
      status: 'healthy',
      timestamp: Date.now(),
      bridges: Object.keys(this.bridgeEndpoints).length,
      chains: this.supportedChains.length,
    };
  }

  getApiInfo(): { version: string; endpoints: number; features: string[] } {
    return {
      version: '1.0.0',
      endpoints: 8,
      features: [
        'Cross-chain transaction status tracking',
        'Bridge quote comparison',
        'Transaction history lookup',
        'Multi-chain support',
        'Real-time status updates',
      ],
    };
  }
}
