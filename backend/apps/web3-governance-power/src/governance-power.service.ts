import { Injectable } from '@nestjs/common';
import axios from 'axios';

// Supported DAO protocols
const SUPPORTED_DAOS = [
  { id: 'uniswap', name: 'Uniswap', token: 'UNI', chain: 'ethereum', governanceApi: 'https://governance.api.uniswap.org/v1' },
  { id: 'aave', name: 'Aave', token: 'AAVE', chain: 'ethereum', governanceApi: 'https://aave-api.netlify.app/api' },
  { id: 'compound', name: 'Compound', token: 'COMP', chain: 'ethereum', governanceApi: 'https://api.compound.finance' },
  { id: 'makerdao', name: 'MakerDAO', token: 'MKR', chain: 'ethereum', governanceApi: 'https://api.makerdao.com' },
  { id: 'curve', name: 'Curve DAO', token: 'CRV', chain: 'ethereum', governanceApi: 'https://curve.fi/api' },
  { id: 'balancer', name: 'Balancer', token: 'BAL', chain: 'ethereum', governanceApi: 'https://api.balancer.fi' },
  { id: 'lido', name: 'Lido', token: 'LDO', chain: 'ethereum', governanceApi: 'https://lido-api.netlify.app/api' },
  { id: 'ens', name: 'ENS DAO', token: 'ENS', chain: 'ethereum', governanceApi: 'https://ens-api.netlify.app/api' },
  { id: 'optimism', name: 'Optimism', token: 'OP', chain: 'optimism', governanceApi: 'https://optimism-api.netlify.app/api' },
  { id: 'arbitrum', name: 'Arbitrum', token: 'ARB', chain: 'arbitrum', governanceApi: 'https://arbitrum-api.netlify.app/api' },
];

interface VotingPower {
  raw: number;
  normalized: number;
  delegated: number;
  selfDelegated: number;
}

interface Delegate {
  address: string;
  votes: number;
  proposals: number;
  voters: number;
}

interface GovernanceProposal {
  id: string;
  title: string;
  status: 'active' | 'passed' | 'failed' | 'executed';
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  startBlock: number;
  endBlock: number;
}

@Injectable()
export class GovernancePowerService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get voting power for a specific address
   */
  async getVotingPower(address: string, daoId?: string): Promise<any> {
    const cacheKey = `voting-power-${address}-${daoId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const results = [];

    const daosToCheck = daoId 
      ? SUPPORTED_DAOS.filter(d => d.id === daoId)
      : SUPPORTED_DAOS;

    for (const dao of daosToCheck) {
      try {
        const votingPower = await this.fetchVotingPower(address, dao);
        if (votingPower) {
          results.push({
            dao: dao.id,
            daoName: dao.name,
            token: dao.token,
            chain: dao.chain,
            votingPower,
          });
        }
      } catch (error) {
        console.error(`Error fetching voting power for ${dao.id}:`, error.message);
      }
    }

    const result = {
      address,
      daos: results,
      totalVotingPower: results.reduce((sum, r) => sum + (r.votingPower?.normalized || 0), 0),
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Fetch voting power from DAO API (simulated)
   */
  private async fetchVotingPower(address: string, dao: any): Promise<VotingPower | null> {
    // In production, this would call actual DAO governance APIs
    // For demo, generate realistic mock data
    const hash = this.hashAddress(address + dao.id);
    const basePower = (hash % 100000) / 100; // 0 - 1000 tokens
    
    return {
      raw: basePower,
      normalized: basePower,
      delegated: basePower * 0.3,
      selfDelegated: basePower * 0.7,
    };
  }

  /**
   * Get delegate information
   */
  async getDelegates(daoId: string): Promise<any> {
    const cacheKey = `delegates-${daoId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const dao = SUPPORTED_DAOS.find(d => d.id === daoId);
    if (!dao) {
      return { success: false, error: 'DAO not found' };
    }

    // Generate mock delegate data
    const delegates: Delegate[] = [];
    for (let i = 0; i < 20; i++) {
      const votes = Math.random() * 1000000;
      delegates.push({
        address: `0x${(i * 11111).toString(16).padStart(40, '0')}`,
        votes: Math.floor(votes),
        proposals: Math.floor(Math.random() * 50),
        voters: Math.floor(Math.random() * 1000),
      });
    }

    delegates.sort((a, b) => b.votes - a.votes);

    const result = {
      dao: dao.id,
      daoName: dao.name,
      token: dao.token,
      totalDelegates: delegates.length,
      delegates: delegates.slice(0, 20),
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get governance proposals for a DAO
   */
  async getProposals(daoId: string, status?: string): Promise<any> {
    const cacheKey = `proposals-${daoId}-${status}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const dao = SUPPORTED_DAOS.find(d => d.id === daoId);
    if (!dao) {
      return { success: false, error: 'DAO not found' };
    }

    // Generate mock proposal data
    const proposals: GovernanceProposal[] = [];
    const statuses: GovernanceProposal['status'][] = ['active', 'passed', 'failed', 'executed'];
    
    for (let i = 0; i < 30; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const forVotes = Math.random() * 10000000;
      const againstVotes = Math.random() * forVotes;
      const abstainVotes = Math.random() * forVotes * 0.1;

      proposals.push({
        id: `${dao.id}-proposal-${i + 1}`,
        title: `${dao.name} Proposal #${i + 1}: ${this.generateProposalTitle(i)}`,
        status,
        forVotes: Math.floor(forVotes),
        againstVotes: Math.floor(againstVotes),
        abstainVotes: Math.floor(abstainVotes),
        startBlock: 18000000 + i * 10000,
        endBlock: 18000000 + i * 10000 + 50000,
      });
    }

    let filteredProposals = proposals;
    if (status && status !== 'all') {
      filteredProposals = proposals.filter(p => p.status === status);
    }

    const result = {
      dao: dao.id,
      daoName: dao.name,
      totalProposals: proposals.length,
      proposals: filteredProposals.slice(0, 20),
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get user's delegate information
   */
  async getUserDelegate(address: string, daoId?: string): Promise<any> {
    const cacheKey = `user-delegate-${address}-${daoId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const daosToCheck = daoId 
      ? SUPPORTED_DAOS.filter(d => d.id === daoId)
      : SUPPORTED_DAOS;

    const results = [];

    for (const dao of daosToCheck) {
      const votingPower = await this.fetchVotingPower(address, dao);
      if (votingPower && votingPower.normalized > 0) {
        results.push({
          dao: dao.id,
          daoName: dao.name,
          token: dao.token,
          chain: dao.chain,
          votingPower: votingPower.normalized,
          delegatedTo: votingPower.delegated > 0 
            ? `0x${this.hashAddress(address).toString(16).padStart(40, '0')}`
            : null,
          isDelegating: votingPower.delegated > 0,
        });
      }
    }

    const result = {
      address,
      delegations: results,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get governance power analytics for an address
   */
  async getPowerAnalytics(address: string): Promise<any> {
    const votingPower = await this.getVotingPower(address);
    const delegates = await Promise.all(
      votingPower.daos.map(d => this.getDelegates(d.dao))
    );

    const totalProposals = delegates.reduce((sum, d) => 
      sum + (d.totalProposals || 0), 0
    );

    const topHolders = votingPower.daos
      .map(d => ({ dao: d.daoName, power: d.votingPower?.normalized || 0 }))
      .sort((a, b) => b.power - a.power)
      .slice(0, 5);

    return {
      address,
      summary: {
        totalDaos: votingPower.daos.length,
        totalVotingPower: votingPower.totalVotingPower,
        totalProposals,
        activeProposals: Math.floor(Math.random() * 10),
      },
      breakdown: votingPower.daos,
      topHolders,
      recommendations: this.generateRecommendations(votingPower),
    };
  }

  /**
   * Get historical voting power data
   */
  async getPowerHistory(address: string, daoId: string, days: number = 90): Promise<any> {
    const history = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * dayMs;
      const basePower = 100 + Math.sin(i / 10) * 50;
      const variance = (this.hashAddress(address + i.toString()) % 1000) / 100;
      
      history.push({
        date: new Date(timestamp).toISOString().split('T')[0],
        votingPower: basePower + variance,
        normalized: basePower + variance,
      });
    }

    return {
      address,
      dao: daoId,
      period: days,
      history,
      stats: {
        average: history.reduce((s, h) => s + h.votingPower, 0) / history.length,
        max: Math.max(...history.map(h => h.votingPower)),
        min: Math.min(...history.map(h => h.votingPower)),
        trend: history[history.length - 1].votingPower > history[0].votingPower ? 'increasing' : 'decreasing',
      },
    };
  }

  /**
   * Compare voting power between two addresses
   */
  async comparePower(address1: string, address2: string): Promise<any> {
    const power1 = await this.getVotingPower(address1);
    const power2 = await this.getVotingPower(address2);

    const comparison = [];

    for (const dao of SUPPORTED_DAOS) {
      const p1 = power1.daos.find(d => d.dao === dao.id);
      const p2 = power2.daos.find(d => d.dao === dao.id);

      comparison.push({
        dao: dao.id,
        daoName: dao.name,
        address1Power: p1?.votingPower?.normalized || 0,
        address2Power: p2?.votingPower?.normalized || 0,
        winner: (p1?.votingPower?.normalized || 0) > (p2?.votingPower?.normalized || 0) 
          ? address1 
          : address2,
      });
    }

    const total1 = power1.totalVotingPower;
    const total2 = power2.totalVotingPower;

    return {
      address1,
      address2,
      comparison,
      summary: {
        totalPower1: total1,
        totalPower2: total2,
        winner: total1 > total2 ? address1 : address2,
        difference: Math.abs(total1 - total2),
      },
    };
  }

  /**
   * Get supported DAOs
   */
  getSupportedDaos(): any[] {
    return SUPPORTED_DAOS.map(dao => ({
      id: dao.id,
      name: dao.name,
      token: dao.token,
      chain: dao.chain,
    }));
  }

  // Helper methods
  private generateProposalTitle(index: number): string {
    const titles = [
      'Parameter Update: Increase Risk Factor',
      'Add New Collateral Type',
      'Grant Request for Development',
      'Treasury Diversification',
      'Protocol Upgrade Proposal',
      'Fee Structure Modification',
      'Add New Market',
      'Emergency Response Funding',
      'Governance Incentive Program',
      'Partnership Approval',
    ];
    return titles[index % titles.length];
  }

  private generateRecommendations(votingPower: any): string[] {
    const recommendations = [];
    
    if (votingPower.totalVotingPower < 100) {
      recommendations.push('Consider acquiring more governance tokens to participate in DAO decisions');
    }
    
    if (votingPower.daos.some(d => (d.votingPower?.delegated || 0) > 0)) {
      recommendations.push('You have delegated votes - consider tracking your delegate\'s activity');
    }

    recommendations.push('Set up alerts for important governance proposals');
    recommendations.push('Consider diversifying governance participation across multiple DAOs');

    return recommendations;
  }

  private hashAddress(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
