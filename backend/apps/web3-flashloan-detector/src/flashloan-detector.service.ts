import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface FlashloanAnalysisResult {
  address: string;
  chainId: number;
  symbol: string;
  name: string;
  isVulnerable: boolean;
  vulnerabilityScore: number; // 0-100, higher = more vulnerable
  vulnerabilityLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  vulnerabilityFactors: VulnerabilityFactor[];
  flashloanProtection: FlashloanProtection;
  recentLargeTransactions: LargeTransaction[];
  riskAssessment: RiskAssessment;
  recommendations: string[];
  timestamp: string;
}

export interface VulnerabilityFactor {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  value?: string;
}

export interface FlashloanProtection {
  hasOracleCheck: boolean;
  hasTimeLock: boolean;
  hasAccessControl: boolean;
  hasPausable: boolean;
  usesUniswapV2Oracle: boolean;
  usesUniswapV3Oracle: boolean;
  usesChainlinkOracle: boolean;
  hasMultipleOracles: boolean;
}

export interface LargeTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  isFlashloan: boolean;
}

export interface RiskAssessment {
  overallRisk: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  attackProbability: number; // 0-100
  potentialLoss: string;
  affectedProtocols: string[];
}

// Known vulnerable patterns
const VULNERABLE_PATTERNS = [
  'uniswapV2Pair',
  'uniswapV2Router',
  'IUniswapV2Pair',
  'IUniswapV2Router',
];

const ATTACK_SIGNATURES = [
  'swapExactETHForTokens',
  'swapExactTokensForETH',
  'swapExactTokensForTokens',
  'flashSwap',
  'flashLoan',
];

@Injectable()
export class FlashloanDetectorService {
  private readonly etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';

  // Chain ID to network name mapping
  private readonly chainIds: Record<number, { name: string; etherscan: string }> = {
    1: { name: 'ethereum', etherscan: 'api.etherscan.io' },
    56: { name: 'bsc', etherscan: 'api.bscscan.com' },
    137: { name: 'polygon', etherscan: 'api.polygonscan.com' },
    42161: { name: 'arbitrum', etherscan: 'api.arbiscan.io' },
    10: { name: 'optimism', etherscan: 'api-optimistic.etherscan.io' },
    8453: { name: 'base', etherscan: 'api.basescan.org' },
  };

  async analyzeFlashloanRisk(chainId: number, tokenAddress: string): Promise<FlashloanAnalysisResult> {
    if (!this.isValidAddress(tokenAddress)) {
      throw new HttpException('Invalid token address', HttpStatus.BAD_REQUEST);
    }

    const normalizedAddress = tokenAddress.toLowerCase();
    const chainConfig = this.chainIds[chainId] || { name: 'unknown', etherscan: 'api.etherscan.io' };

    // Fetch token info and contract code in parallel
    const [tokenInfo, contractInfo, txHistory, priceData] = await Promise.allSettled([
      this.getTokenInfo(chainId, normalizedAddress),
      this.getContractInfo(chainId, normalizedAddress),
      this.getTransactionHistory(chainId, normalizedAddress),
      this.getPriceData(normalizedAddress, chainId),
    ]);

    const token = tokenInfo.status === 'fulfilled' ? tokenInfo.value : null;
    const contract = contractInfo.status === 'fulfilled' ? contractInfo.value : null;
    const txs = txHistory.status === 'fulfilled' ? txHistory.value : [];
    const price = priceData.status === 'fulfilled' ? priceData.value : null;

    // Analyze vulnerability factors
    const vulnerabilityFactors: VulnerabilityFactor[] = [];
    let vulnerabilityScore = 0;

    // Check for common flashloan attack vectors
    if (contract) {
      // Check for missing Oracle checks
      const hasOracleCheck = contract.sourceCode && (
        contract.sourceCode.includes('Chainlink') ||
        contract.sourceCode.includes('Oracle') ||
        contract.sourceCode.includes('getPrice')
      );

      if (!hasOracleCheck) {
        vulnerabilityFactors.push({
          type: 'NO_ORACLE_CHECK',
          severity: 'critical',
          description: 'Contract does not use price oracles for critical operations',
        });
        vulnerabilityScore += 30;
      }

      // Check for missing access control
      if (!contract.sourceCode?.includes('AccessControl') && !contract.sourceCode?.includes('Ownable')) {
        vulnerabilityFactors.push({
          type: 'NO_ACCESS_CONTROL',
          severity: 'high',
          description: 'Contract lacks access control mechanisms',
        });
        vulnerabilityScore += 20;
      }

      // Check for pausable
      if (!contract.sourceCode?.includes('Pausable') && !contract.sourceCode?.includes('pause')) {
        vulnerabilityFactors.push({
          type: 'NO_PAUSE_FUNCTION',
          severity: 'medium',
          description: 'Contract cannot be paused in case of emergency',
        });
        vulnerabilityScore += 15;
      }

      // Check for mintable
      if (contract.isMintable) {
        vulnerabilityFactors.push({
          type: 'MINTABLE',
          severity: 'high',
          description: 'Token can be minted, potentially enabling inflation attacks',
          value: 'Owner can mint unlimited tokens',
        });
        vulnerabilityScore += 25;
      }

      // Check for honeypot patterns (no sell function)
      if (contract.sourceCode && !contract.sourceCode.includes('transferFrom') && !contract.sourceCode.includes('sell')) {
        vulnerabilityFactors.push({
          type: 'HONEYPOT_PATTERN',
          severity: 'critical',
          description: 'Contract may not allow selling tokens (honeypot)',
        });
        vulnerabilityScore += 35;
      }

      // Check for snapshot functionality
      if (contract.sourceCode?.includes('snapshot')) {
        vulnerabilityFactors.push({
          type: 'HAS_SNAPSHOT',
          severity: 'low',
          description: 'Contract has snapshot functionality for governance',
        });
        vulnerabilityScore -= 5;
      }
    }

    // Analyze recent large transactions
    const largeTxs = txs.slice(0, 20).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      timestamp: parseInt(tx.timeStamp) * 1000,
      isFlashloan: this.isPotentialFlashloan(tx),
    }));

    const flashloanTxs = largeTxs.filter((tx: LargeTransaction) => tx.isFlashloan);
    
    if (flashloanTxs.length > 0) {
      vulnerabilityFactors.push({
        type: 'RECENT_FLASHLOAN_ACTIVITY',
        severity: 'medium',
        description: `${flashloanTxs.length} potential flashloan transactions detected`,
        value: `${flashloanTxs.length} transactions`,
      });
      vulnerabilityScore += 10;
    }

    // Check for large price impact potential
    if (price && price.totalSupply && price.holderCount) {
      const circulatingRatio = parseFloat(price.circulatingSupply) / parseFloat(price.totalSupply);
      
      if (circulatingRatio < 0.3) {
        vulnerabilityFactors.push({
          type: 'LOW_CIRCULATING_SUPPLY',
          severity: 'high',
          description: 'Low circulating supply increases manipulation risk',
          value: `${(circulatingRatio * 100).toFixed(1)}% circulating`,
        });
        vulnerabilityScore += 20;
      }
    }

    // Determine vulnerability level
    let vulnerabilityLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
    if (vulnerabilityScore >= 80) vulnerabilityLevel = 'critical';
    else if (vulnerabilityScore >= 60) vulnerabilityLevel = 'high';
    else if (vulnerabilityScore >= 40) vulnerabilityLevel = 'medium';
    else if (vulnerabilityScore >= 20) vulnerabilityLevel = 'low';

    const isVulnerable = vulnerabilityScore >= 40;

    // Generate recommendations
    const recommendations = this.generateRecommendations(vulnerabilityFactors, contract, isVulnerable);

    // Assess flashloan protection
    const flashloanProtection: FlashloanProtection = {
      hasOracleCheck: contract?.sourceCode?.includes('Oracle') || false,
      hasTimeLock: contract?.sourceCode?.includes('Timelock') || false,
      hasAccessControl: contract?.sourceCode?.includes('AccessControl') || false,
      hasPausable: contract?.sourceCode?.includes('Pausable') || false,
      usesUniswapV2Oracle: contract?.sourceCode?.includes('UniswapV2') || false,
      usesUniswapV3Oracle: contract?.sourceCode?.includes('UniswapV3') || false,
      usesChainlinkOracle: contract?.sourceCode?.includes('Chainlink') || false,
      hasMultipleOracles: false, // Would need deeper analysis
    };
    flashloanProtection.hasMultipleOracles = 
      (flashloanProtection.usesUniswapV2Oracle ? 1 : 0) + 
      (flashloanProtection.usesUniswapV3Oracle ? 1 : 0) + 
      (flashloanProtection.usesChainlinkOracle ? 1 : 0) >= 2;

    // Risk assessment
    const riskAssessment: RiskAssessment = {
      overallRisk: vulnerabilityLevel,
      attackProbability: Math.min(vulnerabilityScore, 100),
      potentialLoss: isVulnerable ? 'High - Flashloan susceptible' : 'Low',
      affectedProtocols: this.getAffectedProtocols(contract),
    };

    return {
      address: normalizedAddress,
      chainId,
      symbol: token?.symbol || 'UNKNOWN',
      name: token?.name || 'Unknown Token',
      isVulnerable,
      vulnerabilityScore: Math.min(vulnerabilityScore, 100),
      vulnerabilityLevel,
      vulnerabilityFactors,
      flashloanProtection,
      recentLargeTransactions: largeTxs,
      riskAssessment,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private isPotentialFlashloan(tx: any): boolean {
    // Check for patterns typical in flashloan attacks
    const methodId = tx.input?.substring(0, 10) || '';
    const value = parseFloat(tx.value) / 1e18;
    
    // Large transaction that might be flashloan
    return value > 100 || tx.isError === '0' && tx.functionName?.includes('swap');
  }

  private generateRecommendations(factors: VulnerabilityFactor[], contract: any, isVulnerable: boolean): string[] {
    const recommendations: string[] = [];

    if (isVulnerable) {
      recommendations.push('⚠️ This token has high flashloan vulnerability');
      recommendations.push('Avoid interacting with DeFi protocols using this token as collateral');
      recommendations.push('Do not hold large amounts of this token');
    }

    const hasOracle = factors.some(f => f.type === 'NO_ORACLE_CHECK');
    if (hasOracle) {
      recommendations.push('🔒 Use protocols with Chainlink or multiple oracles');
    }

    const hasMintable = factors.some(f => f.type === 'MINTABLE');
    if (hasMintable) {
      recommendations.push('⚠️ Verify token supply is fixed before investing');
    }

    const hasLowCirculating = factors.some(f => f.type === 'LOW_CIRCULATING_SUPPLY');
    if (hasLowCirculating) {
      recommendations.push('📊 Be cautious of low circulating supply tokens');
    }

    if (!isVulnerable) {
      recommendations.push('✅ Token appears to have basic flashloan protection');
      recommendations.push('Still exercise caution with large positions');
    }

    return recommendations;
  }

  private getAffectedProtocols(contract: any): string[] {
    const protocols: string[] = [];
    if (!contract?.sourceCode) return protocols;

    if (contract.sourceCode.includes('Aave')) protocols.push('Aave');
    if (contract.sourceCode.includes('Compound')) protocols.push('Compound');
    if (contract.sourceCode.includes('Uniswap')) protocols.push('Uniswap');
    if (contract.sourceCode.includes('Curve')) protocols.push('Curve');
    if (contract.sourceCode.includes('Yearn')) protocols.push('Yearn');

    return protocols;
  }

  private async getTokenInfo(chainId: number, address: string) {
    try {
      const chain = this.chainIds[chainId];
      if (!chain) return null;

      const url = `https://${chain.etherscan.apiKey ? '' : ''}${chain.etherscan}/api?module=token&action=tokeninfo&contractaddress=${address}&apikey=${this.etherscanApiKey}`;
      
      // For demo, return mock data
      return {
        symbol: 'TOKEN',
        name: 'Sample Token',
        totalSupply: '1000000000000000000000000',
        decimals: 18,
      };
    } catch (error) {
      return null;
    }
  }

  private async getContractInfo(chainId: number, address: string) {
    try {
      const chain = this.chainIds[chainId];
      if (!chain) return null;

      // Mock contract info for demo
      return {
        isMintable: false,
        isPausable: false,
        sourceCode: '', // Would need verified source
        verificationStatus: 'verified',
      };
    } catch (error) {
      return null;
    }
  }

  private async getTransactionHistory(chainId: number, address: string) {
    try {
      // Return mock transaction data
      return [
        { hash: '0x...', from: '0x...', to: '0x...', value: '1000000000000000000', timeStamp: Date.now() / 1000, input: '0x', isError: '0' },
      ];
    } catch (error) {
      return [];
    }
  }

  private async getPriceData(address: string, chainId: number) {
    try {
      return {
        price: 0,
        totalSupply: '1000000000000000000000000',
        circulatingSupply: '500000000000000000000000',
        holderCount: 100,
      };
    } catch (error) {
      return null;
    }
  }

  // Get recent flashloan attacks (mock data)
  async getRecentFlashloanAttacks(chainId?: number, limit: number = 10): Promise<any[]> {
    const attacks = [
      {
        token: '0x...',
        symbol: 'BEAN',
        name: 'Bean',
        chainId: 1,
        attackDate: '2024-02-20',
        loss: '$82,000',
        attacker: '0x...',
        vulnerability: 'Price Oracle Manipulation',
      },
      {
        token: '0x...',
        symbol: 'SWAP',
        name: 'Swap',
        chainId: 56,
        attackDate: '2024-01-15',
        loss: '$190,000',
        attacker: '0x...',
        vulnerability: 'Flashloan Attack',
      },
    ];

    return chainId ? attacks.filter(a => a.chainId === chainId).slice(0, limit) : attacks.slice(0, limit);
  }

  // Get potentially vulnerable tokens
  async getPotentiallyVulnerableTokens(chainId?: number, limit: number = 20): Promise<any[]> {
    const tokens = [
      { address: '0x...', symbol: 'MOCK', name: 'Mock Token', chainId: 1, riskScore: 85 },
      { address: '0x...', symbol: 'TEST', name: 'Test Token', chainId: 56, riskScore: 72 },
    ];

    return chainId ? tokens.filter(t => t.chainId === chainId).slice(0, limit) : tokens.slice(0, limit);
  }
}
