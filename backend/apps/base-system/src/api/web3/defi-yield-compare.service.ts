import { Injectable } from '@nestjs/common';

interface YieldFilter {
  chain?: string;
  protocol?: string;
  asset?: string;
}

interface ProtocolInfo {
  name: string;
  chain: string;
  category: string;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
}

@Injectable()
export class DefiYieldCompareService {
  // Mock data for supported DeFi protocols
  private protocols: ProtocolInfo[] = [
    { name: 'Aave', chain: 'Ethereum', category: 'Lending', tvl: 15000000000, risk: 'low' },
    { name: 'Aave', chain: 'Polygon', category: 'Lending', tvl: 1200000000, risk: 'low' },
    { name: 'Aave', chain: 'Arbitrum', category: 'Lending', tvl: 800000000, risk: 'low' },
    { name: 'Compound', chain: 'Ethereum', category: 'Lending', tvl: 9000000000, risk: 'low' },
    { name: 'Compound', chain: 'Polygon', category: 'Lending', tvl: 300000000, risk: 'low' },
    { name: 'Uniswap V3', chain: 'Ethereum', category: 'DEX', tvl: 5000000000, risk: 'medium' },
    { name: 'Uniswap V3', chain: 'Arbitrum', category: 'DEX', tvl: 800000000, risk: 'medium' },
    { name: 'Uniswap V3', chain: 'Optimism', category: 'DEX', tvl: 400000000, risk: 'medium' },
    { name: 'Sushiswap', chain: 'Ethereum', category: 'DEX', tvl: 2500000000, risk: 'medium' },
    { name: 'Curve', chain: 'Ethereum', category: 'StableSwap', tvl: 2000000000, risk: 'low' },
    { name: 'Curve', chain: 'Arbitrum', category: 'StableSwap', tvl: 500000000, risk: 'low' },
    { name: 'Yearn', chain: 'Ethereum', category: 'Yield', tvl: 5000000000, risk: 'medium' },
    { name: 'Convex', chain: 'Ethereum', category: 'Yield', tvl: 3000000000, risk: 'medium' },
    { name: 'Lido', chain: 'Ethereum', category: 'Liquid Staking', tvl: 30000000000, risk: 'low' },
    { name: 'Rocket Pool', chain: 'Ethereum', category: 'Liquid Staking', tvl: 2000000000, risk: 'low' },
    { name: 'Frax', chain: 'Ethereum', category: 'Liquid Staking', tvl: 1500000000, risk: 'medium' },
    { name: 'Gearbox', chain: 'Ethereum', category: 'Leverage', tvl: 150000000, risk: 'high' },
    { name: 'Morpho', chain: 'Ethereum', category: 'Lending', tvl: 600000000, risk: 'medium' },
    { name: 'AAVE', chain: 'Polygon', category: 'Lending', tvl: 400000000, risk: 'low' },
    { name: 'QuickSwap', chain: 'Polygon', category: 'DEX', tvl: 300000000, risk: 'medium' },
    { name: 'Balancer', chain: 'Ethereum', category: 'DEX', tvl: 1500000000, risk: 'medium' },
    { name: 'Stargate', chain: 'Ethereum', category: 'Bridge', tvl: 800000000, risk: 'medium' },
    { name: 'Pendle', chain: 'Ethereum', category: 'Yield', tvl: 500000000, risk: 'high' },
    { name: 'Euler', chain: 'Ethereum', category: 'Lending', tvl: 200000000, risk: 'high' },
  ];

  // Mock yield rates data
  private yieldRates = {
    'ETH': [
      { protocol: 'Lido', chain: 'Ethereum', apy: 3.8, apr: 3.5, asset: 'ETH', type: 'Liquid Staking' },
      { protocol: 'Rocket Pool', chain: 'Ethereum', apy: 4.2, apr: 3.9, asset: 'ETH', type: 'Liquid Staking' },
      { protocol: 'Frax Ether', chain: 'Ethereum', apy: 4.5, apr: 4.2, asset: 'ETH', type: 'Liquid Staking' },
      { protocol: 'Aave', chain: 'Ethereum', apy: 2.1, apr: 2.0, asset: 'ETH', type: 'Lending' },
      { protocol: 'Compound', chain: 'Ethereum', apy: 1.8, apr: 1.7, asset: 'ETH', type: 'Lending' },
      { protocol: 'Yearn', chain: 'Ethereum', apy: 5.2, apr: 4.8, asset: 'ETH', type: 'Yield' },
      { protocol: 'Uniswap V3', chain: 'Ethereum', apy: 8.5, apr: 7.2, asset: 'ETH', type: 'DEX' },
    ],
    'USDC': [
      { protocol: 'Aave', chain: 'Ethereum', apy: 4.5, apr: 4.4, asset: 'USDC', type: 'Lending' },
      { protocol: 'Compound', chain: 'Ethereum', apy: 3.8, apr: 3.7, asset: 'USDC', type: 'Lending' },
      { protocol: 'Curve', chain: 'Ethereum', apy: 3.2, apr: 3.1, asset: 'USDC', type: 'StableSwap' },
      { protocol: 'Yearn', chain: 'Ethereum', apy: 5.8, apr: 5.5, asset: 'USDC', type: 'Yield' },
      { protocol: 'Convex', chain: 'Ethereum', apy: 4.2, apr: 4.0, asset: 'USDC', type: 'Yield' },
      { protocol: 'Balancer', chain: 'Ethereum', apy: 3.9, apr: 3.8, asset: 'USDC', type: 'DEX' },
    ],
    'USDT': [
      { protocol: 'Aave', chain: 'Ethereum', apy: 4.2, apr: 4.1, asset: 'USDT', type: 'Lending' },
      { protocol: 'Compound', chain: 'Ethereum', apy: 3.5, apr: 3.4, asset: 'USDT', type: 'Lending' },
      { protocol: 'Curve', chain: 'Ethereum', apy: 3.0, apr: 2.9, asset: 'USDT', type: 'StableSwap' },
      { protocol: 'Yearn', chain: 'Ethereum', apy: 5.5, apr: 5.2, asset: 'USDT', type: 'Yield' },
    ],
    'DAI': [
      { protocol: 'Aave', chain: 'Ethereum', apy: 4.0, apr: 3.9, asset: 'DAI', type: 'Lending' },
      { protocol: 'Compound', chain: 'Ethereum', apy: 3.6, apr: 3.5, asset: 'DAI', type: 'Lending' },
      { protocol: 'Curve', chain: 'Ethereum', apy: 2.8, apr: 2.7, asset: 'DAI', type: 'StableSwap' },
      { protocol: 'Yearn', chain: 'Ethereum', apy: 5.2, apr: 4.9, asset: 'DAI', type: 'Yield' },
    ],
    'WBTC': [
      { protocol: 'Aave', chain: 'Ethereum', apy: 1.5, apr: 1.4, asset: 'WBTC', type: 'Lending' },
      { protocol: 'Yearn', chain: 'Ethereum', apy: 4.8, apr: 4.5, asset: 'WBTC', type: 'Yield' },
      { protocol: 'Uniswap V3', chain: 'Ethereum', apy: 6.5, apr: 5.8, asset: 'WBTC', type: 'DEX' },
    ],
    'stETH': [
      { protocol: 'Curve', chain: 'Ethereum', apy: 4.8, apr: 4.5, asset: 'stETH', type: 'StableSwap' },
      { protocol: 'Aave', chain: 'Ethereum', apy: 3.2, apr: 3.0, asset: 'stETH', type: 'Lending' },
      { protocol: 'Convex', chain: 'Ethereum', apy: 6.5, apr: 5.8, asset: 'stETH', type: 'Yield' },
    ],
    'MATIC': [
      { protocol: 'Aave', chain: 'Polygon', apy: 5.5, apr: 5.2, asset: 'MATIC', type: 'Lending' },
      { protocol: 'QuickSwap', chain: 'Polygon', apy: 12.0, apr: 10.5, asset: 'MATIC', type: 'DEX' },
      { protocol: 'Curve', chain: 'Polygon', apy: 4.2, apr: 4.0, asset: 'MATIC', type: 'StableSwap' },
    ],
    'ARB': [
      { protocol: 'Aave', chain: 'Arbitrum', apy: 3.8, apr: 3.6, asset: 'ARB', type: 'Lending' },
      { protocol: 'Uniswap V3', chain: 'Arbitrum', apy: 8.0, apr: 7.2, asset: 'ARB', type: 'DEX' },
      { protocol: 'Curve', chain: 'Arbitrum', apy: 3.5, apr: 3.3, asset: 'ARB', type: 'StableSwap' },
    ],
  };

  getSupportedProtocols() {
    return this.protocols.map(p => ({
      ...p,
      tvlFormatted: this.formatTVL(p.tvl)
    }));
  }

  getYieldRates(filter: YieldFilter) {
    let rates = Object.values(this.yieldRates).flat();
    
    if (filter.chain) {
      rates = rates.filter(r => r.chain.toLowerCase() === filter.chain!.toLowerCase());
    }
    if (filter.protocol) {
      rates = rates.filter(r => r.protocol.toLowerCase().includes(filter.protocol!.toLowerCase()));
    }
    if (filter.asset) {
      rates = rates.filter(r => r.asset.toUpperCase() === filter.asset!.toUpperCase());
    }
    
    return rates.sort((a, b) => b.apy - a.apy);
  }

  getBestRates(asset: string, amount?: string) {
    const assetRates = this.yieldRates[asset.toUpperCase()] || [];
    const sortedRates = [...assetRates].sort((a, b) => b.apy - a.apy);
    
    const investmentAmount = amount ? parseFloat(amount) : 10000;
    
    return {
      asset: asset.toUpperCase(),
      amount: investmentAmount,
      opportunities: sortedRates.slice(0, 5).map(rate => ({
        ...rate,
        estimatedAnnualReturn: (investmentAmount * rate.apy / 100).toFixed(2),
        estimatedMonthlyReturn: (investmentAmount * rate.apy / 100 / 12).toFixed(2),
      })),
      bestOpportunity: sortedRates[0] ? {
        ...sortedRates[0],
        estimatedAnnualReturn: (investmentAmount * sortedRates[0].apy / 100).toFixed(2),
      } : null
    };
  }

  getHistoricalRates(protocol?: string, asset?: string, days: number = 30) {
    interface HistoricalRate {
      date: string;
      protocol: string;
      chain: string;
      asset: string;
      apy: string;
      apr: string;
    }
    
    const result: HistoricalRate[] = [];
    const now = Date.now();
    
    // Generate historical data
    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const date = new Date(timestamp).toISOString().split('T')[0];
      
      // Add base variation to make it realistic
      const baseVariation = Math.sin(i / 7) * 0.5;
      
      // For each asset
      const assets = asset ? [asset.toUpperCase()] : Object.keys(this.yieldRates);
      
      for (const assetName of assets) {
        const rates = this.yieldRates[assetName] || [];
        for (const rate of rates) {
          if (protocol && !rate.protocol.toLowerCase().includes(protocol.toLowerCase())) {
            continue;
          }
          
          result.push({
            date,
            protocol: rate.protocol,
            chain: rate.chain,
            asset: assetName,
            apy: (rate.apy + baseVariation + (Math.random() - 0.5) * 0.3).toFixed(2),
            apr: (rate.apr + baseVariation + (Math.random() - 0.5) * 0.3).toFixed(2),
          });
        }
      }
    }
    
    return result;
  }

  compareProtocols(protocols: string[], asset: string, amount?: string) {
    const assetRates = this.yieldRates[asset.toUpperCase()] || [];
    const investmentAmount = amount ? parseFloat(amount) : 10000;
    
    const comparison = protocols.map(protocolName => {
      const rate = assetRates.find(r => 
        r.protocol.toLowerCase() === protocolName.toLowerCase() &&
        r.asset.toUpperCase() === asset.toUpperCase()
      );
      
      if (!rate) {
        return {
          protocol: protocolName,
          asset: asset.toUpperCase(),
          available: false,
          error: 'No yield data available'
        };
      }
      
      return {
        ...rate,
        available: true,
        estimatedAnnualReturn: (investmentAmount * rate.apy / 100).toFixed(2),
        estimatedMonthlyReturn: (investmentAmount * rate.apy / 100 / 12).toFixed(2),
      };
    });
    
    const sorted = comparison.filter(c => c.available).sort((a, b) => b.apy - a.apy);
    
    return {
      asset: asset.toUpperCase(),
      amount: investmentAmount,
      comparison,
      ranking: sorted.map((r, i) => ({
        rank: i + 1,
        ...r
      })),
      winner: sorted[0] ? {
        protocol: sorted[0].protocol,
        apy: sorted[0].apy,
        extraReturn: sorted[0] && sorted[sorted.length - 1] 
          ? ((sorted[0].apy - sorted[sorted.length - 1].apy) * investmentAmount / 100).toFixed(2)
          : '0'
      } : null
    };
  }

  getTrendingOpportunities(limit: number = 10) {
    interface Opportunity {
      protocol: string;
      chain: string;
      apy: number;
      apr: number;
      asset: string;
      type: string;
      score: number;
    }
    
    const opportunities: Opportunity[] = [];
    
    // Flatten all rates
    for (const [asset, rates] of Object.entries(this.yieldRates)) {
      for (const rate of rates) {
        opportunities.push({
          ...rate,
          score: this.calculateTrendingScore(rate),
        } as Opportunity);
      }
    }
    
    return opportunities
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getRiskAnalysis(protocol?: string) {
    let protocolsToAnalyze = this.protocols;
    
    if (protocol) {
      protocolsToAnalyze = this.protocols.filter(p => 
        p.name.toLowerCase().includes(protocol.toLowerCase())
      );
    }
    
    const riskDistribution = {
      low: protocolsToAnalyze.filter(p => p.risk === 'low').length,
      medium: protocolsToAnalyze.filter(p => p.risk === 'medium').length,
      high: protocolsToAnalyze.filter(p => p.risk === 'high').length,
    };
    
    return {
      totalProtocols: protocolsToAnalyze.length,
      riskDistribution,
      protocols: protocolsToAnalyze.map(p => ({
        name: p.name,
        chain: p.chain,
        category: p.category,
        risk: p.risk,
        tvl: p.tvl,
        tvlFormatted: this.formatTVL(p.tvl),
        riskFactors: this.getRiskFactors(p.name, p.risk),
      }))
    };
  }

  private calculateTrendingScore(rate: any): number {
    // Calculate a trending score based on APY, TVL, and risk
    const protocol = this.protocols.find(p => p.name === rate.protocol);
    const tvl = protocol?.tvl || 1000000;
    const riskMultiplier = rate.risk === 'low' ? 1.2 : rate.risk === 'medium' ? 1.0 : 0.8;
    
    return (rate.apy * 0.5 + Math.log10(tvl) * 0.3 + riskMultiplier * 10);
  }

  private getRiskFactors(protocolName: string, risk: string): string[] {
    const baseFactors: Record<string, string[]> = {
      low: [
        'Audited contracts',
        'Large TVL providing stability',
        'Established track record',
      ],
      medium: [
        'Smart contract risk',
        'Impermanent loss potential',
        'Regulatory uncertainty',
      ],
      high: [
        'Experimental protocol',
        'Small TVL',
        'Limited track record',
        'Higher smart contract risk',
      ]
    };
    
    return baseFactors[risk] || baseFactors['medium'];
  }

  private formatTVL(tvl: number): string {
    if (tvl >= 1e9) {
      return `$${(tvl / 1e9).toFixed(2)}B`;
    } else if (tvl >= 1e6) {
      return `$${(tvl / 1e6).toFixed(2)}M`;
    } else if (tvl >= 1e3) {
      return `$${(tvl / 1e3).toFixed(2)}K`;
    }
    return `$${tvl}`;
  }
}
