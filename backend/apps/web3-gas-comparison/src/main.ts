import express, { Request, Response } from 'express';
import axios from 'axios';

const app: express.Application = express();
const PORT = 3015;

// Supported chains with RPC endpoints
const CHAIN_CONFIG: Record<string, { name: string; rpc: string; explorer: string; color: string; type: 'L1' | 'L2' }> = {
  '1': { name: 'Ethereum', rpc: 'https://eth.llamarpc.com', explorer: 'https://etherscan.io', color: '#627EEA', type: 'L1' },
  '10': { name: 'Optimism', rpc: 'https://mainnet.optimism.io', explorer: 'https://optimistic.etherscan.io', color: '#FF0420', type: 'L2' },
  '42161': { name: 'Arbitrum One', rpc: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io', color: '#28A0F0', type: 'L2' },
  '137': { name: 'Polygon', rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com', color: '#8247E5', type: 'L2' },
  '56': { name: 'BSC', rpc: 'https://bsc-dataseed.binance.org', explorer: 'https://bscscan.com', color: '#F3BA2F', type: 'L1' },
  '8453': { name: 'Base', rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org', color: '#0052FF', type: 'L2' },
  '43114': { name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', explorer: 'https://snowtrace.io', color: '#E84142', type: 'L1' },
  '1101': { name: 'Polygon zkEVM', rpc: 'https://zkevm-rpc.com', explorer: 'https://zkevm.polygonscan.com', color: '#6FA3D6', type: 'L2' },
  '324': { name: 'zkSync Era', rpc: 'https://mainnet.era.zksync.io', explorer: 'https://explorer.zksync.io', color: '#121212', type: 'L2' },
  '5000': { name: 'Mantle', rpc: 'https://rpc.mantle.xyz', explorer: 'https://mantlescan.info', color: '#00AEF0', type: 'L2' },
};

interface GasData {
  chainId: string;
  name: string;
  type: 'L1' | 'L2';
  gasPrice: string;
  gasPriceUSD: number;
  low: number;
  medium: number;
  high: number;
  l1GasPrice?: number;
  totalGasCostUSD?: number;
  lastUpdated: number;
}

interface GasComparison {
  chains: GasData[];
  recommendations: {
    cheapest: { chainId: string; name: string; savings: number };
    fastest: { chainId: string; name: string; speed: string };
    bestValue: { chainId: string; name: string; score: number };
  };
  timestamp: number;
}

async function getGasPrice(chainId: string): Promise<GasData | null> {
  const config = CHAIN_CONFIG[chainId];
  if (!config) return null;
  
  try {
    // Get ETH price for USD conversion
    const ethPrice = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then(r => r.data?.ethereum?.usd || 2500)
      .catch(() => 2500);

    // Get gas price from RPC
    const response = await axios.post(config.rpc, {
      jsonrpc: '2.0',
      method: 'eth_gasPrice',
      params: [],
      id: 1
    }, { timeout: 5000 });

    const gasPriceHex = response.data?.result || '0x0';
    const gasPriceWei = parseInt(gasPriceHex, 16);
    const gasPriceGwei = gasPriceWei / 1e9;
    const gasPriceUSD = gasPriceGwei * 0.001 * ethPrice; // Gas price in USD for 1k gas

    // For L2 chains, try to get L1 gas price
    let l1GasPrice = null;
    if (config.type === 'L2') {
      try {
        const l1Response = await axios.post(config.rpc, {
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1
        }, { timeout: 5000 });
        
        // Some L2s expose L1 data differently
        if (chainId === '10' || chainId === '42161') {
          l1GasPrice = gasPriceGwei * 0.001; // Simplified L1 cost estimation
        }
      } catch (e) {
        // Ignore L1 gas fetch errors
      }
    }

    return {
      chainId,
      name: config.name,
      type: config.type,
      gasPrice: gasPriceGwei.toFixed(4),
      gasPriceUSD: parseFloat(gasPriceUSD.toFixed(4)),
      low: Math.round(gasPriceGwei * 0.8),
      medium: Math.round(gasPriceGwei),
      high: Math.round(gasPriceGwei * 1.5),
      l1GasPrice: l1GasPrice ? parseFloat(l1GasPrice.toFixed(4)) : undefined,
      totalGasCostUSD: config.type === 'L2' ? parseFloat((gasPriceUSD * 1.2).toFixed(4)) : gasPriceUSD,
      lastUpdated: Date.now(),
    };
  } catch (error: any) {
    console.log(`Failed to fetch gas for chain ${chainId}: ${error.message}`);
    return getDemoGasData(chainId);
  }
}

function getDemoGasData(chainId: string): GasData {
  const config = CHAIN_CONFIG[chainId];
  const ethPrice = 2450;
  
  // Demo data based on typical gas prices
  const demoPrices: Record<string, number> = {
    '1': 25,      // ETH
    '10': 0.001,  // Optimism
    '42161': 0.015, // Arbitrum
    '137': 45,    // Polygon
    '56': 3,      // BSC
    '8453': 0.0015, // Base
    '43114': 25,  // Avalanche
    '1101': 0.05, // zkEVM
    '324': 0.001, // zkSync
    '5000': 0.002, // Mantle
  };
  
  const gasPrice = demoPrices[chainId] || 10;
  const gasPriceUSD = gasPrice * 0.001 * ethPrice;

  return {
    chainId,
    name: config?.name || 'Unknown',
    type: config?.type || 'L1',
    gasPrice: gasPrice.toFixed(4),
    gasPriceUSD: parseFloat(gasPriceUSD.toFixed(4)),
    low: Math.round(gasPrice * 0.8),
    medium: Math.round(gasPrice),
    high: Math.round(gasPrice * 1.5),
    l1GasPrice: config?.type === 'L2' ? 25 : undefined,
    totalGasCostUSD: config?.type === 'L2' ? gasPriceUSD * 1.2 : gasPriceUSD,
    lastUpdated: Date.now(),
  };
}

async function compareGasPrices(): Promise<GasComparison> {
  const chainIds = Object.keys(CHAIN_CONFIG);
  const gasDataPromises = chainIds.map(id => getGasPrice(id));
  const chains = (await Promise.all(gasDataPromises)).filter((d): d is GasData => d !== null);

  // Find cheapest
  const sortedByPrice = [...chains].sort((a, b) => a.gasPriceUSD - b.gasPriceUSD);
  const cheapest = sortedByPrice[0];
  const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
  const savings = mostExpensive.gasPriceUSD > 0 
    ? ((mostExpensive.gasPriceUSD - cheapest.gasPriceUSD) / mostExpensive.gasPriceUSD * 100).toFixed(1)
    : '0';

  // Find fastest (L1 usually faster for finality)
  const l1Chains = chains.filter(c => c.type === 'L1');
  const fastest = l1Chains.length > 0 ? l1Chains[0] : chains[0];

  // Best value score (considering both cost and speed)
  const scored = chains.map(c => {
    const costScore = 100 - (c.gasPriceUSD / Math.max(...chains.map(x => x.gasPriceUSD)) * 100);
    const speedScore = c.type === 'L1' ? 50 : 30;
    const score = costScore + speedScore;
    return { ...c, score };
  });
  const bestValue = scored.reduce((a, b) => a.score > b.score ? a : b);

  return {
    chains,
    recommendations: {
      cheapest: { chainId: cheapest.chainId, name: cheapest.name, savings: parseFloat(savings) },
      fastest: { chainId: fastest.chainId, name: fastest.name, speed: fastest.type === 'L1' ? '~12min' : '~1-15min' },
      bestValue: { chainId: bestValue.chainId, name: bestValue.name, score: Math.round(bestValue.score) },
    },
    timestamp: Date.now(),
  };
}

// Routes
app.get('/gas-comparison', async (req: Request, res: Response) => {
  try {
    const comparison = await compareGasPrices();
    res.json(comparison);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/gas-comparison/chains', (req: Request, res: Response) => {
  const chains = Object.entries(CHAIN_CONFIG).map(([id, config]) => ({
    chainId: id,
    name: config.name,
    type: config.type,
    explorer: config.explorer,
    color: config.color,
  }));
  res.json({ chains });
});

app.get('/gas-comparison/:chainId', async (req: Request, res: Response) => {
  const { chainId } = req.params;
  const gasData = await getGasPrice(chainId);
  
  if (gasData) {
    res.json(gasData);
  } else {
    res.status(404).json({ error: 'Chain not supported' });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Gas Comparison API running on port ${PORT}`);
  console.log(`   - GET /gas-comparison - Compare all chains`);
  console.log(`   - GET /gas-comparison/chains - List supported chains`);
  console.log(`   - GET /gas-comparison/:chainId - Get specific chain gas`);
});
