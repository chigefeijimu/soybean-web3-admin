import { request } from '../request';

// Token Vesting API
export const tokenVestingApi = {
  // Get vesting information for a token
  getVestingInfo: (tokenAddress: string, chainId: number = 1) => {
    return request.post('/api/token-vesting/info', {
      token_address: tokenAddress,
      chain_id: chainId,
    });
  },

  // Get popular vesting tokens
  getPopularTokens: (params: {
    query?: string;
    chain_id?: number;
    sort_by?: string;
    limit?: number;
  }) => {
    return request.get('/api/token-vesting/popular', { params });
  },

  // Get vesting timeline
  getVestingTimeline: (tokenAddress: string, chainId: number = 1, startDate?: string, endDate?: string) => {
    return request.post('/api/token-vesting/timeline', {
      token_address: tokenAddress,
      chain_id: chainId,
      start_date: startDate,
      end_date: endDate,
    });
  },

  // Compare vesting schedules
  compareVesting: (token1Address: string, token2Address: string, chainId: number = 1) => {
    return request.post('/api/token-vesting/compare', {
      token1_address: token1Address,
      token2_address: token2Address,
      chain_id: chainId,
    });
  },
};
