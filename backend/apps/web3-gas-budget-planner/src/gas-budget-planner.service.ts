import { Injectable } from '@nestjs/common';

interface ChainConfig {
  name: string;
  chainId: number;
  avgGasPrice: number;
  gasUnit: string;
}

interface TransactionType {
  type: string;
  gasLimit: number;
  description: string;
}

interface BudgetProjection {
  date: string;
  estimatedGas: number;
  estimatedUsd: number;
  confidence: string;
}

interface BudgetItem {
  id: string;
  name: string;
  type: string;
  chainId: number;
  gasLimit: number;
  estimatedPrice: number;
  estimatedUsd: number;
  scheduledDate?: string;
  status: 'pending' | 'estimated' | 'completed';
}

@Injectable()
export class GasBudgetPlannerService {
  private readonly supportedChains: ChainConfig[] = [
    { name: 'Ethereum', chainId: 1, avgGasPrice: 20, gasUnit: 'Gwei' },
    { name: 'Polygon', chainId: 137, avgGasPrice: 50, gasUnit: 'Gwei' },
    { name: 'Arbitrum', chainId: 42161, avgGasPrice: 0.1, gasUnit: 'Gwei' },
    { name: 'Optimism', chainId: 10, avgGasPrice: 0.001, gasUnit: 'Gwei' },
    { name: 'BSC', chainId: 56, avgGasPrice: 3, gasUnit: 'Gwei' },
    { name: 'Base', chainId: 8453, avgGasPrice: 0.05, gasUnit: 'Gwei' },
    { name: 'Avalanche', chainId: 43114, avgGasPrice: 25, gasUnit: 'Gwei' },
  ];

  private readonly transactionTypes: TransactionType[] = [
    { type: 'eth_transfer', gasLimit: 21000, description: 'ETH转账' },
    { type: 'erc20_transfer', gasLimit: 65000, description: 'ERC20代币转账' },
    { type: 'erc721_transfer', gasLimit: 85000, description: 'NFT转账' },
    { type: 'swap', gasLimit: 150000, description: 'DEX Swap' },
    { type: 'add_liquidity', gasLimit: 200000, description: '添加流动性' },
    { type: 'remove_liquidity', gasLimit: 180000, description: '移除流动性' },
    { type: 'approve', gasLimit: 46000, description: '代币授权' },
    { type: 'stake', gasLimit: 120000, description: '质押' },
    { type: 'unstake', gasLimit: 100000, description: '解除质押' },
    { type: 'bridge', gasLimit: 200000, description: '跨链桥接' },
    { type: 'contract_deploy', gasLimit: 2000000, description: '部署合约' },
    { type: 'nft_mint', gasLimit: 100000, description: 'NFT铸造' },
  ];

  private readonly ethPrice = 2850; // ETH价格（美元）

  async getSupportedChains() {
    return this.supportedChains.map((chain) => ({
      chainId: chain.chainId,
      name: chain.name,
      gasUnit: chain.gasUnit,
    }));
  }

  async getTransactionTypes() {
    return this.transactionTypes;
  }

  async calculateBudget(params: {
    chainId: number;
    transactionType: string;
    gasPrice?: number;
    count?: number;
  }): Promise<{
    chain: string;
    transactionType: string;
    gasLimit: number;
    gasPrice: number;
    gasPriceUnit: string;
    estimatedGas: number;
    ethPrice: number;
    estimatedUsd: number;
  }> {
    const chain = this.supportedChains.find(
      (c) => c.chainId === params.chainId,
    );
    const txType = this.transactionTypes.find(
      (t) => t.type === params.transactionType,
    );

    if (!chain || !txType) {
      throw new Error('Unsupported chain or transaction type');
    }

    const gasPrice = params.gasPrice || chain.avgGasPrice;
    const count = params.count || 1;
    const estimatedGas = txType.gasLimit * count * gasPrice;

    // 将Gwei转换为ETH
    const gasInEth = gasPrice / 1e9;
    const totalEth = (txType.gasLimit * count * gasInEth) / 1e9;
    const estimatedUsd = totalEth * this.ethPrice;

    return {
      chain: chain.name,
      transactionType: txType.description,
      gasLimit: txType.gasLimit,
      gasPrice,
      gasPriceUnit: chain.gasUnit,
      estimatedGas: estimatedGas,
      ethPrice: this.ethPrice,
      estimatedUsd,
    };
  }

  async getBudgetProjection(params: {
    chainId: number;
    transactions: Array<{
      type: string;
      count: number;
      date?: string;
    }>;
    days?: number;
  }): Promise<{
    summary: {
      totalTransactions: number;
      totalEstimatedGas: number;
      totalEstimatedUsd: number;
      averageDailyCost: number;
    };
    dailyProjections: BudgetProjection[];
    recommendations: string[];
  }> {
    const chain = this.supportedChains.find(
      (c) => c.chainId === params.chainId,
    );
    if (!chain) {
      throw new Error('Unsupported chain');
    }

    const days = params.days || 30;
    const dailyProjections: BudgetProjection[] = [];
    let totalEstimatedGas = 0;
    let totalEstimatedUsd = 0;

    // 计算每天的Gas价格波动（模拟）
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // 模拟Gas价格波动：周末略高，工作日略低
      const dayOfWeek = date.getDay();
      let fluctuation = 1;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        fluctuation = 1.2; // 周末
      } else if (dayOfWeek === 2 || dayOfWeek === 3) {
        fluctuation = 0.9; // 周二三最便宜
      }

      // 美国东部时间下午（北京时间凌晨）Gas通常较高
      const hourOfDay = date.getHours();
      if (hourOfDay >= 13 && hourOfDay <= 20) {
        fluctuation *= 1.15;
      }

      const predictedGasPrice = chain.avgGasPrice * fluctuation;

      // 计算当天计划的交易
      const dailyGas = params.transactions.reduce((acc, tx) => {
        const txType = this.transactionTypes.find((t) => t.type === tx.type);
        if (!txType) return acc;
        return acc + txType.gasLimit * tx.count * predictedGasPrice;
      }, 0);

      const gasInEth = predictedGasPrice / 1e9;
      const dailyEth = (dailyGas * gasInEth) / 1e9;
      const dailyUsd = dailyEth * this.ethPrice;

      totalEstimatedGas += dailyGas;
      totalEstimatedUsd += dailyUsd;

      dailyProjections.push({
        date: dateStr,
        estimatedGas: dailyGas,
        estimatedUsd: dailyUsd,
        confidence: fluctuation < 1.1 ? 'high' : fluctuation < 1.2 ? 'medium' : 'low',
      });
    }

    // 生成建议
    const recommendations: string[] = [];
    
    // 基于预测生成建议
    const cheapestDays = dailyProjections
      .filter((d) => d.estimatedUsd > 0)
      .sort((a, b) => a.estimatedUsd - b.estimatedUsd)
      .slice(0, 3)
      .map((d) => d.date);

    if (cheapestDays.length > 0) {
      recommendations.push(
        `建议在 ${cheapestDays.join(', ')} 进行交易，可节省Gas费用`,
      );
    }

    // 检查是否应该在非高峰期交易
    const highCostDays = dailyProjections.filter(
      (d) => d.confidence === 'low' && d.estimatedUsd > 0,
    );
    if (highCostDays.length > 5) {
      recommendations.push(
        '有较多天Gas价格较高，建议分散交易时间或考虑使用Layer2',
      );
    }

    return {
      summary: {
        totalTransactions: params.transactions.reduce(
          (acc, tx) => acc + tx.count,
          0,
        ),
        totalEstimatedGas,
        totalEstimatedUsd,
        averageDailyCost: totalEstimatedUsd / days,
      },
      dailyProjections,
      recommendations,
    };
  }

  async getBudgetBreakdown(params: {
    chainId: number;
    transactions: Array<{
      name: string;
      type: string;
      count: number;
    }>;
  }): Promise<{
    breakdown: Array<{
      name: string;
      type: string;
      count: number;
      gasLimit: number;
      estimatedGas: number;
      estimatedUsd: number;
      percentage: number;
    }>;
    total: {
      totalCount: number;
      totalGas: number;
      totalUsd: number;
    };
  }> {
    const chain = this.supportedChains.find(
      (c) => c.chainId === params.chainId,
    );
    if (!chain) {
      throw new Error('Unsupported chain');
    }

    const breakdown = params.transactions.map((tx) => {
      const txType = this.transactionTypes.find((t) => t.type === tx.type);
      if (!txType) {
        return null;
      }

      const gasLimit = txType.gasLimit * tx.count;
      const gasInEth = (chain.avgGasPrice / 1e9) * gasLimit;
      const estimatedUsd = gasInEth * this.ethPrice;

      return {
        name: tx.name,
        type: txType.description,
        count: tx.count,
        gasLimit: txType.gasLimit,
        estimatedGas: gasLimit,
        estimatedUsd,
        percentage: 0, // 稍后计算
      };
    }).filter(Boolean) as any[];

    const totalGas = breakdown.reduce((acc, b) => acc + b.estimatedGas, 0);
    const totalUsd = breakdown.reduce((acc, b) => acc + b.estimatedUsd, 0);

    breakdown.forEach((b) => {
      b.percentage = totalUsd > 0 ? (b.estimatedUsd / totalUsd) * 100 : 0;
    });

    return {
      breakdown: breakdown.sort((a, b) => b.estimatedUsd - a.estimatedUsd),
      total: {
        totalCount: params.transactions.reduce((acc, tx) => acc + tx.count, 0),
        totalGas,
        totalUsd,
      },
    };
  }

  async compareChains(params: {
    transactionType: string;
    count: number;
  }): Promise<{
    comparisons: Array<{
      chain: string;
      chainId: number;
      gasPrice: number;
      gasPriceUnit: string;
      estimatedGas: number;
      estimatedUsd: number;
      rank: number;
    }>;
    recommended: {
      chain: string;
      chainId: number;
      savings: number;
    };
  }> {
    const txType = this.transactionTypes.find(
      (t) => t.type === params.transactionType,
    );
    if (!txType) {
      throw new Error('Unsupported transaction type');
    }

    const comparisons = await Promise.all(
      this.supportedChains.map(async (chain) => {
        const gasLimit = txType.gasLimit * params.count;
        const gasInEth = (chain.avgGasPrice / 1e9) * gasLimit;
        const estimatedUsd = gasInEth * this.ethPrice;

        return {
          chain: chain.name,
          chainId: chain.chainId,
          gasPrice: chain.avgGasPrice,
          gasPriceUnit: chain.gasUnit,
          estimatedGas: gasLimit,
          estimatedUsd,
          rank: 0,
        };
      }),
    );

    // 按费用排序
    comparisons.sort((a, b) => a.estimatedUsd - b.estimatedUsd);

    // 设置排名
    comparisons.forEach((c, i) => {
      c.rank = i + 1;
    });

    const cheapest = comparisons[0];
    const expensive = comparisons[comparisons.length - 1];

    return {
      comparisons,
      recommended: {
        chain: cheapest.chain,
        chainId: cheapest.chainId,
        savings: expensive.estimatedUsd - cheapest.estimatedUsd,
      },
    };
  }

  async getGasSavingTips(): Promise<{
    tips: Array<{
      category: string;
      title: string;
      description: string;
      potentialSavings: string;
    }>;
  }> {
    return {
      tips: [
        {
          category: '时间',
          title: '选择低峰时段',
          description: '美国东部时间工作日下午2-6点（北京时间凌晨2-6点）Gas通常较低',
          potentialSavings: '20-40%',
        },
        {
          category: '链选择',
          title: '使用Layer2',
          description: 'Arbitrum、Optimism、Base等L2网络Gas费用比主网低90%以上',
          potentialSavings: '90%+',
        },
        {
          category: '交易类型',
          title: '批量交易',
          description: '将多笔交易合并可以减少总Gas支出',
          potentialSavings: '10-30%',
        },
        {
          category: '授权',
          title: '设置合理的授权额度',
          description: '避免无限授权，使用具体金额减少风险和Gas',
          potentialSavings: '5-15%',
        },
        {
          category: '工具',
          title: '使用Gas代币',
          description: '使用GLM、CHFG等Gas代币可以在高峰期节省费用',
          potentialSavings: '10-25%',
        },
        {
          category: 'DEX',
          title: '选择最佳兑换路径',
          description: '使用DEX聚合器选择最佳交易路径可以减少滑点和Gas',
          potentialSavings: '5-20%',
        },
      ],
    };
  }

  async calculateMonthlyBudget(params: {
    chainId: number;
    monthlyTransactions: Array<{
      type: string;
      countPerMonth: number;
    }>;
  }): Promise<{
    monthlyBudget: {
      estimatedUsd: number;
      estimatedEth: number;
      breakdown: any[];
    };
    yearlyBudget: {
      estimatedUsd: number;
      estimatedEth: number;
    };
    recommendations: string[];
  }> {
    const breakdown = await this.getBudgetBreakdown({
      chainId: params.chainId,
      transactions: params.monthlyTransactions.map((tx) => ({
        name: tx.type,
        type: tx.type,
        count: tx.countPerMonth,
      })),
    });

    const recommendations: string[] = [];
    
    // 基于月度预算生成建议
    if (breakdown.total.totalUsd > 500) {
      recommendations.push(
        '月度Gas支出较高，建议考虑使用L2网络或批量交易',
      );
    }

    // 检查是否应该切换链
    const comparisons = await this.compareChains({
      transactionType: params.monthlyTransactions[0]?.type || 'eth_transfer',
      count: 1,
    });
    if (comparisons.recommended.savings > 100) {
      recommendations.push(
        `使用 ${comparisons.recommended.chain} 可节省约 $${comparisons.recommended.savings.toFixed(2)}`,
      );
    }

    return {
      monthlyBudget: {
        estimatedUsd: breakdown.total.totalUsd,
        estimatedEth: breakdown.total.totalUsd / this.ethPrice,
        breakdown: breakdown.breakdown,
      },
      yearlyBudget: {
        estimatedUsd: breakdown.total.totalUsd * 12,
        estimatedEth: (breakdown.total.totalUsd * 12) / this.ethPrice,
      },
      recommendations,
    };
  }
}
