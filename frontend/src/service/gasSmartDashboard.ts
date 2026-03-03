import { axiosGet } from '@/utils/axios'

export const gasSmartDashboardApi = {
  getAllChainsGas: () => axiosGet('/gas-smart-dashboard/chains'),
  
  getChainGas: (chain: string) => axiosGet(`/gas-smart-dashboard/chains/${chain}`),
  
  getGasComparison: () => axiosGet('/gas-smart-dashboard/comparison'),
  
  analyzeGas: (chain: string, txType: string, urgency: string) => 
    axiosGet(`/gas-smart-dashboard/analyze/${chain}`, { txType, urgency }),
  
  getCrossChainComparison: (from: string, to: string) => 
    axiosGet('/gas-smart-dashboard/cross-chain', { from, to }),
  
  getGasHistory: (chain: string, days: number) => 
    axiosGet(`/gas-smart-dashboard/history/${chain}`, { days }),
  
  getAlerts: (userId: string) => axiosGet(`/gas-smart-dashboard/alerts/${userId}`),
  
  createAlert: (data: { userId: string; chain: string; condition: string; threshold: number }) => 
    axiosGet('/gas-smart-dashboard/alerts', data),
  
  calculateGas: (txType: string, chain: string, value?: number) => 
    axiosGet('/gas-smart-dashboard/calculator', { txType, chain, value }),
}
