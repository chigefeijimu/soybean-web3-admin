import { Injectable } from '@nestjs/common';

export interface TokenSafetyResult {
  address: string;
  chain: string;
  symbol: string;
  name: string;
  isSuspicious: boolean;
  riskScore: number;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  holderAnalysis: HolderAnalysis;
  liquidityAnalysis: LiquidityAnalysis;
  contractAnalysis: ContractAnalysis;
  recommendation: string;
  scanTimestamp: number;
}

export interface RiskFactor {
  type: string;
  description: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  score: number;
}

export interface HolderAnalysis {
  totalHolders: number;
  top10Percentage: number;
  top25Percentage: number;
  top50Percentage: number;
  concentrationRisk: 'low' | 'medium' | 'high' | 'critical';
  averageHolding: string;
  holderDistribution: number[];
}

export interface LiquidityAnalysis {
  liquidityLocked: boolean;
  liquidityAmount: string;
  liquidityLockDuration: string;
  liquidityProviderCount: number;
  liquidityRisk: 'low' | 'medium' | 'high' | 'critical';
}

export interface ContractAnalysis {
  isVerified: boolean;
  isMintable: boolean;
  isPausable: boolean;
  hasBlacklist: boolean;
  isProxy: boolean;
  hasOwnershipControl: boolean;
  tradingRestrictions: string[];
  honeypotIndicators: string[];
}

// Mock data for demonstration
const MOCK_TOKENS = {
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    chain: 'ethereum',
    isVerified: true,
    isMintable: false,
    isPausable: false,
    hasBlacklist: false,
    isProxy: false,
    totalHolders: 12543,
    top10Percentage: 85.2,
    liquidityLocked: true,
  },
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    chain: 'ethereum',
    isVerified: true,
    isMintable: false,
    isPausable: false,
    hasBlacklist: false,
    isProxy: false,
    totalHolders: 45231,
    top10Percentage: 62.5,
    liquidityLocked: true,
  },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    symbol: 'USDT',
    name: 'Tether USD',
    chain: 'ethereum',
    isVerified: true,
    isMintable: true,
    isPausable: true,
    hasBlacklist: true,
    isProxy: true,
    totalHolders: 89234,
    top10Percentage: 45.2,
    liquidityLocked: true,
  },
};

@Injectable()
export class TokenSafetyService {
  private readonly chainRpcUrls: Record<string, string> = {
    ethereum: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    bsc: 'https://bsc-dataseed1.binance.org',
    polygon: 'https://polygon-rpc.com',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    avalanche: 'https://api.avax.network/ext/bc/C/rpc',
    base: 'https://mainnet.base.org',
  };

  async analyzeToken(address: string, chain: string = 'ethereum'): Promise<TokenSafetyResult> {
    const normalizedAddress = address.toLowerCase();
    const mockData = MOCK_TOKENS[normalizedAddress];
    
    // Generate mock data for any token
    const holderCount = mockData?.totalHolders || Math.floor(Math.random() * 50000) + 100;
    const top10Pct = mockData?.top10Percentage || 20 + Math.random() * 60;
    const isVerified = mockData?.isVerified ?? Math.random() > 0.3;
    const isMintable = mockData?.isMintable ?? Math.random() > 0.7;
    const isPausable = mockData?.isPausable ?? Math.random() > 0.8;
    const hasBlacklist = mockData?.hasBlacklist ?? Math.random() > 0.7;
    const isProxy = mockData?.isProxy ?? Math.random() > 0.8;
    const liquidityLocked = mockData?.liquidityLocked ?? Math.random() > 0.5;
    const symbol = mockData?.symbol || this.generateFakeSymbol();
    const name = mockData?.name || this.generateFakeName();

    // Calculate risk score
    let riskScore = 0;
    const factors: RiskFactor[] = [];

    // Holder concentration analysis
    if (top10Pct > 90) {
      riskScore += 40;
      factors.push({
        type: 'holder_concentration',
        description: 'Top 10 holders control over 90% of tokens - extreme concentration risk',
        severity: 'critical',
        score: 40,
      });
    } else if (top10Pct > 70) {
      riskScore += 25;
      factors.push({
        type: 'holder_concentration',
        description: 'Top 10 holders control over 70% of tokens - high concentration risk',
        severity: 'danger',
        score: 25,
      });
    } else if (top10Pct > 50) {
      riskScore += 15;
      factors.push({
        type: 'holder_concentration',
        description: 'Top 10 holders control over 50% of tokens',
        severity: 'warning',
        score: 15,
      });
    }

    // Contract analysis
    if (!isVerified) {
      riskScore += 20;
      factors.push({
        type: 'contract_verification',
        description: 'Contract source code is not verified on block explorer',
        severity: 'danger',
        score: 20,
      });
    }

    if (isMintable) {
      riskScore += 25;
      factors.push({
        type: 'mintable_token',
        description: 'Token can be minted - potential for unlimited supply',
        severity: 'danger',
        score: 25,
      });
    }

    if (isPausable) {
      riskScore += 15;
      factors.push({
        type: 'pausable_token',
        description: 'Token can be paused - trading can be stopped',
        severity: 'warning',
        score: 15,
      });
    }

    if (hasBlacklist) {
      riskScore += 10;
      factors.push({
        type: 'blacklist',
        description: 'Token has blacklist functionality - can freeze addresses',
        severity: 'warning',
        score: 10,
      });
    }

    if (isProxy) {
      riskScore += 10;
      factors.push({
        type: 'proxy_contract',
        description: 'Token uses proxy pattern - upgradeable contract',
        severity: 'info',
        score: 10,
      });
    }

    // Liquidity analysis
    if (!liquidityLocked) {
      riskScore += 25;
      factors.push({
        type: 'liquidity_lock',
        description: 'Liquidity is not locked - rug pull risk',
        severity: 'critical',
        score: 25,
      });
    }

    // Suspicious patterns
    if (holderCount < 10 && top10Pct > 95) {
      riskScore += 30;
      factors.push({
        type: 'suspicious_pattern',
        description: 'Very few holders with extreme concentration - potential scam',
        severity: 'critical',
        score: 30,
      });
    }

    // Trading restrictions
    const tradingRestrictions: string[] = [];
    if (isMintable) tradingRestrictions.push('Minting can increase supply');
    if (isPausable) tradingRestrictions.push('Trading can be paused');
    if (hasBlacklist) tradingRestrictions.push('Addresses can be blacklisted');

    // Honeypot indicators
    const honeypotIndicators: string[] = [];
    if (isMintable && !liquidityLocked) {
      honeypotIndicators.push('Mintable token with unlocked liquidity');
    }
    if (holderCount < 20 && top10Pct > 90) {
      honeypotIndicators.push('Extremely concentrated ownership');
    }

    // Determine risk level
    let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else if (riskScore >= 20) riskLevel = 'low';
    else riskLevel = 'safe';

    // Generate recommendation
    let recommendation = '';
    if (riskLevel === 'critical') {
      recommendation = '🚨 EXTREME RISK: Do not interact with this token. High probability of scam or rug pull.';
    } else if (riskLevel === 'high') {
      recommendation = '⚠️ HIGH RISK: Exercise extreme caution. Only interact if you fully understand the risks.';
    } else if (riskLevel === 'medium') {
      recommendation = '⚡ MEDIUM RISK: Some risk factors identified. Investigate further before interacting.';
    } else if (riskLevel === 'low') {
      recommendation = '✅ LOW RISK: Minor concerns identified. Generally safe but always do your own research.';
    } else {
      recommendation = '✅ SAFE: No significant risk factors detected. Still do your own research.';
    }

    // Calculate holder distribution
    const holderDistribution = [
      Math.random() * top10Pct,
      Math.random() * (top10Pct * 0.5),
      Math.random() * 20,
      Math.random() * 10,
      100 - top10Pct - Math.random() * 30,
    ];

    return {
      address: normalizedAddress,
      chain,
      symbol,
      name,
      isSuspicious: riskLevel === 'critical' || riskLevel === 'high',
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      factors,
      holderAnalysis: {
        totalHolders: holderCount,
        top10Percentage: Math.round(top10Pct * 10) / 10,
        top25Percentage: Math.round((top10Pct + Math.random() * 20) * 10) / 10,
        top50Percentage: Math.round((top10Pct + Math.random() * 30) * 10) / 10,
        concentrationRisk: top10Pct > 70 ? 'critical' : top10Pct > 50 ? 'high' : top10Pct > 30 ? 'medium' : 'low',
        averageHolding: `${(1000000 / holderCount).toFixed(2)} tokens`,
        holderDistribution: holderDistribution.map(v => Math.round(v * 10) / 10),
      },
      liquidityAnalysis: {
        liquidityLocked,
        liquidityAmount: liquidityLocked ? `${(Math.random() * 10000000).toFixed(2)} USD` : 'N/A',
        liquidityLockDuration: liquidityLocked ? `${Math.floor(Math.random() * 365) + 30} days` : 'Not locked',
        liquidityProviderCount: Math.floor(Math.random() * 500) + 10,
        liquidityRisk: liquidityLocked ? 'low' : 'critical',
      },
      contractAnalysis: {
        isVerified,
        isMintable,
        isPausable,
        hasBlacklist,
        isProxy,
        hasOwnershipControl: Math.random() > 0.5,
        tradingRestrictions,
        honeypotIndicators,
      },
      recommendation,
      scanTimestamp: Date.now(),
    };
  }

  async getTrendingScams(): Promise<any[]> {
    // Return trending scam patterns
    return [
      {
        name: 'Fake Token Scam',
        description: 'Scammers create tokens with popular names to trick users',
        indicators: ['Unverified contract', 'No liquidity lock', 'High holder concentration'],
      },
      {
        name: 'Rug Pull',
        description: 'Developers drain liquidity after accumulation',
        indicators: ['Liquidity not locked', 'Large token holdings in few addresses', 'Recently created'],
      },
      {
        name: 'Honeypot',
        description: 'Token can only be bought but not sold',
        indicators: ['Trading restrictions', 'Blacklist functionality', 'Minting capability'],
      },
    ];
  }

  async getSafetyTips(): Promise<string[]> {
    return [
      'Always verify the contract address on the official project website',
      'Check if the contract is verified on Etherscan or similar explorers',
      'Verify liquidity is locked for legitimate projects',
      'Be wary of tokens with minting capabilities',
      'Check holder distribution - beware of high concentration',
      'Research the team and project background',
      'Start with small amounts when testing a new token',
      'Use multiple data sources to verify token legitimacy',
    ];
  }

  private generateFakeSymbol(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let symbol = '';
    for (let i = 0; i < 3; i++) {
      symbol += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return symbol;
  }

  private generateFakeName(): string {
    const prefixes = ['Safe', 'Secure', 'Trust', 'Real', 'Official'];
    const suffixes = ['Token', 'Coin', 'Protocol', 'Network', 'Chain'];
    return prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
  }
}
