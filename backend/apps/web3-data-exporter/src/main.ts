import express, { Request, Response } from 'express';
import axios from 'axios';

const app: express.Application = express();
const PORT = 3031;

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

// Helper: Convert JSON to CSV
function jsonToCsv(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if needed
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Helper: Get ETH price
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

// Get wallet transactions from explorer
async function getWalletTransactions(address: string, chainId: string): Promise<any[]> {
  const config = CHAIN_CONFIG[chainId];
  if (!config) return [];
  
  const transactions: any[] = [];
  
  try {
    // Use Blockscout API (works for most EVM chains)
    const apiBase = `https://${chainId === '1' ? 'eth' : chainId === '137' ? 'polygon' : chainId === '42161' ? 'arbitrum' : chainId === '10' ? 'optimism' : chainId === '56' ? 'bsc' : chainId === '8453' ? 'base' : chainId === '43114' ? 'avax' : 'eth'}.blockscout.com/api`;
    
    const response = await axios.get(`${apiBase}/v2/addresses/${address}/transactions`, {
      params: { limit: 50 },
      timeout: 10000
    });
    
    if (response.data?.items) {
      for (const tx of response.data.items) {
        transactions.push({
          hash: tx.hash,
          block_number: tx.block,
          timestamp: tx.timestamp,
          from: tx.from?.hash || tx.from,
          to: tx.to?.hash || tx.to,
          value: parseInt(tx.value || '0') / 1e18,
          gas_used: tx.gas_used,
          gas_price: tx.gas_price ? parseInt(tx.gas_price) / 1e9 : 0,
          gas_fee: tx.gas_used && tx.gas_price 
            ? (parseInt(tx.gas_used) * parseInt(tx.gas_price)) / 1e18 
            : 0,
          status: tx.status === 'ok' ? 'success' : 'failed',
          nonce: tx.nonce,
          tx_index: tx.transaction_index,
        });
      }
    }
  } catch (error) {
    console.log(`Failed to fetch transactions for ${address} on chain ${chainId}`);
  }
  
  return transactions;
}

// Get wallet token balances
async function getWalletBalances(address: string, chainId: string): Promise<any[]> {
  const config = CHAIN_CONFIG[chainId];
  if (!config) return [];
  
  const positions: any[] = [];
  
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
        chain: config.name,
        chain_id: chainId,
        token_type: 'Native',
        token_address: '0x0000000000000000000000000000000000000000',
        symbol: config.nativeSymbol,
        name: config.name,
        balance: nativeBalance,
        price_usd: chainId === '1' ? ethPrice : chainId === '137' ? 0.85 : chainId === '56' ? 350 : chainId === '43114' ? 40 : 0,
        value_usd: 0,
      });
    }
    
    // Get ERC20 balances (mock for demo - in production would scan token transfers)
    const mockTokens = [
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6 },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
      { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave', decimals: 18 },
      { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18 },
    ];
    
    for (const token of mockTokens) {
      try {
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
          positions.push({
            chain: config.name,
            chain_id: chainId,
            token_type: 'ERC20',
            token_address: token.address,
            symbol: token.symbol,
            name: token.name,
            balance: balance,
            price_usd: 1, // USDC/USDT = 1
            value_usd: balance,
          });
        }
      } catch {
        // Skip failed tokens
      }
    }
  } catch (error) {
    console.log(`Failed to fetch balances for ${address} on chain ${chainId}`);
  }
  
  return positions;
}

// Get NFT holdings (mock for demo)
async function getWalletNfts(address: string, chainId: string): Promise<any[]> {
  const config = CHAIN_CONFIG[chainId];
  if (!config) return [];
  
  // Mock NFT data - in production would query NFT contracts
  const mockNfts: any[] = [];
  
  // Add some mock NFTs for demo
  if (Math.random() > 0.5) {
    mockNfts.push({
      chain: config.name,
      chain_id: chainId,
      contract_address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      token_id: '1234',
      name: 'BoredApeYachtClub',
      symbol: 'BAYC',
      balance: 1,
      token_uri: 'ipfs://Qmxxx',
    });
  }
  
  return mockNfts;
}

// Get DeFi positions (mock for demo)
async function getDefiPositions(address: string, chainId: string): Promise<any[]> {
  const config = CHAIN_CONFIG[chainId];
  if (!config) return [];
  
  // Mock DeFi positions - in production would query protocol contracts
  const mockPositions: any[] = [];
  
  if (Math.random() > 0.7) {
    mockPositions.push({
      chain: config.name,
      chain_id: chainId,
      protocol: 'Aave',
      protocol_type: 'Lending',
      position_type: 'Supply',
      token_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      token_symbol: 'USDC',
      balance: 1000 + Math.random() * 5000,
      apy: 3.5 + Math.random() * 2,
      value_usd: 1000 + Math.random() * 5000,
    });
  }
  
  if (Math.random() > 0.7) {
    mockPositions.push({
      chain: config.name,
      chain_id: chainId,
      protocol: 'Uniswap V3',
      protocol_type: 'DEX',
      position_type: 'LP',
      token_address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      token_symbol: 'USDC-USDT',
      balance: 500 + Math.random() * 2000,
      apy: 10 + Math.random() * 20,
      value_usd: 500 + Math.random() * 2000,
    });
  }
  
  return mockPositions;
}

// Routes

// Export transactions
app.post('/export/transactions', async (req: Request, res: Response) => {
  try {
    const { address, chainIds, format = 'csv' } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    
    const chains = chainIds && Array.isArray(chainIds) && chainIds.length > 0 
      ? chainIds 
      : ['1'];
    
    let allTransactions: any[] = [];
    
    for (const chainId of chains) {
      const txs = await getWalletTransactions(address, chainId);
      allTransactions.push(...txs);
    }
    
    // Sort by timestamp descending
    allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (format === 'json') {
      return res.json({
        export_type: 'transactions',
        address,
        chains,
        count: allTransactions.length,
        generated_at: new Date().toISOString(),
        data: allTransactions,
      });
    }
    
    // CSV format
    const csv = jsonToCsv(allTransactions);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${address}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export token balances
app.post('/export/balances', async (req: Request, res: Response) => {
  try {
    const { address, chainIds, format = 'csv' } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    
    const chains = chainIds && Array.isArray(chainIds) && chainIds.length > 0 
      ? chainIds 
      : Object.keys(CHAIN_CONFIG);
    
    let allBalances: any[] = [];
    
    for (const chainId of chains) {
      const balances = await getWalletBalances(address, chainId);
      allBalances.push(...balances);
    }
    
    // Calculate USD values
    for (const balance of allBalances) {
      balance.value_usd = balance.balance * balance.price_usd;
    }
    
    if (format === 'json') {
      return res.json({
        export_type: 'balances',
        address,
        chains,
        count: allBalances.length,
        total_value_usd: allBalances.reduce((sum, b) => sum + b.value_usd, 0),
        generated_at: new Date().toISOString(),
        data: allBalances,
      });
    }
    
    const csv = jsonToCsv(allBalances);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="balances_${address}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export NFTs
app.post('/export/nfts', async (req: Request, res: Response) => {
  try {
    const { address, chainIds, format = 'csv' } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    
    const chains = chainIds && Array.isArray(chainIds) && chainIds.length > 0 
      ? chainIds 
      : ['1'];
    
    let allNfts: any[] = [];
    
    for (const chainId of chains) {
      const nfts = await getWalletNfts(address, chainId);
      allNfts.push(...nfts);
    }
    
    if (format === 'json') {
      return res.json({
        export_type: 'nfts',
        address,
        chains,
        count: allNfts.length,
        generated_at: new Date().toISOString(),
        data: allNfts,
      });
    }
    
    const csv = jsonToCsv(allNfts);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="nfts_${address}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export DeFi positions
app.post('/export/defi-positions', async (req: Request, res: Response) => {
  try {
    const { address, chainIds, format = 'csv' } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    
    const chains = chainIds && Array.isArray(chainIds) && chainIds.length > 0 
      ? chainIds 
      : Object.keys(CHAIN_CONFIG);
    
    let allPositions: any[] = [];
    
    for (const chainId of chains) {
      const positions = await getDefiPositions(address, chainId);
      allPositions.push(...positions);
    }
    
    if (format === 'json') {
      return res.json({
        export_type: 'defi_positions',
        address,
        chains,
        count: allPositions.length,
        total_value_usd: allPositions.reduce((sum, p) => sum + p.value_usd, 0),
        weighted_apy: allPositions.length > 0 
          ? allPositions.reduce((sum, p) => sum + (p.apy * p.value_usd), 0) / allPositions.reduce((sum, p) => sum + p.value_usd, 0)
          : 0,
        generated_at: new Date().toISOString(),
        data: allPositions,
      });
    }
    
    const csv = jsonToCsv(allPositions);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="defi_positions_${address}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export full portfolio (all data)
app.post('/export/portfolio', async (req: Request, res: Response) => {
  try {
    const { address, chainIds, format = 'csv' } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    
    const chains = chainIds && Array.isArray(chainIds) && chainIds.length > 0 
      ? chainIds 
      : Object.keys(CHAIN_CONFIG);
    
    // Gather all data
    let balances: any[] = [];
    let transactions: any[] = [];
    let nfts: any[] = [];
    let defiPositions: any[] = [];
    
    for (const chainId of chains) {
      const [chainBalances, chainTxs, chainNfts, chainDefi] = await Promise.all([
        getWalletBalances(address, chainId),
        getWalletTransactions(address, chainId),
        getWalletNfts(address, chainId),
        getDefiPositions(address, chainId),
      ]);
      
      balances.push(...chainBalances);
      transactions.push(...chainTxs);
      nfts.push(...chainNfts);
      defiPositions.push(...chainDefi);
    }
    
    const totalValue = balances.reduce((sum, b) => sum + (b.balance * b.price_usd), 0) + 
                       defiPositions.reduce((sum, p) => sum + p.value_usd, 0);
    
    if (format === 'json') {
      return res.json({
        export_type: 'full_portfolio',
        address,
        chains,
        summary: {
          total_value_usd: totalValue,
          token_count: balances.length,
          transaction_count: transactions.length,
          nft_count: nfts.length,
          defi_position_count: defiPositions.length,
        },
        generated_at: new Date().toISOString(),
        data: {
          balances,
          transactions: transactions.slice(0, 100), // Limit to recent 100
          nfts,
          defi_positions: defiPositions,
        },
      });
    }
    
    // For CSV, export balances as default
    const csv = jsonToCsv(balances.map(b => ({
      ...b,
      value_usd: b.balance * b.price_usd,
    })));
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="portfolio_${address}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get supported export types
app.get('/export/types', (req: Request, res: Response) => {
  res.json({
    types: [
      { id: 'transactions', label: 'Transaction History', description: 'Export all wallet transactions' },
      { id: 'balances', label: 'Token Balances', description: 'Export token holdings and values' },
      { id: 'nfts', label: 'NFT Holdings', description: 'Export NFT collection' },
      { id: 'defi-positions', label: 'DeFi Positions', description: 'Export DeFi protocol positions' },
      { id: 'portfolio', label: 'Full Portfolio', description: 'Export complete portfolio data' },
    ],
    formats: ['csv', 'json'],
    chains: Object.entries(CHAIN_CONFIG).map(([id, config]) => ({
      chainId: id,
      name: config.name,
      symbol: config.nativeSymbol,
    })),
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📤 Data Exporter API running on port ${PORT}`);
  console.log(`   - POST /export/transactions - Export transaction history`);
  console.log(`   - POST /export/balances - Export token balances`);
  console.log(`   - POST /export/nfts - Export NFT holdings`);
  console.log(`   - POST /export/defi-positions - Export DeFi positions`);
  console.log(`   - POST /export/portfolio - Export full portfolio`);
  console.log(`   - GET /export/types - Get supported export types`);
});
