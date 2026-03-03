import { get } from '~/utils/http';

// Get cross-chain governance overview
export const getGovernanceOverview = () => get('governance-aggregator/overview');

// Get proposals with filtering
export const getProposals = (params: {
  chain?: string;
  dao?: string;
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}) => get('governance-aggregator/proposals', params);

// Get proposal details
export const getProposalDetails = (id: number) => get(`governance-aggregator/proposals/${id}`);

// Get delegates
export const getDelegates = (params: {
  chain?: string;
  dao?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}) => get('governance-aggregator/delegates', params);

// Get delegate details
export const getDelegateDetails = (address: string, chain?: string) => 
  get(`governance-aggregator/delegates/${address}`, { chain });

// Get supported DAOs
export const getSupportedDaos = () => get('governance-aggregator/daos');

// Get chain stats
export const getChainStats = (chain: string) => get(`governance-aggregator/stats/${chain}`);

// Search proposals
export const searchProposals = (query: string) => get('governance-aggregator/search', { q: query });

// Get trending proposals
export const getTrendingProposals = (limit?: number) => 
  get('governance-aggregator/trending', { limit });

// Get upcoming proposals
export const getUpcomingProposals = (limit?: number) => 
  get('governance-aggregator/upcoming', { limit });

// Get recent proposals
export const getRecentProposals = (limit?: number) => 
  get('governance-aggregator/recent', { limit });

// Generate mock data
export const generateGovernanceMockData = () => post('governance-aggregator/generate-mock-data', {});

import { post } from '~/utils/http';
