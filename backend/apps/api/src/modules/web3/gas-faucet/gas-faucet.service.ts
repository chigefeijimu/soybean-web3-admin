import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

interface FaucetRequest {
  address: string;
  network: string;
  amount: string;
  email?: string;
}

interface FaucetStatus {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  network: string;
  amount: string;
  timestamp: number;
}

@Injectable()
export class GasFaucetService {
  private readonly logger = new Logger(GasFaucetService.name);
  private readonly faucetAddresses: Record<string, string> = {
    '1': '0x0000000000000000000000000000000000000000', // Mainnet - no faucet
    '5': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Goerli
    '11155111': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Sepolia
    '137': '0x0000000000000000000000000000000000000000', // Polygon - no faucet
    '80001': '0x0000000000000000000000000000000000000000', // Mumbai
    '42161': '0x0000000000000000000000000000000000000000', // Arbitrum
    '421613': '0xfF47F41FB1E8C2c6c7E1e1D3E4F5A6B7C8D9E0F1', // Arbitrum Goerli
    '56': '0x0000000000000000000000000000000000000000', // BSC
    '97': '0x0000000000000000000000000000000000000000', // BSC Testnet
    '10': '0x0000000000000000000000000000000000000000', // Optimism
    '8453': '0x0000000000000000000000000000000000000000', // Base
    '84531': '0x0000000000000000000000000000000000000000', // Base Goerli
  };

  // Mock transaction history (in production, this would be stored in database)
  private faucetTxHistory: Map<string, FaucetStatus[]> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get faucet address for a specific network
   */
  getFaucetAddress(network: string): { address: string; network: string; supported: boolean } {
    const faucetAddress = this.faucetAddresses[network] || '0x0000000000000000000000000000000000000000';
    const supported = network === '5' || network === '11155111' || network === '421613';
    
    return {
      address: supported ? faucetAddress : '0x0000000000000000000000000000000000000000',
      network,
      supported,
    };
  }

  /**
   * Get list of supported testnetworks
   */
  getSupportedNetworks(): Array<{ chainId: string; name: string; symbol: string; faucet: boolean }> {
    return [
      { chainId: '5', name: 'Ethereum Goerli', symbol: 'ETH', faucet: true },
      { chainId: '11155111', name: 'Ethereum Sepolia', symbol: 'ETH', faucet: true },
      { chainId: '421613', name: 'Arbitrum Goerli', symbol: 'ETH', faucet: true },
      { chainId: '1', name: 'Ethereum Mainnet', symbol: 'ETH', faucet: false },
      { chainId: '137', name: 'Polygon', symbol: 'MATIC', faucet: false },
      { chainId: '56', name: 'BNB Chain', symbol: 'BNB', faucet: false },
      { chainId: '10', name: 'Optimism', symbol: 'ETH', faucet: false },
      { chainId: '8453', name: 'Base', symbol: 'ETH', faucet: false },
    ];
  }

  /**
   * Request tokens from faucet
   */
  async requestTokens(request: FaucetRequest): Promise<{ success: boolean; txHash?: string; message: string }> {
    const { address, network, amount } = request;

    // Validate address
    if (!this.isValidAddress(address)) {
      return { success: false, message: 'Invalid wallet address' };
    }

    // Check if network is supported
    if (network !== '5' && network !== '11155111' && network !== '421613') {
      return { 
        success: false, 
        message: `Faucet not supported for network ${network}. Supported: Goerli (5), Sepolia (11155111), Arbitrum Goerli (421613)` 
      };
    }

    // Generate mock transaction hash
    const txHash = this.generateTxHash();
    
    // Record the transaction
    const status: FaucetStatus = {
      txHash,
      status: 'pending',
      network,
      amount: amount || '0.5',
      timestamp: Date.now(),
    };

    const history = this.faucetTxHistory.get(address) || [];
    history.unshift(status);
    this.faucetTxHistory.set(address, history);

    // Simulate transaction confirmation after 5 seconds
    setTimeout(() => {
      const idx = history.findIndex(h => h.txHash === txHash);
      if (idx >= 0) {
        history[idx].status = 'confirmed';
      }
    }, 5000);

    this.logger.log(`Faucet request: ${address} on ${network} - ${amount || '0.5'} ETH`);

    return {
      success: true,
      txHash,
      message: `Requested ${amount || '0.5'} ETH from faucet. Transaction pending...`,
    };
  }

  /**
   * Get transaction history for an address
   */
  getTransactionHistory(address: string): FaucetStatus[] {
    return this.faucetTxHistory.get(address) || [];
  }

  /**
   * Check transaction status
   */
  getTransactionStatus(txHash: string): FaucetStatus | null {
    for (const history of this.faucetTxHistory.values()) {
      const tx = history.find(h => h.txHash === txHash);
      if (tx) return tx;
    }
    return null;
  }

  /**
   * Get recommended gas prices for mainnet
   */
  async getGasRecommendations(): Promise<{
    slow: string;
    standard: string;
    fast: string;
    unit: string;
  }> {
    try {
      // In production, fetch from API
      // For now, return mock data
      return {
        slow: '20',
        standard: '35',
        fast: '50',
        unit: 'gwei',
      };
    } catch (error) {
      this.logger.error('Failed to get gas recommendations', error);
      return {
        slow: '20',
        standard: '35',
        fast: '50',
        unit: 'gwei',
      };
    }
  }

  /**
   * Bridge ETH from L1 to L2 (Layer 2)
   */
  async getBridgeQuote(fromNetwork: string, toNetwork: string, amount: string): Promise<{
    fromNetwork: string;
    toNetwork: string;
    amount: string;
    estimatedTime: string;
    fee: string;
  }> {
    // Mock bridge quote
    const bridgeFee = (parseFloat(amount) * 0.001).toFixed(6);
    
    return {
      fromNetwork,
      toNetwork,
      amount,
      estimatedTime: '10-30 minutes',
      fee: bridgeFee,
    };
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private generateTxHash(): string {
    const chars = 'abcdef0123456789';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }
}
