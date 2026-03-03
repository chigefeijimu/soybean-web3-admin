import { Injectable } from '@nestjs/common';

export interface DeFiPosition {
  id: string;
  address: string;
  chain: string;
  protocol: string;
  type: 'lending' | 'staking' | 'liquidity' | 'yield_farming' | 'bridge';
  token0?: string;
  token1?: string;
  depositAmount: number;
  depositValueUSD: number;
  currentValueUSD: number;
  apy: number;
  rewardToken?: string;
  pendingRewardsUSD: number;
  healthFactor?: number;
  liquidationPrice?: number;
  entryPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthMetrics {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  liquidityScore: number;
  diversificationScore: number;
  yieldScore: number;
  riskScore: number;
}

export interface PositionAlert {
  id: string;
  positionId: string;
  type: 'liquidation_risk' | 'low_yield' | 'high_slippage' | 'unstaked' | 'reward_ready';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  triggeredAt: Date;
  acknowledged: boolean;
}

export interface PortfolioHealthSummary {
  totalValueUSD: number;
  totalPositions: number;
  chains: string[];
  protocols: string[];
  healthMetrics: HealthMetrics;
  recentAlerts: PositionAlert[];
  topHoldings: { token: string; valueUSD: number; percentage: number }[];
  riskDistribution: { risk: string; count: number; valueUSD: number }[];
}

@Injectable()
export class Web3DefiHealthMonitorService {
  private positions: Map<string, DeFiPosition> = new Map();
  private alerts: Map<string, PositionAlert[]> = new Map();

  // Supported chains
  private readonly supportedChains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'bsc',
    'base',
    'avalanche',
  ];

  // Supported protocols
  private readonly supportedProtocols = [
    'aave',
    'compound',
    'uniswap',
    'curve',
    'sushiswap',
    'lido',
    'yearn',
    'gearbox',
    'morpho',
    'aerodrome',
    'velodrome',
    'pancakeswap',
    'quickswap',
  ];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Demo positions
    const demoPositions: DeFiPosition[] = [
      {
        id: '1',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        chain: 'ethereum',
        protocol: 'aave',
        type: 'lending',
        token0: 'ETH',
        depositAmount: 10.5,
        depositValueUSD: 31500,
        currentValueUSD: 32850,
        apy: 4.2,
        pendingRewardsUSD: 125.5,
        healthFactor: 2.5,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '2',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        chain: 'ethereum',
        protocol: 'uniswap',
        type: 'liquidity',
        token0: 'USDC',
        token1: 'ETH',
        depositAmount: 15000,
        depositValueUSD: 15000,
        currentValueUSD: 16200,
        apy: 18.5,
        pendingRewardsUSD: 89.2,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '3',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        chain: 'polygon',
        protocol: 'aave',
        type: 'lending',
        token0: 'MATIC',
        depositAmount: 5000,
        depositValueUSD: 4500,
        currentValueUSD: 4800,
        apy: 5.8,
        pendingRewardsUSD: 42.3,
        healthFactor: 1.8,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '4',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        chain: 'arbitrum',
        protocol: 'curve',
        type: 'liquidity',
        token0: 'ETH',
        token1: 'stETH',
        depositAmount: 5.2,
        depositValueUSD: 15600,
        currentValueUSD: 16850,
        apy: 12.3,
        pendingRewardsUSD: 156.8,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '5',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        chain: 'ethereum',
        protocol: 'lido',
        type: 'staking',
        token0: 'ETH',
        depositAmount: 8.0,
        depositValueUSD: 24000,
        currentValueUSD: 25200,
        apy: 4.8,
        pendingRewardsUSD: 89.5,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '6',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        chain: 'optimism',
        protocol: 'velodrome',
        type: 'yield_farming',
        token0: 'OP',
        token1: 'VELO',
        depositAmount: 3000,
        depositValueUSD: 2400,
        currentValueUSD: 2650,
        apy: 25.6,
        pendingRewardsUSD: 45.2,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      {
        id: '7',
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        chain: 'bsc',
        protocol: 'pancakeswap',
        type: 'liquidity',
        token0: 'BNB',
        token1: 'CAKE',
        depositAmount: 2.5,
        depositValueUSD: 750,
        currentValueUSD: 820,
        apy: 32.1,
        pendingRewardsUSD: 28.5,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ];

    demoPositions.forEach((position) => {
      this.positions.set(position.id, position);
      this.alerts.set(position.id, this.generateAlertsForPosition(position));
    });
  }

  private generateAlertsForPosition(position: DeFiPosition): PositionAlert[] {
    const alerts: PositionAlert[] = [];

    // Liquidation risk alert
    if (position.healthFactor && position.healthFactor < 1.5) {
      alerts.push({
        id: `${position.id}-alert-1`,
        positionId: position.id,
        type: 'liquidation_risk',
        severity: position.healthFactor < 1.2 ? 'critical' : 'warning',
        message: `Low health factor: ${position.healthFactor.toFixed(2)} - risk of liquidation`,
        triggeredAt: new Date(),
        acknowledged: false,
      });
    }

    // Low yield alert
    if (position.apy < 3 && position.type === 'lending') {
      alerts.push({
        id: `${position.id}-alert-2`,
        positionId: position.id,
        type: 'low_yield',
        severity: 'info',
        message: `Low APY: ${position.apy.toFixed(1)}% - consider rebalancing`,
        triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        acknowledged: false,
      });
    }

    // Reward ready alert
    if (position.pendingRewardsUSD > 50) {
      alerts.push({
        id: `${position.id}-alert-3`,
        positionId: position.id,
        type: 'reward_ready',
        severity: 'info',
        message: `${position.pendingRewardsUSD.toFixed(2)} USD in pending rewards available to claim`,
        triggeredAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        acknowledged: false,
      });
    }

    return alerts;
  }

  // Get all positions for an address
  getPositions(address: string): DeFiPosition[] {
    return Array.from(this.positions.values()).filter(
      (p) => p.address.toLowerCase() === address.toLowerCase()
    );
  }

  // Get position by ID
  getPositionById(id: string): DeFiPosition | undefined {
    return this.positions.get(id);
  }

  // Get positions by chain
  getPositionsByChain(address: string, chain: string): DeFiPosition[] {
    return this.getPositions(address).filter(
      (p) => p.chain.toLowerCase() === chain.toLowerCase()
    );
  }

  // Get positions by protocol
  getPositionsByProtocol(address: string, protocol: string): DeFiPosition[] {
    return this.getPositions(address).filter(
      (p) => p.protocol.toLowerCase() === protocol.toLowerCase()
    );
  }

  // Get positions by type
  getPositionsByType(address: string, type: string): DeFiPosition[] {
    return this.getPositions(address).filter(
      (p) => p.type === type
    );
  }

  // Add new position
  addPosition(data: {
    address: string;
    chain: string;
    protocol: string;
    type: 'lending' | 'staking' | 'liquidity' | 'yield_farming' | 'bridge';
    token0?: string;
    token1?: string;
    depositAmount: number;
    depositValueUSD: number;
    apy: number;
    rewardToken?: string;
    healthFactor?: number;
  }): DeFiPosition {
    const id = Date.now().toString();
    const position: DeFiPosition = {
      id,
      address: data.address,
      chain: data.chain,
      protocol: data.protocol,
      type: data.type,
      token0: data.token0,
      token1: data.token1,
      depositAmount: data.depositAmount,
      depositValueUSD: data.depositValueUSD,
      currentValueUSD: data.depositValueUSD,
      apy: data.apy,
      rewardToken: data.rewardToken,
      pendingRewardsUSD: 0,
      healthFactor: data.healthFactor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.positions.set(id, position);
    this.alerts.set(id, []);
    return position;
  }

  // Update position
  updatePosition(id: string, updates: Partial<DeFiPosition>): DeFiPosition | null {
    const position = this.positions.get(id);
    if (!position) return null;

    const updated = { ...position, ...updates, updatedAt: new Date() };
    this.positions.set(id, updated);
    return updated;
  }

  // Delete position
  deletePosition(id: string): boolean {
    const existed = this.positions.has(id);
    this.positions.delete(id);
    this.alerts.delete(id);
    return existed;
  }

  // Calculate health metrics
  calculateHealthMetrics(address: string): HealthMetrics {
    const positions = this.getPositions(address);
    
    if (positions.length === 0) {
      return {
        overallScore: 100,
        riskLevel: 'low',
        liquidityScore: 100,
        diversificationScore: 100,
        yieldScore: 100,
        riskScore: 0,
      };
    }

    // Calculate diversification score
    const chainCount = new Set(positions.map(p => p.chain)).size;
    const protocolCount = new Set(positions.map(p => p.protocol)).size;
    const diversificationScore = Math.min(100, (chainCount * 15 + protocolCount * 10));

    // Calculate liquidity score
    const lendingPositions = positions.filter(p => p.type === 'lending');
    const liquidityScore = lendingPositions.length > 0 
      ? 100 - (lendingPositions.filter(p => (p.healthFactor || 3) < 1.5).length * 30)
      : 70;

    // Calculate yield score
    const avgApy = positions.reduce((sum, p) => sum + p.apy, 0) / positions.length;
    const yieldScore = Math.min(100, avgApy * 3);

    // Calculate risk score
    const riskFactors = positions.filter(p => 
      (p.healthFactor && p.healthFactor < 1.5) || 
      p.apy > 50 ||
      p.type === 'yield_farming'
    ).length;
    const riskScore = Math.min(100, riskFactors * 20);

    // Overall score
    const overallScore = Math.max(0, Math.min(100, 
      (diversificationScore * 0.3 + liquidityScore * 0.3 + yieldScore * 0.2 + (100 - riskScore) * 0.2)
    ));

    // Risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (overallScore >= 80) riskLevel = 'low';
    else if (overallScore >= 60) riskLevel = 'medium';
    else if (overallScore >= 40) riskLevel = 'high';
    else riskLevel = 'critical';

    return {
      overallScore: Math.round(overallScore),
      riskLevel,
      liquidityScore: Math.round(liquidityScore),
      diversificationScore: Math.round(diversificationScore),
      yieldScore: Math.round(yieldScore),
      riskScore: Math.round(riskScore),
    };
  }

  // Get portfolio health summary
  getPortfolioHealthSummary(address: string): PortfolioHealthSummary {
    const positions = this.getPositions(address);
    const healthMetrics = this.calculateHealthMetrics(address);

    // Get all alerts
    const allAlerts: PositionAlert[] = [];
    this.alerts.forEach((alerts) => {
      allAlerts.push(...alerts);
    });
    const recentAlerts = allAlerts
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, 10);

    // Calculate total value
    const totalValueUSD = positions.reduce((sum, p) => sum + p.currentValueUSD, 0);

    // Get chains and protocols
    const chains = [...new Set(positions.map(p => p.chain))];
    const protocols = [...new Set(positions.map(p => p.protocol))];

    // Calculate top holdings
    const tokenValues: Map<string, number> = new Map();
    positions.forEach(p => {
      const token = p.token0 || 'Unknown';
      tokenValues.set(token, (tokenValues.get(token) || 0) + p.currentValueUSD);
    });
    const topHoldings = Array.from(tokenValues.entries())
      .map(([token, valueUSD]) => ({
        token,
        valueUSD,
        percentage: totalValueUSD > 0 ? (valueUSD / totalValueUSD) * 100 : 0,
      }))
      .sort((a, b) => b.valueUSD - a.valueUSD)
      .slice(0, 5);

    // Calculate risk distribution
    const riskDistribution = [
      { risk: 'low', count: 0, valueUSD: 0 },
      { risk: 'medium', count: 0, valueUSD: 0 },
      { risk: 'high', count: 0, valueUSD: 0 },
      { risk: 'critical', count: 0, valueUSD: 0 },
    ];

    positions.forEach(p => {
      const healthFactor = p.healthFactor || 3;
      let risk: string;
      if (healthFactor < 1.2) risk = 'critical';
      else if (healthFactor < 1.5) risk = 'high';
      else if (healthFactor < 2.0) risk = 'medium';
      else risk = 'low';

      const idx = riskDistribution.findIndex(r => r.risk === risk);
      if (idx >= 0) {
        riskDistribution[idx].count++;
        riskDistribution[idx].valueUSD += p.currentValueUSD;
      }
    });

    return {
      totalValueUSD,
      totalPositions: positions.length,
      chains,
      protocols,
      healthMetrics,
      recentAlerts,
      topHoldings,
      riskDistribution,
    };
  }

  // Get alerts for position
  getPositionAlerts(positionId: string): PositionAlert[] {
    return this.alerts.get(positionId) || [];
  }

  // Get all alerts for address
  getAllAlerts(address: string): PositionAlert[] {
    const positionIds = this.getPositions(address).map(p => p.id);
    const allAlerts: PositionAlert[] = [];
    
    positionIds.forEach(id => {
      const alerts = this.alerts.get(id) || [];
      allAlerts.push(...alerts);
    });

    return allAlerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string): PositionAlert | null {
    for (const [_, alerts] of this.alerts) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        return alert;
      }
    }
    return null;
  }

  // Get supported chains
  getSupportedChains(): string[] {
    return this.supportedChains;
  }

  // Get supported protocols
  getSupportedProtocols(): string[] {
    return this.supportedProtocols;
  }

  // Get global statistics
  getStats() {
    const allPositions = Array.from(this.positions.values());
    const totalValueUSD = allPositions.reduce((sum, p) => sum + p.currentValueUSD, 0);
    const totalRewards = allPositions.reduce((sum, p) => sum + p.pendingRewardsUSD, 0);
    
    return {
      totalPositions: allPositions.length,
      totalValueUSD,
      totalPendingRewardsUSD: totalRewards,
      chains: [...new Set(allPositions.map(p => p.chain))],
      protocols: [...new Set(allPositions.map(p => p.protocol))],
    };
  }
}
