export interface GasPredictionRequest {
  chain: string;
  timeframe?: string; // 1h, 4h, 12h, 24h
}

export interface GasComparisonRequest {
  chains?: string[];
  txType?: string;
}

export interface GasSavingRequest {
  fromChain: string;
  toChain?: string;
  txType: string;
  gasAmount?: number;
}

export interface GasPrice {
  chain: string;
  chainId: number;
  slow: number;
  normal: number;
  fast: number;
  unit: string;
  lastUpdated: number;
}

export interface GasPrediction {
  chain: string;
  current: number;
  prediction: {
    '1h': { price: number; trend: string; confidence: number };
    '4h': { price: number; trend: string; confidence: number };
    '12h': { price: number; trend: string; confidence: number };
    '24h': { price: number; trend: string; confidence: number };
  };
  bestTimeToTransact: {
    time: string;
    avgPrice: number;
    savings: number;
  };
  recommendation: string;
}

export interface ChainInfo {
  id: number;
  name: string;
  symbol: string;
  color: string;
  avgGasPrice: number;
  lastGasPrice: number;
}

export class GasOptimizerService {
  private chains: ChainInfo[] = [
    { id: 1, name: 'Ethereum', symbol: 'ETH', color: '#627EEA', avgGasPrice: 30, lastGasPrice: 0 },
    { id: 137, name: 'Polygon', symbol: 'MATIC', color: '#8247E5', avgGasPrice: 50, lastGasPrice: 0 },
    { id: 42161, name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0', avgGasPrice: 0.1, lastGasPrice: 0 },
    { id: 10, name: 'Optimism', symbol: 'ETH', color: '#FF0420', avgGasPrice: 0.001, lastGasPrice: 0 },
    { id: 56, name: 'BSC', symbol: 'BNB', color: '#F3BA2F', avgGasPrice: 5, lastGasPrice: 0 },
    { id: 8453, name: 'Base', symbol: 'ETH', color: '#0052FF', avgGasPrice: 0.001, lastGasPrice: 0 },
    { id: 43114, name: 'Avalanche', symbol: 'AVAX', color: '#E84142', avgGasPrice: 25, lastGasPrice: 0 },
  ];

  // Simulated real-time gas prices (in Gwei for L2s, native unit for others)
  private generateGasPrice(chainId: number): number {
    const basePrices: { [key: number]: number } = {
      1: 20 + Math.random() * 30, // Ethereum: 20-50 Gwei
      137: 40 + Math.random() * 60, // Polygon: 40-100 Gwei
      42161: 0.05 + Math.random() * 0.15, // Arbitrum: 0.05-0.2 Gwei
      10: 0.001 + Math.random() * 0.002, // Optimism: 0.001-0.003 Gwei
      56: 3 + Math.random() * 5, // BSC: 3-8 Gwei
      8453: 0.001 + Math.random() * 0.003, // Base: 0.001-0.004 Gwei
      43114: 20 + Math.random() * 30, // Avalanche: 20-50 nAVAX
    };
    return basePrices[chainId] || 10;
  }

  async getGasPrices(chains?: string[]): Promise<GasPrice[]> {
    const results: GasPrice[] = [];
    const targetChains = chains || this.chains.map(c => c.name.toLowerCase());

    for (const chain of this.chains) {
      if (targetChains.includes(chain.name.toLowerCase()) || targetChains.includes(chain.symbol.toLowerCase())) {
        const gasPrice = this.generateGasPrice(chain.id);
        chain.lastGasPrice = gasPrice;
        
        // Calculate slow/normal/fast multipliers
        const slowMultiplier = 0.8;
        const fastMultiplier = 1.3;
        
        results.push({
          chain: chain.name,
          chainId: chain.id,
          slow: Math.round(gasPrice * slowMultiplier * 100) / 100,
          normal: Math.round(gasPrice * 100) / 100,
          fast: Math.round(gasPrice * fastMultiplier * 100) / 100,
          unit: chain.id === 1 || chain.id === 42161 || chain.id === 10 || chain.id === 8453 ? 'Gwei' : 'nAVAX',
          lastUpdated: Date.now(),
        });
      }
    }

    return results;
  }

  async predictGasPrice(request: GasPredictionRequest): Promise<GasPrediction> {
    const chain = this.chains.find(c => c.name.toLowerCase() === request.chain.toLowerCase());
    if (!chain) {
      throw new Error(`Chain ${request.chain} not supported`);
    }

    const currentPrice = this.generateGasPrice(chain.id);
    const timeframe = request.timeframe || '4h';

    // Simulate prediction with some randomness
    const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
    const fluctuation = (Math.random() - 0.5) * 0.3; // -15% to +15%

    const getPredictedPrice = (hours: number): number => {
      const baseChange = trend === 'up' ? 0.1 : trend === 'down' ? -0.1 : 0;
      return currentPrice * (1 + baseChange * (hours / 24) + fluctuation * (hours / 24));
    };

    const prediction = {
      '1h': {
        price: Math.round(getPredictedPrice(1) * 100) / 100,
        trend: trend,
        confidence: 85 + Math.random() * 10,
      },
      '4h': {
        price: Math.round(getPredictedPrice(4) * 100) / 100,
        trend: trend,
        confidence: 75 + Math.random() * 10,
      },
      '12h': {
        price: Math.round(getPredictedPrice(12) * 100) / 100,
        trend: trend,
        confidence: 65 + Math.random() * 10,
      },
      '24h': {
        price: Math.round(getPredictedPrice(24) * 100) / 100,
        trend: trend,
        confidence: 55 + Math.random() * 15,
      },
    };

    // Best time to transact (simulated)
    const hourOfDay = new Date().getHours();
    const isOffPeak = hourOfDay >= 23 || hourOfDay <= 6;
    const bestTime = isOffPeak ? 'Now (Off-peak hours)' : '22:00 - 06:00 UTC';
    const savings = isOffPeak ? 20 + Math.random() * 20 : 0;

    let recommendation = '';
    if (trend === 'up') {
      recommendation = currentPrice < chain.avgGasPrice 
        ? 'Current gas is below average. Consider transacting now before prices rise.'
        : 'Gas prices are rising. Wait for prices to stabilize or consider using L2 networks.';
    } else if (trend === 'down') {
      recommendation = 'Gas prices are expected to drop. Consider waiting for better rates.';
    } else {
      recommendation = 'Gas prices are stable. Current rates are acceptable for transactions.';
    }

    return {
      chain: chain.name,
      current: Math.round(currentPrice * 100) / 100,
      prediction,
      bestTimeToTransact: {
        time: bestTime,
        avgPrice: Math.round(chain.avgGasPrice * 100) / 100,
        savings: Math.round(savings),
      },
      recommendation,
    };
  }

  async compareGasPrices(request: GasComparisonRequest): Promise<any> {
    const chains = request.chains || this.chains.map(c => c.name);
    const txType = request.txType || 'transfer';
    
    const gasPrices = await this.getGasPrices(chains as string[]);
    
    // Sort by price
    const sorted = [...gasPrices].sort((a, b) => a.normal - b.normal);
    
    // Calculate estimated fees for different transaction types
    const txGasUnits: { [key: string]: number } = {
      transfer: 21000,
      erc20_transfer: 65000,
      swap: 150000,
      nft_transfer: 85000,
      contract_deploy: 2000000,
    };
    
    const gasUnits = txGasUnits[txType] || 21000;
    
    const comparisons = sorted.map((price, index) => {
      const priceInEth = price.normal / (price.chainId === 1 || price.chainId === 42161 || price.chainId === 10 || price.chainId === 8453 ? 1e9 : 1e9);
      const fee = gasUnits * priceInEth;
      
      return {
        rank: index + 1,
        chain: price.chain,
        chainId: price.chainId,
        gasPrice: price.normal,
        unit: price.unit,
        estimatedFee: {
          eth: fee,
          usd: fee * 2500, // Assuming ETH price
        },
        savings: index > 0 ? {
          vsMostExpensive: Math.round((1 - fee / (sorted[ sorted.length - 1].normal / 1e9 * gasUnits * 2500)) * 100),
          vsNextCheapest: Math.round((1 - fee / (sorted[index - 1]?.normal / 1e9 * gasUnits * 2500 || fee)) * 100),
        } : null,
      };
    });

    return {
      transactionType: txType,
      gasUnits,
      prices: comparisons,
      recommendation: {
        cheapestChain: sorted[0].chain,
        cheapestFee: comparisons[0].estimatedFee,
        potentialSavings: sorted.length > 1 ? {
          amount: comparisons[comparisons.length - 1].estimatedFee.eth - comparisons[0].estimatedFee.eth,
          percentage: Math.round((1 - comparisons[0].estimatedFee.eth / comparisons[comparisons.length - 1].estimatedFee.eth) * 100),
        } : null,
      },
    };
  }

  async getGasSavings(request: GasSavingRequest): Promise<any> {
    const fromChain = this.chains.find(c => c.name.toLowerCase() === request.fromChain.toLowerCase());
    const toChain = request.toChain 
      ? this.chains.find(c => c.name.toLowerCase() === request.toChain.toLowerCase())
      : null;

    if (!fromChain) {
      throw new Error(`Chain ${request.fromChain} not supported`);
    }

    const fromPrice = this.generateGasPrice(fromChain.id);
    const gasAmount = request.gasAmount || 21000;

    const txGasUnits: { [key: string]: number } = {
      transfer: 21000,
      erc20_transfer: 65000,
      swap: 150000,
      nft_transfer: 85000,
      contract_deploy: 2000000,
    };
    const gasUnits = txGasUnits[request.txType] || 21000;

    const fromFee = (gasAmount || gasUnits) * (fromPrice / 1e9);

    let results = [];
    
    if (toChain) {
      const toPrice = this.generateGasPrice(toChain.id);
      const toFee = (gasAmount || gasUnits) * (toPrice / 1e9);
      
      results.push({
        chain: toChain.name,
        chainId: toChain.id,
        gasPrice: toPrice,
        estimatedFee: {
          eth: toFee,
          usd: toFee * 2500,
        },
        savings: {
          eth: fromFee - toFee,
          usd: (fromFee - toFee) * 2500,
          percentage: Math.round((fromFee - toFee) / fromFee * 100),
        },
      });
    } else {
      // Compare all other chains
      for (const chain of this.chains) {
        if (chain.id === fromChain.id) continue;
        
        const price = this.generateGasPrice(chain.id);
        const fee = (gasAmount || gasUnits) * (price / 1e9);
        
        results.push({
          chain: chain.name,
          chainId: chain.id,
          gasPrice: price,
          estimatedFee: {
            eth: fee,
            usd: fee * 2500,
          },
          savings: {
            eth: fromFee - fee,
            usd: (fromFee - fee) * 2500,
            percentage: Math.round((fromFee - fee) / fromFee * 100),
          },
        });
      }
    }

    // Sort by savings
    results.sort((a, b) => b.savings.percentage - a.savings.percentage);

    return {
      fromChain: fromChain.name,
      fromFee: {
        eth: fromFee,
        usd: fromFee * 2500,
      },
      transactionType: request.txType,
      gasUnits: gasAmount || gasUnits,
      alternatives: results,
      bestOption: results[0],
    };
  }

  async getBestTimeToTransact(chain?: string): Promise<any> {
    const targetChain = chain 
      ? this.chains.find(c => c.name.toLowerCase() === chain.toLowerCase())
      : null;

    const chains = targetChain ? [targetChain] : this.chains;

    const results = chains.map(chain => {
      // Simulate hourly gas prices
      const hourlyPrices = [];
      for (let hour = 0; hour < 24; hour++) {
        // Simulate typical daily pattern: lower during off-peak (night), higher during peak (afternoon)
        const hourFactor = hour >= 14 && hour <= 20 ? 1.3 : hour >= 22 || hour <= 5 ? 0.7 : 1;
        const basePrice = this.generateGasPrice(chain.id);
        hourlyPrices.push({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          price: Math.round(basePrice * hourFactor * 100) / 100,
        });
      }

      // Find best time
      const sortedByPrice = [...hourlyPrices].sort((a, b) => a.price - b.price);
      const bestHour = sortedByPrice[0];
      const worstHour = sortedByPrice[sortedByPrice.length - 1];

      return {
        chain: chain.name,
        chainId: chain.id,
        currentHour: new Date().getUTCHours(),
        bestTimeToTransact: bestHour.hour,
        worstTimeToTransact: worstHour.hour,
        avgPrice: Math.round(hourlyPrices.reduce((sum, h) => sum + h.price, 0) / 24 * 100) / 100,
        potentialSavings: Math.round((worstHour.price - bestHour.price) / worstHour.price * 100),
        hourlyPrices,
      };
    });

    return {
      currentTime: new Date().toISOString(),
      timezone: 'UTC',
      recommendations: results,
      globalBestTime: results.reduce((best, current) => 
        current.avgPrice < best.avgPrice ? current : best
      ),
    };
  }

  async getGasHistory(chain: string, range: string): Promise<any> {
    const targetChain = this.chains.find(c => c.name.toLowerCase() === chain.toLowerCase());
    if (!targetChain) {
      throw new Error(`Chain ${chain} not supported`);
    }

    const rangeHours: { [key: string]: number } = {
      '24h': 24,
      '7d': 168,
      '30d': 720,
    };
    const hours = rangeHours[range] || 24;

    const dataPoints = [];
    const now = Date.now();
    const interval = (hours * 60 * 60 * 1000) / 48; // 48 data points

    for (let i = 48; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const hourOfDay = new Date(timestamp).getUTCHours();
      const hourFactor = hourOfDay >= 14 && hourOfDay <= 20 ? 1.2 : hourOfDay >= 22 || hourOfDay <= 5 ? 0.8 : 1;
      const basePrice = this.generateGasPrice(targetChain.id);
      
      dataPoints.push({
        timestamp,
        date: new Date(timestamp).toISOString(),
        price: Math.round(basePrice * hourFactor * 100) / 100,
      });
    }

    const prices = dataPoints.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    return {
      chain: targetChain.name,
      chainId: targetChain.id,
      range,
      dataPoints: dataPoints,
      statistics: {
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        change: Math.round((dataPoints[dataPoints.length - 1].price - dataPoints[0].price) / dataPoints[0].price * 100),
      },
    };
  }

  async getFeeEstimates(chain: string, txType?: string): Promise<any> {
    const targetChain = this.chains.find(c => c.name.toLowerCase() === chain.toLowerCase());
    if (!targetChain) {
      throw new Error(`Chain ${chain} not supported`);
    }

    const gasPrice = this.generateGasPrice(targetChain.id);

    const txTypes: { [key: string]: { gas: number; description: string } } = {
      eth_transfer: { gas: 21000, description: 'ETH Transfer' },
      erc20_transfer: { gas: 65000, description: 'ERC20 Token Transfer' },
      erc20_approve: { gas: 46000, description: 'ERC20 Approve' },
      swap: { gas: 150000, description: 'DEX Swap' },
      nft_mint: { gas: 120000, description: 'NFT Mint' },
      nft_transfer: { gas: 85000, description: 'NFT Transfer' },
      add_liquidity: { gas: 200000, description: 'Add Liquidity' },
      remove_liquidity: { gas: 180000, description: 'Remove Liquidity' },
      contract_deploy: { gas: 2000000, description: 'Deploy Contract' },
      multisig: { gas: 120000, description: 'Multisig Transaction' },
    };

    const types = txType ? { [txType]: txTypes[txType] } : txTypes;

    const estimates = Object.entries(types).map(([type, info]) => {
      const gasInEth = (info.gas * gasPrice) / 1e9;
      
      return {
        type,
        description: info.description,
        gasLimit: info.gas,
        gasPrice: {
          slow: Math.round(gasPrice * 0.8 * 100) / 100,
          normal: Math.round(gasPrice * 100) / 100,
          fast: Math.round(gasPrice * 1.3 * 100) / 100,
        },
        estimatedFee: {
          slow: {
            eth: Math.round(gasInEth * 0.8 * 10000) / 10000,
            usd: Math.round(gasInEth * 0.8 * 2500 * 100) / 100,
          },
          normal: {
            eth: Math.round(gasInEth * 10000) / 10000,
            usd: Math.round(gasInEth * 2500 * 100) / 100,
          },
          fast: {
            eth: Math.round(gasInEth * 1.3 * 10000) / 10000,
            usd: Math.round(gasInEth * 1.3 * 2500 * 100) / 100,
          },
        },
      };
    });

    return {
      chain: targetChain.name,
      chainId: targetChain.id,
      unit: targetChain.id === 1 || targetChain.id === 42161 || targetChain.id === 10 || targetChain.id === 8453 ? 'Gwei' : 'nAVAX',
      currentGasPrice: Math.round(gasPrice * 100) / 100,
      transactionTypes: estimates,
    };
  }

  getSupportedChains(): ChainInfo[] {
    return this.chains;
  }
}
