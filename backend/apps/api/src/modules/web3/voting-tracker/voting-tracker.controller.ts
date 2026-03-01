import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  proposer: string;
  network: string;
  contractAddress: string;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  totalVotes: string;
  quorum: string;
  startBlock: number;
  endBlock: number;
  startTime: number;
  endTime: number;
  createdAt: number;
}

interface Vote {
  id: string;
  proposalId: string;
  voter: string;
  support: 'for' | 'against' | 'abstain';
  weight: string;
  reason?: string;
  timestamp: number;
  txHash: string;
}

interface DelegateInfo {
  address: string;
  delegatedVotes: string;
  tokenBalance: string;
  numberOfDelegators: number;
  votingPower: string;
}

// Mock data for popular DAOs
const MOCK_PROPOSALS: Proposal[] = [
  {
    id: '0x1a2b3c4d5e6f',
    title: 'Add WETH as Collateral Type',
    description: 'Proposal to add WETH as a collateral type on Aave V3 Ethereum pool. This would allow users to borrow against their WETH holdings.',
    status: 'active',
    proposer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    network: 'ethereum',
    contractAddress: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
    votesFor: '450000',
    votesAgainst: '120000',
    votesAbstain: '30000',
    totalVotes: '600000',
    quorum: '800000',
    startBlock: 19200000,
    endBlock: 19248000,
    startTime: Date.now() - 86400000 * 2,
    endTime: Date.now() + 86400000 * 3,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: '0x2b3c4d5e6f7a',
    title: 'Uniswap V4 Hooks Incentive Program',
    description: 'Establish a grants program for developers building hooks for Uniswap V4. The program would allocate 5M UNI tokens over 2 years.',
    status: 'passed',
    proposer: '0x8ba1f109551bD432803012645Hc136E7aF42Bf20',
    network: 'ethereum',
    contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    votesFor: '25000000',
    votesAgainst: '5000000',
    votesAbstain: '1000000',
    totalVotes: '31000000',
    quorum: '20000000',
    startBlock: 19100000,
    endBlock: 19148000,
    startTime: Date.now() - 86400000 * 15,
    endTime: Date.now() - 86400000 * 8,
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: '0x3c4d5e6f7a8b',
    title: 'Compound Treasury Diversification',
    description: 'Sell 10% of Treasury USDC to purchase ETH for protocol reserves. This diversification aims to reduce stablecoin exposure.',
    status: 'rejected',
    proposer: '0x9f8F72aA9304c8B593d555F12eF6589cC3B5d6d1',
    network: 'ethereum',
    contractAddress: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    votesFor: '150000',
    votesAgainst: '280000',
    votesAbstain: '20000',
    totalVotes: '450000',
    quorum: '400000',
    startBlock: 19050000,
    endBlock: 19098000,
    startTime: Date.now() - 86400000 * 25,
    endTime: Date.now() - 86400000 * 18,
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: '0x4d5e6f7a8b9c',
    title: 'Optimism Retroactive Funding Round 3',
    description: 'Allocate 30M OP tokens for Retroactive Funding Round 3 to reward projects that have contributed to the Optimism ecosystem.',
    status: 'active',
    proposer: '0x5A4EA1A3F3E72f8C8e4E4b2F3D7A9E1C2B5D8E0F',
    network: 'optimism',
    contractAddress: '0x4200000000000000000000000000000000000042',
    votesFor: '35000000',
    votesAgainst: '8000000',
    votesAbstain: '5000000',
    totalVotes: '48000000',
    quorum: '25000000',
    startBlock: 111500000,
    endBlock: 111980000,
    startTime: Date.now() - 86400000 * 1,
    endTime: Date.now() + 86400000 * 6,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: '0x5e6f7a8b9c0d',
    title: 'Arbitrum Security Council Nomination',
    description: 'Ratify new members to the Arbitrum Security Council for the upcoming term.',
    status: 'executed',
    proposer: '0x7c6e4A8C9B2D3E1F4A5B6C7D8E9F0A1B2C3D4E5F',
    network: 'arbitrum',
    contractAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    votesFor: '180000000',
    votesAgainst: '2000000',
    votesAbstain: '1000000',
    totalVotes: '183000000',
    quorum: '100000000',
    startBlock: 180000000,
    endBlock: 180480000,
    startTime: Date.now() - 86400000 * 30,
    endTime: Date.now() - 86400000 * 23,
    createdAt: Date.now() - 86400000 * 35,
  },
  {
    id: '0x6f7a8b9c0d1e',
    title: 'MakerDAO Endgame Structure Proposal',
    description: 'Implement the new governance structure as outlined in the MakerDAO Endgame plan.',
    status: 'active',
    proposer: '0x2d5063C14a8f4B8d2F3A4E5F6A7B8C9D0E1F2A3B',
    network: 'ethereum',
    contractAddress: '0x9f8F72aA9304c8B593d555F12eF6589cC3B5d6d1',
    votesFor: '5200000',
    votesAgainst: '1800000',
    votesAbstain: '400000',
    totalVotes: '7400000',
    quorum: '5000000',
    startBlock: 19250000,
    endBlock: 19298000,
    startTime: Date.now() - 86400000 * 3,
    endTime: Date.now() + 86400000 * 4,
    createdAt: Date.now() - 86400000 * 8,
  },
];

const MOCK_VOTES: Vote[] = [
  {
    id: 'v1',
    proposalId: '0x1a2b3c4d5e6f',
    voter: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    support: 'for',
    weight: '150000',
    reason: 'WETH as collateral increases capital efficiency',
    timestamp: Date.now() - 86400000,
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  {
    id: 'v2',
    proposalId: '0x1a2b3c4d5e6f',
    voter: '0x8ba1f109551bD432803012645Hc136E7aF42Bf20',
    support: 'against',
    weight: '80000',
    reason: 'Risk management concerns with WETH collateral',
    timestamp: Date.now() - 43200000,
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  {
    id: 'v3',
    proposalId: '0x4d5e6f7a8b9c',
    voter: '0x5A4EA1A3F3E72f8C8e4E4b2F3D7A9E1C2B5D8E0F',
    support: 'for',
    weight: '2000000',
    timestamp: Date.now() - 86400000 * 2,
    txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
  },
];

@Controller('web3/voting')
export class VotingTrackerController {
  /**
   * Get all proposals with optional filters
   */
  @Get('proposals')
  getProposals(
    @Query('network') network?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    let proposals = [...MOCK_PROPOSALS];

    if (network) {
      proposals = proposals.filter((p) => p.network === network);
    }
    if (status) {
      proposals = proposals.filter((p) => p.status === status);
    }

    const offsetNum = offset ? parseInt(offset) : 0;
    const limitNum = limit ? parseInt(limit) : 20;

    return {
      proposals: proposals.slice(offsetNum, offsetNum + limitNum),
      total: proposals.length,
      offset: offsetNum,
      limit: limitNum,
    };
  }

  /**
   * Get a single proposal by ID
   */
  @Get('proposals/:id')
  getProposal(@Param('id') id: string) {
    const proposal = MOCK_PROPOSALS.find((p) => p.id === id);
    if (!proposal) {
      return { error: 'Proposal not found' };
    }
    return proposal;
  }

  /**
   * Get votes for a proposal
   */
  @Get('proposals/:id/votes')
  getProposalVotes(
    @Param('id') id: string,
    @Query('support') support?: string,
  ) {
    let votes = MOCK_VOTES.filter((v) => v.proposalId === id);
    if (support) {
      votes = votes.filter((v) => v.support === support);
    }
    return votes;
  }

  /**
   * Get voting history for an address
   */
  @Get('votes/:address')
  getVotingHistory(@Param('address') address: string) {
    const votes = MOCK_VOTES.filter(
      (v) => v.voter.toLowerCase() === address.toLowerCase(),
    );
    return votes.map((v) => {
      const proposal = MOCK_PROPOSALS.find((p) => p.id === v.proposalId);
      return {
        ...v,
        proposalTitle: proposal?.title || 'Unknown',
        proposalStatus: proposal?.status || 'unknown',
      };
    });
  }

  /**
   * Get delegate information for an address
   */
  @Get('delegate/:address')
  getDelegateInfo(@Param('address') address: string): DelegateInfo {
    return {
      address: address,
      delegatedVotes: '125000',
      tokenBalance: '50000',
      numberOfDelegators: 3,
      votingPower: '175000',
    };
  }

  /**
   * Get DAO list with stats
   */
  @Get('daos')
  getDAOs() {
    return [
      {
        name: 'Aave',
        symbol: 'AAVE',
        network: 'ethereum',
        contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
        activeProposals: 1,
        totalProposals: 156,
        totalVotes: '45.2M',
        logo: '👻',
      },
      {
        name: 'Uniswap',
        symbol: 'UNI',
        network: 'ethereum',
        contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        activeProposals: 0,
        totalProposals: 89,
        totalVotes: '120.5M',
        logo: '🦄',
      },
      {
        name: 'Compound',
        symbol: 'COMP',
        network: 'ethereum',
        contractAddress: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
        activeProposals: 0,
        totalProposals: 234,
        totalVotes: '67.8M',
        logo: '🔷',
      },
      {
        name: 'Optimism',
        symbol: 'OP',
        network: 'optimism',
        contractAddress: '0x4200000000000000000000000000000000000042',
        activeProposals: 1,
        totalProposals: 45,
        totalVotes: '89.2M',
        logo: '🔴',
      },
      {
        name: 'Arbitrum',
        symbol: 'ARB',
        network: 'arbitrum',
        contractAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        activeProposals: 0,
        totalProposals: 32,
        totalVotes: '156.7M',
        logo: '🔵',
      },
      {
        name: 'MakerDAO',
        symbol: 'MKR',
        network: 'ethereum',
        contractAddress: '0x9f8F72aA9304c8B593d555F12eF6589cC3B5d6d1',
        activeProposals: 1,
        totalProposals: 312,
        totalVotes: '234.5M',
        logo: '🎩',
      },
    ];
  }

  /**
   * Get voting statistics
   */
  @Get('stats')
  getStats() {
    const activeProposals = MOCK_PROPOSALS.filter((p) => p.status === 'active');
    const totalVotes = MOCK_PROPOSALS.reduce(
      (acc, p) => acc + parseInt(p.totalVotes),
      0,
    );

    return {
      totalProposals: MOCK_PROPOSALS.length,
      activeProposals: activeProposals.length,
      passedProposals: MOCK_PROPOSALS.filter((p) => p.status === 'passed')
        .length,
      rejectedProposals: MOCK_PROPOSALS.filter((p) => p.status === 'rejected')
        .length,
      totalVotes: totalVotes.toString(),
      averageParticipation: '68%',
    };
  }
}
