import { Injectable } from '@nestjs/common';

interface PoolPosition {
  id: string;
  token0: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  token1: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  fee: number;
  liquidity: string;
  tickLower: number;
  tickUpper: number;
  depositedToken0: string;
  depositedToken1: string;
  collectedFees: {
    token0: string;
    token1: string;
  };
  pool: {
    address: string;
    fee: number;
    tick: number;
    sqrtPrice: string;
    token0Price: string;
    token1Price: string;
    volume24h: string;
    tvl: string;
  };
}

interface PoolInfo {
  address: string;
  token0: string;
  token1: string;
  fee: number;
  tvl: string;
  volume24h: string;
  apr: string;
  tick: number;
  token0Price: string;
  token1Price: string;
}

interface WalletPositions {
  address: string;
  positions: PoolPosition[];
  totalValueUSD: string;
  totalFeesEarnedUSD: string;
}

@Injectable()
export class LiquidityPoolService {
  // Get pool info by token pair
  async getPoolInfo(token0Address: string, token1Address: string, fee: number): Promise<PoolInfo> {
    // Simulate pool info - in production would call The Graph or blockchain
    const pools: Record<string, PoolInfo> = {
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2-3000': {
        address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        token0: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        fee: 3000,
        tvl: '125.5M',
        volume24h: '89.2M',
        apr: '24.5%',
        tick: 201922,
        token0Price: '0.00040025',
        token1Price: '2498.45',
      },
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2-3000': {
        address: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
        token0: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
        token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        fee: 3000,
        tvl: '45.2M',
        volume24h: '32.1M',
        apr: '18.2%',
        tick: 255930,
        token0Price: '0.0435',
        token1Price: '22,980',
      },
    };

    const key = `${token0Address.toLowerCase()}-${token1Address.toLowerCase()}-${fee}`;
    return pools[key] || {
      address: '0x0000000000000000000000000000000000000000',
      token0: token0Address,
      token1: token1Address,
      fee,
      tvl: '0',
      volume24h: '0',
      apr: '0%',
      tick: 0,
      token0Price: '0',
      token1Price: '0',
    };
  }

  // Get wallet positions
  async getWalletPositions(walletAddress: string): Promise<WalletPositions> {
    // Simulate positions - in production would query The Graph
    const positions: PoolPosition[] = [
      {
        id: '1',
        token0: {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        token1: {
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
        fee: 3000,
        liquidity: '1523456789012345678901',
        tickLower: 199980,
        tickUpper: 203880,
        depositedToken0: '15000',
        depositedToken1: '6.5',
        collectedFees: {
          token0: '45.23',
          token1: '0.018',
        },
        pool: {
          address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
          fee: 3000,
          tick: 201922,
          sqrtPrice: '2021440698477738830827375377024',
          token0Price: '0.00040025',
          token1Price: '2498.45',
          volume24h: '89.2M',
          tvl: '125.5M',
        },
      },
    ];

    return {
      address: walletAddress,
      positions,
      totalValueUSD: '31752.43',
      totalFeesEarnedUSD: '125.67',
    };
  }

  // Get top pools
  async getTopPools(chainId: number = 1, limit: number = 10): Promise<PoolInfo[]> {
    // Simulate top pools
    const pools: PoolInfo[] = [
      {
        address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
        token0: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        fee: 3000,
        tvl: '125.5M',
        volume24h: '89.2M',
        apr: '24.5%',
        tick: 201922,
        token0Price: '0.00040025',
        token1Price: '2498.45',
      },
      {
        address: '0xcbcdf9626bc03e24f779434178a73a0b4bad62ed',
        token0: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        fee: 3000,
        tvl: '45.2M',
        volume24h: '32.1M',
        apr: '18.2%',
        tick: 255930,
        token0Price: '0.0435',
        token1Price: '22,980',
      },
      {
        address: '0x4e68cc9b3c95b9d7ae77d42d4d9e9a0c9f4a7c00',
        token0: '0x6b175474e89094c44da98b954eedeac495271d0f',
        token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        fee: 3000,
        tvl: '38.7M',
        volume24h: '28.5M',
        apr: '21.3%',
        tick: 195420,
        token0Price: '0.000380',
        token1Price: '2631.58',
      },
    ];

    return pools.slice(0, limit);
  }

  // Calculate position value
  async calculatePositionValue(position: PoolPosition): Promise<string> {
    const token0Value = parseFloat(position.depositedToken0) * parseFloat(position.pool.token1Price) / parseFloat(position.pool.token0Price);
    const token1Value = parseFloat(position.depositedToken1) * parseFloat(position.pool.token1Price);
    return (token0Value + token1Value).toFixed(2);
  }

  // Get recommended fee tier based on volatility
  getRecommendedFeeTier(token0Symbol: string, token1Symbol: string): number {
    const stablePairs = ['USDC/USDT', 'DAI/USDC', 'USDT/USDC'];
    const pair = `${token0Symbol}/${token1Symbol}`.toUpperCase();
    
    if (stablePairs.includes(pair)) return 100;
    if (token0Symbol === 'WETH' && token1Symbol === 'WBTC') return 3000;
    return 3000;
  }
}
