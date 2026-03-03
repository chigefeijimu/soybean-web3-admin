// Bridge Status Service

class BridgeStatusService {
  // Bridge configurations
  constructor() {
    this.bridges = {
      layerzero: {
        name: 'LayerZero',
        logo: '🪢',
        supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base', 'solana', 'zksync', 'starknet'],
        category: 'omnichain',
      },
      stargate: {
        name: 'Stargate',
        logo: '🌉',
        supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base'],
        category: 'liquidity',
      },
      across: {
        name: 'Across',
        logo: '↔️',
        supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon'],
        category: 'optimistic',
      },
      hop: {
        name: 'Hop',
        logo: '🐰',
        supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon'],
        category: 'liquidity',
      },
      orbiter: {
        name: 'Orbiter',
        logo: '🛸',
        supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base', 'zksync', 'starknet'],
        category: 'atomic',
      },
      celer: {
        name: 'Celer cBridge',
        logo: '🌐',
        supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base'],
        category: 'liquidity',
      },
      axelar: {
        name: 'Axelar',
        logo: '🔗',
        supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc', 'base', 'solana'],
        category: 'canonical',
      },
      wormhole: {
        name: 'Wormhole',
        logo: '🕳️',
        supportedChains: ['ethereum', 'solana', 'avalanche', 'polygon', 'bsc', 'arbitrum', 'optimism', 'base'],
        category: 'canonical',
      },
      synapse: {
        name: 'Synapse',
        logo: '🔄',
        supportedChains: ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'bsc'],
        category: 'liquidity',
      },
      allbridge: {
        name: 'AllBridge',
        logo: '🌈',
        supportedChains: ['ethereum', 'solana', 'avalanche', 'polygon', 'bsc', 'algorand'],
        category: 'canonical',
      },
    };

    this.chains = {
      ethereum: { name: 'Ethereum', color: '#627EEA', nativeSymbol: 'ETH' },
      arbitrum: { name: 'Arbitrum', color: '#28A0F0', nativeSymbol: 'ETH' },
      optimism: { name: 'Optimism', color: '#FF0420', nativeSymbol: 'ETH' },
      polygon: { name: 'Polygon', color: '#8247E5', nativeSymbol: 'MATIC' },
      avalanche: { name: 'Avalanche', color: '#E84142', nativeSymbol: 'AVAX' },
      bsc: { name: 'BNB Chain', color: '#F3BA2F', nativeSymbol: 'BNB' },
      base: { name: 'Base', color: '#0052FF', nativeSymbol: 'ETH' },
      solana: { name: 'Solana', color: '#9945FF', nativeSymbol: 'SOL' },
      zksync: { name: 'zkSync Era', color: '#8B5CF6', nativeSymbol: 'ETH' },
      starknet: { name: 'Starknet', color: '#FF4D8D', nativeSymbol: 'ETH' },
      algorand: { name: 'Algorand', color: '#000000', nativeSymbol: 'ALGO' },
    };
  }

  // Generate realistic status data
  generateBridgeStatus(bridgeKey) {
    const bridge = this.bridges[bridgeKey];
    if (!bridge) {
      throw new Error(`Bridge ${bridgeKey} not found`);
    }

    // Generate realistic metrics
    const baseLatency = this.getBaseLatency(bridge.category);
    const latency = baseLatency + Math.random() * 200;
    
    const statusOptions = ['operational', 'operational', 'operational', 'degraded', 'maintenance'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    const successRate = status === 'operational' ? 98 + Math.random() * 2 : 
                        status === 'degraded' ? 90 + Math.random() * 8 : 
                        95 + Math.random() * 3;

    const feeRange = this.getFeeRange(bridge.category);
    
    // Generate issues
    const issues = [];
    if (Math.random() > 0.7) {
      issues.push({
        id: `issue-${Date.now()}`,
        title: 'Intermittent delays on ' + bridge.supportedChains[Math.floor(Math.random() * bridge.supportedChains.length)],
        severity: status === 'degraded' ? 'medium' : 'low',
        status: status === 'degraded' ? 'open' : 'monitoring',
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
        description: 'Some users may experience delayed confirmations during high traffic periods.',
      });
    }

    return {
      name: bridge.name,
      logo: bridge.logo,
      status,
      latency: Math.round(latency),
      successRate: Number(successRate.toFixed(2)),
      avgConfirmationTime: this.getAvgConfirmationTime(bridge.category),
      volume24h: this.generateVolume(),
      txCount24h: Math.floor(Math.random() * 50000) + 10000,
      fee: feeRange,
      supportedChains: bridge.supportedChains,
      lastUpdated: new Date().toISOString(),
      issues,
    };
  }

  getBaseLatency(category) {
    const latencies = {
      atomic: 500,
      optimistic: 1500,
      liquidity: 2000,
      canonical: 3000,
    };
    return latencies[category] || 2000;
  }

  getFeeRange(category) {
    const fees = {
      atomic: { min: 0.05, max: 0.15, token: 'ETH' },
      optimistic: { min: 0.1, max: 0.25, token: 'ETH' },
      liquidity: { min: 0.15, max: 0.4, token: 'ETH' },
      canonical: { min: 0.2, max: 0.5, token: 'ETH' },
    };
    return fees[category] || { min: 0.1, max: 0.3, token: 'ETH' };
  }

  getAvgConfirmationTime(category) {
    const times = {
      atomic: 3,
      optimistic: 5,
      liquidity: 15,
      canonical: 20,
    };
    return times[category] || 10;
  }

  generateVolume() {
    return Math.floor(Math.random() * 450000000) + 50000000;
  }

  async getAllBridgeStatus() {
    const statuses = [];
    for (const bridgeKey of Object.keys(this.bridges)) {
      try {
        statuses.push(this.generateBridgeStatus(bridgeKey));
      } catch (e) {
        console.error(`Error generating status for ${bridgeKey}:`, e);
      }
    }
    return statuses;
  }

  async getBridgeStatus(bridge) {
    const key = bridge.toLowerCase();
    if (!this.bridges[key]) {
      return null;
    }
    return this.generateBridgeStatus(key);
  }

  async getBridgeChains(bridge) {
    const key = bridge.toLowerCase();
    const bridgeConfig = this.bridges[key];
    return bridgeConfig?.supportedChains || [];
  }

  async getRecommendedBridges(fromChain, toChain, amount) {
    const from = fromChain.toLowerCase();
    const to = toChain.toLowerCase();

    const recommendations = [];

    for (const [key, bridge] of Object.entries(this.bridges)) {
      // Check if bridge supports both chains
      if (!bridge.supportedChains.includes(from) || !bridge.supportedChains.includes(to)) {
        continue;
      }

      const status = this.generateBridgeStatus(key);
      
      // Calculate score
      let score = 100;
      
      // Factor in status
      if (status.status === 'degraded') score -= 20;
      else if (status.status === 'maintenance') score -= 40;
      
      // Factor in success rate
      score -= (100 - status.successRate) * 0.5;
      
      // Factor in latency
      score -= status.latency / 100;
      
      // Factor in fee (if amount provided)
      if (amount) {
        const avgFee = (status.fee.min + status.fee.max) / 2;
        const feePercentage = (avgFee / amount) * 100;
        score -= feePercentage * 2;
      }

      // Generate reasons
      const reasons = [];
      if (status.successRate > 99) reasons.push('High success rate (99%+)');
      if (status.latency < 1000) reasons.push('Fast transaction speed');
      if (status.fee.max < 0.3) reasons.push('Competitive fees');
      if (bridge.category === 'atomic') reasons.push('Instant bridge with atomic swap');
      if (status.issues.length === 0) reasons.push('No active issues');

      recommendations.push({
        bridge: bridge.name,
        logo: bridge.logo,
        score: Math.max(0, Math.round(score)),
        reasons: reasons.length > 0 ? reasons : ['Standard bridge option'],
        estimatedTime: status.avgConfirmationTime + ' min',
        estimatedFee: (status.fee.min + status.fee.max) / 2,
        securityScore: this.getSecurityScore(bridge.category),
        easeOfUse: this.getEaseOfUse(bridge.category),
      });
    }

    // Sort by score
    return recommendations.sort((a, b) => b.score - a.score);
  }

  getSecurityScore(category) {
    const scores = {
      atomic: 95,
      optimistic: 88,
      liquidity: 85,
      canonical: 90,
    };
    return scores[category] || 85;
  }

  getEaseOfUse(category) {
    const ease = {
      atomic: 'easy',
      optimistic: 'easy',
      liquidity: 'medium',
      canonical: 'medium',
    };
    return ease[category] || 'medium';
  }

  async getBridgeStats() {
    const statuses = await this.getAllBridgeStatus();

    return {
      totalBridges: statuses.length,
      operationalBridges: statuses.filter(s => s.status === 'operational').length,
      degradedBridges: statuses.filter(s => s.status === 'degraded').length,
      totalVolume24h: statuses.reduce((sum, s) => sum + s.volume24h, 0),
      totalTx24h: statuses.reduce((sum, s) => sum + s.txCount24h, 0),
      avgSuccessRate: statuses.reduce((sum, s) => sum + s.successRate, 0) / statuses.length,
      mostPopular: statuses
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 5)
        .map(s => ({ bridge: s.name, volume: s.volume24h })),
    };
  }

  async getBridgeHistory(bridge, days = 7) {
    const dailyData = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86400000);
      dailyData.push({
        date: date.toISOString().split('T')[0],
        volume: this.generateVolume() * (0.8 + Math.random() * 0.4),
        txCount: Math.floor(Math.random() * 50000) + 10000,
        successRate: 95 + Math.random() * 5,
      });
    }

    return {
      bridge,
      dailyData,
    };
  }

  async getCurrentVolume() {
    const statuses = await this.getAllBridgeStatus();
    
    const bridges = statuses.map(s => ({
      name: s.name,
      volume: s.volume24h,
      change24h: (Math.random() - 0.5) * 30,
    }));

    const totalVolume = bridges.reduce((sum, b) => sum + b.volume, 0);
    const change24h = (Math.random() - 0.5) * 20;

    return {
      bridges,
      totalVolume,
      change24h: Number(change24h.toFixed(2)),
    };
  }

  async getChainConnectivity() {
    const connectivity = [];

    for (const [chainKey, chainInfo] of Object.entries(this.chains)) {
      const connectedChains = [];

      for (const [bridgeKey, bridge] of Object.entries(this.bridges)) {
        if (bridge.supportedChains.includes(chainKey)) {
          for (const otherChain of bridge.supportedChains) {
            if (otherChain !== chainKey && this.chains[otherChain]) {
              const existing = connectedChains.find(c => c.name === this.chains[otherChain].name);
              if (!existing) {
                connectedChains.push({
                  name: this.chains[otherChain].name,
                  bridge: bridge.name,
                  avgTime: this.getAvgConfirmationTime(bridge.category) + ' min',
                });
              }
            }
          }
        }
      }

      connectivity.push({
        chain: chainInfo.name,
        connectedChains: connectedChains.slice(0, 5),
      });
    }

    return connectivity;
  }
}

module.exports = { BridgeStatusService };
