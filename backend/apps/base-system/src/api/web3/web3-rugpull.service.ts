import { Injectable } from '@nestjs/common';

interface RiskAnalysis {
  tokenAddress: string;
  chainId: number;
  riskScore: number; // 0-100, higher = more risky
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  timestamp: number;
}

interface RiskFactor {
  name: string;
  value: string | number | boolean;
  risk: 'positive' | 'negative' | 'neutral';
  description: string;
}

@Injectable()
export class Web3RugpullService {
  // Common honeypot function signatures
  private honeypotSignatures = [
    '0x5c60da1b', // transferFrom with hook
    '0x4ce38b71', // suspicious transfer
  ];

  // Suspicious contract patterns
  private suspiciousPatterns = [
    '0x095ea7b3', // approve (potential unlimited approval)
    '0x23b872dd', // transferFrom
    '0xa9059cbb', // transfer (can be trapped)
  ];

  async analyzeToken(tokenAddress: string, chainId: number): Promise<RiskAnalysis> {
    const riskScore = await this.calculateRiskScore(tokenAddress, chainId);
    
    // Get detailed factors
    const factors: RiskFactor[] = [];
    
    // Check contract ownership
    const ownership = await this.checkOwnership(tokenAddress, chainId);
    factors.push({
      name: 'Contract Ownership',
      value: ownership.isRenounced ? 'Renounced' : ownership.owner,
      risk: ownership.isRenounced ? 'positive' : 'negative',
      description: ownership.isRenounced 
        ? 'Contract ownership has been renounced - team cannot modify supply'
        : 'Contract is owned - team has control over the contract'
    });

    // Check liquidity lock
    const liquidity = await this.analyzeLiquidity(tokenAddress, chainId);
    factors.push({
      name: 'Liquidity Locked',
      value: liquidity.isLocked ? `Locked until ${liquidity.lockUntil}` : 'Unlocked',
      risk: liquidity.isLocked ? 'positive' : 'negative',
      description: liquidity.isLocked
        ? 'Liquidity is locked, reducing rug pull risk'
        : 'Liquidity is not locked - high rug pull risk'
    });

    // Check holder distribution
    const holders = await this.analyzeHolders(tokenAddress, chainId);
    factors.push({
      name: 'Top Holder %',
      value: `${holders.top10Percent.toFixed(1)}%`,
      risk: holders.top10Percent > 50 ? 'negative' : holders.top10Percent > 30 ? 'neutral' : 'positive',
      description: holders.top10Percent > 50 
        ? 'High concentration risk - top holders own majority of tokens'
        : 'Healthy distribution across holders'
    });

    // Check honeypot
    const honeypot = await this.checkHoneypot(tokenAddress, chainId);
    factors.push({
      name: 'Honeypot Risk',
      value: honeypot.isHoneypot ? 'Detected' : 'Not detected',
      risk: honeypot.isHoneypot ? 'negative' : 'positive',
      description: honeypot.isHoneypot
        ? 'Token exhibits honeypot characteristics - cannot sell'
        : 'No honeypot patterns detected'
    });

    // Check trading restrictions
    const trading = await this.checkTradingRestrictions(tokenAddress, chainId);
    factors.push({
      name: 'Trading Restrictions',
      value: trading.hasRestrictions ? 'Restricted' : 'Unrestricted',
      risk: trading.hasRestrictions ? 'negative' : 'positive',
      description: trading.hasRestrictions
        ? 'Token has trading restrictions or blacklists'
        : 'No trading restrictions detected'
    });

    // Check mint functionality
    const mint = await this.checkMintFunction(tokenAddress, chainId);
    factors.push({
      name: 'Mint Function',
      value: mint.canMint ? 'Available' : 'Disabled',
      risk: mint.canMint ? 'negative' : 'positive',
      description: mint.canMint
        ? 'Token can be minted - potential for infinite supply'
        : 'Minting is disabled or not available'
    });

    // Determine risk level
    let riskLevel: RiskAnalysis['riskLevel'];
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else if (riskScore >= 20) riskLevel = 'low';
    else riskLevel = 'safe';

    return {
      tokenAddress,
      chainId,
      riskScore,
      riskLevel,
      factors,
      timestamp: Date.now()
    };
  }

  async calculateRiskScore(tokenAddress: string, chainId: number): Promise<number> {
    let score = 0;
    const maxScore = 100;

    // Check ownership (0-20 points)
    const ownership = await this.checkOwnership(tokenAddress, chainId);
    if (!ownership.isRenounced) score += 20;

    // Check liquidity (0-25 points)
    const liquidity = await this.analyzeLiquidity(tokenAddress, chainId);
    if (!liquidity.isLocked) score += 25;
    if ((liquidity.pairValue || 0) < 10000) score += 10;

    // Check holders (0-20 points)
    const holders = await this.analyzeHolders(tokenAddress, chainId);
    if (holders.top10Percent > 50) score += 20;
    else if (holders.top10Percent > 30) score += 10;

    // Check honeypot (0-20 points)
    const honeypot = await this.checkHoneypot(tokenAddress, chainId);
    if (honeypot.isHoneypot) score += 20;

    // Check trading restrictions (0-10 points)
    const trading = await this.checkTradingRestrictions(tokenAddress, chainId);
    if (trading.hasRestrictions) score += 10;

    // Check mint (0-10 points)
    const mint = await this.checkMintFunction(tokenAddress, chainId);
    if (mint.canMint) score += 10;

    return Math.min(score, maxScore);
  }

  async checkHoneypot(tokenAddress: string, chainId: number): Promise<{
    isHoneypot: boolean;
    buyTax: number;
    sellTax: number;
    transferGas: number;
  }> {
    // Simulated honeypot analysis
    // In production, this would use honeypot.is API or similar
    const randomFactor = this.pseudoRandom(tokenAddress);
    
    // Simulate detection based on token address
    const isHoneypot = randomFactor < 0.1; // 10% chance for demo
    
    return {
      isHoneypot,
      buyTax: isHoneypot ? 0 : Math.floor(randomFactor * 10),
      sellTax: isHoneypot ? 99 : Math.floor(randomFactor * 15),
      transferGas: Math.floor(50000 + randomFactor * 100000)
    };
  }

  async analyzeLiquidity(tokenAddress: string, chainId: number): Promise<{
    isLocked: boolean;
    lockUntil?: string;
    pairAddress?: string;
    pairValue?: number;
    lockedValue?: number;
  }> {
    // Simulated liquidity analysis
    const randomFactor = this.pseudoRandom(tokenAddress + 'liq');
    const isLocked = randomFactor > 0.3;
    const lockDate = new Date();
    lockDate.setMonth(lockDate.getMonth() + Math.floor(randomFactor * 12));
    
    return {
      isLocked,
      lockUntil: isLocked ? lockDate.toISOString().split('T')[0] : undefined,
      pairAddress: '0x' + this.generateHex(40),
      pairValue: Math.floor(randomFactor * 1000000),
      lockedValue: isLocked ? Math.floor(randomFactor * 500000) : 0
    };
  }

  async analyzeHolders(tokenAddress: string, chainId: number): Promise<{
    totalHolders: number;
    top10Percent: number;
    topHolder: string;
    holderDistribution: { address: string; percent: number }[];
  }> {
    // Simulated holder analysis
    const randomFactor = this.pseudoRandom(tokenAddress + 'holders');
    const totalHolders = Math.floor(10 + randomFactor * 1000);
    const top10Percent = 20 + randomFactor * 60;
    
    // Generate simulated holders
    const holderDistribution: { address: string; percent: number }[] = [];
    let remaining = 100;
    for (let i = 0; i < Math.min(10, Math.floor(totalHolders / 10)); i++) {
      const percent = i === 0 ? top10Percent : (remaining / (10 - i)) * (0.8 + randomFactor * 0.4);
      holderDistribution.push({
        address: '0x' + this.generateHex(40),
        percent: Math.min(percent, remaining)
      });
      remaining -= percent;
    }

    return {
      totalHolders,
      top10Percent,
      topHolder: holderDistribution[0]?.address || '0x' + this.generateHex(40),
      holderDistribution
    };
  }

  async getSuspiciousTokens(chainId: number, limit: number): Promise<RiskAnalysis[]> {
    // Return list of known suspicious tokens
    const suspiciousList = [
      { address: '0x' + this.generateHex(40), name: 'SuspiciousToken1' },
      { address: '0x' + this.generateHex(40), name: 'RugToken2' },
      { address: '0x' + this.generateHex(40), name: 'Honeypot3' },
    ];
    
    const results: RiskAnalysis[] = [];
    for (let i = 0; i < Math.min(limit, suspiciousList.length); i++) {
      const token = suspiciousList[i];
      const analysis = await this.analyzeToken(token.address, chainId);
      analysis.riskScore = 70 + this.pseudoRandom(token.address) * 30;
      analysis.riskLevel = 'high';
      results.push(analysis);
    }
    
    return results;
  }

  private async checkOwnership(tokenAddress: string, chainId: number): Promise<{
    owner: string;
    isRenounced: boolean;
  }> {
    // Simulated ownership check
    const randomFactor = this.pseudoRandom(tokenAddress + 'owner');
    const isRenounced = randomFactor > 0.5;
    
    return {
      owner: isRenounced ? '0x0000000000000000000000000000000000000000' : '0x' + this.generateHex(40),
      isRenounced
    };
  }

  private async checkTradingRestrictions(tokenAddress: string, chainId: number): Promise<{
    hasRestrictions: boolean;
    blacklistEnabled: boolean;
    whitelistingEnabled: boolean;
  }> {
    const randomFactor = this.pseudoRandom(tokenAddress + 'trade');
    return {
      hasRestrictions: randomFactor < 0.2,
      blacklistEnabled: randomFactor < 0.1,
      whitelistingEnabled: randomFactor < 0.15
    };
  }

  private async checkMintFunction(tokenAddress: string, chainId: number): Promise<{
    canMint: boolean;
    maxSupply?: number;
    totalSupply?: number;
  }> {
    const randomFactor = this.pseudoRandom(tokenAddress + 'mint');
    return {
      canMint: randomFactor < 0.3,
      maxSupply: 1000000000,
      totalSupply: Math.floor(randomFactor * 1000000000)
    };
  }

  // Helper functions
  private pseudoRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  }

  private generateHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
}
