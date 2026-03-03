export interface DaoProposal {
  id: string;
  dao: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed' | 'executing' | 'canceled';
  voteStart: number;
  voteEnd: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  proposer: string;
  chain: string;
  proposalUrl: string;
  category: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  userAddress: string;
  daoFilter?: string;
  categoryFilter?: string;
  statusFilter?: string;
  webhookUrl?: string;
  email?: string;
  createdAt: Date;
  lastTriggered?: Date;
  active: boolean;
}

export interface Dao {
  name: string;
  chain: string;
  governanceUrl: string;
  apiUrl?: string;
}

export interface ProposalStats {
  total: number;
  active: number;
  passed: number;
  failed: number;
  byDao: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface TrendingDao {
  dao: string;
  activeProposals: number;
}
