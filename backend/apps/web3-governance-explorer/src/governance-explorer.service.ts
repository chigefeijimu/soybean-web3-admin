import { Injectable } from '@nestjs/common';

interface DAO {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logo: string;
  chain: string;
  tokenAddress: string;
  treasury: number;
  proposalsCount: number;
  votersCount: number;
  tvl: number;
  category: string;
}

interface Proposal {
  id: string;
  daoId: string;
  daoName: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed' | 'executed' | 'cancelled';
  type: 'text' | 'upgrade' | 'parameter' | 'treasury' | 'emergency';
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  totalVotes: number;
  quorum: number;
  startTime: string;
  endTime: string;
  proposer: string;
  executionData?: string;
  voteBreakdown?: { address: string; votes: number; support: 'for' | 'against' | 'abstain' }[];
}

interface Delegation {
  delegator: string;
  delegate: string;
  votes: number;
  token: string;
  chain: string;
}

interface TokenHolder {
  address: string;
  balance: number;
  balanceUsd: number;
  percentage: number;
  votingPower: number;
  isDelegate: boolean;
  lastActivity: string;
}

interface TreasuryAsset {
  symbol: string;
  address: string;
  amount: number;
  valueUsd: number;
  percentage: number;
  type: 'native' | 'erc20' | 'nft';
}

@Injectable()
export class GovernanceExplorerService {
  private daos: DAO[] = [
    {
      id: 'uniswap',
      name: 'Uniswap',
      symbol: 'UNI',
      description: 'Decentralized trading protocol for liquidity providers',
      logo: '🦄',
      chain: 'Ethereum',
      tokenAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      treasury: 2450000000,
      proposalsCount: 156,
      votersCount: 12450,
      tvl: 8500000000,
      category: 'DEX',
    },
    {
      id: 'aave',
      name: 'Aave',
      symbol: 'AAVE',
      description: 'Non-custodial liquidity protocol',
      logo: '👻',
      chain: 'Ethereum',
      tokenAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      treasury: 1850000000,
      proposalsCount: 89,
      votersCount: 8230,
      tvl: 12000000000,
      category: 'Lending',
    },
    {
      id: 'compound',
      name: 'Compound',
      symbol: 'COMP',
      description: 'Algorithmic money market protocol',
      logo: '🏦',
      chain: 'Ethereum',
      tokenAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
      treasury: 450000000,
      proposalsCount: 67,
      votersCount: 4560,
      tvl: 2800000000,
      category: 'Lending',
    },
    {
      id: 'makerdao',
      name: 'MakerDAO',
      symbol: 'MKR',
      description: 'Decentralized stablecoin protocol',
      logo: '🎩',
      chain: 'Ethereum',
      tokenAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      treasury: 3200000000,
      proposalsCount: 234,
      votersCount: 15670,
      tvl: 6500000000,
      category: 'Stablecoin',
    },
    {
      id: 'optimism',
      name: 'Optimism',
      symbol: 'OP',
      description: 'Layer 2 scaling solution for Ethereum',
      logo: '🔴',
      chain: 'Ethereum',
      tokenAddress: '0x4200000000000000000000000000000000000042',
      treasury: 890000000,
      proposalsCount: 45,
      votersCount: 5670,
      tvl: 4200000000,
      category: 'L2',
    },
    {
      id: 'arbitrum',
      name: 'Arbitrum',
      symbol: 'ARB',
      description: 'Scaling solution for Ethereum',
      logo: '🔵',
      chain: 'Ethereum',
      tokenAddress: '0x912ce59144191c1204e64559fe8253a0e49e6548',
      treasury: 1200000000,
      proposalsCount: 38,
      votersCount: 4230,
      tvl: 2800000000,
      category: 'L2',
    },
    {
      id: 'ens',
      name: 'ENS DAO',
      symbol: 'ENS',
      description: 'Ethereum Name Service',
      logo: '🪄',
      chain: 'Ethereum',
      tokenAddress: '0xc18360217d8f7be5d91ae5b82b1f8cdbdfbcc4b2',
      treasury: 380000000,
      proposalsCount: 28,
      votersCount: 2340,
      tvl: 450000000,
      category: 'Infrastructure',
    },
    {
      id: 'lido',
      name: 'Lido',
      symbol: 'LDO',
      description: 'Liquid staking for Ethereum',
      logo: '💧',
      chain: 'Ethereum',
      tokenAddress: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
      treasury: 520000000,
      proposalsCount: 34,
      votersCount: 3120,
      tvl: 18000000000,
      category: 'Staking',
    },
  ];

  private proposals: Proposal[] = [
    // Uniswap proposals
    {
      id: 'uni-156',
      daoId: 'uniswap',
      daoName: 'Uniswap',
      title: 'Deploy Uniswap V4 on Arbitrum and Optimism',
      description: 'Proposal to deploy the latest version of Uniswap protocol on Layer 2 networks to reduce gas costs and improve throughput.',
      status: 'active',
      type: 'upgrade',
      forVotes: 4500000,
      againstVotes: 1200000,
      abstainVotes: 300000,
      totalVotes: 6000000,
      quorum: 4000000,
      startTime: '2026-02-28T00:00:00Z',
      endTime: '2026-03-05T00:00:00Z',
      proposer: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      voteBreakdown: [
        { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', votes: 2500000, support: 'for' },
        { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', votes: 1200000, support: 'for' },
        { address: '0x47e229bA4b1B84f3b74d8B21d3fD8aF3B7d5f123', votes: 800000, support: 'against' },
      ],
    },
    {
      id: 'uni-155',
      daoId: 'uniswap',
      daoName: 'Uniswap',
      title: 'Allocate Treasury for Developer Grants',
      description: 'Request 5M UNI tokens from treasury to fund developer grants program for Q2 2026.',
      status: 'passed',
      type: 'treasury',
      forVotes: 8500000,
      againstVotes: 2100000,
      abstainVotes: 400000,
      totalVotes: 11000000,
      quorum: 4000000,
      startTime: '2026-02-15T00:00:00Z',
      endTime: '2026-02-22T00:00:00Z',
      proposer: '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
      executionData: 'Transfer 5M UNI to grants multisig',
    },
    {
      id: 'uni-154',
      daoId: 'uniswap',
      daoName: 'Uniswap',
      title: 'Update Protocol Fee from 0.05% to 0.08%',
      description: 'Increase protocol fee to fund continued development and security audits.',
      status: 'failed',
      type: 'parameter',
      forVotes: 3200000,
      againstVotes: 6800000,
      abstainVotes: 500000,
      totalVotes: 10500000,
      quorum: 4000000,
      startTime: '2026-02-01T00:00:00Z',
      endTime: '2026-02-08T00:00:00Z',
      proposer: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    },
    // Aave proposals
    {
      id: 'aave-90',
      daoId: 'aave',
      daoName: 'Aave',
      title: 'Add wstETH as Collateral on V3',
      description: 'Enable wrapped stETH as collateral on Aave V3 Ethereum pool.',
      status: 'active',
      type: 'parameter',
      forVotes: 125000,
      againstVotes: 15000,
      abstainVotes: 5000,
      totalVotes: 145000,
      quorum: 80000,
      startTime: '2026-03-01T00:00:00Z',
      endTime: '2026-03-04T00:00:00Z',
      proposer: '0xEE56e2B3D491590A5c9f89F9d33ef7ea2b5C4dE3',
      voteBreakdown: [
        { address: '0x7f39C581F595B53c5cb19bD0b3f8dAf6d6fbfc9d', votes: 85000, support: 'for' },
        { address: '0x0F4eeB1B8d5d7f1B0f7F7B8d5C4dE3F5A8d9B0c1', votes: 25000, support: 'for' },
      ],
    },
    {
      id: 'aave-89',
      daoId: 'aave',
      daoName: 'Aave',
      title: 'Adjust USDC Risk Parameters',
      description: 'Increase USDC liquidation threshold from 87% to 89% based on market conditions.',
      status: 'passed',
      type: 'parameter',
      forVotes: 95000,
      againstVotes: 12000,
      abstainVotes: 3000,
      totalVotes: 110000,
      quorum: 80000,
      startTime: '2026-02-20T00:00:00Z',
      endTime: '2026-02-25T00:00:00Z',
      proposer: '0xA238Cb80A2368F3A85b9e5a3C3f2f3d8F5A8B3C',
    },
    // MakerDAO proposals
    {
      id: 'mkr-235',
      daoId: 'makerdao',
      daoName: 'MakerDAO',
      title: 'Adjust DSR to 4.5%',
      description: 'Proposal to increase the Dai Savings Rate to 4.5% to improve DAI adoption.',
      status: 'active',
      type: 'parameter',
      forVotes: 45000,
      againstVotes: 18000,
      abstainVotes: 7000,
      totalVotes: 70000,
      quorum: 30000,
      startTime: '2026-03-01T12:00:00Z',
      endTime: '2026-03-08T12:00:00Z',
      proposer: '0x3C4Cb47F13E93F5D3e3C29C8C1d5C9F2A8E7D1B5',
    },
    {
      id: 'mkr-234',
      daoId: 'makerdao',
      daoName: 'MakerDAO',
      title: 'Add New Vault Type - cbBTC',
      description: 'Enable cbBTC as collateral type with 75% LTV.',
      status: 'passed',
      type: 'parameter',
      forVotes: 52000,
      againstVotes: 8000,
      abstainVotes: 5000,
      totalVotes: 65000,
      quorum: 30000,
      startTime: '2026-02-15T00:00:00Z',
      endTime: '2026-02-22T00:00:00Z',
      proposer: '0x7F8a1A7C5D9e4f3A8E5b2C1d9F0E8A7B6C5D4E3F',
    },
    // Optimism proposals
    {
      id: 'op-46',
      daoId: 'optimism',
      daoName: 'Optimism',
      title: 'Retroactive Public Goods Funding Round 19',
      description: 'Allocate 30M OP tokens to Retroactive Public Goods Funding for projects that contributed to the Optimism ecosystem.',
      status: 'active',
      type: 'treasury',
      forVotes: 28000000,
      againstVotes: 5000000,
      abstainVotes: 2000000,
      totalVotes: 35000000,
      quorum: 20000000,
      startTime: '2026-02-26T00:00:00Z',
      endTime: '2026-03-05T00:00:00Z',
      proposer: '0xF7D3A1D8E5B4C2F1A9E8D7C6B5A4F3E2D1C0B9A8',
    },
    {
      id: 'op-45',
      daoId: 'optimism',
      daoName: 'Optimism',
      title: 'Upgrade Gas Price Oracle',
      description: 'Update the L1 gas price oracle to use a more efficient pricing mechanism.',
      status: 'passed',
      type: 'upgrade',
      forVotes: 45000000,
      againstVotes: 8000000,
      abstainVotes: 7000000,
      totalVotes: 60000000,
      quorum: 20000000,
      startTime: '2026-02-10T00:00:00Z',
      endTime: '2026-02-17T00:00:00Z',
      proposer: '0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0',
    },
    // Arbitrum proposals
    {
      id: 'arb-39',
      daoId: 'arbitrum',
      daoName: 'Arbitrum',
      title: 'Security Council Renewal - March 2026',
      description: 'Renew the Security Council members for the next term.',
      status: 'active',
      type: 'parameter',
      forVotes: 150000000,
      againstVotes: 25000000,
      abstainVotes: 15000000,
      totalVotes: 190000000,
      quorum: 100000000,
      startTime: '2026-02-28T00:00:00Z',
      endTime: '2026-03-07T00:00:00Z',
      proposer: '0x1234567890AbCdEf1234567890AbCdEf12345678',
    },
    {
      id: 'arb-38',
      daoId: 'arbitrum',
      daoName: 'Arbitrum',
      title: 'Treasury Diversification',
      description: 'Swap 50M ARB for USDC to diversify treasury holdings.',
      status: 'passed',
      type: 'treasury',
      forVotes: 180000000,
      againstVotes: 45000000,
      abstainVotes: 25000000,
      totalVotes: 250000000,
      quorum: 100000000,
      startTime: '2026-02-12T00:00:00Z',
      endTime: '2026-02-19T00:00:00Z',
      proposer: '0x9876543210FeDcBa9876543210FeDcBa98765432',
    },
    // ENS proposals
    {
      id: 'ens-29',
      daoId: 'ens',
      daoName: 'ENS DAO',
      title: 'Extend Registrar Grace Period',
      description: 'Extend the grace period for expired domain names from 90 to 180 days.',
      status: 'active',
      type: 'parameter',
      forVotes: 185000,
      againstVotes: 42000,
      abstainVotes: 13000,
      totalVotes: 240000,
      quorum: 100000,
      startTime: '2026-02-27T00:00:00Z',
      endTime: '2026-03-06T00:00:00Z',
      proposer: '0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0',
    },
    // Lido proposals
    {
      id: 'lido-35',
      daoId: 'lido',
      daoName: 'Lido',
      title: 'Enable wstETH/ETH Gauge on Curve',
      description: 'Enable the wstETH/ETH pool on Curve Finance with 2% cap.',
      status: 'active',
      type: 'parameter',
      forVotes: 8500000,
      againstVotes: 1200000,
      abstainVotes: 300000,
      totalVotes: 10000000,
      quorum: 5000000,
      startTime: '2026-03-01T00:00:00Z',
      endTime: '2026-03-04T00:00:00Z',
      proposer: '0xB1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0',
    },
    {
      id: 'lido-34',
      daoId: 'lido',
      daoName: 'Lido',
      title: 'Node Operator Set Expansion',
      description: 'Add 5 new node operators to the Lido staking infrastructure.',
      status: 'passed',
      type: 'parameter',
      forVotes: 12000000,
      againstVotes: 1500000,
      abstainVotes: 500000,
      totalVotes: 14000000,
      quorum: 5000000,
      startTime: '2026-02-18T00:00:00Z',
      endTime: '2026-02-23T00:00:00Z',
      proposer: '0xC2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D',
    },
    // Compound proposals
    {
      id: 'comp-68',
      daoId: 'compound',
      daoName: 'Compound',
      title: 'Add cbBTC Market',
      description: 'Add Coinbase Wrapped BTC (cbBTC) as a new market on Compound V3.',
      status: 'passed',
      type: 'parameter',
      forVotes: 420000,
      againstVotes: 85000,
      abstainVotes: 35000,
      totalVotes: 540000,
      quorum: 200000,
      startTime: '2026-02-20T00:00:00Z',
      endTime: '2026-02-27T00:00:00Z',
      proposer: '0xD3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E',
    },
  ];

  getDaos() {
    return this.daos;
  }

  getDaoDetails(id: string) {
    const dao = this.daos.find(d => d.id === id);
    if (!dao) return null;

    const daoProposals = this.proposals.filter(p => p.daoId === id);
    const activeProposals = daoProposals.filter(p => p.status === 'active');
    const passedProposals = daoProposals.filter(p => p.status === 'passed');
    
    return {
      ...dao,
      activeProposals: activeProposals.length,
      passedProposals: passedProposals.length,
      recentProposals: daoProposals.slice(0, 5),
      participation: Math.floor(Math.random() * 30) + 15, // Random 15-45%
      avgVotes: Math.floor(Math.random() * 5000000) + 1000000,
    };
  }

  getProposals(dao?: string, status?: string, limit: number = 20) {
    let filtered = this.proposals;
    
    if (dao) {
      filtered = filtered.filter(p => p.daoId === dao);
    }
    
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    return filtered
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, limit);
  }

  getProposalDetails(id: string) {
    const proposal = this.proposals.find(p => p.id === id);
    if (!proposal) return null;

    const dao = this.daos.find(d => d.id === proposal.daoId);
    
    return {
      ...proposal,
      dao,
      forPercentage: ((proposal.forVotes / proposal.totalVotes) * 100).toFixed(2),
      againstPercentage: ((proposal.againstVotes / proposal.totalVotes) * 100).toFixed(2),
      abstainPercentage: ((proposal.abstainVotes / proposal.totalVotes) * 100).toFixed(2),
      quorumReached: proposal.totalVotes >= proposal.quorum,
      timeRemaining: this.getTimeRemaining(proposal.endTime),
    };
  }

  getVotes(proposalId?: string, address?: string, limit: number = 50) {
    let votes: any[] = [];
    
    this.proposals.forEach(proposal => {
      if (proposal.voteBreakdown) {
        proposal.voteBreakdown.forEach(vote => {
          votes.push({
            proposalId: proposal.id,
            proposalTitle: proposal.title,
            daoId: proposal.daoId,
            daoName: proposal.daoName,
            ...vote,
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        });
      }
    });
    
    if (proposalId) {
      votes = votes.filter(v => v.proposalId === proposalId);
    }
    
    if (address) {
      votes = votes.filter(v => v.address.toLowerCase() === address.toLowerCase());
    }
    
    return votes.slice(0, limit);
  }

  getDelegations(address?: string) {
    const delegations: Delegation[] = [
      { delegator: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', delegate: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', votes: 2500000, token: 'UNI', chain: 'Ethereum' },
      { delegator: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', delegate: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', votes: 1200000, token: 'UNI', chain: 'Ethereum' },
      { delegator: '0x7f39C581F595B53c5cb19bD0b3f8dAf6d6fbfc9d', delegate: '0x3d4C1CB86b2D9B2e7E2d5F8c1a9B0d3E5F7a8b9C', votes: 85000, token: 'AAVE', chain: 'Ethereum' },
      { delegator: '0x47e229bA4b1B84f3b74d8B21d3fD8aF3B7d5f123', delegate: '0x5f3f5dE5c9B8e3A7d0F9C2b5E6A8F1d3C4B5A6B7', votes: 800000, token: 'UNI', chain: 'Ethereum' },
      { delegator: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', delegate: '0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0', votes: 6800000, token: 'MKR', chain: 'Ethereum' },
    ];
    
    if (address) {
      return delegations.filter(d => 
        d.delegator.toLowerCase() === address.toLowerCase() || 
        d.delegate.toLowerCase() === address.toLowerCase()
      );
    }
    
    return delegations;
  }

  getTokenHolders(daoId: string, limit: number = 50): TokenHolder[] {
    const holdersPerDao: { [key: string]: TokenHolder[] } = {
      uniswap: [
        { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', balance: 2500000, balanceUsd: 12500000, percentage: 2.5, votingPower: 2500000, isDelegate: true, lastActivity: '2026-03-01' },
        { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', balance: 1200000, balanceUsd: 6000000, percentage: 1.2, votingPower: 1200000, isDelegate: true, lastActivity: '2026-03-01' },
        { address: '0x47e229bA4b1B84f3b74d8B21d3fD8aF3B7d5f123', balance: 800000, balanceUsd: 4000000, percentage: 0.8, votingPower: 800000, isDelegate: false, lastActivity: '2026-02-28' },
        { address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', balance: 650000, balanceUsd: 3250000, percentage: 0.65, votingPower: 650000, isDelegate: true, lastActivity: '2026-02-27' },
        { address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f', balance: 520000, balanceUsd: 2600000, percentage: 0.52, votingPower: 520000, isDelegate: false, lastActivity: '2026-02-25' },
      ],
      aave: [
        { address: '0x7f39C581F595B53c5cb19bD0b3f8dAf6d6fbfc9d', balance: 85000, balanceUsd: 10200000, percentage: 8.5, votingPower: 85000, isDelegate: true, lastActivity: '2026-03-01' },
        { address: '0x0F4eeB1B8d5d7f1B0f7F7B8d5C4dE3F5A8d9B0c1', balance: 25000, balanceUsd: 3000000, percentage: 2.5, votingPower: 25000, isDelegate: true, lastActivity: '2026-02-28' },
        { address: '0xA238Cb80A2368F3A85b9e5a3C3f2f3d8F5A8B3C', balance: 18000, balanceUsd: 2160000, percentage: 1.8, votingPower: 18000, isDelegate: false, lastActivity: '2026-02-26' },
        { address: '0xB3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C', balance: 12000, balanceUsd: 1440000, percentage: 1.2, votingPower: 12000, isDelegate: false, lastActivity: '2026-02-20' },
        { address: '0xC4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D', balance: 8500, balanceUsd: 1020000, percentage: 0.85, votingPower: 8500, isDelegate: true, lastActivity: '2026-02-18' },
      ],
    };

    const holders = holdersPerDao[daoId] || holdersPerDao['uniswap'];
    return holders.slice(0, limit);
  }

  searchProposals(query: string) {
    const q = query.toLowerCase();
    return this.proposals.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.daoName.toLowerCase().includes(q)
    ).slice(0, 10);
  }

  getTreasury(daoId: string) {
    const treasuryPerDao: { [key: string]: TreasuryAsset[] } = {
      uniswap: [
        { symbol: 'UNI', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', amount: 150000000, valueUsd: 750000000, percentage: 30, type: 'erc20' },
        { symbol: 'ETH', address: 'native', amount: 250000, valueUsd: 625000000, percentage: 25, type: 'native' },
        { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', amount: 350000000, valueUsd: 350000000, percentage: 14, type: 'erc20' },
        { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', amount: 5000, valueUsd: 325000000, percentage: 13, type: 'erc20' },
        { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f', amount: 200000000, valueUsd: 200000000, percentage: 8, type: 'erc20' },
        { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', amount: 150000000, valueUsd: 150000000, percentage: 6, type: 'erc20' },
        { symbol: 'UNI-V3-POS', address: '0x1f98400000000000000000000000000000000000', amount: 50000000, valueUsd: 50000000, percentage: 2, type: 'erc20' },
        { symbol: 'NFT', address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', amount: 12, valueUsd: 50000000, percentage: 2, type: 'nft' },
      ],
      aave: [
        { symbol: 'AAVE', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', amount: 1200000, valueUsd: 144000000, percentage: 22, type: 'erc20' },
        { symbol: 'ETH', address: 'native', amount: 85000, valueUsd: 212500000, percentage: 32, type: 'native' },
        { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', amount: 280000000, valueUsd: 280000000, percentage: 42, type: 'erc20' },
        { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', amount: 25000000, valueUsd: 25000000, percentage: 4, type: 'erc20' },
      ],
    };

    const assets = treasuryPerDao[daoId] || treasuryPerDao['uniswap'];
    const totalValue = assets.reduce((sum, a) => sum + a.valueUsd, 0);

    return {
      daoId,
      totalValue,
      assets,
      change24h: (Math.random() * 10 - 3).toFixed(2),
    };
  }

  getVoterStats(daoId: string) {
    const dao = this.daos.find(d => d.id === daoId);
    if (!dao) return null;

    return {
      daoId,
      daoName: dao.name,
      totalVoters: dao.votersCount,
      activeVoters: Math.floor(dao.votersCount * 0.3),
      participationRate: Math.floor(Math.random() * 30) + 15,
      avgVotesPerProposal: Math.floor(Math.random() * 5000000) + 1000000,
      topVoters: this.getTokenHolders(daoId, 5),
      votingActivity: [
        { day: '2026-02-24', votes: Math.floor(Math.random() * 50000) + 10000 },
        { day: '2026-02-25', votes: Math.floor(Math.random() * 50000) + 10000 },
        { day: '2026-02-26', votes: Math.floor(Math.random() * 50000) + 10000 },
        { day: '2026-02-27', votes: Math.floor(Math.random() * 50000) + 10000 },
        { day: '2026-02-28', votes: Math.floor(Math.random() * 50000) + 10000 },
        { day: '2026-03-01', votes: Math.floor(Math.random() * 50000) + 10000 },
        { day: '2026-03-02', votes: Math.floor(Math.random() * 50000) + 10000 },
      ],
    };
  }

  private getTimeRemaining(endTime: string): string {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  }
}
