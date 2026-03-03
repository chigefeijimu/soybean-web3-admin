import { request } from '@/service/request'

export const defiRewardsApi = {
  getPendingRewards: (address: string, params?: { chain?: string; protocol?: string }) => {
    return request.get<any>(`/api/web3/defi-rewards/pending/${address}`, { params })
  },

  getRewardsSummary: (address: string) => {
    return request.get<any>(`/api/web3/defi-rewards/summary/${address}`)
  },

  getYieldOpportunities: (params?: { minValue?: string; chain?: string }) => {
    return request.get<any>('/api/web3/defi-rewards/opportunities', { params })
  },

  previewClaim: (data: { address: string; protocols: string[] }) => {
    return request.post<any>('/api/web3/defi-rewards/claim-preview', data)
  },

  getClaimHistory: (address: string) => {
    return request.get<any>(`/api/web3/defi-rewards/history/${address}`)
  },

  getGlobalStats: () => {
    return request.get<any>('/api/web3/defi-rewards/stats')
  }
}
