import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ethers, Wallet, JsonRpcProvider } from 'ethers';

const CHAIN_RPC: Record<number, string> = {
  1: process.env.ETH_RPC || 'https://eth.llamarpc.com',
  5: process.env.GOERLI_RPC || 'https://goerli.infura.io/v3/',
  11155111: process.env.SEPOLIA_RPC || 'https://sepolia.infura.io/v3/',
  56: process.env.BSC_RPC || 'https://bsc-dataseed.binance.org',
  137: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  42161: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
  10: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
  8453: process.env.BASE_RPC || 'https://mainnet.base.org',
};

const CHAIN_EXPLORER_API: Record<number, string> = {
  1: 'https://api.etherscan.io/api',
  5: 'https://api-goerli.etherscan.io/api',
  11155111: 'https://api-sepolia.etherscan.io/api',
  56: 'https://api.bscscan.com/api',
  137: 'api.polygonscan.com/api',
  42161: 'api.arbiscan.io/api',
  10: 'api-optimistic.etherscan.io/api',
  8453: 'api.basescan.org/api',
};

const CHAIN_EXPLORER_KEY = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';

@Injectable()
export class TxAcceleratorService {
  private readonly logger = new Logger(TxAcceleratorService.name);

  async getPendingTransactions(address: string, chainId: number = 1): Promise<any> {
    try {
      const provider = new JsonRpcProvider(CHAIN_RPC[chainId] || CHAIN_RPC[1]);
      
      // Get current nonce
      const currentNonce = await provider.getTransactionCount(address, 'pending');
      const latestNonce = await provider.getTransactionCount(address, 'latest');
      
      // Fetch transactions from the last 10 nonces
      const pendingTxs: any[] = [];
      
      // Use RPC to get pending transactions
      try {
        const pendingBlock = await provider.send('eth_getBlockByNumber', ['pending', false]);
        if (pendingBlock?.transactions) {
          for (const txHash of pendingBlock.transactions) {
            try {
              const tx = await provider.getTransaction(txHash);
              if (tx && tx.from?.toLowerCase() === address.toLowerCase()) {
                pendingTxs.push({
                  hash: tx.hash,
                  nonce: tx.nonce,
                  from: tx.from,
                  to: tx.to,
                  value: tx.value.toString(),
                  gasPrice: tx.gasPrice?.toString() || '0',
                  gasLimit: tx.gasLimit?.toString() || '0',
                  maxFeePerGas: tx.maxFeePerGas?.toString() || '0',
                  maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString() || '0',
                  chainId: tx.chainId,
                  status: 'pending',
                });
              }
            } catch (e) {
              // Continue
            }
          }
        }
      } catch (e) {
        this.logger.warn(`Failed to fetch pending block: ${e.message}`);
      }

      // Also try to get from mempool
      const explorerApi = CHAIN_EXPLORER_API[chainId];
      if (explorerApi) {
        try {
          const response = await axios.get(explorerApi, {
            params: {
              module: 'account',
              action: 'txlist',
              address: address,
              startblock: 0,
              endblock: 99999999,
              page: 1,
              offset: 50,
              sort: 'desc',
              apikey: CHAIN_EXPLORER_KEY,
            },
          });

          if (response.data.status === '1' && response.data.result) {
            const txs = response.data.result;
            for (const tx of txs) {
              if (tx.isError === '0' && tx.confirmations === '0') {
                // Already confirmed, skip
                continue;
              }
              if (!pendingTxs.find((p) => p.hash === tx.hash)) {
                pendingTxs.push({
                  hash: tx.hash,
                  nonce: parseInt(tx.nonce),
                  from: tx.from,
                  to: tx.to,
                  value: tx.value,
                  gasPrice: tx.gasPrice,
                  gasLimit: tx.gas,
                  maxFeePerGas: tx.maxFeePerGas || tx.gasPrice,
                  maxPriorityFeePerGas: tx.maxPriorityFeePerGas || '0',
                  chainId: parseInt(tx.chainId),
                  status: tx.confirmations === '0' ? 'pending' : 'confirmed',
                  timestamp: tx.timeStamp,
                });
              }
            }
          }
        } catch (e) {
          this.logger.warn(`Failed to fetch from explorer: ${e.message}`);
        }
      }

      return {
        address,
        chainId,
        pendingTransactions: pendingTxs,
        currentNonce,
        latestNonce,
        pendingCount: pendingTxs.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get pending transactions: ${error.message}`);
      return {
        address,
        chainId,
        pendingTransactions: [],
        error: error.message,
      };
    }
  }

  async speedUpTransaction(
    address: string,
    nonce: number,
    privateKey: string,
    chainId: number = 1,
    gasMultiplier: number = 1.5,
  ): Promise<any> {
    try {
      const provider = new JsonRpcProvider(CHAIN_RPC[chainId] || CHAIN_RPC[1]);
      const wallet = new Wallet(privateKey, provider);

      // Get the original transaction from pending pool
      let tx = null;
      try {
        const pendingBlock = await provider.send('eth_getBlockByNumber', ['pending', false]);
        if (pendingBlock?.transactions) {
          for (const txHash of pendingBlock.transactions) {
            const pendingTx = await provider.getTransaction(txHash);
            if (pendingTx && pendingTx.nonce === nonce && pendingTx.from?.toLowerCase() === address.toLowerCase()) {
              tx = pendingTx;
              break;
            }
          }
        }
      } catch (e) {
        this.logger.warn(`Failed to get tx: ${e.message}`);
      }
      
      if (!tx) {
        // Try to get from mempool API
        const pending = await this.getPendingTransactions(address, chainId);
        const found = pending.pendingTransactions?.find((t) => t.nonce === nonce);
        if (!found) {
          return { success: false, error: 'Transaction not found' };
        }
      }

      // Calculate new gas price
      let newGasPrice;
      const feeData = await provider.getFeeData();
      if (tx?.maxFeePerGas) {
        const baseFee = tx.maxFeePerGas;
        const priorityFee = tx.maxPriorityFeePerGas || ethers.parseUnits('1', 'gwei');
        newGasPrice = (baseFee * BigInt(Math.floor(gasMultiplier * 100))) / BigInt(100) + priorityFee;
      } else if (feeData.maxFeePerGas) {
        newGasPrice = (feeData.maxFeePerGas * BigInt(Math.floor(gasMultiplier * 100))) / BigInt(100);
      } else {
        const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
        newGasPrice = (gasPrice * BigInt(Math.floor(gasMultiplier * 100))) / BigInt(100);
      }

      // Create replacement transaction with same nonce but higher gas
      const speedUpTx = {
        to: tx?.to || address, // Cancel tx sends to self
        nonce: nonce,
        value: tx?.value || 0,
        gasLimit: tx?.gasLimit || 21000,
        gasPrice: newGasPrice,
        chainId: chainId,
      };

      // For cancellation, we send to ourselves with 0 value
      const cancelTx = {
        to: address,
        nonce: nonce,
        value: 0,
        gasLimit: 21000,
        gasPrice: newGasPrice,
        chainId: chainId,
      };

      // Sign and send the transaction
      const signedTx = await wallet.signTransaction(cancelTx);
      const sentTx = await provider.broadcastTransaction(signedTx);

      return {
        success: true,
        originalNonce: nonce,
        newTransactionHash: sentTx.hash,
        newGasPrice: newGasPrice.toString(),
        gasMultiplier,
        message: `Transaction sped up! New tx: ${sentTx.hash}`,
      };
    } catch (error) {
      this.logger.error(`Failed to speed up transaction: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelTransaction(
    address: string,
    nonce: number,
    privateKey: string,
    chainId: number = 1,
  ): Promise<any> {
    return this.speedUpTransaction(address, nonce, privateKey, chainId, 1.5);
  }

  async getGasRecommendation(chainId: number = 1): Promise<any> {
    try {
      const provider = new JsonRpcProvider(CHAIN_RPC[chainId] || CHAIN_RPC[1]);
      
      const feeData = await provider.getFeeData();

      // Use priority fee + base fee for EIP-1559, or gasPrice for legacy
      let currentGasPrice = feeData.maxFeePerGas ? 
        feeData.maxFeePerGas : feeData.gasPrice;
      
      if (!currentGasPrice) {
        currentGasPrice = ethers.parseUnits('20', 'gwei'); // Default fallback
      }

      const slowGas = (currentGasPrice * BigInt(80)) / BigInt(100);
      const normalGas = currentGasPrice;
      const fastGas = (currentGasPrice * BigInt(120)) / BigInt(100);

      // Get current block number for historical data
      const currentBlock = await provider.getBlockNumber();
      
      // Get historical data for prediction
      const blocks = [];
      for (let i = 1; i <= 10; i++) {
        try {
          const blockNum = currentBlock - i * 1000;
          if (blockNum > 0) {
            const block = await provider.getBlock(blockNum);
            if (block) {
              blocks.push(block);
            }
          }
        } catch (e) {
          break;
        }
      }

      // Calculate average gas from historical blocks
      let avgGas = currentGasPrice;
      if (blocks.length > 0) {
        const totalBaseFee = blocks.reduce((sum, b) => {
          return sum + (b.baseFeePerGas ? Number(b.baseFeePerGas) : 0);
        }, 0);
        avgGas = ethers.parseUnits((totalBaseFee / blocks.length).toString(), 'wei');
      }

      const recommendation = currentGasPrice < avgGas ? 'slow' : 
                            currentGasPrice > (avgGas * BigInt(150) / BigInt(100)) ? 'fast' : 'normal';

      return {
        chainId,
        slow: {
          gasPrice: slowGas.toString(),
          gwei: ethers.formatUnits(slowGas, 'gwei'),
        },
        normal: {
          gasPrice: normalGas.toString(),
          gwei: ethers.formatUnits(normalGas, 'gwei'),
        },
        fast: {
          gasPrice: fastGas.toString(),
          gwei: ethers.formatUnits(fastGas, 'gwei'),
        },
        current: {
          gasPrice: currentGasPrice.toString(),
          gwei: ethers.formatUnits(currentGasPrice, 'gwei'),
        },
        recommendation,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get gas recommendation: ${error.message}`);
      return {
        chainId,
        error: error.message,
        slow: { gwei: '10' },
        normal: { gwei: '20' },
        fast: { gwei: '50' },
        recommendation: 'normal',
      };
    }
  }

  async getNextNonce(address: string, chainId: number = 1): Promise<any> {
    try {
      const provider = new JsonRpcProvider(CHAIN_RPC[chainId] || CHAIN_RPC[1]);
      
      const [latestNonce, pendingNonce] = await Promise.all([
        provider.getTransactionCount(address, 'latest'),
        provider.getTransactionCount(address, 'pending'),
      ]);

      return {
        address,
        chainId,
        latestNonce,
        pendingNonce,
        nextNonce: pendingNonce,
      };
    } catch (error) {
      return {
        address,
        chainId,
        error: error.message,
      };
    }
  }
}
