import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface InsuranceProtocol {
  name: string;
  logo: string;
  chain: string;
  TVL: string;
  coverage: string;
  avgPremium: string;
  claimsPaid: string;
  description: string;
}

export interface CoveragePosition {
  protocol: string;
  coveredAmount: string;
  premium: string;
  coverageEndDate: string;
  status: 'active' | 'expired' | 'claimed';
  protectionType: string;
}

@Injectable()
export class DefiInsuranceService {
  private readonly logger = new Logger(DefiInsuranceService.name);

  // Popular DeFi Insurance Protocols
  private readonly protocols: InsuranceProtocol[] = [
    {
      name: 'Nexus Mutual',
      logo: '🛡️',
      chain: 'ETH',
      TVL: '$320M',
      coverage: '$1.2B',
      avgPremium: '2.5%',
      claimsPaid: '$45M',
      description: 'Decentralized insurance protocol covering smart contract failures',
    },
    {
      name: 'Cover Protocol',
      logo: '📒',
      chain: 'ETH',
      TVL: '$45M',
      coverage: '$180M',
      avgPremium: '3.2%',
      claimsPaid: '$8M',
      description: 'Peer-to-peer coverage for DeFi protocols',
    },
    {
      name: 'InsurAce',
      logo: '🌂',
      chain: 'Multi',
      TVL: '$120M',
      coverage: '$500M',
      avgPremium: '2.8%',
      claimsPaid: '$12M',
      description: 'Cross-chain DeFi insurance with portfolio protection',
    },
    {
      name: 'Armor',
      logo: '🦾',
      chain: 'ETH',
      TVL: '$25M',
      coverage: '$90M',
      avgPremium: '4.1%',
      claimsPaid: '$3M',
      description: 'NFT-based coverage for DeFi positions',
    },
    {
      name: 'Unslashed',
      logo: '⚔️',
      chain: 'ETH',
      TVL: '$18M',
      coverage: '$65M',
      avgPremium: '3.5%',
      claimsPaid: '$2.5M',
      description: 'Community-curated insurance pool',
    },
    {
      name: 'Tidal Finance',
      logo: '🌊',
      chain: 'Multi',
      TVL: '$35M',
      coverage: '$150M',
      avgPremium: '2.9%',
      claimsPaid: '$5M',
      description: 'Multi-chain insurance with parametric covers',
    },
  ];

  async getProtocols(): Promise<InsuranceProtocol[]> {
    return this.protocols;
  }

  async getProtocolDetails(name: string): Promise<InsuranceProtocol | null> {
    return this.protocols.find((p) => p.name.toLowerCase() === name.toLowerCase()) || null;
  }

  // Get coverage positions for a wallet address
  async getWalletCoverage(address: string): Promise<CoveragePosition[]> {
    // Simulated data - in production, would query on-chain data
    const positions: CoveragePosition[] = [
      {
        protocol: 'Uniswap V3',
        coveredAmount: '50,000 USDC',
        premium: '125 USDC/year',
        coverageEndDate: '2026-06-15',
        status: 'active',
        protectionType: 'Smart Contract',
      },
      {
        protocol: 'Aave V3',
        coveredAmount: '100,000 USDC',
        premium: '250 USDC/year',
        coverageEndDate: '2026-09-20',
        status: 'active',
        protectionType: 'Liquidation',
      },
      {
        protocol: 'Compound',
        coveredAmount: '25,000 USDC',
        premium: '75 USDC/year',
        coverageEndDate: '2025-12-01',
        status: 'expired',
        protectionType: 'Smart Contract',
      },
    ];

    return positions;
  }

  // Calculate premium estimate
  async calculatePremium(
    coverageAmount: number,
    protocol: string,
    duration: number,
  ): Promise<{ premium: number; premiumPercent: number }> {
    const premiumRates: Record<string, number> = {
      'uniswap-v3': 0.025,
      'aave-v3': 0.025,
      compound: 0.03,
      'curve-pool': 0.02,
      'lido': 0.035,
      default: 0.03,
    };

    const rate = premiumRates[protocol.toLowerCase()] || premiumRates.default;
    const premium = coverageAmount * rate * (duration / 365);
    const premiumPercent = rate * 100;

    return {
      premium: Math.round(premium * 100) / 100,
      premiumPercent: Math.round(premiumPercent * 100) / 100,
    };
  }

  // Get insurance market statistics
  async getMarketStats(): Promise<any> {
    return {
      totalTVL: '$563M',
      totalCoverage: '$2.19B',
      totalClaimsPaid: '$75.5M',
      avgPremium: '3.0%',
      activePolicies: '12,450',
      protocolsCount: this.protocols.length,
      chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche'],
      growth24h: '+5.2%',
      trends: [
        { month: 'Oct', tvl: '$420M' },
        { month: 'Nov', tvl: '$450M' },
        { month: 'Dec', tvl: '$480M' },
        { month: 'Jan', tvl: '$510M' },
        { month: 'Feb', tvl: '$535M' },
        { month: 'Mar', tvl: '$563M' },
      ],
    };
  }

  // Get historical claims data
  async getClaimsHistory(): Promise<any[]> {
    return [
      {
        protocol: 'Harvest Finance',
        amount: '$3.2M',
        reason: 'Smart Contract Exploit',
        date: '2024-10-26',
        status: 'Paid',
      },
      {
        protocol: 'EasyFi',
        amount: '$1.8M',
        reason: 'Private Key Compromise',
        date: '2024-04-19',
        status: 'Paid',
      },
      {
        protocol: 'Cream Finance',
        amount: '$1.5M',
        reason: 'Flash Loan Attack',
        date: '2024-08-30',
        status: 'Paid',
      },
      {
        protocol: 'BadgerDAO',
        amount: '$1.2M',
        reason: 'Bridge Exploit',
        date: '2024-12-02',
        status: 'Paid',
      },
      {
        protocol: 'Rari Capital',
        amount: '$800K',
        reason: 'Smart Contract Bug',
        date: '2024-05-15',
        status: 'Paid',
      },
    ];
  }

  // Get recommended coverage based on portfolio
  async getRecommendedCoverage(portfolioValue: number): Promise<any[]> {
    const recommendations = [];

    // Calculate recommended coverage percentages by protocol type
    const protocolCoverage = [
      { type: 'DEX LP', minCoverage: 0.3, maxCoverage: 0.5, protocols: ['Uniswap', 'Curve', 'SushiSwap'] },
      { type: 'Lending', minCoverage: 0.4, maxCoverage: 0.6, protocols: ['Aave', 'Compound', 'Morpho'] },
      { type: 'Staking', minCoverage: 0.2, maxCoverage: 0.3, protocols: ['Lido', 'Rocket Pool', 'Stakewise'] },
      { type: 'Yield Farm', minCoverage: 0.5, maxCoverage: 0.8, protocols: ['Yearn', 'Convex', 'Gearbox'] },
    ];

    for (const p of protocolCoverage) {
      const minCovered = portfolioValue * p.minCoverage;
      const maxCovered = portfolioValue * p.maxCoverage;
      const estimatedPremium = (minCovered + maxCovered) / 2 * 0.03;

      recommendations.push({
        type: p.type,
        protocols: p.protocols,
        recommendedCoverage: `$${minCovered.toLocaleString()} - $${maxCovered.toLocaleString()}`,
        estimatedPremium: `$${estimatedPremium.toLocaleString()}/year`,
        riskLevel: p.maxCoverage > 0.5 ? 'High' : p.maxCoverage > 0.3 ? 'Medium' : 'Low',
      });
    }

    return recommendations;
  }

  // Compare insurance providers for a specific protocol
  async compareProviders(protocol: string, coverageAmount: number): Promise<any[]> {
    const providers = [];

    for (const p of this.protocols) {
      const rate = 0.02 + Math.random() * 0.03; // Simulated rate
      const premium = coverageAmount * rate;
      
      providers.push({
        name: p.name,
        logo: p.logo,
        premium: `$${premium.toFixed(2)}/year`,
        premiumPercent: `${(rate * 100).toFixed(1)}%`,
        coverageLimit: coverageAmount * 1.5,
        claimsProcess: Math.random() > 0.5 ? '7 days' : '14 days',
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        features: this.getRandomFeatures(),
      });
    }

    return providers.sort((a, b) => parseFloat(a.premium) - parseFloat(b.premium));
  }

  private getRandomFeatures(): string[] {
    const allFeatures = [
      'Instant Claims',
      'NFT Coverage',
      'Cross-chain',
      'Parametric',
      'DAO Governance',
      'Capital Efficient',
      'Community Pool',
      'Reinsurance',
    ];
    
    const count = 2 + Math.floor(Math.random() * 3);
    const shuffled = allFeatures.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}
