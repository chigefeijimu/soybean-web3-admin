import { Injectable } from '@nestjs/common';

export interface LiquidationOpportunity {
  id: string;
  address: string;
  protocol: string;
  chain: string;
  collateralType: string;
  collateralAmount: number;
  collateralValueUsd: number;
  debtAmount: number;
  debtValueUsd: number;
  healthFactor: number;
  liquidationThreshold: number;
  liquidationIncentive: number;
  potentialProfit: number;
  gasCost: number;
  estimatedProfit: number;
  timestamp: number;
}

export interface PositionHealth {
  address: string;
  protocol: string;
  chain: string;
  healthFactor: number;
  status: 'healthy' | 'warning' | 'danger' | 'liquidated';
  collateral: {
    token: string;
    amount: number;
    valueUsd: number;
  }[];
  debt: {
    token: string;
    amount: number;
    valueUsd: number;
  }[];
  liquidationPrice: number;
  marginCallPrice: number;
  lastUpdated: number;
}

export interface LiquidationAlert {
  id: string;
  type: 'liquidation' | 'margin_call' | 'health_warning' | 'position_closed';
  address: string;
  protocol: string;
  chain: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  healthFactor?: number;
  collateralValue?: number;
  debtValue?: number;
  timestamp: number;
  read: boolean;
}

export interface LiquidationStats {
  totalValueAtRisk: number;
  totalLiquidationValue: number;
  activePositions: number;
  warningPositions: number;
  dangerPositions: number;
  chainDistribution: { chain: string; count: number; value: number }[];
  protocolDistribution: { protocol: string; count: number; value: number }[];
  recentLiquidations: LiquidationOpportunity[];
  avgHealthFactor: number;
}

@Injectable()
export class LiquidationScannerService {
  private readonly monitoredPositions: Map<string, PositionHealth> = new Map();
  private readonly alerts: LiquidationAlert[] = [];
  private readonly opportunities: LiquidationOpportunity[] = [];

  private readonly supportedProtocols = [
    { name: 'Aave', chain: 'ethereum', version: 'V3' },
    { name: 'Aave', chain: 'polygon', version: 'V3' },
    { name: 'Aave', chain: 'arbitrum', version: 'V3' },
    { name: 'Aave', chain: 'optimism', version: 'V3' },
    { name: 'Compound', chain: 'ethereum', version: 'V3' },
    { name: 'Compound', chain: 'polygon', version: 'V3' },
    { name: 'Liquity', chain: 'ethereum', version: 'V2' },
    { name: 'MakerDAO', chain: 'ethereum', version: 'V2' },
    { name: 'Morpho', chain: 'ethereum', version: 'V2' },
    { name: 'Yearn', chain: 'ethereum', version: 'V3' },
  ];

  private readonly supportedChains = [
    { id: 1, name: 'ethereum', symbol: 'ETH' },
    { id: 137, name: 'polygon', symbol: 'MATIC' },
    { id: 42161, name: 'arbitrum', symbol: 'ETH' },
    { id: 10, name: 'optimism', symbol: 'ETH' },
    { id: 8453, name: 'base', symbol: 'ETH' },
    { id: 43114, name: 'avalanche', symbol: 'AVAX' },
  ];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with mock positions for demo
    const mockPositions: PositionHealth[] = [
      {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f12eB1',
        protocol: 'Aave',
        chain: 'ethereum',
        healthFactor: 1.05,
        status: 'danger',
        collateral: [
          { token: 'ETH', amount: 15.5, valueUsd: 48500 },
          { token: 'WBTC', amount: 1.2, valueUsd: 72000 },
        ],
        debt: [
          { token: 'USDC', amount: 85000, valueUsd: 85000 },
          { token: 'ETH', amount: 5.2, valueUsd: 16276 },
        ],
        liquidationPrice: 1850,
        marginCallPrice: 2100,
        lastUpdated: Date.now(),
      },
      {
        address: '0x9f3B97C51a6e4E8Fa8e77dB34ED54d8eA6eEa7F2',
        protocol: 'Compound',
        chain: 'ethereum',
        healthFactor: 1.25,
        status: 'warning',
        collateral: [
          { token: 'ETH', amount: 25.0, valueUsd: 78125 },
          { token: 'USDC', amount: 10000, valueUsd: 10000 },
        ],
        debt: [
          { token: 'USDC', amount: 50000, valueUsd: 50000 },
        ],
        liquidationPrice: 1650,
        marginCallPrice: 1950,
        lastUpdated: Date.now(),
      },
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        protocol: 'Aave',
        chain: 'polygon',
        healthFactor: 1.45,
        status: 'healthy',
        collateral: [
          { token: 'MATIC', amount: 50000, valueUsd: 45000 },
          { token: 'USDC', amount: 20000, valueUsd: 20000 },
        ],
        debt: [
          { token: 'USDC', amount: 35000, valueUsd: 35000 },
        ],
        liquidationPrice: 0.55,
        marginCallPrice: 0.72,
        lastUpdated: Date.now(),
      },
      {
        address: '0xABc123DEF456GHI789JKL012MNO345PQR678STU',
        protocol: 'Liquity',
        chain: 'ethereum',
        healthFactor: 1.08,
        status: 'danger',
        collateral: [
          { token: 'ETH', amount: 8.5, valueUsd: 26588 },
        ],
        debt: [
          { token: 'LUSD', amount: 18000, valueUsd: 17820 },
        ],
        liquidationPrice: 1920,
        marginCallPrice: 2180,
        lastUpdated: Date.now(),
      },
      {
        address: '0xDef4567890Abc123Def4567890Abc123Def45678',
        protocol: 'Compound',
        chain: 'arbitrum',
        healthFactor: 1.12,
        status: 'warning',
        collateral: [
          { token: 'ARB', amount: 15000, valueUsd: 22500 },
          { token: 'ETH', amount: 3.5, valueUsd: 10955 },
        ],
        debt: [
          { token: 'USDC', amount: 25000, valueUsd: 25000 },
        ],
        liquidationPrice: 2100,
        marginCallPrice: 2450,
        lastUpdated: Date.now(),
      },
      {
        address: '0x7890123456AbCdEf7890123456AbCdEf78901234',
        protocol: 'Aave',
        chain: 'optimism',
        healthFactor: 1.68,
        status: 'healthy',
        collateral: [
          { token: 'OP', amount: 8000, valueUsd: 24000 },
          { token: 'ETH', amount: 10.0, valueUsd: 31250 },
        ],
        debt: [
          { token: 'USDC', amount: 30000, valueUsd: 30000 },
        ],
        liquidationPrice: 2300,
        marginCallPrice: 2800,
        lastUpdated: Date.now(),
      },
      {
        address: '0xABCdef123456GHI789JKL012MNO345PQR678STU90',
        protocol: 'Morpho',
        chain: 'ethereum',
        healthFactor: 0.98,
        status: 'liquidated',
        collateral: [
          { token: 'WBTC', amount: 0.8, valueUsd: 48000 },
        ],
        debt: [
          { token: 'USDC', amount: 40000, valueUsd: 40000 },
        ],
        liquidationPrice: 35000,
        marginCallPrice: 42000,
        lastUpdated: Date.now() - 86400000,
      },
      {
        address: '0x5678901234AbCdEf5678901234AbCdEf56789012',
        protocol: 'Aave',
        chain: 'base',
        healthFactor: 1.32,
        status: 'healthy',
        collateral: [
          { token: 'ETH', amount: 5.0, valueUsd: 15625 },
          { token: 'CBETH', amount: 8.0, valueUsd: 24000 },
        ],
        debt: [
          { token: 'USDC', amount: 22000, valueUsd: 22000 },
        ],
        liquidationPrice: 1950,
        marginCallPrice: 2350,
        lastUpdated: Date.now(),
      },
    ];

    mockPositions.forEach(p => {
      this.monitoredPositions.set(p.address.toLowerCase(), p);
      if (p.healthFactor < 1.1) {
        this.alerts.push({
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: p.healthFactor < 1 ? 'liquidation' : 'health_warning',
          address: p.address,
          protocol: p.protocol,
          chain: p.chain,
          severity: p.healthFactor < 1 ? 'critical' : 'high',
          message: `${p.protocol} position at ${p.address.slice(0, 6)}... has health factor ${p.healthFactor.toFixed(2)}`,
          healthFactor: p.healthFactor,
          collateralValue: p.collateral.reduce((sum, c) => sum + c.valueUsd, 0),
          debtValue: p.debt.reduce((sum, d) => sum + d.valueUsd, 0),
          timestamp: Date.now() - Math.random() * 86400000,
          read: Math.random() > 0.5,
        });
      }
    });

    // Generate liquidation opportunities
    this.generateLiquidationOpportunities();
  }

  private generateLiquidationOpportunities() {
    const positions = Array.from(this.monitoredPositions.values())
      .filter(p => p.healthFactor < 1.1);

    positions.forEach(pos => {
      const collateralValue = pos.collateral.reduce((sum, c) => sum + c.valueUsd, 0);
      const debtValue = pos.debt.reduce((sum, d) => sum + d.valueUsd, 0);
      const liquidationIncentive = 0.05; // 5% incentive
      const gasCost = 0.008 * 3000; // ~0.008 ETH gas at 3000 gwei
      const potentialProfit = collateralValue * liquidationIncentive;
      const estimatedProfit = potentialProfit - gasCost;

      this.opportunities.push({
        id: `opp-${pos.address.slice(-8)}-${Date.now()}`,
        address: pos.address,
        protocol: pos.protocol,
        chain: pos.chain,
        collateralType: pos.collateral[0]?.token || 'UNKNOWN',
        collateralAmount: pos.collateral[0]?.amount || 0,
        collateralValueUsd: collateralValue,
        debtAmount: pos.debt.reduce((sum, d) => sum + d.amount, 0),
        debtValueUsd: debtValue,
        healthFactor: pos.healthFactor,
        liquidationThreshold: 1.0,
        liquidationIncentive: liquidationIncentive * 100,
        potentialProfit,
        gasCost,
        estimatedProfit,
        timestamp: Date.now(),
      });
    });
  }

  getLiquidationOpportunities(
    chain?: string,
    protocol?: string,
    minCollateral?: number,
    limit: number = 20,
  ): LiquidationOpportunity[] {
    let result = [...this.opportunities];

    if (chain) {
      result = result.filter(o => o.chain.toLowerCase() === chain.toLowerCase());
    }
    if (protocol) {
      result = result.filter(o => o.protocol.toLowerCase() === protocol.toLowerCase());
    }
    if (minCollateral) {
      result = result.filter(o => o.collateralValueUsd >= minCollateral);
    }

    return result
      .sort((a, b) => b.estimatedProfit - a.estimatedProfit)
      .slice(0, limit);
  }

  getOpportunitiesByAddress(address: string): LiquidationOpportunity[] {
    return this.opportunities.filter(
      o => o.address.toLowerCase() === address.toLowerCase()
    );
  }

  getPositionsByAddress(address: string): PositionHealth | null {
    return this.monitoredPositions.get(address.toLowerCase()) || null;
  }

  getAllPositions(protocol?: string, chain?: string): PositionHealth[] {
    let result = Array.from(this.monitoredPositions.values());

    if (protocol) {
      result = result.filter(p => p.protocol.toLowerCase() === protocol.toLowerCase());
    }
    if (chain) {
      result = result.filter(p => p.chain.toLowerCase() === chain.toLowerCase());
    }

    return result;
  }

  getPositionDetails(address: string): PositionHealth | null {
    const position = this.monitoredPositions.get(address.toLowerCase());
    if (!position) return null;

    const collateralValue = position.collateral.reduce((sum, c) => sum + c.valueUsd, 0);
    const debtValue = position.debt.reduce((sum, d) => sum + d.valueUsd, 0);
    const maxLiquidation = debtValue * 1.05; // 5% bonus

    return {
      ...position,
      liquidationPrice: debtValue / (position.collateral[0]?.amount || 1) * 1.05,
      marginCallPrice: debtValue / (position.collateral[0]?.amount || 1) * 1.25,
    };
  }

  addPositionToMonitor(address: string, protocol?: string, chain: string = 'ethereum'): PositionHealth {
    const existing = this.monitoredPositions.get(address.toLowerCase());
    if (existing) return existing;

    // Create new position with default values
    const newPosition: PositionHealth = {
      address: address.toLowerCase(),
      protocol: protocol || 'Unknown',
      chain,
      healthFactor: 2.0,
      status: 'healthy',
      collateral: [],
      debt: [],
      liquidationPrice: 0,
      marginCallPrice: 0,
      lastUpdated: Date.now(),
    };

    this.monitoredPositions.set(address.toLowerCase(), newPosition);
    return newPosition;
  }

  removePositionFromMonitor(address: string): boolean {
    return this.monitoredPositions.delete(address.toLowerCase());
  }

  getMonitoredPositions(): PositionHealth[] {
    return Array.from(this.monitoredPositions.values());
  }

  getAlerts(limit: number = 20, address?: string): LiquidationAlert[] {
    let result = [...this.alerts].sort((a, b) => b.timestamp - a.timestamp);

    if (address) {
      result = result.filter(a => a.address.toLowerCase() === address.toLowerCase());
    }

    return result.slice(0, limit);
  }

  getLiquidationStats(): LiquidationStats {
    const positions = Array.from(this.monitoredPositions.values());
    
    const totalValueAtRisk = positions
      .filter(p => p.healthFactor < 1.25)
      .reduce((sum, p) => sum + p.collateral.reduce((s, c) => s + c.valueUsd, 0), 0);

    const totalLiquidationValue = positions
      .filter(p => p.healthFactor < 1.1)
      .reduce((sum, p) => sum + p.collateral.reduce((s, c) => s + c.valueUsd, 0), 0);

    const chainMap = new Map<string, { count: number; value: number }>();
    const protocolMap = new Map<string, { count: number; value: number }>();

    positions.forEach(p => {
      const value = p.collateral.reduce((s, c) => s + c.valueUsd, 0);
      
      const chainStats = chainMap.get(p.chain) || { count: 0, value: 0 };
      chainStats.count++;
      chainStats.value += value;
      chainMap.set(p.chain, chainStats);

      const protocolStats = protocolMap.get(p.protocol) || { count: 0, value: 0 };
      protocolStats.count++;
      protocolStats.value += value;
      protocolMap.set(p.protocol, protocolStats);
    });

    return {
      totalValueAtRisk,
      totalLiquidationValue,
      activePositions: positions.length,
      warningPositions: positions.filter(p => p.status === 'warning').length,
      dangerPositions: positions.filter(p => p.status === 'danger').length,
      chainDistribution: Array.from(chainMap.entries()).map(([chain, stats]) => ({
        chain,
        ...stats,
      })),
      protocolDistribution: Array.from(protocolMap.entries()).map(([protocol, stats]) => ({
        protocol,
        ...stats,
      })),
      recentLiquidations: this.opportunities.slice(0, 5),
      avgHealthFactor: positions.reduce((sum, p) => sum + p.healthFactor, 0) / positions.length,
    };
  }

  getSupportedProtocols() {
    return this.supportedProtocols;
  }

  getSupportedChains() {
    return this.supportedChains;
  }

  getHealthDistribution(chain?: string): { range: string; count: number }[] {
    const positions = Array.from(this.monitoredPositions.values());
    
    if (chain) {
      positions.filter(p => p.chain.toLowerCase() === chain.toLowerCase());
    }

    const ranges = [
      { range: '< 1.0 (Critical)', count: 0 },
      { range: '1.0 - 1.25 (Danger)', count: 0 },
      { range: '1.25 - 1.5 (Warning)', count: 0 },
      { range: '1.5 - 2.0 (Healthy)', count: 0 },
      { range: '> 2.0 (Very Healthy)', count: 0 },
    ];

    positions.forEach(p => {
      if (p.healthFactor < 1) ranges[0].count++;
      else if (p.healthFactor < 1.25) ranges[1].count++;
      else if (p.healthFactor < 1.5) ranges[2].count++;
      else if (p.healthFactor < 2.0) ranges[3].count++;
      else ranges[4].count++;
    });

    return ranges;
  }

  getHistoricalLiquidations(chain?: string, days: number = 7): { date: string; count: number; value: number }[] {
    const result: { date: string; count: number; value: number }[] = [];
    const now = Date.now();
    const dayMs = 86400000;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * dayMs);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate mock historical data
      result.push({
        date: dateStr,
        count: Math.floor(Math.random() * 20) + 5,
        value: Math.floor(Math.random() * 500000) + 100000,
      });
    }

    if (chain) {
      return result.map((r: { date: string; count: number; value: number }) => ({
        ...r,
        value: r.value * (Math.random() * 0.5 + 0.5),
      }));
    }

    return result;
  }

  calculateLiquidationProfit(address: string, gasPrice?: number): {
    address: string;
    profitable: boolean;
    estimatedProfit: number;
    gasCost: number;
    collateralValue: number;
    debtValue: number;
    incentive: number;
  } | null {
    const position = this.monitoredPositions.get(address.toLowerCase());
    if (!position) return null;

    const collateralValue = position.collateral.reduce((sum, c) => sum + c.valueUsd, 0);
    const debtValue = position.debt.reduce((sum, d) => sum + d.valueUsd, 0);
    const gasCost = (gasPrice || 3000) * 21000 / 1e9 * 3000 / 1e9 * 3000; // Simplified gas calculation
    const incentive = collateralValue * 0.05;
    const estimatedProfit = incentive - gasCost;

    return {
      address,
      profitable: estimatedProfit > 0,
      estimatedProfit,
      gasCost,
      collateralValue,
      debtValue,
      incentive,
    };
  }
}
