import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

export interface YieldPosition {
  id: string;
  protocol: string;
  pool: string;
  token: string;
  deposited: number;
  currentValue: number;
  apy: number;
  pnl: number;
  pnlPercent: number;
  chainId: number;
  tokenAddress: string;
  poolAddress: string;
}

export interface YieldStats {
  totalDeposited: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  averageApy: number;
  positions: YieldPosition[];
}

export interface YieldHistory {
  date: string;
  value: number;
  pnl: number;
}

export interface AddPositionDto {
  protocol: string;
  pool: string;
  token: string;
  deposited: number;
  chainId: number;
  tokenAddress: string;
  poolAddress: string;
}

@ApiTags('web3-yield')
@Controller('api/web3/yield')
export class Web3YieldController {
  // In-memory storage for demo (would use database in production)
  private positions: Map<string, YieldPosition[]> = new Map();
  private yieldHistory: Map<string, YieldHistory[]> = new Map();

  constructor() {
    // Initialize with sample data for demo
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const samplePositions: YieldPosition[] = [
      {
        id: '1',
        protocol: 'Aave',
        pool: 'USDC Supply',
        token: 'USDC',
        deposited: 10000,
        currentValue: 10450,
        apy: 4.5,
        pnl: 450,
        pnlPercent: 4.5,
        chainId: 1,
        tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        poolAddress: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9'
      },
      {
        id: '2',
        protocol: 'Uniswap',
        pool: 'ETH/USDC',
        token: 'LP Token',
        deposited: 25000,
        currentValue: 28500,
        apy: 12.8,
        pnl: 3500,
        pnlPercent: 14.0,
        chainId: 1,
        tokenAddress: '0x4e68cC8e6d4D3e3d24d7A1E2a3E5f8B9C0d1e2F3',
        poolAddress: '0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8'
      },
      {
        id: '3',
        protocol: 'Compound',
        pool: 'ETH Collateral',
        token: 'ETH',
        deposited: 5,
        currentValue: 5.8,
        apy: 3.2,
        pnl: 0.8,
        pnlPercent: 16.0,
        chainId: 1,
        tokenAddress: '0x0000000000000000000000000000000000000000',
        poolAddress: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B'
      },
      {
        id: '4',
        protocol: 'Curve',
        pool: 'stETH/ETH',
        token: 'crvETH',
        deposited: 15000,
        currentValue: 16800,
        apy: 8.5,
        pnl: 1800,
        pnlPercent: 12.0,
        chainId: 1,
        tokenAddress: '0x06325440a0149f7e15f3d6b30027d5a59f4ed0a5',
        poolAddress: '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022'
      },
      {
        id: '5',
        protocol: 'Lido',
        pool: 'stETH',
        token: 'stETH',
        deposited: 8,
        currentValue: 9.2,
        apy: 5.2,
        pnl: 1.2,
        pnlPercent: 15.0,
        chainId: 1,
        tokenAddress: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
        poolAddress: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
      }
    ];

    this.positions.set('0x0000000000000000000000000000000000000000', samplePositions);

    // Generate sample history data
    const history: YieldHistory[] = [];
    const now = new Date();
    let baseValue = 50000;
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      baseValue *= 1 + (Math.random() * 0.01 - 0.002);
      history.push({
        date: date.toISOString().split('T')[0],
        value: baseValue,
        pnl: baseValue - 50000
      });
    }
    this.yieldHistory.set('0x0000000000000000000000000000000000000000', history);
  }

  @Get('stats/:address')
  @ApiOperation({ summary: 'Get yield farming stats for wallet address' })
  @ApiQuery({ name: 'chainId', required: false, type: Number })
  async getYieldStats(
    @Param('address') address: string,
    @Query('chainId') chainId?: number
  ): Promise<YieldStats> {
    const positions = this.positions.get(address.toLowerCase()) || [];
    
    const filteredPositions = chainId 
      ? positions.filter(p => p.chainId === chainId)
      : positions;

    const totalDeposited = filteredPositions.reduce((sum, p) => sum + p.deposited, 0);
    const totalValue = filteredPositions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPnL = filteredPositions.reduce((sum, p) => sum + p.pnl, 0);
    const totalPnLPercent = totalDeposited > 0 ? (totalPnL / totalDeposited) * 100 : 0;
    const averageApy = filteredPositions.length > 0
      ? filteredPositions.reduce((sum, p) => sum + p.apy, 0) / filteredPositions.length
      : 0;

    return {
      totalDeposited,
      totalValue,
      totalPnL,
      totalPnLPercent,
      averageApy,
      positions: filteredPositions
    };
  }

  @Get('history/:address')
  @ApiOperation({ summary: 'Get yield history for wallet address' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getYieldHistory(
    @Param('address') address: string,
    @Query('days') days: number = 30
  ): Promise<YieldHistory[]> {
    const history = this.yieldHistory.get(address.toLowerCase()) || [];
    return history.slice(-days);
  }

  @Post('positions')
  @ApiOperation({ summary: 'Add a new yield position' })
  async addPosition(@Body() dto: AddPositionDto): Promise<YieldPosition> {
    const address = '0x0000000000000000000000000000000000000000'; // Demo address
    const positions = this.positions.get(address) || [];
    
    const newPosition: YieldPosition = {
      id: Date.now().toString(),
      protocol: dto.protocol,
      pool: dto.pool,
      token: dto.token,
      deposited: dto.deposited,
      currentValue: dto.deposited,
      apy: Math.random() * 15 + 2, // Random APY for demo
      pnl: 0,
      pnlPercent: 0,
      chainId: dto.chainId,
      tokenAddress: dto.tokenAddress,
      poolAddress: dto.poolAddress
    };

    positions.push(newPosition);
    this.positions.set(address, positions);
    
    return newPosition;
  }

  @Delete('positions/:id')
  @ApiOperation({ summary: 'Remove a yield position' })
  async removePosition(@Param('id') id: string): Promise<{ success: boolean }> {
    const address = '0x0000000000000000000000000000000000000000';
    const positions = this.positions.get(address) || [];
    const filtered = positions.filter(p => p.id !== id);
    this.positions.set(address, filtered);
    
    return { success: true };
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Get supported DeFi protocols' })
  async getProtocols() {
    return [
      {
        name: 'Aave',
        logo: '👻',
        chains: [1, 137, 42161],
        tokens: ['USDC', 'USDT', 'ETH', 'WBTC', 'DAI'],
        avgApy: '3-8%'
      },
      {
        name: 'Uniswap',
        logo: '🦄',
        chains: [1, 137, 42161, 8453],
        tokens: ['ETH', 'USDC', 'USDT', 'WBTC'],
        avgApy: '5-25%'
      },
      {
        name: 'Compound',
        logo: '🔷',
        chains: [1, 137],
        tokens: ['USDC', 'USDT', 'ETH', 'WBTC', 'DAI'],
        avgApy: '2-5%'
      },
      {
        name: 'Curve',
        logo: '💚',
        chains: [1, 137],
        tokens: ['ETH', 'stETH', 'WBTC', 'USDC'],
        avgApy: '2-15%'
      },
      {
        name: 'Lido',
        logo: '🧤',
        chains: [1],
        tokens: ['ETH', 'stETH'],
        avgApy: '4-6%'
      },
      {
        name: 'Yearn',
        logo: '🎩',
        chains: [1, 137],
        tokens: ['USDC', 'USDT', 'ETH', 'WBTC'],
        avgApy: '5-20%'
      },
      {
        name: 'Gearbox',
        logo: '⚙️',
        chains: [1],
        tokens: ['USDC', 'ETH', 'WBTC'],
        avgApy: '5-30%'
      },
      {
        name: 'Morpho',
        logo: '🟣',
        chains: [1, 137],
        tokens: ['USDC', 'ETH', 'WBTC'],
        avgApy: '3-10%'
      }
    ];
  }
}
