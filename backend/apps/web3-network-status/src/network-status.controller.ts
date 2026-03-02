import { Controller, Get, Param, Query } from '@nestjs/common';

export interface NetworkStatus {
  chainId: number;
  chainName: string;
  symbol: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  blockNumber: number;
  blockTime: number;
  gasPrice: number;
  gasPriceGwei: number;
  tps: number;
  avgBlockTime: number;
  lastBlockTime: number;
  uptime: number;
  latency: number;
  validators: number;
  activeValidators: number;
  pendingTransactions: number;
  chainLogo: string;
  color: string;
  features: string[];
}

export interface NetworkAlert {
  id: string;
  chainId: number;
  chainName: string;
  type: 'gas_spike' | 'congestion' | 'outage' | 'upgrade' | 'slashing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}

export interface NetworkStats {
  totalChains: number;
  healthyChains: number;
  degradedChains: number;
  downChains: number;
  avgGasPrice: number;
  totalTps: number;
  totalValidators: number;
}

@Controller('network-status')
export class NetworkStatusController {
  private networks: NetworkStatus[] = [
    {
      chainId: 1,
      chainName: 'Ethereum',
      symbol: 'ETH',
      status: 'healthy',
      blockNumber: 19200000,
      blockTime: 12,
      gasPrice: 25000000000,
      gasPriceGwei: 25,
      tps: 15,
      avgBlockTime: 12.1,
      lastBlockTime: Date.now() - 8000,
      uptime: 99.98,
      latency: 120,
      validators: 890000,
      activeValidators: 875000,
      pendingTransactions: 150000,
      chainLogo: '🟣',
      color: '#627EEA',
      features: ['EVM', 'PoS', 'L2']
    },
    {
      chainId: 42161,
      chainName: 'Arbitrum One',
      symbol: 'ETH',
      status: 'healthy',
      blockNumber: 185000000,
      blockTime: 0.25,
      gasPrice: 100000000,
      gasPriceGwei: 0.1,
      tps: 50,
      avgBlockTime: 0.26,
      lastBlockTime: Date.now() - 200,
      uptime: 99.95,
      latency: 45,
      validators: 100,
      activeValidators: 98,
      pendingTransactions: 5000,
      chainLogo: '🔵',
      color: '#28A0F0',
      features: ['Arbitrum', 'Rollup', 'L2']
    },
    {
      chainId: 10,
      chainName: 'Optimism',
      symbol: 'ETH',
      status: 'healthy',
      blockNumber: 115000000,
      blockTime: 2,
      gasPrice: 2000000000,
      gasPriceGwei: 2,
      tps: 30,
      avgBlockTime: 2.1,
      lastBlockTime: Date.now() - 1500,
      uptime: 99.92,
      latency: 80,
      validators: 50,
      activeValidators: 49,
      pendingTransactions: 8000,
      chainLogo: '🔴',
      color: '#FF0420',
      features: ['Optimism', 'Rollup', 'L2']
    },
    {
      chainId: 137,
      chainName: 'Polygon',
      symbol: 'MATIC',
      status: 'healthy',
      blockNumber: 55000000,
      blockTime: 2.1,
      gasPrice: 35000000000,
      gasPriceGwei: 35,
      tps: 45,
      avgBlockTime: 2.2,
      lastBlockTime: Date.now() - 1800,
      uptime: 99.99,
      latency: 35,
      validators: 100,
      activeValidators: 100,
      pendingTransactions: 3000,
      chainLogo: '🟣',
      color: '#8247E5',
      features: ['PoS', 'L2', 'Plasma']
    },
    {
      chainId: 56,
      chainName: 'BSC',
      symbol: 'BNB',
      status: 'healthy',
      blockNumber: 35000000,
      blockTime: 3,
      gasPrice: 3000000000,
      gasPriceGwei: 3,
      tps: 120,
      avgBlockTime: 3.1,
      lastBlockTime: Date.now() - 2500,
      uptime: 99.90,
      latency: 25,
      validators: 21,
      activeValidators: 21,
      pendingTransactions: 50000,
      chainLogo: '🟡',
      color: '#F3BA2F',
      features: ['PoSA', 'EVM']
    },
    {
      chainId: 8453,
      chainName: 'Base',
      symbol: 'ETH',
      status: 'healthy',
      blockNumber: 15000000,
      blockTime: 2,
      gasPrice: 500000000,
      gasPriceGwei: 0.5,
      tps: 20,
      avgBlockTime: 2.0,
      lastBlockTime: Date.now() - 1500,
      uptime: 99.97,
      latency: 40,
      validators: 10,
      activeValidators: 10,
      pendingTransactions: 2000,
      chainLogo: '🔵',
      color: '#0052FF',
      features: ['Base', 'L2', 'OP Stack']
    },
    {
      chainId: 43114,
      chainName: 'Avalanche',
      symbol: 'AVAX',
      status: 'healthy',
      blockNumber: 40000000,
      blockTime: 0.9,
      gasPrice: 25000000000,
      gasPriceGwei: 25,
      tps: 8,
      avgBlockTime: 0.95,
      lastBlockTime: Date.now() - 800,
      uptime: 99.95,
      latency: 50,
      validators: 1200,
      activeValidators: 1180,
      pendingTransactions: 1000,
      chainLogo: '🟢',
      color: '#E84142',
      features: ['Snowman', 'PoS']
    },
    {
      chainId: 1101,
      chainName: 'zkEVM',
      symbol: 'ETH',
      status: 'healthy',
      blockNumber: 8000000,
      blockTime: 1,
      gasPrice: 5000000000,
      gasPriceGwei: 5,
      tps: 25,
      avgBlockTime: 1.1,
      lastBlockTime: Date.now() - 900,
      uptime: 99.88,
      latency: 60,
      validators: 30,
      activeValidators: 29,
      pendingTransactions: 1500,
      chainLogo: '⚫',
      color: '#5C6BC0',
      features: ['zkEVM', 'L2', 'ZK-Rollup']
    },
    {
      chainId: 324,
      chainName: 'zkSync Era',
      symbol: 'ETH',
      status: 'healthy',
      blockNumber: 45000000,
      blockTime: 1,
      gasPrice: 3000000000,
      gasPriceGwei: 3,
      tps: 35,
      avgBlockTime: 1.05,
      lastBlockTime: Date.now() - 900,
      uptime: 99.85,
      latency: 55,
      validators: 20,
      activeValidators: 19,
      pendingTransactions: 2500,
      chainLogo: '⚡',
      color: '#8B5CF6',
      features: ['zkSync', 'L2', 'ZK-Rollup']
    },
    {
      chainId: 5000,
      chainName: 'Mantle',
      symbol: 'MNT',
      status: 'healthy',
      blockNumber: 25000000,
      blockTime: 2,
      gasPrice: 1000000000,
      gasPriceGwei: 1,
      tps: 40,
      avgBlockTime: 2.0,
      lastBlockTime: Date.now() - 1500,
      uptime: 99.92,
      latency: 42,
      validators: 50,
      activeValidators: 49,
      pendingTransactions: 3000,
      chainLogo: '🟢',
      color: '#05B8CC',
      features: ['Mantle', 'L2', 'Modular']
    },
    {
      chainId: 11155111,
      chainName: 'Sepolia',
      symbol: 'ETH',
      status: 'healthy',
      blockNumber: 5000000,
      blockTime: 12,
      gasPrice: 1000000000,
      gasPriceGwei: 1,
      tps: 5,
      avgBlockTime: 12.5,
      lastBlockTime: Date.now() - 10000,
      uptime: 99.50,
      latency: 150,
      validators: 5000,
      activeValidators: 4800,
      pendingTransactions: 100,
      chainLogo: '🧪',
      color: '#A855F7',
      features: ['Testnet', 'PoS']
    },
    {
      chainId: 5,
      chainName: 'Goerli',
      symbol: 'ETH',
      status: 'degraded',
      blockNumber: 10000000,
      blockTime: 15,
      gasPrice: 5000000000,
      gasPriceGwei: 5,
      tps: 2,
      avgBlockTime: 18,
      lastBlockTime: Date.now() - 25000,
      uptime: 97.00,
      latency: 300,
      validators: 1000,
      activeValidators: 700,
      pendingTransactions: 50,
      chainLogo: '🧪',
      color: '#FCD34D',
      features: ['Testnet', 'PoS', 'Deprecated']
    }
  ];

  private alerts: NetworkAlert[] = [
    {
      id: '1',
      chainId: 5,
      chainName: 'Goerli',
      type: 'upgrade',
      severity: 'medium',
      message: 'Goerli testnet is deprecated. Users should migrate to Sepolia or Holesky.',
      timestamp: Date.now() - 86400000 * 2,
      resolved: false
    },
    {
      id: '2',
      chainId: 1,
      chainName: 'Ethereum',
      type: 'gas_spike',
      severity: 'low',
      message: 'Gas prices are slightly elevated due to increased DeFi activity.',
      timestamp: Date.now() - 3600000,
      resolved: true
    },
    {
      id: '3',
      chainId: 42161,
      chainName: 'Arbitrum',
      type: 'upgrade',
      severity: 'low',
      message: 'Scheduled upgrade in 48 hours. Expect brief downtime.',
      timestamp: Date.now() - 7200000,
      resolved: false
    }
  ];

  private trackedAddresses = new Map<string, { label: string; alertThreshold: number }>();

  @Get('networks')
  getNetworks(@Query('status') status?: string) {
    let networks = [...this.networks];
    
    // Simulate real-time block updates
    networks = networks.map(network => {
      if (network.status === 'healthy') {
        const timeSinceLastBlock = Date.now() - network.lastBlockTime;
        const blocksAhead = Math.floor(timeSinceLastBlock / (network.avgBlockTime * 1000));
        return {
          ...network,
          blockNumber: network.blockNumber + blocksAhead,
          lastBlockTime: network.lastBlockTime + blocksAhead * network.avgBlockTime * 1000
        };
      }
      return network;
    });

    if (status) {
      networks = networks.filter(n => n.status === status);
    }
    
    return networks;
  }

  @Get('network/:chainId')
  getNetwork(@Param('chainId') chainId: string) {
    const id = parseInt(chainId);
    const network = this.networks.find(n => n.chainId === id);
    
    if (!network) {
      return { error: 'Network not found' };
    }

    // Simulate real-time update
    const timeSinceLastBlock = Date.now() - network.lastBlockTime;
    const blocksAhead = Math.floor(timeSinceLastBlock / (network.avgBlockTime * 1000));
    
    return {
      ...network,
      blockNumber: network.blockNumber + blocksAhead,
      lastBlockTime: network.lastBlockTime + blocksAhead * network.avgBlockTime * 1000
    };
  }

  @Get('stats')
  getStats(): NetworkStats {
    const totalChains = this.networks.length;
    const healthyChains = this.networks.filter(n => n.status === 'healthy').length;
    const degradedChains = this.networks.filter(n => n.status === 'degraded').length;
    const downChains = this.networks.filter(n => n.status === 'down').length;
    
    const avgGasPrice = this.networks
      .filter(n => n.status !== 'down')
      .reduce((sum, n) => sum + n.gasPriceGwei, 0) / this.networks.filter(n => n.status !== 'down').length;
    
    const totalTps = this.networks.reduce((sum, n) => sum + n.tps, 0);
    const totalValidators = this.networks.reduce((sum, n) => sum + n.activeValidators, 0);

    return {
      totalChains,
      healthyChains,
      degradedChains,
      downChains,
      avgGasPrice: Math.round(avgGasPrice * 100) / 100,
      totalTps,
      totalValidators
    };
  }

  @Get('alerts')
  getAlerts(@Query('chainId') chainId?: string, @Query('resolved') resolved?: string) {
    let alerts = [...this.alerts];
    
    if (chainId) {
      alerts = alerts.filter(a => a.chainId === parseInt(chainId));
    }
    
    if (resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === (resolved === 'true'));
    }
    
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  @Get('alerts/:id')
  getAlert(@Param('id') id: string) {
    return this.alerts.find(a => a.id === id);
  }

  @Get('compare')
  compareNetworks(@Query('chains') chains: string) {
    const chainIds = chains.split(',').map(c => parseInt(c));
    return this.networks.filter(n => chainIds.includes(n.chainId));
  }

  @Get('trending')
  getTrendingNetworks() {
    return [...this.networks]
      .sort((a, b) => b.tps - a.tps)
      .slice(0, 5);
  }

  @Get('cheapest')
  getCheapestNetworks() {
    return [...this.networks]
      .filter(n => n.status !== 'down')
      .sort((a, b) => a.gasPriceGwei - b.gasPriceGwei)
      .slice(0, 5);
  }

  @Get('fastest')
  getFastestNetworks() {
    return [...this.networks]
      .filter(n => n.status !== 'down')
      .sort((a, b) => a.avgBlockTime - b.avgBlockTime)
      .slice(0, 5);
  }
}
