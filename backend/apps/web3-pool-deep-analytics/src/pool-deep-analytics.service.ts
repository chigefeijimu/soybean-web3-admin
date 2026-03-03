import { Injectable } from '@nestjs/common';

interface PoolDepthPoint {
  price: string;
  liquidity: string;
  token0Liquidity: string;
  token1Liquidity: string;
}

interface PoolDepth {
  token0: string;
  token1: string;
  currentPrice: string;
  depthPoints: PoolDepthPoint[];
  totalToken0Liquidity: string;
  totalToken1Liquidity: string;
  depthScore: number;
  spread: number;
}

interface ImpermanentLoss {
  initialPrice: string;
  currentPrice: string;
  priceChange: number;
  ilAmount: string;
  ilPercentage: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'extreme';
}

interface RangeOrderRecommendation {
  type: 'buy' | 'sell' | 'neutral';
  lowerPrice: string;
  upperPrice: string;
  expectedReturn: string;
  risk: 'low' | 'medium' | 'high';
  reasoning: string;
}

interface PoolEfficiency {
  tvlToVolumeRatio: number;
  utilizationRate: number;
  feeEfficiency: number;
  concentrationScore: number;
  overallScore: number;
  rating: 'poor' | 'fair' | 'good' | 'excellent';
}

interface PriceImpact {
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
  priceImpactPercentage: number;
  slippage: number;
}

interface HistoricalIL {
  timestamp: number;
  price: string;
  il: number;
}

@Injectable()
export class PoolDeepAnalyticsService {
  // Get pool depth analysis
  async getPoolDepth(
    poolAddress: string,
    token0Address: string,
    token1Address: string,
    depthLevels: number = 10,
  ): Promise<PoolDepth> {
    // Simulate pool depth data
    const currentPrice = '2498.45';
    const depthPoints: PoolDepthPoint[] = [];
    
    let totalToken0Liquidity = 0;
    let totalToken1Liquidity = 0;
    
    for (let i = 0; i < depthLevels; i++) {
      const priceOffset = (i - depthLevels / 2) * 0.02;
      const price = (parseFloat(currentPrice) * (1 + priceOffset)).toFixed(2);
      
      // Simulate liquidity distribution (higher in middle)
      const distanceFromMid = Math.abs(i - depthLevels / 2) / (depthLevels / 2);
      const baseLiquidity = 50000000 * (1 - distanceFromMid * 0.7);
      
      const token0Liquidity = baseLiquidity * (1 + Math.random() * 0.3);
      const token1Liquidity = (baseLiquidity / parseFloat(price)) * (1 + Math.random() * 0.3);
      
      totalToken0Liquidity += token0Liquidity;
      totalToken1Liquidity += token1Liquidity;
      
      depthPoints.push({
        price,
        liquidity: baseLiquidity.toFixed(0),
        token0Liquidity: token0Liquidity.toFixed(0),
        token1Liquidity: token1Liquidity.toFixed(0),
      });
    }
    
    // Calculate depth score (0-100)
    const avgLiquidity = (totalToken0Liquidity + totalToken1Liquidity) / 2;
    const depthScore = Math.min(100, Math.round(avgLiquidity / 1000000));
    const spread = 0.05 + Math.random() * 0.1;
    
    return {
      token0: token0Address,
      token1: token1Address,
      currentPrice,
      depthPoints,
      totalToken0Liquidity: totalToken0Liquidity.toFixed(0),
      totalToken1Liquidity: totalToken1Liquidity.toFixed(0),
      depthScore: Math.min(100, depthScore),
      spread: parseFloat(spread.toFixed(3)),
    };
  }

  // Calculate impermanent loss
  async calculateImpermanentLoss(
    token0Amount: number,
    token1Amount: number,
    initialPrice: number,
    currentPrice: number,
  ): Promise<ImpermanentLoss> {
    const priceChange = ((currentPrice - initialPrice) / initialPrice) * 100;
    
    // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const priceRatio = currentPrice / initialPrice;
    const ilFactor = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
    const ilPercentage = ilFactor * 100;
    
    // Calculate USD value at current prices
    const initialValueUSD = token0Amount * initialPrice + token1Amount;
    const currentValueWithoutLP = token0Amount * currentPrice + token1Amount;
    const lpValue = initialValueWithoutLP * (1 + ilFactor);
    const ilAmount = (currentValueWithoutLP - lpValue).toFixed(2);
    
    let severity: ImpermanentLoss['severity'];
    if (Math.abs(ilPercentage) < 1) severity = 'none';
    else if (Math.abs(ilPercentage) < 5) severity = 'low';
    else if (Math.abs(ilPercentage) < 15) severity = 'medium';
    else if (Math.abs(ilPercentage) < 30) severity = 'high';
    else severity = 'extreme';
    
    return {
      initialPrice: initialPrice.toFixed(2),
      currentPrice: currentPrice.toFixed(2),
      priceChange: parseFloat(priceChange.toFixed(2)),
      ilAmount,
      ilPercentage: parseFloat(ilPercentage.toFixed(2)),
      severity,
    };
  }

  // Get range order recommendations
  async getRangeOrderRecommendation(
    token0Address: string,
    token1Address: string,
    currentPrice: number,
    volatility: 'low' | 'medium' | 'high' = 'medium',
  ): Promise<RangeOrderRecommendation> {
    const volatilityMap = {
      low: 0.02,
      medium: 0.05,
      high: 0.1,
    };
    
    const vol = volatilityMap[volatility];
    const lowerPrice = (currentPrice * (1 - vol)).toFixed(2);
    const upperPrice = (currentPrice * (1 + vol)).toFixed(2);
    
    // Simulate expected return calculation
    const expectedReturn = (vol * 50).toFixed(2) + '%';
    
    let risk: RangeOrderRecommendation['risk'];
    let reasoning: string;
    
    if (volatility === 'low') {
      risk = 'low';
      reasoning = 'Low volatility suggests stable price range. Recommended for stable pairs or conservative strategies.';
    } else if (volatility === 'medium') {
      risk = 'medium';
      reasoning = 'Medium volatility offers balanced risk-reward. Consider moderate price range for optimal fee capture.';
    } else {
      risk = 'high';
      reasoning = 'High volatility increases impermanent loss risk but offers higher fee potential. Use wider range.';
    }
    
    return {
      type: 'neutral',
      lowerPrice,
      upperPrice,
      expectedReturn,
      risk,
      reasoning,
    };
  }

  // Get pool efficiency metrics
  async getPoolEfficiency(poolAddress: string): Promise<PoolEfficiency> {
    // Simulate efficiency metrics
    const tvlToVolumeRatio = 0.8 + Math.random() * 1.2;
    const utilizationRate = 0.3 + Math.random() * 0.5;
    const feeEfficiency = 0.4 + Math.random() * 0.4;
    const concentrationScore = 0.3 + Math.random() * 0.5;
    
    const overallScore = (
      (1 / tvlToVolumeRatio) * 20 +
      utilizationRate * 30 +
      feeEfficiency * 30 +
      concentrationScore * 20
    );
    
    let rating: PoolEfficiency['rating'];
    if (overallScore < 25) rating = 'poor';
    else if (overallScore < 50) rating = 'fair';
    else if (overallScore < 75) rating = 'good';
    else rating = 'excellent';
    
    return {
      tvlToVolumeRatio: parseFloat(tvlToVolumeRatio.toFixed(2)),
      utilizationRate: parseFloat(utilizationRate.toFixed(2)),
      feeEfficiency: parseFloat(feeEfficiency.toFixed(2)),
      concentrationScore: parseFloat(concentrationScore.toFixed(2)),
      overallScore: Math.round(overallScore),
      rating,
    };
  }

  // Calculate price impact for swap
  async calculatePriceImpact(
    poolAddress: string,
    tokenIn: string,
    amountIn: number,
  ): Promise<PriceImpact> {
    // Simulate price impact calculation
    const baseSlippage = 0.001;
    const amountFactor = Math.log10(amountIn + 1) * 0.1;
    const slippage = baseSlippage + amountFactor;
    
    // Simulate output amount (simplified)
    const outputAmount = (amountIn * 0.9995).toFixed(4);
    const priceImpactPercentage = slippage * 100;
    
    return {
      inputAmount: amountIn.toString(),
      outputAmount,
      priceImpact: (amountIn - parseFloat(outputAmount)).toFixed(4),
      priceImpactPercentage: parseFloat(priceImpactPercentage.toFixed(3)),
      slippage: parseFloat(slippage.toFixed(4)),
    };
  }

  // Get historical IL analysis
  async getHistoricalIL(
    token0Address: string,
    token1Address: string,
    days: number = 30,
  ): Promise<HistoricalIL[]> {
    const historicalData: HistoricalIL[] = [];
    const now = Date.now();
    const basePrice = 2500;
    
    for (let i = 0; i < days; i++) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      const priceVariation = 1 + (Math.random() - 0.5) * 0.2;
      const price = (basePrice * priceVariation).toFixed(2);
      
      // Calculate IL vs initial
      const initialPrice = basePrice;
      const currentPrice = parseFloat(price);
      const priceRatio = currentPrice / initialPrice;
      const il = ((2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1) * 100;
      
      historicalData.push({
        timestamp,
        price,
        il: parseFloat(il.toFixed(2)),
      });
    }
    
    return historicalData.reverse();
  }

  // Get pool health score
  async getPoolHealthScore(poolAddress: string): Promise<{
    score: number;
    rating: 'poor' | 'fair' | 'good' | 'excellent';
    factors: {
      liquidity: number;
      volume: number;
      concentration: number;
      fees: number;
    };
    recommendations: string[];
  }> {
    const liquidity = 60 + Math.random() * 30;
    const volume = 50 + Math.random() * 40;
    const concentration = 40 + Math.random() * 40;
    const fees = 55 + Math.random() * 35;
    
    const score = (liquidity * 0.3 + volume * 0.3 + concentration * 0.2 + fees * 0.2);
    
    let rating: 'poor' | 'fair' | 'good' | 'excellent';
    if (score < 25) rating = 'poor';
    else if (score < 50) rating = 'fair';
    else if (score < 75) rating = 'good';
    else rating = 'excellent';
    
    const recommendations: string[] = [];
    if (liquidity < 60) recommendations.push('Consider adding more liquidity to reduce price impact');
    if (volume < 60) recommendations.push('Pool trading volume is moderate, consider fee tier adjustment');
    if (concentration < 50) recommendations.push('Liquidity concentration could be improved with concentrated positions');
    if (fees < 60) recommendations.push('Consider adjusting fee tier based on token pair volatility');
    if (recommendations.length === 0) recommendations.push('Pool is performing well! Monitor for any changes.');
    
    return {
      score: Math.round(score),
      rating,
      factors: {
        liquidity: Math.round(liquidity),
        volume: Math.round(volume),
        concentration: Math.round(concentration),
        fees: Math.round(fees),
      },
      recommendations,
    };
  }

  // Compare multiple pools
  async comparePools(poolAddresses: string[]): Promise<{
    pools: Array<{
      address: string;
      tvl: string;
      volume24h: string;
      apr: string;
      efficiencyScore: number;
      healthScore: number;
    }>;
    bestPool: string;
    comparison: {
      tvlWinner: string;
      volumeWinner: string;
      aprWinner: string;
      efficiencyWinner: string;
    };
  }> {
    const pools = poolAddresses.map((address, index) => {
      const tvl = (Math.random() * 100 + 10).toFixed(1) + 'M';
      const volume24h = (Math.random() * 80 + 5).toFixed(1) + 'M';
      const apr = (Math.random() * 30 + 5).toFixed(1) + '%';
      const efficiencyScore = Math.round(50 + Math.random() * 40);
      const healthScore = Math.round(50 + Math.random() * 40);
      
      return {
        address,
        tvl,
        volume24h,
        apr,
        efficiencyScore,
        healthScore,
      };
    });
    
    // Find winners
    const sortedByTVL = [...pools].sort((a, b) => 
      parseFloat(b.tvl) - parseFloat(a.tvl)
    );
    const sortedByVolume = [...pools].sort((a, b) => 
      parseFloat(b.volume24h) - parseFloat(a.volume24h)
    );
    const sortedByAPR = [...pools].sort((a, b) => 
      parseFloat(b.apr) - parseFloat(a.apr)
    );
    const sortedByEfficiency = [...pools].sort((a, b) => 
      b.efficiencyScore - a.efficiencyScore
    );
    
    return {
      pools,
      bestPool: sortedByTVL[0].address,
      comparison: {
        tvlWinner: sortedByTVL[0].address,
        volumeWinner: sortedByVolume[0].address,
        aprWinner: sortedByAPR[0].address,
        efficiencyWinner: sortedByEfficiency[0].address,
      },
    };
  }
}
