import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

export interface DaoProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorum: string;
  startBlock: number;
  endBlock: number;
  createdAt: string;
  executedAt?: string;
  category: 'parameter' | 'treasury' | 'governance' | 'emergency';
}

export interface DaoVote {
  id: string;
  proposalId: string;
  voter: string;
  support: 'for' | 'against' | 'abstain';
  weight: string;
  reason?: string;
  timestamp: string;
}

export interface DaoDelegate {
  address: string;
  delegatedVotes: string;
  tokenHolders: string[];
  delegators: string[];
  votingPower: string;
}

export interface DaoTreasury {
  balance: string;
  tokens: Array<{
    symbol: string;
    address: string;
    balance: string;
    value: number;
  }>;
}

@ApiTags('Web3 DAO Governance')
@Controller('api/web3/dao')
export class Web3DaoController {
  private proposals: DaoProposal[] = [
    {
      id: '1',
      title: 'Increase Treasury Diversification',
      description: 'Proposal to diversify 10% of treasury into stablecoins for operational runway',
      proposer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab12',
      status: 'active',
      forVotes: '2500000',
      againstVotes: '800000',
      abstainVotes: '100000',
      quorum: '4000000',
      startBlock: 18500000,
      endBlock: 18550000,
      createdAt: '2026-02-28T10:00:00Z',
      category: 'treasury'
    },
    {
      id: '2',
      title: 'Protocol Fee Adjustment',
      description: 'Reduce swap fee from 0.3% to 0.25% to increase competitiveness',
      proposer: '0x9B3a54D092fF3f4f4aD4dF4B4eD4f4B4eD4f4B4e',
      status: 'passed',
      forVotes: '5200000',
      againstVotes: '1200000',
      abstainVotes: '300000',
      quorum: '4000000',
      startBlock: 18400000,
      endBlock: 18450000,
      createdAt: '2026-02-20T10:00:00Z',
      executedAt: '2026-02-25T14:30:00Z',
      category: 'parameter'
    },
    {
      id: '3',
      title: 'Add New Collateral Type',
      description: 'Add cbBTC as new collateral type for lending markets',
      proposer: '0xAb5801a7D398351b8bE11C439e05C5B3259aEC9B',
      status: 'active',
      forVotes: '1800000',
      againstVotes: '2200000',
      abstainVotes: '500000',
      quorum: '4000000',
      startBlock: 18520000,
      endBlock: 18570000,
      createdAt: '2026-03-01T08:00:00Z',
      category: 'parameter'
    }
  ];

  private votes: DaoVote[] = [
    {
      id: 'v1',
      proposalId: '1',
      voter: '0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab12',
      support: 'for',
      weight: '500000',
      reason: 'Treasury diversification is crucial for long-term stability',
      timestamp: '2026-02-28T12:00:00Z'
    },
    {
      id: 'v2',
      proposalId: '1',
      voter: '0x9B3a54D092fF3f4f4aD4dF4B4eD4f4B4eD4f4B4e',
      support: 'for',
      weight: '800000',
      timestamp: '2026-02-28T14:30:00Z'
    }
  ];

  private delegates: DaoDelegate[] = [
    {
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab12',
      delegatedVotes: '1500000',
      tokenHolders: ['0x1111111111111111111111111111111111111111'],
      delegators: ['0x2222222222222222222222222222222222222222'],
      votingPower: '1.5M'
    },
    {
      address: '0x9B3a54D092fF3f4f4aD4dF4B4eD4f4B4eD4f4B4e',
      delegatedVotes: '2200000',
      tokenHolders: ['0x3333333333333333333333333333333333333333'],
      delegators: ['0x4444444444444444444444444444444444444444'],
      votingPower: '2.2M'
    }
  ];

  private treasury: DaoTreasury = {
    balance: '12500000',
    tokens: [
      { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', balance: '5000', value: 10000000 },
      { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', balance: '1500000', value: 1500000 },
      { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', balance: '800000', value: 800000 },
      { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', balance: '25', value: 1000000 }
    ]
  };

  @Get('proposals')
  @ApiOperation({ summary: 'Get all DAO proposals' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'passed', 'rejected', 'executed', 'cancelled'] })
  getProposals(@Query('status') status?: string): DaoProposal[] {
    if (status) {
      return this.proposals.filter(p => p.status === status);
    }
    return this.proposals;
  }

  @Get('proposals/:id')
  @ApiOperation({ summary: 'Get proposal by ID' })
  getProposalById(@Param('id') id: string): DaoProposal | undefined {
    return this.proposals.find(p => p.id === id);
  }

  @Post('proposals')
  @ApiOperation({ summary: 'Create new proposal' })
  createProposal(@Body() body: Partial<DaoProposal>): DaoProposal {
    const newProposal: DaoProposal = {
      id: String(this.proposals.length + 1),
      title: body.title || '',
      description: body.description || '',
      proposer: body.proposer || '',
      status: 'active',
      forVotes: '0',
      againstVotes: '0',
      abstainVotes: '0',
      quorum: body.quorum || '4000000',
      startBlock: body.startBlock || 18500000,
      endBlock: body.endBlock || 18550000,
      createdAt: new Date().toISOString(),
      category: body.category || 'parameter'
    };
    this.proposals.push(newProposal);
    return newProposal;
  }

  @Post('proposals/:id/vote')
  @ApiOperation({ summary: 'Cast vote on proposal' })
  castVote(
    @Param('id') id: string,
    @Body() body: { voter: string; support: 'for' | 'against' | 'abstain'; weight: string; reason?: string }
  ): DaoVote {
    const proposal = this.proposals.find(p => p.id === id);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Update proposal vote counts
    if (body.support === 'for') {
      proposal.forVotes = (BigInt(proposal.forVotes) + BigInt(body.weight)).toString();
    } else if (body.support === 'against') {
      proposal.againstVotes = (BigInt(proposal.againstVotes) + BigInt(body.weight)).toString();
    } else {
      proposal.abstainVotes = (BigInt(proposal.abstainVotes) + BigInt(body.weight)).toString();
    }

    // Check if proposal passed
    const totalVotes = BigInt(proposal.forVotes) + BigInt(proposal.againstVotes) + BigInt(proposal.abstainVotes);
    if (totalVotes >= BigInt(proposal.quorum) && BigInt(proposal.forVotes) > BigInt(proposal.againstVotes)) {
      proposal.status = 'passed';
    }

    const vote: DaoVote = {
      id: `v${this.votes.length + 1}`,
      proposalId: id,
      voter: body.voter,
      support: body.support,
      weight: body.weight,
      reason: body.reason,
      timestamp: new Date().toISOString()
    };
    this.votes.push(vote);
    return vote;
  }

  @Get('proposals/:id/votes')
  @ApiOperation({ summary: 'Get votes for a proposal' })
  getProposalVotes(@Param('id') id: string): DaoVote[] {
    return this.votes.filter(v => v.proposalId === id);
  }

  @Get('delegates')
  @ApiOperation({ summary: 'Get all delegates' })
  getDelegates(): DaoDelegate[] {
    return this.delegates;
  }

  @Get('delegates/:address')
  @ApiOperation({ summary: 'Get delegate by address' })
  getDelegateByAddress(@Param('address') address: string): DaoDelegate | undefined {
    return this.delegates.find(d => d.address.toLowerCase() === address.toLowerCase());
  }

  @Post('delegate')
  @ApiOperation({ summary: 'Delegate voting power' })
  delegate(@Body() body: { from: string; to: string }): DaoDelegate {
    const existing = this.delegates.find(d => d.address.toLowerCase() === body.to.toLowerCase());
    if (existing) {
      if (!existing.delegators.includes(body.from)) {
        existing.delegators.push(body.from);
      }
      return existing;
    }

    const newDelegate: DaoDelegate = {
      address: body.to,
      delegatedVotes: '0',
      tokenHolders: [],
      delegators: [body.from],
      votingPower: '0'
    };
    this.delegates.push(newDelegate);
    return newDelegate;
  }

  @Get('treasury')
  @ApiOperation({ summary: 'Get DAO treasury info' })
  getTreasury(): DaoTreasury {
    return this.treasury;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get DAO governance stats' })
  getStats() {
    const activeProposals = this.proposals.filter(p => p.status === 'active').length;
    const totalProposals = this.proposals.length;
    const totalVoters = new Set(this.votes.map(v => v.voter)).size;
    const treasuryValue = this.treasury.tokens.reduce((acc, t) => acc + t.value, 0);

    return {
      totalProposals,
      activeProposals,
      passedProposals: this.proposals.filter(p => p.status === 'passed').length,
      totalVoters,
      treasuryValue,
      totalDelegates: this.delegates.length,
      participationRate: totalVoters > 0 ? `${((totalVoters / 100) * 100).toFixed(1)}%` : '0%'
    };
  }
}
