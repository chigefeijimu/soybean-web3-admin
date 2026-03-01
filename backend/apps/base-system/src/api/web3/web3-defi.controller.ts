import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@ApiTags('DeFi Protocol Explorer')
@Controller('api/web3/defi')
export class Web3DefiController {
  constructor(private readonly httpService: HttpService) {}

  @Get('protocols')
  @ApiOperation({ summary: 'Get supported DeFi protocols' })
  async getProtocols() {
    const protocols = [
      {
        id: 'uniswap',
        name: 'Uniswap',
        logo: '🦄',
        description: 'Decentralized trading protocol',
        supportedActions: ['getPositions', 'addLiquidity', 'removeLiquidity', 'swap'],
        chains: [1, 137, 42161, 8453],
        contractAddress: '0x1f98431c8aD98523631AE4a59f267346ea31F984',
      },
      {
        id: 'aave',
        name: 'Aave',
        logo: '👻',
        description: 'Non-custodial liquidity protocol',
        supportedActions: ['getSupply', 'getBorrow', 'supply', 'borrow', 'repay', 'withdraw'],
        chains: [1, 137, 42161],
        contractAddress: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
      },
      {
        id: 'compound',
        name: 'Compound',
        logo: '🔷',
        description: 'Algorithmic money market protocol',
        supportedActions: ['getSupply', 'getBorrow', 'supply', 'borrow', 'repay'],
        chains: [1, 137],
        contractAddress: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
      },
      {
        id: 'curve',
        name: 'Curve',
        logo: '💚',
        description: 'Stablecoin AMM',
        supportedActions: ['getPools', 'swap', 'addLiquidity', 'removeLiquidity'],
        chains: [1, 137, 42161],
        contractAddress: '0x99Ca51a3534265E703F66fE686F3d27dDeEb7AE',
      },
      {
        id: 'sushiswap',
        name: 'SushiSwap',
        logo: '🍣',
        description: 'Decentralized exchange',
        supportedActions: ['getPositions', 'addLiquidity', 'removeLiquidity', 'swap'],
        chains: [1, 137, 42161, 8453],
        contractAddress: '0xbACEB8eC6b9351D25076e4003C4aa6b5FcA15ea2',
      },
    ];
    return { data: protocols };
  }

  @Get('uniswap/positions/:address')
  @ApiOperation({ summary: 'Get Uniswap V3 positions for an address' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  async getUniswapPositions(
    @Param('address') address: string,
    @Query('chainId') chainId: number = 1,
  ) {
    try {
      // Using Uniswap subgraph API
      const subgraphUrl = this.getSubgraphUrl(chainId, 'uniswap');
      const query = `
        query GetPositions($owner: Bytes!, $pool: Bytes) {
          positions(where: { owner: $owner }) {
            id
            token0 {
              symbol
              id
            }
            token1 {
              symbol
              id
            }
            fee
            liquidity
            tickLower {
              tickIdx
            }
            tickUpper {
              tickIdx
            }
          }
        }
      `;
      
      const response = await firstValueFrom(
        this.httpService.post(subgraphUrl, {
          query,
          variables: { owner: address.toLowerCase() },
        }),
      );
      
      return { data: response.data?.data?.positions || [] };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  @Get('aave/supply/:address')
  @ApiOperation({ summary: 'Get Aave supply positions' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  async getAaveSupply(
    @Param('address') address: string,
    @Query('chainId') chainId: number = 1,
  ) {
    try {
      // Using Aave subgraph
      const subgraphUrl = this.getSubgraphUrl(chainId, 'aave');
      const query = `
        query GetReserves($user: Bytes!) {
          reserves(where: { userReserve_: { user: $user } }) {
            reserve {
              symbol
              name
              decimals
              underlyingAsset
            }
            currentATokenBalance
            currentStableDebt
            currentVariableDebt
            stableBorrowRate
            variableBorrowRate
          }
        }
      `;
      
      const response = await firstValueFrom(
        this.httpService.post(subgraphUrl, {
          query,
          variables: { user: address.toLowerCase() },
        }),
      );
      
      return { data: response.data?.data?.reserves || [] };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  @Get('curve/pools')
  @ApiOperation({ summary: 'Get Curve stable pools' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  async getCurvePools(@Query('chainId') chainId: number = 1) {
    try {
      // Common Curve pools
      const pools = [
        {
          name: '3Pool',
          address: '0xbEbc44782C7dB0a536A8D9F61e2aFC0cE7df89Ce',
          tokens: ['DAI', 'USDC', 'USDT'],
          tvl: '$450M',
          apr: '4.5%',
        },
        {
          name: 'ETH/stETH',
          address: '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022',
          tokens: ['ETH', 'stETH'],
          tvl: '$320M',
          apr: '5.2%',
        },
        {
          name: 'MIM/3Pool',
          address: '0x5a6A4D5442561937337b44881d232d8aCD4EE1cd',
          tokens: ['MIM', 'DAI', 'USDC', 'USDT'],
          tvl: '$180M',
          apr: '8.5%',
        },
        {
          name: 'FRAX/3Pool',
          address: '0xDEC02c8c3B9f8d1B7E1a6A93c6E1D73d71f43034',
          tokens: ['FRAX', 'DAI', 'USDC', 'USDT'],
          tvl: '$150M',
          apr: '6.8%',
        },
      ];
      
      return { data: pools };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  @Get('compound/positions/:address')
  @ApiOperation({ summary: 'Get Compound positions' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  async getCompoundPositions(
    @Param('address') address: string,
    @Query('chainId') chainId: number = 1,
  ) {
    try {
      // Using Compound subgraph
      const subgraphUrl = this.getSubgraphUrl(chainId, 'compound');
      const query = `
        query GetAccount($id: ID!) {
          account(id: $id) {
            tokens {
              symbol
              borrowBalance
              supplyBalance
              market {
                symbol
                exchangeRate
                supplyRate
                borrowRate
              }
            }
          }
        }
      `;
      
      const response = await firstValueFrom(
        this.httpService.post(subgraphUrl, {
          query,
          variables: { id: address.toLowerCase() },
        }),
      );
      
      return { data: response.data?.data?.account?.tokens || [] };
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  @Get('apr/:protocol')
  @ApiOperation({ summary: 'Get current APR for protocol' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  async getProtocolApr(
    @Param('protocol') protocol: string,
    @Query('chainId') chainId: number = 1,
  ) {
    const aprData: Record<string, any> = {
      uniswap: {
        'ETH/USDC': '3.2%',
        'ETH/USDT': '2.8%',
        'USDC/USDT': '0.5%',
      },
      aave: {
        ETH: '2.5%',
        USDC: '4.8%',
        USDT: '4.2%',
        DAI: '4.5%',
      },
      compound: {
        ETH: '1.8%',
        USDC: '3.2%',
        USDT: '3.0%',
      },
      curve: {
        '3Pool': '4.5%',
        'ETH/stETH': '5.2%',
      },
    };
    
    return { data: aprData[protocol] || {} };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get DeFi overall stats' })
  async getDefiStats() {
    return {
      data: {
        totalTvl: '$142.5B',
        topProtocols: [
          { name: 'Lido', tvl: '$35.2B', logo: '🌊' },
          { name: 'Aave', tvl: '$28.1B', logo: '👻' },
          { name: 'Uniswap', tvl: '$22.3B', logo: '🦄' },
          { name: 'MakerDAO', tvl: '$18.5B', logo: '🎩' },
          { name: 'Compound', tvl: '$12.8B', logo: '🔷' },
        ],
        recentActivity: [
          { type: 'Supply', protocol: 'Aave', asset: 'USDC', amount: '$1.2M', time: '2m ago' },
          { type: 'Swap', protocol: 'Uniswap', asset: 'ETH→USDC', amount: '$850K', time: '5m ago' },
          { type: 'Borrow', protocol: 'Compound', asset: 'ETH', amount: '$2.1M', time: '8m ago' },
        ],
      },
    };
  }

  private getSubgraphUrl(chainId: number, protocol: string): string {
    const subgraphUrls: Record<number, Record<string, string>> = {
      1: {
        uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
        aave: 'https://api.thegraph.com/subgraphs/name/aave/aave-v3',
        compound: 'https://api.thegraph.com/subgraphs/name/compound-finance/compound-v3',
      },
      137: {
        uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-polygon',
        aave: 'https://api.thegraph.com/subgraphs/name/aave/aave-v3-polygon',
      },
      42161: {
        uniswap: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum-one',
        aave: 'https://api.thegraph.com/subgraphs/name/aave/aave-v3-arbitrum',
      },
    };
    
    return subgraphUrls[chainId]?.[protocol] || subgraphUrls[1]?.[protocol] || '';
  }
}
