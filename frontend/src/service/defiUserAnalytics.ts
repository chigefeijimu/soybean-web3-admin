import { request } from '@/service/request'

/**
 * DeFi User Analytics API Service
 */

export interface ProtocolUserMetrics {
  protocolId: string;
  protocolName: string;
  chain: string;
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  activeUsers30d: number;
  newUsers24h: number;
  newUsers7d: number;
  newUsers30d: number;
  retentionRate24h: number;
  retentionRate7d: number;
  retentionRate30d: number;
  userGrowthRate7d: number;
  userGrowthRate30d: number;
  averageUsersPerDay: number;
  peakUsers24h: number;
  timestamp: string;
}

export interface UserAnalyticsOverview {
  totalProtocols: number;
  totalUsers: number;
  totalActiveUsers: number;
  averageRetentionRate: number;
  topProtocolsByUsers: ProtocolUserMetrics[];
  chainDistribution: { chain: string; userCount: number; percentage: number }[];
  userGrowthTrend: { date: string; users: number }[];
}

export interface UserActivityDistribution {
  veryActive: number;
  active: number;
  casual: number;
  dormant: number;
}

export interface UserRetentionAnalysis {
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
  churnRate7d: number;
  churnRate30d: number;
  cohortData: { cohort: string; retention: number[] }[];
}

const API_BASE = '/web3-defi-user-analytics';

export const defiUserAnalyticsApi = {
  /**
   * Get DeFi user analytics overview across all protocols
   */
  getOverview() {
    return request<UserAnalyticsOverview>({
      url: `${API_BASE}/overview`,
      method: 'get'
    });
  },

  /**
   * Get user metrics for all supported protocols
   */
  getProtocols(chain?: string) {
    return request<ProtocolUserMetrics[]>({
      url: `${API_BASE}/protocols`,
      method: 'get',
      params: chain ? { chain } : {}
    });
  },

  /**
   * Get user metrics for a specific protocol
   */
  getProtocolMetrics(protocolId: string, chain?: string) {
    return request<ProtocolUserMetrics>({
      url: `${API_BASE}/protocol/${protocolId}`,
      method: 'get',
      params: chain ? { chain } : {}
    });
  },

  /**
   * Get user metrics for protocols on a specific chain
   */
  getChainMetrics(chain: string) {
    return request<ProtocolUserMetrics[]>({
      url: `${API_BASE}/chain/${chain}`,
      method: 'get'
    });
  },

  /**
   * Compare user metrics across multiple protocols
   */
  compareProtocols(protocolIds: string[]) {
    return request<ProtocolUserMetrics[]>({
      url: `${API_BASE}/compare`,
      method: 'get',
      params: { protocols: protocolIds.join(',') }
    });
  },

  /**
   * Get user retention analysis for a protocol
   */
  getRetentionAnalysis(protocolId: string) {
    return request<UserRetentionAnalysis>({
      url: `${API_BASE}/retention/${protocolId}`,
      method: 'get'
    });
  },

  /**
   * Get user activity distribution for a protocol
   */
  getActivityDistribution(protocolId: string) {
    return request<UserActivityDistribution>({
      url: `${API_BASE}/activity/${protocolId}`,
      method: 'get'
    });
  },

  /**
   * Get list of supported protocols
   */
  getSupportedProtocols() {
    return request({
      url: `${API_BASE}/protocols/list`,
      method: 'get'
    });
  },

  /**
   * Get list of supported chains
   */
  getSupportedChains() {
    return request({
      url: `${API_BASE}/chains/list`,
      method: 'get'
    });
  }
};
