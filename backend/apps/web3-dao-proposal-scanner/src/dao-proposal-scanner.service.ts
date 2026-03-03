import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DaoProposal, Alert } from './dao-proposal-scanner.types';

@Injectable()
export class DaoProposalScannerService {
  private alerts: Map<string, Alert[]> = new Map();
  private cachedProposals: DaoProposal[] = [];
  private lastFetchTime: number = 0;

  // Supported DAOs with governance interfaces
  private readonly supportedDaos = [
    { name: 'Uniswap', chain: 'Ethereum', governanceUrl: 'https://gov.uniswap.org', apiUrl: 'https://snapshot.org/api/strategies' },
    { name: 'Aave', chain: 'Ethereum', governanceUrl: 'https://governance.aave.com' },
    { name: 'Compound', chain: 'Ethereum', governanceUrl: 'https://compound.finance/governance' },
    { name: 'MakerDAO', chain: 'Ethereum', governanceUrl: 'https://vote.makerdao.com' },
    { name: 'Curve', chain: 'Ethereum', governanceUrl: 'https://gov.curve.fi' },
    { name: 'Balancer', chain: 'Ethereum', governanceUrl: 'https://forum.balancer.fi' },
    { name: 'Lido', chain: 'Ethereum', governanceUrl: 'https://research.lido.fi' },
    { name: 'ENS', chain: 'Ethereum', governanceUrl: 'https://docs.ens.domains' },
    { name: 'Optimism', chain: 'Optimism', governanceUrl: 'https://governance.optimism.io' },
    { name: 'Arbitrum', chain: 'Arbitrum', governanceUrl: 'https://governance.arbitrum.foundation' },
    { name: 'Polygon', chain: 'Polygon', governanceUrl: 'https://forum.polygon.technology' },
    { name: 'GMX', chain: 'Arbitrum', governanceUrl: 'https://gov.gmx.io' },
    { name: 'Rocket Pool', chain: 'Ethereum', governanceUrl: 'https://dao.rocketpool.net' },
    { name: 'Synthetix', chain: 'Ethereum', governanceUrl: 'https://sips.synthetix.io' },
    { name: 'Connext', chain: 'Ethereum', governanceUrl: 'https://dao.connext.network' },
  ];

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get list of supported DAOs
   */
  async getSupportedDaos() {
    return this.supportedDaos.map(dao => ({
      name: dao.name,
      chain: dao.chain,
      governanceUrl: dao.governanceUrl,
    }));
  }

  /**
   * Scan for active proposals across all supported DAOs
   */
  async scanProposals(dao?: string, status?: string, category?: string): Promise<DaoProposal[]> {
    const proposals = await this.fetchProposals();
    
    let filtered = proposals;
    
    if (dao) {
      filtered = filtered.filter(p => p.dao.toLowerCase().includes(dao.toLowerCase()));
    }
    
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }
    
    return filtered;
  }

  /**
   * Get proposal details by ID
   */
  async getProposal(dao: string, proposalId: string): Promise<DaoProposal | null> {
    const proposals = await this.fetchProposals();
    return proposals.find(p => p.dao.toLowerCase() === dao.toLowerCase() && p.id === proposalId) || null;
  }

  /**
   * Create an alert for DAO proposals
   */
  async createAlert(
    userAddress: string,
    daoFilter?: string,
    categoryFilter?: string,
    statusFilter?: string,
    webhookUrl?: string,
    email?: string
  ): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userAddress,
      daoFilter,
      categoryFilter,
      statusFilter,
      webhookUrl,
      email,
      createdAt: new Date(),
      active: true,
    };

    if (!this.alerts.has(userAddress)) {
      this.alerts.set(userAddress, []);
    }
    this.alerts.get(userAddress)?.push(alert);

    return alert;
  }

  /**
   * Get user alerts
   */
  async getAlerts(userAddress: string): Promise<Alert[]> {
    return this.alerts.get(userAddress) || [];
  }

  /**
   * Delete an alert
   */
  async deleteAlert(userAddress: string, alertId: string): Promise<boolean> {
    const userAlerts = this.alerts.get(userAddress);
    if (!userAlerts) return false;

    const index = userAlerts.findIndex(a => a.id === alertId);
    if (index === -1) return false;

    userAlerts.splice(index, 1);
    return true;
  }

  /**
   * Check alerts against new proposals and trigger notifications
   */
  async checkAlerts(): Promise<{ triggered: number; alerts: Alert[] }> {
    const proposals = await this.fetchProposals();
    const triggeredAlerts: Alert[] = [];

    for (const [userAddress, userAlerts] of this.alerts.entries()) {
      for (const alert of userAlerts) {
        if (!alert.active) continue;

        const matches = proposals.filter(p => {
          if (alert.daoFilter && !p.dao.toLowerCase().includes(alert.daoFilter.toLowerCase())) return false;
          if (alert.categoryFilter && !p.category.toLowerCase().includes(alert.categoryFilter.toLowerCase())) return false;
          if (alert.statusFilter && p.status !== alert.statusFilter) return false;
          return true;
        });

        if (matches.length > 0 && (!alert.lastTriggered || 
            new Date().getTime() - alert.lastTriggered.getTime() > 24 * 60 * 60 * 1000)) {
          triggeredAlerts.push(alert);
          alert.lastTriggered = new Date();
        }
      }
    }

    return { triggered: triggeredAlerts.length, alerts: triggeredAlerts };
  }

  /**
   * Get proposal statistics
   */
  async getProposalStats(): Promise<{
    total: number;
    active: number;
    passed: number;
    failed: number;
    byDao: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const proposals = await this.fetchProposals();
    
    const byDao: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const proposal of proposals) {
      byDao[proposal.dao] = (byDao[proposal.dao] || 0) + 1;
      byCategory[proposal.category] = (byCategory[proposal.category] || 0) + 1;
    }

    return {
      total: proposals.length,
      active: proposals.filter(p => p.status === 'active').length,
      passed: proposals.filter(p => p.status === 'passed').length,
      failed: proposals.filter(p => p.status === 'failed').length,
      byDao,
      byCategory,
    };
  }

  /**
   * Get trending DAOs (most active proposals)
   */
  async getTrendingDaos(limit: number = 10): Promise<{ dao: string; activeProposals: number }[]> {
    const proposals = await this.fetchProposals();
    const activeProposals = proposals.filter(p => p.status === 'active');
    
    const daoCounts: Record<string, number> = {};
    for (const proposal of activeProposals) {
      daoCounts[proposal.dao] = (daoCounts[proposal.dao] || 0) + 1;
    }

    return Object.entries(daoCounts)
      .map(([dao, count]) => ({ dao, activeProposals: count }))
      .sort((a, b) => b.activeProposals - a.activeProposals)
      .slice(0, limit);
  }

  /**
   * Search proposals by keyword
   */
  async searchProposals(keyword: string): Promise<DaoProposal[]> {
    const proposals = await this.fetchProposals();
    const lowerKeyword = keyword.toLowerCase();
    
    return proposals.filter(p => 
      p.title.toLowerCase().includes(lowerKeyword) ||
      p.description.toLowerCase().includes(lowerKeyword) ||
      p.dao.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Fetch proposals (simulated with real data structure)
   */
  private async fetchProposals(): Promise<DaoProposal[]> {
    // In production, this would fetch from DAO APIs
    // For now, return structured mock data that represents real governance proposals
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    const mockProposals: DaoProposal[] = [
      {
        id: '1',
        dao: 'Uniswap',
        title: 'Uniswap V4 Hooks Deployment Incentive Program',
        description: 'Proposal to establish a grant program for developers building hooks on Uniswap V4. The program would allocate 5M UNI tokens over 12 months to support innovation in the DeFi space.',
        status: 'active',
        voteStart: now - 2 * day,
        voteEnd: now + 5 * day,
        forVotes: '1500000',
        againstVotes: '450000',
        abstainVotes: '50000',
        proposer: '0x1234...abcd',
        chain: 'Ethereum',
        proposalUrl: 'https://gov.uniswap.org/t/uni-v4-hooks-incentive/12345',
        category: 'Grants',
        createdAt: new Date(now - 3 * day).toISOString(),
      },
      {
        id: '2',
        dao: 'Aave',
        title: 'Add GHO Stablecoin to Optimism Market',
        description: 'Proposal to add GHO stablecoin to the Optimism market with appropriate collateral factors and borrowing rates.',
        status: 'active',
        voteStart: now - 1 * day,
        voteEnd: now + 6 * day,
        forVotes: '2800000',
        againstVotes: '320000',
        abstainVotes: '120000',
        proposer: '0xabcd...1234',
        chain: 'Ethereum',
        proposalUrl: 'https://governance.aave.com/t/add-gho-optimism/1234',
        category: 'Risk Parameters',
        createdAt: new Date(now - 2 * day).toISOString(),
      },
      {
        id: '3',
        dao: 'Compound',
        title: 'Deploy Compound V3 on Base Network',
        description: 'Proposal to deploy Compound V3 on Base network with initial asset listings for ETH and USDC.',
        status: 'active',
        voteStart: now - 3 * day,
        voteEnd: now + 4 * day,
        forVotes: '890000',
        againstVotes: '120000',
        abstainVotes: '45000',
        proposer: '0xdef0...5678',
        chain: 'Ethereum',
        proposalUrl: 'https://compound.finance/governance/proposals/123',
        category: 'Expansion',
        createdAt: new Date(now - 4 * day).toISOString(),
      },
      {
        id: '4',
        dao: 'MakerDAO',
        title: 'Adjust DSR to 4.5% and Add New Collateral Types',
        description: 'Proposal to increase the Dai Savings Rate to 4.5% and add new collateral types including rETH and cbETH.',
        status: 'active',
        voteStart: now - 5 * day,
        voteEnd: now + 2 * day,
        forVotes: '4500000',
        againstVotes: '1800000',
        abstainVotes: '700000',
        proposer: '0x9876...fedc',
        chain: 'Ethereum',
        proposalUrl: 'https://vote.makerdao.com/polls/123',
        category: 'Rates',
        createdAt: new Date(now - 6 * day).toISOString(),
      },
      {
        id: '5',
        dao: 'Curve',
        title: 'Launch crvUSD Stablecoin on Arbitrum',
        description: 'Proposal to launch crvUSD stablecoin on Arbitrum with initial stability pools.',
        status: 'passed',
        voteStart: now - 10 * day,
        voteEnd: now - 3 * day,
        forVotes: '3200000',
        againstVotes: '890000',
        abstainVotes: '210000',
        proposer: '0xcafe...babe',
        chain: 'Ethereum',
        proposalUrl: 'https://gov.curve.fi/proposals/45',
        category: 'Expansion',
        createdAt: new Date(now - 12 * day).toISOString(),
      },
      {
        id: '6',
        dao: 'Lido',
        title: 'Enable stETH as Collateral on Aave V3',
        description: 'Proposal to enable stETH as collateral on Aave V3 Ethereum market.',
        status: 'active',
        voteStart: now - 1 * day,
        voteEnd: now + 7 * day,
        forVotes: '5600000',
        againstVotes: '780000',
        abstainVotes: '340000',
        proposer: '0xbeef...feed',
        chain: 'Ethereum',
        proposalUrl: 'https://research.lido.fi/t/123',
        category: 'Integration',
        createdAt: new Date(now - 2 * day).toISOString(),
      },
      {
        id: '7',
        dao: 'Optimism',
        title: 'Retroactive Public Goods Funding Round 4',
        description: 'Proposal to allocate 50M OP tokens for Retroactive Public Goods Funding Round 4.',
        status: 'active',
        voteStart: now - 4 * day,
        voteEnd: now + 3 * day,
        forVotes: '12000000',
        againstVotes: '2100000',
        abstainVotes: '890000',
        proposer: '0xdead...beef',
        chain: 'Optimism',
        proposalUrl: 'https://governance.optimism.io/proposals/56',
        category: 'Grants',
        createdAt: new Date(now - 5 * day).toISOString(),
      },
      {
        id: '8',
        dao: 'Arbitrum',
        title: 'Treasury Diversification Proposal',
        description: 'Proposal to diversify treasury holdings by selling 10% of ARB holdings for USDC.',
        status: 'active',
        voteStart: now - 2 * day,
        voteEnd: now + 5 * day,
        forVotes: '4500000',
        againstVotes: '3200000',
        abstainVotes: '1200000',
        proposer: '0xface...0123',
        chain: 'Arbitrum',
        proposalUrl: 'https://governance.arbitrum.foundation/proposals/78',
        category: 'Treasury',
        createdAt: new Date(now - 3 * day).toISOString(),
      },
      {
        id: '9',
        dao: 'GMX',
        title: 'Add GMX V2 on zkSync Era',
        description: 'Proposal to deploy GMX V2 on zkSync Era network.',
        status: 'executing',
        voteStart: now - 15 * day,
        voteEnd: now - 8 * day,
        forVotes: '2100000',
        againstVotes: '450000',
        abstainVotes: '180000',
        proposer: '0x0102...0304',
        chain: 'Arbitrum',
        proposalUrl: 'https://gov.gmx.io/proposals/23',
        category: 'Expansion',
        createdAt: new Date(now - 16 * day).toISOString(),
      },
      {
        id: '10',
        dao: 'Balancer',
        title: 'VeBAL Boost Upgrade',
        description: 'Proposal to upgrade the veBAL boost mechanism for better capital efficiency.',
        status: 'failed',
        voteStart: now - 20 * day,
        voteEnd: now - 13 * day,
        forVotes: '890000',
        againstVotes: '1200000',
        abstainVotes: '340000',
        proposer: '0xabc1...def2',
        chain: 'Ethereum',
        proposalUrl: 'https://forum.balancer.fi/proposals/34',
        category: 'Protocol Upgrade',
        createdAt: new Date(now - 21 * day).toISOString(),
      },
      {
        id: '11',
        dao: 'ENS',
        title: 'Add .base Domain Support',
        description: 'Proposal to add support for .base subdomain registration.',
        status: 'active',
        voteStart: now - 1 * day,
        voteEnd: now + 6 * day,
        forVotes: '340000',
        againstVotes: '89000',
        abstainVotes: '23000',
        proposer: '0xfedc...ba98',
        chain: 'Ethereum',
        proposalUrl: 'https://docs.ens.domains/proposals/12',
        category: 'Feature',
        createdAt: new Date(now - 2 * day).toISOString(),
      },
      {
        id: '12',
        dao: 'Rocket Pool',
        title: 'Increase minipool Limit',
        description: 'Proposal to increase the minipool limit to allow more node operators.',
        status: 'active',
        voteStart: now - 3 * day,
        voteEnd: now + 4 * day,
        forVotes: '1200000',
        againstVotes: '340000',
        abstainVotes: '89000',
        proposer: '0x9876...5432',
        chain: 'Ethereum',
        proposalUrl: 'https://dao.rocketpool.net/proposals/8',
        category: 'Protocol Parameters',
        createdAt: new Date(now - 4 * day).toISOString(),
      },
    ];

    return mockProposals;
  }
}
