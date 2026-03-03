import { Injectable } from '@nestjs/common';

export interface ChainInfo {
  chainId: number;
  name: string;
  symbol: string;
  nativeToken: string;
  supportsRelayer: boolean;
  supportsNativeGas: boolean;
  supportsERC20Gas: boolean;
  avgBlockTime: number;
  relayerFee: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  logoUrl: string;
}

export interface GasEstimate {
  nativeGas: {
    gasLimit: number;
    gasPrice: number;
    totalFee: string;
    totalFeeUsd: number;
  };
  erc20Gas: {
    token: string;
    gasLimit: number;
    gasPrice: number;
    totalFee: string;
    totalFeeUsd: number;
    approvalNeeded: boolean;
  };
  savings: {
    amount: string;
    percent: number;
    method: string;
  };
}

export interface RelayerInfo {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  supportedChains: number[];
  avgDeliveryTime: number;
  successRate: number;
}

@Injectable()
export class GasStationService {
  private readonly supportedChains: ChainInfo[] = [
    { chainId: 1, name: 'Ethereum', symbol: 'ETH', nativeToken: 'ETH', supportsRelayer: true, supportsNativeGas: true, supportsERC20Gas: true, avgBlockTime: 12, relayerFee: 0.003 },
    { chainId: 137, name: 'Polygon', symbol: 'MATIC', nativeToken: 'MATIC', supportsRelayer: true, supportsNativeGas: true, supportsERC20Gas: true, avgBlockTime: 2, relayerFee: 0.001 },
    { chainId: 42161, name: 'Arbitrum One', symbol: 'ETH', nativeToken: 'ETH', supportsRelayer: true, supportsNativeGas: true, supportsERC20Gas: true, avgBlockTime: 0.25, relayerFee: 0.002 },
    { chainId: 10, name: 'Optimism', symbol: 'ETH', nativeToken: 'ETH', supportsRelayer: true, supportsNativeGas: true, supportsERC20Gas: true, avgBlockTime: 2, relayerFee: 0.002 },
    { chainId: 56, name: 'BNB Chain', symbol: 'BNB', nativeToken: 'BNB', supportsRelayer: true, supportsNativeGas: true, supportsERC20Gas: true, avgBlockTime: 3, relayerFee: 0.001 },
    { chainId: 8453, name: 'Base', symbol: 'ETH', nativeToken: 'ETH', supportsRelayer: true, supportsNativeGas: true, supportsERC20Gas: true, avgBlockTime: 2, relayerFee: 0.001 },
    { chainId: 43114, name: 'Avalanche', symbol: 'AVAX', nativeToken: 'AVAX', supportsRelayer: true, supportsNativeGas: true, supportsERC20Gas: true, avgBlockTime: 2, relayerFee: 0.002 },
    { chainId: 11155111, name: 'Sepolia', symbol: 'ETH', nativeToken: 'ETH', supportsRelayer: false, supportsNativeGas: true, supportsERC20Gas: true, avgBlockTime: 12, relayerFee: 0 },
  ];

  private readonly gasTokens: Record<number, TokenInfo[]> = {
    1: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, price: 2450, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
      { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/9956/small/491d5694-57d8-4d72-8749-fcda3e9a9d30.jpg' },
    ],
    137: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'MATIC', name: 'Polygon', decimals: 18, price: 0.85, logoUrl: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png' },
      { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
      { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether', decimals: 6, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    ],
    42161: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, price: 2450, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
      { address: '0xAF88d065d77C12cC3992001a55185B3B643fAc91', symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
    ],
    10: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, price: 2450, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
      { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Bb85', symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
    ],
    56: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'BNB', name: 'BNB', decimals: 18, price: 580, logoUrl: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
      { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether', decimals: 18, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
    ],
    8453: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, price: 2450, logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
      { address: '0x833589fCD6eDb6E08f4c7C32D4a71B15930eB125', symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
    ],
    43114: [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'AVAX', name: 'Avalanche', decimals: 18, price: 38, logoUrl: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
      { address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', symbol: 'USDC', name: 'USD Coin', decimals: 6, price: 1, logoUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png' },
    ],
  };

  private readonly relayers: RelayerInfo[] = [
    { name: 'Gelato', status: 'online', supportedChains: [1, 137, 42161, 10, 56, 8453, 43114], avgDeliveryTime: 3.5, successRate: 99.2 },
    { name: 'Biconomy', status: 'online', supportedChains: [1, 137, 42161, 10, 8453], avgDeliveryTime: 4.2, successRate: 98.8 },
    { name: 'OpenOcean', status: 'online', supportedChains: [1, 137, 42161, 10, 56, 43114], avgDeliveryTime: 5.1, successRate: 97.5 },
    { name: 'Kernel', status: 'degraded', supportedChains: [1, 42161, 10], avgDeliveryTime: 6.8, successRate: 95.2 },
  ];

  private readonly txTypeGasLimits: Record<string, number> = {
    transfer: 21000,
    erc20_transfer: 65000,
    swap: 150000,
    nft_transfer: 85000,
    contract_deploy: 2000000,
    custom: 100000,
  };

  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
    };
  }

  getSupportedChains(feature?: string) {
    let chains = this.supportedChains;
    if (feature === 'relayer') {
      chains = chains.filter(c => c.supportsRelayer);
    } else if (feature === 'native') {
      chains = chains.filter(c => c.supportsNativeGas);
    } else if (feature === 'erc20') {
      chains = chains.filter(c => c.supportsERC20Gas);
    }
    return chains.map(c => ({
      chainId: c.chainId,
      name: c.name,
      symbol: c.symbol,
      supportsRelayer: c.supportsRelayer,
      avgBlockTime: c.avgBlockTime,
      relayerFee: c.relayerFee,
    }));
  }

  getSupportedTokens(chainId: number) {
    const tokens = this.gasTokens[chainId] || [];
    return tokens.map(t => ({
      address: t.address,
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals,
      price: t.price,
      logoUrl: t.logoUrl,
    }));
  }

  async estimateGas(dto: { chainId: number; tokenAddress: string; txType: string; gasLimit?: number }) {
    const chain = this.supportedChains.find(c => c.chainId === dto.chainId);
    if (!chain) {
      throw new Error(`Chain ${dto.chainId} not supported`);
    }

    const gasLimit = dto.gasLimit || this.txTypeGasLimits[dto.txType] || this.txTypeGasLimits.custom;
    const gasPrice = this.getMockGasPrice(dto.chainId);
    const nativeTotal = gasLimit * gasPrice;
    
    const chainInfo = this.supportedChains.find(c => c.chainId === dto.chainId);
    const nativePrice = this.getNativePrice(dto.chainId);
    const nativeTotalUsd = (nativeTotal / 1e18) * nativePrice;

    let erc20Token: TokenInfo | undefined;
    let erc20Total = 0;
    let erc20TotalUsd = 0;
    let approvalNeeded = false;

    if (dto.tokenAddress && dto.tokenAddress !== '0x0000000000000000000000000000000000000000') {
      const tokens = this.gasTokens[dto.chainId] || [];
      erc20Token = tokens.find(t => t.address.toLowerCase() === dto.tokenAddress.toLowerCase());
      if (erc20Token) {
        const relayerFee = chainInfo?.relayerFee || 0.001;
        const adjustedGasLimit = gasLimit * 1.2;
        erc20Total = adjustedGasLimit * gasPrice + (relayerFee * 1e18);
        erc20TotalUsd = (erc20Total / Math.pow(10, erc20Token.decimals)) * erc20Token.price;
        approvalNeeded = true;
      }
    }

    let savingsAmount = '0';
    let savingsPercent = 0;
    let savingsMethod = 'native';

    if (erc20TotalUsd > 0 && nativeTotalUsd > 0) {
      if (erc20TotalUsd < nativeTotalUsd) {
        savingsAmount = (nativeTotalUsd - erc20TotalUsd).toFixed(4);
        savingsPercent = ((nativeTotalUsd - erc20TotalUsd) / nativeTotalUsd) * 100;
        savingsMethod = 'erc20_with_relayer';
      } else {
        savingsAmount = (erc20TotalUsd - nativeTotalUsd).toFixed(4);
        savingsPercent = ((erc20TotalUsd - nativeTotalUsd) / erc20TotalUsd) * 100;
        savingsMethod = 'native';
      }
    }

    const result: GasEstimate = {
      nativeGas: {
        gasLimit,
        gasPrice,
        totalFee: nativeTotal.toString(),
        totalFeeUsd: nativeTotalUsd,
      },
      erc20Gas: erc20Token ? {
        token: erc20Token.symbol,
        gasLimit: Math.floor(gasLimit * 1.2),
        gasPrice,
        totalFee: erc20Total.toString(),
        totalFeeUsd: erc20TotalUsd,
        approvalNeeded,
      } : {
        token: 'N/A',
        gasLimit: 0,
        gasPrice: 0,
        totalFee: '0',
        totalFeeUsd: 0,
        approvalNeeded: false,
      },
      savings: {
        amount: savingsAmount,
        percent: parseFloat(savingsPercent.toFixed(2)),
        method: savingsMethod,
      },
    };

    return result;
  }

  async getTokenPrice(address: string, chainId: number) {
    const tokens = this.gasTokens[chainId] || [];
    const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
    if (!token) {
      return {
        address,
        chainId,
        price: null,
        error: 'Token not found',
      };
    }
    return {
      address: token.address,
      symbol: token.symbol,
      chainId,
      price: token.price,
      lastUpdate: new Date().toISOString(),
    };
  }

  async calculateRelayerFee(dto: { sourceChainId: number; destChainId: number; tokenAddress: string; gasLimit: number }) {
    const sourceChain = this.supportedChains.find(c => c.chainId === dto.sourceChainId);
    const destChain = this.supportedChains.find(c => c.chainId === dto.destChainId);

    if (!sourceChain || !destChain) {
      throw new Error('Unsupported chain');
    }

    const isCrossChain = dto.sourceChainId !== dto.destChainId;
    const baseFee = isCrossChain ? sourceChain.relayerFee * 2 : sourceChain.relayerFee;
    const gasFee = (dto.gasLimit * this.getMockGasPrice(dto.sourceChainId)) / 1e18;
    
    const tokens = this.gasTokens[dto.sourceChainId] || [];
    const token = tokens.find(t => t.address.toLowerCase() === dto.tokenAddress.toLowerCase());
    
    const totalFee = baseFee + gasFee;
    const totalFeeUsd = token ? totalFee * token.price : totalFee * this.getNativePrice(dto.sourceChainId);

    const availableRelayers = this.relayers.filter(r => 
      r.supportedChains.includes(dto.sourceChainId) && 
      r.supportedChains.includes(dto.destChainId) &&
      r.status === 'online'
    );

    return {
      sourceChain: sourceChain.name,
      destChain: destChain.name,
      isCrossChain,
      feeBreakdown: {
        baseFee: sourceChain.relayerFee,
        gasEstimate: gasFee,
        totalFee,
      },
      totalFeeUsd: parseFloat(totalFeeUsd.toFixed(4)),
      paymentToken: token ? token.symbol : sourceChain.symbol,
      recommendedRelayers: availableRelayers.map(r => ({
        name: r.name,
        avgDeliveryTime: r.avgDeliveryTime,
        successRate: r.successRate,
      })),
      estimatedTime: isCrossChain ? '30-120 seconds' : '10-30 seconds',
    };
  }

  async getGasSavings(chainId: number, txType: string) {
    const chain = this.supportedChains.find(c => c.chainId === chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const gasLimit = this.txTypeGasLimits[txType] || this.txTypeGasLimits.custom;
    const gasPrice = this.getMockGasPrice(chainId);
    const nativeTotal = gasLimit * gasPrice;
    const nativePrice = this.getNativePrice(chainId);
    const nativeTotalUsd = (nativeTotal / 1e18) * nativePrice;

    const tokens = this.gasTokens[chainId] || [];
    const comparisons = tokens.slice(0, 4).map(token => {
      const adjustedGasLimit = gasLimit * 1.2;
      const relayerFee = chain.relayerFee * 1e18;
      const erc20Total = adjustedGasLimit * gasPrice + relayerFee;
      const erc20TotalUsd = (erc20Total / Math.pow(10, token.decimals)) * token.price;
      const savings = nativeTotalUsd - erc20TotalUsd;
      
      return {
        token: token.symbol,
        nativeCost: nativeTotalUsd.toFixed(4),
        erc20Cost: erc20TotalUsd.toFixed(4),
        savings: savings.toFixed(4),
        savingsPercent: ((savings / nativeTotalUsd) * 100).toFixed(2),
        isCheaper: savings > 0,
      };
    });

    const bestOption = comparisons.reduce((best, current) => 
      parseFloat(current.savings) > parseFloat(best.savings) ? current : best
    , comparisons[0]);

    return {
      chainId,
      chainName: chain.name,
      txType,
      gasLimit,
      nativePrice: nativePrice,
      nativeCostUsd: nativeTotalUsd.toFixed(4),
      comparisons,
      recommendation: bestOption,
      tips: [
        'Use stablecoins for predictable gas costs',
        'Consider using relayers for cross-chain transactions',
        'Gas costs are higher during network congestion',
        'Approve tokens once to avoid repeated approval costs',
      ],
    };
  }

  async getRelayerStatus() {
    return this.relayers.map(r => ({
      name: r.name,
      status: r.status,
      supportedChains: r.supportedChains.length,
      avgDeliveryTime: r.avgDeliveryTime,
      successRate: r.successRate,
      healthScore: r.status === 'online' ? 100 : r.status === 'degraded' ? 70 : 0,
    }));
  }

  async getPaymentHistory(address: string) {
    const mockHistory = [
      {
        id: '1',
        address: address.toLowerCase(),
        chain: 'Ethereum',
        chainId: 1,
        token: 'USDC',
        amount: '0.50',
        amountUsd: 0.50,
        txHash: '0x1234567890abcdef',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
      },
      {
        id: '2',
        address: address.toLowerCase(),
        chain: 'Polygon',
        chainId: 137,
        token: 'USDT',
        amount: '0.25',
        amountUsd: 0.25,
        txHash: '0xabcdef1234567890',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed',
      },
    ];

    return {
      address: address.toLowerCase(),
      totalPayments: mockHistory.length,
      totalVolumeUsd: mockHistory.reduce((sum, h) => sum + h.amountUsd, 0).toFixed(2),
      history: mockHistory,
    };
  }

  async getStats() {
    return {
      totalTransactions: 12453,
      totalVolumeUsd: 285000,
      activeRelayers: this.relayers.filter(r => r.status === 'online').length,
      supportedChains: this.supportedChains.length,
      supportedTokens: Object.values(this.gasTokens).flat().length,
      avgGasSavings: '12.5%',
      popularChains: [
        { name: 'Ethereum', count: 4500 },
        { name: 'Polygon', count: 3200 },
        { name: 'Arbitrum', count: 2100 },
        { name: 'Optimism', count: 1500 },
      ],
      popularTokens: [
        { symbol: 'USDC', count: 5200 },
        { symbol: 'USDT', count: 3800 },
        { symbol: 'ETH', count: 2100 },
      ],
    };
  }

  private getMockGasPrice(chainId: number): number {
    const gasPrices: Record<number, number> = {
      1: 30e9,
      137: 50e9,
      42161: 0.1e9,
      10: 0.001e9,
      56: 3e9,
      8453: 0.001e9,
      43114: 25e9,
      11155111: 20e9,
    };
    return gasPrices[chainId] || 30e9;
  }

  private getNativePrice(chainId: number): number {
    const prices: Record<number, number> = {
      1: 2450,
      137: 0.85,
      42161: 2450,
      10: 2450,
      56: 580,
      8453: 2450,
      43114: 38,
      11155111: 2450,
    };
    return prices[chainId] || 100;
  }
}
