import express, { Request, Response } from 'express';
import axios from 'axios';

const app: express.Application = express();
const PORT = 3016;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Chain configuration
const CHAIN_CONFIG: Record<string, { name: string; rpc: string; explorer: string; color: string; nativeSymbol: string }> = {
  '1': { name: 'Ethereum', rpc: 'https://eth.llamarpc.com', explorer: 'https://etherscan.io', color: '#627EEA', nativeSymbol: 'ETH' },
  '137': { name: 'Polygon', rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com', color: '#8247E5', nativeSymbol: 'MATIC' },
  '42161': { name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', explorer: 'https://arbiscan.io', color: '#28A0F0', nativeSymbol: 'ETH' },
  '10': { name: 'Optimism', rpc: 'https://mainnet.optimism.io', explorer: 'https://optimistic.etherscan.io', color: '#FF0420', nativeSymbol: 'ETH' },
  '56': { name: 'BSC', rpc: 'https://bsc-dataseed.binance.org', explorer: 'https://bscscan.com', color: '#F3BA2F', nativeSymbol: 'BNB' },
  '8453': { name: 'Base', rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org', color: '#0052FF', nativeSymbol: 'ETH' },
  '43114': { name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', explorer: 'https://snowtrace.io', color: '#E84142', nativeSymbol: 'AVAX' },
};

// In-memory portfolio storage (for demo)
interface PortfolioPosition {
  id: string;
  address: string;
  chainId: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: string;
  price: number;
  value: number;
  change24h: number;
  logoUrl?: string;
}

interface Portfolio {
  id: string;
  name: string;
  addresses: string[];
  positions: PortfolioPosition[];
  totalValue: number;
  change24h: number;
  change24hPercent: number;
  lastUpdated: number;
}

const portfolios: Map<string, Portfolio> = new Map();

// Popular tokens for quick add
const POPULAR_TOKENS: Record<string, Array<{ address: string; symbol: string; name: string; decimals: number }>> = {
  '1': [
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
    { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave', decimals: 18 },
    { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
  ],
  '137': [
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether', decimals: 6 },
  ],
};

// Get ETH price
async function getEthPrice(): Promise<number> {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,matic,BNB,avax,solana&vs_currencies=usd',
      { timeout: 5000 }
    );
    return response.data?.ethereum?.usd || 2500;
  } catch {
    return 2500;
  }
}

// Get token prices
async function getTokenPrices(chainId: string, addresses: string[]): Promise<Record<string, number>> {
  const priceMap: Record<string, number> = {};
  
  try {
    // Use CoinGecko API for token prices
    const tokenIds: Record<string, string> = {
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'usd-coin',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'tether',
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'wrapped-bitcoin',
      '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9': 'aave',
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 'uniswap',
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'usd-coin',
      '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': 'tether',
    };
    
    const ids = addresses.map(a => tokenIds[a]).filter(Boolean).join(',');
    if (ids) {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addresses[0]}&vs_currencies=usd`,
        { timeout: 5000 }
      );
      // Simplified - in production would map properly
    }
  } catch {
    // Return default prices
  }
  
  return priceMap;
}

// Get wallet token balances
async function getWalletBalances(address: string, chainId: string): Promise<PortfolioPosition[]> {
  const config = CHAIN_CONFIG[chainId];
  if (!config) return [];
  
  const positions: PortfolioPosition[] = [];
  
  try {
    // Get native balance
    const nativeResponse = await axios.post(config.rpc, {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1
    }, { timeout: 10000 });
    
    const nativeBalance = parseInt(nativeResponse.data?.result || '0', 16) / 1e18;
    const ethPrice = await getEthPrice();
    
    if (nativeBalance > 0) {
      positions.push({
        id: `${address}-${chainId}-native`,
        address,
        chainId,
        tokenAddress: '0x0000000000000000000000000000000000000000',
        symbol: config.nativeSymbol,
        name: config.name,
        balance: nativeBalance.toFixed(6),
        price: ethPrice,
        value: nativeBalance * ethPrice,
        change24h: 0,
      });
    }
    
    // Get popular token balances
    const popularTokens = POPULAR_TOKENS[chainId] || [];
    for (const token of popularTokens) {
      try {
        // ERC20 balanceOf
        const balanceResponse = await axios.post(config.rpc, {
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: token.address,
            data: `0x70a08231000000000000000000000000${address.replace('0x', '')}`
          }, 'latest'],
          id: 1
        }, { timeout: 10000 });
        
        const balance = parseInt(balanceResponse.data?.result || '0', 16) / Math.pow(10, token.decimals);
        
        if (balance > 0) {
          // Get token price (simplified)
          const tokenPrice = await getTokenPriceBySymbol(token.symbol);
          
          positions.push({
            id: `${address}-${chainId}-${token.address}`,
            address,
            chainId,
            tokenAddress: token.address,
            symbol: token.symbol,
            name: token.name,
            balance: balance.toFixed(6),
            price: tokenPrice,
            value: balance * tokenPrice,
            change24h: (Math.random() - 0.5) * 10, // Mock 24h change
          });
        }
      } catch {
        // Skip failed tokens
      }
    }
  } catch (error) {
    console.log(`Failed to fetch balances for ${address} on chain ${chainId}:`, error);
  }
  
  return positions;
}

// Get token price by symbol (simplified)
async function getTokenPriceBySymbol(symbol: string): Promise<number> {
  const prices: Record<string, number> = {
    'ETH': 2500,
    'MATIC': 0.85,
    'WBTC': 65000,
    'USDC': 1,
    'USDT': 1,
    'AAVE': 250,
    'UNI': 15,
    'BNB': 350,
    'AVAX': 40,
  };
  
  return prices[symbol] || 0;
}

// Get multiple addresses across chains
async function getMultiChainPortfolio(addresses: string[], chainIds: string[]): Promise<Portfolio> {
  const allPositions: PortfolioPosition[] = [];
  
  for (const address of addresses) {
    for (const chainId of chainIds) {
      const positions = await getWalletBalances(address, chainId);
      allPositions.push(...positions);
    }
  }
  
  const totalValue = allPositions.reduce((sum, p) => sum + p.value, 0);
  const weightedChange = allPositions.reduce((sum, p) => sum + (p.change24h * p.value), 0) / (totalValue || 1);
  
  return {
    id: `portfolio-${Date.now()}`,
    name: 'Multi-Chain Portfolio',
    addresses,
    positions: allPositions,
    totalValue,
    change24h: weightedChange,
    change24hPercent: weightedChange,
    lastUpdated: Date.now(),
  };
}

// Routes

// Get supported chains
app.get('/portfolio-pro/chains', (req: Request, res: Response) => {
  const chains = Object.entries(CHAIN_CONFIG).map(([id, config]) => ({
    chainId: id,
    name: config.name,
    symbol: config.nativeSymbol,
    color: config.color,
  }));
  res.json({ chains });
});

// Get popular tokens by chain
app.get('/portfolio-pro/tokens/:chainId', (req: Request, res: Response) => {
  const { chainId } = req.params;
  const tokens = POPULAR_TOKENS[chainId] || [];
  res.json({ tokens });
});

// Get portfolio by address and chain
app.post('/portfolio-pro/analyze', async (req: Request, res: Response) => {
  try {
    const { addresses, chainIds } = req.body;
    
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'addresses array is required' });
    }
    
    const chains = chainIds && Array.isArray(chainIds) && chainIds.length > 0 
      ? chainIds 
      : Object.keys(CHAIN_CONFIG);
    
    const portfolio = await getMultiChainPortfolio(addresses, chains);
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single wallet portfolio
app.get('/portfolio-pro/wallet/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const chainIds = Object.keys(CHAIN_CONFIG);
    
    const portfolio = await getMultiChainPortfolio([address], chainIds);
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get portfolio history (mock for demo)
app.get('/portfolio-pro/history/:address', (req: Request, res: Response) => {
  const { address } = req.params;
  const days = parseInt(req.query.days as string) || 7;
  
  // Generate mock history
  const history: Array<{ timestamp: number; date: string; value: number; change24h: number }> = [];
  const now = Date.now();
  let baseValue = 50000 + Math.random() * 50000;
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000);
    const change = (Math.random() - 0.45) * 0.05; // Slight upward bias
    baseValue = baseValue * (1 + change);
    
    history.push({
      timestamp,
      date: new Date(timestamp).toISOString().split('T')[0],
      value: baseValue,
      change24h: change * 100,
    });
  }
  
  res.json({ address, history });
});

// Get portfolio allocations
app.get('/portfolio-pro/allocations/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const chainIds = Object.keys(CHAIN_CONFIG);
    
    const portfolio = await getMultiChainPortfolio([address], chainIds);
    
    // Calculate allocations
    const byChain: Record<string, number> = {};
    const byToken: Record<string, number> = {};
    
    for (const position of portfolio.positions) {
      byChain[position.chainId] = (byChain[position.chainId] || 0) + position.value;
      byToken[position.symbol] = (byToken[position.symbol] || 0) + position.value;
    }
    
    // Convert to percentages
    const total = portfolio.totalValue || 1;
    const chainAllocations = Object.entries(byChain).map(([chainId, value]) => ({
      chainId,
      name: CHAIN_CONFIG[chainId]?.name || chainId,
      value,
      percent: (value / total * 100).toFixed(2),
    }));
    
    const tokenAllocations = Object.entries(byToken).map(([symbol, value]) => ({
      symbol,
      value,
      percent: (value / total * 100).toFixed(2),
    })).sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));
    
    res.json({
      totalValue: portfolio.totalValue,
      byChain: chainAllocations,
      byToken: tokenAllocations.slice(0, 10),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`💼 Portfolio Pro API running on port ${PORT}`);
  console.log(`   - POST /portfolio-pro/analyze - Analyze multi-chain portfolio`);
  console.log(`   - GET /portfolio-pro/wallet/:address - Get wallet portfolio`);
  console.log(`   - GET /portfolio-pro/history/:address - Get portfolio history`);
  console.log(`   - GET /portfolio-pro/allocations/:address - Get allocation breakdown`);
  console.log(`   - GET /portfolio-pro/chains - List supported chains`);
  console.log(`   - GET /portfolio-pro/tokens/:chainId - List popular tokens`);
});
