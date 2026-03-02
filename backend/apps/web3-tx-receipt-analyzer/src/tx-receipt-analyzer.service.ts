import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface TransactionReceipt {
  blockHash: string;
  blockNumber: string;
  contractAddress: string | null;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  from: string;
  gasUsed: string;
  logs: Array<{
    address: string;
    topics: string[];
    data: string;
    logIndex: string;
  }>;
  logsBloom: string;
  status: string;
  to: string;
  transactionHash: string;
  transactionIndex: string;
  type: string;
}

interface DecodedEvent {
  name: string;
  signature: string;
  params: Array<{ name: string; value: string; type: string }>;
}

interface TxAnalysisResult {
  txHash: string;
  chain: string;
  status: 'success' | 'failure';
  blockNumber: number;
  gasUsed: number;
  gasPrice: number;
  effectiveGasPrice: number;
  totalFee: string;
  from: string;
  to: string;
  contractAddress: string | null;
  logs: DecodedEvent[];
  decodedInput: {
    methodId: string;
    functionName: string;
    params: Array<{ name: string; value: string; type: string }>;
  } | null;
  timestamp: string;
  isContractCreation: boolean;
  isEIP1559: boolean;
  transactionType: string;
}

const CHAIN_RPC: Record<string, string> = {
  ethereum: 'https://eth.llamarpc.com',
  polygon: 'https://polygon-rpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  optimism: 'https://mainnet.optimism.io',
  bsc: 'https://bsc-dataseed.binance.org',
  avalanche: 'https://api.avax.network/ext/bc/rpc',
  base: 'https://mainnet.base.org',
};

// Common function selectors
const FUNCTION_SELECTORS: Record<string, string> = {
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x23b872dd': 'transferFrom(address,address,uint256)',
  '0x095ea7b3': 'approve(address,uint256)',
  '0x40c10f19': 'mint(address,uint256)',
  '0x42966c68': 'mint(uint256)',
  '0x4e71d92d': 'claim()',
  '0xb88a802f': 'swapExactETHForTokens(uint256,address[],address,uint256)',
  '0x38ed1739': 'swapExactTokensForETH(uint256,uint256,address[],address,uint256)',
  '0x7ff36ab5': 'swapExactETHForTokens(uint256,address[],address,uint256)',
  '0x18cbafe5': 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
  '0x5c60da1b': 'initialize(address)',
  '0x2e1a7d4d': 'withdraw(uint256)',
  '0x3ccfd60b': 'withdraw()',
  '0xf242432a': 'execute(address,uint256,bytes,uint8)',
  '0xb61d27f6': 'execute(address,uint256,bytes)',
  '0x4aa4a15c': 'execute(bytes32,address,uint256,bytes,uint8)',
  '0x8a7c6c57': 'multicall(bytes[])',
  '0xac9650d8': 'multicall(bytes[])',
  '0x5c60da1b': 'initialize(address)',
};

// Common event signatures
const EVENT_SIGNATURES: Record<string, string> = {
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer(address,address,uint256)',
  '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval(address,address,uint256)',
  '0x1c411e9a96e071241c2f21f7726b17ae89e3fa4dd5272e4a2a0f8e7c2f8a8c9a': 'Sync(uint112,uint112)',
  '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d4f0489dee5e4b': 'Swap(address,uint256,uint256,uint256,uint256,address)',
  '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26395f4e1e36ade0': 'Mint(address,uint256,uint256)',
  '0x0f4346b1fa6f6e47e1b8e6a75f1b9b2bfe5f5d7e1f5e1e1f5e1e1f5e1e1f5e': 'Deposit(address,uint256)',
  '0xe1fffcc4923d04b559f4d29a8bfc6cda04e5a5e5b5a5e5b5a5e5b5a5e5b5a5e': 'Withdraw(address,uint256)',
  '0x2e1a7d4d0000000000000000000000000000000000000000000000000000000000': 'Withdraw(uint256)',
  '0x4cd0d1c10000000000000000000000000000000000000000000000000000000000': 'Claim()',
  '0xba9b7e50f36e1da4a92d1c2c1f95b0e2e8e5e5c5e5d5c5e5d5c5e5d5c5e5d5': 'Execute(address,uint256,bytes)',
};

@Injectable()
export class TxReceiptAnalyzerService {
  constructor(private readonly httpService: HttpService) {}

  async analyzeTransaction(txHash: string, chain: string = 'ethereum'): Promise<TxAnalysisResult> {
    const rpcUrl = CHAIN_RPC[chain.toLowerCase()];
    if (!rpcUrl) {
      throw new HttpException(`Unsupported chain: ${chain}`, HttpStatus.BAD_REQUEST);
    }

    try {
      // Get transaction receipt
      const receipt = await this.getTransactionReceipt(rpcUrl, txHash);
      if (!receipt) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      // Get transaction details
      const tx = await this.getTransaction(rpcUrl, txHash);

      // Decode logs
      const decodedLogs = this.decodeLogs(receipt.logs);

      // Decode input
      const decodedInput = this.decodeInput(tx.input);

      // Calculate fees
      const gasUsed = parseInt(receipt.gasUsed, 16);
      const effectiveGasPrice = parseInt(receipt.effectiveGasPrice, 16);
      const totalFee = (gasUsed * effectiveGasPrice / 1e18).toFixed(8);

      // Get block to get timestamp
      const block = await this.getBlock(rpcUrl, parseInt(receipt.blockNumber, 16));
      const timestamp = new Date(parseInt(block.timestamp, 16) * 1000).toISOString();

      return {
        txHash,
        chain,
        status: receipt.status === '0x1' ? 'success' : 'failure',
        blockNumber: parseInt(receipt.blockNumber, 16),
        gasUsed,
        gasPrice: effectiveGasPrice / 1e9, // Convert to Gwei
        effectiveGasPrice,
        totalFee,
        from: tx.from,
        to: tx.to || receipt.contractAddress || '',
        contractAddress: receipt.contractAddress,
        logs: decodedLogs,
        decodedInput,
        timestamp,
        isContractCreation: !tx.to && !!receipt.contractAddress,
        isEIP1559: tx.maxFeePerGas !== undefined,
        transactionType: receipt.type,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(`Failed to analyze transaction: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getTransactionReceipt(rpcUrl: string, txHash: string): Promise<TransactionReceipt | null> {
    const response = await firstValueFrom(
      this.httpService.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      })
    );
    return response.data.result;
  }

  private async getTransaction(rpcUrl: string, txHash: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1,
      })
    );
    return response.data.result;
  }

  private async getBlock(rpcUrl: string, blockNumber: number): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.post(rpcUrl, {
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['0x' + blockNumber.toString(16), false],
        id: 1,
      })
    );
    return response.data.result;
  }

  private decodeLogs(logs: Array<{ address: string; topics: string[]; data: string }>): DecodedEvent[] {
    return logs.map((log) => {
      const signature = log.topics[0];
      const eventName = EVENT_SIGNATURES[signature] || 'Unknown Event';
      
      // Parse parameters based on event type
      const params = this.parseEventParams(eventName, log.topics, log.data);
      
      return {
        name: eventName.split('(')[0],
        signature: eventName,
        params,
      };
    });
  }

  private parseEventParams(eventName: string, topics: string[], data: string): Array<{ name: string; value: string; type: string }> {
    const params: Array<{ name: string; value: string; type: string }> = [];
    
    if (eventName === 'Transfer(address,address,uint256)') {
      if (topics[1]) params.push({ name: 'from', value: '0x' + topics[1].slice(26), type: 'address' });
      if (topics[2]) params.push({ name: 'to', value: '0x' + topics[2].slice(26), type: 'address' });
      if (data) params.push({ name: 'value', value: BigInt('0x' + data.slice(2, 66)).toString(), type: 'uint256' });
    } else if (eventName === 'Approval(address,address,uint256)') {
      if (topics[1]) params.push({ name: 'owner', value: '0x' + topics[1].slice(26), type: 'address' });
      if (topics[2]) params.push({ name: 'spender', value: '0x' + topics[2].slice(26), type: 'address' });
      if (data) params.push({ name: 'value', value: BigInt('0x' + data.slice(2, 66)).toString(), type: 'uint256' });
    } else if (eventName.startsWith('Swap')) {
      if (topics[1]) params.push({ name: 'sender', value: '0x' + topics[1].slice(26), type: 'address' });
      // Parse swap amounts from data
      const amounts = data.replace('0x', '').match(/.{1,64}/g) || [];
      if (amounts.length >= 4) {
        params.push({ name: 'amount0In', value: BigInt('0x' + amounts[0]).toString(), type: 'uint256' });
        params.push({ name: 'amount1In', value: BigInt('0x' + amounts[1]).toString(), type: 'uint256' });
        params.push({ name: 'amount0Out', value: BigInt('0x' + amounts[2]).toString(), type: 'uint256' });
        params.push({ name: 'amount1Out', value: BigInt('0x' + amounts[3]).toString(), type: 'uint256' });
      }
    }

    return params;
  }

  private decodeInput(input: string): { methodId: string; functionName: string; params: Array<{ name: string; value: string; type: string }> } | null {
    if (!input || input.length < 10) return null;

    const methodId = input.slice(0, 10);
    const functionName = FUNCTION_SELECTORS[methodId] || 'Unknown Function';
    
    const params: Array<{ name: string; value: string; type: string }> = [];
    
    // Parse common function parameters
    if (functionName.includes('transfer(address,uint256)')) {
      const addr = '0x' + input.slice(34, 74);
      const value = BigInt('0x' + input.slice(74)).toString();
      params.push({ name: 'to', value: addr, type: 'address' });
      params.push({ name: 'amount', value: value, type: 'uint256' });
    } else if (functionName.includes('transferFrom(address,address,uint256)')) {
      const from = '0x' + input.slice(34, 74);
      const to = '0x' + input.slice(98, 138);
      const value = BigInt('0x' + input.slice(138)).toString();
      params.push({ name: 'from', value: from, type: 'address' });
      params.push({ name: 'to', value: to, type: 'address' });
      params.push({ name: 'amount', value: value, type: 'uint256' });
    } else if (functionName.includes('approve(address,uint256)')) {
      const addr = '0x' + input.slice(34, 74);
      const value = BigInt('0x' + input.slice(74)).toString();
      params.push({ name: 'spender', value: addr, type: 'address' });
      params.push({ name: 'amount', value: value, type: 'uint256' });
    }

    return {
      methodId,
      functionName,
      params,
    };
  }

  async getSupportedChains(): Promise<Array<{ id: string; name: string; rpc: string }>> {
    return Object.entries(CHAIN_RPC).map(([id, rpc]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      rpc,
    }));
  }
}
