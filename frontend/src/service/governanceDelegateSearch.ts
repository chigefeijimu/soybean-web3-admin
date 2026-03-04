import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002';

export interface Delegate {
  id: string;
  address: string;
  name: string;
  ens?: string;
  avatar?: string;
  dao: string;
  chain: string;
  votingPower: number;
  delegators: number;
  votesReceived: number;
  participation: number;
  proposalsVoted: number;
  proposalsCreated?: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  lastActive: string;
  reputation: 'legend' | 'veteran' | 'expert' | 'trusted' | 'new';
  reputationScore: number;
  expertise: string[];
  socialLinks?: {
    twitter?: string;
    discord?: string;
    github?: string;
  };
  performance: {
    accuracy: number;
    consistency: number;
    timeliness: number;
  };
}

export interface DelegateSearchParams {
  query?: string;
  dao?: string;
  chain?: string;
  minVotingPower?: number;
  minDelegators?: number;
  reputation?: string;
  expertise?: string;
  sortBy?: 'votingPower' | 'delegators' | 'reputation' | 'participation' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface DAO {
  id: string;
  name: string;
  chain: string;
  token: string;
  totalDelegates: number;
  totalVotingPower: number;
  activeProposals: number;
}

export interface DelegateStats {
  totalDelegates: number;
  totalDAOs: number;
  averageVotingPower: number;
  averageDelegators: number;
  reputationDistribution: Record<string, number>;
  chainDistribution: Record<string, number>;
  expertiseDistribution: Record<string, number>;
}

export interface SearchResult {
  data: Delegate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const governanceDelegateApi = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const governanceDelegateSearchApi = {
  searchDelegates: (params: DelegateSearchParams) =>
    governanceDelegateApi.get<SearchResult>('/governance-delegate-search/delegates', { params }),
  
  getDelegateByAddress: (address: string) =>
    governanceDelegateApi.get<Delegate>(`/governance-delegate-search/delegates/${address}`),
  
  findSimilarDelegates: (address: string, limit?: number) =>
    governanceDelegateApi.get<Delegate[]>(`/governance-delegate-search/delegates/${address}/similar`, { 
      params: { limit } 
    }),
  
  compareDelegates: (addresses: string[]) =>
    governanceDelegateApi.post('/governance-delegate-search/delegates/compare', { addresses }),
  
  getTopDelegates: (dao?: string, limit?: number) =>
    governanceDelegateApi.get<Delegate[]>('/governance-delegate-search/top', { params: { dao, limit } }),
  
  getDAOs: () =>
    governanceDelegateApi.get<DAO[]>('/governance-delegate-search/daos'),
  
  getDAOById: (id: string) =>
    governanceDelegateApi.get<DAO>(`/governance-delegate-search/daos/${id}`),
  
  getStats: () =>
    governanceDelegateApi.get<DelegateStats>('/governance-delegate-search/stats'),
  
  searchByExpertise: (expertise: string) =>
    governanceDelegateApi.get<Delegate[]>(`/governance-delegate-search/expertise/${expertise}`),
};
