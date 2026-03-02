import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface InsiderWallet {
  address: string;
  label: string;
  type: 'founder' | 'team' | 'investor' | 'advisor' | 'exchange';
  tokens: string[];
  firstSeen: number;
  transactionCount: number;
}

interface TokenInsiderData {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  insiderWallets: InsiderWallet[];
  totalInsiderHoldings: number;
  totalSupply: number;
  insiderPercentage: number;
  dumpRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recentInsiderTransactions: InsiderTransaction[];
  lastUpdated: number;
}

interface InsiderTransaction {
  hash: string;
  from: string;
  to: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  valueUSD: number;
  timestamp: number;
  type: 'transfer' | 'sale' | 'unlock' | 'staking_reward';
}

interface GetInsiderDataDto {
  tokenAddress: string;
  chainId?: number;
}

interface SearchInsiderDto {
  query: string;
  chainId?: number;
}

interface GetInsiderTransactionsDto {
  tokenAddress?: string;
  address?: string;
  chainId?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

@Injectable()
export class TokenInsiderTrackerService {
  private readonly logger = new Logger(TokenInsiderTrackerService.name);
  private readonly ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
  
  // Known insider label database (in production, this would be a database)
  private knownInsiders: Map<string, InsiderWallet[]> = new Map();

  constructor(private readonly httpService: HttpService) {
    this.initializeKnownInsiders();
  }

  private initializeKnownInsiders() {
    // Initialize with some known insider addresses for major tokens
    // In production, this would be populated from a database
    const insiders: InsiderWallet[] = [
      {
        address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D44'.toLowerCase(),
        label: 'Vitalik Buterin',
        type: 'founder',
        tokens: ['0x0000000000000000000000000000000000000000'], // ETH
        firstSeen: 2015,
        transactionCount: 5000,
      },
      {
        address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'.toLowerCase(),
        label: 'Vitalik ETH',
        type: 'founder',
        tokens: ['0x0000000000000000000000000000000000000000'],
        firstSeen: 2015,
        transactionCount: 3000,
      },
    ];
    
    this.knownInsiders.set('eth', insiders);
  }

  async getTokenInsiderData(dto: GetInsiderDataDto): Promise<TokenInsiderData> {
    const { tokenAddress, chainId = 1 } = dto;
    
    try {
      // Get token info
      const tokenInfo = await this.getTokenInfo(tokenAddress, chainId);
      
      // Get insider wallets for this token
      const insiderWallets = await this.getInsiderWallets(tokenAddress, chainId);
      
      // Get token supply
      const totalSupply = await this.getTokenSupply(tokenAddress, chainId);
      
      // Calculate insider holdings (simulated - in production would query blockchain)
      const totalInsiderHoldings = await this.calculateInsiderHoldings(insiderWallets, tokenAddress, chainId);
      
      // Calculate insider percentage
      const insiderPercentage = totalSupply > 0 ? (totalInsiderHoldings / totalSupply) * 100 : 0;
      
      // Calculate dump risk score
      const dumpRiskScore = this.calculateDumpRisk(insiderPercentage, insiderWallets.length);
      
      // Determine risk level
      const riskLevel = this.getRiskLevel(dumpRiskScore);
      
      // Get recent insider transactions
      const recentInsiderTransactions = await this.getRecentInsiderTransactions(insiderWallets, chainId);
      
      return {
        tokenAddress: tokenAddress.toLowerCase(),
        tokenName: tokenInfo.name,
        tokenSymbol: tokenInfo.symbol,
        insiderWallets,
        totalInsiderHoldings,
        totalSupply,
        insiderPercentage,
        dumpRiskScore,
        riskLevel,
        recentInsiderTransactions,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      this.logger.error(`Error getting insider data for ${tokenAddress}:`, error);
      throw error;
    }
  }

  async searchInsiders(dto: SearchInsiderDto): Promise<InsiderWallet[]> {
    const { query, chainId = 1 } = dto;
    const results: InsiderWallet[] = [];
    
    // Search in known insiders
    const chainInsiders = this.knownInsiders.get(this.getChainKey(chainId)) || [];
    const queryLower = query.toLowerCase();
    
    for (const insider of chainInsiders) {
      if (
        insider.address.includes(queryLower) ||
        insider.label.toLowerCase().includes(queryLower) ||
        insider.type.includes(queryLower)
      ) {
        results.push(insider);
      }
    }
    
    return results;
  }

  async getInsiderTransactions(dto: GetInsiderTransactionsDto): Promise<InsiderTransaction[]> {
    const { tokenAddress, address, chainId = 1, limit = 50 } = dto;
    
    // In production, this would query actual blockchain data
    // For now, return simulated data
    const transactions: InsiderTransaction[] = [];
    
    // Simulate some transactions
    const sampleTransactions: InsiderTransaction[] = [
      {
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        from: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D44',
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        tokenSymbol: 'ETH',
        amount: 100,
        valueUSD: 250000,
        timestamp: Date.now() - 3600000,
        type: 'transfer',
      },
    ];
    
    return sampleTransactions.slice(0, limit);
  }

  async trackNewInsider(address: string, label: string, type: InsiderWallet['type'], chainId: number = 1): Promise<InsiderWallet> {
    const chainKey = this.getChainKey(chainId);
    const insiders = this.knownInsiders.get(chainKey) || [];
    
    const newInsider: InsiderWallet = {
      address: address.toLowerCase(),
      label,
      type,
      tokens: [],
      firstSeen: Date.now(),
      transactionCount: 0,
    };
    
    insiders.push(newInsider);
    this.knownInsiders.set(chainKey, insiders);
    
    return newInsider;
  }

  async getTopInsiderTokens(chainId: number = 1): Promise<{ token: string; insiderCount: number; riskLevel: string }[]> {
    // Return tokens with highest insider activity
    return [
      { token: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', insiderCount: 15, riskLevel: 'high' }, // WBTC
      { token: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', insiderCount: 12, riskLevel: 'medium' }, // AAVE
      { token: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', insiderCount: 18, riskLevel: 'critical' }, // UNI
    ];
  }

  private async getTokenInfo(tokenAddress: string, chainId: number): Promise<{ name: string; symbol: string }> {
    try {
      const chain = this.getChainConfig(chainId);
      const url = `${chain.explorerApiUrl}?module=token&action=gettokeninfo&contractaddress=${tokenAddress}&apikey=${this.ETHERSCAN_API_KEY}`;
      
      const response = await firstValueFrom(this.httpService.get(url));
      
      if (response.data.status === '1') {
        return {
          name: response.data.result.name,
          symbol: response.data.result.symbol,
        };
      }
    } catch (error) {
      this.logger.warn(`Could not fetch token info from API: ${error}`);
    }
    
    // Return mock data if API fails
    return {
      name: 'Unknown Token',
      symbol: '???',
    };
  }

  private async getTokenSupply(tokenAddress: string, chainId: number): Promise<number> {
    try {
      const chain = this.getChainConfig(chainId);
      const url = `${chain.explorerApiUrl}?module=stats&action=tokensupply&contractaddress=${tokenAddress}&apikey=${this.ETHERSCAN_API_KEY}`;
      
      const response = await firstValueFrom(this.httpService.get(url));
      
      if (response.data.status === '1') {
        return parseFloat(response.data.result);
      }
    } catch (error) {
      this.logger.warn(`Could not fetch token supply from API: ${error}`);
    }
    
    // Return mock data
    return 1000000000; // 1 billion
  }

  private async getInsiderWallets(tokenAddress: string, chainId: number): Promise<InsiderWallet[]> {
    const chainKey = this.getChainKey(chainId);
    const insiders = this.knownInsiders.get(chainKey) || [];
    
    // Return insiders that have interacted with this token
    return insiders.filter(insider => 
      insider.tokens.length === 0 || 
      insider.tokens.includes(tokenAddress.toLowerCase())
    );
  }

  private async calculateInsiderHoldings(wallets: InsiderWallet[], tokenAddress: string, chainId: number): Promise<number> {
    // In production, this would query actual token balances
    // For demo, return a simulated value
    const totalSupply = await this.getTokenSupply(tokenAddress, chainId);
    return totalSupply * 0.15; // Simulate 15% insider holdings
  }

  private calculateDumpRisk(insiderPercentage: number, insiderCount: number): number {
    let risk = 0;
    
    // Higher insider percentage = higher risk
    if (insiderPercentage > 30) risk += 50;
    else if (insiderPercentage > 20) risk += 35;
    else if (insiderPercentage > 10) risk += 20;
    else if (insiderPercentage > 5) risk += 10;
    
    // More insiders can mean more potential dumpers
    if (insiderCount > 10) risk += 20;
    else if (insiderCount > 5) risk += 10;
    
    // Cap at 100
    return Math.min(risk, 100);
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  private async getRecentInsiderTransactions(wallets: InsiderWallet[], chainId: number): Promise<InsiderTransaction[]> {
    // In production, this would query actual transaction data
    // Return sample data
    return [];
  }

  private getChainKey(chainId: number): string {
    const chainNames: Record<number, string> = {
      1: 'eth',
      56: 'bsc',
      137: 'polygon',
      42161: 'arbitrum',
      10: 'optimism',
      8453: 'base',
    };
    return chainNames[chainId] || 'eth';
  }

  private getChainConfig(chainId: number) {
    const configs: Record<number, { explorerApiUrl: string }> = {
      1: { explorerApiUrl: 'https://api.etherscan.io/api' },
      56: { explorerApiUrl: 'https://api.bscscan.com/api' },
      137: { explorerApiUrl: 'https://api.polygonscan.com/api' },
      42161: { explorerApiUrl: 'https://api.arbiscan.io/api' },
      10: { explorerApiUrl: 'https://api-optimistic.etherscan.io/api' },
      8453: { explorerApiUrl: 'https://api.basescan.org/api' },
    };
    return configs[chainId] || configs[1];
  }
}
