import { Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

export interface NftBridge {
  id: string;
  name: string;
  logo: string;
  supportedChains: string[];
  supportedNftStandards: string[];
  fee: number;
  feeType: 'fixed' | 'percentage';
  avgBridgeTime: string;
  status: 'operational' | 'degraded' | 'maintenance';
  securityScore: number;
  features: string[];
  description: string;
}

export interface BridgeQuote {
  bridgeId: string;
  fromChain: string;
  toChain: string;
  nftContract: string;
  tokenId: string;
  estimatedTime: string;
  estimatedFee: number;
  feeToken: string;
  steps: BridgeStep[];
}

export interface BridgeStep {
  step: number;
  description: string;
  action: string;
}

export interface NftBridgeStats {
  totalBridges: number;
  operationalBridges: number;
  avgFee: number;
  avgBridgeTime: string;
  chainsSupported: number;
  totalChains: number;
}

export interface BridgeRoute {
  fromChain: string;
  toChain: string;
  bridges: NftBridge[];
  bestOption: string;
  fastestOption: string;
  cheapestOption: string;
}

@Injectable()
@ApiTags('NFT Bridge')
export class Web3NftBridgeApiService {
  private bridges: NftBridge[] = [
    {
      id: 'layerzero',
      name: 'LayerZero',
      logo: 'https://assets.coingecko.com/coins/images/24571/small/LayerZero_Logo_-_Transparent.png',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base', 'solana'],
      supportedNftStandards: ['ERC721', 'ERC1155', 'SPL'],
      fee: 0.001,
      feeType: 'percentage',
      avgBridgeTime: '5-15 min',
      status: 'operational',
      securityScore: 92,
      features: ['Omnichain', 'Message Passing', 'Gas Efficiency'],
      description: 'Cross-chain messaging protocol supporting NFT bridging'
    },
    {
      id: 'wormhole',
      name: 'Wormhole',
      logo: 'https://assets.coingecko.com/coins/images/35087/small/womrhole_logo_full_color_rgb_2000px_72ppi_fb766ac85a.png',
      supportedChains: ['ethereum', 'solana', 'polygon', 'avalanche', 'bsc', 'arbitrum', 'optimism', 'base', 'fantom'],
      supportedNftStandards: ['ERC721', 'ERC1155', 'SPL'],
      fee: 0.0005,
      feeType: 'percentage',
      avgBridgeTime: '10-20 min',
      status: 'operational',
      securityScore: 88,
      features: ['Guardian Network', 'Multi-chain', 'Token Bridge'],
      description: 'General purpose cross-chain protocol with NFT support'
    },
    {
      id: 'stargate',
      name: 'Stargate',
      logo: 'https://assets.coingecko.com/coins/images/13013/small/stargate_logo.png',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base'],
      supportedNftStandards: ['ERC721'],
      fee: 0.002,
      feeType: 'percentage',
      avgBridgeTime: '3-10 min',
      status: 'operational',
      securityScore: 90,
      features: ['Unified Liquidity', 'Delta Algorithm', 'Fast Finality'],
      description: 'Omnichain liquidity protocol with NFT bridging capabilities'
    },
    {
      id: 'axelar',
      name: 'Axelar',
      logo: 'https://assets.coingecko.com/coins/images/19789/small/axelar.png',
      supportedChains: ['ethereum', 'polygon', 'avalanche', 'bsc', 'arbitrum', 'optimism', 'cosmos', 'celestia'],
      supportedNftStandards: ['ERC721', 'ERC1155'],
      fee: 0.0015,
      feeType: 'percentage',
      avgBridgeTime: '10-25 min',
      status: 'operational',
      securityScore: 89,
      features: ['Interchain', 'GMP', 'Decentralized Validators'],
      description: 'Inter-chain connectivity protocol with NFT support'
    },
    {
      id: 'celer',
      name: 'Celer cBridge',
      logo: 'https://assets.coingecko.com/coins/images/11249/small/celr.png',
      supportedChains: ['ethereum', 'polygon', 'avalanche', 'bsc', 'arbitrum', 'optimism', 'base'],
      supportedNftStandards: ['ERC721'],
      fee: 0.001,
      feeType: 'percentage',
      avgBridgeTime: '5-15 min',
      status: 'operational',
      securityScore: 85,
      features: ['State Guardian Network', 'Instant Confirmation', 'Low Fees'],
      description: 'Fast and low-cost cross-chain bridge for NFTs'
    },
    {
      id: 'hyphen',
      name: 'Hyphen',
      logo: 'https://assets.coingecko.com/coins/images/21023/small/Logo_-_Hyphen.png',
      supportedChains: ['ethereum', 'polygon', 'bsc'],
      supportedNftStandards: ['ERC721', 'ERC1155'],
      fee: 0.002,
      feeType: 'percentage',
      avgBridgeTime: '2-5 min',
      status: 'degraded',
      securityScore: 82,
      features: ['Instant Bridge', 'Liquidity Network', 'Low Slippage'],
      description: 'Instant NFT bridging with high liquidity'
    },
    {
      id: 'orbiter',
      name: 'Orbiter',
      logo: 'https://assets.coingecko.com/coins/images/25777/small/Orbiter.png',
      supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'zksync', 'starknet'],
      supportedNftStandards: ['ERC721'],
      fee: 0.001,
      feeType: 'fixed',
      avgBridgeTime: '1-3 min',
      status: 'operational',
      securityScore: 80,
      features: ['Cross-rollup', 'Maker-Breaker', 'Fastest Bridge'],
      description: 'Fastest cross-rollup bridge for NFTs'
    },
    {
      id: 'multichain',
      name: 'Multichain',
      logo: 'https://assets.coingecko.com/coins/images/15497/small/Multichain.png',
      supportedChains: ['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism', 'fantom'],
      supportedNftStandards: ['ERC721', 'ERC1155'],
      fee: 0.0015,
      feeType: 'percentage',
      avgBridgeTime: '10-30 min',
      status: 'maintenance',
      securityScore: 75,
      features: ['AnyCall', 'Router', 'Multi-chain'],
      description: 'Universal cross-chain router with NFT support'
    }
  ];

  private chains = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', logo: 'https://assets.coingecko.com/coins/279/small/ethereum.png' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', logo: 'https://assets.coingecko.com/coins/4713/small/matic-token-icon.png' },
    { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', logo: 'https://assets.coingecko.com/coins/16547/small/photo_2023-03-29_21.47.00.jpeg' },
    { id: 'optimism', name: 'Optimism', symbol: 'ETH', logo: 'https://assets.coingecko.com/coins/25244/small/Optimism.png' },
    { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', logo: 'https://assets.coingecko.com/coins/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
    { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', logo: 'https://assets.coingecko.com/coins/825/small/bnb-icon2_2x.png' },
    { id: 'base', name: 'Base', symbol: 'ETH', logo: 'https://assets.coingecko.com/coins/31024/small/base.png' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', logo: 'https://assets.coingecko.com/coins/4128/small/solana.png' },
    { id: 'zksync', name: 'zkSync Era', symbol: 'ETH', logo: 'https://assets.coingecko.com/coins/31900/small/logo_-6fde8e7582.png' },
    { id: 'starknet', name: 'Starknet', symbol: 'ETH', logo: 'https://assets.coingecko.com/coins/37533/small/starknet.png' },
    { id: 'fantom', name: 'Fantom', symbol: 'FTM', logo: 'https://assets.coingecko.com/coins/4001/small/Fantom_round.png' },
    { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', logo: 'https://assets.coingecko.com/coins/1481/small/cosmos_hub.png' }
  ];

  getAllBridges(): NftBridge[] {
    return this.bridges;
  }

  getBridgeById(id: string): NftBridge | undefined {
    return this.bridges.find(b => b.id === id);
  }

  getBridgesByChain(chain: string): NftBridge[] {
    return this.bridges.filter(b => b.supportedChains.includes(chain.toLowerCase()));
  }

  getRouteOptions(fromChain: string, toChain: string): BridgeRoute {
    const from = fromChain.toLowerCase();
    const to = toChain.toLowerCase();
    
    const availableBridges = this.bridges.filter(
      b => b.status === 'operational' && 
           b.supportedChains.includes(from) && 
           b.supportedChains.includes(to)
    );

    const sortedByFee = [...availableBridges].sort((a, b) => a.fee - b.fee);
    const sortedByTime = [...availableBridges].sort((a, b) => {
      const timeA = parseInt(a.avgBridgeTime.split('-')[0]);
      const timeB = parseInt(b.avgBridgeTime.split('-')[0]);
      return timeA - timeB;
    });
    const sortedBySecurity = [...availableBridges].sort((a, b) => b.securityScore - a.securityScore);

    return {
      fromChain: from,
      toChain: to,
      bridges: availableBridges,
      bestOption: sortedBySecurity[0]?.id || '',
      fastestOption: sortedByTime[0]?.id || '',
      cheapestOption: sortedByFee[0]?.id || ''
    };
  }

  getQuote(bridgeId: string, fromChain: string, toChain: string, nftContract: string, tokenId: string): BridgeQuote {
    const bridge = this.getBridgeById(bridgeId);
    if (!bridge) {
      throw new Error('Bridge not found');
    }

    const steps: BridgeStep[] = [
      { step: 1, description: 'Approve NFT for bridging', action: 'approve' },
      { step: 2, description: 'Lock NFT on source chain', action: 'lock' },
      { step: 3, description: 'Send message to destination chain', action: 'message' },
      { step: 4, description: 'Mint wrapped NFT on destination', action: 'mint' },
      { step: 5, description: 'Complete bridge', action: 'complete' }
    ];

    return {
      bridgeId,
      fromChain,
      toChain,
      nftContract,
      tokenId,
      estimatedTime: bridge.avgBridgeTime,
      estimatedFee: bridge.fee * 100,
      feeToken: 'NATIVE',
      steps
    };
  }

  getSupportedChains() {
    return this.chains;
  }

  getSupportedNftStandards(): string[] {
    return ['ERC721', 'ERC1155', 'SPL'];
  }

  getStats(): NftBridgeStats {
    const operational = this.bridges.filter(b => b.status === 'operational');
    const avgFee = operational.reduce((sum, b) => sum + b.fee, 0) / operational.length;
    const uniqueChains = new Set(operational.flatMap(b => b.supportedChains));

    return {
      totalBridges: this.bridges.length,
      operationalBridges: operational.length,
      avgFee: avgFee * 100,
      avgBridgeTime: '10-15 min',
      chainsSupported: uniqueChains.size,
      totalChains: this.chains.length
    };
  }

  getChainConnectivityMatrix(): Record<string, string[]> {
    const matrix: Record<string, string[]> = {};
    
    this.chains.forEach(chain => {
      const connectedChains: string[] = [];
      this.bridges
        .filter(b => b.status === 'operational' && b.supportedChains.includes(chain.id))
        .forEach(bridge => {
          bridge.supportedChains.forEach(c => {
            if (c !== chain.id && !connectedChains.includes(c)) {
              connectedChains.push(c);
            }
          });
        });
      matrix[chain.id] = connectedChains;
    });

    return matrix;
  }

  getBridgeComparison(bridgeIds: string[]): NftBridge[] {
    return bridgeIds.map(id => this.getBridgeById(id)).filter(Boolean) as NftBridge[];
  }

  getPopularRoutes(): { from: string; to: string; bridge: string; count: number }[] {
    return [
      { from: 'ethereum', to: 'polygon', bridge: 'layerzero', count: 12500 },
      { from: 'ethereum', to: 'arbitrum', bridge: 'wormhole', count: 9800 },
      { from: 'polygon', to: 'avalanche', bridge: 'axelar', count: 7500 },
      { from: 'bsc', to: 'ethereum', bridge: 'celer', count: 6200 },
      { from: 'ethereum', to: 'optimism', bridge: 'orbiter', count: 5800 },
      { from: 'arbitrum', to: 'base', bridge: 'stargate', count: 4500 },
      { from: 'solana', to: 'ethereum', bridge: 'wormhole', count: 3200 },
      { from: 'polygon', to: 'bsc', bridge: 'layerzero', count: 2800 }
    ];
  }

  searchBridges(query: string): NftBridge[] {
    const lowerQuery = query.toLowerCase();
    return this.bridges.filter(
      b => b.name.toLowerCase().includes(lowerQuery) ||
           b.description.toLowerCase().includes(lowerQuery) ||
           b.features.some(f => f.toLowerCase().includes(lowerQuery))
    );
  }
}
