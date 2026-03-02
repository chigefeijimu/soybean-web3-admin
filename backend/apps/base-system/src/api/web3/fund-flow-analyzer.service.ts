import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface FlowTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
}

interface FlowStats {
  totalIn: string;
  totalOut: string;
  netFlow: string;
  txCount: number;
  avgTxSize: string;
  uniqueCounterparties: number;
}

@Injectable()
export class FundFlowAnalyzerService {
  private readonly ethplorerApi = 'https://api.ethplorer.io';
  private readonly etherscanApi = 'https://api.etherscan.io/api';
  private readonly etherscanKey = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
  
  // In-memory storage for alerts (in production, use database)
  private alerts: Map<string, any[]> = new Map();

  constructor(private readonly httpService: HttpService) {}

  /**
   * 追踪地址资金流
   */
  async trackAddress(address: string, chainId: number): Promise<any> {
    try {
      // Get ETH transactions
      const ethTxs = await this.getEthTransactions(address, chainId);
      
      // Calculate flow statistics
      const stats = this.calculateFlowStats(ethTxs, address);
      
      // Get top counterparties
      const counterparties = this.getTopCounterparties(ethTxs, address);
      
      // Get recent large transactions
      const largeTxs = this.getLargeTransactions(ethTxs, address);

      return {
        address,
        chainId,
        stats,
        counterparties,
        recentLargeTxs: largeTxs,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new HttpException(
        `Failed to track address: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * 获取资金流历史
   */
  async getFlowHistory(address: string, chainId: number, days: number): Promise<any> {
    try {
      const txs = await this.getEthTransactions(address, chainId, days * 20);
      
      // Group by day
      const dailyFlows = this.groupByDay(txs, address, days);
      
      // Calculate trends
      const trends = this.calculateTrends(dailyFlows);
      
      return {
        address,
        chainId,
        dailyFlows,
        trends,
        period: `${days} days`,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get flow history: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * 获取近期最大资金接收者
   */
  async getTopReceivers(chainId: number, limit: number): Promise<any> {
    try {
      // In production, this would query a database of recent transactions
      // For demo, return mock data
      const mockReceivers = this.generateMockTopList('receiver', limit);
      return {
        chainId,
        receivers: mockReceivers,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get top receivers: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * 获取近期最大资金发送者
   */
  async getTopSenders(chainId: number, limit: number): Promise<any> {
    try {
      const mockSenders = this.generateMockTopList('sender', limit);
      return {
        chainId,
        senders: mockSenders,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get top senders: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * 对比多个地址的资金流
   */
  async compareAddresses(addresses: string[], chainId: number): Promise<any> {
    try {
      const comparisons = await Promise.all(
        addresses.map(async (addr) => {
          const txs = await this.getEthTransactions(addr, chainId, 50);
          const stats = this.calculateFlowStats(txs, addr);
          return { address: addr, stats };
        })
      );

      // Find patterns
      const patterns = this.findComparisonPatterns(comparisons);

      return {
        chainId,
        comparisons,
        patterns,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new HttpException(
        `Failed to compare addresses: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * 设置资金流告警
   */
  async setAlert(alertDto: {
    address: string;
    chainId: number;
    threshold: number;
    direction: 'in' | 'out' | 'both';
    notifyEmail?: boolean;
    notifyTelegram?: boolean;
  }): Promise<any> {
    const alertId = `${alertDto.address}-${Date.now()}`;
    const alert = { id: alertId, ...alertDto, createdAt: Date.now() };
    
    const key = alertDto.address.toLowerCase();
    const existingAlerts = this.alerts.get(key) || [];
    existingAlerts.push(alert);
    this.alerts.set(key, existingAlerts);

    return {
      success: true,
      alert,
      message: 'Alert created successfully'
    };
  }

  /**
   * 获取告警
   */
  async getAlerts(address: string): Promise<any> {
    const key = address.toLowerCase();
    return {
      address,
      alerts: this.alerts.get(key) || []
    };
  }

  /**
   * 检测资金流异常
   */
  async detectAnomalies(address: string, chainId: number): Promise<any> {
    try {
      const txs = await this.getEthTransactions(address, chainId, 100);
      
      // Calculate baseline metrics
      const baseline = this.calculateBaseline(txs, address);
      
      // Detect anomalies
      const anomalies = this.findAnomalies(txs, address, baseline);
      
      // Risk score
      const riskScore = this.calculateRiskScore(anomalies, baseline);

      return {
        address,
        chainId,
        baseline,
        anomalies,
        riskScore,
        recommendation: this.getRecommendation(riskScore),
        timestamp: Date.now()
      };
    } catch (error) {
      throw new HttpException(
        `Failed to detect anomalies: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  /**
   * 分析资金流模式
   */
  async analyzeFlowPattern(address: string, chainId: number): Promise<any> {
    try {
      const txs = await this.getEthTransactions(address, chainId, 50);
      
      // Time-based patterns
      const timePatterns = this.analyzeTimePatterns(txs, address);
      
      // Size patterns
      const sizePatterns = this.analyzeSizePatterns(txs, address);
      
      // Counterparty patterns
      const counterpartyPatterns = this.analyzeCounterpartyPatterns(txs, address);
      
      // Classification
      const classification = this.classifyAddress(txs, address);

      return {
        address,
        chainId,
        timePatterns,
        sizePatterns,
        counterpartyPatterns,
        classification,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new HttpException(
        `Failed to analyze flow pattern: ${error.message}`,
        HttpStatus.BAD_GATEWAY
      );
    }
  }

  // Helper methods

  private async getEthTransactions(address: string, chainId: number, limit = 50): Promise<FlowTransaction[]> {
    try {
      const params = new URLSearchParams({
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: String(limit),
        sort: 'desc'
      });

      if (chainId === 1) {
        params.append('apikey', this.etherscanKey);
      }

      const url = chainId === 1 
        ? `${this.etherscanApi}?${params}`
        : `https://api-${chainId}.etherscan.io/api?${params}`;

      const response = await firstValueFrom(this.httpService.get(url));
      
      if (response.data.status === '1' && response.data.result) {
        return response.data.result.map((tx: any) => ({
          hash: tx.hash,
          from: tx.from.toLowerCase(),
          to: tx.to?.toLowerCase() || '',
          value: tx.value,
          timestamp: parseInt(tx.timeStamp) * 1000,
          blockNumber: parseInt(tx.blockNumber)
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return this.generateMockTransactions(address);
    }
  }

  private generateMockTransactions(address: string): FlowTransaction[] {
    const mockTxs: FlowTransaction[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 20; i++) {
      const isIncoming = Math.random() > 0.5;
      mockTxs.push({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: isIncoming ? `0x${Math.random().toString(16).substr(2, 40)}` : address,
        to: isIncoming ? address : `0x${Math.random().toString(16).substr(2, 40)}`,
        value: String(Math.floor(Math.random() * 100 * 1e18)),
        timestamp: now - i * 3600000,
        blockNumber: 19000000 - i
      });
    }
    
    return mockTxs;
  }

  private calculateFlowStats(txs: FlowTransaction[], address: string): FlowStats {
    let totalIn = 0n;
    let totalOut = 0n;
    const counterparties = new Set<string>();

    for (const tx of txs) {
      const value = BigInt(tx.value);
      if (tx.to.toLowerCase() === address.toLowerCase()) {
        totalIn += value;
        if (tx.from) counterparties.add(tx.from);
      } else if (tx.from.toLowerCase() === address.toLowerCase()) {
        totalOut += value;
        if (tx.to) counterparties.add(tx.to);
      }
    }

    const txCount = txs.length;
    const avgTxSize = txCount > 0 
      ? (totalIn + totalOut) / BigInt(txCount) 
      : 0n;

    return {
      totalIn: (Number(totalIn) / 1e18).toFixed(4),
      totalOut: (Number(totalOut) / 1e18).toFixed(4),
      netFlow: (Number(totalIn - totalOut) / 1e18).toFixed(4),
      txCount,
      avgTxSize: (Number(avgTxSize) / 1e18).toFixed(6),
      uniqueCounterparties: counterparties.size
    };
  }

  private getTopCounterparties(txs: FlowTransaction[], address: string): any[] {
    const counterparties: Map<string, { in: bigint; out: bigint }> = new Map();

    for (const tx of txs) {
      let counterparty: string | null = null;
      let value = BigInt(tx.value);

      if (tx.to.toLowerCase() === address.toLowerCase() && tx.from) {
        counterparty = tx.from;
        const current = counterparties.get(counterparty) || { in: 0n, out: 0n };
        current.in += value;
        counterparties.set(counterparty, current);
      } else if (tx.from.toLowerCase() === address.toLowerCase() && tx.to) {
        counterparty = tx.to;
        const current = counterparties.get(counterparty) || { in: 0n, out: 0n };
        current.out += value;
        counterparties.set(counterparty, current);
      }
    }

    return Array.from(counterparties.entries())
      .map(([addr, flows]) => ({
        address: addr,
        totalIn: (Number(flows.in) / 1e18).toFixed(4),
        totalOut: (Number(flows.out) / 1e18).toFixed(4),
        netFlow: (Number(flows.in - flows.out) / 1e18).toFixed(4)
      }))
      .sort((a, b) => Math.abs(Number(b.netFlow)) - Math.abs(Number(a.netFlow)))
      .slice(0, 10);
  }

  private getLargeTransactions(txs: FlowTransaction[], address: string): any[] {
    const threshold = 1e18; // 1 ETH
    
    return txs
      .filter(tx => BigInt(tx.value) > threshold)
      .map(tx => ({
        hash: tx.hash,
        direction: tx.to.toLowerCase() === address.toLowerCase() ? 'in' : 'out',
        value: (Number(tx.value) / 1e18).toFixed(4),
        counterparty: tx.to.toLowerCase() === address.toLowerCase() ? tx.from : tx.to,
        timestamp: tx.timestamp,
        blockNumber: tx.blockNumber
      }));
  }

  private groupByDay(txs: FlowTransaction[], address: string, days: number): any[] {
    const dailyMap: Map<string, { in: bigint; out: bigint; count: number }> = new Map();
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyMap.set(key, { in: 0n, out: 0n, count: 0 });
    }

    for (const tx of txs) {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      if (dailyMap.has(date)) {
        const day = dailyMap.get(date)!;
        const value = BigInt(tx.value);
        if (tx.to.toLowerCase() === address.toLowerCase()) {
          day.in += value;
        } else if (tx.from.toLowerCase() === address.toLowerCase()) {
          day.out += value;
        }
        day.count++;
      }
    }

    return Array.from(dailyMap.entries())
      .map(([date, flows]) => ({
        date,
        inflow: (Number(flows.in) / 1e18).toFixed(4),
        outflow: (Number(flows.out) / 1e18).toFixed(4),
        netFlow: (Number(flows.in - flows.out) / 1e18).toFixed(4),
        txCount: flows.count
      }))
      .reverse();
  }

  private calculateTrends(dailyFlows: any[]): any {
    if (dailyFlows.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }

    const recent = dailyFlows.slice(-3);
    const previous = dailyFlows.slice(0, -3);

    const recentAvg = recent.reduce((sum, d) => sum + Number(d.netFlow), 0) / recent.length;
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, d) => sum + Number(d.netFlow), 0) / previous.length 
      : recentAvg;

    const change = previousAvg !== 0 ? ((recentAvg - previousAvg) / Math.abs(previousAvg)) * 100 : 0;

    return {
      trend: change > 20 ? 'increasing' : change < -20 ? 'decreasing' : 'stable',
      change: change.toFixed(2) + '%',
      recentAvg: recentAvg.toFixed(4),
      previousAvg: previousAvg.toFixed(4)
    };
  }

  private generateMockTopList(type: 'sender' | 'receiver', limit: number): any[] {
    const items: any[] = [];
    const prefixes = ['0x', 'vitalik', 'a16z', 'binance', 'wintermute', 'jane', 'dharma'];
    
    for (let i = 0; i < limit; i++) {
      const value = (Math.random() * 1000 + 100).toFixed(2);
      items.push({
        rank: i + 1,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        totalFlow: value,
        txCount: Math.floor(Math.random() * 50 + 5),
        label: prefixes[i % prefixes.length] || null
      });
    }
    
    return items;
  }

  private findComparisonPatterns(comparisons: any[]): string[] {
    const patterns: string[] = [];
    
    if (comparisons.length < 2) return patterns;
    
    const netFlows = comparisons.map(c => Number(c.stats.netFlow));
    const allPositive = netFlows.every(f => f > 0);
    const allNegative = netFlows.every(f => f < 0);
    
    if (allPositive) patterns.push('All addresses are net receivers');
    if (allNegative) patterns.push('All addresses are net senders');
    
    const avgNetFlow = netFlows.reduce((a, b) => a + b, 0) / netFlows.length;
    const outliers = comparisons.filter(c => Math.abs(Number(c.stats.netFlow)) > Math.abs(avgNetFlow) * 2);
    
    if (outliers.length > 0) {
      patterns.push(`${outliers.length} address(es) have unusual flow compared to average`);
    }
    
    return patterns;
  }

  private calculateBaseline(txs: FlowTransaction[], address: string): any {
    const values = txs.map(tx => Number(BigInt(tx.value)) / 1e18);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - avgValue, 2), 0) / values.length);
    
    return {
      avgTxSize: avgValue.toFixed(4),
      stdDev: stdDev.toFixed(4),
      txCount: txs.length,
      uniqueCounterparties: new Set(txs.map(tx => tx.from).concat(txs.map(tx => tx.to))).size
    };
  }

  private findAnomalies(txs: FlowTransaction[], address: string, baseline: any): any[] {
    const anomalies: any[] = [];
    const threshold = Number(baseline.stdDev) * 2 + Number(baseline.avgTxSize);
    
    for (const tx of txs) {
      const value = Number(BigInt(tx.value)) / 1e18;
      
      if (value > threshold) {
        anomalies.push({
          type: 'large_transaction',
          direction: tx.to.toLowerCase() === address.toLowerCase() ? 'in' : 'out',
          value: value.toFixed(4),
          expectedMax: threshold.toFixed(4),
          timestamp: tx.timestamp,
          hash: tx.hash
        });
      }
    }
    
    // Check for sudden activity changes
    const recentTxs = txs.slice(0, 10);
    const olderTxs = txs.slice(10);
    
    if (recentTxs.length > 0 && olderTxs.length > 0) {
      const recentAvg = recentTxs.reduce((s, tx) => s + Number(BigInt(tx.value)) / 1e18, 0) / recentTxs.length;
      const olderAvg = olderTxs.reduce((s, tx) => s + Number(BigInt(tx.value)) / 1e18, 0) / olderTxs.length;
      
      if (olderAvg > 0 && recentAvg / olderAvg > 3) {
        anomalies.push({
          type: 'activity_surge',
          recentAvg: recentAvg.toFixed(4),
          olderAvg: olderAvg.toFixed(4),
          multiplier: (recentAvg / olderAvg).toFixed(2) + 'x'
        });
      }
    }
    
    return anomalies;
  }

  private calculateRiskScore(anomalies: any[], baseline: any): number {
    let score = 0;
    
    // Large transactions
    const largeTxs = anomalies.filter(a => a.type === 'large_transaction');
    score += Math.min(largeTxs.length * 20, 60);
    
    // Activity surge
    if (anomalies.some(a => a.type === 'activity_surge')) {
      score += 30;
    }
    
    // Low transaction count (potential inactive)
    if (baseline.txCount < 10) {
      score += 10;
    }
    
    return Math.min(score, 100);
  }

  private getRecommendation(score: number): string {
    if (score < 20) return 'Normal activity pattern';
    if (score < 50) return 'Monitor address for unusual activity';
    if (score < 75) return 'Exercise caution - unusual patterns detected';
    return 'High risk - verify before transactions';
  }

  private analyzeTimePatterns(txs: FlowTransaction[], address: string): any {
    const hourCounts = new Array(24).fill(0);
    
    for (const tx of txs) {
      const hour = new Date(tx.timestamp).getHours();
      hourCounts[hour]++;
    }
    
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const activeHours = hourCounts.filter(c => c > 0).length;
    
    return {
      peakHour,
      distribution: hourCounts,
      activeHours,
      pattern: activeHours > 16 ? 'highly_distributed' : activeHours > 8 ? 'moderate' : 'concentrated'
    };
  }

  private analyzeSizePatterns(txs: FlowTransaction[], address: string): any {
    const sizes = txs.map(tx => Number(BigInt(tx.value)) / 1e18).sort((a, b) => b - a);
    
    const small = sizes.filter(s => s < 0.1).length;
    const medium = sizes.filter(s => s >= 0.1 && s < 1).length;
    const large = sizes.filter(s => s >= 1 && s < 10).length;
    const whale = sizes.filter(s => s >= 10).length;
    
    return {
      small,      // < 0.1 ETH
      medium,     // 0.1-1 ETH
      large,      // 1-10 ETH
      whale,      // > 10 ETH
      largest: sizes[0]?.toFixed(4) || '0',
      average: (sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(4)
    };
  }

  private analyzeCounterpartyPatterns(txs: FlowTransaction[], address: string): any {
    const counterparties = new Map<string, { in: number; out: number; count: number }>();
    
    for (const tx of txs) {
      const counterparty = tx.to.toLowerCase() === address.toLowerCase() ? tx.from : tx.to;
      if (!counterparty) continue;
      
      const current = counterparties.get(counterparty) || { in: 0, out: 0, count: 0 };
      const value = Number(BigInt(tx.value)) / 1e18;
      
      if (tx.to.toLowerCase() === address.toLowerCase()) {
        current.in += value;
      } else {
        current.out += value;
      }
      current.count++;
      counterparties.set(counterparty, current);
    }
    
    const topCounterparties = Array.from(counterparties.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([addr, stats]) => ({ address: addr, ...stats }));
    
    return {
      uniqueCounterparties: counterparties.size,
      topCounterparties,
      concentration: counterparties.size > 0 
        ? (Math.max(...Array.from(counterparties.values()).map(c => c.count)) / txs.length * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  private classifyAddress(txs: FlowTransaction[], address: string): any {
    if (txs.length === 0) {
      return { type: 'unknown', confidence: 0, description: 'No transaction history' };
    }
    
    const stats = this.calculateFlowStats(txs, address);
    const netFlow = Number(stats.netFlow);
    const txCount = stats.txCount;
    
    // Simple classification logic
    if (netFlow > 10 && txCount > 20) {
      return { 
        type: 'whale_collector', 
        confidence: 75, 
        description: 'Accumulating address with high inflow' 
      };
    }
    
    if (netFlow < -10 && txCount > 20) {
      return { 
        type: 'distributor', 
        confidence: 70, 
        description: 'High outflow - likely a distribution wallet' 
      };
    }
    
    if (stats.uniqueCounterparties > 20) {
      return { 
        type: 'trader', 
        confidence: 65, 
        description: 'Many counterparties - likely active trading' 
      };
    }
    
    if (stats.uniqueCounterparties <= 3 && txCount > 10) {
      return { 
        type: ' Whale', 
        confidence: 60, 
        description: 'Limited counterparties - could be institutional' 
      };
    }
    
    return { 
      type: 'regular', 
      confidence: 50, 
      description: 'Regular wallet with typical activity' 
    };
  }
}
