import { Injectable } from '@nestjs/common';

export interface GasEstimate {
  operation: string;
  protocol: string;
  chain: string;
  chainId: number;
  gasLimit: number;
  gasPrice: string;
  estimatedGasFee: string;
  estimatedGasFeeUsd: number;
  confidence: 'low' | 'medium' | 'high';
  historicalAvg: number;
  tips: string[];
}

export interface DefiOperation {
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'stake' | 'unstake' | 'borrow' | 'repay' | 'mint' | 'burn' | 'transfer' | 'approve' | 'vote' | 'delegate' | 'claim' | 'wrap' | 'unwrap';
  protocol: string;
  chainId: number;
  token0?: string;
  token1?: string;
  amount0?: string;
  amount1?: string;
}

@Injectable()
export class DefiGasEstimatorService {
  // Historical gas usage data for various operations
  private readonly gasEstimates: Record<string, { min: number; max: number; avg: number }> = {
    // Uniswap V3
    'uniswap-v3-swap': { min: 88000, max: 150000, avg: 110000 },
    'uniswap-v3-add-liquidity': { min: 150000, max: 350000, avg: 220000 },
    'uniswap-v3-remove-liquidity': { min: 120000, max: 280000, avg: 180000 },
    // Uniswap V2
    'uniswap-v2-swap': { min: 95000, max: 160000, avg: 120000 },
    'uniswap-v2-add-liquidity': { min: 170000, max: 380000, avg: 250000 },
    'uniswap-v2-remove-liquidity': { min: 130000, max: 300000, avg: 200000 },
    // Sushiswap
    'sushiswap-swap': { min: 95000, max: 165000, avg: 125000 },
    'sushiswap-add-liquidity': { min: 175000, max: 390000, avg: 260000 },
    'sushiswap-remove-liquidity': { min: 135000, max: 310000, avg: 210000 },
    // Aave
    'aave-borrow': { min: 180000, max: 280000, avg: 220000 },
    'aave-repay': { min: 160000, max: 260000, avg: 200000 },
    'aave-supply': { min: 170000, max: 270000, avg: 210000 },
    'aave-withdraw': { min: 180000, max: 280000, avg: 220000 },
    // Compound
    'compound-borrow': { min: 190000, max: 290000, avg: 230000 },
    'compound-repay': { min: 170000, max: 270000, avg: 210000 },
    'compound-supply': { min: 180000, max: 280000, avg: 220000 },
    'compound-withdraw': { min: 190000, max: 290000, avg: 230000 },
    // Curve
    'curve-swap': { min: 85000, max: 140000, avg: 105000 },
    'curve-add-liquidity': { min: 200000, max: 450000, avg: 300000 },
    'curve-remove-liquidity': { min: 180000, max: 400000, avg: 270000 },
    // Lido
    'lido-stake': { min: 90000, max: 140000, avg: 110000 },
    'lido-unstake': { min: 5000, max: 20000, avg: 10000 },
    // Rocket Pool
    'rocketpool-stake': { min: 130000, max: 200000, avg: 160000 },
    'rocketpool-unstake': { min: 8000, max: 25000, avg: 15000 },
    // ERC20
    'erc20-transfer': { min: 21000, max: 65000, avg: 35000 },
    'erc20-approve': { min: 45000, max: 70000, avg: 55000 },
    'erc20-transfer-from': { min: 45000, max: 100000, avg: 65000 },
    // NFT
    'erc721-transfer': { min: 55000, max: 85000, avg: 65000 },
    'erc721-mint': { min: 65000, max: 150000, avg: 90000 },
    'erc1155-transfer': { min: 35000, max: 70000, avg: 50000 },
    // Governance
    'governance-vote': { min: 100000, max: 200000, avg: 140000 },
    'governance-delegate': { min: 140000, max: 250000, avg: 180000 },
    'governance-claim': { min: 80000, max: 180000, avg: 120000 },
    // Generic
    'eth-transfer': { min: 21000, max: 25000, avg: 21000 },
    'contract-deployment': { min: 500000, max: 5000000, avg: 1500000 },
    'multicall': { min: 100000, max: 500000, avg: 250000 },
  };

  private readonly chainGasPrices: Record<number, { slow: string; normal: string; fast: string; baseFee: string }> = {
    1: { slow: '20', normal: '30', fast: '50', baseFee: '15' },      // Ethereum
    137: { slow: '30', normal: '50', fast: '80', baseFee: '25' },     // Polygon
    42161: { slow: '0.01', normal: '0.015', fast: '0.03', baseFee: '0.008' }, // Arbitrum
    10: { slow: '0.001', normal: '0.0015', fast: '0.003', baseFee: '0.0008' }, // Optimism
    56: { slow: '3', normal: '5', fast: '8', baseFee: '2' },           // BSC
    8453: { slow: '0.01', normal: '0.02', fast: '0.05', baseFee: '0.008' }, // Base
    43114: { slow: '25', normal: '35', fast: '50', baseFee: '20' },  // Avalanche
  };

  private readonly chainNativePrices: Record<number, number> = {
    1: 2850,
    137: 0.85,
    42161: 3.2,
    10: 3.5,
    56: 580,
    8453: 3.2,
    43114: 35,
  };

  private readonly chainNames: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    56: 'BSC',
    8453: 'Base',
    43114: 'Avalanche',
  };

  private readonly operationTips: Record<string, string[]> = {
    'swap': [
      'Use gas batching to combine multiple swaps',
      'Consider using Layer 2 for cheaper swaps',
      'Set appropriate slippage to avoid failed transactions'
    ],
    'add_liquidity': [
      'Add liquidity during low gas periods',
      'Consider concentrated liquidity for better yields',
      'Ensure price range is appropriate'
    ],
    'borrow': [
      'Maintain healthy collateral ratio to avoid liquidation',
      'Consider borrowing during low gas periods',
      'Monitor health factor closely'
    ],
    'stake': [
      'Stake during off-peak hours for lower gas',
      'Consider Lido or Rocket Pool for ETH staking',
      'Check for any stake bonus programs'
    ],
    'default': [
      'Consider executing during weekend for lower gas',
      'Use gas trackers to find optimal timing',
      'Batch multiple operations into one transaction'
    ]
  };

  async estimateGas(operation: string, protocol: string, chainId: number, speed: 'slow' | 'normal' | 'fast' = 'normal'): Promise<GasEstimate> {
    const key = `${protocol.toLowerCase()}-${operation.toLowerCase()}`;
    const estimate = this.gasEstimates[key] || this.gasEstimates['eth-transfer'];
    const gasPrices = this.chainGasPrices[chainId] || this.chainGasPrices[1];
    const nativePrice = this.chainNativePrices[chainId] || 2800;
    const chainName = this.chainNames[chainId] || 'Ethereum';

    const gasPrice = gasPrices[speed];
    const gasPriceWei = this.parseGwei(gasPrice);
    const gasLimit = estimate.avg;
    const estimatedFeeWei = BigInt(gasLimit) * gasPriceWei;
    const estimatedFeeEth = Number(estimatedFeeWei) / 1e18;
    const estimatedFeeUsd = estimatedFeeEth * nativePrice;

    // Determine confidence based on historical data range
    const range = estimate.max - estimate.min;
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    if (range / estimate.avg < 0.3) confidence = 'high';
    else if (range / estimate.avg > 0.6) confidence = 'low';

    // Get tips based on operation type
    const tips = this.operationTips[operation] || this.operationTips['default'];

    return {
      operation,
      protocol,
      chain: chainName,
      chainId,
      gasLimit: estimate.avg,
      gasPrice: `${gasPrice} Gwei`,
      estimatedGasFee: `${estimatedFeeEth.toFixed(6)} ETH`,
      estimatedGasFeeUsd: Math.round(estimatedFeeUsd * 100) / 100,
      confidence,
      historicalAvg: estimate.avg,
      tips
    };
  }

  async estimateMultipleOperations(operations: DefiOperation[], speed: 'slow' | 'normal' | 'fast' = 'normal'): Promise<GasEstimate[]> {
    const results: GasEstimate[] = [];
    for (const op of operations) {
      const result = await this.estimateGas(op.type, op.protocol, op.chainId, speed);
      results.push(result);
    }
    return results;
  }

  async getGasComparison(chainIds: number[], operation: string, protocol: string, speed: 'slow' | 'normal' | 'fast' = 'normal'): Promise<GasEstimate[]> {
    const results: GasEstimate[] = [];
    for (const chainId of chainIds) {
      const result = await this.estimateGas(operation, protocol, chainId, speed);
      results.push(result);
    }
    // Sort by USD cost
    results.sort((a, b) => a.estimatedGasFeeUsd - b.estimatedGasFeeUsd);
    return results;
  }

  getSupportedOperations(): { type: string; description: string; protocols: string[] }[] {
    return [
      { type: 'swap', description: 'Token swap', protocols: ['uniswap-v3', 'uniswap-v2', 'sushiswap', 'curve'] },
      { type: 'add_liquidity', description: 'Add liquidity to pool', protocols: ['uniswap-v3', 'uniswap-v2', 'sushiswap', 'curve'] },
      { type: 'remove_liquidity', description: 'Remove liquidity from pool', protocols: ['uniswap-v3', 'uniswap-v2', 'sushiswap', 'curve'] },
      { type: 'borrow', description: 'Borrow assets', protocols: ['aave', 'compound', 'morpho'] },
      { type: 'repay', description: 'Repay borrowed assets', protocols: ['aave', 'compound', 'morpho'] },
      { type: 'stake', description: 'Stake assets', protocols: ['lido', 'rocketpool', 'yearn'] },
      { type: 'unstake', description: 'Unstake assets', protocols: ['lido', 'rocketpool', 'yearn'] },
      { type: 'transfer', description: 'Transfer tokens', protocols: ['erc20', 'native'] },
      { type: 'approve', description: 'Approve token', protocols: ['erc20'] },
      { type: 'vote', description: 'Governance vote', protocols: ['governance'] },
      { type: 'delegate', description: 'Delegate voting power', protocols: ['governance'] },
      { type: 'claim', description: 'Claim rewards', protocols: ['governance', 'airdrop'] },
    ];
  }

  getSupportedChains(): { id: number; name: string; symbol: string }[] {
    return [
      { id: 1, name: 'Ethereum', symbol: 'ETH' },
      { id: 137, name: 'Polygon', symbol: 'MATIC' },
      { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
      { id: 10, name: 'Optimism', symbol: 'ETH' },
      { id: 56, name: 'BNB Chain', symbol: 'BNB' },
      { id: 8453, name: 'Base', symbol: 'ETH' },
      { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
    ];
  }

  private parseGwei(gweiStr: string): bigint {
    const gwei = parseFloat(gweiStr);
    return BigInt(Math.round(gwei * 1e9));
  }
}
