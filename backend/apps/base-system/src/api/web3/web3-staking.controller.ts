import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@ApiTags('Staking Dashboard')
@Controller('api/web3/staking')
export class Web3StakingController {
  constructor(private readonly httpService: HttpService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get Ethereum staking statistics' })
  async getStakingStats() {
    try {
      // Fetch ETH staking data from multiple sources
      const [beaconChain, defiLlama] = await Promise.all([
        this.getBeaconChainStats(),
        this.getDefiLlamaStaking()
      ]);

      return {
        success: true,
        data: {
          totalStaked: beaconChain.totalStaked,
          validators: beaconChain.validators,
          apr: beaconChain.apr,
          deflationary: defiLlama,
          trend: {
            weeklyChange: '+2.4%',
            monthlyChange: '+8.7%',
            yearlyChange: '+45.2%'
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: this.getMockStakingStats()
      };
    }
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get staking rewards data' })
  @ApiQuery({ name: 'address', required: false })
  async getStakingRewards(@Query('address') address?: string) {
    try {
      if (address) {
        // Return mock data for specific address
        return {
          success: true,
          data: this.getMockAddressRewards(address)
        };
      }

      return {
        success: true,
        data: this.getGlobalRewards()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: this.getGlobalRewards()
      };
    }
  }

  @Get('validators')
  @ApiOperation({ summary: 'Get validator performance data' })
  async getValidators() {
    return {
      success: true,
      data: this.getMockValidators()
    };
  }

  @Get('pools')
  @ApiOperation({ summary: 'Get staking pool options' })
  async getStakingPools() {
    return {
      success: true,
      data: this.getMockStakingPools()
    };
  }

  @Get('apr-history')
  @ApiOperation({ summary: 'Get APR history data' })
  @ApiQuery({ name: 'days', required: false })
  async getAprHistory(@Query('days') days: string = '30') {
    return {
      success: true,
      data: this.getMockAprHistory(parseInt(days))
    };
  }

  private async getBeaconChainStats() {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://eth2.b Beaconchain.io/api/v1/validator/count')
      ).catch(() => null);

      if (response?.data) {
        return {
          totalStaked: response.data.total_staked || '9.2M',
          validators: response.data.validators || 285000,
          apr: response.data.apr || 3.8
        };
      }
    } catch {}

    return {
      totalStaked: '9.2M ETH',
      validators: 285000,
      apr: 3.8
    };
  }

  private async getDefiLlamaStaking() {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://defillama.com/protocol/ethereum-staking')
      ).catch(() => null);

      if (response?.data) {
        return {
          tvl: response.data.tvl || 45000000000
        };
      }
    } catch {}

    return { tvl: 45000000000 };
  }

  private getMockStakingStats() {
    return {
      totalStaked: '9.2M ETH',
      validators: 285000,
      apr: 3.8,
      deflationary: { tvl: 45000000000 },
      trend: {
        weeklyChange: '+2.4%',
        monthlyChange: '+8.7%',
        yearlyChange: '+45.2%'
      }
    };
  }

  private getMockAddressRewards(address: string) {
    return {
      address,
      totalStaked: '32 ETH',
      pendingRewards: '0.084 ETH',
      totalRewards: '2.45 ETH',
      validatorIndex: '125000',
      activationDate: '2024-01-15',
      performance: {
        attestations: 98.5,
        syncParticipation: 99.2,
        proposedBlocks: 12
      }
    };
  }

  private getGlobalRewards() {
    return {
      totalStaked: '9.2M ETH',
      averageApr: 3.8,
      totalValidators: 285000,
      rewardsPerDay: '5,200 ETH',
      rewardsPerWeek: '36,400 ETH',
      rewardsPerMonth: '156,000 ETH'
    };
  }

  private getMockValidators() {
    return [
      { name: 'Lido', apr: 3.85, tvl: '18.5B', fee: '10%', risk: 'low', users: 350000 },
      { name: 'Rocket Pool', apr: 3.92, tvl: '2.1B', fee: '15%', risk: 'low', users: 45000 },
      { name: 'Stakewise', apr: 3.78, tvl: '850M', fee: '10%', risk: 'medium', users: 12000 },
      { name: 'Frax Ether', apr: 3.70, tvl: '1.2B', fee: '10%', risk: 'medium', users: 28000 },
      { name: 'Coinbase Wrapped', apr: 3.65, tvl: '5.8B', fee: '25%', risk: 'low', users: 125000 },
      { name: 'Binance Staked', apr: 3.60, tvl: '3.2B', fee: '20%', risk: 'medium', users: 85000 }
    ];
  }

  private getMockStakingPools() {
    return [
      {
        id: 'lido',
        name: 'Lido',
        symbol: 'stETH',
        apr: 3.85,
        tvl: '18.5B USD',
        minStake: '0.01 ETH',
        fee: '10%',
        chains: ['Ethereum', 'Polygon', 'Arbitrum'],
        features: ['Liquid Staking', 'DeFi Integration', 'No Lock-up']
      },
      {
        id: 'rocket-pool',
        name: 'Rocket Pool',
        symbol: 'rETH',
        apr: 3.92,
        tvl: '2.1B USD',
        minStake: '0.01 ETH',
        fee: '15%',
        chains: ['Ethereum'],
        features: ['Decentralized', 'Node Running', 'RPL Rewards']
      },
      {
        id: 'stakewise',
        name: 'Stakewise',
        symbol: 'sETH2',
        apr: 3.78,
        tvl: '850M USD',
        minStake: '0.01 ETH',
        fee: '10%',
        chains: ['Ethereum', 'Optimism'],
        features: ['Dual Tokens', 'DeFi Integration', 'No Lock-up']
      },
      {
        id: 'frax-ether',
        name: 'Frax Ether',
        symbol: 'frxETH',
        apr: 3.70,
        tvl: '1.2B USD',
        minStake: '0.01 ETH',
        fee: '10%',
        chains: ['Ethereum', 'Arbitrum'],
        features: ['Liquid Staking', 'Stablecoin Backed', 'Yield Boost']
      }
    ];
  }

  private getMockAprHistory(days: number) {
    const data: { date: string; apr: string }[] = [];
    const now = Date.now();
    const baseApr = 3.8;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const variance = (Math.random() - 0.5) * 0.6;
      data.push({
        date: date.toISOString().split('T')[0],
        apr: (baseApr + variance).toFixed(2)
      });
    }

    return data;
  }
}
