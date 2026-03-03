import { Injectable } from '@nestjs/common';

interface Protocol {
  id: string;
  name: string;
  chain: string;
  category: string;
  healthScore: number;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdate: number;
  metrics: ProtocolMetrics;
  anomalies: Anomaly[];
}

interface ProtocolMetrics {
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  users24h: number;
  usersChange24h: number;
  revenue24h: number;
  revenueChange24h: number;
  gasUsage24h: number;
  transactionCount24h: number;
}

interface Anomaly {
  id: string;
  protocolId: string;
  protocolName: string;
  type: 'tvl' | 'volume' | 'users' | 'revenue' | 'gas' | 'transactions';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  expectedValue: number;
  deviation: number;
  timestamp: number;
  acknowledged: boolean;
}

interface Alert {
  id: string;
  protocolId: string;
  condition: string;
  threshold: number;
  triggered: boolean;
  lastTriggered?: number;
}

@Injectable()
export class DefiAnomalyDetectorService {
  private protocols: Map<string, Protocol> = new Map();
  private anomalies: Anomaly[] = [];
  private alerts: Alert[] = [];

  constructor() {
    this.initializeProtocols();
  }

  private initializeProtocols() {
    const protocolData = [
      { id: 'uniswap-v3', name: 'Uniswap V3', chain: 'ethereum', category: 'DEX' },
      { id: 'aave-v3', name: 'Aave V3', chain: 'ethereum', category: 'Lending' },
      { id: 'curve', name: 'Curve', chain: 'ethereum', category: 'DEX' },
      { id: 'lido', name: 'Lido', chain: 'ethereum', category: 'Liquid Staking' },
      { id: 'compound-v3', name: 'Compound V3', chain: 'ethereum', category: 'Lending' },
      { id: 'yearn', name: 'Yearn', chain: 'ethereum', category: 'Yield' },
      { id: 'balancer', name: 'Balancer', chain: 'ethereum', category: 'DEX' },
      { id: 'sushiswap', name: 'SushiSwap', chain: 'ethereum', category: 'DEX' },
      { id: 'morpho', name: 'Morpho', chain: 'ethereum', category: 'Lending' },
      { id: 'gearbox', name: 'Gearbox', chain: 'ethereum', category: 'Lending' },
      { id: 'pendle', name: 'Pendle', chain: 'ethereum', category: 'Yield' },
      { id: 'convex', name: 'Convex', chain: 'ethereum', category: 'Yield' },
      { id: 'gnosis', name: 'Gnosis', chain: 'gnosis', category: 'DEX' },
      { id: 'aerodrome', name: 'Aerodrome', chain: 'base', category: 'DEX' },
      { id: 'velodrome', name: 'Velodrome', chain: 'optimism', category: 'DEX' },
      { id: 'pancakeswap', name: 'PancakeSwap', chain: 'bsc', category: 'DEX' },
      { id: 'quickswap', name: 'QuickSwap', chain: 'polygon', category: 'DEX' },
      { id: 'trader-joe', name: 'Trader Joe', chain: 'avalanche', category: 'DEX' },
      { id: 'gmx', name: 'GMX', chain: 'arbitrum', category: 'DEX' },
      { id: 'dydx', name: 'dYdX', chain: 'ethereum', category: 'Derivatives' },
    ];

    protocolData.forEach((p) => {
      const metrics = this.generateMockMetrics();
      const healthScore = this.calculateHealthScore(metrics);
      const status = this.getStatus(healthScore);

      this.protocols.set(p.id, {
        ...p,
        healthScore,
        status,
        lastUpdate: Date.now(),
        metrics,
        anomalies: [],
      });
    });

    this.generateAnomalies();
  }

  private generateMockMetrics(): ProtocolMetrics {
    const baseTvl = Math.random() * 1000000000 + 100000000;
    const changeFactor = (Math.random() - 0.5) * 0.3;

    return {
      tvl: baseTvl,
      tvlChange24h: changeFactor * 100,
      volume24h: baseTvl * (Math.random() * 0.2 + 0.05),
      volumeChange24h: (Math.random() - 0.5) * 50,
      users24h: Math.floor(Math.random() * 50000 + 1000),
      usersChange24h: (Math.random() - 0.5) * 30,
      revenue24h: baseTvl * (Math.random() * 0.01 + 0.001),
      revenueChange24h: (Math.random() - 0.5) * 40,
      gasUsage24h: Math.floor(Math.random() * 1000000 + 100000),
      transactionCount24h: Math.floor(Math.random() * 50000 + 5000),
    };
  }

  private calculateHealthScore(metrics: ProtocolMetrics): number {
    let score = 100;

    if (Math.abs(metrics.tvlChange24h) > 20) score -= 20;
    else if (Math.abs(metrics.tvlChange24h) > 10) score -= 10;
    else if (Math.abs(metrics.tvlChange24h) > 5) score -= 5;

    if (Math.abs(metrics.volumeChange24h) > 30) score -= 15;
    if (Math.abs(metrics.usersChange24h) > 25) score -= 15;

    if (metrics.volume24h / metrics.tvl < 0.01) score -= 10;
    if (metrics.users24h < 100) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private getStatus(score: number): 'healthy' | 'warning' | 'critical' {
    if (score >= 70) return 'healthy';
    if (score >= 40) return 'warning';
    return 'critical';
  }

  private generateAnomalies() {
    const types: Anomaly['type'][] = ['tvl', 'volume', 'users', 'revenue', 'gas', 'transactions'];
    const severities: Anomaly['severity'][] = ['low', 'medium', 'high', 'critical'];

    for (let i = 0; i < 30; i++) {
      const protocol = Array.from(this.protocols.values())[Math.floor(Math.random() * this.protocols.size)];
      const type = types[Math.floor(Math.random() * types.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const deviation = (Math.random() * 50 + 10) * (Math.random() > 0.5 ? 1 : -1);
      const expectedValue = this.getMetricValue(protocol.metrics, type);

      const anomaly: Anomaly = {
        id: `anomaly-${i}`,
        protocolId: protocol.id,
        protocolName: protocol.name,
        type,
        severity,
        message: this.generateAnomalyMessage(type, deviation),
        value: expectedValue * (1 + deviation / 100),
        expectedValue,
        deviation,
        timestamp: Date.now() - Math.floor(Math.random() * 86400000 * 7),
        acknowledged: Math.random() > 0.7,
      };

      this.anomalies.push(anomaly);
      protocol.anomalies.push(anomaly);
    }

    this.anomalies.sort((a, b) => b.timestamp - a.timestamp);
  }

  private getMetricValue(metrics: ProtocolMetrics, type: Anomaly['type']): number {
    switch (type) {
      case 'tvl': return metrics.tvl;
      case 'volume': return metrics.volume24h;
      case 'users': return metrics.users24h;
      case 'revenue': return metrics.revenue24h;
      case 'gas': return metrics.gasUsage24h;
      case 'transactions': return metrics.transactionCount24h;
    }
  }

  private generateAnomalyMessage(type: Anomaly['type'], deviation: number): string {
    const direction = deviation > 0 ? 'increase' : 'decrease';
    const absDeviation = Math.abs(deviation).toFixed(1);
    
    const messages: Record<string, string> = {
      tvl: `Unusual ${direction} in Total Value Locked (${absDeviation}%)`,
      volume: `Abnormal ${direction} in trading volume (${absDeviation}%)`,
      users: `Significant ${direction} in user activity (${absDeviation}%)`,
      revenue: `Unexpected ${direction} in protocol revenue (${absDeviation}%)`,
      gas: `Gas usage ${direction} detected (${absDeviation}%)`,
      transactions: `Transaction count ${direction} observed (${absDeviation}%)`,
    };

    return messages[type];
  }

  async getOverallHealthStatus() {
    const protocols = Array.from(this.protocols.values());
    const healthy = protocols.filter((p) => p.status === 'healthy').length;
    const warning = protocols.filter((p) => p.status === 'warning').length;
    const critical = protocols.filter((p) => p.status === 'critical').length;
    const avgHealthScore = protocols.reduce((sum, p) => sum + p.healthScore, 0) / protocols.length;

    return {
      totalProtocols: protocols.length,
      healthy,
      warning,
      critical,
      avgHealthScore: avgHealthScore.toFixed(1),
      lastUpdate: Date.now(),
    };
  }

  async getMonitoredProtocols() {
    return Array.from(this.protocols.values()).map((p) => ({
      id: p.id,
      name: p.name,
      chain: p.chain,
      category: p.category,
      healthScore: p.healthScore,
      status: p.status,
      anomalyCount: p.anomalies.filter((a) => !a.acknowledged).length,
      lastUpdate: p.lastUpdate,
    }));
  }

  async getProtocolStatus(protocolId: string) {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      return { error: 'Protocol not found' };
    }
    return protocol;
  }

  async getAnomalies(severity?: string, protocol?: string, limit: number = 50) {
    let filtered = this.anomalies;

    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity);
    }
    if (protocol) {
      filtered = filtered.filter((a) => a.protocolId === protocol);
    }

    return filtered.slice(0, limit);
  }

  async getActiveAlerts() {
    return this.alerts.map((alert) => {
      const protocol = this.protocols.get(alert.protocolId);
      return {
        ...alert,
        protocolName: protocol?.name,
      };
    });
  }

  async createAlert(protocolId: string, condition: string, threshold: number) {
    const alert: Alert = {
      id: `alert-${Date.now()}`,
      protocolId,
      condition,
      threshold,
      triggered: false,
    };
    this.alerts.push(alert);
    return alert;
  }

  async getProtocolMetrics(protocolId: string) {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      return { error: 'Protocol not found' };
    }
    return protocol.metrics;
  }

  async getProtocolTrends(protocolId: string, timeRange: string) {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      return { error: 'Protocol not found' };
    }

    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24;
    const data: { timestamp: number; tvl: number; volume: number; users: number; revenue: number }[] = [];

    for (let i = hours; i >= 0; i -= Math.max(1, Math.floor(hours / 24))) {
      const factor = 1 + (Math.random() - 0.5) * 0.1;
      data.push({
        timestamp: Date.now() - i * 3600000,
        tvl: protocol.metrics.tvl * factor,
        volume: protocol.metrics.volume24h * factor,
        users: Math.floor(protocol.metrics.users24h * factor),
        revenue: protocol.metrics.revenue24h * factor,
      });
    }

    return { protocolId, timeRange, data };
  }

  async getDashboard() {
    const protocols = Array.from(this.protocols.values());
    const recentAnomalies = this.anomalies.slice(0, 10);

    const byCategory = protocols.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byChain = protocols.reduce((acc, p) => {
      acc[p.chain] = (acc[p.chain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const criticalProtocols = protocols
      .filter((p) => p.status === 'critical')
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 5);

    return {
      healthStatus: await this.getOverallHealthStatus(),
      recentAnomalies,
      byCategory,
      byChain,
      criticalProtocols,
    };
  }
}
