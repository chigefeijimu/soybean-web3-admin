import { Injectable } from '@nestjs/common';

interface Protocol {
  id: string;
  name: string;
  category: string;
  chain: string;
  tvl: number;
  interactions: number;
  riskScore: number;
  centralities: {
    degree: number;
    betweenness: number;
    closeness: number;
  };
}

interface Interaction {
  fromProtocol: string;
  toProtocol: string;
  type: string;
  volume24h: number;
  txCount: number;
  chain: string;
}

interface Cluster {
  id: string;
  name: string;
  protocols: string[];
  totalTVL: number;
}

@Injectable()
export class DefiProtocolGraphService {
  private protocols: Protocol[] = [
    { id: 'aave', name: 'Aave', category: 'Lending', chain: 'Ethereum', tvl: 12500000000, interactions: 45, riskScore: 15, centralities: { degree: 92, betweenness: 88, closeness: 0.85 } },
    { id: 'compound', name: 'Compound', category: 'Lending', chain: 'Ethereum', tvl: 2800000000, interactions: 38, riskScore: 18, centralities: { degree: 78, betweenness: 72, closeness: 0.78 } },
    { id: 'uniswap-v3', name: 'Uniswap V3', category: 'DEX', chain: 'Ethereum', tvl: 4500000000, interactions: 120, riskScore: 12, centralities: { degree: 98, betweenness: 95, closeness: 0.92 } },
    { id: 'uniswap-v2', name: 'Uniswap V2', category: 'DEX', chain: 'Ethereum', tvl: 1800000000, interactions: 95, riskScore: 14, centralities: { degree: 90, betweenness: 82, closeness: 0.88 } },
    { id: 'sushiswap', name: 'SushiSwap', category: 'DEX', chain: 'Ethereum', tvl: 900000000, interactions: 72, riskScore: 22, centralities: { degree: 75, betweenness: 65, closeness: 0.72 } },
    { id: 'curve', name: 'Curve', category: 'DEX', chain: 'Ethereum', tvl: 2200000000, interactions: 68, riskScore: 10, centralities: { degree: 85, betweenness: 80, closeness: 0.82 } },
    { id: 'balancer', name: 'Balancer', category: 'DEX', chain: 'Ethereum', tvl: 1100000000, interactions: 52, riskScore: 16, centralities: { degree: 70, betweenness: 60, closeness: 0.70 } },
    { id: 'lido', name: 'Lido', category: 'Liquid Staking', chain: 'Ethereum', tvl: 32000000000, interactions: 55, riskScore: 12, centralities: { degree: 88, betweenness: 85, closeness: 0.86 } },
    { id: 'rocket-pool', name: 'Rocket Pool', category: 'Liquid Staking', chain: 'Ethereum', tvl: 2800000000, interactions: 28, riskScore: 18, centralities: { degree: 55, betweenness: 45, closeness: 0.62 } },
    { id: 'yearn', name: 'Yearn Finance', category: 'Yield Aggregator', chain: 'Ethereum', tvl: 650000000, interactions: 62, riskScore: 25, centralities: { degree: 80, betweenness: 75, closeness: 0.78 } },
    { id: 'convex', name: 'Convex Finance', category: 'Yield Aggregator', chain: 'Ethereum', tvl: 1800000000, interactions: 48, riskScore: 20, centralities: { degree: 72, betweenness: 68, closeness: 0.74 } },
    { id: 'makerdao', name: 'MakerDAO', category: 'Lending', chain: 'Ethereum', tvl: 8500000000, interactions: 42, riskScore: 22, centralities: { degree: 82, betweenness: 78, closeness: 0.80 } },
    { id: 'aave-v3', name: 'Aave V3', category: 'Lending', chain: 'Polygon', tvl: 1500000000, interactions: 35, riskScore: 14, centralities: { degree: 68, betweenness: 60, closeness: 0.72 } },
    { id: 'quickSwap', name: 'QuickSwap', category: 'DEX', chain: 'Polygon', tvl: 450000000, interactions: 58, riskScore: 24, centralities: { degree: 65, betweenness: 55, closeness: 0.68 } },
    { id: 'sushi-polygon', name: 'SushiSwap', category: 'DEX', chain: 'Polygon', tvl: 180000000, interactions: 42, riskScore: 28, centralities: { degree: 52, betweenness: 42, closeness: 0.60 } },
    { id: 'aave-arbitrum', name: 'Aave', category: 'Lending', chain: 'Arbitrum', tvl: 2200000000, interactions: 32, riskScore: 16, centralities: { degree: 62, betweenness: 55, closeness: 0.68 } },
    { id: 'uniswap-arbitrum', name: 'Uniswap', category: 'DEX', chain: 'Arbitrum', tvl: 850000000, interactions: 48, riskScore: 18, centralities: { degree: 70, betweenness: 62, closeness: 0.72 } },
    { id: 'camelot', name: 'Camelot', category: 'DEX', chain: 'Arbitrum', tvl: 320000000, interactions: 35, riskScore: 28, centralities: { degree: 48, betweenness: 38, closeness: 0.55 } },
    { id: 'aave-optimism', name: 'Aave', category: 'Lending', chain: 'Optimism', tvl: 1800000000, interactions: 30, riskScore: 15, centralities: { degree: 60, betweenness: 52, closeness: 0.66 } },
    { id: 'uniswap-optimism', name: 'Uniswap', category: 'DEX', chain: 'Optimism', tvl: 520000000, interactions: 42, riskScore: 20, centralities: { degree: 65, betweenness: 58, closeness: 0.70 } },
    { id: 'velodrome', name: 'Velodrome', category: 'DEX', chain: 'Optimism', tvl: 280000000, interactions: 38, riskScore: 24, centralities: { degree: 55, betweenness: 45, closeness: 0.62 } },
    { id: 'pancakeswap', name: 'PancakeSwap', category: 'DEX', chain: 'BSC', tvl: 1200000000, interactions: 65, riskScore: 22, centralities: { degree: 78, betweenness: 70, closeness: 0.76 } },
    { id: 'bsc-aave', name: 'Aave', category: 'Lending', chain: 'BSC', tvl: 680000000, interactions: 28, riskScore: 26, centralities: { degree: 50, betweenness: 40, closeness: 0.58 } },
    { id: 'trader-joe', name: 'Trader Joe', category: 'DEX', chain: 'Avalanche', tvl: 450000000, interactions: 42, riskScore: 24, centralities: { degree: 58, betweenness: 48, closeness: 0.64 } },
    { id: 'aave-avalanche', name: 'Aave', category: 'Lending', chain: 'Avalanche', tvl: 520000000, interactions: 25, riskScore: 28, centralities: { degree: 45, betweenness: 35, closeness: 0.52 } },
    { id: 'aerodrome', name: 'Aerodrome', category: 'DEX', chain: 'Base', tvl: 180000000, interactions: 28, riskScore: 30, centralities: { degree: 42, betweenness: 32, closeness: 0.50 } },
    { id: 'morpho', name: 'Morpho', category: 'Lending', chain: 'Ethereum', tvl: 650000000, interactions: 35, riskScore: 20, centralities: { degree: 58, betweenness: 50, closeness: 0.65 } },
    { id: 'gearbox', name: 'Gearbox', category: 'Lending', chain: 'Ethereum', tvl: 180000000, interactions: 28, riskScore: 32, centralities: { degree: 40, betweenness: 30, closeness: 0.48 } },
    { id: 'liquity', name: 'Liquity', category: 'Lending', chain: 'Ethereum', tvl: 280000000, interactions: 22, riskScore: 28, centralities: { degree: 38, betweenness: 28, closeness: 0.45 } },
    { id: 'pendle', name: 'Pendle', category: 'Yield', chain: 'Ethereum', tvl: 420000000, interactions: 32, riskScore: 26, centralities: { degree: 52, betweenness: 42, closeness: 0.60 } },
  ];

  private interactions: Interaction[] = [
    { fromProtocol: 'lido', toProtocol: 'aave', type: 'Collateral', volume24h: 1250000000, txCount: 1250, chain: 'Ethereum' },
    { fromProtocol: 'lido', toProtocol: 'compound', type: 'Collateral', volume24h: 450000000, txCount: 680, chain: 'Ethereum' },
    { fromProtocol: 'uniswap-v3', toProtocol: 'aave', type: 'Liquidity', volume24h: 280000000, txCount: 520, chain: 'Ethereum' },
    { fromProtocol: 'uniswap-v3', toProtocol: 'curve', type: 'Liquidity', volume24h: 180000000, txCount: 380, chain: 'Ethereum' },
    { fromProtocol: 'curve', toProtocol: 'convex', type: 'Staking', volume24h: 85000000, txCount: 220, chain: 'Ethereum' },
    { fromProtocol: 'yearn', toProtocol: 'aave', type: 'Yield Farming', volume24h: 32000000, txCount: 85, chain: 'Ethereum' },
    { fromProtocol: 'yearn', toProtocol: 'compound', type: 'Yield Farming', volume24h: 18000000, txCount: 45, chain: 'Ethereum' },
    { fromProtocol: 'uniswap-v2', toProtocol: 'sushiswap', type: 'Arbitrage', volume24h: 45000000, txCount: 180, chain: 'Ethereum' },
    { fromProtocol: 'balancer', toProtocol: 'aave', type: 'Collateral', volume24h: 65000000, txCount: 120, chain: 'Ethereum' },
    { fromProtocol: 'makerdao', toProtocol: 'aave', type: 'Collateral', volume24h: 180000000, txCount: 280, chain: 'Ethereum' },
    { fromProtocol: 'compound', toProtocol: 'uniswap-v3', type: 'Swap', volume24h: 28000000, txCount: 95, chain: 'Ethereum' },
    { fromProtocol: 'aave', toProtocol: 'uniswap-v3', type: 'Swap', volume24h: 45000000, txCount: 145, chain: 'Ethereum' },
    { fromProtocol: 'pancakeswap', toProtocol: 'bsc-aave', type: 'Liquidity', volume24h: 35000000, txCount: 85, chain: 'BSC' },
    { fromProtocol: 'quickSwap', toProtocol: 'aave-v3', type: 'Liquidity', volume24h: 18000000, txCount: 42, chain: 'Polygon' },
    { fromProtocol: 'uniswap-arbitrum', toProtocol: 'aave-arbitrum', type: 'Liquidity', volume24h: 22000000, txCount: 55, chain: 'Arbitrum' },
    { fromProtocol: 'trader-joe', toProtocol: 'aave-avalanche', type: 'Liquidity', volume24h: 12000000, txCount: 32, chain: 'Avalanche' },
    { fromProtocol: 'velodrome', toProtocol: 'aave-optimism', type: 'Liquidity', volume24h: 15000000, txCount: 38, chain: 'Optimism' },
    { fromProtocol: 'aerodrome', toProtocol: 'aave', type: 'Liquidity', volume24h: 8000000, txCount: 22, chain: 'Base' },
    { fromProtocol: 'morpho', toProtocol: 'aave', type: 'Lending', volume24h: 45000000, txCount: 95, chain: 'Ethereum' },
    { fromProtocol: 'morpho', toProtocol: 'compound', type: 'Lending', volume24h: 28000000, txCount: 62, chain: 'Ethereum' },
    { fromProtocol: 'gearbox', toProtocol: 'uniswap-v3', type: 'Leverage', volume24h: 12000000, txCount: 28, chain: 'Ethereum' },
    { fromProtocol: 'pendle', toProtocol: 'yearn', type: 'Yield', volume24h: 18000000, txCount: 45, chain: 'Ethereum' },
  ];

  async getProtocolGraphOverview() {
    const totalTVL = this.protocols.reduce((sum, p) => sum + p.tvl, 0);
    const avgRiskScore = this.protocols.reduce((sum, p) => sum + p.riskScore, 0) / this.protocols.length;
    const totalInteractions = this.interactions.length;
    
    const categoryStats = this.protocols.reduce((acc, p) => {
      if (!acc[p.category]) {
        acc[p.category] = { count: 0, tvl: 0 };
      }
      acc[p.category].count++;
      acc[p.category].tvl += p.tvl;
      return acc;
    }, {} as Record<string, { count: number; tvl: number }>);

    const chainStats = this.protocols.reduce((acc, p) => {
      if (!acc[p.chain]) {
        acc[p.chain] = { count: 0, tvl: 0 };
      }
      acc[p.chain].count++;
      acc[p.chain].tvl += p.tvl;
      return acc;
    }, {} as Record<string, { count: number; tvl: number }>);

    return {
      totalProtocols: this.protocols.length,
      totalInteractions,
      totalTVL,
      avgRiskScore: Math.round(avgRiskScore * 10) / 10,
      categoryStats: Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        ...stats,
      })),
      chainStats: Object.entries(chainStats).map(([chain, stats]) => ({
        chain,
        ...stats,
      })),
    };
  }

  async getProtocols(chain?: string, category?: string) {
    let filtered = this.protocols;
    
    if (chain) {
      filtered = filtered.filter(p => p.chain.toLowerCase() === chain.toLowerCase());
    }
    
    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    
    return filtered.sort((a, b) => b.tvl - a.tvl);
  }

  async getProtocolDetails(protocolId: string) {
    const protocol = this.protocols.find(p => p.id === protocolId);
    if (!protocol) {
      return { error: 'Protocol not found' };
    }

    const relatedInteractions = this.interactions.filter(
      i => i.fromProtocol === protocolId || i.toProtocol === protocolId
    );

    const incomingVolume = relatedInteractions
      .filter(i => i.toProtocol === protocolId)
      .reduce((sum, i) => sum + i.volume24h, 0);

    const outgoingVolume = relatedInteractions
      .filter(i => i.fromProtocol === protocolId)
      .reduce((sum, i) => sum + i.volume24h, 0);

    const connectedProtocols = [...new Set([
      ...relatedInteractions.filter(i => i.fromProtocol === protocolId).map(i => i.toProtocol),
      ...relatedInteractions.filter(i => i.toProtocol === protocolId).map(i => i.fromProtocol),
    ])];

    return {
      ...protocol,
      incomingVolume24h: incomingVolume,
      outgoingVolume24h: outgoingVolume,
      totalVolume24h: incomingVolume + outgoingVolume,
      connectedProtocols,
      interactionCount: relatedInteractions.length,
      interactionTypes: [...new Set(relatedInteractions.map(i => i.type))],
    };
  }

  async getProtocolInteractions(protocolId?: string, chain?: string) {
    let filtered = this.interactions;
    
    if (protocolId) {
      filtered = filtered.filter(
        i => i.fromProtocol === protocolId || i.toProtocol === protocolId
      );
    }
    
    if (chain) {
      filtered = filtered.filter(i => i.chain.toLowerCase() === chain.toLowerCase());
    }
    
    return filtered;
  }

  async getFlowBetweenProtocols(fromProtocol: string, toProtocol: string) {
    const flow = this.interactions.find(
      i => i.fromProtocol === fromProtocol && i.toProtocol === toProtocol
    );

    const reverseFlow = this.interactions.find(
      i => i.fromProtocol === toProtocol && i.toProtocol === fromProtocol
    );

    return {
      direct: flow || null,
      reverse: reverseFlow || null,
      totalVolume24h: (flow?.volume24h || 0) + (reverseFlow?.volume24h || 0),
      netFlow: (flow?.volume24h || 0) - (reverseFlow?.volume24h || 0),
    };
  }

  async analyzeRiskPropagation(protocolId: string) {
    const protocol = this.protocols.find(p => p.id === protocolId);
    if (!protocol) {
      return { error: 'Protocol not found' };
    }

    const connectedInteractions = this.interactions.filter(
      i => i.fromProtocol === protocolId || i.toProtocol === protocolId
    );

    const connectedProtocols = [...new Set([
      ...connectedInteractions.map(i => i.fromProtocol),
      ...connectedInteractions.map(i => i.toProtocol),
    ])].filter(id => id !== protocolId);

    const riskPropagation = connectedProtocols.map(connectedId => {
      const connectedProtocol = this.protocols.find(p => p.id === connectedId);
      const interaction = connectedInteractions.find(
        i => (i.fromProtocol === protocolId && i.toProtocol === connectedId) ||
             (i.fromProtocol === connectedId && i.toProtocol === protocolId)
      );

      const propagationRisk = (protocol.riskScore * connectedProtocol!.riskScore) / 100;
      const volumeRisk = interaction ? Math.min(interaction.volume24h / 1000000000, 50) : 0;

      return {
        protocol: connectedId,
        protocolName: connectedProtocol!.name,
        riskScore: connectedProtocol!.riskScore,
        interactionType: interaction?.type || 'Unknown',
        volume24h: interaction?.volume24h || 0,
        propagationRisk: Math.round(propagationRisk * 100) / 100,
        volumeRisk: Math.round(volumeRisk * 100) / 100,
        totalRisk: Math.round((propagationRisk + volumeRisk) * 100) / 100,
      };
    }).sort((a, b) => b.totalRisk - a.totalRisk);

    const totalExposure = riskPropagation.reduce((sum, r) => sum + r.totalRisk, 0);
    const maxSingleExposure = Math.max(...riskPropagation.map(r => r.totalRisk), 0);

    return {
      sourceProtocol: protocolId,
      sourceRiskScore: protocol.riskScore,
      connectedCount: connectedProtocols.length,
      riskPropagation: riskPropagation.slice(0, 10),
      totalExposure: Math.round(totalExposure * 100) / 100,
      maxSingleExposure: Math.round(maxSingleExposure * 100) / 100,
      riskLevel: totalExposure > 80 ? 'HIGH' : totalExposure > 40 ? 'MEDIUM' : 'LOW',
    };
  }

  async identifyProtocolClusters(chain?: string) {
    let protocolsToCluster = this.protocols;
    if (chain) {
      protocolsToCluster = this.protocols.filter(
        p => p.chain.toLowerCase() === chain.toLowerCase()
      );
    }

    const clusters: Cluster[] = [
      {
        id: 'lending-core',
        name: 'Core Lending',
        protocols: ['aave', 'compound', 'makerdao', 'morpho'],
        totalTVL: this.protocols.filter(p => ['aave', 'compound', 'makerdao', 'morpho'].includes(p.id)).reduce((sum, p) => sum + p.tvl, 0),
      },
      {
        id: 'dex-core',
        name: 'Core DEX',
        protocols: ['uniswap-v3', 'uniswap-v2', 'curve', 'balancer'],
        totalTVL: this.protocols.filter(p => ['uniswap-v3', 'uniswap-v2', 'curve', 'balancer'].includes(p.id)).reduce((sum, p) => sum + p.tvl, 0),
      },
      {
        id: 'liquid-staking',
        name: 'Liquid Staking',
        protocols: ['lido', 'rocket-pool'],
        totalTVL: this.protocols.filter(p => ['lido', 'rocket-pool'].includes(p.id)).reduce((sum, p) => sum + p.tvl, 0),
      },
      {
        id: 'yield-aggregators',
        name: 'Yield Aggregators',
        protocols: ['yearn', 'convex', 'pendle'],
        totalTVL: this.protocols.filter(p => ['yearn', 'convex', 'pendle'].includes(p.id)).reduce((sum, p) => sum + p.tvl, 0),
      },
      {
        id: 'layer2-dex',
        name: 'Layer2 DEX',
        protocols: ['quickSwap', 'uniswap-arbitrum', 'uniswap-optimism', 'camelot', 'velodrome', 'aerodrome'],
        totalTVL: this.protocols.filter(p => ['quickSwap', 'uniswap-arbitrum', 'uniswap-optimism', 'camelot', 'velodrome', 'aerodrome'].includes(p.id)).reduce((sum, p) => sum + p.tvl, 0),
      },
    ];

    return clusters.filter(c => c.totalTVL > 0);
  }

  async calculateProtocolCentrality(chain?: string) {
    let protocols = this.protocols;
    if (chain) {
      protocols = this.protocols.filter(
        p => p.chain.toLowerCase() === chain.toLowerCase()
      );
    }

    return protocols
      .map(p => ({
        id: p.id,
        name: p.name,
        chain: p.chain,
        category: p.category,
        degreeCentrality: Math.round(p.centralities.degree),
        betweennessCentrality: Math.round(p.centralities.betweenness),
        closenessCentrality: Math.round(p.centralities.closeness * 100),
        centralityScore: Math.round((p.centralities.degree + p.centralities.betweenness) / 2),
      }))
      .sort((a, b) => b.centralityScore - a.centralityScore);
  }

  async findSimilarProtocols(protocolId: string, limit: number = 5) {
    const protocol = this.protocols.find(p => p.id === protocolId);
    if (!protocol) {
      return { error: 'Protocol not found' };
    }

    const similar = this.protocols
      .filter(p => p.id !== protocolId)
      .map(p => {
        let score = 0;
        if (p.category === protocol.category) score += 40;
        if (p.chain === protocol.chain) score += 30;
        score += Math.max(0, 30 - Math.abs(p.riskScore - protocol.riskScore));
        
        const sharedConnections = this.interactions.filter(
          i => (i.fromProtocol === protocolId && i.toProtocol === p.id) ||
               (i.fromProtocol === p.id && i.toProtocol === protocolId)
        ).length;
        score += sharedConnections * 20;

        return { ...p, similarityScore: score };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    return similar;
  }

  async getDashboard() {
    const overview = await this.getProtocolGraphOverview();
    const topProtocols = this.protocols.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      tvl: p.tvl,
      interactions: p.interactions,
      riskScore: p.riskScore,
    }));

    const topInteractions = this.interactions
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 10);

    const centrality = await this.calculateProtocolCentrality();

    return {
      overview,
      topProtocols,
      topInteractions,
      centrality: centrality.slice(0, 10),
    };
  }

  async getHistoricalData(period: string) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    
    const data: { date: string; totalTVL: number; interactionCount: number; activeProtocols: number }[] = [];
    const baseTVL = 85000000000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const randomChange = (Math.random() - 0.48) * 0.02;
      const tvl = baseTVL * (1 + randomChange * (i / days));
      
      data.push({
        date: date.toISOString().split('T')[0],
        totalTVL: Math.round(tvl),
        interactionCount: Math.floor(800 + Math.random() * 400),
        activeProtocols: Math.floor(25 + Math.random() * 5),
      });
    }

    return {
      period,
      data,
    };
  }
}
