import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('DeFi Rewards Claimer')
@Controller('api/web3/defi-rewards')
export class Web3DefiRewardsController {
  private rewardsData = new Map<string, any[]>();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock pending rewards data
    const protocols = [
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'Aave',
        chain: 'ethereum',
        token: 'AAVE',
        pendingRewards: 125.45,
        rewardToken: 'AAVE',
        apr: 5.2,
        lastClaimed: '2026-02-15T10:30:00Z',
      },
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'Compound',
        chain: 'ethereum',
        token: 'COMP',
        pendingRewards: 42.8,
        rewardToken: 'COMP',
        apr: 3.8,
        lastClaimed: '2026-02-20T14:20:00Z',
      },
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'Yearn',
        chain: 'ethereum',
        token: 'YFI',
        pendingRewards: 8.92,
        rewardToken: 'YFI',
        apr: 12.5,
        lastClaimed: '2026-02-18T08:15:00Z',
      },
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'Uniswap V3',
        chain: 'ethereum',
        token: 'UNI',
        pendingRewards: 156.3,
        rewardToken: 'UNI',
        apr: 8.7,
        lastClaimed: '2026-02-22T16:45:00Z',
      },
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'Curve',
        chain: 'ethereum',
        token: 'CRV',
        pendingRewards: 234.56,
        rewardToken: 'CRV',
        apr: 4.2,
        lastClaimed: '2026-02-25T12:00:00Z',
      },
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'Lido',
        chain: 'ethereum',
        token: 'LDO',
        pendingRewards: 89.12,
        rewardToken: 'LDO',
        apr: 3.5,
        lastClaimed: '2026-02-28T09:30:00Z',
      },
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'Aave',
        chain: 'polygon',
        token: 'AAVE',
        pendingRewards: 56.78,
        rewardToken: 'AAVE',
        apr: 4.8,
        lastClaimed: '2026-02-19T11:20:00Z',
      },
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'QuickSwap',
        chain: 'polygon',
        token: 'QUICK',
        pendingRewards: 123.45,
        rewardToken: 'QUICK',
        apr: 15.2,
        lastClaimed: '2026-02-21T15:10:00Z',
      },
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'Aave',
        chain: 'arbitrum',
        token: 'AAVE',
        pendingRewards: 78.9,
        rewardToken: 'AAVE',
        apr: 6.1,
        lastClaimed: '2026-02-23T10:45:00Z',
      },
      {
        address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        protocol: 'GMX',
        chain: 'arbitrum',
        token: 'GMX',
        pendingRewards: 45.67,
        rewardToken: 'GMX',
        apr: 18.5,
        lastClaimed: '2026-02-26T13:30:00Z',
      },
    ];
    this.rewardsData.set('0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', protocols);
  }

  @Get('pending/:address')
  @ApiOperation({ summary: 'Get pending rewards for a wallet across all protocols' })
  @ApiQuery({ name: 'chain', required: false })
  @ApiQuery({ name: 'protocol', required: false })
  async getPendingRewards(
    @Param('address') address: string,
    @Query('chain') chain?: string,
    @Query('protocol') protocol?: string,
  ) {
    let rewards = this.rewardsData.get(address.toLowerCase()) || [];

    if (chain) {
      rewards = rewards.filter((r) => r.chain === chain);
    }
    if (protocol) {
      rewards = rewards.filter((r) => r.protocol === protocol);
    }

    const totalPending = rewards.reduce((sum, r) => sum + r.pendingRewards, 0);
    const byProtocol = rewards.reduce((acc, r) => {
      if (!acc[r.protocol]) {
        acc[r.protocol] = 0;
      }
      acc[r.protocol] += r.pendingRewards;
      return acc;
    }, {});

    return {
      address,
      totalPending: Number(totalPending.toFixed(2)),
      count: rewards.length,
      rewards: rewards.map((r) => ({
        ...r,
        pendingRewards: Number(r.pendingRewards.toFixed(2)),
        value: Number((r.pendingRewards * this.getTokenPrice(r.rewardToken)).toFixed(2)),
      })),
      byProtocol,
      chains: [...new Set(rewards.map((r) => r.chain))],
      protocols: [...new Set(rewards.map((r) => r.protocol))],
    };
  }

  @Get('summary/:address')
  @ApiOperation({ summary: 'Get rewards summary across all chains' })
  async getRewardsSummary(@Param('address') address: string) {
    const rewards = this.rewardsData.get(address.toLowerCase()) || [];

    const byChain = rewards.reduce((acc, r) => {
      if (!acc[r.chain]) {
        acc[r.chain] = { total: 0, protocols: new Set(), tokens: [] };
      }
      acc[r.chain].total += r.pendingRewards * this.getTokenPrice(r.rewardToken);
      acc[r.chain].protocols.add(r.protocol);
      acc[r.chain].tokens.push(r.rewardToken);
      return acc;
    }, {});

    const chainSummary = Object.entries(byChain).map(([chain, data]: [string, any]) => ({
      chain,
      totalValue: Number(data.total.toFixed(2)),
      protocolCount: data.protocols.size,
      tokens: [...new Set(data.tokens)],
    }));

    const totalValue = chainSummary.reduce((sum, c) => sum + c.totalValue, 0);
    const weightedApr =
      rewards.reduce((sum, r) => sum + r.apr * r.pendingRewards, 0) /
      (rewards.reduce((sum, r) => sum + r.pendingRewards, 0) || 1);

    return {
      address,
      totalValue: Number(totalValue.toFixed(2)),
      totalPending: Number(rewards.reduce((sum, r) => sum + r.pendingRewards, 0).toFixed(2)),
      chainCount: chainSummary.length,
      protocolCount: new Set(rewards.map((r) => r.protocol)).size,
      chains: chainSummary,
      weightedApr: Number(weightedApr.toFixed(2)),
      gasEstimate: this.estimateClaimGas(rewards.length),
      recommendation: this.getClaimRecommendation(totalValue, rewards.length),
    };
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Find best yield opportunities for claiming' })
  @ApiQuery({ name: 'minValue', required: false })
  @ApiQuery({ name: 'chain', required: false })
  async getYieldOpportunities(
    @Query('minValue') minValue?: string,
    @Query('chain') chain?: string,
  ) {
    const allRewards: any[] = [];
    this.rewardsData.forEach((rewards) => {
      allRewards.push(...rewards);
    });

    let filtered = allRewards;
    if (minValue) {
      filtered = filtered.filter(
        (r) => r.pendingRewards * this.getTokenPrice(r.rewardToken) >= parseFloat(minValue),
      );
    }
    if (chain) {
      filtered = filtered.filter((r) => r.chain === chain);
    }

    const opportunities = filtered
      .map((r) => ({
        ...r,
        pendingRewards: Number(r.pendingRewards.toFixed(2)),
        value: Number((r.pendingRewards * this.getTokenPrice(r.rewardToken)).toFixed(2)),
        gasCost: this.estimateClaimGas(1),
        netValue: Number(
          (
            r.pendingRewards * this.getTokenPrice(r.rewardToken) -
            this.estimateClaimGas(1) * this.getGasPrice(r.chain)
          ).toFixed(2),
        ),
        roi: Number(
          (
            (r.pendingRewards * this.getTokenPrice(r.rewardToken)) /
            (this.estimateClaimGas(1) * this.getGasPrice(r.chain)) *
            100
          ).toFixed(2),
        ),
      }))
      .sort((a, b) => b.netValue - a.netValue);

    return {
      opportunities: opportunities.slice(0, 20),
      totalOpportunities: opportunities.length,
      bestOpportunity: opportunities[0] || null,
      byChain: this.groupByChain(opportunities),
      byProtocol: this.groupByProtocol(opportunities),
    };
  }

  @Post('claim-preview')
  @ApiOperation({ summary: 'Preview claim transaction details' })
  async previewClaim(@Body() body: { address: string; protocols: string[] }) {
    const rewards = this.rewardsData.get(body.address.toLowerCase()) || [];
    const selected = rewards.filter((r) => body.protocols.includes(r.protocol));

    const totalRewards = selected.reduce((sum, r) => sum + r.pendingRewards, 0);
    const totalValue = selected.reduce(
      (sum, r) => sum + r.pendingRewards * this.getTokenPrice(r.rewardToken),
      0,
    );
    const gasEstimate = this.estimateClaimGas(selected.length);
    const gasCost = gasEstimate * this.getGasPrice('ethereum');

    return {
      protocols: selected.map((r) => r.protocol),
      totalRewards: Number(totalRewards.toFixed(2)),
      totalValue: Number(totalValue.toFixed(2)),
      transaction: {
        estimatedGas: gasEstimate,
        gasPrice: this.getGasPrice('ethereum'),
        gasCost: Number(gasCost.toFixed(4)),
        netValue: Number((totalValue - gasCost).toFixed(2)),
      },
      steps: selected.map((r, i) => ({
        step: i + 1,
        protocol: r.protocol,
        action: 'claimRewards',
        token: r.rewardToken,
        amount: r.pendingRewards,
      })),
    };
  }

  @Get('history/:address')
  @ApiOperation({ summary: 'Get claim history for a wallet' })
  async getClaimHistory(@Param('address') address: string) {
    // Mock claim history
    return {
      address,
      history: [
        {
          date: '2026-02-28T09:30:00Z',
          protocol: 'Lido',
          chain: 'ethereum',
          token: 'LDO',
          amount: 45.23,
          value: 67.85,
          txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          gasPaid: 0.0045,
        },
        {
          date: '2026-02-25T12:00:00Z',
          protocol: 'Curve',
          chain: 'ethereum',
          token: 'CRV',
          amount: 189.45,
          value: 156.82,
          txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          gasPaid: 0.0052,
        },
        {
          date: '2026-02-20T14:20:00Z',
          protocol: 'Compound',
          chain: 'ethereum',
          token: 'COMP',
          amount: 32.1,
          value: 245.67,
          txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
          gasPaid: 0.0038,
        },
        {
          date: '2026-02-15T10:30:00Z',
          protocol: 'Aave',
          chain: 'ethereum',
          token: 'AAVE',
          amount: 98.76,
          value: 12345.0,
          txHash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
          gasPaid: 0.0065,
        },
      ],
      totalClaimed: 14815.34,
      totalGasPaid: 0.02,
      claimCount: 4,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get global DeFi rewards statistics' })
  async getGlobalStats() {
    return {
      totalPendingValue: 1245678.9,
      activeClaimers: 45678,
      totalClaimed24h: 234567.8,
      topProtocols: [
        { protocol: 'Aave', pendingValue: 345678.9, claimers: 12345 },
        { protocol: 'Compound', pendingValue: 234567.8, claimers: 9876 },
        { protocol: 'Yearn', pendingValue: 189234.5, claimers: 7654 },
        { protocol: 'Uniswap', pendingValue: 156789.1, claimers: 6543 },
        { protocol: 'Curve', pendingValue: 123456.7, claimers: 5432 },
      ],
      topChains: [
        { chain: 'ethereum', pendingValue: 890123.4, share: 71.4 },
        { chain: 'arbitrum', pendingValue: 156789.1, share: 12.6 },
        { chain: 'polygon', pendingValue: 123456.7, share: 9.9 },
        { chain: 'optimism', pendingValue: 75309.7, share: 6.1 },
      ],
      averageApr: 8.5,
      lastUpdated: new Date().toISOString(),
    };
  }

  private getTokenPrice(token: string): number {
    const prices: Record<string, number> = {
      AAVE: 285.5,
      COMP: 178.9,
      YFI: 4250.0,
      UNI: 12.45,
      CRV: 0.85,
      LDO: 2.35,
      QUICK: 125.6,
      GMX: 42.8,
      ETH: 2850.0,
    };
    return prices[token] || 100;
  }

  private getGasPrice(chain: string): number {
    const prices: Record<string, number> = {
      ethereum: 0.000015,
      polygon: 0.000001,
      arbitrum: 0.0000012,
      optimism: 0.000001,
      avalanche: 0.000025,
      bsc: 0.000003,
    };
    return prices[chain] || 0.00001;
  }

  private estimateClaimGas(count: number): number {
    return 150000 + count * 50000;
  }

  private getClaimRecommendation(totalValue: number, count: number): string {
    if (totalValue < 50) {
      return 'Claim value too low. Wait for rewards to accumulate more.';
    }
    if (count > 5) {
      return 'Bundle multiple protocol claims into one transaction to save gas.';
    }
    if (totalValue > 1000) {
      return 'High value pending. Consider claiming soon to avoid impermanent loss.';
    }
    return 'Claim when gas prices are low (typically late night UTC hours).';
  }

  private groupByChain(opportunities: any[]): any {
    return opportunities.reduce((acc, o) => {
      if (!acc[o.chain]) {
        acc[o.chain] = { count: 0, totalValue: 0, protocols: new Set() };
      }
      acc[o.chain].count++;
      acc[o.chain].totalValue += o.value;
      acc[o.chain].protocols.add(o.protocol);
      return acc;
    }, {});
  }

  private groupByProtocol(opportunities: any[]): any {
    return opportunities.reduce((acc, o) => {
      if (!acc[o.protocol]) {
        acc[o.protocol] = { count: 0, totalValue: 0, chains: new Set() };
      }
      acc[o.protocol].count++;
      acc[o.protocol].totalValue += o.value;
      acc[o.protocol].chains.add(o.chain);
      return acc;
    }, {});
  }
}
