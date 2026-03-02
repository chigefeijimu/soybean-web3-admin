import { Injectable, Logger } from '@nestjs/common';

interface FailureAnalysis {
  txHash: string;
  chainId: number;
  status: 'failed' | 'success' | 'pending';
  failureReason: string | null;
  failureType: string;
  gasUsed: string;
  gasLimit: string;
  effectiveGasPrice: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  input: string;
  nonce: number;
  revertReason: string | null;
  suggestions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface FailureStats {
  address: string;
  chainId: number;
  totalFailures: number;
  failureRate: number;
  failureTypes: { type: string; count: number; percentage: number }[];
  recentFailures: { txHash: string; reason: string; timestamp: number }[];
  mostCommonFailure: string;
  estimatedLostGas: string;
  recommendations: string[];
}

interface CommonFailure {
  type: string;
  description: string;
  frequency: number;
  solutions: string[];
}

@Injectable()
export class TxFailureAnalyzerService {
  private readonly logger = new Logger(TxFailureAnalyzerService.name);

  // Common smart contract revert reasons
  private readonly revertReasons: Record<string, string> = {
    '0x08c379a0': 'Execution reverted: Error(string)',
    '0x4e487b71': 'Execution reverted: Panic(uint256)',
    '0x0': 'Execution reverted: No error message',
    '0xdead': 'Execution reverted: Dead',
    '0xreverted': 'Execution reverted',
    'out of gas': 'Insufficient gas',
    'nonce too low': 'Nonce too low - transaction already mined',
    'nonce too high': 'Nonce too high - missing intermediate nonce',
    'insufficient funds': 'Insufficient native tokens for gas',
    'underpriced': 'Gas price too low',
    'replacement transaction underpriced': 'Replacement gas price too low',
    'already known': 'Transaction already in mempool',
    'gas limit exceeded': 'Gas limit too low for transaction',
  };

  // Known contract error signatures
  private readonly errorSignatures: Record<string, string> = {
    '0x09b1b5bc': 'Error: TokenInsufficientBalance',
    '0x13c216c3': 'Error: ZeroAmount',
    '0x17bfb70c': 'Error: InvalidToken',
    '0x1e4e487b': 'Error: Panic(0x11)',
    '0x2220fa4c': 'Error: ERC20: transfer to zero address',
    '0x24e2ece7': 'Error: Cannot swap zero amount',
    '0x27c291bf': 'Error: InsufficientLiquidity',
    '0x2d4f3be5': 'Error: SlippageExceeded',
    '0x3570c5a9': 'Error: PairDoesNotExist',
    '0x3b9f6e57': 'Error: INSUFFICIENT_INPUT_AMOUNT',
    '0x4595f623': 'Error: FactorySamePairAlreadyExists',
    '0x46fdef47': 'Error: Expired',
    '0x4ac09ce6': 'Error: InsufficientAAmount',
    '0x4e3c84e9': 'Error: InsufficientBAmount',
    '0x504f4936': 'Error: InsufficientOutputAmount',
    '0x58a5c2b7': 'Error: InsufficientLiquidities',
    '0x5c60e2b0': 'Error: Initialization',
    '0x6395e89a': 'Error: InsufficientLiquidityMinted',
    '0x6d7156c1': 'Error: Pair: K',
    '0x78e02c0d': 'Error: SafeMath: subtraction overflow',
    '0x7e7d6c83': 'Error: InsufficientLiquidityBurned',
    '0x8261044e': 'Error: Slippage',
    '0x8f7d8f37': 'Error: InsufficientAllowance',
    '0x93bae92d': 'Error: InsufficientBalance',
    '0xa2d8a41c': 'Error: InsufficientReserve',
    '0xa3b1aae4': 'Error: IdenticalAddresses',
    '0xb4c2d53c': 'Error: SamePairAddress',
    '0xc6e6f592': 'Error: InsufficientInputAmount',
    '0xcb3b8f5b': 'Error: InsufficientOutputAmount',
    '0xd1b1d267': 'Error: Pair: LOCKED',
    '0xd3d74902': 'Error: InsufficientAAmount',
    '0xd85f209c': 'Error: InvalidTokenIn',
    '0xdf2c3c94': 'Error: InsufficientLiquidity',
    '0xe48bc693': 'Error: InsufficientOutputAmount',
    '0xe6b5fa04': 'Error: InsufficientTokenOut',
    '0xf3d36d18': 'Error: InsufficientLiquidity',
  };

  private readonly chainNames: Record<number, string> = {
    1: 'Ethereum',
    5: 'Goerli',
    11155111: 'Sepolia',
    56: 'BSC',
    97: 'BSC Testnet',
    137: 'Polygon',
    80001: 'Mumbai',
    42161: 'Arbitrum One',
    421613: 'Arbitrum Goerli',
    10: 'Optimism',
    420: 'Optimism Goerli',
    43114: 'Avalanche',
    43113: 'Avalanche Fuji',
    8453: 'Base',
    84531: 'Base Goerli',
    250: 'Fantom',
    1666600000: 'Harmony',
    128: 'Huobi ECO Chain',
  };

  async getHealth() {
    return {
      status: 'healthy',
      timestamp: Date.now(),
      service: 'Transaction Failure Analyzer',
      version: '1.0.0',
    };
  }

  async analyzeTransaction(txHash: string, chainId: number): Promise<FailureAnalysis> {
    this.logger.log(`Analyzing transaction ${txHash} on chain ${chainId}`);

    // Generate mock analysis based on tx hash for demo
    const hashPrefix = parseInt(txHash.slice(-2), 16) || 0;
    const isFailed = hashPrefix % 3 === 0;

    const failureTypes = [
      'INSUFFICIENT_GAS',
      'REVERT_CONTRACT',
      'NONCE_CONFLICT',
      'INSUFFICIENT_BALANCE',
      'SLIPPAGE_EXCEEDED',
      'INSUFFICIENT_ALLOWANCE',
      'INVALID_RECIPIENT',
      'TOKEN_TRANSFER_FAILED',
    ];

    const failureType = failureTypes[hashPrefix % failureTypes.length];
    const revertReasons = [
      'Insufficient output amount',
      'SafeMath: subtraction overflow',
      'Insufficient liquidity',
      'Transfer failed',
      'Insufficient allowance',
      'Slippage exceeded',
      'Invalid token',
      'Expired',
    ];

    const suggestions = this.getSuggestionsForFailureType(failureType);

    const analysis: FailureAnalysis = {
      txHash,
      chainId,
      status: isFailed ? 'failed' : 'success',
      failureReason: isFailed ? revertReasons[hashPrefix % revertReasons.length] : null,
      failureType: isFailed ? failureType : 'NONE',
      gasUsed: (21000 + Math.floor(Math.random() * 100000)).toString(),
      gasLimit: '100000',
      effectiveGasPrice: (hashPrefix * 1000000000).toString(),
      blockNumber: 18000000 + Math.floor(Math.random() * 1000),
      timestamp: Date.now() - Math.floor(Math.random() * 86400000 * 7),
      from: `0x${this.generateAddress(txHash, 0)}`,
      to: `0x${this.generateAddress(txHash, 1)}`,
      value: (Math.random() * 1).toFixed(6),
      input: '0x' + txHash.slice(2, 50),
      nonce: Math.floor(Math.random() * 100),
      revertReason: isFailed ? revertReasons[hashPrefix % revertReasons.length] : null,
      suggestions,
      severity: this.getSeverityForFailureType(failureType),
    };

    return analysis;
  }

  async getFailureHistory(address: string, chainId: number, limit: number): Promise<FailureAnalysis[]> {
    this.logger.log(`Getting failure history for ${address} on chain ${chainId}`);

    const history: FailureAnalysis[] = [];
    const failureTypes = [
      'INSUFFICIENT_GAS',
      'REVERT_CONTRACT',
      'NONCE_CONFLICT',
      'INSUFFICIENT_BALANCE',
      'SLIPPAGE_EXCEEDED',
    ];

    for (let i = 0; i < Math.min(limit, 20); i++) {
      const hashSuffix = i * 1000 + parseInt(address.slice(-2), 16) || 0;
      const failureType = failureTypes[hashSuffix % failureTypes.length];

      history.push({
        txHash: `0x${this.generateAddress(address, i)}`,
        chainId,
        status: 'failed',
        failureReason: this.getFailureDescription(failureType),
        failureType,
        gasUsed: (21000 + Math.floor(Math.random() * 100000)).toString(),
        gasLimit: '100000',
        effectiveGasPrice: '20000000000',
        blockNumber: 18000000 + i,
        timestamp: Date.now() - i * 3600000,
        from: address,
        to: `0x${this.generateAddress(address, i)}`,
        value: (Math.random() * 0.1).toFixed(6),
        input: '0x',
        nonce: i,
        revertReason: this.getFailureDescription(failureType),
        suggestions: this.getSuggestionsForFailureType(failureType),
        severity: this.getSeverityForFailureType(failureType),
      });
    }

    return history;
  }

  async diagnoseFailure(txHash: string, chainId: number): Promise<{
    diagnosis: string;
    rootCause: string;
    fixSuggestions: string[];
    relatedDocs: string[];
    severity: string;
  }> {
    this.logger.log(`Diagnosing failure for ${txHash} on chain ${chainId}`);

    const hashSuffix = parseInt(txHash.slice(-2), 16) || 0;
    const failureTypes = [
      {
        type: 'INSUFFICIENT_GAS',
        diagnosis: 'Transaction ran out of gas during execution',
        rootCause: 'The gas limit was set too low for the smart contract operation',
        fixSuggestions: [
          'Increase gas limit by 20-50%',
          'Use gas estimator to estimate required gas',
          'Simplify the transaction (fewer contract interactions)',
          'Consider breaking into multiple transactions',
        ],
        relatedDocs: [
          'https://ethereum.org/en/developers/docs/gas/',
          'https://docs.ethers.io/v5/api/utils/big-number/#BigNumber-errors',
        ],
      },
      {
        type: 'REVERT_CONTRACT',
        diagnosis: 'Smart contract execution reverted',
        rootCause: 'The called contract function reverted due to failed require/assert statement',
        fixSuggestions: [
          'Check contract state before calling',
          'Ensure sufficient token balances',
          'Verify approval amounts for token transfers',
          'Check if pool has sufficient liquidity',
          'Review contract for additional requirements',
        ],
        relatedDocs: [
          'https://docs.soliditylang.org/en/v0.8.19/control-structures.html#revert-statement',
        ],
      },
      {
        type: 'SLIPPAGE_EXCEEDED',
        diagnosis: 'Price slippage exceeded your maximum tolerance',
        rootCause: 'The actual exchange rate differed significantly from expected',
        fixSuggestions: [
          'Increase slippage tolerance (use with caution)',
          'Split large orders into smaller chunks',
          'Wait for better market conditions',
          'Use DEX aggregators for better rates',
        ],
        relatedDocs: [
          'https://docs.uniswap.org/concepts/protocol/glossary#slippage',
        ],
      },
      {
        type: 'INSUFFICIENT_BALANCE',
        diagnosis: 'Insufficient native token balance for transaction',
        rootCause: 'Wallet does not have enough native tokens (ETH/BNB/MATIC) for gas',
        fixSuggestions: [
          'Bridge or transfer native tokens to wallet',
          'Use a gas fee proxy service',
          'Consider using a smart contract wallet with gas abstraction',
        ],
        relatedDocs: [],
      },
      {
        type: 'NONCE_CONFLICT',
        diagnosis: 'Transaction nonce conflict',
        rootCause: 'A transaction with the same nonce was already mined or is pending',
        fixSuggestions: [
          'Wait for the previous transaction to confirm',
          'Use replace-by-fee with higher gas price',
          'Manually set the correct nonce',
          'Clear pending transactions from mempool',
        ],
        relatedDocs: [],
      },
    ];

    const diagnosis = failureTypes[hashSuffix % failureTypes.length];

    return {
      diagnosis: diagnosis.diagnosis,
      rootCause: diagnosis.rootCause,
      fixSuggestions: diagnosis.fixSuggestions,
      relatedDocs: diagnosis.relatedDocs,
      severity: this.getSeverityForFailureType(diagnosis.type),
    };
  }

  async getCommonFailures(chainId: number): Promise<CommonFailure[]> {
    return [
      {
        type: 'INSUFFICIENT_GAS',
        description: 'Transaction ran out of gas before completion',
        frequency: 35,
        solutions: [
          'Increase gas limit',
          'Use gas estimation tools',
          'Simplify contract calls',
        ],
      },
      {
        type: 'REVERT_CONTRACT',
        description: 'Smart contract function reverted',
        frequency: 30,
        solutions: [
          'Check contract state',
          'Verify approvals',
          'Ensure sufficient liquidity',
        ],
      },
      {
        type: 'SLIPPAGE_EXCEEDED',
        description: 'Price moved beyond acceptable slippage',
        frequency: 15,
        solutions: [
          'Adjust slippage settings',
          'Use limit orders',
          'Split large trades',
        ],
      },
      {
        type: 'INSUFFICIENT_BALANCE',
        description: 'Not enough native tokens for gas',
        frequency: 10,
        solutions: [
          'Top up wallet with native tokens',
          'Use gas tokens',
          'Use meta-transactions',
        ],
      },
      {
        type: 'NONCE_CONFLICT',
        description: 'Transaction nonce issues',
        frequency: 10,
        solutions: [
          'Wait for pending tx',
          'Use nonce management',
          'Speed up or cancel pending tx',
        ],
      },
    ];
  }

  async getFailureStats(address: string, chainId: number): Promise<FailureStats> {
    const totalFailures = Math.floor(Math.random() * 50) + 5;
    const totalTxs = totalFailures + Math.floor(Math.random() * 100);

    const failureTypes = [
      { type: 'INSUFFICIENT_GAS', count: Math.floor(totalFailures * 0.35) },
      { type: 'REVERT_CONTRACT', count: Math.floor(totalFailures * 0.30) },
      { type: 'SLIPPAGE_EXCEEDED', count: Math.floor(totalFailures * 0.15) },
      { type: 'INSUFFICIENT_BALANCE', count: Math.floor(totalFailures * 0.10) },
      { type: 'NONCE_CONFLICT', count: Math.floor(totalFailures * 0.10) },
    ];

    const failureTypesWithPercentage = failureTypes.map((ft) => ({
      ...ft,
      percentage: Math.round((ft.count / totalFailures) * 100),
    }));

    const gasPrice = 0.00002; // Average ETH gas price in 2026
    const estimatedLostGas = (totalFailures * 50000 * gasPrice).toFixed(6);

    return {
      address,
      chainId,
      totalFailures,
      failureRate: Math.round((totalFailures / totalTxs) * 100),
      failureTypes: failureTypesWithPercentage,
      recentFailures: failureTypes.slice(0, 3).map((ft, i) => ({
        txHash: `0x${this.generateAddress(address, i)}`,
        reason: ft.type,
        timestamp: Date.now() - i * 3600000,
      })),
      mostCommonFailure: failureTypes[0].type,
      estimatedLostGas: `${estimatedLostGas} ETH`,
      recommendations: [
        'Consider increasing default gas limit by 20%',
        'Use slippage protection for DEX swaps',
        'Monitor pending transactions more closely',
        'Keep sufficient native token balance for gas',
      ],
    };
  }

  async suggestFix(txHash: string, chainId: number, failureReason: string): Promise<{
    originalTx: string;
    suggestedFix: {
      action: string;
      parameters: Record<string, unknown>;
      estimatedCost: string;
      successProbability: number;
    };
    alternativeSolutions: { approach: string; cost: string; pros: string; cons: string }[];
  }> {
    const fixes: Record<string, any> = {
      'INSUFFICIENT_GAS': {
        action: 'RESEND_WITH_HIGHER_GAS',
        parameters: {
          gasMultiplier: 1.5,
          gasLimit: 150000,
        },
        estimatedCost: '0.003 ETH',
        successProbability: 0.85,
      },
      'REVERT_CONTRACT': {
        action: 'CHECK_STATE_AND_RETRY',
        parameters: {
          checkBalances: true,
          checkApprovals: true,
          retryWithHigherSlippage: true,
        },
        estimatedCost: '0.002 ETH',
        successProbability: 0.7,
      },
      'SLIPPAGE_EXCEEDED': {
        action: 'ADJUST_SLIPPAGE',
        parameters: {
          newSlippageBps: 500,
          splitIntoChunks: true,
          chunkSize: '30%',
        },
        estimatedCost: '0.001 ETH',
        successProbability: 0.9,
      },
      'INSUFFICIENT_BALANCE': {
        action: 'TOP_UP_WALLET',
        parameters: {
          bridgeFrom: 'CEX or other chain',
          recommendedAmount: '0.05 ETH',
        },
        estimatedCost: '0.01 ETH (bridge fee)',
        successProbability: 0.95,
      },
    };

    const fix = fixes[failureReason] || fixes['INSUFFICIENT_GAS'];

    return {
      originalTx: txHash,
      suggestedFix: fix,
      alternativeSolutions: [
        {
          approach: 'Use Flashbots Protect',
          cost: 'Free (bundle fee may apply)',
          pros: 'Private mempool, MEV protection',
          cons: 'May take longer to confirm',
        },
        {
          approach: 'Use a different RPC node',
          cost: 'Free',
          pros: 'May have better propagation',
          cons: 'May still face same issues',
        },
      ],
    };
  }

  getSupportedChains() {
    return Object.entries(this.chainNames).map(([id, name]) => ({
      chainId: parseInt(id),
      name,
    }));
  }

  private getSuggestionsForFailureType(failureType: string): string[] {
    const suggestions: Record<string, string[]> = {
      INSUFFICIENT_GAS: [
        'Increase gas limit by 20-50%',
        'Use gas estimation API before sending',
        'Simplify transaction to reduce complexity',
        'Consider breaking into multiple transactions',
      ],
      REVERT_CONTRACT: [
        'Verify token balances before transaction',
        'Check if token approval is sufficient',
        'Ensure pool has enough liquidity',
        'Review contract function requirements',
      ],
      NONCE_CONFLICT: [
        'Wait for pending transaction to confirm',
        'Manually set the correct nonce',
        'Use replace-by-fee with higher gas',
        'Cancel stuck transaction first',
      ],
      INSUFFICIENT_BALANCE: [
        'Transfer native tokens to wallet',
        'Bridge from another chain',
        'Use gas token (GST2) for fees',
      ],
      SLIPPAGE_EXCEEDED: [
        'Increase slippage tolerance (careful with high slippage)',
        'Split large orders into smaller chunks',
        'Wait for better market conditions',
        'Use limit orders instead of market orders',
      ],
      INSUFFICIENT_ALLOWANCE: [
        'Approve token for contract before trading',
        'Increase approval amount',
        'Check if contract requires unlimited approval',
      ],
      INVALID_RECIPIENT: [
        'Verify recipient address is correct',
        'Check if contract accepts token transfers',
        'Ensure recipient is not a contract that rejects tokens',
      ],
      TOKEN_TRANSFER_FAILED: [
        'Check if token is paused or frozen',
        'Verify token contract is not blacklisted',
        'Ensure recipient can receive tokens',
      ],
    };

    return suggestions[failureType] || ['Contact support for assistance'];
  }

  private getSeverityForFailureType(failureType: string): 'low' | 'medium' | 'high' | 'critical' {
    const severity: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      INSUFFICIENT_GAS: 'medium',
      REVERT_CONTRACT: 'high',
      NONCE_CONFLICT: 'medium',
      INSUFFICIENT_BALANCE: 'high',
      SLIPPAGE_EXCEEDED: 'low',
      INSUFFICIENT_ALLOWANCE: 'high',
      INVALID_RECIPIENT: 'critical',
      TOKEN_TRANSFER_FAILED: 'high',
    };

    return severity[failureType] || 'medium';
  }

  private getFailureDescription(failureType: string): string {
    const descriptions: Record<string, string> = {
      INSUFFICIENT_GAS: 'Transaction ran out of gas',
      REVERT_CONTRACT: 'Smart contract reverted',
      NONCE_CONFLICT: 'Transaction nonce conflict',
      INSUFFICIENT_BALANCE: 'Insufficient native token balance',
      SLIPPAGE_EXCEEDED: 'Price slippage exceeded limit',
      INSUFFICIENT_ALLOWANCE: 'Token allowance insufficient',
      INVALID_RECIPIENT: 'Invalid recipient address',
      TOKEN_TRANSFER_FAILED: 'Token transfer failed',
    };

    return descriptions[failureType] || 'Unknown error';
  }

  private generateAddress(seed: string, index: number): string {
    // Generate a deterministic address from seed and index
    const chars = '0123456789abcdef';
    let result = '';
    const seedHash = seed.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    
    for (let i = 0; i < 40; i++) {
      const seedIndex = Math.abs((seedHash + index * 17 + i * 7) % 16);
      result += chars[seedIndex];
    }
    
    return result;
  }
}
