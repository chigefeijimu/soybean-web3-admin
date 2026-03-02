import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface Alert {
  id: string;
  type: 'liquidation' | 'tvl_change' | 'yield_anomaly' | 'volatility' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  protocol: string;
  chain: string;
  title: string;
  description: string;
  value?: number;
  valueChange?: number;
  previousValue?: number;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  metadata?: Record<string, any>;
}

export interface AlertConfig {
  id?: string;
  alertType: string;
  protocol?: string;
  chain?: string;
  threshold: number;
  enabled: boolean;
  notifyEmail?: boolean;
  notifyTelegram?: boolean;
}

export interface ProtocolMetric {
  protocol: string;
  chain: string;
  tvl: number;
  tvlChange24h: number;
  yield: number;
  yieldChange24h: number;
  volume24h: number;
  activeUsers: number;
  timestamp: string;
}

@Injectable()
export class DefiAlertsService {
  private readonly logger = new Logger(DefiAlertsService.name);
  private alerts: Alert[] = [];
  private alertConfigs: AlertConfig[] = [];
  private metrics: ProtocolMetric[] = [];

  // Popular DeFi protocols to monitor
  private readonly monitoredProtocols = [
    { name: 'Aave', chain: 'ETH', category: 'Lending' },
    { name: 'Compound', chain: 'ETH', category: 'Lending' },
    { name: 'Uniswap', chain: 'ETH', category: 'DEX' },
    { name: 'Curve', chain: 'ETH', category: 'DEX' },
    { name: 'SushiSwap', chain: 'ETH', category: 'DEX' },
    { name: 'Lido', chain: 'ETH', category: 'Staking' },
    { name: 'Yearn', chain: 'ETH', category: 'Yield' },
    { name: 'Aave', chain: 'Polygon', category: 'Lending' },
    { name: 'QuickSwap', chain: 'Polygon', category: 'DEX' },
    { name: 'GMX', chain: 'Arbitrum', category: 'DEX' },
    { name: 'Trader Joe', chain: 'Avalanche', category: 'DEX' },
    { name: 'Benqi', chain: 'Avalanche', category: 'Lending' },
  ];

  constructor(private readonly httpService: HttpService) {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with some mock alerts
    this.alerts = [
      {
        id: 'alert-001',
        type: 'liquidation',
        severity: 'high',
        protocol: 'Aave',
        chain: 'ETH',
        title: 'Large Liquidation Detected',
        description: 'A large liquidation event was detected on Aave V3. Total liquidated: $2.4M',
        value: 2400000,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'active',
      },
      {
        id: 'alert-002',
        type: 'tvl_change',
        severity: 'medium',
        protocol: 'Uniswap',
        chain: 'ETH',
        title: 'TVL Drop Detected',
        description: 'Uniswap V3 TVL dropped by 8.5% in the last 24 hours',
        valueChange: -8.5,
        previousValue: 5200000000,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: 'active',
      },
      {
        id: 'alert-003',
        type: 'yield_anomaly',
        severity: 'high',
        protocol: 'Curve',
        chain: 'ETH',
        title: 'Yield Spike Detected',
        description: 'CRV-ETH pool yield increased by 45% in the last hour',
        value: 45,
        valueChange: 45,
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: 'acknowledged',
      },
      {
        id: 'alert-004',
        type: 'volatility',
        severity: 'low',
        protocol: 'Lido',
        chain: 'ETH',
        title: 'stETH Pool Activity Increased',
        description: 'stETH deposit/withdrawal volume increased by 35%',
        valueChange: 35,
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        status: 'resolved',
      },
      {
        id: 'alert-005',
        type: 'security',
        severity: 'critical',
        protocol: 'Compound',
        chain: 'ETH',
        title: 'Unusual Contract Interaction',
        description: 'Multiple large transfers detected from Compound treasury wallet',
        value: 15000000,
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: 'active',
      },
    ];

    // Initialize mock metrics
    this.metrics = this.monitoredProtocols.map((p, i) => ({
      protocol: p.name,
      chain: p.chain,
      tvl: Math.floor(Math.random() * 5000000000) + 100000000,
      tvlChange24h: (Math.random() - 0.5) * 20,
      yield: Math.random() * 15 + 1,
      yieldChange24h: (Math.random() - 0.5) * 30,
      volume24h: Math.floor(Math.random() * 1000000000) + 50000000,
      activeUsers: Math.floor(Math.random() * 50000) + 1000,
      timestamp: new Date().toISOString(),
    }));

    // Default alert configs
    this.alertConfigs = [
      {
        id: 'config-001',
        alertType: 'liquidation',
        threshold: 100000,
        enabled: true,
        notifyEmail: true,
        notifyTelegram: true,
      },
      {
        id: 'config-002',
        alertType: 'tvl_change',
        threshold: 10,
        enabled: true,
        notifyEmail: false,
        notifyTelegram: true,
      },
      {
        id: 'config-003',
        alertType: 'yield_anomaly',
        threshold: 25,
        enabled: true,
        notifyEmail: true,
        notifyTelegram: false,
      },
    ];
  }

  async getAlerts(type?: string, status?: string): Promise<Alert[]> {
    let filtered = [...this.alerts];
    
    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }
    
    return filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return this.alerts.find(a => a.id === id) || null;
  }

  async createAlertConfig(config: AlertConfig): Promise<AlertConfig> {
    const newConfig: AlertConfig = {
      ...config,
      id: `config-${Date.now()}`,
    };
    this.alertConfigs.push(newConfig);
    return newConfig;
  }

  async getAlertConfigs(): Promise<AlertConfig[]> {
    return this.alertConfigs;
  }

  async disableAlertConfig(id: string): Promise<AlertConfig | null> {
    const config = this.alertConfigs.find(c => c.id === id);
    if (config) {
      config.enabled = false;
    }
    return config || null;
  }

  async getMonitoredProtocols(): Promise<any[]> {
    return this.monitoredProtocols;
  }

  async getProtocolMetrics(name: string): Promise<ProtocolMetric | null> {
    return this.metrics.find(m => m.protocol.toLowerCase() === name.toLowerCase()) || null;
  }

  async getAllMetrics(chain?: string): Promise<ProtocolMetric[]> {
    let filtered = [...this.metrics];
    if (chain) {
      filtered = filtered.filter(m => m.chain.toLowerCase() === chain.toLowerCase());
    }
    return filtered;
  }

  async getLiquidationEvents(minAmount: number = 10000): Promise<any[]> {
    // Generate mock liquidation events
    const events = [];
    const protocols = ['Aave V2', 'Aave V3', 'Compound', 'Morpho', 'Liquity'];
    const collateralTypes = ['WBTC', 'ETH', 'USDC', 'DAI', 'USDT'];
    
    for (let i = 0; i < 10; i++) {
      const amount = Math.floor(Math.random() * 5000000) + minAmount;
      const collateral = collateralTypes[Math.floor(Math.random() * collateralTypes.length)];
      
      events.push({
        id: `liq-${i + 1}`,
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        chain: 'ETH',
        borrower: `0x${Math.random().toString(16).slice(2, 42)}`,
        collateralType: collateral,
        collateralAmount: (Math.random() * 100 + 10).toFixed(2),
        debtRepaid: amount.toFixed(2),
        liquidator: `0x${Math.random().toString(16).slice(2, 42)}`,
        timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString(),
        gasUsed: Math.floor(Math.random() * 200000) + 50000,
      });
    }
    
    return events.sort((a, b) => parseFloat(b.debtRepaid) - parseFloat(a.debtRepaid));
  }

  async getTVLChanges(threshold: number = 10): Promise<any[]> {
    const changes = this.metrics
      .filter(m => Math.abs(m.tvlChange24h) >= threshold)
      .map(m => ({
        protocol: m.protocol,
        chain: m.chain,
        tvl: m.tvl,
        tvlChange24h: m.tvlChange24h,
        direction: m.tvlChange24h > 0 ? 'up' : 'down',
        severity: Math.abs(m.tvlChange24h) > 20 ? 'high' : 'medium',
        timestamp: m.timestamp,
      }));
    
    return changes.sort((a, b) => Math.abs(b.tvlChange24h) - Math.abs(a.tvlChange24h));
  }

  async getYieldAnomalies(): Promise<any[]> {
    const anomalies = this.metrics
      .filter(m => Math.abs(m.yieldChange24h) > 20)
      .map(m => ({
        protocol: m.protocol,
        chain: m.chain,
        currentYield: m.yield,
        yieldChange24h: m.yieldChange24h,
        direction: m.yieldChange24h > 0 ? 'up' : 'down',
        severity: Math.abs(m.yieldChange24h) > 40 ? 'high' : 'medium',
        possibleReasons: this.getYieldAnomalyReasons(m.yieldChange24h),
        timestamp: m.timestamp,
      }));
    
    return anomalies;
  }

  private getYieldAnomalyReasons(change: number): string[] {
    const reasons = [];
    if (change > 0) {
      reasons.push('Increased trading volume');
      reasons.push('Liquidity incentive programs');
      reasons.push('Market volatility');
    } else {
      reasons.push('Reduced trading activity');
      reasons.push('Large withdrawals');
      reasons.push('Impermanent loss');
    }
    return reasons;
  }

  async getDashboard(): Promise<any> {
    const activeAlerts = this.alerts.filter(a => a.status === 'active');
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    
    const alertStats = {
      total: this.alerts.length,
      active: activeAlerts.length,
      critical: criticalAlerts.length,
      byType: {
        liquidation: this.alerts.filter(a => a.type === 'liquidation').length,
        tvl_change: this.alerts.filter(a => a.type === 'tvl_change').length,
        yield_anomaly: this.alerts.filter(a => a.type === 'yield_anomaly').length,
        volatility: this.alerts.filter(a => a.type === 'volatility').length,
        security: this.alerts.filter(a => a.type === 'security').length,
      },
    };

    const protocolStats = this.metrics.slice(0, 10).map(m => ({
      name: m.protocol,
      chain: m.chain,
      tvl: m.tvl,
      tvlChange24h: m.tvlChange24h.toFixed(2),
      yield: m.yield.toFixed(2),
    }));

    const recentAlerts = this.alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return {
      alertStats,
      protocolStats,
      recentAlerts,
      monitoredProtocols: this.monitoredProtocols.length,
      timestamp: new Date().toISOString(),
    };
  }

  async acknowledgeAlert(id: string): Promise<Alert | null> {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'acknowledged';
    }
    return alert || null;
  }

  async clearOldAlerts(daysOld: number): Promise<{ deleted: number }> {
    const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter(a => 
      new Date(a.timestamp).getTime() > cutoff || a.status !== 'resolved'
    );
    return { deleted: initialLength - this.alerts.length };
  }
}
