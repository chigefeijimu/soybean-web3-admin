import { Controller, Get, Post, Query, Body } from '@nestjs/common';
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

@Controller('web3/token-insider-tracker')
export class TokenInsiderTrackerController {
  private readonly ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
  
  // Known insider database
  private knownInsiders: Map<string, InsiderWallet[]> = new Map([
    ['eth', [
      { address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D44'.toLowerCase(), label: 'Vitalik Buterin', type: 'founder', tokens: [], firstSeen: 2015, transactionCount: 5000 },
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'.toLowerCase(), label: 'Vitalik ETH', type: 'founder', tokens: [], firstSeen: 2015, transactionCount: 3000 },
    ]],
    ['bsc', []],
    ['polygon', []],
    ['arbitrum', []],
  ]);

  constructor(private readonly httpService: HttpService) {}

  @Get('token-data')
  async getTokenInsiderData(
    @Query('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: number = 1,
  ) {
    const chainKey = this.getChainKey(chainId);
    const insiders = this.knownInsiders.get(chainKey) || [];
    
    // Get token info
    let tokenName = 'Unknown Token';
    let tokenSymbol = '???';
    let totalSupply = 1000000000;
    
    try {
      const chain = this.getChainConfig(chainId);
      const url = `${chain.explorerApiUrl}?module=token&action=gettokeninfo&contractaddress=${tokenAddress}&apikey=${this.ETHERSCAN_API_KEY}`;
      const response = await firstValueFrom(this.httpService.get(url));
      if (response.data.status === '1') {
        tokenName = response.data.result.name;
        tokenSymbol = response.data.result.symbol;
      }
    } catch (e) {
      // Use default values
    }

    try {
      const chain = this.getChainConfig(chainId);
      const url = `${chain.explorerApiUrl}?module=stats&action=tokensupply&contractaddress=${tokenAddress}&apikey=${this.ETHERSCAN_API_KEY}`;
      const response = await firstValueFrom(this.httpService.get(url));
      if (response.data.status === '1') {
        totalSupply = parseFloat(response.data.result);
      }
    } catch (e) {
      // Use default value
    }

    // Calculate insider holdings (simulated)
    const totalInsiderHoldings = totalSupply * 0.15;
    const insiderPercentage = (totalInsiderHoldings / totalSupply) * 100;
    
    // Calculate dump risk
    let dumpRiskScore = 0;
    if (insiderPercentage > 30) dumpRiskScore += 50;
    else if (insiderPercentage > 20) dumpRiskScore += 35;
    else if (insiderPercentage > 10) dumpRiskScore += 20;
    else if (insiderPercentage > 5) dumpRiskScore += 10;
    
    if (insiders.length > 10) dumpRiskScore += 20;
    else if (insiders.length > 5) dumpRiskScore += 10;
    
    dumpRiskScore = Math.min(dumpRiskScore, 100);
    
    const riskLevel = dumpRiskScore >= 75 ? 'critical' : dumpRiskScore >= 50 ? 'high' : dumpRiskScore >= 25 ? 'medium' : 'low';

    return {
      code: 200,
      data: {
        tokenAddress: tokenAddress.toLowerCase(),
        tokenName,
        tokenSymbol,
        insiderWallets: insiders,
        totalInsiderHoldings,
        totalSupply,
        insiderPercentage,
        dumpRiskScore,
        riskLevel,
        recentInsiderTransactions: [],
        lastUpdated: Date.now(),
      },
    };
  }

  @Get('search')
  async searchInsiders(
    @Query('query') query: string,
    @Query('chainId') chainId: number = 1,
  ) {
    const chainKey = this.getChainKey(chainId);
    const insiders = this.knownInsiders.get(chainKey) || [];
    const queryLower = query.toLowerCase();
    
    const results = insiders.filter(insider =>
      insider.address.includes(queryLower) ||
      insider.label.toLowerCase().includes(queryLower) ||
      insider.type.includes(queryLower)
    );

    return { code: 200, data: results };
  }

  @Get('transactions')
  async getInsiderTransactions(
    @Query('tokenAddress') tokenAddress?: string,
    @Query('address') address?: string,
    @Query('chainId') chainId: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    // Return sample data
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

    return { code: 200, data: sampleTransactions.slice(0, limit) };
  }

  @Post('track')
  async trackNewInsider(
    @Body() body: { address: string; label: string; type: string; chainId?: number },
  ) {
    const { address, label, type, chainId = 1 } = body;
    const chainKey = this.getChainKey(chainId);
    const insiders = this.knownInsiders.get(chainKey) || [];
    
    const newInsider: InsiderWallet = {
      address: address.toLowerCase(),
      label,
      type: type as InsiderWallet['type'],
      tokens: [],
      firstSeen: Date.now(),
      transactionCount: 0,
    };
    
    insiders.push(newInsider);
    this.knownInsiders.set(chainKey, insiders);

    return { code: 200, data: newInsider };
  }

  @Get('top-tokens')
  async getTopInsiderTokens(@Query('chainId') chainId: number = 1) {
    const topTokens = [
      { token: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', insiderCount: 15, riskLevel: 'high' },
      { token: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', insiderCount: 12, riskLevel: 'medium' },
      { token: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', insiderCount: 18, riskLevel: 'critical' },
    ];

    return { code: 200, data: topTokens };
  }

  @Get('health')
  health() {
    return { code: 200, data: { status: 'ok', service: 'TokenInsiderTracker' } };
  }

  private getChainKey(chainId: number): string {
    const names: Record<number, string> = { 1: 'eth', 56: 'bsc', 137: 'polygon', 42161: 'arbitrum', 10: 'optimism', 8453: 'base' };
    return names[chainId] || 'eth';
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
