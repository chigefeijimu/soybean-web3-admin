import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface ProtocolUserMetrics {
  protocolId: string;
  protocolName: string;
  chain: string;
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newUsers24h: number;
  newUsers7d: number;
  newUsers30d: number;
  retentionRate24h: number;
  retentionRate7d: number;
  retentionRate30d: number;
  userGrowthRate7d: number;
  userGrowthRate30d: number;
  averageUsersPerDay: number;
  peakUsers24h: number;
  timestamp: string;
}

export interface UserAnalyticsOverview {
  totalProtocols: number;
  totalUsers: number;
  totalActiveUsers: number;
  averageRetentionRate: number;
  topProtocolsByUsers: ProtocolUserMetrics[];
  chainDistribution: { chain: string; userCount: number; percentage: number }[];
  userGrowthTrend: { date: string; users: number }[];
}

@Injectable()
export class Web3DefiUserAnalyticsService {
  private readonly supportedProtocols = [
    { id: 'aave', name: 'Aave', chain: 'ethereum' },
    { id: 'compound', name: 'Compound', chain: 'ethereum' },
    { id: 'uniswap', name: 'Uniswap', chain: 'ethereum' },
    { id: 'curve', name: 'Curve', chain: 'ethereum' },
    { id: 'lido', name: 'Lido', chain: 'ethereum' },
    { id: 'yearn', name: 'Yearn Finance', chain: 'ethereum' },
    { id: 'makerdao', name: 'MakerDAO', chain: 'ethereum' },
    { id: 'balancer', name: 'Balancer', chain: 'ethereum' },
    { id: 'sushiswap', name: 'SushiSwap', chain: 'ethereum' },
    { id: 'aerodrome', name: 'Aerodrome', chain: 'base' },
    { id: 'velodrome', name: 'Velodrome', chain: 'optimism' },
    { id: 'pancakeswap', name: 'PancakeSwap', chain: 'bsc' },
    { id: 'quickswap', name: 'QuickSwap', chain: 'polygon' },
    { id: 'trader-joe', name: 'Trader Joe', chain: 'avalanche' },
    { id: 'gmx', name: 'GMX', chain: 'arbitrum' },
    { id: 'morpho', name: 'Morpho', chain: 'ethereum' },
  ];

  private readonly supportedChains = [
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'bsc',
    'base',
    'avalanche',
  ];

  constructor(private readonly httpService: HttpService) {}

  async getProtocolUserMetrics(
    protocolId: string,
    chain?: string,
  ): Promise<ProtocolUserMetrics | null> {
    const protocol = this.supportedProtocols.find(
      (p) => p.id === protocolId && (!chain || p.chain === chain),
    );

    if (!protocol) {
      return null;
    }

    // Simulate realistic user metrics data based on protocol
    const baseUsers = this.getBaseUsersForProtocol(protocol.id);
    const variance = () => (Math.random() - 0.5) * 0.1;

    const totalUsers = Math.floor(baseUsers * (1 + variance()));
    const activeUsers24h = Math.floor(totalUsers * (0.15 + variance() * 0.05));
    const activeUsers7d = Math.floor(totalUsers * (0.35 + variance() * 0.1));
    const activeUsers30d = Math.floor(totalUsers * (0.55 + variance() * 0.15));
    const newUsers24h = Math.floor(totalUsers * (0.02 + variance() * 0.01));
    const newUsers7d = Math.floor(totalUsers * (0.08 + variance() * 0.03));
    const newUsers30d = Math.floor(totalUsers * (0.2 + variance() * 0.05));

    return {
      protocolId: protocol.id,
      protocolName: protocol.name,
      chain: protocol.chain,
      totalUsers,
      activeUsers24h,
      activeUsers7d,
      activeUsers30d,
      newUsers24h,
      newUsers7d,
      newUsers30d,
      retentionRate24h: this.calculateRetentionRate(activeUsers24h, newUsers24h),
      retentionRate7d: this.calculateRetentionRate(activeUsers7d, newUsers7d),
      retentionRate30d: this.calculateRetentionRate(activeUsers30d, newUsers30d),
      userGrowthRate7d: 5.2 + variance() * 2,
      userGrowthRate30d: 18.5 + variance() * 5,
      averageUsersPerDay: Math.floor(totalUsers / 30),
      peakUsers24h: Math.floor(activeUsers24h * 1.3),
      timestamp: new Date().toISOString(),
    };
  }

  async getAllProtocolsUserMetrics(chain?: string): Promise<ProtocolUserMetrics[]> {
    const protocols = chain
      ? this.supportedProtocols.filter((p) => p.chain === chain)
      : this.supportedProtocols;

    const metrics: ProtocolUserMetrics[] = [];
    for (const protocol of protocols) {
      const protocolMetrics = await this.getProtocolUserMetrics(protocol.id);
      if (protocolMetrics) {
        metrics.push(protocolMetrics);
      }
    }

    return metrics.sort((a, b) => b.totalUsers - a.totalUsers);
  }

  async getUserAnalyticsOverview(): Promise<UserAnalyticsOverview> {
    const allMetrics = await this.getAllProtocolsUserMetrics();

    const totalUsers = allMetrics.reduce((sum, m) => sum + m.totalUsers, 0);
    const totalActiveUsers = allMetrics.reduce((sum, m) => sum + m.activeUsers7d, 0);
    const averageRetentionRate =
      allMetrics.reduce((sum, m) => sum + m.retentionRate7d, 0) / allMetrics.length;

    // Chain distribution
    const chainMap = new Map<string, number>();
    for (const metric of allMetrics) {
      chainMap.set(
        metric.chain,
        (chainMap.get(metric.chain) || 0) + metric.totalUsers,
      );
    }
    const chainDistribution = Array.from(chainMap.entries()).map(([chain, userCount]) => ({
      chain,
      userCount,
      percentage: (userCount / totalUsers) * 100,
    }));

    // Generate mock trend data for last 30 days
    const userGrowthTrend = [];
    let runningUsers = Math.floor(totalUsers * 0.85);
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      runningUsers += Math.floor(runningUsers * (0.005 + Math.random() * 0.01));
      userGrowthTrend.push({
        date: date.toISOString().split('T')[0],
        users: runningUsers,
      });
    }

    return {
      totalProtocols: allMetrics.length,
      totalUsers,
      totalActiveUsers,
      averageRetentionRate,
      topProtocolsByUsers: allMetrics.slice(0, 10),
      chainDistribution: chainDistribution.sort((a, b) => b.userCount - a.userCount),
      userGrowthTrend,
    };
  }

  async getChainUserMetrics(chain: string): Promise<ProtocolUserMetrics[]> {
    if (!this.supportedChains.includes(chain)) {
      return [];
    }
    return this.getAllProtocolsUserMetrics(chain);
  }

  async compareProtocols(protocolIds: string[]): Promise<ProtocolUserMetrics[]> {
    const metrics: ProtocolUserMetrics[] = [];
    for (const id of protocolIds) {
      const protocolMetric = await this.getProtocolUserMetrics(id);
      if (protocolMetric) {
        metrics.push(protocolMetric);
      }
    }
    return metrics;
  }

  async getUserRetentionAnalysis(protocolId: string): Promise<{
    day1Retention: number;
    day7Retention: number;
    day30Retention: number;
    churnRate7d: number;
    churnRate30d: number;
    cohortData: { cohort: string; retention: number[] }[];
  }> {
    const metrics = await this.getProtocolUserMetrics(protocolId);
    if (!metrics) {
      return null;
    }

    return {
      day1Retention: 65 + Math.random() * 15,
      day7Retention: metrics.retentionRate7d,
      day30Retention: metrics.retentionRate30d,
      churnRate7d: 12 + Math.random() * 5,
      churnRate30d: 25 + Math.random() * 10,
      cohortData: this.generateCohortData(),
    };
  }

  async getUserActivityDistribution(protocolId: string): Promise<{
    veryActive: number;
    active: number;
    casual: number;
    dormant: number;
  }> {
    const metrics = await this.getProtocolUserMetrics(protocolId);
    if (!metrics) {
      return null;
    }

    return {
      veryActive: Math.floor(metrics.activeUsers30d * 0.15),
      active: Math.floor(metrics.activeUsers30d * 0.35),
      casual: Math.floor(metrics.activeUsers30d * 0.3),
      dormant: metrics.totalUsers - metrics.activeUsers30d,
    };
  }

  private getBaseUsersForProtocol(protocolId: string): number {
    const userBases: Record<string, number> = {
      uniswap: 4500000,
      aave: 2800000,
      curve: 1800000,
      lido: 2200000,
      compound: 1500000,
      makerdao: 1200000,
      yearn: 850000,
      balancer: 650000,
      sushiswap: 800000,
      aerodrome: 450000,
      velodrome: 380000,
      pancakeswap: 3200000,
      quickswap: 580000,
      'trader-joe': 420000,
      gmx: 280000,
      morpho: 180000,
    };
    return userBases[protocolId] || 100000;
  }

  private calculateRetentionRate(activeUsers: number, newUsers: number): number {
    if (newUsers === 0) return 0;
    const rate = (activeUsers / (activeUsers + newUsers)) * 100;
    return Math.min(Math.max(rate, 0), 100);
  }

  private generateCohortData(): { cohort: string; retention: number[] }[] {
    const cohorts = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const cohortName = `Week ${date.toISOString().split('T')[0]}`;
      const retention = [];
      let baseRetention = 100;
      for (let week = 0; week <= i; week++) {
        baseRetention = baseRetention * (0.7 + Math.random() * 0.15);
        retention.push(Math.floor(baseRetention));
      }
      cohorts.push({ cohort: cohortName, retention });
    }
    return cohorts;
  }

  getSupportedProtocols() {
    return this.supportedProtocols;
  }

  getSupportedChains() {
    return this.supportedChains;
  }
}
