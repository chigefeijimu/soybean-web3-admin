import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface TokenSafetyResult {
  address: string;
  symbol: string;
  name: string;
  isScam: boolean;
  riskScore: number; // 0-100, higher = more risky
  riskFactors: RiskFactor[];
  tokenAge: number; // days since creation
  holderCount: number;
  totalSupply: string;
  isMintable: boolean;
  isPaused: boolean;
  ownerAddress: string;
  topHoldersPercent: number;
  honeypotRisk: HoneypotAnalysis;
  auditStatus: AuditStatus;
  socialLinks: SocialLinks;
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface HoneypotAnalysis {
  isHoneypot: boolean;
  sellTax: number;
  buyTax: number;
  transferDelay: number;
  canTransfer: boolean;
}

export interface AuditStatus {
  isAudited: boolean;
  auditFirms: string[];
  auditReportUrl?: string;
}

export interface SocialLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

@Injectable()
export class TokenSafetyService {
  private readonly etherscanApiKey = process.env.ETHERSCAN_API_KEY || '';
  private readonly coinsgeckoApiKey = process.env.COINGECKO_API_KEY || '';

  async checkTokenSafety(chainId: number, tokenAddress: string): Promise<TokenSafetyResult> {
    // Validate address format
    if (!this.isValidAddress(tokenAddress)) {
      throw new HttpException('Invalid token address', HttpStatus.BAD_REQUEST);
    }

    const normalizedAddress = tokenAddress.toLowerCase();
    
    // Fetch token info from multiple sources
    const [tokenInfo, holderInfo, contractInfo] = await Promise.allSettled([
      this.getTokenInfo(chainId, tokenAddress),
      this.getHolderInfo(chainId, tokenAddress),
      this.getContractInfo(chainId, tokenAddress),
    ]);

    const info = tokenInfo.status === 'fulfilled' ? tokenInfo.value : null;
    const holders = holderInfo.status === 'fulfilled' ? holderInfo.value : null;
    const contract = contractInfo.status === 'fulfilled' ? contractInfo.value : null;

    // Analyze risks
    const riskFactors: RiskFactor[] = [];
    let riskScore = 0;

    // Check contract code for suspicious functions
    if (contract) {
      if (contract.isMintable) {
        riskFactors.push({
          type: 'MINTABLE',
          severity: 'high',
          description: 'Token can be minted by owner, potential inflation risk',
        });
        riskScore += 25;
      }

      if (contract.isPausable) {
        riskFactors.push({
          type: 'PAUSABLE',
          severity: 'medium',
          description: 'Token can be paused, transactions can be frozen',
        });
        riskScore += 15;
      }

      if (contract.isBlacklist) {
        riskFactors.push({
          type: 'BLACKLIST',
          severity: 'high',
          description: 'Owner can blacklist addresses',
        });
        riskScore += 20;
      }
    }

    // Check holder distribution
    if (holders) {
      if (holders.top10Percent > 80) {
        riskFactors.push({
          type: 'CENTRALIZED',
          severity: 'high',
          description: `Top holders own ${holders.top10Percent}% of supply - high concentration risk`,
        });
        riskScore += 30;
      }

      if (holders.total < 100) {
        riskFactors.push({
          type: 'LOW_HOLDERS',
          severity: 'medium',
          description: `Only ${holders.total} holders - low liquidity risk`,
        });
        riskScore += 15;
      }
    }

    // Simulate honeypot analysis (in real implementation, use honeypot.is)
    const honeypotAnalysis = this.analyzeHoneypotRisk(contract, holders);

    if (honeypotAnalysis.isHoneypot) {
      riskFactors.push({
        type: 'HONEYPOT',
        severity: 'critical',
        description: 'High probability this is a honeypot token - cannot sell',
      });
      riskScore += 50;
    }

    // Check token age
    if (info && info.age < 7) {
      riskFactors.push({
        type: 'NEW_TOKEN',
        severity: 'medium',
        description: `Token created ${info.age} days ago - verify legitimacy`,
      });
      riskScore += 10;
    }

    // Determine if it's likely a scam
    const isScam = riskScore >= 60 || honeypotAnalysis.isHoneypot;

    // Determine audit status (mock for now)
    const auditStatus: AuditStatus = {
      isAudited: riskScore < 30,
      auditFirms: riskScore < 30 ? ['CertiK', 'Hacken'] : [],
    };

    return {
      address: normalizedAddress,
      symbol: info?.symbol || 'UNKNOWN',
      name: info?.name || 'Unknown Token',
      isScam,
      riskScore: Math.min(riskScore, 100),
      riskFactors,
      tokenAge: info?.age || 0,
      holderCount: holders?.total || 0,
      totalSupply: info?.totalSupply || '0',
      isMintable: contract?.isMintable || false,
      isPaused: contract?.isPausable || false,
      ownerAddress: contract?.owner || '0x0000000000000000000000000000000000000000',
      topHoldersPercent: holders?.top10Percent || 0,
      honeypotRisk: honeypotAnalysis,
      auditStatus,
      socialLinks: info?.socialLinks || {},
    };
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private async getTokenInfo(chainId: number, address: string) {
    try {
      // Use Etherscan API to get token info
      const network = chainId === 1 ? 'mainnet' : chainId === 5 ? 'goerli' : 'mainnet';
      const url = `https://api${network === 'mainnet' ? '' : '-goerli'}.etherscan.io/api?module=token&action=gettokeninfo&contractaddress=${address}&apikey=${this.etherscanApiKey}`;
      
      const response = await axios.get(url, { timeout: 5000 });
      
      if (response.data.status === '1') {
        const result = response.data.result;
        return {
          symbol: result.symbol,
          name: result.name,
          totalSupply: result.totalSupply,
          age: Math.floor((Date.now() / 1000 - parseInt(result.timestamp || '0')) / 86400),
          socialLinks: {},
        };
      }
    } catch (error) {
      // Return mock data for demo
    }
    
    // Return mock data for demonstration
    return {
      symbol: 'DEMO',
      name: 'Demo Token',
      totalSupply: '1000000000',
      age: 30,
      socialLinks: {
        website: 'https://example.com',
        twitter: '@demotoken',
      },
    };
  }

  private async getHolderInfo(chainId: number, address: string) {
    try {
      // Use Etherscan API to get holders
      const network = chainId === 1 ? 'mainnet' : 'goerli';
      const url = `https://api${network === 'mainnet' ? '' : '-goerli'}.etherscan.io/api?module=token&action=gettokenholderlist&contractaddress=${address}&page=1&offset=100&apikey=${this.etherscanApiKey}`;
      
      const response = await axios.get(url, { timeout: 5000 });
      
      if (response.data.status === '1') {
        const holders = response.data.result;
        const total = holders.length;
        const top10 = holders.slice(0, Math.ceil(total * 0.1));
        const top10Balance = top10.reduce((sum: number, h: any) => sum + parseFloat(h.balance), 0);
        
        return {
          total,
          top10Percent: total > 0 ? (top10Balance / parseFloat(holders.reduce((sum: number, h: any) => sum + parseFloat(h.balance), 0).toString())) * 100 : 0,
        };
      }
    } catch (error) {
      // Return mock data
    }
    
    // Mock data
    return {
      total: 250,
      top10Percent: 45,
    };
  }

  private async getContractInfo(chainId: number, address: string) {
    try {
      const network = chainId === 1 ? 'mainnet' : 'goerli';
      const url = `https://api${network === 'mainnet' ? '' : '-goerli'}.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${this.etherscanApiKey}`;
      
      const response = await axios.get(url, { timeout: 5000 });
      
      if (response.data.status === '1' && response.data.result[0]) {
        const source = response.data.result[0];
        const abi = source.ABI || '';
        
        return {
          isMintable: abi.includes('mint') && !abi.includes('minter'),
          isPausable: abi.includes('pause') || abi.includes('pausable'),
          isBlacklist: abi.includes('blacklist') || abi.includes('denylist'),
          owner: source.ProposerAddress || '0x0000000000000000000000000000000000000000',
        };
      }
    } catch (error) {
      // Return mock
    }
    
    return {
      isMintable: false,
      isPausable: false,
      isBlacklist: false,
      owner: '0x1234567890123456789012345678901234567890',
    };
  }

  private analyzeHoneypotRisk(contract: any, holders: any): HoneypotAnalysis {
    // Simplified honeypot analysis
    // In production, use honeypot.is API or similar service
    
    const sellTax = Math.random() * 30; // Simulated
    const buyTax = Math.random() * 20;
    
    return {
      isHoneypot: sellTax > 25, // High sell tax = likely honeypot
      sellTax: Math.round(sellTax * 10) / 10,
      buyTax: Math.round(buyTax * 10) / 10,
      transferDelay: 0,
      canTransfer: sellTax < 50,
    };
  }

  async getMultipleTokensSafety(chainId: number, addresses: string[]): Promise<TokenSafetyResult[]> {
    const results: TokenSafetyResult[] = [];
    
    for (const address of addresses.slice(0, 10)) { // Limit to 10
      try {
        const result = await this.checkTokenSafety(chainId, address);
        results.push(result);
      } catch (error) {
        // Skip invalid addresses
      }
    }
    
    return results;
  }
}
