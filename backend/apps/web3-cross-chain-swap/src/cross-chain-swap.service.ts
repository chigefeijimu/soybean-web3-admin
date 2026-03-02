import { Injectable } from '@nestjs/common';

export interface SwapQuote {
  bridge: string;
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  gasCost: string;
  estimatedTime: string;
  price: string;
  slippage: number;
}

export interface BridgeInfo {
  id: string;
  name: string;
  logo: string;
  supportedChains: string[];
  fee: number;
  avgTime: string;
}

@Injectable()
export class CrossChainSwapService {
  // 支持的跨链桥列表
  private bridges: BridgeInfo[] = [
    {
      id: 'layerzero',
      name: 'LayerZero',
      logo: 'https://cryptologos.cc/logos/layer-zero-logo.png',
      supportedChains: ['ETH', 'ARB', 'OPT', 'AVAX', 'POL', 'BASE'],
      fee: 0.003,
      avgTime: '5-15min',
    },
    {
      id: 'stargate',
      name: 'Stargate',
      logo: 'https://cryptologos.cc/logos/stargate-logo.png',
      supportedChains: ['ETH', 'ARB', 'OPT', 'AVAX', 'POL', 'BSC', 'BASE'],
      fee: 0.006,
      avgTime: '10-20min',
    },
    {
      id: 'across',
      name: 'Across',
      logo: 'https://cryptologos.cc/logos/across-protocol-logo.png',
      supportedChains: ['ETH', 'ARB', 'OPT', 'AVAX', 'POL', 'BASE'],
      fee: 0.002,
      avgTime: '3-10min',
    },
    {
      id: 'hop',
      name: 'Hop Protocol',
      logo: 'https://cryptologos.cc/logos/hop-protocol-logo.png',
      supportedChains: ['ETH', 'ARB', 'OPT', 'POL', 'BASE'],
      fee: 0.005,
      avgTime: '5-15min',
    },
    {
      id: 'celer',
      name: 'Celer cBridge',
      logo: 'https://cryptologos.cc/logos/celer-network-logo.png',
      supportedChains: ['ETH', 'ARB', 'OPT', 'AVAX', 'POL', 'BSC', 'BASE'],
      fee: 0.004,
      avgTime: '10-30min',
    },
    {
      id: 'axelar',
      name: 'Axelar',
      logo: 'https://cryptologos.cc/logos/axelar-logo.png',
      supportedChains: ['ETH', 'ARB', 'OPT', 'AVAX', 'POL', 'BASE'],
      fee: 0.005,
      avgTime: '10-25min',
    },
  ];

  // 模拟代币汇率 (实际应该从价格API获取)
  private tokenPrices: Record<string, number> = {
    ETH: 1850,
    WETH: 1850,
    USDC: 1,
    USDT: 1,
    DAI: 1,
    WBTC: 42000,
    MATIC: 0.85,
    POL: 0.85,
    AVAX: 35,
    BNB: 580,
    ARB: 1.1,
    OP: 2.5,
    LINK: 14,
    UNI: 7.5,
    AAVE: 220,
    SOL: 95,
    BASE: 0.02,
  };

  async getSupportedChains() {
    return [
      { id: 'eth', name: 'Ethereum', symbol: 'ETH', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
      { id: 'arb', name: 'Arbitrum', symbol: 'ARB', logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png' },
      { id: 'opt', name: 'Optimism', symbol: 'OP', logo: 'https://cryptologos.cc/logos/optimism-eth-logo.png' },
      { id: 'pol', name: 'Polygon', symbol: 'MATIC', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
      { id: 'avax', name: 'Avalanche', symbol: 'AVAX', logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
      { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
      { id: 'base', name: 'Base', symbol: 'ETH', logo: 'https://cryptologos.cc/logos/base-logo.png' },
    ];
  }

  async getSupportedTokens(chain: string) {
    const tokensByChain: Record<string, any[]> = {
      eth: [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
        { symbol: 'USDT', name: 'Tether', decimals: 6, address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
        { symbol: 'LINK', name: 'Chainlink', decimals: 18, address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
      ],
      arb: [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xaf88d065e77c8cc2239327c5edb3a43126475993' },
        { symbol: 'ARB', name: 'Arbitrum', decimals: 18, address: '0x912ce59144191c1204e64559fe8253a0e49e6548' },
      ],
      opt: [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85' },
        { symbol: 'OP', name: 'Optimism', decimals: 18, address: '0x4200000000000000000000000000000000000042' },
      ],
      pol: [
        { symbol: 'MATIC', name: 'Polygon', decimals: 18, address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x3c499c542cefee5a4d05c9b8e2a4f4d3e3e8e3f' },
        { symbol: 'USDT', name: 'Tether', decimals: 6, address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' },
      ],
      avax: [
        { symbol: 'AVAX', name: 'Avalanche', decimals: 18, address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xb97ef9ef8734c719154d1d8d3eae44e9623f9cd' },
      ],
      bsc: [
        { symbol: 'BNB', name: 'BNB', decimals: 18, address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDT', name: 'Tether', decimals: 18, address: '0x55d398326f99059ff775485246999027b3197955' },
      ],
      base: [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18, address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x833589fcd6edb6e21f45e637d5411c32cd8096e5' },
      ],
    };
    return tokensByChain[chain] || tokensByChain['eth'];
  }

  async getBridgeList() {
    return this.bridges;
  }

  async getQuotes(params: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    amount: string;
  }): Promise<SwapQuote[]> {
    const { fromChain, toChain, fromToken, toToken, amount } = params;
    const amountNum = parseFloat(amount);
    
    const fromPrice = this.tokenPrices[fromToken] || 100;
    const toPrice = this.tokenPrices[toToken] || 100;
    const baseRate = fromPrice / toPrice;
    
    const quotes: SwapQuote[] = [];

    for (const bridge of this.bridges) {
      // 检查桥是否支持两个链
      const fromChainSupported = bridge.supportedChains.includes(fromChain.toUpperCase()) || 
        bridge.supportedChains.includes(fromChain.toUpperCase().replace('POL', 'MATIC'));
      const toChainSupported = bridge.supportedChains.includes(toChain.toUpperCase()) ||
        bridge.supportedChains.includes(toChain.toUpperCase().replace('POL', 'MATIC'));
      
      if (!fromChainSupported || !toChainSupported) continue;

      // 模拟不同桥的汇率差异
      const rateVariation = 1 + (Math.random() - 0.5) * 0.02; // ±1%
      const rate = baseRate * rateVariation;
      
      const receivedAmount = (amountNum * rate * (1 - bridge.fee)).toFixed(6);
      const gasCostUSD = (Math.random() * 10 + 5).toFixed(2); // 5-15 USD
      
      quotes.push({
        bridge: bridge.name,
        fromChain: fromChain.toUpperCase(),
        toChain: toChain.toUpperCase(),
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: receivedAmount,
        gasCost: gasCostUSD,
        estimatedTime: bridge.avgTime,
        price: rate.toFixed(6),
        slippage: Math.random() * 2 + 0.5, // 0.5-2.5%
      });
    }

    // 按到账金额排序
    return quotes.sort((a, b) => parseFloat(b.toAmount) - parseFloat(a.toAmount));
  }

  async getSwapEstimate(params: {
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    amount: string;
    bridge?: string;
  }) {
    const quotes = await this.getQuotes(params);
    if (params.bridge) {
      return quotes.find(q => q.bridge.toLowerCase() === params.bridge?.toLowerCase()) || quotes[0];
    }
    return quotes[0];
  }

  async getPopularRoutes() {
    return [
      { from: 'eth', to: 'arb', fromToken: 'ETH', toToken: 'ETH', name: 'ETH → Arbitrum' },
      { from: 'eth', to: 'opt', fromToken: 'ETH', toToken: 'ETH', name: 'ETH → Optimism' },
      { from: 'eth', to: 'pol', fromToken: 'ETH', toToken: 'MATIC', name: 'ETH → Polygon' },
      { from: 'eth', to: 'avax', fromToken: 'ETH', toToken: 'AVAX', name: 'ETH → Avalanche' },
      { from: 'arb', to: 'eth', fromToken: 'ETH', toToken: 'ETH', name: 'Arbitrum → ETH' },
      { from: 'opt', to: 'eth', fromToken: 'ETH', toToken: 'ETH', name: 'Optimism → ETH' },
      { from: 'pol', to: 'eth', fromToken: 'MATIC', toToken: 'ETH', name: 'Polygon → ETH' },
      { from: 'eth', to: 'base', fromToken: 'ETH', toToken: 'ETH', name: 'ETH → Base' },
    ];
  }
}
