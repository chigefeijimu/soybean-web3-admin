import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateMultisigWalletDto, CreateTransactionDto, SignTransactionDto, ExecuteTransactionDto, GetTransactionsDto } from '../dto/multisig-tx.dto';

interface MultisigWallet {
  address: string;
  name: string;
  threshold: number;
  owners: string[];
  nonce: number;
  createdAt: string;
}

interface MultisigTransaction {
  txHash: string;
  walletAddress: string;
  to: string;
  value: string;
  data: string;
  nonce: number;
  signatures: string[];
  executed: boolean;
  executedAt?: string;
  createdAt: string;
}

@Injectable()
export class MultisigTxBuilderService {
  private readonly wallets: Map<string, MultisigWallet> = new Map();
  private readonly transactions: Map<string, MultisigTransaction> = new Map();
  private readonly ethscanApiKey = process.env.ETHERSCAN_API_KEY || '';

  constructor(private readonly httpService: HttpService) {}

  // Generate a deterministic address for the multisig wallet (simulation)
  private generateWalletAddress(owners: string[], threshold: number): string {
    const input = owners.sort().join(',') + threshold.toString();
    const hash = this.simpleHash(input);
    return '0x' + hash.slice(0, 40).padStart(40, '0');
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private generateTxHash(walletAddress: string, to: string, value: string, data: string, nonce: number): string {
    const input = walletAddress + to + value + data + nonce.toString();
    const hash = this.simpleHash(input);
    return '0x' + hash.padStart(64, '0');
  }

  async createWallet(dto: CreateMultisigWalletDto): Promise<MultisigWallet> {
    const address = this.generateWalletAddress(dto.owners, dto.threshold);
    
    const wallet: MultisigWallet = {
      address,
      name: dto.name,
      threshold: dto.threshold,
      owners: dto.owners,
      nonce: 0,
      createdAt: new Date().toISOString(),
    };
    
    this.wallets.set(address, wallet);
    return wallet;
  }

  async getWallet(address: string): Promise<MultisigWallet | null> {
    return this.wallets.get(address) || null;
  }

  async listWallets(): Promise<MultisigWallet[]> {
    return Array.from(this.wallets.values());
  }

  async createTransaction(dto: CreateTransactionDto): Promise<MultisigTransaction> {
    const wallet = this.wallets.get(dto.walletAddress.toLowerCase());
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const txHash = this.generateTxHash(
      dto.walletAddress,
      dto.to,
      dto.value || '0',
      dto.data || '0x',
      dto.nonce || wallet.nonce
    );

    const tx: MultisigTransaction = {
      txHash,
      walletAddress: dto.walletAddress.toLowerCase(),
      to: dto.to,
      value: dto.value || '0',
      data: dto.data || '0x',
      nonce: dto.nonce || wallet.nonce,
      signatures: [],
      executed: false,
      createdAt: new Date().toISOString(),
    };

    this.transactions.set(txHash, tx);
    return tx;
  }

  async signTransaction(dto: SignTransactionDto): Promise<MultisigTransaction> {
    const tx = this.transactions.get(dto.txHash);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const wallet = this.wallets.get(tx.walletAddress);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Verify signer is an owner
    if (!wallet.owners.map(o => o.toLowerCase()).includes(dto.signerAddress.toLowerCase())) {
      throw new Error('Signer is not an owner');
    }

    // Check if already signed
    const existingSig = tx.signatures.find(s => s.toLowerCase().startsWith(dto.signerAddress.toLowerCase()));
    if (existingSig) {
      throw new Error('Already signed');
    }

    // Add signature (format: signer:signature)
    tx.signatures.push(`${dto.signerAddress.toLowerCase()}:${dto.signature}`);
    
    return tx;
  }

  async executeTransaction(dto: ExecuteTransactionDto): Promise<MultisigTransaction> {
    const tx = this.transactions.get(dto.txHash);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const wallet = this.wallets.get(tx.walletAddress);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check if enough signatures
    if (tx.signatures.length < wallet.threshold) {
      throw new Error(`Need ${wallet.threshold} signatures, have ${tx.signatures.length}`);
    }

    tx.executed = true;
    tx.executedAt = new Date().toISOString();
    
    // Increment wallet nonce
    wallet.nonce++;

    return tx;
  }

  async getTransaction(txHash: string): Promise<MultisigTransaction | null> {
    return this.transactions.get(txHash) || null;
  }

  async getTransactions(dto: GetTransactionsDto): Promise<MultisigTransaction[]> {
    let txs = Array.from(this.transactions.values())
      .filter(tx => tx.walletAddress === dto.walletAddress.toLowerCase());

    if (dto.status === 'pending') {
      txs = txs.filter(tx => !tx.executed);
    } else if (dto.status === 'executed') {
      txs = txs.filter(tx => tx.executed);
    }

    if (dto.limit) {
      txs = txs.slice(0, dto.limit);
    }

    return txs;
  }

  // Get on-chain multisig wallet info (for Gnosis Safe, etc.)
  async getOnChainMultisigInfo(address: string, chain: string = 'ethereum'): Promise<any> {
    try {
      const chainIdMap: Record<string, string> = {
        ethereum: '1',
        polygon: '137',
        arbitrum: '42161',
        optimism: '10',
        base: '8453',
        bsc: '56',
        avalanche: '43114',
      };
      
      const chainId = chainIdMap[chain] || '1';
      const url = `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${address}&apikey=${this.ethscanApiKey}`;
      
      const response = await firstValueFrom(this.httpService.get(url));
      return {
        address,
        chain,
        chainId,
        info: 'On-chain detection requires API key for full functionality',
        simulation: true,
      };
    } catch (error) {
      return { error: 'Failed to fetch on-chain data' };
    }
  }

  // Simulate transaction execution
  async simulateExecution(txHash: string): Promise<any> {
    const tx = this.transactions.get(txHash);
    if (!tx) {
      throw new Error('Transaction not found');
    }

    const wallet = this.wallets.get(tx.walletAddress);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const canExecute = tx.signatures.length >= wallet.threshold;
    
    return {
      txHash,
      canExecute,
      requiredSignatures: wallet.threshold,
      currentSignatures: tx.signatures.length,
      missingSignatures: Math.max(0, wallet.threshold - tx.signatures.length),
      signers: wallet.owners,
      signersNeeded: wallet.threshold,
      simulation: true,
    };
  }
}
