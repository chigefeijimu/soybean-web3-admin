import { request } from '../request';

export interface DAO {
  name: string;
  chain: string;
  token: string;
  proposalsCount: number;
  activeProposals: number;
  category: string;
}

export interface ProposalAnalysis {
  id: string;
  title: string;
  description: string;
  status: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  totalVotes: number;
  quorumRequired: number;
  votingEnds: string;
  proposer: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  impactAnalysis: {
    financial: number;
    governance: number;
    technical: number;
    community: number;
  };
  sentiment: {
    overall: 'bullish' | 'bearish' | 'neutral';
    for: number;
    against: number;
    abstain: number;
  };
}

export interface VotingRecommendation {
  recommendation: 'for' | 'against' | 'abstain' | 'skip';
  confidence: number;
  reasoning: string;
  keyPoints: { type: 'positive' | 'negative' | 'neutral'; point: string }[];
  riskFactors: string[];
  alternativeView: string;
  deadline: string;
}

export interface VotingStrategy {
  id: string;
  name: string;
  description: string;
  daoPreferences: { dao: string; weight: number }[];
  riskTolerance: string;
  votingFactors: string[];
  createdAt: string;
  performance: {
    totalVotes: number;
    successfulVotes: number;
    successRate: number;
  };
}

/**
 * Get supported DAOs
 */
export function getSupportedDAOs() {
  return request<{ success: boolean; data: DAO[] }>({
    url: '/governance/voting-advisor/daos',
    method: 'get'
  });
}

/**
 * Analyze a proposal
 */
export function analyzeProposal(dao: string, proposalId: string) {
  return request<{ success: boolean; data: ProposalAnalysis }>({
    url: `/governance/voting-advisor/proposal/${dao}/${proposalId}`,
    method: 'get'
  });
}

/**
 * Get voting recommendation
 */
export function getVotingRecommendation(dao: string, proposalId: string, walletAddress: string) {
  return request<{ success: boolean; data: VotingRecommendation }>({
    url: '/governance/voting-advisor/recommendation',
    method: 'post',
    data: { dao, proposalId, walletAddress }
  });
}

/**
 * Create voting strategy
 */
export function createVotingStrategy(strategy: {
  name: string;
  description: string;
  daoPreferences: { dao: string; weight: number }[];
  riskTolerance: string;
  votingFactors: string[];
}) {
  return request<{ success: boolean; data: VotingStrategy }>({
    url: '/governance/voting-advisor/strategy',
    method: 'post',
    data: strategy
  });
}

/**
 * Get voting strategy
 */
export function getVotingStrategy(id: string) {
  return request<{ success: boolean; data: VotingStrategy }>({
    url: `/governance/voting-advisor/strategy/${id}`,
    method: 'get'
  });
}

/**
 * Get all voting strategies
 */
export function getAllVotingStrategies() {
  return request<{ success: boolean; data: VotingStrategy[] }>({
    url: '/governance/voting-advisor/strategies',
    method: 'get'
  });
}

/**
 * Get voting history
 */
export function getVotingHistory(dao: string, limit: number = 20) {
  return request({
    url: `/governance/voting-advisor/voting-history/${dao}`,
    method: 'get',
    params: { limit }
  });
}

/**
 * Get delegate insights
 */
export function getDelegateInsights(dao: string, delegate: string) {
  return request({
    url: `/governance/voting-advisor/delegate-insights/${dao}/${delegate}`,
    method: 'get'
  });
}

/**
 * Get proposal impact
 */
export function getProposalImpact(dao: string, proposalId: string, walletAddress: string) {
  return request({
    url: `/governance/voting-advisor/proposal-impact/${dao}/${proposalId}`,
    method: 'get',
    params: { walletAddress }
  });
}

/**
 * Get dashboard
 */
export function getDashboard(walletAddress?: string) {
  return request({
    url: '/governance/voting-advisor/dashboard',
    method: 'get',
    params: { walletAddress }
  });
}
