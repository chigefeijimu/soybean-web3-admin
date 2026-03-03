import { request } from '../request';

export const txPatternAnalyzer = {
  async analyzeAddress(address: string, chain: string) {
    return request({
      url: `/tx-pattern-analyzer/analyze/${chain}/${address}`,
      method: 'GET',
    });
  },

  async analyzeCrossChain(address: string) {
    return request({
      url: `/tx-pattern-analyzer/cross-chain/${address}`,
      method: 'GET',
    });
  },

  async getSupportedChains() {
    return request({
      url: '/tx-pattern-analyzer/chains',
      method: 'GET',
    });
  },
};
