import { request } from '../request';

export const liquidityRebalancer = {
  // Get all positions
  getPositions(chain?: string, protocol?: string) {
    const params = new URLSearchParams();
    if (chain) params.append('chain', chain);
    if (protocol) params.append('protocol', protocol);
    return request.get(`/liquidity-rebalancer/positions?${params.toString()}`);
  },

  // Get top pools by APR
  getTopPools(limit: number = 10) {
    return request.get(`/liquidity-rebalancer/pools/top?limit=${limit}`);
  },

  // Get pools by chain
  getPoolsByChain(chain: string) {
    return request.get(`/liquidity-rebalancer/pools/by-chain?chain=${chain}`);
  },

  // Get pools by protocol
  getPoolsByProtocol(protocol: string) {
    return request.get(`/liquidity-rebalancer/pools/by-protocol?protocol=${protocol}`);
  },

  // Get chain statistics
  getChainStats() {
    return request.get('/liquidity-rebalancer/stats/chains');
  },

  // Get protocol statistics
  getProtocolStats() {
    return request.get('/liquidity-rebalancer/stats/protocols');
  },

  // Analyze and generate rebalance plan
  analyzeRebalance(data: {
    walletAddress: string;
    positions: Array<{
      protocol: string;
      chain: string;
      pool: string;
      value: number;
      token0: string;
      token1: string;
    }>;
    targetAllocation: Array<{
      protocol: string;
      chain: string;
      pool: string;
      targetPercentage: number;
    }>;
    maxGasCost: number;
    preferChains: string[];
    preferProtocols: string[];
  }) {
    return request.post('/liquidity-rebalancer/analyze', data);
  },
};
