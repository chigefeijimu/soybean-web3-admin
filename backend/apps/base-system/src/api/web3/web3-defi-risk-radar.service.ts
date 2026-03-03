import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface ProtocolRisk {
  protocol: string;
  chain: string;
  overallRisk: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: {
    smartContractRisk: number;
    liquidityRisk: number;
    governanceRisk: number;
    marketRisk: number;
    centralizationRisk: number;
    auditRisk: number;
  };
  tvl: number;
  tvlChange24h: number;
  auditStatus: string;
  topHoldersPercent: number;
  contractsVerified: boolean;
  pauseAbility: boolean;
  mintAbility: boolean;
  lastAuditDate: string;
  recommendations: string[];
}

interface RiskAlert {
  id: string;
  protocol: string;
  chain: string;
  riskType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metadata?: any;
}

@Injectable()
export class Web3DefiRiskRadarService {
  private readonly supportedChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc', 'base'];
  private readonly riskWeights = {
    smartContractRisk: 0.25,
    liquidityRisk: 0.20,
    governanceRisk: 0.15,
    marketRisk: 0.15,
    centralizationRisk: 0.15,
    auditRisk: 0.10,
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 分析单个DeFi协议的风险
   */
  async analyzeProtocolRisk(protocol: string, chain: string = 'ethereum'): Promise<ProtocolRisk> {
    const normalizedChain = chain.toLowerCase();
    
    // 获取协议基本信息
    const protocolInfo = await this.getProtocolInfo(protocol, normalizedChain);
    const tvlData = await this.getProtocolTVL(protocol, normalizedChain);
    const auditData = await this.getProtocolAuditStatus(protocol, normalizedChain);
    const holderData = await this.getHolderDistribution(protocol, normalizedChain);

    // 计算各项风险
    const smartContractRisk = this.calculateSmartContractRisk(auditData, protocolInfo);
    const liquidityRisk = this.calculateLiquidityRisk(tvlData, holderData);
    const governanceRisk = this.calculateGovernanceRisk(protocolInfo);
    const marketRisk = this.calculateMarketRisk(tvlData);
    const centralizationRisk = this.calculateCentralizationRisk(holderData, protocolInfo);
    const auditRisk = this.calculateAuditRisk(auditData);

    // 计算综合风险分数
    const overallRisk = Math.round(
      smartContractRisk * this.riskWeights.smartContractRisk +
      liquidityRisk * this.riskWeights.liquidityRisk +
      governanceRisk * this.riskWeights.governanceRisk +
      marketRisk * this.riskWeights.marketRisk +
      centralizationRisk * this.riskWeights.centralizationRisk +
      auditRisk * this.riskWeights.auditRisk
    );

    // 确定风险等级
    const riskLevel = this.getRiskLevel(overallRisk);

    // 生成建议
    const recommendations = this.generateRecommendations({
      smartContractRisk,
      liquidityRisk,
      governanceRisk,
      marketRisk,
      centralizationRisk,
      auditRisk,
      overallRisk,
    });

    return {
      protocol: protocolInfo.name || protocol,
      chain: normalizedChain,
      overallRisk,
      riskLevel,
      riskFactors: {
        smartContractRisk: Math.round(smartContractRisk),
        liquidityRisk: Math.round(liquidityRisk),
        governanceRisk: Math.round(governanceRisk),
        marketRisk: Math.round(marketRisk),
        centralizationRisk: Math.round(centralizationRisk),
        auditRisk: Math.round(auditRisk),
      },
      tvl: tvlData?.tvl || 0,
      tvlChange24h: tvlData?.change24h || 0,
      auditStatus: auditData?.status || 'Unknown',
      topHoldersPercent: holderData?.top10Percent || 0,
      contractsVerified: auditData?.verified || false,
      pauseAbility: protocolInfo?.hasPause || false,
      mintAbility: protocolInfo?.hasMint || false,
      lastAuditDate: auditData?.lastAudit || 'Unknown',
      recommendations,
    };
  }

  /**
   * 批量分析多个协议风险
   */
  async batchAnalyzeRisk(protocols: { name: string; chain: string }[]): Promise<ProtocolRisk[]> {
    const results = await Promise.all(
      protocols.map(p => this.analyzeProtocolRisk(p.name, p.chain).catch(() => null))
    );
    return results.filter((r): r is ProtocolRisk => r !== null);
  }

  /**
   * 获取风险排行榜
   */
  async getRiskRankings(chain?: string, sortBy: string = 'risk'): Promise<ProtocolRisk[]> {
    const protocols = this.getPopularProtocols();
    const filteredProtocols = chain 
      ? protocols.filter(p => p.chain === chain.toLowerCase())
      : protocols;

    const results = await this.batchAnalyzeRisk(filteredProtocols);
    
    if (sortBy === 'risk') {
      return results.sort((a, b) => b.overallRisk - a.overallRisk);
    } else if (sortBy === 'tvl') {
      return results.sort((a, b) => b.tvl - a.tvl);
    } else if (sortBy === 'tvl_change') {
      return results.sort((a, b) => Math.abs(b.tvlChange24h) - Math.abs(a.tvlChange24h));
    }
    return results;
  }

  /**
   * 获取风险警报
   */
  async getRiskAlerts(threshold: number = 50): Promise<RiskAlert[]> {
    const rankings = await this.getRiskRankings();
    const alerts: RiskAlert[] = [];

    for (const protocol of rankings) {
      if (protocol.overallRisk >= threshold) {
        const severity = protocol.overallRisk >= 80 ? 'critical' : 
                        protocol.overallRisk >= 60 ? 'high' : 'medium';
        
        alerts.push({
          id: `${protocol.protocol}-${protocol.chain}-${Date.now()}`,
          protocol: protocol.protocol,
          chain: protocol.chain,
          riskType: 'OVERALL_RISK',
          severity,
          message: `${protocol.protocol} on ${protocol.chain} has ${severity} risk level (${protocol.overallRisk}/100)`,
          timestamp: Date.now(),
          metadata: protocol.riskFactors,
        });
      }

      // 检查特定风险因素
      if (protocol.riskFactors.smartContractRisk >= 70) {
        alerts.push({
          id: `${protocol.protocol}-sc-${Date.now()}`,
          protocol: protocol.protocol,
          chain: protocol.chain,
          riskType: 'SMART_CONTRACT',
          severity: protocol.riskFactors.smartContractRisk >= 90 ? 'critical' : 'high',
          message: `${protocol.protocol} has high smart contract risk (${protocol.riskFactors.smartContractRisk}/100)`,
          timestamp: Date.now(),
        });
      }

      if (protocol.riskFactors.centralizationRisk >= 70) {
        alerts.push({
          id: `${protocol.protocol}-cen-${Date.now()}`,
          protocol: protocol.protocol,
          chain: protocol.chain,
          riskType: 'CENTRALIZATION',
          severity: protocol.riskFactors.centralizationRisk >= 90 ? 'critical' : 'high',
          message: `${protocol.protocol} has high centralization risk - Top holders: ${protocol.topHoldersPercent}%`,
          timestamp: Date.now(),
        });
      }

      if (protocol.pauseAbility || protocol.mintAbility) {
        alerts.push({
          id: `${protocol.protocol}-adm-${Date.now()}`,
          protocol: protocol.protocol,
          chain: protocol.chain,
          riskType: 'ADMIN_RISK',
          severity: 'medium',
          message: `${protocol.protocol} has admin capabilities - Pause: ${protocol.pauseAbility}, Mint: ${protocol.mintAbility}`,
          timestamp: Date.now(),
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * 获取风险仪表盘概览
   */
  async getRiskDashboard(): Promise<any> {
    const rankings = await this.getRiskRankings();
    const alerts = await this.getRiskAlerts(60);
    
    const chains = [...new Set(rankings.map(r => r.chain))];
    const chainStats = chains.map(chain => {
      const chainProtocols = rankings.filter(r => r.chain === chain);
      const avgRisk = chainProtocols.reduce((sum, p) => sum + p.overallRisk, 0) / chainProtocols.length;
      const highRiskCount = chainProtocols.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length;
      
      return {
        chain,
        totalProtocols: chainProtocols.length,
        avgRiskScore: Math.round(avgRisk),
        highRiskCount,
      };
    });

    const riskDistribution = {
      low: rankings.filter(r => r.riskLevel === 'LOW').length,
      medium: rankings.filter(r => r.riskLevel === 'MEDIUM').length,
      high: rankings.filter(r => r.riskLevel === 'HIGH').length,
      critical: rankings.filter(r => r.riskLevel === 'CRITICAL').length,
    };

    return {
      totalProtocolsAnalyzed: rankings.length,
      riskDistribution,
      chainStats,
      recentAlerts: alerts.slice(0, 10),
      overallHealth: this.calculateOverallHealth(riskDistribution),
      lastUpdated: Date.now(),
    };
  }

  /**
   * 实时风险监控
   */
  async monitorRisks(protocols: string[], chain: string = 'ethereum'): Promise<any> {
    const results = await Promise.all(
      protocols.map(p => this.analyzeProtocolRisk(p, chain).catch(() => null))
    );
    
    const activeProtocols = results.filter((p): p is ProtocolRisk => p !== null);
    const riskChanges = activeProtocols.map(p => ({
      protocol: p.protocol,
      currentRisk: p.overallRisk,
      riskLevel: p.riskLevel,
      significantChanges: this.detectSignificantChanges(p),
    }));

    return {
      monitoredProtocols: activeProtocols.length,
      riskChanges,
      timestamp: Date.now(),
    };
  }

  // 私有辅助方法
  private getPopularProtocols(): { name: string; chain: string }[] {
    return [
      { name: 'aave', chain: 'ethereum' },
      { name: 'compound', chain: 'ethereum' },
      { name: 'uniswap', chain: 'ethereum' },
      { name: 'curve', chain: 'ethereum' },
      { name: 'lido', chain: 'ethereum' },
      { name: 'yearn', chain: 'ethereum' },
      { name: 'makerdao', chain: 'ethereum' },
      { name: 'balancer', chain: 'ethereum' },
      { name: 'sushiswap', chain: 'ethereum' },
      { name: 'aave', chain: 'polygon' },
      { name: 'quickstep', chain: 'polygon' },
      { name: 'aave', chain: 'arbitrum' },
      { name: 'uniswap', chain: 'arbitrum' },
      { name: 'aave', chain: 'optimism' },
      { name: 'uniswap', chain: 'optimism' },
      { name: 'pancakeswap', chain: 'bsc' },
      { name: 'aave', chain: 'avalanche' },
      { name: 'traderjoe', chain: 'avalanche' },
    ];
  }

  private async getProtocolInfo(protocol: string, chain: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.llama.fi/protocol/${protocol}`, { timeout: 5000 })
      ).catch(() => ({ data: null }));
      return response?.data || {};
    } catch {
      return this.getMockProtocolInfo(protocol);
    }
  }

  private async getProtocolTVL(protocol: string, chain: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.llama.fi/tvl/${protocol}`, { timeout: 5000 })
      ).catch(() => ({ data: null }));
      const data = response?.data;
      if (data && typeof data === 'object') {
        const values = Object.values(data);
        const current = Number(values[values.length - 1]) || 0;
        const previous = Number(values[values.length - 2]) || 0;
        return {
          tvl: current,
          change24h: previous ? ((current - previous) / previous) * 100 : 0,
        };
      }
      return { tvl: 0, change24h: 0 };
    } catch {
      return { tvl: Math.random() * 1000000000, change24h: (Math.random() - 0.5) * 10 };
    }
  }

  private async getProtocolAuditStatus(protocol: string, chain: string): Promise<any> {
    // 模拟审计数据
    const auditDatabase: Record<string, any> = {
      aave: { status: 'Audited', verified: true, lastAudit: '2024-01-15', audits: ['OpenZeppelin', 'Trail of Bits'] },
      compound: { status: 'Audited', verified: true, lastAudit: '2024-02-01', audits: ['OpenZeppelin'] },
      uniswap: { status: 'Audited', verified: true, lastAudit: '2024-01-20', audits: ['Trail of Bits', 'ABDK'] },
      curve: { status: 'Audited', verified: true, lastAudit: '2023-12-10', audits: ['ChainSecurity'] },
      lido: { status: 'Audited', verified: true, lastAudit: '2024-01-05', audits: ['MixBytes'] },
      yearn: { status: 'Audited', verified: true, lastAudit: '2023-11-20', audits: ['Trail of Bits'] },
    };
    return auditDatabase[protocol.toLowerCase()] || { status: 'Unknown', verified: false, lastAudit: 'Unknown' };
  }

  private async getHolderDistribution(protocol: string, chain: string): Promise<any> {
    // 模拟持币分布数据
    const top10Percent = 30 + Math.random() * 50;
    return { top10Percent: Math.round(top10Percent) };
  }

  private calculateSmartContractRisk(auditData: any, protocolInfo: any): number {
    let risk = 30; // 基础风险
    
    if (!auditData?.verified) risk += 30;
    if (protocolInfo?.hasPause) risk += 15;
    if (protocolInfo?.hasMint) risk += 15;
    
    // 审计次数越多风险越低
    const auditCount = auditData?.audits?.length || 0;
    risk -= auditCount * 5;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateLiquidityRisk(tvlData: any, holderData: any): number {
    let risk = 50;
    
    const tvl = tvlData?.tvl || 0;
    if (tvl < 10000000) risk += 20;
    else if (tvl < 100000000) risk += 10;
    
    const change24h = Math.abs(tvlData?.change24h || 0);
    if (change24h > 20) risk += 15;
    else if (change24h > 10) risk += 5;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateGovernanceRisk(protocolInfo: any): number {
    let risk = 40;
    
    // 检查是否有治理代币
    if (!protocolInfo?.token) risk += 20;
    
    // 检查治理参与度
    const governanceParticipation = protocolInfo?.governanceParticipation || 50;
    if (governanceParticipation < 20) risk += 15;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateMarketRisk(tvlData: any): number {
    let risk = 40;
    
    const change24h = Math.abs(tvlData?.change24h || 0);
    if (change24h > 30) risk += 25;
    else if (change24h > 15) risk += 15;
    else if (change24h > 5) risk += 5;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateCentralizationRisk(holderData: any, protocolInfo: any): number {
    let risk = 30;
    
    const top10 = holderData?.top10Percent || 50;
    if (top10 > 80) risk += 40;
    else if (top10 > 60) risk += 25;
    else if (top10 > 40) risk += 10;
    
    return Math.max(0, Math.min(100, risk));
  }

  private calculateAuditRisk(auditData: any): number {
    let risk = 40;
    
    if (!auditData?.verified) {
      risk = 80;
    } else {
      const auditCount = auditData?.audits?.length || 0;
      if (auditCount === 0) risk = 70;
      else if (auditCount === 1) risk = 40;
      else risk = 20;
    }
    
    return risk;
  }

  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score < 25) return 'LOW';
    if (score < 50) return 'MEDIUM';
    if (score < 75) return 'HIGH';
    return 'CRITICAL';
  }

  private generateRecommendations(factors: any): string[] {
    const recommendations: string[] = [];
    
    if (factors.smartContractRisk > 60) {
      recommendations.push('建议进行更全面的智能合约审计');
      recommendations.push('考虑设置合约升级的TimeLock');
    }
    
    if (factors.liquidityRisk > 60) {
      recommendations.push('建议增加流动性池深度');
      recommendations.push('关注TVL变化，及时调整策略');
    }
    
    if (factors.centralizationRisk > 60) {
      recommendations.push('建议分散代币持有分布');
      recommendations.push('考虑增加社区治理参与度');
    }
    
    if (factors.auditRisk > 60) {
      recommendations.push('建议进行专业安全审计');
      recommendations.push('公开审计报告以提高透明度');
    }
    
    if (factors.governanceRisk > 60) {
      recommendations.push('建议增加治理代币分发透明度');
      recommendations.push('鼓励社区参与治理投票');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('协议风险状况良好，但仍需持续监控');
    }
    
    return recommendations;
  }

  private calculateOverallHealth(distribution: any): string {
    const total = distribution.low + distribution.medium + distribution.high + distribution.critical;
    const healthyPercent = (distribution.low / total) * 100;
    
    if (healthyPercent >= 70) return 'HEALTHY';
    if (healthyPercent >= 50) return 'FAIR';
    if (healthyPercent >= 30) return 'CAUTION';
    return 'AT_RISK';
  }

  private detectSignificantChanges(protocol: any): string[] {
    const changes: string[] = [];
    
    if (protocol.tvlChange24h > 15) changes.push('TVL大幅增长');
    if (protocol.tvlChange24h < -15) changes.push('TVL大幅下降');
    
    return changes;
  }

  private getMockProtocolInfo(protocol: string): any {
    const mockData: Record<string, any> = {
      aave: { name: 'Aave', hasPause: true, hasMint: false, token: 'AAVE' },
      compound: { name: 'Compound', hasPause: true, hasMint: false, token: 'COMP' },
      uniswap: { name: 'Uniswap', hasPause: false, hasMint: false, token: 'UNI' },
      curve: { name: 'Curve', hasPause: false, hasMint: false, token: 'CRV' },
      lido: { name: 'Lido', hasPause: true, hasMint: false, token: 'LDO' },
      yearn: { name: 'Yearn', hasPause: false, hasMint: false, token: 'YFI' },
    };
    return mockData[protocol.toLowerCase()] || {};
  }
}
