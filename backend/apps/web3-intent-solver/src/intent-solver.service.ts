import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export type IntentType = 'swap' | 'bridge' | 'cross_chain_swap' | 'limit_order' | 'aggregate';
export type IntentStatus = 'pending' | 'solving' | 'solved' | 'executing' | 'completed' | 'failed' | 'expired';
export type SolverType = 'uniswapx' | 'across' | 'cowswap' | '1inch' | 'paraswap' | 'odos' | 'native_bridge';

export interface Intent {
  id: string;
  user: string;
  type: IntentType;
  fromChain: string;
  toChain?: string;
  fromToken: string;
  toToken: string;
  amount: string;
  minOutput?: string;
  recipient?: string;
  deadline?: number;
  constraints?: IntentConstraints;
  createdAt: string;
  status: IntentStatus;
}

export interface IntentConstraints {
  maxSlippage?: number;
  maxGasFee?: string;
  deadline?: number;
  fillDeadline?: number;
  bribe?: string;
  allowPartialFill?: boolean;
  allowCrossChainExecutor?: boolean;
}

export interface SolverQuote {
  solver: SolverType;
  outputAmount: string;
  outputAmountUSD: number;
  gasEstimate: string;
  gasEstimateUSD: number;
  totalCostUSD: number;
  estimatedTime: number;
  confidence: number;
  fillPercent: number;
  route?: string[];
  callData?: string;
  approvalToken?: string;
  approvalAmount?: string;
}

export interface IntentSolution {
  intentId: string;
  quotes: SolverQuote[];
  bestQuote: SolverQuote;
  recommendedSolver: SolverType;
  savingsVsDirect: number;
  savingsPercent: number;
  expirationTime: number;
  executionSteps: ExecutionStep[];
}

export interface ExecutionStep {
  step: number;
  action: 'approve' | 'swap' | 'bridge' | 'transfer';
  protocol: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  chain: string;
  gasEstimate: string;
}

export interface IntentStats {
  totalIntents: number;
  solvedIntents: number;
  completedIntents: number;
  failedIntents: number;
  avgSolveTime: number;
  avgSlippage: number;
  topSolvers: { solver: string; count: number; volume: number }[];
}

@Injectable()
export class IntentSolverService {
  private intents: Map<string, Intent> = new Map();
  private solutions: Map<string, IntentSolution> = new Map();

  constructor(private readonly httpService: HttpService) {}

  /**
   * Submit a new intent for solving
   */
  async submitIntent(
    user: string,
    type: IntentType,
    fromChain: string,
    toChain: string | undefined,
    fromToken: string,
    toToken: string,
    amount: string,
    constraints?: IntentConstraints,
  ): Promise<Intent> {
    const intent: Intent = {
      id: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user,
      type,
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      minOutput: constraints?.maxSlippage ? await this.calculateMinOutput(amount, constraints.maxSlippage) : undefined,
      constraints,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.intents.set(intent.id, intent);
    
    // Trigger async solving
    this.solveIntent(intent.id).catch(console.error);
    
    return intent;
  }

  /**
   * Get quotes from multiple solvers for an intent
   */
  async solveIntent(intentId: string): Promise<IntentSolution | null> {
    const intent = this.intents.get(intentId);
    if (!intent) return null;

    intent.status = 'solving';
    this.intents.set(intentId, intent);

    const quotes = await this.getSolverQuotes(intent);
    
    // Sort by output amount (best first)
    quotes.sort((a, b) => parseFloat(b.outputAmount) - parseFloat(a.outputAmount));
    
    const bestQuote = quotes[0];
    const worstQuote = quotes[quotes.length - 1];
    const savings = parseFloat(worstQuote.outputAmount) - parseFloat(bestQuote.outputAmount);
    const savingsPercent = (savings / parseFloat(worstQuote.outputAmount)) * 100;

    const solution: IntentSolution = {
      intentId,
      quotes,
      bestQuote,
      recommendedSolver: bestQuote.solver,
      savingsVsDirect: savings,
      savingsPercent,
      expirationTime: Date.now() + 5 * 60 * 1000, // 5 minutes
      executionSteps: this.generateExecutionSteps(intent, bestQuote),
    };

    this.solutions.set(intentId, solution);
    
    intent.status = 'solved';
    this.intents.set(intentId, intent);

    return solution;
  }

  /**
   * Get quotes from multiple solvers
   */
  private async getSolverQuotes(intent: Intent): Promise<SolverQuote[]> {
    const solvers: SolverType[] = ['uniswapx', 'across', 'cowswap', '1inch', 'paraswap', 'odos'];
    const quotes: SolverQuote[] = [];

    // Simulate quotes from different solvers
    for (const solver of solvers) {
      const quote = await this.getSolverQuote(intent, solver);
      if (quote) quotes.push(quote);
    }

    // Add native bridge quote for cross-chain
    if (intent.toChain && intent.fromChain !== intent.toChain) {
      const nativeQuote = await this.getNativeBridgeQuote(intent);
      if (nativeQuote) quotes.push(nativeQuote);
    }

    return quotes;
  }

  /**
   * Get quote from a specific solver
   */
  private async getSolverQuote(intent: Intent, solver: SolverType): Promise<SolverQuote | null> {
    const baseOutput = parseFloat(intent.amount);
    
    // Simulate different outputs from different solvers
    const multipliers: Record<SolverType, number> = {
      uniswapx: 0.985,
      across: 0.982,
      cowswap: 0.980,
      '1inch': 0.978,
      paraswap: 0.976,
      odos: 0.974,
      native_bridge: 0.970,
    };

    const multiplier = multipliers[solver] || 0.95;
    const outputAmount = baseOutput * multiplier;
    const gasEstimate = (Math.random() * 0.002 + 0.001).toFixed(6);
    const gasPriceUSD = parseFloat(gasEstimate) * 2000; // Assume ETH $2000
    
    const outputUSD = outputAmount * this.getTokenPrice(intent.toToken);
    const confidence = 0.85 + Math.random() * 0.14;
    const fillPercent = 95 + Math.random() * 5;

    return {
      solver,
      outputAmount: outputAmount.toFixed(6),
      outputAmountUSD: outputUSD,
      gasEstimate,
      gasEstimateUSD: gasPriceUSD,
      totalCostUSD: outputUSD + gasPriceUSD,
      estimatedTime: this.getEstimatedTime(solver),
      confidence,
      fillPercent,
      route: this.generateRoute(intent, solver),
    };
  }

  /**
   * Get native bridge quote
   */
  private async getNativeBridgeQuote(intent: Intent): Promise<SolverQuote | null> {
    const baseOutput = parseFloat(intent.amount);
    const outputAmount = baseOutput * 0.95; // Lower efficiency for native bridge
    const gasEstimate = (Math.random() * 0.005 + 0.003).toFixed(6);
    const gasPriceUSD = parseFloat(gasEstimate) * 2000;

    return {
      solver: 'native_bridge',
      outputAmount: outputAmount.toFixed(6),
      outputAmountUSD: outputAmount * this.getTokenPrice(intent.toToken),
      gasEstimate,
      gasEstimateUSD: gasPriceUSD,
      totalCostUSD: outputAmount * this.getTokenPrice(intent.toToken) + gasPriceUSD,
      estimatedTime: 15 * 60, // 15 minutes
      confidence: 0.95,
      fillPercent: 99,
      route: [intent.fromChain, 'Bridge', intent.toChain!],
    };
  }

  /**
   * Execute an intent with a specific solver
   */
  async executeIntent(intentId: string, solver: SolverType): Promise<{ txHash: string; status: string }> {
    const intent = this.intents.get(intentId);
    const solution = this.solutions.get(intentId);
    
    if (!intent || !solution) {
      throw new Error('Intent or solution not found');
    }

    const selectedQuote = solution.quotes.find(q => q.solver === solver);
    if (!selectedQuote) {
      throw new Error('Solver not available for this intent');
    }

    intent.status = 'executing';
    this.intents.set(intentId, intent);

    // Simulate execution
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    // Simulate async completion
    setTimeout(() => {
      if (intent.status === 'executing') {
        intent.status = 'completed';
        this.intents.set(intentId, intent);
      }
    }, 5000);

    return {
      txHash,
      status: 'submitted',
    };
  }

  /**
   * Get intent status
   */
  async getIntentStatus(intentId: string): Promise<Intent | null> {
    return this.intents.get(intentId) || null;
  }

  /**
   * Get solution for an intent
   */
  async getSolution(intentId: string): Promise<IntentSolution | null> {
    return this.solutions.get(intentId) || null;
  }

  /**
   * Get all intents for a user
   */
  async getUserIntents(user: string): Promise<Intent[]> {
    return Array.from(this.intents.values()).filter(i => i.user === user);
  }

  /**
   * Get solver statistics
   */
  async getStats(): Promise<IntentStats> {
    const intents = Array.from(this.intents.values());
    
    const solverUsage: Record<string, { count: number; volume: number }> = {};
    
    for (const [, solution] of this.solutions) {
      const solver = solution.bestQuote.solver;
      if (!solverUsage[solver]) {
        solverUsage[solver] = { count: 0, volume: 0 };
      }
      solverUsage[solver].count++;
      solverUsage[solver].volume += solution.bestQuote.outputAmountUSD;
    }

    return {
      totalIntents: intents.length,
      solvedIntents: intents.filter(i => i.status === 'solved').length,
      completedIntents: intents.filter(i => i.status === 'completed').length,
      failedIntents: intents.filter(i => i.status === 'failed').length,
      avgSolveTime: 2.5, // seconds
      avgSlippage: 2.3, // percent
      topSolvers: Object.entries(solverUsage)
        .map(([solver, data]) => ({ solver, ...data }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5),
    };
  }

  /**
   * Get supported chains and tokens
   */
  async getSupportedChains(): Promise<string[]> {
    return [
      'Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'BSC', 
      'Base', 'Avalanche', 'zkSync', 'Starknet', 'Linea',
      'Mantle', 'Scroll', 'Sepolia', 'Goerli'
    ];
  }

  async getSupportedTokens(chain: string): Promise<{ symbol: string; name: string; address: string }[]> {
    const tokens: Record<string, { symbol: string; name: string; address: string }[]> = {
      Ethereum: [
        { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
        { symbol: 'USDT', name: 'Tether', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
        { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
      ],
      Arbitrum: [
        { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
        { symbol: 'USDT', name: 'Tether', address: '0xFd086bC7CD5C481DCC93C85CD60000b0a317bB91' },
      ],
      Optimism: [
        { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' },
      ],
      Polygon: [
        { symbol: 'MATIC', name: 'Polygon', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' },
      ],
      BSC: [
        { symbol: 'BNB', name: 'BNB', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDT', name: 'Tether', address: '0x55d398326f99059fF775485246999027B3197955' },
      ],
      Base: [
        { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
      ],
      Avalanche: [
        { symbol: 'AVAX', name: 'Avalanche', address: '0x0000000000000000000000000000000000000000' },
        { symbol: 'USDC', name: 'USD Coin', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' },
      ],
    };

    return tokens[chain] || tokens['Ethereum'];
  }

  // Helper methods
  private calculateMinOutput(amount: string, maxSlippage: number): string {
    const output = parseFloat(amount) * (1 - maxSlippage / 100);
    return output.toFixed(6);
  }

  private getTokenPrice(symbol: string): number {
    const prices: Record<string, number> = {
      ETH: 2000,
      MATIC: 0.85,
      BNB: 300,
      AVAX: 35,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      WBTC: 45000,
    };
    return prices[symbol.toUpperCase()] || 100;
  }

  private getEstimatedTime(solver: SolverType): number {
    const times: Record<SolverType, number> = {
      uniswapx: 30,
      across: 180,
      cowswap: 60,
      '1inch': 45,
      paraswap: 45,
      odos: 40,
      native_bridge: 900,
    };
    return times[solver] || 60;
  }

  private generateRoute(intent: Intent, solver: SolverType): string[] {
    const route = [intent.fromToken];
    
    if (intent.type === 'swap') {
      route.push(solver, intent.toToken);
    } else if (intent.type === 'bridge' || intent.type === 'cross_chain_swap') {
      route.push(intent.fromChain, solver, intent.toChain!, intent.toToken);
    }
    
    return route;
  }

  private generateExecutionSteps(intent: Intent, quote: SolverQuote): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    // Approval step
    steps.push({
      step: 1,
      action: 'approve',
      protocol: quote.solver,
      fromToken: intent.fromToken,
      toToken: intent.fromToken,
      fromAmount: intent.amount,
      toAmount: intent.amount,
      chain: intent.fromChain,
      gasEstimate: '0.00005',
    });

    // Main action (swap or bridge)
    if (intent.type === 'swap' || intent.type === 'cross_chain_swap') {
      steps.push({
        step: 2,
        action: 'swap',
        protocol: quote.solver,
        fromToken: intent.fromToken,
        toToken: intent.toToken,
        fromAmount: intent.amount,
        toAmount: quote.outputAmount,
        chain: intent.fromChain,
        gasEstimate: quote.gasEstimate,
      });
    }

    if (intent.toChain && intent.fromChain !== intent.toChain) {
      steps.push({
        step: 3,
        action: 'bridge',
        protocol: quote.solver,
        fromToken: intent.toToken,
        toToken: intent.toToken,
        fromAmount: quote.outputAmount,
        toAmount: quote.outputAmount,
        chain: intent.toChain,
        gasEstimate: '0.001',
      });
    }

    return steps;
  }
}
