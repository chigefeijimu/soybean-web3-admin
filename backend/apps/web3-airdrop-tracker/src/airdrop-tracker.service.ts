import { Injectable } from '@nestjs/common';

export interface AirdropClaim {
  id: string;
  token: string;
  tokenSymbol: string;
  amount: number;
  valueUsd: number;
  chain: string;
  status: 'claimable' | 'claimed' | 'expired' | 'upcoming';
  claimDeadline?: string;
  proofRequired: boolean;
  txHash?: string;
  claimedAt?: string;
}

export interface AirdropProject {
  id: string;
  name: string;
  logo: string;
  description: string;
  chain: string;
  token: string;
  tokenSymbol: string;
  snapshotDate?: string;
  airdropDate?: string;
  claimDeadline?: string;
  totalDistributed: number;
  eligibleAddresses: number;
  estimatedValue: number;
  status: 'upcoming' | 'active' | 'ended';
  requirements: string[];
  proofUrl?: string;
  website: string;
  twitter?: string;
}

export interface WalletAirdropSummary {
  wallet: string;
  totalAirdrops: number;
  totalValue: number;
  pendingClaims: AirdropClaim[];
  claimedAirdrops: AirdropClaim[];
  upcomingAirdrops: AirdropProject[];
}

@Injectable()
export class AirdropTrackerService {
  private readonly supportedChains = [
    'Ethereum',
    'Arbitrum',
    'Optimism',
    'Polygon',
    'Base',
    'Avalanche',
    'BSC',
    'Solana',
    'zkSync',
    'Starknet',
    'Linea',
    'Scroll',
  ];

  private readonly knownAirdrops: AirdropProject[] = [
    {
      id: 'uniswap-2024',
      name: 'Uniswap',
      logo: '🦄',
      description: 'Leading DEX protocol',
      chain: 'Ethereum',
      token: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      tokenSymbol: 'UNI',
      snapshotDate: '2024-09-01',
      airdropDate: '2024-09-17',
      claimDeadline: '2025-09-17',
      totalDistributed: 150000000,
      eligibleAddresses: 50000,
      estimatedValue: 25000000,
      status: 'active',
      requirements: [
        'Swapped on Uniswap V3',
        'Provided liquidity',
        'Used protocol multiple times',
      ],
      website: 'https://uniswap.org',
      twitter: '@uniswap',
    },
    {
      id: 'arbitrum-2024',
      name: 'Arbitrum',
      logo: '🔵',
      description: 'Layer 2 scaling solution',
      chain: 'Arbitrum',
      token: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      tokenSymbol: 'ARB',
      snapshotDate: '2023-02-15',
      airdropDate: '2023-03-23',
      claimDeadline: '2024-03-23',
      totalDistributed: 1200000000,
      eligibleAddresses: 250000,
      estimatedValue: 180000000,
      status: 'ended',
      requirements: [
        'Bridge to Arbitrum',
        'Used dApps on Arbitrum',
        'Transaction history',
      ],
      website: 'https://arbitrum.io',
      twitter: '@arbitrum',
    },
    {
      id: 'optimism-2024',
      name: 'Optimism',
      logo: '🔴',
      description: 'Optimistic Rollup',
      chain: 'Optimism',
      token: '0x4200000000000000000000000000000000000042',
      tokenSymbol: 'OP',
      snapshotDate: '2024-05-01',
      airdropDate: '2024-05-28',
      claimDeadline: '2025-05-28',
      totalDistributed: 100000000,
      eligibleAddresses: 40000,
      estimatedValue: 15000000,
      status: 'active',
      requirements: [
        'Used Optimism',
        'Multi-hop transactions',
        'Dapp interactions',
      ],
      website: 'https://optimism.io',
      twitter: '@optimismFND',
    },
    {
      id: 'zksync-era',
      name: 'zkSync Era',
      logo: '⚡',
      description: 'ZK Rollup for Ethereum',
      chain: 'zkSync',
      token: '0x5A7C6B3eBf74D2Bc7d6A829E2B1e1aE4c1b5F7A8',
      tokenSymbol: 'ZK',
      snapshotDate: '2024-10-01',
      airdropDate: '2024-11-15',
      totalDistributed: 3000000000,
      eligibleAddresses: 100000,
      estimatedValue: 45000000,
      status: 'upcoming',
      requirements: [
        'Bridge to zkSync Era',
        'Native USDC transactions',
        'Social interactions',
      ],
      website: 'https://zksync.io',
      twitter: '@zksync',
    },
    {
      id: 'starknet',
      name: 'Starknet',
      logo: '🌌',
      description: 'Validity Rollup for Ethereum',
      chain: 'Starknet',
      token: '0x04718f5a0FC34cC1AF16A1dE28e6D18E6d40906',
      tokenSymbol: 'STRK',
      snapshotDate: '2024-06-01',
      airdropDate: '2024-02-20',
      claimDeadline: '2025-02-20',
      totalDistributed: 10000000000,
      eligibleAddresses: 150000,
      estimatedValue: 130000000,
      status: 'active',
      requirements: [
        'Starknet mainnet transactions',
        'Argent X or Braavos wallet',
        'DeFi interactions',
      ],
      website: 'https://starknet.io',
      twitter: '@Starknet',
    },
    {
      id: 'layerzero',
      name: 'LayerZero',
      logo: '🔗',
      description: 'Cross-chain messaging protocol',
      chain: 'Ethereum',
      token: '0x0000000000000000000000000000000000000001',
      tokenSymbol: 'ZRO',
      snapshotDate: '2024-08-01',
      airdropDate: '2024-12-01',
      claimDeadline: '2025-12-01',
      totalDistributed: 1000000000,
      eligibleAddresses: 80000,
      estimatedValue: 80000000,
      status: 'active',
      requirements: [
        'Omnichain transactions',
        'Multiple chains usage',
        'dApp interactions',
      ],
      website: 'https://layerzero.network',
      twitter: '@LayerZero_FDN',
    },
    {
      id: 'scroll',
      name: 'Scroll',
      logo: '📜',
      description: 'ZK Rollup for Ethereum',
      chain: 'Scroll',
      token: '0x5b3b5CF2D7E5f5C5e6E7D6C8F9A1B2C3D4E5F6A7',
      tokenSymbol: 'SCR',
      snapshotDate: '2024-07-01',
      airdropDate: '2024-10-15',
      totalDistributed: 1000000000,
      eligibleAddresses: 60000,
      estimatedValue: 20000000,
      status: 'upcoming',
      requirements: [
        'Bridge to Scroll',
        'Used zkEVM dApps',
      ],
      website: 'https://scroll.io',
      twitter: '@Scroll_ZK',
    },
    {
      id: 'base',
      name: 'Base',
      logo: '🏠',
      description: 'Coinbase L2',
      chain: 'Base',
      token: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
      tokenSymbol: 'BASE',
      snapshotDate: '2024-08-01',
      airdropDate: '2025-01-15',
      totalDistributed: 2000000000,
      eligibleAddresses: 120000,
      estimatedValue: 60000000,
      status: 'upcoming',
      requirements: [
        'Transacted on Base',
        'DeFi interactions',
        'NFT mints',
      ],
      website: 'https://base.org',
      twitter: '@base',
    },
  ];

  private generateMockClaims(wallet: string): AirdropClaim[] {
    const claims: AirdropClaim[] = [];
    const statuses: Array<'claimable' | 'claimed' | 'expired'> = [
      'claimable',
      'claimed',
      'expired',
    ];

    // Generate 1-4 mock claims
    const numClaims = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < numClaims; i++) {
      const airdrop = this.knownAirdrops[Math.floor(Math.random() * this.knownAirdrops.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const amount = Math.floor(Math.random() * 1000) + 100;

      claims.push({
        id: `${airdrop.id}-${wallet.slice(0, 6)}`,
        token: airdrop.token,
        tokenSymbol: airdrop.tokenSymbol,
        amount,
        valueUsd: (amount * airdrop.estimatedValue) / airdrop.totalDistributed,
        chain: airdrop.chain,
        status,
        claimDeadline: airdrop.claimDeadline,
        proofRequired: Math.random() > 0.5,
        txHash: status === 'claimed' ? `0x${Math.random().toString(16).slice(2)}...` : undefined,
        claimedAt: status === 'claimed' ? '2024-12-15T10:30:00Z' : undefined,
      });
    }

    return claims;
  }

  async getSupportedChains(): Promise<string[]> {
    return this.supportedChains;
  }

  async getAirdropProjects(filters?: {
    chain?: string;
    status?: 'upcoming' | 'active' | 'ended';
  }): Promise<AirdropProject[]> {
    let projects = [...this.knownAirdrops];

    if (filters?.chain) {
      projects = projects.filter((p) => p.chain.toLowerCase() === filters.chain.toLowerCase());
    }

    if (filters?.status) {
      projects = projects.filter((p) => p.status === filters.status);
    }

    return projects;
  }

  async getAirdropProject(id: string): Promise<AirdropProject | null> {
    return this.knownAirdrops.find((p) => p.id === id) || null;
  }

  async getWalletAirdropSummary(wallet: string): Promise<WalletAirdropSummary> {
    const claims = this.generateMockClaims(wallet);
    const pendingClaims = claims.filter((c) => c.status === 'claimable');
    const claimedAirdrops = claims.filter((c) => c.status === 'claimed');
    const upcomingProjects = this.knownAirdrops.filter((p) => p.status === 'upcoming');

    return {
      wallet,
      totalAirdrops: claims.length,
      totalValue: claims.reduce((sum, c) => sum + c.valueUsd, 0),
      pendingClaims,
      claimedAirdrops,
      upcomingAirdrops: upcomingProjects.slice(0, 3),
    };
  }

  async getAirdropHistory(wallet: string): Promise<{
    totalClaimed: number;
    totalValue: number;
    history: Array<{ date: string; project: string; token: string; amount: number; valueUsd: number }>;
  }> {
    const claimed = this.generateMockClaims(wallet).filter((c) => c.status === 'claimed');
    
    return {
      totalClaimed: claimed.length,
      totalValue: claimed.reduce((sum, c) => sum + c.valueUsd, 0),
      history: claimed.map((c) => ({
        date: c.claimedAt || '2024-12-01',
        project: this.knownAirdrops.find((p) => p.tokenSymbol === c.tokenSymbol)?.name || 'Unknown',
        token: c.tokenSymbol,
        amount: c.amount,
        valueUsd: c.valueUsd,
      })),
    };
  }

  async getAirdropAlerts(wallet: string): Promise<Array<{
    id: string;
    type: 'claim_reminder' | 'deadline_approaching' | 'new_airdrop';
    projectName: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
  }>> {
    return [
      {
        id: '1',
        type: 'claim_reminder',
        projectName: 'LayerZero',
        message: 'You have unclaimed ZRO tokens worth approximately $150',
        priority: 'high',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'deadline_approaching',
        projectName: 'Uniswap',
        message: 'UNI claim deadline is approaching in 30 days',
        priority: 'medium',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        type: 'new_airdrop',
        projectName: 'Base',
        message: 'Base airdrop announced! Check eligibility.',
        priority: 'high',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async getEligibilityCheck(wallet: string, projectId: string): Promise<{
    eligible: boolean;
    estimatedAmount: number;
    estimatedValue: number;
    requirements: string[];
    metRequirements: string[];
    missingRequirements: string[];
  }> {
    const project = this.knownAirdrops.find((p) => p.id === projectId);
    if (!project) {
      return {
        eligible: false,
        estimatedAmount: 0,
        estimatedValue: 0,
        requirements: [],
        metRequirements: [],
        missingRequirements: [],
      };
    }

    // Mock eligibility check
    const eligible = Math.random() > 0.3;
    const metRequirements = eligible 
      ? project.requirements.slice(0, Math.floor(Math.random() * project.requirements.length) + 1)
      : [];
    const missingRequirements = eligible 
      ? project.requirements.filter((r) => !metRequirements.includes(r))
      : project.requirements;

    const estimatedAmount = eligible ? Math.floor(Math.random() * 500) + 100 : 0;
    const estimatedValue = (estimatedAmount * project.estimatedValue) / project.totalDistributed;

    return {
      eligible,
      estimatedAmount,
      estimatedValue,
      requirements: project.requirements,
      metRequirements,
      missingRequirements,
    };
  }

  async getAirdropStats(): Promise<{
    totalProjects: number;
    activeAirdrops: number;
    upcomingAirdrops: number;
    totalValueDistributed: number;
    topChains: Array<{ chain: string; count: number }>;
  }> {
    return {
      totalProjects: this.knownAirdrops.length,
      activeAirdrops: this.knownAirdrops.filter((p) => p.status === 'active').length,
      upcomingAirdrops: this.knownAirdrops.filter((p) => p.status === 'upcoming').length,
      totalValueDistributed: this.knownAirdrops.reduce((sum, p) => sum + p.estimatedValue, 0),
      topChains: [
        { chain: 'Ethereum', count: 3 },
        { chain: 'Arbitrum', count: 2 },
        { chain: 'Optimism', count: 2 },
        { chain: 'zkSync', count: 1 },
        { chain: 'Base', count: 1 },
      ],
    };
  }
}
