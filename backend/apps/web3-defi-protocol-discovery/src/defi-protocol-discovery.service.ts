import { Injectable } from '@nestjs/common';

export interface UserPreferences {
  riskTolerance: 'low' | 'medium' | 'high';
  investmentGoal: 'yield_farming' | 'lending' | 'staking' | 'liquidity' | 'arbitrage' | 'balanced';
  preferredChains: string[];
  investmentAmount: number; // in USD
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface ProtocolRecommendation {
  protocol: string;
  category: string;
  chain: string;
  tvl: number;
  apy: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  matchScore: number;
  reasons: string[];
  features: string[];
  website: string;
  documentation: string;
}

export interface DiscoveryResponse {
  recommendations: ProtocolRecommendation[];
  totalFound: number;
  filters: {
    riskTolerance: string;
    investmentGoal: string;
    chains: string[];
  };
  insights: string[];
}

@Injectable()
export class DefiProtocolDiscoveryService {
  private readonly protocolDatabase = [
    // Lending Protocols
    {
      protocol: 'Aave',
      category: 'lending',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'],
      tvl: 15000000000,
      apyRanges: { low: 3, high: 8 },
      riskScore: 25,
      features: ['Variable rates', 'Flash loans', 'Collateral swap', 'Credit delegation'],
      website: 'https://aave.com',
      documentation: 'https://docs.aave.com',
    },
    {
      protocol: 'Compound',
      category: 'lending',
      chains: ['ethereum', 'polygon', 'arbitrum', 'base'],
      tvl: 2800000000,
      apyRanges: { low: 2, high: 6 },
      riskScore: 20,
      features: ['Comp rewards', 'Governance', 'Liquid staking'],
      website: 'https://compound.finance',
      documentation: 'https://docs.compound.finance',
    },
    {
      protocol: 'Liquity',
      category: 'lending',
      chains: ['ethereum'],
      tvl: 180000000,
      apyRanges: { low: 4, high: 12 },
      riskScore: 35,
      features: ['Zero interest', 'Liquidation-free', 'Stability pool'],
      website: 'https://liquity.org',
      documentation: 'https://docs.liquity.org',
    },
    {
      protocol: 'Morpho',
      category: 'lending',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
      tvl: 4500000000,
      apyRanges: { low: 2, high: 10 },
      riskScore: 30,
      features: ['Peer-to-peer', 'Optimized yields', 'Meta morpho'],
      website: 'https://morpho.org',
      documentation: 'https://docs.morpho.org',
    },
    // Yield Farming / DEX
    {
      protocol: 'Uniswap',
      category: 'yield_farming',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
      tvl: 8000000000,
      apyRanges: { low: 5, high: 50 },
      riskScore: 30,
      features: ['V3 concentrated liquidity', 'NFT positions', 'Governance'],
      website: 'https://uniswap.org',
      documentation: 'https://docs.uniswap.org',
    },
    {
      protocol: 'Curve',
      category: 'yield_farming',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'],
      tvl: 2200000000,
      apyRanges: { low: 2, high: 40 },
      riskScore: 25,
      features: ['Stable swaps', 'CRV rewards', 'Gauge system'],
      website: 'https://curve.fi',
      documentation: 'https://docs.curve.fi',
    },
    {
      protocol: 'SushiSwap',
      category: 'yield_farming',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'],
      tvl: 900000000,
      apyRanges: { low: 3, high: 60 },
      riskScore: 40,
      features: ['Onsen rewards', 'Kashi lending', 'BentoBox'],
      website: 'https://sushi.com',
      documentation: 'https://docs.sushi.com',
    },
    {
      protocol: 'Balancer',
      category: 'yield_farming',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
      tvl: 1200000000,
      apyRanges: { low: 2, high: 35 },
      riskScore: 35,
      features: ['Weighted pools', 'Boosted pools', 'VeBAL'],
      website: 'https://balancer.fi',
      documentation: 'https://docs.balancer.fi',
    },
    // Staking
    {
      protocol: 'Lido',
      category: 'staking',
      chains: ['ethereum', 'polygon', 'solana'],
      tvl: 32000000000,
      apyRanges: { low: 3, high: 5 },
      riskScore: 20,
      features: ['Liquid staking', 'stETH', 'DAO governance'],
      website: 'https://lido.fi',
      documentation: 'https://docs.lido.fi',
    },
    {
      protocol: 'Rocket Pool',
      category: 'staking',
      chains: ['ethereum'],
      tvl: 1800000000,
      apyRanges: { low: 3, high: 6 },
      riskScore: 25,
      features: ['Decentralized staking', 'rETH', 'Node operators'],
      website: 'https://rocketpool.net',
      documentation: 'https://docs.rocketpool.net',
    },
    {
      protocol: 'Yearn',
      category: 'yield_farming',
      chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
      tvl: 600000000,
      apyRanges: { low: 3, high: 25 },
      riskScore: 35,
      features: ['Auto-compounding', 'Vaults', 'Strategies'],
      website: 'https://yearn.finance',
      documentation: 'https://docs.yearn.finance',
    },
    {
      protocol: 'Convex',
      category: 'yield_farming',
      chains: ['ethereum', 'polygon', 'arbitrum'],
      tvl: 2500000000,
      apyRanges: { low: 5, high: 30 },
      riskScore: 30,
      features: ['CRVboost', 'CVX rewards', 'vlCVX'],
      website: 'https://convexfinance.com',
      documentation: 'https://docs.convexfinance.com',
    },
    // Arbitrage
    {
      protocol: 'GMX',
      category: 'arbitrage',
      chains: ['arbitrum', 'avalanche'],
      tvl: 600000000,
      apyRanges: { low: 10, high: 50 },
      riskScore: 50,
      features: ['Perpetual trading', 'GLP rewards', 'GMX tokens'],
      website: 'https://gmx.io',
      documentation: 'https://docs.gmx.io',
    },
    {
      protocol: 'dYdX',
      category: 'arbitrage',
      chains: ['ethereum', 'cosmos'],
      tvl: 350000000,
      apyRanges: { low: 8, high: 40 },
      riskScore: 45,
      features: ['Perpetual futures', 'Governance', 'Trading rewards'],
      website: 'https://dydx.exchange',
      documentation: 'https://docs.dydx.exchange',
    },
    // Liquidity
    {
      protocol: 'Velodrome',
      category: 'liquidity',
      chains: ['optimism'],
      tvl: 250000000,
      apyRanges: { low: 5, high: 45 },
      riskScore: 35,
      features: ['VELO rewards', 'Gauge voting', 'Stable pools'],
      website: 'https://velodrome.finance',
      documentation: 'https://docs.velodrome.finance',
    },
    {
      protocol: 'Trader Joe',
      category: 'liquidity',
      chains: ['avalanche', 'arbitrum', 'base'],
      tvl: 400000000,
      apyRanges: { low: 3, high: 40 },
      riskScore: 40,
      features: ['Liquidity books', 'Earn', 'Launchpad'],
      website: 'https://traderjoe.xyz',
      documentation: 'https://docs.traderjoe.xyz',
    },
    // Additional protocols
    {
      protocol: 'Gearbox',
      category: 'lending',
      chains: ['ethereum', 'polygon', 'arbitrum'],
      tvl: 180000000,
      apyRanges: { low: 2, high: 15 },
      riskScore: 45,
      features: ['Credit accounts', 'Leverage', 'Strategies'],
      website: 'https://gearbox.fi',
      documentation: 'https://docs.gearbox.fi',
    },
    {
      protocol: 'Radiant',
      category: 'lending',
      chains: ['arbitrum', 'avalanche'],
      tvl: 280000000,
      apyRanges: { low: 3, high: 12 },
      riskScore: 40,
      features: ['Cross-chain lending', 'RDNT tokens', 'V2'],
      website: 'https://radiant.capital',
      documentation: 'https://docs.radiant.capital',
    },
    {
      protocol: 'Aerodrome',
      category: 'liquidity',
      chains: ['base'],
      tvl: 180000000,
      apyRanges: { low: 5, high: 50 },
      riskScore: 40,
      features: ['Base native', 'AERO rewards', 'Bribes'],
      website: 'https://aerodrome.finance',
      documentation: 'https://docs.aerodrome.finance',
    },
    {
      protocol: 'PancakeSwap',
      category: 'yield_farming',
      chains: ['bsc', 'ethereum', 'arbitrum', 'base'],
      tvl: 1500000000,
      apyRanges: { low: 2, high: 60 },
      riskScore: 35,
      features: ['IFO', 'Prediction', 'NFT'],
      website: 'https://pancakeswap.finance',
      documentation: 'https://docs.pancakeswap.finance',
    },
  ];

  discoverProtocols(preferences: UserPreferences): DiscoveryResponse {
    const { riskTolerance, investmentGoal, preferredChains, investmentAmount, experienceLevel } = preferences;

    // Filter protocols based on preferences
    let filtered = this.protocolDatabase.filter((protocol) => {
      // Chain filter
      if (preferredChains.length > 0) {
        const hasMatchingChain = protocol.chains.some((chain) =>
          preferredChains.includes(chain)
        );
        if (!hasMatchingChain) return false;
      }

      // Category filter based on investment goal
      if (investmentGoal !== 'balanced') {
        const goalToCategory: Record<string, string[]> = {
          yield_farming: ['yield_farming', 'liquidity'],
          lending: ['lending'],
          staking: ['staking'],
          liquidity: ['liquidity', 'yield_farming'],
          arbitrage: ['arbitrage'],
          balanced: ['yield_farming', 'lending', 'staking', 'liquidity', 'arbitrage'],
        };
        if (!goalToCategory[investmentGoal].includes(protocol.category)) {
          return false;
        }
      }

      // Risk tolerance filter
      if (riskTolerance === 'low' && protocol.riskScore > 30) return false;
      if (riskTolerance === 'medium' && protocol.riskScore > 50) return false;
      // High risk tolerance allows all

      // Experience level filter
      if (experienceLevel === 'beginner' && protocol.riskScore > 35) return false;
      if (experienceLevel === 'intermediate' && protocol.riskScore > 55) return false;

      return true;
    });

    // Calculate match score for each protocol
    const recommendations: ProtocolRecommendation[] = filtered.map((protocol) => {
      let matchScore = 70; // Base score

      // Risk tolerance match
      if (riskTolerance === 'low' && protocol.riskScore <= 25) matchScore += 20;
      else if (riskTolerance === 'medium' && protocol.riskScore <= 35) matchScore += 15;
      else if (riskTolerance === 'high' && protocol.riskScore >= 40) matchScore += 10;

      // TVL bonus (higher TVL = more established)
      if (protocol.tvl > 1000000000) matchScore += 10;
      else if (protocol.tvl > 100000000) matchScore += 5;

      // Investment amount compatibility
      if (investmentAmount >= 10000 && protocol.tvl > 1000000000) matchScore += 5;
      else if (investmentAmount < 1000 && protocol.riskScore < 40) matchScore += 5;

      // Experience match
      if (experienceLevel === 'beginner' && protocol.riskScore < 30) matchScore += 10;
      if (experienceLevel === 'advanced' && protocol.riskScore > 35) matchScore += 10;

      // Generate reasons
      const reasons: string[] = [];
      if (protocol.riskScore <= 25) reasons.push('Low risk protocol');
      if (protocol.tvl > 1000000000) reasons.push('High TVL - established protocol');
      if (protocol.tvl > 10000000000) reasons.push('Market leader in category');
      if (protocol.chains.includes('ethereum')) reasons.push('Ethereum mainnet support');
      if (protocol.features.includes('Governance')) reasons.push('Community governed');
      if (protocol.apyRanges.high > 30) reasons.push('High yield potential');

      // Risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'medium';
      if (protocol.riskScore <= 25) riskLevel = 'low';
      else if (protocol.riskScore >= 45) riskLevel = 'high';

      return {
        protocol: protocol.protocol,
        category: protocol.category,
        chain: protocol.chains[0],
        tvl: protocol.tvl,
        apy: (protocol.apyRanges.low + protocol.apyRanges.high) / 2,
        riskScore: protocol.riskScore,
        riskLevel,
        matchScore: Math.min(100, matchScore),
        reasons,
        features: protocol.features,
        website: protocol.website,
        documentation: protocol.documentation,
      };
    });

    // Sort by match score
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Generate insights
    const insights = this.generateInsights(preferences, recommendations);

    return {
      recommendations: recommendations.slice(0, 10),
      totalFound: recommendations.length,
      filters: {
        riskTolerance,
        investmentGoal,
        chains: preferredChains,
      },
      insights,
    };
  }

  private generateInsights(preferences: UserPreferences, recommendations: ProtocolRecommendation[]): string[] {
    const insights: string[] = [];

    // Risk-based insights
    if (preferences.riskTolerance === 'low') {
      insights.push('Focus on established lending protocols with proven track records');
      insights.push('Consider stablecoin yields for steady, low-risk returns');
    } else if (preferences.riskTolerance === 'high') {
      insights.push('Higher yields come with higher risk - diversify your positions');
      insights.push('Consider newer protocols with higher APY but conduct extra due diligence');
    }

    // Goal-based insights
    if (preferences.investmentGoal === 'lending') {
      insights.push('Lending protocols offer stable yields with lower impermanent loss risk');
      insights.push('Aave and Compound are industry standards for beginner-friendly lending');
    } else if (preferences.investmentGoal === 'yield_farming') {
      insights.push('Yield farming can offer higher returns but involves impermanent loss');
      insights.push('Convex Finance can boost Curve farming yields significantly');
    } else if (preferences.investmentGoal === 'staking') {
      insights.push('Liquid staking provides yield while maintaining liquidity');
      insights.push('Lido stETH is the most liquid ETH staking derivative');
    } else if (preferences.investmentGoal === 'arbitrage') {
      insights.push('Arbitrage opportunities require active management and monitoring');
      insights.push('GMX and dYdX offer perpetual trading with leverage');
    }

    // Experience-based insights
    if (preferences.experienceLevel === 'beginner') {
      insights.push('Start with small amounts to understand protocol mechanics');
      insights.push('Use protocols with clear documentation and active communities');
    } else if (preferences.experienceLevel === 'advanced') {
      insights.push('Consider leveraging strategies for amplified yields');
      insights.push('Explore cross-chain opportunities for arbitrage');
    }

    // Investment amount insights
    if (preferences.investmentAmount < 1000) {
      insights.push('Gas fees may eat into returns for small positions on Ethereum');
      insights.push('Consider Layer 2 networks for cost-effective DeFi participation');
    } else if (preferences.investmentAmount > 50000) {
      insights.push('Large positions justify the gas costs of multiple protocols');
      insights.push('Consider diversifying across protocols to reduce smart contract risk');
    }

    return insights;
  }

  getProtocolDetails(protocolName: string): ProtocolRecommendation | null {
    const protocol = this.protocolDatabase.find(
      (p) => p.protocol.toLowerCase() === protocolName.toLowerCase()
    );
    if (!protocol) return null;

    return {
      protocol: protocol.protocol,
      category: protocol.category,
      chain: protocol.chains[0],
      tvl: protocol.tvl,
      apy: (protocol.apyRanges.low + protocol.apyRanges.high) / 2,
      riskScore: protocol.riskScore,
      riskLevel: protocol.riskScore <= 25 ? 'low' : protocol.riskScore >= 45 ? 'high' : 'medium',
      matchScore: 100,
      reasons: ['Detailed protocol information'],
      features: protocol.features,
      website: protocol.website,
      documentation: protocol.documentation,
    };
  }

  getAllCategories(): string[] {
    return ['lending', 'yield_farming', 'staking', 'liquidity', 'arbitrage'];
  }

  getAllChains(): string[] {
    return ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base', 'bsc', 'cosmos', 'solana'];
  }

  getTrendingProtocols(): ProtocolRecommendation[] {
    // Return top protocols by TVL with trending flag
    const trending = this.protocolDatabase
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 8)
      .map((protocol) => ({
        protocol: protocol.protocol,
        category: protocol.category,
        chain: protocol.chains[0],
        tvl: protocol.tvl,
        apy: (protocol.apyRanges.low + protocol.apyRanges.high) / 2,
        riskScore: protocol.riskScore,
        riskLevel: protocol.riskScore <= 25 ? 'low' : protocol.riskScore >= 45 ? 'high' : 'medium',
        matchScore: 95,
        reasons: ['Trending - High TVL', 'Popular choice'],
        features: protocol.features,
        website: protocol.website,
        documentation: protocol.documentation,
      }));
    return trending;
  }

  getProtocolsByCategory(category: string): ProtocolRecommendation[] {
    return this.protocolDatabase
      .filter((p) => p.category === category)
      .map((protocol) => ({
        protocol: protocol.protocol,
        category: protocol.category,
        chain: protocol.chains[0],
        tvl: protocol.tvl,
        apy: (protocol.apyRanges.low + protocol.apyRanges.high) / 2,
        riskScore: protocol.riskScore,
        riskLevel: protocol.riskScore <= 25 ? 'low' : protocol.riskScore >= 45 ? 'high' : 'medium',
        matchScore: 90,
        reasons: [`Category: ${category}`],
        features: protocol.features,
        website: protocol.website,
        documentation: protocol.documentation,
      }));
  }
}
