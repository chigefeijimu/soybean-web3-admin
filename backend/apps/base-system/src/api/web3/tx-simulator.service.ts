import { Injectable } from '@nestjs/common';

export interface TransactionSimulationRequest {
  from: string;
  to: string;
  value?: string;
  data?: string;
  chainId: number;
  gasLimit?: string;
}

export interface TransactionSimulationResult {
  success: boolean;
  simulation: {
    willSucceed: boolean;
    gasEstimate: string;
    gasUsed: string;
    gasPrice: string;
    totalCost: string;
    nonce: number;
    balance: string;
  };
  preview: {
    stateChanges: Record<string, string>;
    events: SimulationEvent[];
    tokenTransfers: TokenTransfer[];
    error?: string;
  };
  analysis: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    warnings: string[];
    recommendations: string[];
  };
  timestamp: number;
}

export interface SimulationEvent {
  name: string;
  address: string;
  params: Record<string, string>;
}

export interface TokenTransfer {
  from: string;
  to: string;
  token: string;
  amount: string;
}

export interface CallTrace {
  type: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  input: string;
  output?: string;
  calls?: CallTrace[];
}

@Injectable()
export class TxSimulatorService {
  // Supported chains
  private readonly supportedChains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 5, name: 'Goerli', symbol: 'ETH' },
    { id: 11155111, name: 'Sepolia', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 80001, name: 'Mumbai', symbol: 'MATIC' },
    { id: 42161, name: 'Arbitrum One', symbol: 'ETH' },
    { id: 42170, name: 'Arbitrum Nova', symbol: 'ETH' },
    { id: 421613, name: 'Arbitrum Goerli', symbol: 'ETH' },
    { id: 10, name: 'Optimism', symbol: 'ETH' },
    { id: 420, name: 'Optimism Goerli', symbol: 'ETH' },
    { id: 56, name: 'BSC', symbol: 'BNB' },
    { id: 97, name: 'BSC Testnet', symbol: 'BNB' },
    { id: 43114, name: 'Avalanche', symbol: 'AVAX' },
    { id: 43113, name: 'Avalanche Fuji', symbol: 'AVAX' },
    { id: 8453, name: 'Base', symbol: 'ETH' },
    { id: 84531, name: 'Base Goerli', symbol: 'ETH' },
  ];

  // Common contract method signatures for simulation
  private readonly methodSignatures: Record<string, string> = {
    '0xa9059cbb': 'transfer(address,uint256)',
    '0x23b872dd': 'transferFrom(address,address,uint256)',
    '0x095ea7b3': 'approve(address,uint256)',
    '0x6615c903': 'decreaseAllowance(address,uint256)',
    '0x2e1a7d4d': 'withdraw(uint256)',
    '0x3ccfd60b': 'withdraw()',
    '0x4e71d92d': 'claim()',
    '0xe9e5d502': 'claimRewards()',
    '0x4ce6e5f3': 'stake(uint256)',
    '0x2db1c52d': 'unstake(uint256)',
    '0xdf2ab5bb': 'mint(uint256)',
    '0x42966c68': 'mint()',
    '0x8c5a7355': 'mint(address)',
  };

  /**
   * Simulate a transaction
   */
  async simulateTransaction(
    request: TransactionSimulationRequest,
  ): Promise<TransactionSimulationResult> {
    const { from, to, value, data, chainId, gasLimit } = request;

    // Validate chain
    const chain = this.supportedChains.find(c => c.id === chainId);
    if (!chain) {
      return this.createErrorResult('Unsupported chain', chainId);
    }

    // Validate address format
    if (!this.isValidAddress(from) || !this.isValidAddress(to)) {
      return this.createErrorResult('Invalid address format', chainId);
    }

    // Generate simulation result
    const gasPrice = await this.getGasPrice(chainId);
    const estimatedGas = gasLimit || await this.estimateGas(chainId, data);
    const gasUsed = this.calculateGasUsed(estimatedGas);
    const totalCost = this.calculateTotalCost(gasPrice, gasUsed);
    const nonce = await this.getNonce(from, chainId);
    const balance = await this.getBalance(from, chainId);

    // Check if transaction will succeed
    const willSucceed = this.checkTransactionSuccess(balance, totalCost, value);
    
    // Parse method if data is provided
    const methodId = data ? data.slice(0, 10) : null;
    const methodName = methodId ? this.methodSignatures[methodId] || 'Unknown' : 'ETH Transfer';

    // Analyze risk
    const analysis = this.analyzeRisk(request, willSucceed, balance, totalCost, value);

    return {
      success: true,
      simulation: {
        willSucceed,
        gasEstimate: estimatedGas,
        gasUsed,
        gasPrice,
        totalCost,
        nonce,
        balance,
      },
      preview: this.generatePreview(from, to, value, data, methodName),
      analysis,
      timestamp: Date.now(),
    };
  }

  /**
   * Simulate multiple transactions in a batch
   */
  async simulateBatch(
    requests: TransactionSimulationRequest[],
  ): Promise<TransactionSimulationResult[]> {
    const results: TransactionSimulationResult[] = [];
    
    for (const request of requests) {
      const result = await this.simulateTransaction(request);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Simulate a swap transaction (Uniswap-like)
   */
  async simulateSwap(
    params: {
      chainId: number;
      from: string;
      tokenIn: string;
      tokenOut: string;
      amountIn: string;
      amountOutMin: string;
      recipient: string;
      deadline: number;
    },
  ): Promise<TransactionSimulationResult> {
    const { chainId, from, tokenIn, tokenOut, amountIn } = params;
    
    // Simulate swap data
    const path = [tokenIn, tokenOut];
    const amountOut = this.calculateSwapOutput(amountIn, tokenIn, tokenOut);
    
    // Build swap calldata
    const data = this.buildSwapCalldata(params);
    
    const request: TransactionSimulationRequest = {
      from,
      to: this.getSwapRouter(chainId),
      value: tokenIn === '0x0000000000000000000000000000000000000000' ? amountIn : '0',
      data,
      chainId,
      gasLimit: '200000',
    };

    return this.simulateTransaction(request);
  }

  /**
   * Simulate a contract deployment
   */
  async simulateDeployment(
    params: {
      chainId: number;
      from: string;
      bytecode: string;
      constructorArgs?: string;
    },
  ): Promise<TransactionSimulationResult> {
    const { chainId, from, bytecode, constructorArgs } = params;
    
    const chain = this.supportedChains.find(c => c.id === chainId);
    if (!chain) {
      return this.createErrorResult('Unsupported chain', chainId);
    }

    const gasPrice = await this.getGasPrice(chainId);
    const estimatedGas = this.estimateDeploymentGas(bytecode);
    const totalCost = this.calculateTotalCost(gasPrice, estimatedGas);
    const nonce = await this.getNonce(from, chainId);
    const balance = await this.getBalance(from, chainId);

    const willSucceed = this.checkDeploymentSuccess(balance, totalCost);

    return {
      success: true,
      simulation: {
        willSucceed,
        gasEstimate: estimatedGas,
        gasUsed: estimatedGas,
        gasPrice,
        totalCost,
        nonce,
        balance,
      },
      preview: {
        stateChanges: {},
        events: [
          {
            name: 'ContractDeployed',
            address: '0x0000000000000000000000000000000000000000',
            params: { bytecode: bytecode.slice(0, 20) + '...' },
          },
        ],
        tokenTransfers: [],
      },
      analysis: this.analyzeDeploymentRisk(bytecode, willSucceed, balance, totalCost),
      timestamp: Date.now(),
    };
  }

  /**
   * Get supported chains
   */
  getSupportedChains() {
    return this.supportedChains;
  }

  /**
   * Get gas recommendation for a transaction
   */
  async getGasRecommendation(
    chainId: number,
    urgency: 'low' | 'medium' | 'high' = 'medium',
  ): Promise<{ slow: string; standard: string; fast: string; urgent: string }> {
    const baseGasPrice = await this.getGasPrice(chainId);
    
    const multipliers = {
      low: 0.9,
      medium: 1.0,
      high: 1.2,
    };
    
    const multiplier = multipliers[urgency];
    
    return {
      slow: this.calculateGasPrice(baseGasPrice, 0.9),
      standard: baseGasPrice,
      fast: this.calculateGasPrice(baseGasPrice, 1.3),
      urgent: this.calculateGasPrice(baseGasPrice, 1.5),
    };
  }

  // Helper methods
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private async getGasPrice(chainId: number): Promise<string> {
    // Simulated gas prices based on chain
    const gasPrices: Record<number, string> = {
      1: '30000000000', // 30 Gwei
      5: '2000000000', // 2 Gwei
      11155111: '2000000000',
      137: '50000000000', // 50 Gwei
      80001: '1000000000',
      42161: '100000000', // 0.1 Gwei
      421613: '1000000000',
      10: '100000000', // 0.1 Gwei
      420: '1000000000',
      56: '5000000000', // 5 Gwei
      97: '10000000000',
      43114: '25000000000', // 25 Gwei
      43113: '30000000000',
      8453: '100000000', // 0.1 Gwei
      84531: '1000000000',
    };
    
    return gasPrices[chainId] || '20000000000';
  }

  private calculateGasPrice(base: string, multiplier: number): string {
    const baseNum = BigInt(base);
    const result = baseNum * BigInt(Math.floor(multiplier * 100)) / BigInt(100);
    return result.toString();
  }

  private async estimateGas(chainId: number, data?: string): Promise<string> {
    // Base gas for transaction
    let gas = 21000;
    
    // Add gas for data
    if (data) {
      gas += Math.floor(data.length / 2) * 68; // Non-zero bytes
      gas += Math.floor(data.length / 2) * 4; // Zero bytes
    }
    
    // Add buffer
    gas = Math.floor(gas * 1.2);
    
    return gas.toString();
  }

  private estimateDeploymentGas(bytecode: string): string {
    const byteCount = Math.floor(bytecode.length / 2);
    const gas = 20000 + byteCount * 200;
    return gas.toString();
  }

  private calculateGasUsed(estimate: string): string {
    const buffer = BigInt(estimate) * BigInt(120) / BigInt(100);
    return buffer.toString();
  }

  private calculateTotalCost(gasPrice: string, gasUsed: string): string {
    const cost = BigInt(gasPrice) * BigInt(gasUsed);
    return cost.toString();
  }

  private async getNonce(address: string, chainId: number): Promise<number> {
    // Simulated nonce - in production would fetch from chain
    return Math.floor(Math.random() * 100);
  }

  private async getBalance(address: string, chainId: number): Promise<string> {
    // Simulated balance - in production would fetch from chain
    return (BigInt(1e18) * BigInt(Math.floor(Math.random() * 100))).toString();
  }

  private checkTransactionSuccess(
    balance: string,
    totalCost: string,
    value?: string,
  ): boolean {
    const valueNum = BigInt(value || '0');
    return BigInt(balance) >= (BigInt(totalCost) + valueNum);
  }

  private checkDeploymentSuccess(balance: string, totalCost: string): boolean {
    return BigInt(balance) >= BigInt(totalCost);
  }

  private analyzeRisk(
    request: TransactionSimulationRequest,
    willSucceed: boolean,
    balance: string,
    totalCost: string,
    value?: string,
  ): TransactionSimulationResult['analysis'] {
    const riskFactors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check if transaction will succeed
    if (!willSucceed) {
      riskLevel = 'critical';
      riskFactors.push('Insufficient balance for transaction');
      recommendations.push('Add more funds to wallet');
    }

    // Check value transfer
    if (value && BigInt(value) > BigInt(0)) {
      const valueRatio = Number(BigInt(value)) / Number(BigInt(balance));
      if (valueRatio > 0.9) {
        riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
        riskFactors.push('Large value transfer (>90% of balance)');
        warnings.push('Consider transferring smaller amounts');
      }
    }

    // Check contract interaction
    if (request.data && request.data !== '0x') {
      const methodId = request.data.slice(0, 10);
      if (methodId === '0x') {
        riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
        warnings.push('Contract interaction detected');
      }
    }

    // Check gas price
    const gasPrice = BigInt(request.chainId === 1 ? '30000000000' : '20000000000');
    if (BigInt(request.gasLimit || '21000') < BigInt('21000')) {
      warnings.push('Gas limit may be too low');
      recommendations.push('Increase gas limit to prevent out-of-gas');
    }

    // Add general recommendations
    if (riskLevel === 'low') {
      recommendations.push('Transaction looks safe to proceed');
    }

    return {
      riskLevel,
      riskFactors,
      warnings,
      recommendations,
    };
  }

  private analyzeDeploymentRisk(
    bytecode: string,
    willSucceed: boolean,
    balance: string,
    totalCost: string,
  ): TransactionSimulationResult['analysis'] {
    const riskFactors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';

    if (!willSucceed) {
      riskLevel = 'critical';
      riskFactors.push('Insufficient balance for deployment');
      recommendations.push('Add more ETH for deployment');
    }

    // Check bytecode size
    const byteSize = bytecode.length / 2;
    if (byteSize > 24000) {
      warnings.push('Large contract size - deployment may be expensive');
      recommendations.push('Consider optimizing contract size');
    }

    // Check for initialization
    if (!bytecode.includes('60806040')) {
      warnings.push('Contract may not have proper initialization');
    }

    return {
      riskLevel,
      riskFactors,
      warnings,
      recommendations,
    };
  }

  private generatePreview(
    from: string,
    to: string,
    value?: string,
    data?: string,
    methodName?: string,
  ): TransactionSimulationResult['preview'] {
    const events: SimulationEvent[] = [];
    const tokenTransfers: TokenTransfer[] = [];

    // Add transfer event if value > 0
    if (value && BigInt(value) > BigInt(0)) {
      events.push({
        name: 'Transfer',
        address: to,
        params: { from, to, value },
      });
    }

    // Parse token transfer from data
    if (data) {
      const methodId = data.slice(0, 10);
      
      // ERC20 Transfer
      if (methodId === '0xa9059cbb') {
        const toAddress = '0x' + data.slice(34, 74);
        const amount = data.slice(74);
        tokenTransfers.push({
          from,
          to: toAddress,
          token: to,
          amount: BigInt('0x' + amount).toString(),
        });
        events.push({
          name: 'Transfer',
          address: to,
          params: { from, to: toAddress, amount },
        });
      }
      
      // ERC20 TransferFrom
      else if (methodId === '0x23b872dd') {
        const fromAddress = '0x' + data.slice(34, 74);
        const toAddress = '0x' + data.slice(74, 114);
        const amount = data.slice(114);
        tokenTransfers.push({
          from: fromAddress,
          to: toAddress,
          token: to,
          amount: BigInt('0x' + amount).toString(),
        });
      }
      
      // ERC20 Approve
      else if (methodId === '0x095ea7b3') {
        events.push({
          name: 'Approval',
          address: to,
          params: { owner: from, spender: '0x' + data.slice(34, 74), value: data.slice(74) },
        });
      }
    }

    return {
      stateChanges: {
        [`${from}_nonce`]: '+1',
        [`${to}_balance_change`]: value ? '+' + value : 'unchanged',
      },
      events,
      tokenTransfers,
    };
  }

  private calculateSwapOutput(amountIn: string, tokenIn: string, tokenOut: string): string {
    // Simulated swap calculation - in production would use actual DEX data
    const rate = 1 + Math.random() * 0.05; // 0-5% slippage
    return (BigInt(amountIn) * BigInt(Math.floor(rate * 1000)) / BigInt(1000)).toString();
  }

  private buildSwapCalldata(params: any): string {
    // Build Uniswap V3 swap calldata
    const { tokenIn, tokenOut, amountIn, amountOutMin, recipient, deadline } = params;
    // Simplified - actual implementation would use exact encoding
    return '0x04e45aaf000000000000000000000000' + 
      tokenIn.slice(2) + 
      tokenOut.slice(2) +
      amountIn +
      amountOutMin +
      recipient.slice(2) +
      deadline.toString(16);
  }

  private getSwapRouter(chainId: number): string {
    const routers: Record<number, string> = {
      1: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3
      137: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      42161: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      10: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      56: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap
      43114: '0xE54Ca86531e17Ef3616d22Ca28b0D86bC2b5f887', // Trader Joe
      8453: '0x2626664c2603336E57B271c5C0b26F421741e4bA', // Base Swap
    };
    return routers[chainId] || '0x0000000000000000000000000000000000000000';
  }

  private createErrorResult(error: string, chainId: number): TransactionSimulationResult {
    return {
      success: false,
      simulation: {
        willSucceed: false,
        gasEstimate: '0',
        gasUsed: '0',
        gasPrice: '0',
        totalCost: '0',
        nonce: 0,
        balance: '0',
      },
      preview: {
        stateChanges: {},
        events: [],
        tokenTransfers: [],
        error,
      },
      analysis: {
        riskLevel: 'critical',
        riskFactors: [error],
        warnings: [],
        recommendations: ['Check input parameters'],
      },
      timestamp: Date.now(),
    };
  }
}
