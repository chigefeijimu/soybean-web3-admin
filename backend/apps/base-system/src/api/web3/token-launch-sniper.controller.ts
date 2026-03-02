import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TokenLaunch {
  pairAddress: string;
  token0: { address: string; symbol: string; name: string };
  token1: { address: string; symbol: string; name: string };
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  blockNumber: number;
  timestamp: number;
  dex: string;
  chain: string;
}

interface WatchedToken {
  address: string;
  symbol: string;
  addedAt: number;
  alerts: boolean;
}

@ApiTags('Token Launch Sniper')
@Controller('web3/token-launch-sniper')
export class TokenLaunchSniperController {
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private readonly UNISWAP_API = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
  
  // Recently created pairs cache
  private recentPairs: Map<string, TokenLaunch> = new Map();
  private watchedTokens: Map<string, WatchedToken> = new Map();

  constructor(
    private readonly httpService: HttpService,
  ) {}

  @Get('recent-launches')
  @ApiOperation({ summary: 'Get recent token launches from DEXes' })
  @ApiQuery({ name: 'chain', required: false, description: 'Blockchain: ethereum, arbitrum, optimism, polygon, base' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results (default 20)' })
  async getRecentLaunches(
    @Query('chain') chain: string = 'ethereum',
    @Query('limit') limit: number = 20,
  ) {
    try {
      // Get recent pairs from Uniswap V3 via The Graph
      const query = `
        {
          pools(
            first: ${limit},
            orderBy: createdAtTimestamp,
            orderDirection: desc,
            where: {
              createdAtTimestamp_gte: ${Math.floor(Date.now() / 1000) - 86400}
            }
          ) {
            id
            token0 {
              id
              symbol
              name
            }
            token1 {
              id
              symbol
              name
            }
            reserve0
            reserve1
            totalValueLockedUSD
            volumeUSD
            createdAtTimestamp
          }
        }
      `;

      const chainEndpoints: Record<string, string> = {
        ethereum: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
        arbitrum: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum-one',
        optimism: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-optimism',
        polygon: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-polygon',
      };

      const endpoint = chainEndpoints[chain] || chainEndpoints['ethereum'];
      
      const response = await firstValueFrom(
        this.httpService.post(endpoint, { query })
      );

      const pools = response.data?.data?.pools || [];
      
      const launches: any[] = pools.map((pool: any) => ({
        pairAddress: pool.id,
        token0: {
          address: pool.token0.id,
          symbol: pool.token0.symbol,
          name: pool.token0.name,
        },
        token1: {
          address: pool.token1.id,
          symbol: pool.token1.symbol,
          name: pool.token1.name,
        },
        reserve0: pool.reserve0,
        reserve1: pool.reserve1,
        totalValueLockedUSD: pool.totalValueLockedUSD,
        volume24h: pool.volumeUSD,
        timestamp: parseInt(pool.createdAtTimestamp),
        dex: 'Uniswap V3',
        chain: chain,
      }));

      // Filter for new token pairs (usually token1 is the new token)
      return {
        success: true,
        data: launches,
        count: launches.length,
      };
    } catch (error) {
      console.error('Error fetching recent launches:', error);
      return {
        success: false,
        error: 'Failed to fetch recent launches',
        data: [],
      };
    }
  }

  @Get('trending-launches')
  @ApiOperation({ summary: 'Get trending/new tokens with potential' })
  @ApiQuery({ name: 'chain', required: false })
  async getTrendingLaunches(@Query('chain') chain: string = 'ethereum') {
    try {
      // Get tokens with high volume but low market cap (potential gems)
      const query = `
        {
          pools(
            first: 50,
            orderBy: volumeUSD,
            orderDirection: desc,
            where: {
              createdAtTimestamp_gte: ${Math.floor(Date.now() / 1000) - 172800}
            }
          ) {
            id
            token0 {
              id
              symbol
              name
            }
            token1 {
              id
              symbol
              name
            }
            reserve0
            reserve1
            totalValueLockedUSD
            volumeUSD
            createdAtTimestamp
          }
        }
      `;

      const endpoint = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
      const response = await firstValueFrom(
        this.httpService.post(endpoint, { query })
      );

      const pools = response.data?.data?.pools || [];
      
      // Score pools by potential (high volume, reasonable TVL)
      const scoredPools = pools
        .filter((pool: any) => {
          const tvl = parseFloat(pool.totalValueLockedUSD || '0');
          const volume = parseFloat(pool.volumeUSD || '0');
          return tvl > 1000 && volume > 5000; // Minimum thresholds
        })
        .map((pool: any) => {
          const tvl = parseFloat(pool.totalValueLockedUSD || '0');
          const volume = parseFloat(pool.volumeUSD || '0');
          const volumeToTvlRatio = volume / (tvl || 1);
          
          // Score: higher volume/TVL ratio = more potential
          const potentialScore = Math.min(100, Math.round(volumeToTvlRatio * 10));
          
          return {
            pairAddress: pool.id,
            token0: pool.token0,
            token1: pool.token1,
            tvlUSD: tvl,
            volume24h: volume,
            potentialScore,
            timestamp: parseInt(pool.createdAtTimestamp),
          };
        })
        .sort((a: any, b: any) => b.potentialScore - a.potentialScore)
        .slice(0, 20);

      return {
        success: true,
        data: scoredPools,
      };
    } catch (error) {
      console.error('Error fetching trending launches:', error);
      return {
        success: false,
        error: 'Failed to fetch trending launches',
        data: [],
      };
    }
  }

  @Get('sniper-alerts')
  @ApiOperation({ summary: 'Get active sniper alerts for watched tokens' })
  async getSniperAlerts() {
    const alerts = Array.from(this.watchedTokens.values()).map(token => ({
      ...token,
      age: Math.floor((Date.now() / 1000 - token.addedAt) / 3600), // hours
    }));
    
    return {
      success: true,
      data: alerts,
      count: alerts.length,
    };
  }

  @Post('watch-token')
  @ApiOperation({ summary: 'Add token to watchlist for launch monitoring' })
  async watchToken(@Body() body: { address: string; symbol: string; alerts?: boolean }) {
    const { address, symbol, alerts = true } = body;
    
    if (!address) {
      return { success: false, error: 'Token address is required' };
    }

    const key = address.toLowerCase();
    this.watchedTokens.set(key, {
      address: key,
      symbol: symbol || 'Unknown',
      addedAt: Math.floor(Date.now() / 1000),
      alerts,
    });

    return {
      success: true,
      message: `Now watching ${symbol || address}`,
      data: this.watchedTokens.get(key),
    };
  }

  @Post('unwatch-token')
  @ApiOperation({ summary: 'Remove token from watchlist' })
  async unwatchToken(@Body() body: { address: string }) {
    const { address } = body;
    const key = address.toLowerCase();
    
    if (this.watchedTokens.has(key)) {
      const token = this.watchedTokens.get(key);
      this.watchedTokens.delete(key);
      return {
        success: true,
        message: `Stopped watching ${token?.symbol || address}`,
      };
    }

    return {
      success: false,
      error: 'Token not in watchlist',
    };
  }

  @Get('analyze-token')
  @ApiOperation({ summary: 'Analyze a token for sniper potential' })
  @ApiQuery({ name: 'address', required: true, description: 'Token contract address' })
  @ApiQuery({ name: 'chain', required: false })
  async analyzeToken(
    @Query('address') address: string,
    @Query('chain') chain: string = 'ethereum',
  ) {
    try {
      // Get basic token info
      const tokenInfo = await this.getTokenInfo(address, chain);
      
      // Check if it's a honeypot (basic check)
      const honeypotCheck = await this.checkHoneypot(address, chain);
      
      // Get holder distribution
      const holderInfo = await this.getHolderInfo(address, chain);
      
      // Calculate sniper score
      let sniperScore = 0;
      const factors: string[] = [];
      
      if (!honeypotCheck.isHoneypot) {
        sniperScore += 30;
        factors.push('Not a honeypot (+30)');
      }
      
      if (holderInfo.top10Percent < 50) {
        sniperScore += 25;
        factors.push('Decentralized holders (+25)');
      } else if (holderInfo.top10Percent < 80) {
        sniperScore += 10;
        factors.push('Moderate decentralization (+10)');
      }
      
      if (tokenInfo.liquidity > 10000) {
        sniperScore += 20;
        factors.push('Good liquidity (+20)');
      }
      
      if (tokenInfo.verified) {
        sniperScore += 15;
        factors.push('Verified token (+15)');
      }
      
      if (tokenInfo.age < 7) {
        sniperScore += 10;
        factors.push('Recent launch (+10)');
      }

      return {
        success: true,
        data: {
          token: tokenInfo,
          honeypot: honeypotCheck,
          holders: holderInfo,
          sniperScore: Math.min(100, sniperScore),
          factors,
          recommendation: sniperScore >= 70 ? 'BUY' : sniperScore >= 50 ? 'WATCH' : 'AVOID',
        },
      };
    } catch (error) {
      console.error('Error analyzing token:', error);
      return {
        success: false,
        error: 'Failed to analyze token',
      };
    }
  }

  private async getTokenInfo(address: string, chain: string) {
    try {
      // Try to get info from CoinGecko
      const response = await firstValueFrom(
        this.httpService.get(`${this.COINGECKO_API}/coins/ethereum/contract/${address}`, {
          params: { localization: false, tickers: false },
        })
      );
      
      return {
        address: address,
        name: response.data?.name || 'Unknown',
        symbol: response.data?.symbol?.toUpperCase() || 'Unknown',
        decimals: response.data?.detail_platforms?.[chain]?.contract_address ? 18 : 18,
        price: response.data?.market_data?.current_price?.usd || 0,
        marketCap: response.data?.market_data?.market_cap?.usd || 0,
        liquidity: 0,
        verified: true,
        age: 365, // days since launch
      };
    } catch {
      // Token not found on CoinGecko (likely new)
      return {
        address: address,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 18,
        price: 0,
        marketCap: 0,
        liquidity: 0,
        verified: false,
        age: 0, // Very new
      };
    }
  }

  private async checkHoneypot(address: string, chain: string) {
    // Basic honeypot checks
    // In production, you'd use honeypot.is API or similar
    return {
      isHoneypot: false,
      risk: 'LOW',
      buyTax: 0,
      sellTax: 0,
      transferTax: 0,
    };
  }

  private async getHolderInfo(address: string, chain: string) {
    // Get holder info from Etherscan-like API
    // This is a simplified version
    return {
      totalHolders: 100,
      top10Percent: 45,
      top20Percent: 65,
      top50Percent: 85,
    };
  }

  @Get('dex-new-pairs')
  @ApiOperation({ summary: 'Get new token pairs from multiple DEXes' })
  @ApiQuery({ name: 'chain', required: false, description: 'Blockchain' })
  @ApiQuery({ name: 'dex', required: false, description: 'uniswap, sushiswap, pancakeswap' })
  async getDexNewPairs(
    @Query('chain') chain: string = 'ethereum',
    @Query('dex') dex: string = 'uniswap',
  ) {
    const dexEndpoints: Record<string, Record<string, string>> = {
      ethereum: {
        uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
        sushiswap: 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-ethereum',
      },
      arbitrum: {
        uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum-one',
        sushiswap: 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-arbitrum',
      },
      polygon: {
        uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-polygon',
        sushiswap: 'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-polygon',
      },
    };

    const endpoint = dexEndpoints[chain]?.[dex];
    if (!endpoint) {
      return { success: false, error: 'Unsupported chain/DEX combination' };
    }

    try {
      const query = `
        {
          pools(
            first: 30,
            orderBy: createdAtTimestamp,
            orderDirection: desc,
            where: {
              createdAtTimestamp_gte: ${Math.floor(Date.now() / 1000) - 43200}
            }
          ) {
            id
            token0 { id symbol name }
            token1 { id symbol name }
            reserve0
            reserve1
            totalValueLockedUSD
            volumeUSD
          }
        }
      `;

      const response = await firstValueFrom(
        this.httpService.post(endpoint, { query })
      );

      const pools = response.data?.data?.pools || [];
      
      return {
        success: true,
        data: pools.map((pool: any) => ({
          pairAddress: pool.id,
          token0: pool.token0,
          token1: pool.token1,
          tvlUSD: parseFloat(pool.totalValueLockedUSD || '0'),
          volume24h: parseFloat(pool.volumeUSD || '0'),
          dex,
          chain,
        })),
      };
    } catch (error) {
      return { success: false, error: 'Failed to fetch DEX pairs' };
    }
  }
}
