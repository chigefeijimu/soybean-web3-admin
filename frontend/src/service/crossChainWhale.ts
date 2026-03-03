import { request } from '@/service/request';

export interface WhaleTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: number;
  valueUsd: number;
  token: string;
  chain: string;
  type: 'transfer' | 'swap' | 'bridge' | 'nft' | 'defi';
}

export interface WhaleAddress {
  address: string;
  label: string;
  type: 'exchange' | 'dao' | 'defi' | 'whale' | 'team' | 'unknown';
  totalVolume: number;
  lastActive: number;
  txCount: number;
}

export interface ChainStats {
  chain: string;
  totalVolume: number;
  txCount: number;
  avgTransactionSize: number;
  whaleCount: number;
}

export const crossChainWhaleApi = {
  // Overview
  getOverview: () => request.get('/web3/cross-chain-whale-dashboard/overview'),
  
  // Transactions
  getTransactions: (limit?: number) => 
    request.get('/web3/cross-chain-whale-dashboard/transactions', { 
      params: { limit } 
    }),
  
  // Chain specific
  getChainActivity: (chain: string) => 
    request.get(`/web3/cross-chain-whale-dashboard/chain/${chain}`),
  
  getChainStats: () => 
    request.get('/web3/cross-chain-whale-dashboard/chains/stats'),
  
  // Whales
  getWhales: (type?: string) => 
    request.get('/web3/cross-chain-whale-dashboard/whales', { 
      params: { type } 
    }),
  
  getWhaleDetails: (address: string) => 
    request.get(`/web3/cross-chain-whale-dashboard/whales/${address}`),
  
  searchWhales: (query: string) => 
    request.get(`/web3/cross-chain-whale-dashboard/whales/search/${query}`),
  
  // Alerts
  getAlerts: () => request.get('/web3/cross-chain-whale-dashboard/alerts'),
  
  createAlert: (config: {
    name: string;
    threshold: number;
    chains: string[];
    address?: string;
  }) => request.post('/web3/cross-chain-whale-dashboard/alerts', config),
  
  // Timeline
  getTimeline: (hours?: number) => 
    request.get('/web3/cross-chain-whale-dashboard/timeline', { 
      params: { hours } 
    }),
  
  // Cross-chain flows
  getCrossChainFlows: () => 
    request.get('/web3/cross-chain-whale-dashboard/flows'),
  
  // Leaderboard
  getLeaderboard: (limit?: number) => 
    request.get('/web3/cross-chain-whale-dashboard/leaderboard', { 
      params: { limit } 
    }),
};
