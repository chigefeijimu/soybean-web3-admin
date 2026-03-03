import { Injectable } from '@nestjs/common';

export interface LiquidationPosition {
  id: string;
  address: string;
  chain: string;
  protocol: string;
  collateralToken: string;
  debtToken: string;
  collateralValue: number;
  debtValue: number;
  healthFactor: number;
  liquidationThreshold: number;
  riskLevel: 'safe' | 'warning' | 'danger' | 'critical';
  estimatedLiquidationBonus: number;
  lastUpdated: string;
}

export interface AlertSubscription {
  id: string;
  address: string;
  chains: string[];
  protocols: string[];
  healthFactorThreshold: number;
  webhookUrl?: string;
  email?: string;
  telegram?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AlertTrigger {
  id: string;
  subscriptionId: string;
  address: string;
  chain: string;
  protocol: string;
  healthFactor: number;
  triggeredAt: string;
  notified: boolean;
  notificationMethod: 'webhook' | 'email' | 'telegram';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

const SUPPORTED_CHAINS = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche'];
const SUPPORTED_PROTOCOLS = ['aave', 'compound', 'liquity', 'morpho'];

@Injectable()
export class LiquidationAlertApiService {
  private positions: Map<string, LiquidationPosition[]> = new Map();
  private subscriptions: Map<string, AlertSubscription> = new Map();
  private triggers: AlertTrigger[] = [];
  
  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Generate mock liquidation positions for demonstration
    const mockPositions: LiquidationPosition[] = [
      {
        id: 'pos-001',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
        chain: 'ethereum',
        protocol: 'aave',
        collateralToken: 'ETH',
        debtToken: 'USDC',
        collateralValue: 125000,
        debtValue: 85000,
        healthFactor: 1.15,
        liquidationThreshold: 1.0,
        riskLevel: 'warning',
        estimatedLiquidationBonus: 4250,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'pos-002',
        address: '0x9f8F72aA9304c8B593d555F12eF6589cC4BAb85',
        chain: 'polygon',
        protocol: 'aave',
        collateralToken: 'MATIC',
        debtToken: 'USDT',
        collateralValue: 45000,
        debtValue: 42000,
        healthFactor: 0.92,
        liquidationThreshold: 1.0,
        riskLevel: 'danger',
        estimatedLiquidationBonus: 2100,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'pos-003',
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        chain: 'arbitrum',
        protocol: 'compound',
        collateralToken: 'WBTC',
        debtToken: 'ETH',
        collateralValue: 280000,
        debtValue: 195000,
        healthFactor: 1.18,
        liquidationThreshold: 1.0,
        riskLevel: 'warning',
        estimatedLiquidationBonus: 14000,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'pos-004',
        address: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA',
        chain: 'optimism',
        protocol: 'aave',
        collateralToken: 'OP',
        debtToken: 'DAI',
        collateralValue: 32000,
        debtValue: 30000,
        healthFactor: 0.85,
        liquidationThreshold: 1.0,
        riskLevel: 'critical',
        estimatedLiquidationBonus: 1500,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'pos-005',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chain: 'base',
        protocol: 'aave',
        collateralToken: 'ETH',
        debtToken: 'USDC',
        collateralValue: 180000,
        debtValue: 120000,
        healthFactor: 1.25,
        liquidationThreshold: 1.0,
        riskLevel: 'safe',
        estimatedLiquidationBonus: 9000,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'pos-006',
        address: '0xB4e16d0168e5234c70A95A4b9e2a0B7dC7e7b5e',
        chain: 'avalanche',
        protocol: 'aave',
        collateralToken: 'AVAX',
        debtToken: 'USDC',
        collateralValue: 65000,
        debtValue: 58000,
        healthFactor: 0.95,
        liquidationThreshold: 1.0,
        riskLevel: 'danger',
        estimatedLiquidationBonus: 2900,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'pos-007',
        address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        chain: 'ethereum',
        protocol: 'liquity',
        collateralToken: 'ETH',
        debtToken: 'LUSD',
        collateralValue: 95000,
        debtValue: 88000,
        healthFactor: 0.88,
        liquidationThreshold: 1.1,
        riskLevel: 'critical',
        estimatedLiquidationBonus: 4750,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'pos-008',
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        chain: 'polygon',
        protocol: 'morpho',
        collateralToken: 'MATIC',
        debtToken: 'USDC',
        collateralValue: 72000,
        debtValue: 65000,
        healthFactor: 0.98,
        liquidationThreshold: 1.0,
        riskLevel: 'danger',
        estimatedLiquidationBonus: 3250,
        lastUpdated: new Date().toISOString(),
      },
    ];

    this.positions.set('all', mockPositions);
    SUPPORTED_CHAINS.forEach(chain => {
      this.positions.set(chain, mockPositions.filter(p => p.chain === chain));
    });
    SUPPORTED_PROTOCOLS.forEach(protocol => {
      this.positions.set(protocol, mockPositions.filter(p => p.protocol === protocol));
    });
  }

  // Get liquidation positions with filtering
  async getPositions(params: {
    chain?: string;
    protocol?: string;
    riskLevel?: string;
    minHealthFactor?: number;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ positions: LiquidationPosition[]; total: number }>> {
    let positions = this.positions.get('all') || [];
    
    if (params.chain && SUPPORTED_CHAINS.includes(params.chain.toLowerCase())) {
      positions = positions.filter(p => p.chain === params.chain?.toLowerCase());
    }
    
    if (params.protocol && SUPPORTED_PROTOCOLS.includes(params.protocol.toLowerCase())) {
      positions = positions.filter(p => p.protocol === params.protocol?.toLowerCase());
    }
    
    if (params.riskLevel) {
      positions = positions.filter(p => p.riskLevel === params.riskLevel.toLowerCase());
    }
    
    if (params.minHealthFactor !== undefined) {
      positions = positions.filter(p => p.healthFactor <= params.minHealthFactor);
    }
    
    const total = positions.length;
    const offset = params.offset || 0;
    const limit = params.limit || 20;
    const paginatedPositions = positions.slice(offset, offset + limit);

    return {
      success: true,
      data: {
        positions: paginatedPositions,
        total,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Get position by address
  async getPositionByAddress(address: string, chain?: string): Promise<ApiResponse<LiquidationPosition[]>> {
    let positions = this.positions.get('all') || [];
    positions = positions.filter(p => p.address.toLowerCase() === address.toLowerCase());
    
    if (chain) {
      positions = positions.filter(p => p.chain === chain.toLowerCase());
    }

    return {
      success: true,
      data: positions,
      timestamp: new Date().toISOString(),
    };
  }

  // Get liquidation opportunities (high risk positions)
  async getLiquidationOpportunities(params: {
    chain?: string;
    protocol?: string;
    limit?: number;
  }): Promise<ApiResponse<{ opportunities: LiquidationPosition[]; totalValue: number }>> {
    let positions = (this.positions.get('all') || [])
      .filter(p => p.riskLevel === 'danger' || p.riskLevel === 'critical');

    if (params.chain && SUPPORTED_CHAINS.includes(params.chain.toLowerCase())) {
      positions = positions.filter(p => p.chain === params.chain?.toLowerCase());
    }

    if (params.protocol && SUPPORTED_PROTOCOLS.includes(params.protocol.toLowerCase())) {
      positions = positions.filter(p => p.protocol === params.protocol?.toLowerCase());
    }

    const limit = params.limit || 10;
    const opportunities = positions.slice(0, limit);
    const totalValue = opportunities.reduce((sum, p) => sum + p.collateralValue, 0);

    return {
      success: true,
      data: {
        opportunities,
        totalValue,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Create alert subscription
  async createSubscription(data: {
    address: string;
    chains?: string[];
    protocols?: string[];
    healthFactorThreshold?: number;
    webhookUrl?: string;
    email?: string;
    telegram?: string;
  }): Promise<ApiResponse<AlertSubscription>> {
    const id = `sub-${Date.now()}`;
    const subscription: AlertSubscription = {
      id,
      address: data.address,
      chains: data.chains || SUPPORTED_CHAINS,
      protocols: data.protocols || SUPPORTED_PROTOCOLS,
      healthFactorThreshold: data.healthFactorThreshold || 1.2,
      webhookUrl: data.webhookUrl,
      email: data.email,
      telegram: data.telegram,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    this.subscriptions.set(id, subscription);

    return {
      success: true,
      data: subscription,
      timestamp: new Date().toISOString(),
    };
  }

  // Get subscriptions by address
  async getSubscriptions(address: string): Promise<ApiResponse<AlertSubscription[]>> {
    const subscriptions = Array.from(this.subscriptions.values())
      .filter(s => s.address.toLowerCase() === address.toLowerCase());

    return {
      success: true,
      data: subscriptions,
      timestamp: new Date().toISOString(),
    };
  }

  // Update subscription
  async updateSubscription(id: string, data: Partial<AlertSubscription>): Promise<ApiResponse<AlertSubscription>> {
    const subscription = this.subscriptions.get(id);
    
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription not found',
        timestamp: new Date().toISOString(),
      };
    }

    const updated = { ...subscription, ...data };
    this.subscriptions.set(id, updated);

    return {
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    };
  }

  // Delete subscription
  async deleteSubscription(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const existed = this.subscriptions.has(id);
    this.subscriptions.delete(id);

    return {
      success: true,
      data: { deleted: existed },
      timestamp: new Date().toISOString(),
    };
  }

  // Get triggered alerts
  async getAlerts(params: {
    subscriptionId?: string;
    address?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ alerts: AlertTrigger[]; total: number }>> {
    let alerts = [...this.triggers];

    if (params.subscriptionId) {
      alerts = alerts.filter(a => a.subscriptionId === params.subscriptionId);
    }

    if (params.address) {
      alerts = alerts.filter(a => a.address.toLowerCase() === params.address?.toLowerCase());
    }

    if (params.from) {
      alerts = alerts.filter(a => new Date(a.triggeredAt) >= new Date(params.from!));
    }

    if (params.to) {
      alerts = alerts.filter(a => new Date(a.triggeredAt) <= new Date(params.to!));
    }

    const total = alerts.length;
    const offset = params.offset || 0;
    const limit = params.limit || 20;

    return {
      success: true,
      data: {
        alerts: alerts.slice(offset, offset + limit),
        total,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Get market statistics
  async getMarketStats(): Promise<ApiResponse<{
    totalPositions: number;
    atRiskPositions: number;
    totalCollateralValue: number;
    totalDebtValue: number;
    chainDistribution: Record<string, number>;
    protocolDistribution: Record<string, number>;
    riskDistribution: Record<string, number>;
  }>> {
    const positions = this.positions.get('all') || [];
    
    const totalPositions = positions.length;
    const atRiskPositions = positions.filter(p => p.riskLevel !== 'safe').length;
    const totalCollateralValue = positions.reduce((sum, p) => sum + p.collateralValue, 0);
    const totalDebtValue = positions.reduce((sum, p) => sum + p.debtValue, 0);

    const chainDistribution: Record<string, number> = {};
    const protocolDistribution: Record<string, number> = {};
    const riskDistribution: Record<string, number> = { safe: 0, warning: 0, danger: 0, critical: 0 };

    positions.forEach(p => {
      chainDistribution[p.chain] = (chainDistribution[p.chain] || 0) + 1;
      protocolDistribution[p.protocol] = (protocolDistribution[p.protocol] || 0) + 1;
      riskDistribution[p.riskLevel]++;
    });

    return {
      success: true,
      data: {
        totalPositions,
        atRiskPositions,
        totalCollateralValue,
        totalDebtValue,
        chainDistribution,
        protocolDistribution,
        riskDistribution,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Get supported chains and protocols
  async getSupportedNetworks(): Promise<ApiResponse<{
    chains: string[];
    protocols: string[];
  }>> {
    return {
      success: true,
      data: {
        chains: SUPPORTED_CHAINS,
        protocols: SUPPORTED_PROTOCOLS,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
