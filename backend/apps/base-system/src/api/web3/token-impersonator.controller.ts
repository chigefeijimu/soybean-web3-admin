import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@ApiTags('Token Impersonator Scanner')
@Controller('web3/token-impersonator')
export class TokenImpersonatorController {
  constructor(private readonly httpService: HttpService) {}

  @Get('scan-token')
  @ApiOperation({ summary: 'Scan a token for impersonation risks' })
  @ApiQuery({ name: 'address', description: 'Token contract address' })
  @ApiQuery({ name: 'chain', description: 'Chain id (e.g., 1 for ETH)', required: false })
  async scanToken(
    @Query('address') address: string,
    @Query('chain') chain: string = '1',
  ) {
    try {
      // Get token info from multiple sources
      const [tokenInfo, holderInfo, dexScreener] = await Promise.all([
        this.getTokenInfo(address, chain),
        this.getHolderInfo(address, chain),
        this.getDexScreenerData(address, chain),
      ]);

      // Analyze impersonation risks
      const analysis = this.analyzeImpersonation(tokenInfo, holderInfo, dexScreener);

      return {
        success: true,
        token: tokenInfo,
        holderInfo,
        dexScreener,
        analysis,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('scan-wallet')
  @ApiOperation({ summary: 'Scan wallet for impersonator tokens' })
  @ApiQuery({ name: 'wallet', description: 'Wallet address to scan' })
  @ApiQuery({ name: 'chain', description: 'Chain id', required: false })
  async scanWallet(
    @Query('wallet') wallet: string,
    @Query('chain') chain: string = '1',
  ) {
    try {
      // Get wallet tokens
      const tokens = await this.getWalletTokens(wallet, chain);
      
      // Scan each token for impersonation risks
      const results = await Promise.all(
        tokens.map(async (token) => {
          try {
            const analysis = await this.quickScan(token.address, chain);
            return { token, analysis };
          } catch {
            return { token, analysis: null };
          }
        })
      );

      // Filter high risk tokens
      const highRiskTokens = results.filter(
        (r) => r.analysis && r.analysis.riskLevel === 'high'
      );

      return {
        success: true,
        totalTokens: tokens.length,
        scannedResults: results,
        highRiskTokens,
        summary: {
          safe: results.filter((r) => !r.analysis || r.analysis.riskLevel === 'low').length,
          warning: results.filter((r) => r.analysis?.riskLevel === 'medium').length,
          dangerous: highRiskTokens.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('check-similar')
  @ApiOperation({ summary: 'Check for similar token names on chain' })
  @ApiQuery({ name: 'name', description: 'Token name to check' })
  @ApiQuery({ name: 'chain', description: 'Chain id', required: false })
  async checkSimilar(
    @Query('name') name: string,
    @Query('chain') chain: string = '1',
  ) {
    try {
      // Search for tokens with similar names
      const similarTokens = await this.searchSimilarTokens(name, chain);
      
      return {
        success: true,
        query: name,
        results: similarTokens,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('popular-tokens')
  @ApiOperation({ summary: 'Get list of popular tokens to check against' })
  async getPopularTokens() {
    const popularTokens = [
      { name: 'Wrapped Bitcoin', symbol: 'WBTC', addresses: { '1': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' } },
      { name: 'USD Coin', symbol: 'USDC', addresses: { '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' } },
      { name: 'Tether USD', symbol: 'USDT', addresses: { '1': '0xdAC17F958D2ee523a2206206994597C13D831ec7' } },
      { name: 'Dai Stablecoin', symbol: 'DAI', addresses: { '1': '0x6B175474E89094C44Da98b954EescDE1995d8057' } },
      { name: 'Chainlink Token', symbol: 'LINK', addresses: { '1': '0x514910771AF9Ca656af840dff83E8264EcF986CA' } },
      { name: 'Uniswap', symbol: 'UNI', addresses: { '1': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' } },
      { name: 'Aave Token', symbol: 'AAVE', addresses: { '1': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' } },
      { name: 'Maker', symbol: 'MKR', addresses: { '1': '0x9f8F72aA9304c8B593d555F12eF6589cC3A76A6B' } },
      { name: 'Compound', symbol: 'COMP', addresses: { '1': '0xc00e94Cb662C3520282E6f5717214004A7f26888' } },
      { name: 'Curve DAO Token', symbol: 'CRV', addresses: { '1': '0xD533a949740bb3306d119CC777fa900bA034cd52' } },
      { name: 'SushiToken', symbol: 'SUSHI', addresses: { '1': '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2' } },
      { name: 'Synthetix Network Token', symbol: 'SNX', addresses: { '1': '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F' } },
    ];

    return {
      success: true,
      tokens: popularTokens,
    };
  }

  private async getTokenInfo(address: string, chain: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`,
          { timeout: 10000 }
        )
      );
      return response.data;
    } catch {
      // Fallback: return basic info
      return {
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        description: 'Token info not available',
      };
    }
  }

  private async getHolderInfo(address: string, chain: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.etherscan.io/api?module=token&action=tokenholderlist&contractaddress=${address}&page=1&offset=100`,
          { timeout: 10000 }
        )
      );
      return response.data;
    } catch {
      return { result: [] };
    }
  }

  private async getDexScreenerData(address: string, chain: string) {
    try {
      const pairAddress = await this.getPairAddress(address, chain);
      if (!pairAddress) return null;
      
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`,
          { timeout: 10000 }
        )
      );
      return response.data;
    } catch {
      return null;
    }
  }

  private async getPairAddress(tokenAddress: string, chain: string): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
          { timeout: 10000 }
        )
      );
      if (response.data?.pairs?.[0]?.pairAddress) {
        return response.data.pairs[0].pairAddress;
      }
    } catch {}
    return null;
  }

  private async searchSimilarTokens(name: string, chain: string) {
    // Search on DexScreener
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(name)}`,
          { timeout: 10000 }
        )
      );
      return response.data.pairs || [];
    } catch {
      return [];
    }
  }

  private async quickScan(address: string, chain: string) {
    try {
      const [dexData, holderInfo] = await Promise.all([
        this.getDexScreenerData(address, chain),
        this.getHolderInfo(address, chain),
      ]);

      return this.analyzeImpersonation(null, holderInfo, dexData);
    } catch {
      return null;
    }
  }

  private async getWalletTokens(wallet: string, chain: string) {
    try {
      const chainName = this.getChainName(chain);
      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.coingecko.com/api/v3/address/${wallet}?chains=${chainName}`,
          { timeout: 10000 }
        )
      );
      return response.data.tokens || [];
    } catch {
      return [];
    }
  }

  private getChainName(chainId: string): string {
    const chainMap: Record<string, string> = {
      '1': 'ethereum',
      '56': 'binance-smart-chain',
      '137': 'polygon-pos',
      '42161': 'arbitrum-one',
      '10': 'optimism',
    };
    return chainMap[chainId] || 'ethereum';
  }

  private analyzeImpersonation(tokenInfo: any, holderInfo: any, dexData: any) {
    const risks: string[] = [];
    let riskScore = 0;
    let riskLevel = 'low';

    // Check 1: Token name similarity to popular tokens
    const popularNames = ['bitcoin', 'ethereum', 'tether', 'usdc', 'dai', 'link', 'uniswap', 'aave', 'maker', 'compound'];
    const tokenName = tokenInfo?.name?.toLowerCase() || '';
    const tokenSymbol = tokenInfo?.symbol?.toLowerCase() || '';
    
    for (const popular of popularNames) {
      if ((tokenName.includes(popular) || tokenSymbol.includes(popular)) && 
          tokenName !== popular && tokenSymbol !== popular) {
        risks.push(`Impersonates popular token: ${popular}`);
        riskScore += 30;
        break;
      }
    }

    // Check 2: Holder distribution
    const holders = holderInfo?.result || [];
    if (holders.length > 0) {
      // Check if top holder has too much supply
      const topHolderPercent = parseFloat(holders[0]?.tokenHolderPercentage || '0');
      if (topHolderPercent > 50) {
        risks.push(`Concentrated holdings: Top holder owns ${topHolderPercent.toFixed(1)}%`);
        riskScore += 25;
      } else if (topHolderPercent > 80) {
        risks.push(`Severe concentration: Top holder owns ${topHolderPercent.toFixed(1)}%`);
        riskScore += 40;
      }

      // Check for suspicious holder pattern (many small holders)
      if (holders.length < 10 && topHolderPercent > 90) {
        risks.push('Suspicious holder pattern: few holders with extreme concentration');
        riskScore += 35;
      }
    }

    // Check 3: Liquidity and trading
    if (dexData?.pair) {
      const liquidity = dexData.pair.liquidity?.usd || 0;
      if (liquidity < 1000) {
        risks.push(`Very low liquidity: $${liquidity.toLocaleString()}`);
        riskScore += 20;
      } else if (liquidity < 10000) {
        risks.push(`Low liquidity: $${liquidity.toLocaleString()}`);
        riskScore += 10;
      }

      // Check for fake volume
      const volume24h = dexData.pair.volume?.h24 || 0;
      if (liquidity > 0 && volume24h / liquidity > 100) {
        risks.push('Suspicious volume to liquidity ratio (possible wash trading)');
        riskScore += 25;
      }

      // Check buy/sell ratio
      const buys = dexData.pair.txns?.h24?.buys || 0;
      const sells = dexData.pair.txns?.h24?.sells || 0;
      if (sells > 0 && buys / sells < 0.2) {
        risks.push('Very high sell pressure (buys/sells < 0.2)');
        riskScore += 20;
      }
    }

    // Check 4: Newly created token
    if (dexData?.pair?.pairCreatedAt) {
      const createdAt = dexData.pair.pairCreatedAt;
      const ageInDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
      if (ageInDays < 1) {
        risks.push(`Very new token: created ${ageInDays.toFixed(1)} days ago`);
        riskScore += 15;
      } else if (ageInDays < 7) {
        risks.push(`New token: created ${ageInDays.toFixed(1)} days ago`);
        riskScore += 5;
      }
    }

    // Determine risk level
    if (riskScore >= 60) {
      riskLevel = 'high';
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
    }

    return {
      riskScore,
      riskLevel,
      risks,
      recommendations: this.getRecommendations(risks, riskLevel),
    };
  }

  private getRecommendations(risks: string[], riskLevel: string) {
    const recommendations: string[] = [];

    if (riskLevel === 'high') {
      recommendations.push('⚠️ Do NOT interact with this token - high scam risk');
      recommendations.push('If you hold this token, consider selling carefully');
    } else if (riskLevel === 'medium') {
      recommendations.push('⚠️ Exercise caution before interacting');
      recommendations.push('Do thorough research before buying');
    } else {
      recommendations.push('✅ Token appears relatively safe');
      recommendations.push('Still do your own research');
    }

    if (risks.some(r => r.includes('liquidity'))) {
      recommendations.push('Low liquidity means you may not be able to sell');
    }

    if (risks.some(r => r.includes('concentration'))) {
      recommendations.push('High holder concentration can lead to sudden dumps');
    }

    return recommendations;
  }
}
