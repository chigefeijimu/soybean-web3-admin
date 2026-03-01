import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

class CrossChainAssetDto {
  @ApiProperty({ description: 'Wallet address to query' })
  address: string;

  @ApiProperty({ description: 'Comma-separated chain IDs (e.g., "1,137,56")', required: false })
  chains?: string;
}

interface ChainAsset {
  chainId: number;
  chainName: string;
  symbol: string;
  balance: string;
  balanceUsd: number;
  tokens: TokenAsset[];
}

interface TokenAsset {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  balanceUsd: number;
  logo?: string;
}

interface CrossChainResponse {
  address: string;
  totalUsd: number;
  chains: ChainAsset[];
}

@ApiTags('Web3 - Cross-Chain Asset')
@Controller('web3/cross-chain')
export class Web3CrossChainController {
  private readonly ethereumRpc: Record<number, string> = {
    1: process.env.ETH_RPC_URL || 'https://eth.llamarpc.com',
    5: 'https://goerli.infura.io/v3/demo',
    11155111: 'https://sepolia.infura.io/v3/demo',
    137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    80001: 'https://rpc-mumbai.maticvigil.com',
    56: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    97: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    8453: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  };

  private readonly chainInfo: Record<number, { name: string; symbol: string; coingeckoId: string }> = {
    1: { name: 'Ethereum', symbol: 'ETH', coingeckoId: 'ethereum' },
    5: { name: 'Goerli', symbol: 'ETH', coingeckoId: 'ethereum' },
    11155111: { name: 'Sepolia', symbol: 'ETH', coingeckoId: 'ethereum' },
    137: { name: 'Polygon', symbol: 'MATIC', coingeckoId: 'matic-network' },
    80001: { name: 'Mumbai', symbol: 'MATIC', coingeckoId: 'matic-network' },
    56: { name: 'BNB Chain', symbol: 'BNB', coingeckoId: 'binancecoin' },
    97: { name: 'BSC Testnet', symbol: 'BNB', coingeckoId: 'binancecoin' },
    10: { name: 'Optimism', symbol: 'ETH', coingeckoId: 'ethereum' },
    42161: { name: 'Arbitrum', symbol: 'ETH', coingeckoId: 'ethereum' },
    8453: { name: 'Base', symbol: 'ETH', coingeckoId: 'ethereum' },
  };

  private readonly tokenAddresses: Record<number, { [symbol: string]: string }> = {
    1: {
      USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      WBTC: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    },
    137: {
      USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      DAI: '0x53e0bca35ec6bd2726fb5f5a7b1d5b4e0c9b6e6',
      WBTC: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    },
    56: {
      USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      USDT: '0x55d398326f99059ff775485246999027b3197955',
      BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      WBNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    },
    10: {
      USDC: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
      USDT: '0x94b008aa00579c1307b0ef2c3ad679f5f4f7ab4',
      DAI: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    },
    42161: {
      USDC: '0xaf88d065e77c8cc2239327c5edb3a43126823973',
      USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      DAI: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    },
    8453: {
      USDC: '0x833589fcd6edb6e21f2d6c597ffb0f8311fa2c4',
      USDT: '0x4200000000000000000000000000000000000006',
    },
  };

  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(private readonly httpService: HttpService) {}

  @Post('assets')
  @ApiOperation({ description: 'Get cross-chain assets for a wallet address' })
  async getCrossChainAssets(@Body() dto: CrossChainAssetDto): Promise<CrossChainResponse> {
    const { address, chains } = dto;
    
    // Default chains if not specified
    const chainIds = chains 
      ? chains.split(',').map(c => parseInt(c.trim(), 10))
      : [1, 137, 56, 10, 42161, 8453]; // Main chains

    const chainAssets: ChainAsset[] = [];
    let totalUsd = 0;

    // Fetch assets for each chain in parallel
    const results = await Promise.allSettled(
      chainIds.map(chainId => this.getChainAssets(address, chainId))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value) {
        chainAssets.push(result.value);
        totalUsd += result.value.balanceUsd;
      }
    }

    // Sort by USD value descending
    chainAssets.sort((a, b) => b.balanceUsd - a.balanceUsd);

    return {
      address,
      totalUsd,
      chains: chainAssets,
    };
  }

  @Get('balance/:address')
  @ApiOperation({ description: 'Get native balance for multiple chains' })
  @ApiQuery({ name: 'chains', required: false, description: 'Comma-separated chain IDs' })
  async getMultiChainBalance(
    @Param('address') address: string,
    @Query('chains') chains?: string,
  ): Promise<{ address: string; balances: { chainId: number; chainName: string; symbol: string; balance: string }[] }> {
    const chainIds = chains
      ? chains.split(',').map(c => parseInt(c.trim(), 10))
      : [1, 137, 56, 10, 42161, 8453];

    const results = await Promise.allSettled(
      chainIds.map(async chainId => {
        const rpcUrl = this.ethereumRpc[chainId];
        if (!rpcUrl) return null;

        try {
          const response = await firstValueFrom(
            this.httpService.post(rpcUrl, {
              jsonrpc: '2.0',
              method: 'eth_getBalance',
              params: [address, 'latest'],
              id: 1,
            })
          );
          
          const balance = response.data.result;
          const ethBalance = parseInt(balance, 16) / 1e18;
          
          return {
            chainId,
            chainName: this.chainInfo[chainId]?.name || `Chain ${chainId}`,
            symbol: this.chainInfo[chainId]?.symbol || 'N/A',
            balance: ethBalance.toFixed(6),
          };
        } catch {
          return null;
        }
      })
    );

    const balances = results
      .filter((r): r is PromiseFulfilledResult<{ chainId: number; chainName: string; symbol: string; balance: string }> => 
        r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    return { address, balances };
  }

  @Get('prices')
  @ApiOperation({ description: 'Get token prices for multiple chains' })
  @ApiQuery({ name: 'ids', required: true, description: 'Comma-separated CoinGecko IDs' })
  async getTokenPrices(@Query('ids') ids: string): Promise<Record<string, number>> {
    const coinIds = ids.split(',');
    const now = Date.now();
    const prices: Record<string, number> = {};

    // Check cache first
    const uncachedIds: string[] = [];
    for (const id of coinIds) {
      const cached = this.priceCache.get(id);
      if (cached && now - cached.timestamp < this.CACHE_TTL) {
        prices[id] = cached.price;
      } else {
        uncachedIds.push(id);
      }
    }

    if (uncachedIds.length > 0) {
      try {
        const response = await firstValueFrom(
          this.httpService.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
              ids: uncachedIds.join(','),
              vs_currencies: 'usd',
            },
          })
        );

        for (const [id, data] of Object.entries(response.data)) {
          const price = (data as { usd: number }).usd;
          prices[id] = price;
          this.priceCache.set(id, { price, timestamp: now });
        }
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      }
    }

    return prices;
  }

  private async getChainAssets(address: string, chainId: number): Promise<ChainAsset | null> {
    const rpcUrl = this.ethereumRpc[chainId];
    if (!rpcUrl) return null;

    const chainMeta = this.chainInfo[chainId];
    if (!chainMeta) return null;

    try {
      // Get native balance
      const balanceResponse = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        })
      );

      const nativeBalance = parseInt(balanceResponse.data.result, 16) / 1e18;
      const nativePrice = await this.getTokenPrice(chainMeta.coingeckoId);
      const nativeBalanceUsd = nativeBalance * nativePrice;

      // Get token balances
      const tokens = await this.getTokenBalances(address, chainId, rpcUrl);

      const totalUsd = nativeBalanceUsd + tokens.reduce((sum, t) => sum + t.balanceUsd, 0);

      return {
        chainId,
        chainName: chainMeta.name,
        symbol: chainMeta.symbol,
        balance: nativeBalance.toFixed(6),
        balanceUsd: totalUsd,
        tokens,
      };
    } catch (error) {
      console.error(`Failed to fetch assets for chain ${chainId}:`, error);
      return null;
    }
  }

  private async getTokenBalances(
    address: string,
    chainId: number,
    rpcUrl: string,
  ): Promise<TokenAsset[]> {
    const tokenList = this.tokenAddresses[chainId];
    if (!tokenList) return [];

    const tokens: TokenAsset[] = [];
    const chainMeta = this.chainInfo[chainId];

    // ERC20 balanceOf batch
    const calls = Object.entries(tokenList).map(([symbol, tokenAddress]) => ({
      to: tokenAddress,
      data: `0x70a08231000000000000000000000000${address.slice(2).toLowerCase()}`,
    }));

    try {
      const response = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: tokenList.USDC, // Use USDC as fallback for multicall simulation
              data: '0x', // Just to get a response
            },
            'latest',
          ],
          id: 1,
        })
      );

      // Fallback: query each token individually
      const results = await Promise.allSettled(
        Object.entries(tokenList).map(async ([symbol, tokenAddress]) => {
          try {
            const resp = await firstValueFrom(
              this.httpService.post(rpcUrl, {
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [
                  {
                    to: tokenAddress,
                    data: `0x70a08231000000000000000000000000${address.slice(2).toLowerCase()}`,
                  },
                  'latest',
                ],
                id: 1,
              })
            );

            const balance = resp.data.result;
            if (balance && balance !== '0x') {
              const rawBalance = parseInt(balance, 16);
              // Assume 6 decimals for most stablecoins
              const decimals = symbol === 'WBTC' || symbol === 'WBNB' ? 18 : 6;
              const adjustedBalance = rawBalance / Math.pow(10, decimals);

              // Get token price (simplified - use a mapping)
              const tokenCoingeckoId = this.getTokenCoingeckoId(chainId, symbol);
              const price = tokenCoingeckoId ? await this.getTokenPrice(tokenCoingeckoId) : 0;

              return {
                address: tokenAddress,
                symbol,
                name: symbol,
                balance: adjustedBalance.toFixed(4),
                balanceUsd: adjustedBalance * price,
              };
            }
          } catch {
            // Skip failed tokens
          }
          return null;
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          tokens.push(result.value);
        }
      }
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
    }

    return tokens;
  }

  private getTokenCoingeckoId(chainId: number, symbol: string): string | null {
    const mapping: Record<number, Record<string, string>> = {
      1: { USDC: 'usd-coin', USDT: 'tether', DAI: 'dai', WBTC: 'wrapped-bitcoin' },
      137: { USDC: 'usd-coin', USDT: 'tether', DAI: 'dai', WBTC: 'wrapped-bitcoin' },
      56: { USDC: 'usd-coin', USDT: 'tether', BUSD: 'binance-usd', WBNB: 'wbnb' },
      10: { USDC: 'usd-coin', USDT: 'tether', DAI: 'dai' },
      42161: { USDC: 'usd-coin', USDT: 'tether', DAI: 'dai' },
      8453: { USDC: 'usd-coin', USDT: 'tether' },
    };
    return mapping[chainId]?.[symbol] || null;
  }

  private async getTokenPrice(coingeckoId: string): Promise<number> {
    const cached = this.priceCache.get(coingeckoId);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.price;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.coingecko.com/api/v3/simple/price', {
          params: {
            ids: coingeckoId,
            vs_currencies: 'usd',
          },
        })
      );

      const price = (response.data[coingeckoId] as { usd: number })?.usd || 0;
      this.priceCache.set(coingeckoId, { price, timestamp: now });
      return price;
    } catch {
      return 0;
    }
  }
}
