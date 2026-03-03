import { Injectable } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';

export class TokenHealthQueryDto {
  @ApiProperty({ description: 'Token symbol (e.g., ETH, BTC, USDC)', required: false })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiProperty({ description: 'Chain ID or name', required: false, default: 'ethereum' })
  @IsOptional()
  @IsString()
  chain?: string = 'ethereum';

  @ApiProperty({ description: 'Token contract address', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class LiquidityAnalysisDto {
  @ApiProperty({ description: 'Liquidity score 0-100' })
  liquidityScore: number;

  @ApiProperty({ description: 'Total liquidity in USD' })
  totalLiquidity: number;

  @ApiProperty({ description: '24h trading volume' })
  volume24h: number;

  @ApiProperty({ description: 'Liquidity to volume ratio' })
  liquidityVolumeRatio: number;

  @ApiProperty({ description: 'Number of liquidity providers' })
  providerCount: number;

  @ApiProperty({ description: 'Concentration risk (top holder percentage' })
  concentrationRisk: string;

  @ApiProperty({ description: 'Liquidity health assessment' })
  assessment: string;
}

export class HolderDistributionDto {
  @ApiProperty({ description: 'Top 10 holder percentage' })
  top10Percent: number;

  @ApiProperty({ description: 'Top 25 holder percentage' })
  top25Percent: number;

  @ApiProperty({ description: 'Top 50 holder percentage' })
  top50Percent: number;

  @ApiProperty({ description: 'Gini coefficient (0-1, lower is better)' })
  giniCoefficient: number;

  @ApiProperty({ description: 'Number of total holders' })
  totalHolders: number;

  @ApiProperty({ description: 'Distribution score 0-100' })
  distributionScore: number;

  @ApiProperty({ description: 'Distribution risk level' })
  riskLevel: string;
}

export class ContractSecurityDto {
  @ApiProperty({ description: 'Security score 0-100' })
  securityScore: number;

  @ApiProperty({ description: 'Is contract verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Is proxy contract' })
  isProxy: boolean;

  @ApiProperty({ description: 'Has pausable function' })
  hasPausable: boolean;

  @ApiProperty({ description: 'Has mintable function' })
  hasMintable: boolean;

  @ApiProperty({ description: 'Has blacklist function' })
  hasBlacklist: boolean;

  @ApiProperty({ description: 'Owner is zero address' })
  ownerIsZero: boolean;

  @ApiProperty({ description: 'Is honeypot (based on analysis)' })
  isHoneypot: boolean;

  @ApiProperty({ description: 'Trading cooldown detected' })
  hasCooldown: boolean;

  @ApiProperty({ description: 'Transfer delay detected' })
  hasTransferDelay: boolean;

  @ApiProperty({ description: 'Security assessment' })
  assessment: string;
}

export class MarketPerformanceDto {
  @ApiProperty({ description: 'Performance score 0-100' })
  performanceScore: number;

  @ApiProperty({ description: '24h price change percentage' })
  priceChange24h: number;

  @ApiProperty({ description: '7d price change percentage' })
  priceChange7d: number;

  @ApiProperty({ description: '30d price change percentage' })
  priceChange30d: number;

  @ApiProperty({ description: 'Price volatility (standard deviation)' })
  volatility: number;

  @ApiProperty({ description: 'Volatility level: low, medium, high' })
  volatilityLevel: string;

  @ApiProperty({ description: 'Market cap' })
  marketCap: number;

  @ApiProperty({ description: '24h trading volume' })
  volume24h: number;

  @ApiProperty({ description: 'Volume to market cap ratio' })
  volumeMcRatio: number;

  @ApiProperty({ description: 'Performance assessment' })
  assessment: string;
}

export class SocialActivityDto {
  @ApiProperty({ description: 'Social score 0-100' })
  socialScore: number;

  @ApiProperty({ description: 'Twitter followers (estimated)' })
  twitterFollowers: number;

  @ApiProperty({ description: 'Discord members (estimated)' })
  discordMembers: number;

  @ApiProperty({ description: 'Reddit subscribers (estimated)' })
  redditSubscribers: number;

  @ApiProperty({ description: 'GitHub stars (if applicable)' })
  githubStars: number;

  @ApiProperty({ description: 'Number of smart contracts using this token' })
  integrationCount: number;

  @ApiProperty({ description: 'Social media activity level' })
  activityLevel: string;

  @ApiProperty({ description: 'Community health assessment' })
  assessment: string;
}

export class TokenHealthScoreDto {
  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Token name' })
  name: string;

  @ApiProperty({ description: 'Chain name' })
  chain: string;

  @ApiProperty({ description: 'Token contract address' })
  contractAddress: string;

  @ApiProperty({ description: 'Overall health score 0-100' })
  overallScore: number;

  @ApiProperty({ description: 'Health grade: A+, A, B+, B, C, D, F' })
  healthGrade: string;

  @ApiProperty({ description: 'Risk level: low, medium, high, critical' })
  riskLevel: string;

  @ApiProperty({ description: 'Liquidity analysis' })
  liquidity: LiquidityAnalysisDto;

  @ApiProperty({ description: 'Holder distribution analysis' })
  holders: HolderDistributionDto;

  @ApiProperty({ description: 'Contract security analysis' })
  security: ContractSecurityDto;

  @ApiProperty({ description: 'Market performance analysis' })
  market: MarketPerformanceDto;

  @ApiProperty({ description: 'Social activity analysis' })
  social: SocialActivityDto;

  @ApiProperty({ description: 'Risk factors identified' })
  riskFactors: string[];

  @ApiProperty({ description: 'Positive factors' })
  positiveFactors: string[];

  @ApiProperty({ description: 'Recommendations' })
  recommendations: string[];

  @ApiProperty({ description: 'Timestamp' })
  timestamp: string;
}

export class TokenHealthBatchQueryDto {
  @ApiProperty({ description: 'Comma-separated token symbols', example: 'ETH,BTC,USDC' })
  @IsString()
  symbols: string;

  @ApiProperty({ description: 'Chain ID or name', required: false, default: 'ethereum' })
  @IsOptional()
  @IsString()
  chain?: string = 'ethereum';
}

export class TokenHealthComparisonDto {
  @ApiProperty({ description: 'First token symbol' })
  @IsString()
  token1: string;

  @ApiProperty({ description: 'Second token symbol' })
  @IsString()
  token2: string;

  @ApiProperty({ description: 'Chain ID or name', required: false })
  @IsOptional()
  @IsString()
  chain?: string;
}

export class TokenHealthTrendsDto {
  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Chain name' })
  chain: string;

  @ApiProperty({ description: 'Historical scores' })
  history: {
    date: string;
    overallScore: number;
    liquidityScore: number;
    securityScore: number;
    performanceScore: number;
  }[];
}

export class HealthScoreSummaryDto {
  @ApiProperty({ description: 'Total tokens analyzed' })
  totalAnalyzed: number;

  @ApiProperty({ description: 'Average health score' })
  averageScore: number;

  @ApiProperty({ description: 'Low risk tokens count' })
  lowRiskCount: number;

  @ApiProperty({ description: 'Medium risk tokens count' })
  mediumRiskCount: number;

  @ApiProperty({ description: 'High risk tokens count' })
  highRiskCount: number;

  @ApiProperty({ description: 'Critical risk tokens count' })
  criticalRiskCount: number;

  @ApiProperty({ description: 'Top healthy tokens' })
  topHealthy: { symbol: string; score: number; chain: string }[];

  @ApiProperty({ description: 'Most risky tokens' })
  mostRisky: { symbol: string; score: number; chain: string }[];
}

// Token metadata
const TOKEN_METADATA: Record<string, { name: string; category: string }> = {
  ETH: { name: 'Ethereum', category: 'L1' },
  BTC: { name: 'Bitcoin', category: 'L1' },
  WBTC: { name: 'Wrapped Bitcoin', category: 'Wrapped' },
  USDC: { name: 'USD Coin', category: 'Stablecoin' },
  USDT: { name: 'Tether', category: 'Stablecoin' },
  DAI: { name: 'Dai', category: 'Stablecoin' },
  BUSD: { name: 'Binance USD', category: 'Stablecoin' },
  UNI: { name: 'Uniswap', category: 'DeFi' },
  LINK: { name: 'Chainlink', category: 'Oracle' },
  AAVE: { name: 'Aave', category: 'DeFi' },
  MKR: { name: 'Maker', category: 'DeFi' },
  CRV: { name: 'Curve DAO', category: 'DeFi' },
  LDO: { name: 'Lido DAO', category: 'Liquid Staking' },
  ARB: { name: 'Arbitrum', category: 'L2' },
  OP: { name: 'Optimism', category: 'L2' },
  MATIC: { name: 'Polygon', category: 'L2' },
  SOL: { name: 'Solana', category: 'L1' },
  BNB: { name: 'BNB', category: 'L1' },
  AVAX: { name: 'Avalanche', category: 'L1' },
  DOT: { name: 'Polkadot', category: 'L1' },
  ADA: { name: 'Cardano', category: 'L1' },
  XRP: { name: 'XRP', category: 'L1' },
  DOGE: { name: 'Dogecoin', category: 'Meme' },
  SHIB: { name: 'Shiba Inu', category: 'Meme' },
  PEPE: { name: 'Pepe', category: 'Meme' },
  WIF: { name: 'dogwifhat', category: 'Meme' },
};

// Simulated base prices
const getMockPrice = (symbol: string): number => {
  const prices: Record<string, number> = {
    ETH: 3250, WBTC: 68000, USDC: 1, USDT: 1, DAI: 1, BUSD: 1,
    UNI: 12.5, LINK: 18.2, AAVE: 280, MKR: 1800, CRV: 0.55,
    LDO: 2.8, ARB: 1.8, OP: 3.2, MATIC: 0.75, SOL: 145,
    BNB: 580, AVAX: 38, DOT: 8.5, ADA: 0.65, XRP: 0.58,
    DOGE: 0.12, SHIB: 0.000012, PEPE: 0.0000018, WIF: 2.8,
  };
  const variation = (Math.random() - 0.5) * 0.1;
  return (prices[symbol] || 10) * (1 + variation);
};

// Generate mock holder distribution
const generateHolderDistribution = (symbol: string): HolderDistributionDto => {
  const isStablecoin = ['USDC', 'USDT', 'DAI', 'BUSD'].includes(symbol);
  
  let top10, top25, top50, totalHolders;
  
  if (isStablecoin) {
    top10 = 35 + Math.random() * 10;
    top25 = 55 + Math.random() * 10;
    top50 = 75 + Math.random() * 10;
    totalHolders = 500000 + Math.floor(Math.random() * 1000000);
  } else if (Math.random() > 0.5) {
    top10 = 15 + Math.random() * 20;
    top25 = 30 + Math.random() * 20;
    top50 = 50 + Math.random() * 20;
    totalHolders = 10000 + Math.floor(Math.random() * 500000);
  } else {
    top10 = 5 + Math.random() * 10;
    top25 = 15 + Math.random() * 15;
    top50 = 30 + Math.random() * 20;
    totalHolders = 50000 + Math.floor(Math.random() * 500000);
  }

  const gini = top10 / 100;
  const distributionScore = Math.max(0, 100 - (top10 * 2) - (top25 * 0.5));
  
  let riskLevel: string;
  if (top10 > 50) riskLevel = 'critical';
  else if (top10 > 30) riskLevel = 'high';
  else if (top10 > 15) riskLevel = 'medium';
  else riskLevel = 'low';

  return {
    top10Percent: Math.round(top10 * 10) / 10,
    top25Percent: Math.round(top25 * 10) / 10,
    top50Percent: Math.round(top50 * 10) / 10,
    giniCoefficient: Math.round(gini * 1000) / 1000,
    totalHolders,
    distributionScore: Math.round(distributionScore),
    riskLevel,
  };
};

// Generate mock liquidity data
const generateLiquidityData = (symbol: string): LiquidityAnalysisDto => {
  const isStablecoin = ['USDC', 'USDT', 'DAI', 'BUSD'].includes(symbol);
  const price = getMockPrice(symbol);
  
  let liquidity, volume24h;
  
  if (isStablecoin) {
    liquidity = 1000000000 + Math.random() * 5000000000;
    volume24h = liquidity * (0.05 + Math.random() * 0.1);
  } else if (['ETH', 'BTC', 'WBTC', 'BNB', 'SOL'].includes(symbol)) {
    liquidity = 500000000 + Math.random() * 2000000000;
    volume24h = liquidity * (0.02 + Math.random() * 0.08);
  } else {
    liquidity = 10000000 + Math.random() * 100000000;
    volume24h = liquidity * (0.01 + Math.random() * 0.15);
  }

  const lvRatio = liquidity / Math.max(volume24h, 1);
  const providerCount = Math.floor(100 + Math.random() * 5000);
  const concentrationRisk = lvRatio < 5 ? 'High' : lvRatio < 15 ? 'Medium' : 'Low';
  
  const liquidityScore = Math.min(100, Math.max(0, 
    (lvRatio > 20 ? 100 : lvRatio * 5) * (providerCount > 1000 ? 1 : providerCount / 1000)
  ));

  return {
    liquidityScore: Math.round(liquidityScore),
    totalLiquidity: Math.round(liquidity),
    volume24h: Math.round(volume24h),
    liquidityVolumeRatio: Math.round(lvRatio * 100) / 100,
    providerCount,
    concentrationRisk,
    assessment: liquidityScore > 70 ? 'Excellent liquidity' : 
                liquidityScore > 40 ? 'Moderate liquidity' : 
                'Low liquidity - caution advised',
  };
};

// Generate mock security data
const generateSecurityData = (symbol: string, address?: string): ContractSecurityDto => {
  const isVerified = Math.random() > 0.2;
  const hasMintable = Math.random() > 0.7;
  const hasBlacklist = ['USDC', 'USDT', 'BUSD'].includes(symbol) || Math.random() > 0.8;
  const hasPausable = Math.random() > 0.6;
  const hasCooldown = Math.random() > 0.8;
  const hasTransferDelay = Math.random() > 0.85;
  const isProxy = Math.random() > 0.9;
  const ownerIsZero = address && address.startsWith('0x0000');

  let securityScore = 100;
  if (!isVerified) securityScore -= 25;
  if (hasMintable) securityScore -= 15;
  if (hasBlacklist) securityScore -= 10;
  if (hasPausable) securityScore -= 10;
  if (hasCooldown) securityScore -= 10;
  if (hasTransferDelay) securityScore -= 10;
  if (ownerIsZero) securityScore -= 20;
  if (isProxy) securityScore -= 5;

  securityScore = Math.max(0, securityScore);

  const isHoneypot = !isVerified && Math.random() > 0.9;

  return {
    securityScore,
    isVerified,
    isProxy,
    hasPausable,
    hasMintable,
    hasBlacklist,
    ownerIsZero: !!ownerIsZero,
    isHoneypot,
    hasCooldown,
    hasTransferDelay,
    assessment: securityScore > 80 ? 'Strong security profile' :
                securityScore > 50 ? 'Moderate security - review carefully' :
                'Security concerns detected',
  };
};

// Generate mock market performance
const generateMarketPerformance = (symbol: string): MarketPerformanceDto => {
  const price = getMockPrice(symbol);
  const isStablecoin = ['USDC', 'USDT', 'DAI', 'BUSD'].includes(symbol);
  
  let change24h, change7d, change30d, volatility;
  
  if (isStablecoin) {
    change24h = (Math.random() - 0.5) * 0.5;
    change7d = (Math.random() - 0.5) * 1;
    change30d = (Math.random() - 0.5) * 2;
    volatility = Math.random() * 2;
  } else {
    change24h = (Math.random() - 0.45) * 20;
    change7d = (Math.random() - 0.4) * 40;
    change30d = (Math.random() - 0.35) * 80;
    volatility = 2 + Math.random() * 15;
  }

  const marketCap = price * (1000000 + Math.floor(Math.random() * 1000000000));
  const volume24h = marketCap * (0.01 + Math.random() * 0.1);
  
  let volatilityLevel: string;
  if (isStablecoin) volatilityLevel = 'low';
  else if (volatility < 5) volatilityLevel = 'low';
  else if (volatility < 10) volatilityLevel = 'medium';
  else volatilityLevel = 'high';

  const perfScore = Math.max(0, 100 - (Math.abs(change30d) * 0.5) - (volatility * 2));

  return {
    performanceScore: Math.round(perfScore),
    priceChange24h: Math.round(change24h * 100) / 100,
    priceChange7d: Math.round(change7d * 100) / 100,
    priceChange30d: Math.round(change30d * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    volatilityLevel,
    marketCap: Math.round(marketCap),
    volume24h: Math.round(volume24h),
    volumeMcRatio: Math.round((volume24h / marketCap) * 10000) / 100,
    assessment: perfScore > 70 ? 'Strong performance' :
                perfScore > 40 ? 'Moderate performance' :
                'Weak performance - high volatility',
  };
};

// Generate mock social data
const generateSocialData = (symbol: string): SocialActivityDto => {
  const meta = TOKEN_METADATA[symbol] || { name: symbol, category: 'Unknown' };
  const isMajor = ['ETH', 'BTC', 'USDC', 'USDT', 'BNB', 'SOL'].includes(symbol);
  
  let twitter, discord, reddit, github, integrations;
  
  if (isMajor) {
    twitter = 1000000 + Math.floor(Math.random() * 5000000);
    discord = 100000 + Math.floor(Math.random() * 500000);
    reddit = 50000 + Math.floor(Math.random() * 500000);
    github = 1000 + Math.floor(Math.random() * 10000);
    integrations = 500 + Math.floor(Math.random() * 2000);
  } else if (meta.category === 'DeFi' || meta.category === 'L2') {
    twitter = 50000 + Math.floor(Math.random() * 500000);
    discord = 10000 + Math.floor(Math.random() * 100000);
    reddit = 5000 + Math.floor(Math.random() * 50000);
    github = 100 + Math.floor(Math.random() * 1000);
    integrations = 50 + Math.floor(Math.random() * 500);
  } else if (meta.category === 'Stablecoin') {
    twitter = 100000 + Math.floor(Math.random() * 500000);
    discord = 5000 + Math.floor(Math.random() * 50000);
    reddit = 10000 + Math.floor(Math.random() * 100000);
    github = 10 + Math.floor(Math.random() * 100);
    integrations = 1000 + Math.floor(Math.random() * 5000);
  } else {
    twitter = 1000 + Math.floor(Math.random() * 50000);
    discord = 100 + Math.floor(Math.random() * 10000);
    reddit = 100 + Math.floor(Math.random() * 10000);
    github = 0 + Math.floor(Math.random() * 100);
    integrations = 5 + Math.floor(Math.random() * 50);
  }

  const socialScore = Math.min(100, Math.round(
    (Math.min(1, twitter / 1000000) * 30) +
    (Math.min(1, discord / 100000) * 25) +
    (Math.min(1, reddit / 100000) * 20) +
    (Math.min(1, github / 1000) * 10) +
    (Math.min(1, integrations / 500) * 15)
  ));

  const activityLevel = socialScore > 70 ? 'Very Active' :
                       socialScore > 40 ? 'Active' :
                       socialScore > 20 ? 'Moderate' : 'Low';

  return {
    socialScore,
    twitterFollowers: twitter,
    discordMembers: discord,
    redditSubscribers: reddit,
    githubStars: github,
    integrationCount: integrations,
    activityLevel,
    assessment: socialScore > 60 ? 'Strong community' :
                socialScore > 30 ? 'Growing community' :
                'Limited community presence',
  };
};

// Calculate overall health score
const calculateOverallScore = (
  liquidity: LiquidityAnalysisDto,
  holders: HolderDistributionDto,
  security: ContractSecurityDto,
  market: MarketPerformanceDto,
  social: SocialActivityDto
): { score: number; grade: string; riskLevel: string } => {
  const weightedScore = 
    liquidity.liquidityScore * 0.20 +
    holders.distributionScore * 0.15 +
    security.securityScore * 0.25 +
    market.performanceScore * 0.20 +
    social.socialScore * 0.20;

  const score = Math.round(weightedScore);
  
  let grade: string;
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 75) grade = 'B+';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 30) grade = 'D';
  else grade = 'F';

  let riskLevel: string;
  if (score >= 70 && security.securityScore >= 60) riskLevel = 'low';
  else if (score >= 50 && security.securityScore >= 40) riskLevel = 'medium';
  else if (score >= 30) riskLevel = 'high';
  else riskLevel = 'critical';

  return { score, grade, riskLevel };
};

@Injectable()
export class TokenHealthScoreService {
  getTokenHealth(query: TokenHealthQueryDto): TokenHealthScoreDto {
    const symbol = (query.symbol || 'ETH').toUpperCase();
    const chain = (query.chain || 'ethereum').toLowerCase();
    const meta = TOKEN_METADATA[symbol] || { name: symbol, category: 'Token' };
    const address = query.address || `0x${Math.random().toString(16).substr(2, 40)}`;

    const liquidity = generateLiquidityData(symbol);
    const holders = generateHolderDistribution(symbol);
    const security = generateSecurityData(symbol, address);
    const market = generateMarketPerformance(symbol);
    const social = generateSocialData(symbol);
    const { score, grade, riskLevel } = calculateOverallScore(liquidity, holders, security, market, social);

    // Generate risk factors
    const riskFactors: string[] = [];
    if (holders.top10Percent > 30) riskFactors.push('High concentration - top holders own >30%');
    if (security.hasMintable) riskFactors.push('Token can be minted by owner');
    if (security.hasBlacklist) riskFactors.push('Blacklist function present');
    if (security.hasPausable) riskFactors.push('Contract can be paused');
    if (market.volatilityLevel === 'high') riskFactors.push('High price volatility');
    if (!security.isVerified) riskFactors.push('Contract source not verified');
    if (liquidity.liquidityVolumeRatio < 10) riskFactors.push('Low liquidity depth');

    // Generate positive factors
    const positiveFactors: string[] = [];
    if (security.isVerified) positiveFactors.push('Contract verified and audited');
    if (holders.top10Percent < 15) positiveFactors.push('Good holder distribution');
    if (liquidity.liquidityScore > 60) positiveFactors.push('Strong liquidity');
    if (social.socialScore > 50) positiveFactors.push('Active community');
    if (market.volumeMcRatio > 10) positiveFactors.push('Healthy trading volume');

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('Conduct thorough due diligence before investing');
      recommendations.push('Consider starting with small position');
    }
    if (!security.isVerified) {
      recommendations.push('Verify contract source code before interaction');
    }
    if (holders.top10Percent > 30) {
      recommendations.push('Be aware of potential dump risk from large holders');
    }
    if (score > 70) {
      recommendations.push('Token shows healthy metrics across key factors');
    }

    return {
      symbol,
      name: meta.name,
      chain,
      contractAddress: address,
      overallScore: score,
      healthGrade: grade,
      riskLevel,
      liquidity,
      holders,
      security,
      market,
      social,
      riskFactors,
      positiveFactors,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  getBatchTokenHealth(query: TokenHealthBatchQueryDto): TokenHealthScoreDto[] {
    const symbols = query.symbols.split(',').map(s => s.trim().toUpperCase());
    return symbols.map(symbol => this.getTokenHealth({ symbol, chain: query.chain }));
  }

  compareTokens(query: TokenHealthComparisonDto): { token1: TokenHealthScoreDto; token2: TokenHealthScoreDto; comparison: any } {
    const token1 = this.getTokenHealth({ symbol: query.token1, chain: query.chain });
    const token2 = this.getTokenHealth({ symbol: query.token2, chain: query.chain });

    const comparison = {
      overallWinner: token1.overallScore >= token2.overallScore ? token1.symbol : token2.symbol,
      liquidityWinner: token1.liquidity.liquidityScore >= token2.liquidity.liquidityScore ? token1.symbol : token2.symbol,
      securityWinner: token1.security.securityScore >= token2.security.securityScore ? token1.symbol : token2.symbol,
      performanceWinner: token1.market.performanceScore >= token2.market.performanceScore ? token1.symbol : token2.symbol,
      socialWinner: token1.social.socialScore >= token2.social.socialScore ? token1.symbol : token2.symbol,
      scoreDifference: Math.abs(token1.overallScore - token2.overallScore),
    };

    return { token1, token2, comparison };
  }

  getTokenHealthTrends(symbol: string, chain?: string): TokenHealthTrendsDto {
    const history = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const baseScore = 50 + Math.random() * 40;
      history.push({
        date: date.toISOString().split('T')[0],
        overallScore: Math.round(baseScore),
        liquidityScore: Math.round(baseScore + (Math.random() - 0.5) * 20),
        securityScore: Math.round(baseScore + (Math.random() - 0.5) * 20),
        performanceScore: Math.round(baseScore + (Math.random() - 0.5) * 30),
      });
    }

    return {
      symbol: symbol.toUpperCase(),
      chain: chain || 'ethereum',
      history,
    };
  }

  getHealthSummary(): HealthScoreSummaryDto {
    const symbols = ['ETH', 'BTC', 'USDC', 'USDT', 'UNI', 'LINK', 'AAVE', 'MKR', 'CRV', 'LDO', 'ARB', 'OP', 'MATIC', 'SOL', 'BNB', 'AVAX', 'DOT', 'ADA', 'XRP', 'DOGE'];
    const scores: TokenHealthScoreDto[] = symbols.map(s => this.getTokenHealth({ symbol: s }));

    const totalAnalyzed = scores.length;
    const averageScore = Math.round(scores.reduce((a, b) => a + b.overallScore, 0) / totalAnalyzed);
    const lowRiskCount = scores.filter(s => s.riskLevel === 'low').length;
    const mediumRiskCount = scores.filter(s => s.riskLevel === 'medium').length;
    const highRiskCount = scores.filter(s => s.riskLevel === 'high').length;
    const criticalRiskCount = scores.filter(s => s.riskLevel === 'critical').length;

    const sortedByScore = [...scores].sort((a, b) => b.overallScore - a.overallScore);
    const topHealthy = sortedByScore.slice(0, 5).map(s => ({ symbol: s.symbol, score: s.overallScore, chain: s.chain }));
    const mostRisky = sortedByScore.slice(-5).reverse().map(s => ({ symbol: s.symbol, score: s.overallScore, chain: s.chain }));

    return {
      totalAnalyzed,
      averageScore,
      lowRiskCount,
      mediumRiskCount,
      highRiskCount,
      criticalRiskCount,
      topHealthy,
      mostRisky,
    };
  }
}
