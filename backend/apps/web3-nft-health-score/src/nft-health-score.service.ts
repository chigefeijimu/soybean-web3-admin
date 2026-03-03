import { Injectable } from '@nestjs/common';
import { 
  NftHealthScoreQueryDto, 
  NftHealthScoreBatchQueryDto,
  NftHealthScoreResponseDto,
  NftHealthScoreSummaryDto,
  ChainEnum,
  HolderDistributionDto,
  TradingMetricsDto,
  MarketMetricsDto,
  RiskFactorsDto,
  NftCollectionStatsDto
} from './dto/nft-health-score.dto';

interface CollectionData {
  contractAddress: string;
  chain: string;
  name: string;
  totalSupply: number;
  holderCount: number;
  ownerCount: number;
  volume24h: number;
  totalVolume: number;
  floorPrice: number;
  floorPriceChange24h: number;
  highestSale: number;
  lowestSale: number;
  salesCount24h: number;
  royaltyPercent: number;
  collectionAge: number;
  topHolders: number[];
  washTradingIndicators?: {
    sameBuyerSellerCount: number;
    washTradeRatio: number;
    priceManipulationScore: number;
  };
}

@Injectable()
export class NftHealthScoreService {
  private readonly knownCollections: Map<string, CollectionData> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock data for popular NFT collections
    const mockCollections: CollectionData[] = [
      {
        contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        chain: 'ethereum',
        name: 'BoredApeYachtClub',
        totalSupply: 10000,
        holderCount: 6500,
        ownerCount: 6200,
        volume24h: 1250000,
        totalVolume: 450000000,
        floorPrice: 28.5,
        floorPriceChange24h: 3.2,
        highestSale: 3400000,
        lowestSale: 0.1,
        salesCount24h: 45,
        royaltyPercent: 2.5,
        collectionAge: 730,
        topHolders: [5.2, 3.8, 2.5, 2.1, 1.8, 1.5, 1.2, 1.0, 0.9, 0.8],
        washTradingIndicators: {
          sameBuyerSellerCount: 2,
          washTradeRatio: 0.05,
          priceManipulationScore: 15,
        },
      },
      {
        contractAddress: '0x23581767a106ae21c074b2276d25e5c3e136a68b',
        chain: 'ethereum',
        name: 'Moonbirds',
        totalSupply: 10000,
        holderCount: 5200,
        ownerCount: 4800,
        volume24h: 280000,
        totalVolume: 180000000,
        floorPrice: 3.8,
        floorPriceChange24h: -5.4,
        highestSale: 350000,
        lowestSale: 0.5,
        salesCount24h: 18,
        royaltyPercent: 5.0,
        collectionAge: 450,
        topHolders: [8.5, 5.2, 3.8, 3.2, 2.5, 2.1, 1.8, 1.5, 1.2, 1.0],
        washTradingIndicators: {
          sameBuyerSellerCount: 5,
          washTradeRatio: 0.18,
          priceManipulationScore: 45,
        },
      },
      {
        contractAddress: '0x49cF6f4eA8d5c5b7dD3f7D3c8cC9c7E6F5D4C3B2',
        chain: 'ethereum',
        name: 'PudgyPenguins',
        totalSupply: 8888,
        holderCount: 4500,
        ownerCount: 4200,
        volume24h: 180000,
        totalVolume: 95000000,
        floorPrice: 4.2,
        floorPriceChange24h: 1.8,
        highestSale: 180000,
        lowestSale: 0.3,
        salesCount24h: 22,
        royaltyPercent: 2.5,
        collectionAge: 380,
        topHolders: [6.2, 4.5, 3.2, 2.8, 2.2, 1.9, 1.6, 1.3, 1.1, 0.9],
        washTradingIndicators: {
          sameBuyerSellerCount: 3,
          washTradeRatio: 0.08,
          priceManipulationScore: 22,
        },
      },
      {
        contractAddress: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
        chain: 'ethereum',
        name: 'CryptoPunks',
        totalSupply: 10000,
        holderCount: 3600,
        ownerCount: 3400,
        volume24h: 4500000,
        totalVolume: 2100000000,
        floorPrice: 45.5,
        floorPriceChange24h: 0.8,
        highestSale: 24000000,
        lowestSale: 0.5,
        salesCount24h: 12,
        royaltyPercent: 0,
        collectionAge: 2100,
        topHolders: [3.2, 2.5, 2.1, 1.8, 1.5, 1.2, 1.0, 0.8, 0.7, 0.6],
        washTradingIndicators: {
          sameBuyerSellerCount: 1,
          washTradeRatio: 0.02,
          priceManipulationScore: 8,
        },
      },
      {
        contractAddress: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
        chain: 'ethereum',
        name: 'Doodle',
        totalSupply: 10000,
        holderCount: 5800,
        ownerCount: 5500,
        volume24h: 520000,
        totalVolume: 280000000,
        floorPrice: 2.8,
        floorPriceChange24h: -2.1,
        highestSale: 1900000,
        lowestSale: 0.15,
        salesCount24h: 28,
        royaltyPercent: 5.0,
        collectionAge: 520,
        topHolders: [7.2, 4.8, 3.5, 2.9, 2.3, 1.9, 1.6, 1.3, 1.1, 0.9],
        washTradingIndicators: {
          sameBuyerSellerCount: 4,
          washTradeRatio: 0.12,
          priceManipulationScore: 35,
        },
      },
    ];

    mockCollections.forEach((collection) => {
      this.knownCollections.set(
        `${collection.chain}:${collection.contractAddress.toLowerCase()}`,
        collection
      );
    });
  }

  async getHealthScore(query: NftHealthScoreQueryDto): Promise<NftHealthScoreResponseDto> {
    const { contractAddress, chain = ChainEnum.ethereum } = query;
    const key = `${chain}:${contractAddress.toLowerCase()}`;

    let collectionData = this.knownCollections.get(key);
    
    if (!collectionData) {
      // Generate mock data for unknown collections
      collectionData = this.generateMockData(contractAddress, chain);
    }

    return this.calculateHealthScore(collectionData);
  }

  async getBatchHealthScores(query: NftHealthScoreBatchQueryDto): Promise<NftHealthScoreSummaryDto> {
    const { contractAddresses, chain = ChainEnum.ethereum } = query;
    
    const results: NftHealthScoreResponseDto[] = [];
    let totalScore = 0;

    for (const address of contractAddresses) {
      const result = await this.getHealthScore({ contractAddress: address, chain });
      results.push(result);
      totalScore += result.healthScore;
    }

    const healthLevelDistribution = {
      excellent: results.filter(r => r.healthLevel === 'excellent').length,
      good: results.filter(r => r.healthLevel === 'good').length,
      fair: results.filter(r => r.healthLevel === 'fair').length,
      poor: results.filter(r => r.healthLevel === 'poor').length,
      critical: results.filter(r => r.healthLevel === 'critical').length,
    };

    return {
      totalAnalyzed: results.length,
      averageHealthScore: Math.round(totalScore / results.length),
      healthLevelDistribution,
      results,
    };
  }

  private generateMockData(contractAddress: string, chain: string): CollectionData {
    // Generate realistic mock data for unknown collections
    const randomFactor = Math.random();
    return {
      contractAddress,
      chain,
      name: `Unknown Collection ${contractAddress.slice(0, 8)}`,
      totalSupply: Math.floor(1000 + Math.random() * 10000),
      holderCount: Math.floor(300 + Math.random() * 5000),
      ownerCount: Math.floor(250 + Math.random() * 4500),
      volume24h: Math.floor(10000 + Math.random() * 500000),
      totalVolume: Math.floor(1000000 + Math.random() * 50000000),
      floorPrice: 0.1 + Math.random() * 10,
      floorPriceChange24h: -10 + Math.random() * 20,
      highestSale: 100 + Math.random() * 10000,
      lowestSale: 0.01 + Math.random() * 1,
      salesCount24h: Math.floor(5 + Math.random() * 50),
      royaltyPercent: 2.5 + Math.random() * 5,
      collectionAge: Math.floor(30 + Math.random() * 700),
      topHolders: this.generateTopHolders(),
      washTradingIndicators: {
        sameBuyerSellerCount: Math.floor(Math.random() * 10),
        washTradeRatio: Math.random() * 0.3,
        priceManipulationScore: Math.floor(Math.random() * 60),
      },
    };
  }

  private generateTopHolders(): number[] {
    const holders: number[] = [];
    let remaining = 100;
    for (let i = 0; i < 10; i++) {
      const percent = Math.min(remaining, 1 + Math.random() * (remaining / (10 - i)));
      holders.push(Math.round(percent * 10) / 10);
      remaining -= holders[i];
    }
    return holders;
  }

  private calculateHealthScore(data: CollectionData): NftHealthScoreResponseDto {
    // Calculate various metrics
    const collectionStats = this.calculateCollectionStats(data);
    const holderDistribution = this.calculateHolderDistribution(data);
    const tradingMetrics = this.calculateTradingMetrics(data);
    const marketMetrics = this.calculateMarketMetrics(data);
    const riskFactors = this.calculateRiskFactors(data, holderDistribution, tradingMetrics);
    
    // Calculate overall health score (weighted average)
    const healthScore = this.computeOverallHealthScore(
      collectionStats,
      holderDistribution,
      tradingMetrics,
      marketMetrics,
      riskFactors
    );

    // Determine health grade and level
    const { healthGrade, healthLevel } = this.getHealthGradeAndLevel(healthScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      healthScore,
      holderDistribution,
      riskFactors,
      tradingMetrics
    );

    return {
      contractAddress: data.contractAddress,
      chain: data.chain,
      collectionName: data.name,
      healthScore,
      healthGrade,
      healthLevel,
      collectionStats,
      holderDistribution,
      tradingMetrics,
      marketMetrics,
      riskFactors,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  private calculateCollectionStats(data: CollectionData): NftCollectionStatsDto {
    return {
      totalSupply: data.totalSupply,
      holderCount: data.holderCount,
      listingCount: Math.floor(data.holderCount * 0.15),
      volume24h: data.volume24h,
      totalVolume: data.totalVolume,
      ownerCount: data.ownerCount,
      collectionAge: data.collectionAge,
    };
  }

  private calculateHolderDistribution(data: CollectionData): HolderDistributionDto {
    const top10 = data.topHolders.slice(0, 10).reduce((a, b) => a + b, 0);
    const top25 = data.topHolders.slice(0, 25).reduce((a, b) => a + b, 0);
    const top50 = data.topHolders.slice(0, 50).reduce((a, b) => a + b, 0);
    
    // Calculate Gini coefficient (simplified)
    const giniCoefficient = this.calculateGini(data.topHolders);

    let concentrationRisk: 'low' | 'medium' | 'high' = 'low';
    if (top10 > 50) concentrationRisk = 'high';
    else if (top10 > 30) concentrationRisk = 'medium';

    return {
      top10HolderPercent: Math.round(top10 * 10) / 10,
      top25HolderPercent: Math.round(top25 * 10) / 10,
      top50HolderPercent: Math.round(top50 * 10) / 10,
      concentrationRisk,
      giniCoefficient: Math.round(giniCoefficient * 1000) / 1000,
    };
  }

  private calculateGini(holdings: number[]): number {
    if (holdings.length === 0) return 0;
    const sorted = [...holdings].sort((a, b) => a - b);
    const n = sorted.length;
    let cumsum = 0;
    for (let i = 0; i < n; i++) {
      cumsum += (i + 1) * sorted[i];
    }
    const total = sorted.reduce((a, b) => a + b, 0);
    return (2 * cumsum) / (n * total) - (n + 1) / n;
  }

  private calculateTradingMetrics(data: CollectionData): TradingMetricsDto {
    const indicators = data.washTradingIndicators || {
      sameBuyerSellerCount: 0,
      washTradeRatio: 0,
      priceManipulationScore: 0,
    };

    const washTradingScore = Math.min(
      100,
      indicators.washTradeRatio * 200 + indicators.priceManipulationScore * 0.5
    );

    const priceVolatility = Math.abs(data.floorPriceChange24h) * 5 + 
      (data.highestSale / (data.lowestSale || 1) > 100 ? 30 : 10);

    return {
      washTradingScore: Math.round(washTradingScore),
      isWashTradingDetected: washTradingScore > 40,
      avgPrice24h: data.floorPrice * (1 + data.floorPriceChange24h / 100),
      avgPrice7d: data.floorPrice * (1 + data.floorPriceChange24h / 200),
      priceVolatility: Math.min(100, Math.round(priceVolatility)),
      salesCount24h: data.salesCount24h,
      uniqueBuyers24h: Math.floor(data.salesCount24h * 0.8),
      avgTimeBetweenSales: Math.floor(1440 / (data.salesCount24h || 1)),
    };
  }

  private calculateMarketMetrics(data: CollectionData): MarketMetricsDto {
    return {
      floorPrice: data.floorPrice,
      floorPriceChange24h: Math.round(data.floorPriceChange24h * 100) / 100,
      highestSale: data.highestSale,
      lowestSale: data.lowestSale,
      marketCap: data.floorPrice * data.totalSupply,
      royaltyPercent: data.royaltyPercent,
    };
  }

  private calculateRiskFactors(
    data: CollectionData,
    holderDistribution: HolderDistributionDto,
    tradingMetrics: TradingMetricsDto
  ): RiskFactorsDto {
    // Ownership concentration risk
    const ownershipConcentration = holderDistribution.top10HolderPercent > 50 ? 85 :
      holderDistribution.top10HolderPercent > 30 ? 60 :
      holderDistribution.top10HolderPercent > 20 ? 35 : 15;

    // Wash trading risk
    const washTradingRisk = tradingMetrics.washTradingScore;

    // Liquidity risk (based on sales volume and holder count)
    const liquidityRisk = data.volume24h < 10000 ? 80 :
      data.volume24h < 50000 ? 55 :
      data.volume24h < 100000 ? 30 : 15;

    // Manipulation risk
    const manipulationRisk = Math.min(100,
      (100 - data.holderCount / 100) * 0.3 +
      tradingMetrics.priceVolatility * 0.4 +
      tradingMetrics.washTradingScore * 0.3
    );

    // Contract risk (simplified - assumes well-known collections are safer)
    const contractRisk = data.collectionAge > 365 ? 15 :
      data.collectionAge > 180 ? 35 : 55;

    const overallRiskScore = (ownershipConcentration + washTradingRisk + 
      liquidityRisk + manipulationRisk + contractRisk) / 5;

    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (overallRiskScore > 75) overallRisk = 'critical';
    else if (overallRiskScore > 55) overallRisk = 'high';
    else if (overallRiskScore > 35) overallRisk = 'medium';

    const riskSummary: string[] = [];
    if (ownershipConcentration > 50) riskSummary.push('High ownership concentration risk');
    if (washTradingRisk > 40) riskSummary.push('Potential wash trading detected');
    if (liquidityRisk > 50) riskSummary.push('Low liquidity risk');
    if (manipulationRisk > 50) riskSummary.push('High price manipulation risk');
    if (contractRisk > 40) riskSummary.push('Newer collection - higher smart contract risk');

    return {
      ownershipConcentration,
      washTradingRisk,
      liquidityRisk,
      manipulationRisk,
      contractRisk,
      overallRisk,
      riskSummary: riskSummary.length > 0 ? riskSummary : ['No significant risks detected'],
    };
  }

  private computeOverallHealthScore(
    collectionStats: NftCollectionStatsDto,
    holderDistribution: HolderDistributionDto,
    tradingMetrics: TradingMetricsDto,
    marketMetrics: MarketMetricsDto,
    riskFactors: RiskFactorsDto
  ): number {
    // Weighted scoring algorithm
    let score = 100;

    // Holder distribution (25%)
    if (holderDistribution.concentrationRisk === 'high') score -= 25;
    else if (holderDistribution.concentrationRisk === 'medium') score -= 12;

    // Trading metrics (25%)
    score -= tradingMetrics.washTradingScore * 0.2;
    score -= tradingMetrics.priceVolatility * 0.05;

    // Risk factors (30%)
    score -= riskFactors.ownershipConcentration * 0.1;
    score -= riskFactors.washTradingRisk * 0.1;
    score -= riskFactors.liquidityRisk * 0.05;
    score -= riskFactors.manipulationRisk * 0.05;

    // Market metrics (20%)
    if (marketMetrics.floorPriceChange24h < -20) score -= 10;
    else if (marketMetrics.floorPriceChange24h > 50) score -= 5; // Suspicious pump
    if (marketMetrics.royaltyPercent === 0 && collectionStats.collectionAge > 180) score -= 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private getHealthGradeAndLevel(score: number): { healthGrade: string; healthLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' } {
    let healthGrade: string;
    let healthLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

    if (score >= 90) {
      healthGrade = 'A';
      healthLevel = 'excellent';
    } else if (score >= 75) {
      healthGrade = 'B';
      healthLevel = 'good';
    } else if (score >= 60) {
      healthGrade = 'C';
      healthLevel = 'fair';
    } else if (score >= 40) {
      healthGrade = 'D';
      healthLevel = 'poor';
    } else {
      healthGrade = 'F';
      healthLevel = 'critical';
    }

    return { healthGrade, healthLevel };
  }

  private generateRecommendations(
    healthScore: number,
    holderDistribution: HolderDistributionDto,
    riskFactors: RiskFactorsDto,
    tradingMetrics: TradingMetricsDto
  ): string[] {
    const recommendations: string[] = [];

    if (healthScore >= 80) {
      recommendations.push('Collection shows healthy market dynamics');
    }

    if (holderDistribution.concentrationRisk === 'high') {
      recommendations.push('Consider diversifying - high holder concentration may lead to price manipulation');
    }

    if (riskFactors.washTradingRisk > 40) {
      recommendations.push('Caution: Potential wash trading detected. Verify transactions before significant trades');
    }

    if (riskFactors.liquidityRisk > 50) {
      recommendations.push('Low liquidity - large orders may significantly impact price');
    }

    if (tradingMetrics.priceVolatility > 60) {
      recommendations.push('High price volatility - consider dollar-cost averaging');
    }

    if (riskFactors.ownershipConcentration > 50) {
      recommendations.push('Top holders control significant portion - monitor large wallet movements');
    }

    if (tradingMetrics.salesCount24h < 10) {
      recommendations.push('Low trading activity - may be difficult to exit position quickly');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain portfolio diversification across multiple collections');
    }

    return recommendations;
  }
}
