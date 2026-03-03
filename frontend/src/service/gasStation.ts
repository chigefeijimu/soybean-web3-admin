import { request } from '@/service/request';

export const gasStationApi = {
  health: () => request.get('/gas-station/health'),
  
  getSupportedChains: (feature?: string) => 
    request.get('/gas-station/supported-chains', { params: { feature } }),
  
  getSupportedTokens: (chainId: number) => 
    request.get(`/gas-station/supported-tokens/${chainId}`),
  
  estimateGas: (params: {
    chainId: number;
    tokenAddress: string;
    txType: string;
    gasLimit?: number;
  }) => request.post('/gas-station/estimate-gas', params),
  
  getTokenPrice: (address: string, chainId: number) =>
    request.get('/gas-station/token-price', { params: { address, chainId } }),
  
  calculateRelayerFee: (params: {
    sourceChainId: number;
    destChainId: number;
    tokenAddress: string;
    gasLimit: number;
  }) => request.post('/gas-station/calculate-relayer-fee', params),
  
  getGasSavings: (chainId: number, txType: string) =>
    request.get('/gas-station/gas-savings', { params: { chainId, txType } }),
  
  getRelayerStatus: () => request.get('/gas-station/relayer-status'),
  
  getHistory: (address: string) => request.get(`/gas-station/history/${address}`),
  
  getStats: () => request.get('/gas-station/stats'),
};
