import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('NFT Wash Trade Detector')
@Controller('nft-wash-trade')
export class NftWashTradeController {
  private washTradeData: Map<string, any[]> = new Map();

  constructor() {
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Sample wash trade detection data
    this.washTradeData.set('0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB', [ // CryptoPunks
      {
        tokenId: '78',
        seller: '0x1234567890abcdef1234567890abcdef12345678',
        buyer: '0xabcdef1234567890abcdef1234567890abcdef12',
        price: 45.5,
        timestamp: Date.now() - 3600000,
        washTradeScore: 92,
        isWashTrade: true,
        patterns: ['same_buyer_seller', 'price_manipulation', 'circular_transfer'],
      },
      {
        tokenId: '234',
        seller: '0xabcdef1234567890abcdef1234567890abcdef12',
        buyer: '0x1234567890abcdef1234567890abcdef12345678',
        price: 46.2,
        timestamp: Date.now() - 1800000,
        washTradeScore: 88,
        isWashTrade: true,
        patterns: ['circular_transfer', 'rapid_flip'],
      },
      {
        tokenId: '456',
        seller: '0x9876543210abcdef9876543210abcdef98765432',
        buyer: '0xfedcba0987654321fedcba0987654321fedcba09',
        price: 44.8,
        timestamp: Date.now() - 7200000,
        washTradeScore: 35,
        isWashTrade: false,
        patterns: [],
      },
    ]);

    this.washTradeData.set('0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', [ // BAYC
      {
        tokenId: '1024',
        seller: '0x1111111111111111111111111111111111111111',
        buyer: '0x2222222222222222222222222222222222222222',
        price: 85.0,
        timestamp: Date.now() - 5400000,
        washTradeScore: 95,
        isWashTrade: true,
        patterns: ['same_buyer_seller', 'wash_loop', 'price_manipulation'],
      },
      {
        tokenId: '2048',
        seller: '0x3333333333333333333333333333333333333333',
        buyer: '0x4444444444444444444444444444444444444444',
        price: 82.5,
        timestamp: Date.now() - 3600000,
        washTradeScore: 42,
        isWashTrade: false,
        patterns: [],
      },
    ]);
  }

  @Get('analyze/:collection')
  @ApiOperation({ summary: 'Analyze NFT collection for wash trading' })
  @ApiQuery({ name: 'chain', required: false, description: 'Blockchain chain' })
  async analyzeCollection(
    @Param('collection') collection: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    const data = this.washTradeData.get(collection.toLowerCase()) || [];
    const washTrades = data.filter(d => d.isWashTrade);
    const totalVolume = data.reduce((sum, d) => sum + d.price, 0);
    const washVolume = washTrades.reduce((sum, d) => sum + d.price, 0);

    return {
      collection: collection,
      chain: chain,
      totalSales: data.length,
      washTrades: washTrades.length,
      washTradePercentage: data.length > 0 ? (washTrades.length / data.length * 100).toFixed(2) : 0,
      totalVolume: totalVolume.toFixed(2),
      washTradeVolume: washVolume.toFixed(2),
      washVolumePercentage: totalVolume > 0 ? (washVolume / totalVolume * 100).toFixed(2) : 0,
      riskLevel: washTrades.length / data.length > 0.5 ? 'HIGH' : washTrades.length / data.length > 0.2 ? 'MEDIUM' : 'LOW',
      detectedPatterns: this.extractPatterns(washTrades),
      recommendations: this.generateRecommendations(washTrades.length, data.length),
      lastUpdated: new Date().toISOString(),
    };
  }

  @Get('sales/:collection')
  @ApiOperation({ summary: 'Get sales history with wash trade analysis' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  async getSales(
    @Param('collection') collection: string,
    @Query('limit') limit: number = 50,
  ) {
    const data = this.washTradeData.get(collection.toLowerCase()) || [];
    return {
      collection: collection,
      sales: data.slice(0, limit).map(sale => ({
        ...sale,
        timeAgo: this.getTimeAgo(sale.timestamp),
      })),
      total: data.length,
    };
  }

  @Get('suspicious-accounts/:collection')
  @ApiOperation({ summary: 'Get suspicious accounts for a collection' })
  async getSuspiciousAccounts(@Param('collection') collection: string) {
    const data = this.washTradeData.get(collection.toLowerCase()) || [];
    const washTrades = data.filter(d => d.isWashTrade);
    
    const accountScores = new Map();
    washTrades.forEach(trade => {
      const sellerScore = accountScores.get(trade.seller) || { address: trade.seller, score: 0, trades: 0 };
      sellerScore.score += trade.washTradeScore;
      sellerScore.trades += 1;
      accountScores.set(trade.seller, sellerScore);

      const buyerScore = accountScores.get(trade.buyer) || { address: trade.buyer, score: 0, trades: 0 };
      buyerScore.score += trade.washTradeScore;
      buyerScore.trades += 1;
      accountScores.set(trade.buyer, buyerScore);
    });

    return {
      collection: collection,
      suspiciousAccounts: Array.from(accountScores.values())
        .map(acc => ({
          ...acc,
          avgScore: (acc.score / acc.trades).toFixed(1),
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 20),
    };
  }

  @Get('risk-score/:collection')
  @ApiOperation({ summary: 'Get overall risk score for collection' })
  async getRiskScore(@Param('collection') collection: string) {
    const data = this.washTradeData.get(collection.toLowerCase()) || [];
    const washTrades = data.filter(d => d.isWashTrade);
    
    const washPercentage = data.length > 0 ? washTrades.length / data.length : 0;
    const avgWashScore = washTrades.length > 0 
      ? washTrades.reduce((sum, t) => sum + t.washTradeScore, 0) / washTrades.length 
      : 0;
    
    const riskScore = Math.min(100, Math.round(washPercentage * 100 + avgWashScore * 0.3));
    
    return {
      collection: collection,
      riskScore: riskScore,
      riskLevel: riskScore >= 70 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW',
      confidence: data.length > 10 ? 'HIGH' : data.length > 5 ? 'MEDIUM' : 'LOW',
      factors: {
        washTradePercentage: (washPercentage * 100).toFixed(1),
        avgWashTradeScore: avgWashScore.toFixed(1),
        sampleSize: data.length,
      },
    };
  }

  @Get('patterns')
  @ApiOperation({ summary: 'Get all supported wash trade patterns' })
  getPatterns() {
    return {
      patterns: [
        {
          name: 'same_buyer_seller',
          description: 'Same address appears as both buyer and seller',
          severity: 'HIGH',
        },
        {
          name: 'circular_transfer',
          description: 'Funds circulate between known addresses',
          severity: 'HIGH',
        },
        {
          name: 'price_manipulation',
          description: 'Unusual price patterns detected',
          severity: 'MEDIUM',
        },
        {
          name: 'rapid_flip',
          description: 'Same NFT sold within short time period',
          severity: 'MEDIUM',
        },
        {
          name: 'wash_loop',
          description: 'Repeated buying and selling between accounts',
          severity: 'HIGH',
        },
        {
          name: 'volume_spike',
          description: 'Unusual trading volume spike',
          severity: 'LOW',
        },
      ],
    };
  }

  private extractPatterns(washTrades: any[]): string[] {
    const patternCounts = new Map();
    washTrades.forEach(trade => {
      trade.patterns.forEach(pattern => {
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      });
    });
    return Array.from(patternCounts.entries())
      .map(([pattern, count]) => `${pattern}: ${count}`)
      .sort((a, b) => b.split(': ')[1] - a.split(': ')[1]);
  }

  private generateRecommendations(washTrades: number, total: number): string[] {
    const recommendations = [];
    const percentage = total > 0 ? washTrades / total : 0;

    if (percentage > 0.5) {
      recommendations.push('HIGH RISK: Significant wash trading detected. Exercise extreme caution.');
      recommendations.push('Consider avoiding this collection until more legitimate trading activity is observed.');
    } else if (percentage > 0.2) {
      recommendations.push('MEDIUM RISK: Some wash trading activity detected.');
      recommendations.push('Verify any purchases carefully and be aware of manipulated floor prices.');
    } else {
      recommendations.push('LOW RISK: No significant wash trading detected.');
    }

    if (washTrades > 10) {
      recommendations.push('Monitor this collection regularly for changes in trading patterns.');
    }

    return recommendations;
  }

  private getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
