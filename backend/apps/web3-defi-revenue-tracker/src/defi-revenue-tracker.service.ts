import { Injectable } from '@nestjs/common';

export interface ProtocolRevenue {
  protocol: string;
  chain: string;
  category: 'dex' | 'lending' | 'liquid_staking' | 'yield' | 'bridge' | 'derivatives';
  revenue24h: number;
  revenue7d: number;
  revenue30d: number;
  revenueHistory: {
    date: string;
    revenue: number;
  }[];
  fees24h: number;
  totalValueLocked: number;
  tokenHoldersShare: number;
  treasuryRevenue: number;
  burnRevenue: number;
  revenueSources: {
    tradingFees: number;
    lendingInterest: number;
    stakingRewards: number;
    flashLoanFees: number;
    otherFees: number;
  };
}

export interface ProtocolFee {
  protocol: string;
  chain: string;
  feeType: 'swap' | 'borrow' | 'lend' | 'stake' | 'bridge' | 'withdraw' | 'other';
  fee24h: number;
  fee7dAvg: number;
  fee30dAvg: number;
  volume24h: number;
  feePercentage: number;
}

export interface RevenueComparison {
  protocols: {
    name: string;
    revenue24h: number;
    revenue30d: number;
    tvl: number;
    revenueToTvl: number;
  }[];
  totalRevenue24h: number;
  totalRevenue30d: number;
  topGainer: {
    name: string;
    change: number;
  };
  topLoser: {
    name: string;
    change: number;
  };
}

export interface RevenueMetrics {
  totalProtocolRevenue: number;
  totalFees: number;
  revenueByCategory: {
    category: string;
    revenue: number;
    percentage: number;
  }[];
  revenueByChain: {
    chain: string;
    revenue: number;
    percentage: number;
  }[];
  topProtocols: {
    name: string;
    revenue: number;
    marketShare: number;
  }[];
}

export interface RevenueAlert {
  id: string;
  protocol: string;
  threshold: number;
  condition: 'above' | 'below';
  currentRevenue: number;
  triggered: boolean;
  createdAt: string;
}

// Mock data for demonstration - in production, this would come from blockchain queries
const MOCK_PROTOCOLS: ProtocolRevenue[] = [
  {
    protocol: 'Uniswap',
    chain: 'Ethereum',
    category: 'dex',
    revenue24h: 4523000,
    revenue7d: 31661000,
    revenue30d: 135690000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 4523000,
    totalValueLocked: 8950000000,
    tokenHoldersShare: 0,
    treasuryRevenue: 2261500,
    burnRevenue: 2261500,
    revenueSources: {
      tradingFees: 4523000,
      lendingInterest: 0,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 0,
    },
  },
  {
    protocol: 'Aave',
    chain: 'Ethereum',
    category: 'lending',
    revenue24h: 1890000,
    revenue7d: 13230000,
    revenue30d: 56700000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 945000,
    totalValueLocked: 15600000000,
    tokenHoldersShare: 945000,
    treasuryRevenue: 567000,
    burnRevenue: 378000,
    revenueSources: {
      tradingFees: 0,
      lendingInterest: 1890000,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 0,
    },
  },
  {
    protocol: 'Curve',
    chain: 'Ethereum',
    category: 'dex',
    revenue24h: 1234000,
    revenue7d: 8638000,
    revenue30d: 37020000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 1234000,
    totalValueLocked: 4200000000,
    tokenHoldersShare: 617000,
    treasuryRevenue: 308500,
    burnRevenue: 308500,
    revenueSources: {
      tradingFees: 1234000,
      lendingInterest: 0,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 0,
    },
  },
  {
    protocol: 'Lido',
    chain: 'Ethereum',
    category: 'liquid_staking',
    revenue24h: 2100000,
    revenue7d: 14700000,
    revenue30d: 63000000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 105000,
    totalValueLocked: 32000000000,
    tokenHoldersShare: 1890000,
    treasuryRevenue: 105000,
    burnRevenue: 0,
    revenueSources: {
      tradingFees: 0,
      lendingInterest: 0,
      stakingRewards: 2100000,
      flashLoanFees: 0,
      otherFees: 105000,
    },
  },
  {
    protocol: 'Sushiswap',
    chain: 'Ethereum',
    category: 'dex',
    revenue24h: 567000,
    revenue7d: 3969000,
    revenue30d: 17010000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 567000,
    totalValueLocked: 1800000000,
    tokenHoldersShare: 0,
    treasuryRevenue: 170100,
    burnRevenue: 396900,
    revenueSources: {
      tradingFees: 567000,
      lendingInterest: 0,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 0,
    },
  },
  {
    protocol: 'Compound',
    chain: 'Ethereum',
    category: 'lending',
    revenue24h: 892000,
    revenue7d: 6244000,
    revenue30d: 26760000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 446000,
    totalValueLocked: 5200000000,
    tokenHoldersShare: 446000,
    treasuryRevenue: 267600,
    burnRevenue: 178400,
    revenueSources: {
      tradingFees: 0,
      lendingInterest: 892000,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 0,
    },
  },
  {
    protocol: 'Yearn',
    chain: 'Ethereum',
    category: 'yield',
    revenue24h: 456000,
    revenue7d: 3192000,
    revenue30d: 13680000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 456000,
    totalValueLocked: 3800000000,
    tokenHoldersShare: 228000,
    treasuryRevenue: 136800,
    burnRevenue: 91200,
    revenueSources: {
      tradingFees: 0,
      lendingInterest: 0,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 456000,
    },
  },
  {
    protocol: 'MakerDAO',
    chain: 'Ethereum',
    category: 'lending',
    revenue24h: 1234000,
    revenue7d: 8638000,
    revenue30d: 37020000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 0,
    totalValueLocked: 8900000000,
    tokenHoldersShare: 864000,
    treasuryRevenue: 246800,
    burnRevenue: 123400,
    revenueSources: {
      tradingFees: 0,
      lendingInterest: 1234000,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 0,
    },
  },
  {
    protocol: 'GMX',
    chain: 'Arbitrum',
    category: 'derivatives',
    revenue24h: 1890000,
    revenue7d: 13230000,
    revenue30d: 56700000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 1890000,
    totalValueLocked: 1200000000,
    tokenHoldersShare: 567000,
    treasuryRevenue: 945000,
    burnRevenue: 378000,
    revenueSources: {
      tradingFees: 1890000,
      lendingInterest: 0,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 0,
    },
  },
  {
    protocol: 'Balancer',
    chain: 'Ethereum',
    category: 'dex',
    revenue24h: 345000,
    revenue7d: 2415000,
    revenue30d: 10350000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 345000,
    totalValueLocked: 1800000000,
    tokenHoldersShare: 0,
    treasuryRevenue: 103500,
    burnRevenue: 241500,
    revenueSources: {
      tradingFees: 345000,
      lendingInterest: 0,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 0,
    },
  },
  {
    protocol: 'dYdX',
    chain: 'Ethereum',
    category: 'derivatives',
    revenue24h: 987000,
    revenue7d: 6909000,
    revenue30d: 29610000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 987000,
    totalValueLocked: 890000000,
    tokenHoldersShare: 493500,
    treasuryRevenue: 296100,
    burnRevenue: 197400,
    revenueSources: {
      tradingFees: 987000,
      lendingInterest: 0,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 0,
    },
  },
  {
    protocol: 'Stargate',
    chain: 'Ethereum',
    category: 'bridge',
    revenue24h: 234000,
    revenue7d: 1638000,
    revenue30d: 7020000,
    revenueHistory: generateRevenueHistory(30),
    fees24h: 234000,
    totalValueLocked: 3400000000,
    tokenHoldersShare: 117000,
    treasuryRevenue: 70200,
    burnRevenue: 46800,
    revenueSources: {
      tradingFees: 0,
      lendingInterest: 0,
      stakingRewards: 0,
      flashLoanFees: 0,
      otherFees: 234000,
    },
  },
];

function generateRevenueHistory(days: number) {
  const history = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const baseRevenue = 1000000 + Math.random() * 3000000;
    history.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.round(baseRevenue * (0.8 + Math.random() * 0.4)),
    });
  }
  return history;
}

@Injectable()
export class DefiRevenueTrackerService {
  private alerts: RevenueAlert[] = [];

  /**
   * Get all protocol revenues
   */
  getProtocolRevenues(): ProtocolRevenue[] {
    return MOCK_PROTOCOLS;
  }

  /**
   * Get revenue for a specific protocol
   */
  getProtocolRevenue(protocol: string): ProtocolRevenue | undefined {
    return MOCK_PROTOCOLS.find(
      (p) => p.protocol.toLowerCase() === protocol.toLowerCase()
    );
  }

  /**
   * Get revenues by chain
   */
  getRevenuesByChain(chain?: string): ProtocolRevenue[] {
    if (!chain) return MOCK_PROTOCOLS;
    return MOCK_PROTOCOLS.filter(
      (p) => p.chain.toLowerCase() === chain.toLowerCase()
    );
  }

  /**
   * Get revenues by category
   */
  getRevenuesByCategory(category: string): ProtocolRevenue[] {
    return MOCK_PROTOCOLS.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get revenue metrics across all protocols
   */
  getRevenueMetrics(): RevenueMetrics {
    const totalRevenue = MOCK_PROTOCOLS.reduce((sum, p) => sum + p.revenue24h, 0);
    const totalFees = MOCK_PROTOCOLS.reduce((sum, p) => sum + p.fees24h, 0);

    // Revenue by category
    const categoryMap = new Map<string, number>();
    MOCK_PROTOCOLS.forEach((p) => {
      const current = categoryMap.get(p.category) || 0;
      categoryMap.set(p.category, current + p.revenue24h);
    });
    const revenueByCategory = Array.from(categoryMap.entries()).map(
      ([category, revenue]) => ({
        category,
        revenue,
        percentage: (revenue / totalRevenue) * 100,
      })
    );

    // Revenue by chain
    const chainMap = new Map<string, number>();
    MOCK_PROTOCOLS.forEach((p) => {
      const current = chainMap.get(p.chain) || 0;
      chainMap.set(p.chain, current + p.revenue24h);
    });
    const revenueByChain = Array.from(chainMap.entries()).map(
      ([chain, revenue]) => ({
        chain,
        revenue,
        percentage: (revenue / totalRevenue) * 100,
      })
    );

    // Top protocols
    const sortedProtocols = [...MOCK_PROTOCOLS].sort(
      (a, b) => b.revenue24h - a.revenue24h
    );
    const topProtocols = sortedProtocols.slice(0, 10).map((p) => ({
      name: p.protocol,
      revenue: p.revenue24h,
      marketShare: (p.revenue24h / totalRevenue) * 100,
    }));

    return {
      totalProtocolRevenue: totalRevenue,
      totalFees,
      revenueByCategory,
      revenueByChain,
      topProtocols,
    };
  }

  /**
   * Compare multiple protocols
   */
  compareProtocols(protocols: string[]): RevenueComparison {
    const selectedProtocols = MOCK_PROTOCOLS.filter((p) =>
      protocols.includes(p.protocol.toLowerCase())
    );

    const protocolData = selectedProtocols.map((p) => ({
      name: p.protocol,
      revenue24h: p.revenue24h,
      revenue30d: p.revenue30d,
      tvl: p.totalValueLocked,
      revenueToTvl: (p.revenue24h / p.totalValueLocked) * 100,
    }));

    const totalRevenue24h = protocolData.reduce((sum, p) => sum + p.revenue24h, 0);
    const totalRevenue30d = protocolData.reduce((sum, p) => sum + p.revenue30d, 0);

    // Calculate changes
    const changes = selectedProtocols.map((p) => ({
      name: p.protocol,
      change:
        ((p.revenue24h - p.revenue7d / 7) / (p.revenue7d / 7)) * 100,
    }));

    const sortedByChange = [...changes].sort((a, b) => b.change - a.change);

    return {
      protocols: protocolData,
      totalRevenue24h,
      totalRevenue30d,
      topGainer: sortedByChange[0] || { name: '', change: 0 },
      topLoser: sortedByChange[sortedByChange.length - 1] || { name: '', change: 0 },
    };
  }

  /**
   * Get protocol fees breakdown
   */
  getProtocolFees(): ProtocolFee[] {
    return MOCK_PROTOCOLS.map((p) => ({
      protocol: p.protocol,
      chain: p.chain,
      feeType: this.getFeeType(p.category),
      fee24h: p.fees24h,
      fee7dAvg: p.revenue7d / 7,
      fee30dAvg: p.revenue30d / 30,
      volume24h: p.fees24h > 0 ? p.fees24h * 100 : 0,
      feePercentage: p.totalValueLocked > 0 ? (p.fees24h / p.totalValueLocked) * 100 : 0,
    }));
  }

  private getFeeType(
    category: string
  ): 'swap' | 'borrow' | 'lend' | 'stake' | 'bridge' | 'other' {
    const mapping: Record<string, 'swap' | 'borrow' | 'lend' | 'stake' | 'bridge' | 'other'> = {
      dex: 'swap',
      lending: 'borrow',
      liquid_staking: 'stake',
      yield: 'other',
      bridge: 'bridge',
      derivatives: 'other',
    };
    return mapping[category] || 'other';
  }

  /**
   * Get revenue alerts
   */
  getAlerts(): RevenueAlert[] {
    return this.alerts;
  }

  /**
   * Create revenue alert
   */
  createAlert(protocol: string, threshold: number, condition: 'above' | 'below'): RevenueAlert {
    const protocolRevenue = this.getProtocolRevenue(protocol);
    const alert: RevenueAlert = {
      id: `alert_${Date.now()}`,
      protocol,
      threshold,
      condition,
      currentRevenue: protocolRevenue?.revenue24h || 0,
      triggered: false,
      createdAt: new Date().toISOString(),
    };

    // Check if triggered
    if (condition === 'above' && alert.currentRevenue > threshold) {
      alert.triggered = true;
    } else if (condition === 'below' && alert.currentRevenue < threshold) {
      alert.triggered = true;
    }

    this.alerts.push(alert);
    return alert;
  }

  /**
   * Delete alert
   */
  deleteAlert(alertId: string): boolean {
    const index = this.alerts.findIndex((a) => a.id === alertId);
    if (index > -1) {
      this.alerts.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get historical revenue data
   */
  getRevenueHistory(
    protocol?: string,
    days: number = 30
  ): { date: string; revenue: number }[] {
    if (protocol) {
      const p = this.getProtocolRevenue(protocol);
      return p?.revenueHistory.slice(-days) || [];
    }

    // Aggregate all protocols
    const history: Map<string, number> = new Map();
    MOCK_PROTOCOLS.forEach((p) => {
      p.revenueHistory.slice(-days).forEach((h) => {
        const current = history.get(h.date) || 0;
        history.set(h.date, current + h.revenue);
      });
    });

    return Array.from(history.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get revenue breakdown by source
   */
  getRevenueSources(protocol: string) {
    const p = this.getProtocolRevenue(protocol);
    if (!p) return null;

    return {
      tradingFees: p.revenueSources.tradingFees,
      lendingInterest: p.revenueSources.lendingInterest,
      stakingRewards: p.revenueSources.stakingRewards,
      flashLoanFees: p.revenueSources.flashLoanFees,
      otherFees: p.revenueSources.otherFees,
      total: p.revenue24h,
      breakdown: [
        { source: 'Trading Fees', value: p.revenueSources.tradingFees, percentage: (p.revenueSources.tradingFees / p.revenue24h) * 100 },
        { source: 'Lending Interest', value: p.revenueSources.lendingInterest, percentage: (p.revenueSources.lendingInterest / p.revenue24h) * 100 },
        { source: 'Staking Rewards', value: p.revenueSources.stakingRewards, percentage: (p.revenueSources.stakingRewards / p.revenue24h) * 100 },
        { source: 'Flash Loan Fees', value: p.revenueSources.flashLoanFees, percentage: (p.revenueSources.flashLoanFees / p.revenue24h) * 100 },
        { source: 'Other Fees', value: p.revenueSources.otherFees, percentage: (p.revenueSources.otherFees / p.revenue24h) * 100 },
      ].filter(b => b.value > 0),
    };
  }

  /**
   * Get token holder distribution
   */
  getTokenHolderDistribution(protocol: string) {
    const p = this.getProtocolRevenue(protocol);
    if (!p) return null;

    return {
      tokenHoldersShare: p.tokenHoldersShare,
      treasuryRevenue: p.treasuryRevenue,
      burnRevenue: p.burnRevenue,
      distribution: [
        { category: 'Token Holders', value: p.tokenHoldersShare, percentage: (p.tokenHoldersShare / p.revenue24h) * 100 },
        { category: 'Treasury', value: p.treasuryRevenue, percentage: (p.treasuryRevenue / p.revenue24h) * 100 },
        { category: 'Burn', value: p.burnRevenue, percentage: (p.burnRevenue / p.revenue24h) * 100 },
      ],
    };
  }
}
