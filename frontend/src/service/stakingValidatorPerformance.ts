import { request } from '../request';

export interface Validator {
  id: string;
  name: string;
  chain: string;
  address: string;
  status: 'active' | 'inactive' | 'slashed' | 'pending';
  uptime: number;
  apr: number;
  totalStaked: number;
  delegators: number;
  commission: number;
  firstSeen: string;
  lastReward: string;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  slashHistory: {
    count: number;
    totalAmount: number;
    lastSlash: string | null;
  };
  rank: number;
  imageUrl?: string;
}

export interface ChainStats {
  chain: string;
  totalValidators: number;
  totalStaked: number;
  avgApr: number;
  avgUptime: number;
  activeValidators: number;
  slashedValidators: number;
}

export interface ValidatorPerformanceResponse {
  validators: Validator[];
  totalValidators: number;
  page: number;
  pageSize: number;
  totalPages: number;
  chainStats: ChainStats[];
}

export interface ValidatorPerformance {
  validator: Validator;
  performanceHistory: {
    date: string;
    reward: number;
    uptime: number;
  }[];
  estimatedAnnualReward: number;
  riskScore: number;
}

/**
 * Get validators with pagination and filters
 */
export function getValidators(params: {
  chain?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  status?: string;
}) {
  return request<{ success: boolean; data: ValidatorPerformanceResponse }>({
    url: '/staking-validator-performance/validators',
    method: 'get',
    params
  });
}

/**
 * Get validator by ID
 */
export function getValidatorById(id: string) {
  return request<{ success: boolean; data: Validator }>({
    url: `/staking-validator-performance/validators/${id}`,
    method: 'get'
  });
}

/**
 * Get validator performance details
 */
export function getValidatorPerformance(id: string) {
  return request<{ success: boolean; data: ValidatorPerformance }>({
    url: `/staking-validator-performance/validators/${id}/performance`,
    method: 'get'
  });
}

/**
 * Get top validators
 */
export function getTopValidators(limit: number = 10) {
  return request<{ success: boolean; data: Validator[] }>({
    url: '/staking-validator-performance/top',
    method: 'get',
    params: { limit }
  });
}

/**
 * Get supported chains
 */
export function getSupportedChains() {
  return request<{ success: boolean; data: { id: string; name: string }[] }>({
    url: '/staking-validator-performance/chains',
    method: 'get'
  });
}

/**
 * Get chain stats
 */
export function getChainStats(chain: string) {
  return request<{ success: boolean; data: ChainStats }>({
    url: `/staking-validator-performance/chains/${chain}/stats`,
    method: 'get'
  });
}
