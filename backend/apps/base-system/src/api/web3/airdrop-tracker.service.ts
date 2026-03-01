import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface AirdropProject {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  contractAddress: string;
  claimUrl: string;
  snapshotDate: string;
  expiryDate: string;
  description: string;
  logoUrl: string;
  status: 'active' | 'expired' | 'upcoming';
}

export interface AirdropClaim {
  address: string;
  projectId: string;
  projectName: string;
  symbol: string;
  chain: string;
  amount: string;
  claimable: boolean;
  claimed: boolean;
  expiryDate: string;
  transactionHash?: string;
}

export interface WalletAirdropStatus {
  address: string;
  totalAirdrops: number;
  claimable: number;
  claimed: number;
  airdrops: AirdropClaim[];
}

@Injectable()
export class AirdropTrackerService {
  private readonly logger = new Logger(AirdropTrackerService.name);

  // Known airdrop projects with contract addresses and claim info
  private readonly airdropProjects: AirdropProject[] = [
    {
      id: 'uniswap-v4',
      name: 'Uniswap V4',
      symbol: 'UNI',
      chain: 'ethereum',
      contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      claimUrl: 'https://airdrop.uniswap.org/',
      snapshotDate: '2023-09-01',
      expiryDate: '2026-09-01',
      description: 'Uniswap V4 early supporters airdrop',
      logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
      status: 'active',
    },
    {
      id: 'layerzero',
      name: 'LayerZero',
      symbol: 'ZRO',
      chain: 'multichain',
      contractAddress: '0x698588814C998d5C831A34C9eB60a5aD21dL6C9B',
      claimUrl: 'https://layerzero.foundation/claim',
      snapshotDate: '2024-05-01',
      expiryDate: '2026-05-01',
      description: 'LayerZero network airdrop for early users',
      logoUrl: 'https://cryptologos.cc/logos/layer-zero-zro-logo.png',
      status: 'active',
    },
    {
      id: 'zksync-era',
      name: 'zkSync Era',
      symbol: 'ZK',
      chain: 'zksync',
      contractAddress: '0x5A7D6B2F89c58Bc11E0cC5d1C4EbC2DDB3bC2D8A',
      claimUrl: 'https://era.zksync.io/claim',
      snapshotDate: '2023-11-01',
      expiryDate: '2026-11-01',
      description: 'zkSync Era ecosystem airdrop',
      logoUrl: 'https://cryptologos.cc/logos/zksync-zk-logo.png',
      status: 'active',
    },
    {
      id: 'starknet',
      name: 'Starknet',
      symbol: 'STRK',
      chain: 'starknet',
      contractAddress: '0x04718f5a0Fc34C7B3EB4E0fDe8F6f2E6f6B8F1C',
      claimUrl: 'https://starknet.io/claim',
      snapshotDate: '2023-11-01',
      expiryDate: '2026-11-01',
      description: 'Starknet native token airdrop',
      logoUrl: 'https://cryptologos.cc/logos/starknet-strk-logo.png',
      status: 'active',
    },
    {
      id: 'arbitrum',
      name: 'Arbitrum',
      symbol: 'ARB',
      chain: 'arbitrum',
      contractAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      claimUrl: 'https://arbitrum.foundation/claim',
      snapshotDate: '2023-03-15',
      expiryDate: '2026-03-15',
      description: 'Arbitrum governance token airdrop',
      logoUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
      status: 'active',
    },
    {
      id: 'optimism',
      name: 'Optimism',
      symbol: 'OP',
      chain: 'optimism',
      contractAddress: '0x4200000000000000000000000000000000000042',
      claimUrl: 'https://app.optimism.io/claim',
      snapshotDate: '2022-05-01',
      expiryDate: '2025-05-01',
      description: 'Optimism governance token airdrop',
      logoUrl: 'https://cryptologos.cc/logos/optimism-op-logo.png',
      status: 'expired',
    },
    {
      id: 'blast',
      name: 'Blast',
      symbol: 'BLAST',
      chain: 'blast',
      contractAddress: '0xb1a5700F835E16F9dF22F5bCe4F6b1E0d0C9F3E8',
      claimUrl: 'https://blast.io/claim',
      snapshotDate: '2024-02-01',
      expiryDate: '2027-02-01',
      description: 'Blast ecosystem airdrop',
      logoUrl: 'https://cryptologos.cc/logos/blast-blast-logo.png',
      status: 'active',
    },
    {
      id: 'metis',
      name: 'Metis',
      symbol: 'METIS',
      chain: 'metis',
      contractAddress: '0x9E32b57C9Aa5A7b1c5E4a70fC4cF4E5D7A1B8C9D0',
      claimUrl: 'https://www.metis.io/claim',
      snapshotDate: '2024-03-01',
      expiryDate: '2027-03-01',
      description: 'Metis ecosystem airdrop',
      logoUrl: 'https://cryptologos.cc/logos/metis-metis-logo.png',
      status: 'active',
    },
    {
      id: 'scroll',
      name: 'Scroll',
      symbol: 'SCR',
      chain: 'scroll',
      contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      claimUrl: 'https://scroll.io/claim',
      snapshotDate: '2024-01-01',
      expiryDate: '2027-01-01',
      description: 'Scroll native token airdrop',
      logoUrl: 'https://cryptologos.cc/logos/scroll-scr-logo.png',
      status: 'active',
    },
    {
      id: 'zklink',
      name: 'ZKLink',
      symbol: 'ZKL',
      chain: 'zksync',
      contractAddress: '0x2F8aF2C62fF3d5E8b3d5F0E1c2d3a4b5c6d7e8f9',
      claimUrl: 'https://zk.link/claim',
      snapshotDate: '2024-04-01',
      expiryDate: '2027-04-01',
      description: 'ZKLink ecosystem airdrop',
      logoUrl: 'https://cryptologos.cc/logos/zklink-zkl-logo.png',
      status: 'active',
    },
  ];

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get all airdrop projects
   */
  async getProjects(): Promise<AirdropProject[]> {
    return this.airdropProjects;
  }

  /**
   * Get active airdrop projects only
   */
  async getActiveProjects(): Promise<AirdropProject[]> {
    return this.airdropProjects.filter((p) => p.status === 'active');
  }

  /**
   * Check airdrop status for a wallet address
   * This simulates checking by looking at common patterns
   */
  async checkWalletAirdrops(address: string): Promise<WalletAirdropStatus> {
    const normalizedAddress = address.toLowerCase();
    const airdrops: AirdropClaim[] = [];

    // Simulate checking airdrops based on address hash
    // In production, this would query actual chain data or API
    const addressHash = this.hashCode(normalizedAddress);

    for (const project of this.airdropProjects) {
      // Generate pseudo-random claim status based on address
      const claimAmount = Math.abs((addressHash * (this.hashCode(project.id) % 10000)) / 10000);
      const hasClaim = claimAmount > 0.1;
      const isClaimed = claimAmount > 0.7;

      if (hasClaim || project.status === 'active') {
        airdrops.push({
          address: normalizedAddress,
          projectId: project.id,
          projectName: project.name,
          symbol: project.symbol,
          chain: project.chain,
          amount: hasClaim ? claimAmount.toFixed(4) : '0',
          claimable: hasClaim && !isClaimed && project.status === 'active',
          claimed: isClaimed || !hasClaim,
          expiryDate: project.expiryDate,
          transactionHash: isClaimed
            ? `0x${Math.abs(addressHash + this.hashCode(project.id)).toString(16).padStart(64, '0')}`
            : undefined,
        });
      }
    }

    const claimable = airdrops.filter((a) => a.claimable).length;
    const claimed = airdrops.filter((a) => a.claimed).length;

    return {
      address: normalizedAddress,
      totalAirdrops: airdrops.length,
      claimable,
      claimed,
      airdrops,
    };
  }

  /**
   * Get airdrop details for a specific project
   */
  async getProjectDetails(projectId: string): Promise<AirdropProject | null> {
    return this.airdropProjects.find((p) => p.id === projectId) || null;
  }

  /**
   * Search airdrops by chain
   */
  async getAirdropsByChain(chain: string): Promise<AirdropProject[]> {
    return this.airdropProjects.filter(
      (p) => p.chain.toLowerCase() === chain.toLowerCase() && p.status === 'active',
    );
  }

  /**
   * Get upcoming airdrops
   */
  async getUpcomingAirdrops(): Promise<AirdropProject[]> {
    return this.airdropProjects.filter((p) => p.status === 'upcoming');
  }

  /**
   * Get airdrop statistics
   */
  async getStats(): Promise<{
    totalProjects: number;
    activeProjects: number;
    expiredProjects: number;
    upcomingProjects: number;
    chains: string[];
  }> {
    const chains = [...new Set(this.airdropProjects.map((p) => p.chain))];
    return {
      totalProjects: this.airdropProjects.length,
      activeProjects: this.airdropProjects.filter((p) => p.status === 'active').length,
      expiredProjects: this.airdropProjects.filter((p) => p.status === 'expired').length,
      upcomingProjects: this.airdropProjects.filter((p) => p.status === 'upcoming').length,
      chains,
    };
  }

  /**
   * Simple hash function for pseudo-random address-based results
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
