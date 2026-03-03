import { Injectable } from '@nestjs/common';

export interface StakingInput {
  token: string;
  amount: number;
  apy: number;
  durationDays: number;
  compoundFrequency: 'daily' | 'weekly' | 'monthly' | 'annually';
}

export interface LendingInput {
  token: string;
  amount: number;
  supplyApy: number;
  durationDays: number;
  compoundFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface LiquidityPositionInput {
  token0: string;
  token1: string;
  amount0: number;
  amount1: number;
  apy: number;
  durationDays: number;
  expectedPriceChange: number; // percentage
}

export interface ImpermanentLossInput {
  token0StartPrice: number;
  token1StartPrice: number;
  token0EndPrice: number;
  token1EndPrice: number;
}

export interface ImpermanentLossCalcInput {
  token0StartPrice: number;
  token1StartPrice: number;
  token0EndPrice: number;
  token1EndPrice: number;
}

export interface RoiResult {
  initialInvestment: number;
  finalValue: number;
  profit: number;
  roi: number;
  apy: number;
  dailyYield: number;
  compoundCount: number;
  breakdown: {
    baseYield: number;
    compoundBonus: number;
  };
}

export interface ImpermanentLossResult {
  impermanentLoss: number;
  impermanentLossPercentage: number;
  finalValue: number;
  hodlValue: number;
  loss: number;
}

@Injectable()
export class DefiRoiCalculatorService {
  
  /**
   * Calculate staking ROI with compound interest
   */
  calculateStakingRoi(input: StakingInput): RoiResult {
    const { amount, apy, durationDays, compoundFrequency } = input;
    
    const compoundRates = {
      daily: 365,
      weekly: 52,
      monthly: 12,
      annually: 1
    };
    
    const compoundsPerYear = compoundRates[compoundFrequency];
    const dailyRate = apy / 100 / compoundsPerYear;
    const totalCompounds = Math.floor((compoundsPerYear * durationDays) / 365);
    
    // A = P(1 + r/n)^(nt)
    const finalValue = amount * Math.pow(1 + dailyRate, totalCompounds);
    const profit = finalValue - amount;
    const roi = (profit / amount) * 100;
    const calculatedApy = (Math.pow(finalValue / amount, 365 / durationDays) - 1) * 100;
    const dailyYield = (finalValue - amount) / durationDays;
    
    // Calculate breakdown
    const baseYield = (amount * (apy / 100) * (durationDays / 365));
    const compoundBonus = profit - baseYield;
    
    return {
      initialInvestment: amount,
      finalValue,
      profit,
      roi,
      apy: calculatedApy || apy,
      dailyYield,
      compoundCount: totalCompounds,
      breakdown: {
        baseYield,
        compoundBonus: Math.max(0, compoundBonus)
      }
    };
  }
  
  /**
   * Calculate lending ROI
   */
  calculateLendingRoi(input: LendingInput): RoiResult {
    const { amount, supplyApy, durationDays, compoundFrequency } = input;
    
    const compoundRates = {
      daily: 365,
      weekly: 52,
      monthly: 12
    };
    
    const compoundsPerYear = compoundRates[compoundFrequency];
    const dailyRate = supplyApy / 100 / compoundsPerYear;
    const totalCompounds = Math.floor((compoundsPerYear * durationDays) / 365);
    
    const finalValue = amount * Math.pow(1 + dailyRate, totalCompounds);
    const profit = finalValue - amount;
    const roi = (profit / amount) * 100;
    const calculatedApy = (Math.pow(finalValue / amount, 365 / durationDays) - 1) * 100;
    const dailyYield = profit / durationDays;
    
    const baseYield = (amount * (supplyApy / 100) * (durationDays / 365));
    const compoundBonus = profit - baseYield;
    
    return {
      initialInvestment: amount,
      finalValue,
      profit,
      roi,
      apy: calculatedApy || supplyApy,
      dailyYield,
      compoundCount: totalCompounds,
      breakdown: {
        baseYield,
        compoundBonus: Math.max(0, compoundBonus)
      }
    };
  }
  
  /**
   * Calculate liquidity provision ROI with impermanent loss
   */
  calculateLiquidityRoi(input: LiquidityPositionInput): {
    totalRoi: number;
    impermanentLoss: ImpermanentLossResult;
    tradingFees: number;
    netProfit: number;
    netRoi: number;
  } {
    const { amount0, amount1, apy, durationDays, expectedPriceChange } = input;
    
    // Total value in USD (assuming both tokens are valued in USD)
    const initialValue = amount0 + amount1;
    
    // Trading fees earned (APY based on pool volume)
    const tradingFees = (initialValue * (apy / 100) * (durationDays / 365));
    
    // Calculate impermanent loss based on price change
    // Using the impermanent loss formula: IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const priceRatio = 1 + (expectedPriceChange / 100);
    const sqrtRatio = Math.sqrt(priceRatio);
    const impermanentLossFactor = (2 * sqrtRatio / (1 + priceRatio)) - 1;
    
    // Impermanent loss calculation
    const hodlValue = initialValue;
    const lpValue = initialValue * (1 + impermanentLossFactor);
    const impermanentLoss = hodlValue - lpValue;
    const impermanentLossPercentage = impermanentLossFactor * 100;
    
    // Net value after impermanent loss + fees
    const finalValue = lpValue + tradingFees;
    const netProfit = finalValue - initialValue;
    const netRoi = (netProfit / initialValue) * 100;
    const totalRoi = ((tradingFees - impermanentLoss) / initialValue) * 100;
    
    return {
      totalRoi,
      impermanentLoss: {
        impermanentLoss: Math.abs(impermanentLoss),
        impermanentLossPercentage,
        finalValue: lpValue,
        hodlValue,
        loss: impermanentLoss
      },
      tradingFees,
      netProfit,
      netRoi
    };
  }
  
  /**
   * Calculate pure impermanent loss for any price change
   */
  calculateImpermanentLoss(input: ImpermanentLossCalcInput): ImpermanentLossResult {
    const { token0StartPrice, token1StartPrice, token0EndPrice, token1EndPrice } = input;
    
    const priceRatio0 = token0EndPrice / token0StartPrice;
    const priceRatio1 = token1EndPrice / token1StartPrice;
    
    // Combined price ratio
    const combinedRatio = Math.sqrt(priceRatio0 * priceRatio1);
    const impermanentLossFactor = (2 * combinedRatio / (1 + combinedRatio)) - 1;
    
    const hodlValue = token0StartPrice + token1StartPrice;
    const lpValue = (token0StartPrice * priceRatio0) + (token1StartPrice * priceRatio1);
    const lpValueAfterIL = hodlValue * (1 + impermanentLossFactor);
    const loss = hodlValue - lpValueAfterIL;
    
    return {
      impermanentLoss: Math.abs(loss),
      impermanentLossPercentage: impermanentLossFactor * 100,
      finalValue: lpValueAfterIL,
      hodlValue,
      loss
    };
  }
  
  /**
   * Compare multiple DeFi strategies
   */
  compareStrategies(strategies: Array<{
    name: string;
    type: 'staking' | 'lending' | 'liquidity';
    apy: number;
    risk: 'low' | 'medium' | 'high';
    lockPeriod: number;
    initialAmount: number;
  }>): Array<{
    name: string;
    type: string;
    apy: number;
    risk: string;
    expectedReturn: number;
    riskAdjustedReturn: number;
    lockPeriod: number;
  }> {
    return strategies.map(strategy => {
      const { apy, risk, lockPeriod, initialAmount } = strategy;
      
      // Calculate expected return for 1 year
      const expectedReturn = initialAmount * (apy / 100);
      
      // Risk adjustment factor
      const riskFactors = {
        low: 1.0,
        medium: 0.8,
        high: 0.5
      };
      
      const riskAdjustedReturn = expectedReturn * riskFactors[risk];
      
      return {
        name: strategy.name,
        type: strategy.type,
        apy,
        risk,
        expectedReturn,
        riskAdjustedReturn,
        lockPeriod
      };
    }).sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn);
  }
  
  /**
   * Calculate multi-hop yield farming ROI
   */
  calculateYieldFarmingRoi(
    initialAmount: number,
    steps: Array<{
      protocol: string;
      fromToken: string;
      toToken: string;
      apy: number;
      steps: number;
    }>,
    durationDays: number
  ): {
    totalRoi: number;
    totalProfit: number;
    stepByStep: Array<{
      protocol: string;
      apy: number;
      valueAfterStep: number;
      profit: number;
    }>;
  } {
    let currentValue = initialAmount;
    const stepByStep: Array<{
      protocol: string;
      apy: number;
      valueAfterStep: number;
      profit: number;
    }> = [];
    
    for (const step of steps) {
      const stepProfit = currentValue * (step.apy / 100) * (durationDays / 365);
      currentValue += stepProfit;
      
      stepByStep.push({
        protocol: step.protocol,
        apy: step.apy,
        valueAfterStep: currentValue,
        profit: stepProfit
      });
    }
    
    const totalProfit = currentValue - initialAmount;
    const totalRoi = (totalProfit / initialAmount) * 100;
    
    return {
      totalRoi,
      totalProfit,
      stepByStep
    };
  }
  
  /**
   * Get current DeFi rates for popular protocols (mock data - would integrate with APIs)
   */
  getCurrentRates(): {
    staking: Array<{ protocol: string; token: string; apy: number; chain: string }>;
    lending: Array<{ protocol: string; token: string; supplyApy: number; chain: string }>;
    liquidity: Array<{ protocol: string; pair: string; apy: number; chain: string }>;
  } {
    return {
      staking: [
        { protocol: 'Lido', token: 'stETH', apy: 3.8, chain: 'Ethereum' },
        { protocol: 'Rocket Pool', token: 'rETH', apy: 4.2, chain: 'Ethereum' },
        { protocol: 'Coinbase Wrapped Staked ETH', token: 'cbETH', apy: 3.5, chain: 'Ethereum' },
        { protocol: 'Frax Ether', token: 'frxETH', apy: 4.0, chain: 'Ethereum' },
        { protocol: 'Ankr', token: 'ankrETH', apy: 3.6, chain: 'Ethereum' },
        { protocol: 'Swell', token: 'swETH', apy: 4.5, chain: 'Ethereum' },
      ],
      lending: [
        { protocol: 'Aave', token: 'USDC', supplyApy: 4.2, chain: 'Ethereum' },
        { protocol: 'Aave', token: 'USDT', supplyApy: 3.8, chain: 'Ethereum' },
        { protocol: 'Aave', token: 'ETH', supplyApy: 2.1, chain: 'Ethereum' },
        { protocol: 'Compound', token: 'USDC', supplyApy: 3.9, chain: 'Ethereum' },
        { protocol: 'Compound', token: 'ETH', supplyApy: 1.8, chain: 'Ethereum' },
        { protocol: 'Morpho', token: 'USDC', supplyApy: 4.5, chain: 'Ethereum' },
      ],
      liquidity: [
        { protocol: 'Uniswap V3', pair: 'USDC/ETH (0.05%)', apy: 25.0, chain: 'Ethereum' },
        { protocol: 'Uniswap V3', pair: 'USDC/ETH (0.3%)', apy: 18.0, chain: 'Ethereum' },
        { protocol: 'Curve', pair: 'USDC/USDT/DAI', apy: 8.0, chain: 'Ethereum' },
        { protocol: 'Curve', pair: 'ETH/stETH', apy: 5.0, chain: 'Ethereum' },
        { protocol: 'Balancer', pair: 'WBTC/ETH', apy: 12.0, chain: 'Ethereum' },
      ],
    };
  }
}
