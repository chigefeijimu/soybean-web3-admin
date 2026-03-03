import request from '../request';
import axios from 'axios';

const baseURL = '/api';

export interface Dao {
  name: string;
  chain: string;
  governanceUrl: string;
}

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

export interface Alert {
  id: string;
  userAddress: string;
  daoFilter?: string;
  categoryFilter?: string;
  statusFilter?: string;
  webhookUrl?: string;
  email?: string;
  createdAt: string;
  lastTriggered?: string;
  active: boolean;
}

// Get supported DAOs
export const getSupportedDaos = () => 
  axios.get<Dao[]>(`${baseURL}/dao-proposal-scanner/daos`);

// Scan proposals
export const scanProposals = (params?: { dao?: string; status?: string; category?: string }) =>
  axios.get<DaoProposal[]>(`${baseURL}/dao-proposal-scanner/proposals`, { params });

// Search proposals
export const searchProposals = (keyword: string) =>
  axios.get<DaoProposal[]>(`${baseURL}/dao-proposal-scanner/proposals/search`, { params: { keyword } });

// Get proposal details
export const getProposal = (dao: string, id: string) =>
  axios.get<DaoProposal>(`${baseURL}/dao-proposal-scanner/proposals/${dao}/${id}`);

// Get proposal stats
export const getProposalStats = () =>
  axios.get<ProposalStats>(`${baseURL}/dao-proposal-scanner/stats`);

// Get trending DAOs
export const getTrendingDaos = (limit?: number) =>
  axios.get<TrendingDao[]>(`${baseURL}/dao-proposal-scanner/trending`, { params: { limit } });

// Create alert
export const createAlert = (data: {
  userAddress: string;
  daoFilter?: string;
  categoryFilter?: string;
  statusFilter?: string;
  webhookUrl?: string;
  email?: string;
}) => axios.post<Alert>(`${baseURL}/dao-proposal-scanner/alerts`, data);

// Get user alerts
export const getAlerts = (userAddress: string) =>
  axios.get<Alert[]>(`${baseURL}/dao-proposal-scanner/alerts/${userAddress}`);

// Delete alert
export const deleteAlert = (userAddress: string, alertId: string) =>
  axios.delete<boolean>(`${baseURL}/dao-proposal-scanner/alerts/${userAddress}/${alertId}`);

// Check alerts
export const checkAlerts = () =>
  axios.post<{ triggered: number; alerts: Alert[] }>(`${baseURL}/dao-proposal-scanner/alerts/check`);
