import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface WalletBalance {
  chain: string;
  chainId: number;
  address: string;
  nativeBalance: string;
  nativeValueUSD: number;
  tokens: TokenBalance[];
  totalValueUSD: number;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
  valueUSD: number;
  logoUrl?: string;
}

export interface CrossChainTransfer {
  fromChain: string;
  toChain: string;
  fromAddress: string;
  toAddress: string;
  token: string;
  amount: string;
  bridge: string;
  estimatedTime: string;
  estimatedFee: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
}

export interface ChainInfo {
  chain: string;
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorer: string;
  nativeToken: string;
  color: string;
}

@Injectable()
export class CrossChainWalletService {
  private readonly supportedChains: ChainInfo[] = [
    { chain: 'ethereum', chainId: 1, name: 'Ethereum', symbol: 'ETH', rpcUrl: 'https://eth.llamarpc.com', explorer: 'https://etherscan.io', nativeToken: 'ETH', color: '#627EEA' },
    { chain: 'polygon', chainId: 137, name: 'Polygon', symbol: 'MATIC', rpcUrl: 'https://polygon.llamarpc.com', explorer: 'https://polygonscan.com', nativeToken: 'MATIC', color: '#8247E5' },
    { chain: 'arbitrum', chainId: 42161, name: 'Arbitrum One', symbol: 'ETH', rpcUrl: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io', nativeToken: 'ETH', color: '#28A0F0' },
    { chain: 'optimism', chainId: 10, name: 'Optimism', symbol: 'ETH', rpcUrl: 'https://mainnet.optimism.io', explorer: 'https://optimistic.etherscan.io', nativeToken: 'ETH', color: '#FF0420' },
    { chain: 'bsc', chainId: 56, name: 'BNB Chain', symbol: 'BNB', rpcUrl: 'https://bsc-dataseed.binance.org', explorer: 'https://bscscan.com', nativeToken: 'BNB', color: '#F3BA2F' },
    { chain: 'avalanche', chainId: 43114, name: 'Avalanche', symbol: 'AVAX', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', explorer: 'https://snowtrace.io', nativeToken: 'AVAX', color: '#E84142' },
    { chain: 'base', chainId: 8453, name: 'Base', symbol: 'ETH', rpcUrl: 'https://mainnet.base.org', explorer: 'https://basescan.org', nativeToken: 'ETH', color: '#0052FF' },
  ];

  private readonly bridgeProviders = [
    { name: 'LayerZero', logo: '🛸' },
    { name: 'Stargate', logo: '⭐' },
    { name: 'Across', logo: '🔄' },
    { name: 'Hop', logo: '🐰' },
    { name: 'Orbiter', logo: '🌏' },
    { name: 'Axelar', logo: '🔗' },
  ];

  constructor(private readonly httpService: HttpService) {}

  async getSupportedChains(): Promise<ChainInfo[]> {
    return this.supportedChains;
  }

  async getWalletBalances(address: string, chains?: string[]): Promise<WalletBalance[]> {
    const targetChains = chains?.length 
      ? this.supportedChains.filter(c => chains.includes(c.chain))
      : this.supportedChains;

    const balances: WalletBalance[] = [];

    for (const chain of targetChains) {
      try {
        const balance = await this.getChainBalance(address, chain);
        balances.push(balance);
      } catch (error) {
        console.error(`Failed to get balance for ${chain.chain}:`, error);
      }
    }

    return balances;
  }

  private async getChainBalance(address: string, chain: ChainInfo): Promise<WalletBalance> {
    // Mock data for demonstration - in production, use actual RPC calls
    const mockNativeBalances: Record<string, string> = {
      ethereum: '1.245',
      polygon: '4500',
      arbitrum: '0.85',
      optimism: '0.32',
      bsc: '2.1',
      avalanche: '45',
      base: '0.65',
    };

    const mockTokens: Record<string, TokenBalance[]> = {
      ethereum: [
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', balance: '5000', decimals: 6, valueUSD: 5000, logoUrl: '' },
        { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', balance: '3000', decimals: 6, valueUSD: 3000, logoUrl: '' },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', balance: '0.5', decimals: 8, valueUSD: 25000, logoUrl: '' },
      ],
      polygon: [
        { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', balance: '10000', decimals: 6, valueUSD: 10000, logoUrl: '' },
        { symbol: 'QUICK', name: 'QuickSwap', address: '0xb5C064F955D8e7F38fe0460C556a72987494EE17', balance: '50', decimals: 18, valueUSD: 4500, logoUrl: '' },
      ],
      arbitrum: [
        { symbol: 'USDC', name: 'USD Coin', address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', balance: '8000', decimals: 6, valueUSD: 8000, logoUrl: '' },
        { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', balance: '2500', decimals: 18, valueUSD: 2750, logoUrl: '' },
      ],
      optimism: [
        { symbol: 'USDC', name: 'USD Coin', address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', balance: '6000', decimals: 6, valueUSD: 6000, logoUrl: '' },
      ],
      bsc: [
        { symbol: 'CAKE', name: 'PancakeSwap', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', balance: '500', decimals: 18, valueUSD: 2500, logoUrl: '' },
        { symbol: 'BNB', name: 'BNB', address: '', balance: '2.1', decimals: 18, valueUSD: 630, logoUrl: '' },
      ],
      avalanche: [
        { symbol: 'JOE', name: 'Trader Joe', address: '0x6e84a6216eA6dA2Cfc6E2a0965C909E84F99606A', balance: '10000', decimals: 18, valueUSD: 4000, logoUrl: '' },
      ],
      base: [
        { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', balance: '3500', decimals: 6, valueUSD: 3500, logoUrl: '' },
      ],
    };

    const nativeBalance = mockNativeBalances[chain.chain] || '0';
    const nativeValueUSD = this.estimateNativeValue(chain.chain, parseFloat(nativeBalance));
    const tokens = mockTokens[chain.chain] || [];
    const tokensValueUSD = tokens.reduce((sum, t) => sum + t.valueUSD, 0);

    return {
      chain: chain.chain,
      chainId: chain.chainId,
      address,
      nativeBalance,
      nativeValueUSD,
      tokens,
      totalValueUSD: nativeValueUSD + tokensValueUSD,
    };
  }

  private estimateNativeValue(chain: string, amount: number): number {
    const prices: Record<string, number> = {
      ethereum: 2500,
      polygon: 0.85,
      arbitrum: 2500,
      optimism: 2500,
      bsc: 300,
      avalanche: 35,
      base: 2500,
    };
    return amount * (prices[chain] || 0);
  }

  async getCrossChainTransferQuote(
    fromChain: string,
    toChain: string,
    token: string,
    amount: string,
  ): Promise<CrossChainTransfer[]> {
    const quotes: CrossChainTransfer[] = [];
    const amountNum = parseFloat(amount);

    for (const bridge of this.bridgeProviders) {
      const mockFee = (amountNum * 0.003).toFixed(2);
      const mockTime = ['2min', '5min', '10min', '15min'][Math.floor(Math.random() * 4)];

      quotes.push({
        fromChain,
        toChain,
        fromAddress: '',
        toAddress: '',
        token,
        amount,
        bridge: bridge.name,
        estimatedTime: mockTime,
        estimatedFee: mockFee,
        status: 'pending',
      });
    }

    return quotes.sort((a, b) => parseFloat(a.estimatedFee) - parseFloat(b.estimatedFee));
  }

  async getTotalPortfolioValue(address: string): Promise<{
    totalValueUSD: number;
    chainDistribution: { chain: string; valueUSD: number; percentage: number }[];
    tokenDistribution: { symbol: string; valueUSD: number; percentage: number }[];
  }> {
    const balances = await this.getWalletBalances(address);
    
    const totalValueUSD = balances.reduce((sum, b) => sum + b.totalValueUSD, 0);
    
    const chainDistribution = balances.map(b => ({
      chain: b.chain,
      valueUSD: b.totalValueUSD,
      percentage: (b.totalValueUSD / totalValueUSD) * 100,
    })).filter(c => c.valueUSD > 0);

    const tokenMap = new Map<string, number>();
    for (const balance of balances) {
      for (const token of balance.tokens) {
        const current = tokenMap.get(token.symbol) || 0;
        tokenMap.set(token.symbol, current + token.valueUSD);
      }
      // Add native token
      if (balance.nativeValueUSD > 0) {
        const current = tokenMap.get(balance.chain.toUpperCase()) || 0;
        tokenMap.set(balance.chain.toUpperCase(), current + balance.nativeValueUSD);
      }
    }

    const tokenDistribution = Array.from(tokenMap.entries())
      .map(([symbol, valueUSD]) => ({
        symbol,
        valueUSD,
        percentage: (valueUSD / totalValueUSD) * 100,
      }))
      .sort((a, b) => b.valueUSD - a.valueUSD);

    return {
      totalValueUSD,
      chainDistribution,
      tokenDistribution,
    };
  }

  async searchWalletsByBalance(minValue: number, chains?: string[]): Promise<{
    wallets: { address: string; totalValueUSD: number }[];
  }> {
    // Generate mock whale wallets for demonstration
    const mockWallets = [
      { address: '0x8ba1f109551bD432803012645Hc136E7aF4Bf0', totalValueUSD: 1250000 },
      { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', totalValueUSD: 890000 },
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aEC9B', totalValueUSD: 750000 },
      { address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', totalValueUSD: 620000 },
      { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', totalValueUSD: 480000 },
    ];

    return {
      wallets: mockWallets.filter(w => w.totalValueUSD >= minValue),
    };
  }
}
