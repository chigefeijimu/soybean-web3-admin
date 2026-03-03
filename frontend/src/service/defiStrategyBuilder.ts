import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const defiStrategyBuilderApi = {
  // Strategies
  getStrategies: () => api.get('/web3/defi-strategy-builder/strategies').then(res => res.data),
  
  getStrategyById: (id: string) => 
    api.get(`/web3/defi-strategy-builder/strategies/${id}`).then(res => res.data),
  
  createStrategy: (data: any) => 
    api.post('/web3/defi-strategy-builder/strategies', data).then(res => res.data),
  
  updateStrategy: (id: string, data: any) => 
    api.put(`/web3/defi-strategy-builder/strategies/${id}`, data).then(res => res.data),
  
  deleteStrategy: (id: string) => 
    api.delete(`/web3/defi-strategy-builder/strategies/${id}`).then(res => res.data),
  
  // Backtest
  runBacktest: (id: string, period: string) => 
    api.post(`/web3/defi-strategy-builder/strategies/${id}/backtest`, { period }).then(res => res.data),
  
  getBacktestHistory: (id: string) => 
    api.get(`/web3/defi-strategy-builder/strategies/${id}/backtest`).then(res => res.data),
  
  // Risk Analysis
  analyzeRisk: (id: string) => 
    api.get(`/web3/defi-strategy-builder/strategies/${id}/risk`).then(res => res.data),
  
  // Templates & Options
  getTemplates: () => 
    api.get('/web3/defi-strategy-builder/templates').then(res => res.data),
  
  getChains: () => 
    api.get('/web3/defi-strategy-builder/chains').then(res => res.data),
  
  getProtocols: (chain?: string) => 
    api.get('/web3/defi-strategy-builder/protocols', { params: { chain } }).then(res => res.data),
};
