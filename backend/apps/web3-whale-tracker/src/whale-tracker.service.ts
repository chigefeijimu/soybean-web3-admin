import { Injectable } from '@nestjs/common';

export interface WhaleTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  fromLabel: string;
  to: string;
  toLabel: string;
  value: number;
  valueUsd: number;
  tokenSymbol: string;
  tokenAddress?: string;
  tokenDecimals: number;
  gasUsed: number;
  gasPrice: number;
  isLargeTransfer: boolean;
  isWhaleActivity: boolean;
}

export interface WhaleProfile {
  address: string;
  label: string;
  type: 'exchange' | 'whale' | 'defi' | 'dao' | 'contract' | 'unknown';
  totalReceived: number;
  totalReceivedUsd: number;
  totalSent: number;
  totalSentUsd: number;
  transactionCount: number;
  firstSeen: number;
  lastActive: number;
  avgTransactionSize: number;
  tokensHeld: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface WhaleAlert {
  id: string;
  type: 'large_transfer' | 'whale_movement' | 'exchange_flow' | 'defi_activity';
  transaction: WhaleTransaction;
  amount: number;
  amountUsd: number;
  timestamp: number;
  chain: string;
  read: boolean;
}

export interface WhaleStats {
  totalWhaleTransactions24h: number;
  totalVolume24h: number;
  avgTransactionSize: number;
  topNetworks: { chain: string; count: number; volume: number }[];
  topTokens: { symbol: string; count: number; volume: number }[];
  largestTransaction: WhaleTransaction | null;
  recentAlerts: WhaleAlert[];
}

export interface TrackedAddress {
  address: string;
  label: string;
  addedAt: number;
  notifyOnLargeTx: boolean;
  threshold: number;
}

@Injectable()
export class WhaleTrackerService {
  private readonly knownWhales = new Map<string, { label: string; type: string }>();
  private readonly knownExchanges = new Map<string, string>();
  private readonly trackedAddresses: TrackedAddress[] = [];
  private readonly whaleAlerts: WhaleAlert[] = [];

  constructor() {
    this.initializeKnownWhales();
    this.initializeExchanges();
  }

  private initializeKnownWhales() {
    // 知名鲸鱼地址
    const whales = [
      { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'Vitalik Buterin', type: 'whale' },
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', label: 'Vitalik (old)', type: 'whale' },
      { address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', label: 'Gavin Wood', type: 'whale' },
      { address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', label: 'Satoshi Nakamoto', type: 'whale' },
      { address: '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022', label: 'Lido Finance', type: 'defi' },
      { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', label: 'Uniswap V2 Router', type: 'defi' },
      { address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', label: 'Uniswap V3 Router', type: 'defi' },
      { address: '0x3fC91A3afd703E599F8F2aB0cbD9B3b1e04F1b1B', label: 'Uniswap V3 Position Manager', type: 'defi' },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', label: 'USDC', type: 'contract' },
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', label: 'DAI', type: 'contract' },
    ];
    whales.forEach(w => this.knownWhales.set(w.address.toLowerCase(), { label: w.label, type: w.type }));
  }

  private initializeExchanges() {
    const exchanges = [
      { address: '0xF977814e90dA44bFA03b6295A0616a897441aceC', name: 'Binance' },
      { address: '0x8EC5796f75c88F2ADDb99c833742450D22B1D6D2', name: 'Binance' },
      { address: '0x28C6c06298d514Db089934071355E5743bf21d61', name: 'Binance Cold Wallet' },
      { address: '0x4736fCD8B520a3890700d4e7E2F3b5a2F9bC8D9E', name: 'Coinbase' },
      { address: '0xA9D1e08C7793af67d9e1a2C97e0a29a8e8b3ca1d', name: 'Kraken' },
      { address: '0x21a31Ee1af58C51C0d66cf54a7E2D54d6e2b7E8b', name: 'Binance' },
      { address: '0x0655D2F3E5a1b9bEb3E4c7E3a6E4B3a5D8E7F1C2', name: 'Bybit' },
      { address: '0x0997dD1E57C3f5Db4F4F7E17e20Da7a5E8E3c9b7', name: 'OKX' },
    ];
    exchanges.forEach(e => this.knownExchanges.set(e.address.toLowerCase(), e.name));
  }

  getKnownWhaleInfo(address: string): { label: string; type: string } | null {
    return this.knownWhales.get(address.toLowerCase()) || null;
  }

  getExchangeName(address: string): string | null {
    return this.knownExchanges.get(address.toLowerCase()) || null;
  }

  generateWhaleTransactions(count: number = 50): WhaleTransaction[] {
    const transactions: WhaleTransaction[] = [];
    const tokens = [
      { symbol: 'ETH', address: '', decimals: 18, price: 2845 },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, price: 1 },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, price: 1 },
      { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, price: 1 },
      { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, price: 62500 },
      { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, price: 14.5 },
      { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, price: 7.2 },
      { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, price: 285 },
    ];

    const whaleAddresses = Array.from(this.knownWhales.keys());
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const valueRaw = Math.random() * 1000000 + 1000;
      const valueUsd = valueRaw * token.price;
      const isLargeTransfer = valueUsd > 10000;
      
      let fromAddr = whaleAddresses[Math.floor(Math.random() * whaleAddresses.length)];
      let toAddr = whaleAddresses[Math.floor(Math.random() * whaleAddresses.length)];
      while (fromAddr === toAddr) {
        toAddr = whaleAddresses[Math.floor(Math.random() * whaleAddresses.length)];
      }

      const fromInfo = this.knownWhales.get(fromAddr);
      const toInfo = this.knownWhales.get(toAddr);
      const fromExchange = this.getExchangeName(fromAddr);
      const toExchange = this.getExchangeName(toAddr);

      const tx: WhaleTransaction = {
        hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        blockNumber: 19000000 - i * 100 + Math.floor(Math.random() * 100),
        timestamp: now - i * 3600000 * Math.random() * 24,
        from: fromAddr,
        fromLabel: fromExchange || fromInfo?.label || 'Unknown',
        to: toAddr,
        toLabel: toExchange || toInfo?.label || 'Unknown',
        value: valueRaw,
        valueUsd: valueUsd,
        tokenSymbol: token.symbol,
        tokenAddress: token.address,
        tokenDecimals: token.decimals,
        gasUsed: 21000 + Math.floor(Math.random() * 150000),
        gasPrice: Math.floor(Math.random() * 50 + 20) * 1e9,
        isLargeTransfer,
        isWhaleActivity: isLargeTransfer || (fromInfo?.type === 'whale') || (toInfo?.type === 'whale'),
      };

      transactions.push(tx);
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  getWhaleStats(): WhaleStats {
    const transactions = this.generateWhaleTransactions(100);
    const largeTxs = transactions.filter(t => t.isLargeTransfer);
    const totalVolume = largeTxs.reduce((sum, t) => sum + t.valueUsd, 0);
    const avgSize = largeTxs.length > 0 ? totalVolume / largeTxs.length : 0;

    // Generate alerts
    const alerts: WhaleAlert[] = largeTxs.slice(0, 10).map((t, idx) => ({
      id: `alert-${idx}`,
      type: this.getAlertType(t),
      transaction: t,
      amount: t.value,
      amountUsd: t.valueUsd,
      timestamp: t.timestamp,
      chain: 'Ethereum',
      read: false,
    }));

    return {
      totalWhaleTransactions24h: largeTxs.length,
      totalVolume24h: totalVolume,
      avgTransactionSize: avgSize,
      topNetworks: [
        { chain: 'Ethereum', count: largeTxs.length, volume: totalVolume },
      ],
      topTokens: [
        { symbol: 'ETH', count: largeTxs.filter(t => t.tokenSymbol === 'ETH').length, volume: largeTxs.filter(t => t.tokenSymbol === 'ETH').reduce((s, t) => s + t.valueUsd, 0) },
        { symbol: 'USDC', count: largeTxs.filter(t => t.tokenSymbol === 'USDC').length, volume: largeTxs.filter(t => t.tokenSymbol === 'USDC').reduce((s, t) => s + t.valueUsd, 0) },
        { symbol: 'USDT', count: largeTxs.filter(t => t.tokenSymbol === 'USDT').length, volume: largeTxs.filter(t => t.tokenSymbol === 'USDT').reduce((s, t) => s + t.valueUsd, 0) },
      ],
      largestTransaction: largeTxs[0] || null,
      recentAlerts: alerts,
    };
  }

  private getAlertType(tx: WhaleTransaction): 'large_transfer' | 'whale_movement' | 'exchange_flow' | 'defi_activity' {
    const fromInfo = this.knownWhales.get(tx.from.toLowerCase());
    const toInfo = this.knownWhales.get(tx.to.toLowerCase());
    const fromExchange = this.getExchangeName(tx.from);
    const toExchange = this.getExchangeName(tx.to);

    if (fromExchange || toExchange) return 'exchange_flow';
    if (fromInfo?.type === 'defi' || toInfo?.type === 'defi') return 'defi_activity';
    if (fromInfo?.type === 'whale' || toInfo?.type === 'whale') return 'whale_movement';
    return 'large_transfer';
  }

  getWhaleProfiles(): WhaleProfile[] {
    const profiles: WhaleProfile[] = [];
    const addresses = Array.from(this.knownWhales.entries());

    addresses.forEach(([addr, info]) => {
      const txCount = Math.floor(Math.random() * 5000) + 100;
      const avgSize = Math.random() * 10 + 1;

      profiles.push({
        address: addr,
        label: info.label,
        type: info.type as any,
        totalReceived: avgSize * txCount * 1000,
        totalReceivedUsd: avgSize * txCount * 1000 * 2845,
        totalSent: avgSize * txCount * 900,
        totalSentUsd: avgSize * txCount * 900 * 2845,
        transactionCount: txCount,
        firstSeen: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
        lastActive: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        avgTransactionSize: avgSize,
        tokensHeld: Math.floor(Math.random() * 20) + 1,
        riskLevel: info.type === 'whale' ? 'medium' : 'low',
      });
    });

    return profiles.sort((a, b) => b.totalReceivedUsd - a.totalReceivedUsd);
  }

  getTrackedAddresses(): TrackedAddress[] {
    return this.trackedAddresses;
  }

  addTrackedAddress(address: string, label: string, threshold: number = 10000): TrackedAddress {
    const existing = this.trackedAddresses.find(a => a.address.toLowerCase() === address.toLowerCase());
    if (existing) return existing;

    const tracked: TrackedAddress = {
      address,
      label,
      addedAt: Date.now(),
      notifyOnLargeTx: true,
      threshold,
    };
    this.trackedAddresses.push(tracked);
    return tracked;
  }

  removeTrackedAddress(address: string): boolean {
    const idx = this.trackedAddresses.findIndex(a => a.address.toLowerCase() === address.toLowerCase());
    if (idx >= 0) {
      this.trackedAddresses.splice(idx, 1);
      return true;
    }
    return false;
  }

  searchWhales(query: string): WhaleTransaction[] {
    const txs = this.generateWhaleTransactions(100);
    const q = query.toLowerCase();
    return txs.filter(t => 
      t.from.toLowerCase().includes(q) ||
      t.to.toLowerCase().includes(q) ||
      t.fromLabel.toLowerCase().includes(q) ||
      t.toLabel.toLowerCase().includes(q) ||
      t.hash.toLowerCase().includes(q)
    );
  }

  getTransactionsByAddress(address: string): WhaleTransaction[] {
    const txs = this.generateWhaleTransactions(200);
    return txs.filter(t => 
      t.from.toLowerCase() === address.toLowerCase() ||
      t.to.toLowerCase() === address.toLowerCase()
    ).sort((a, b) => b.timestamp - a.timestamp);
  }

  getAlerts(limit: number = 20): WhaleAlert[] {
    const transactions = this.generateWhaleTransactions(50);
    const largeTxs = transactions.filter(t => t.isLargeTransfer);
    
    return largeTxs.slice(0, limit).map((t, idx) => ({
      id: `alert-${Date.now()}-${idx}`,
      type: this.getAlertType(t),
      transaction: t,
      amount: t.value,
      amountUsd: t.valueUsd,
      timestamp: t.timestamp,
      chain: 'Ethereum',
      read: false,
    }));
  }

  getNetworkWhaleActivity(chainId: number = 1): { time: string; volume: number; count: number }[] {
    const data: { time: string; volume: number; count: number }[] = [];
    const now = Date.now();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now - i * 3600000);
      data.push({
        time: `${hour.getHours()}:00`,
        volume: Math.random() * 500000000 + 100000000,
        count: Math.floor(Math.random() * 500) + 100,
      });
    }
    
    return data;
  }

  getTopWhalesByVolume(limit: number = 10): { address: string; label: string; volume24h: number; txCount: number }[] {
    const addresses = Array.from(this.knownWhales.entries());
    return addresses.slice(0, limit).map(([addr, info]) => ({
      address: addr,
      label: info.label,
      volume24h: Math.random() * 100000000 + 10000000,
      txCount: Math.floor(Math.random() * 200) + 50,
    })).sort((a, b) => b.volume24h - a.volume24h);
  }
}
