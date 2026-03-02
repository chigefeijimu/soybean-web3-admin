import { Injectable } from '@nestjs/common';

interface Network {
  chainId: string;
  name: string;
  symbol: string;
  faucet: boolean;
  faucetAddress: string;
  explorer: string;
}

interface RequestRecord {
  address: string;
  network: string;
  amount: string;
  txHash: string;
  timestamp: Date;
}

@Injectable()
export class Web3GasFaucetService {
  private networks: Network[] = [
    {
      chainId: '5',
      name: 'Ethereum Goerli',
      symbol: 'ETH',
      faucet: true,
      faucetAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      explorer: 'https://goerli.etherscan.io',
    },
    {
      chainId: '11155111',
      name: 'Ethereum Sepolia',
      symbol: 'ETH',
      faucet: true,
      faucetAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      explorer: 'https://sepolia.etherscan.io',
    },
    {
      chainId: '421613',
      name: 'Arbitrum Goerli',
      symbol: 'ETH',
      faucet: true,
      faucetAddress: '0xfcA11cE71f5CCFac70934A80158910616dA02087',
      explorer: 'https://goerli.arbiscan.io',
    },
    {
      chainId: '420',
      name: 'Optimism Goerli',
      symbol: 'ETH',
      faucet: true,
      faucetAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      explorer: 'https://goerli-optimism.etherscan.io',
    },
    {
      chainId: '80001',
      name: 'Polygon Mumbai',
      symbol: 'MATIC',
      faucet: true,
      faucetAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      explorer: 'https://mumbai.polygonscan.com',
    },
    {
      chainId: '97',
      name: 'BNB Chain Testnet',
      symbol: 'BNB',
      faucet: true,
      faucetAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      explorer: 'https://testnet.bscscan.com',
    },
  ];

  private requestHistory: RequestRecord[] = [];
  private requestCooldowns = new Map<string, number>();

  getSupportedNetworks(): Network[] {
    return this.networks;
  }

  getFaucetAddress(chainId: string): string | null {
    const network = this.networks.find((n) => n.chainId === chainId);
    return network?.faucetAddress || null;
  }

  async requestTokens(
    address: string,
    network: string,
    amount?: string,
  ): Promise<{ success: boolean; txHash?: string; message: string }> {
    // Validate address
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return { success: false, message: 'Invalid wallet address' };
    }

    // Check if network is supported
    const networkConfig = this.networks.find((n) => n.chainId === network);
    if (!networkConfig || !networkConfig.faucet) {
      return { success: false, message: 'Network not supported or faucet not available' };
    }

    // Check cooldown (24 hours)
    const lastRequest = this.requestCooldowns.get(address.toLowerCase());
    const now = Date.now();
    if (lastRequest && now - lastRequest < 24 * 60 * 60 * 1000) {
      const remainingHours = Math.ceil(
        (24 * 60 * 60 * 1000 - (now - lastRequest)) / (1000 * 60 * 60),
      );
      return {
        success: false,
        message: `Please wait ${remainingHours} hours before requesting again`,
      };
    }

    // Generate mock transaction hash
    const txHash = `0x${this.generateRandomHash()}`;
    const requestAmount = amount || '0.5';

    // Record the request
    const record: RequestRecord = {
      address: address.toLowerCase(),
      network,
      amount: requestAmount,
      txHash,
      timestamp: new Date(),
    };
    this.requestHistory.push(record);

    // Set cooldown
    this.requestCooldowns.set(address.toLowerCase(), now);

    return {
      success: true,
      txHash,
      message: `Successfully requested ${requestAmount} ${networkConfig.symbol}! Transaction: ${txHash}`,
    };
  }

  getRequestHistory(address: string): RequestRecord[] {
    return this.requestHistory
      .filter((r) => r.address === address.toLowerCase())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);
  }

  async getGasPrice(chainId: string): Promise<{
    slow: string;
    standard: string;
    fast: string;
    unit: string;
  }> {
    // Mock gas prices based on network
    const gasPrices: Record<string, { slow: string; standard: string; fast: string }> = {
      '5': { slow: '20', standard: '35', fast: '50' },
      '11155111': { slow: '15', standard: '25', fast: '40' },
      '421613': { slow: '0.1', standard: '0.15', fast: '0.2' },
      '420': { slow: '0.001', standard: '0.002', fast: '0.005' },
      '80001': { slow: '30', standard: '50', fast: '80' },
      '97': { slow: '3', standard: '5', fast: '10' },
    };

    const prices = gasPrices[chainId] || { slow: '20', standard: '35', fast: '50' };

    return {
      ...prices,
      unit: chainId === '421613' || chainId === '420' ? 'gwei' : 'gwei',
    };
  }

  private generateRandomHash(): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }
}
