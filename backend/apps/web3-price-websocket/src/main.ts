import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import axios from 'axios';

const app: express.Application = express();
const PORT = 3022;

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

// Token configuration
const SUPPORTED_TOKENS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', address: '0x0000000000000000000000000000000000000000', chainId: '1' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', chainId: '1' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', chainId: '1' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', chainId: '1' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', address: '0x0000000000000000000000000000000000000000', chainId: '56' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', address: '0x0000000000000000000000000000000000000000', chainId: ' Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', address: '0x0000000000000000000000000000000000000000', chainId: '' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', address: '0x0000000000000000000000000000000000000000', chainId: '' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', address: '0x0000000000000000000000000000000000000000', chainId: '' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', address: '0x0000000000000000000000000000000000000000', chainId: '137' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', address: '0x0000000000000000000000000000000000000000', chainId: '43114' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', chainId: '1' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', chainId: '1' },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', chainId: '1' },
  { id: 'maker', symbol: 'MKR', name: 'Maker', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3B57956', chainId: '1' },
  { id: 'curve-dao-token', symbol: 'CRV', name: 'Curve DAO', address: '0xD533a949740bb3306d119CC777fa900bA034cd52', chainId: '1' },
  { id: 'wrapped-bitcoin', symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', chainId: '1' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', address: '0x0000000000000000000000000000000000000000', chainId: '' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', address: '0x0000000000000000000000000000000000000000', chainId: '' },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', chainId: '1' },
];

// Price cache
interface TokenPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: number;
}

const priceCache: Map<string, TokenPrice> = new Map();
let lastPriceUpdate = 0;

// WebSocket clients
const clients: Set<WebSocket> = new Set();

// Subscriptions per client
const clientSubscriptions: Map<WebSocket, Set<string>> = new Map();

// Fetch prices from CoinGecko
async function fetchPrices(): Promise<void> {
  try {
    const ids = SUPPORTED_TOKENS.map(t => t.id).join(',');
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`,
      { timeout: 10000 }
    );

    const now = Date.now();
    
    for (const coin of response.data) {
      const priceData: TokenPrice = {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price || 0,
        priceChange24h: coin.price_change_24h || 0,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap || 0,
        volume24h: coin.total_volume || 0,
        high24h: coin.high_24h || 0,
        low24h: coin.low_24h || 0,
        lastUpdated: now,
      };
      priceCache.set(coin.id, priceData);
    }
    
    lastPriceUpdate = now;
    console.log(`[${new Date().toISOString()}] Prices updated: ${priceCache.size} tokens`);
  } catch (error) {
    console.error('Failed to fetch prices:', error);
  }
}

// Broadcast price update to all subscribed clients
function broadcastPriceUpdate(tokenId?: string): void {
  if (clients.size === 0) return;

  const updateData = {
    type: tokenId ? 'price_update' : 'prices_update',
    timestamp: Date.now(),
    data: tokenId 
      ? priceCache.get(tokenId) 
      : Array.from(priceCache.values()),
  };

  const message = JSON.stringify(updateData);
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const subs = clientSubscriptions.get(client);
      if (!subs || subs.size === 0 || (tokenId && subs.has(tokenId))) {
        client.send(message);
      }
    }
  });
}

// Initial price fetch
fetchPrices();

// Set up periodic price updates (every 10 seconds)
setInterval(fetchPrices, 10000);

// Set up broadcast every 10 seconds
setInterval(() => broadcastPriceUpdate(), 10000);

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`WebSocket Price Feed API running on port ${PORT}`);
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to WebSocket');
  clients.add(ws);
  clientSubscriptions.set(ws, new Set());

  // Send initial prices
  ws.send(JSON.stringify({
    type: 'prices_update',
    timestamp: Date.now(),
    data: Array.from(priceCache.values()),
  }));

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe':
          // Subscribe to specific tokens
          const subs = clientSubscriptions.get(ws);
          if (subs && message.tokens && Array.isArray(message.tokens)) {
            message.tokens.forEach((tokenId: string) => subs.add(tokenId));
          }
          ws.send(JSON.stringify({
            type: 'subscribed',
            timestamp: Date.now(),
            tokens: Array.from(clientSubscriptions.get(ws) || []),
          }));
          break;

        case 'unsubscribe':
          // Unsubscribe from tokens
          const unsubSubs = clientSubscriptions.get(ws);
          if (unsubSubs && message.tokens && Array.isArray(message.tokens)) {
            message.tokens.forEach((tokenId: string) => unsubSubs.delete(tokenId));
          }
          break;

        case 'get_price':
          // Get specific token price
          if (message.tokenId && priceCache.has(message.tokenId)) {
            ws.send(JSON.stringify({
              type: 'price_update',
              timestamp: Date.now(),
              data: priceCache.get(message.tokenId),
            }));
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
    clientSubscriptions.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
    clientSubscriptions.delete(ws);
  });
});

// REST API Endpoints

// Get all current prices
app.get('/api/prices', (req: Request, res: Response) => {
  res.json({
    success: true,
    timestamp: Date.now(),
    data: Array.from(priceCache.values()),
  });
});

// Get specific token price
app.get('/api/price/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const price = priceCache.get(id);
  
  if (!price) {
    return res.status(404).json({
      success: false,
      error: 'Token not found',
    });
  }
  
  res.json({
    success: true,
    timestamp: Date.now(),
    data: price,
  });
});

// Get supported tokens
app.get('/api/tokens', (req: Request, res: Response) => {
  res.json({
    success: true,
    timestamp: Date.now(),
    data: SUPPORTED_TOKENS,
  });
});

// Get market overview
app.get('/api/market/overview', (req: Request, res: Response) => {
  const prices = Array.from(priceCache.values());
  
  const totalMarketCap = prices.reduce((sum, p) => sum + (p.marketCap || 0), 0);
  const totalVolume24h = prices.reduce((sum, p) => sum + (p.volume24h || 0), 0);
  const avgChange = prices.length > 0 
    ? prices.reduce((sum, p) => sum + (p.priceChangePercent24h || 0), 0) / prices.length 
    : 0;

  res.json({
    success: true,
    timestamp: Date.now(),
    data: {
      totalMarketCap,
      totalVolume24h,
      averageChange24h: avgChange,
      btcDominance: prices.find(p => p.symbol === 'BTC')?.price 
        ? (priceCache.get('bitcoin')?.marketCap || 0) / totalMarketCap * 100 
        : 0,
      tokenCount: prices.length,
      lastUpdate: lastPriceUpdate,
    },
  });
});

// Get trending tokens
app.get('/api/market/trending', (req: Request, res: Response) => {
  const prices = Array.from(priceCache.values());
  
  // Sort by price change percentage
  const sorted = [...prices].sort((a, b) => 
    (b.priceChangePercent24h || 0) - (a.priceChangePercent24h || 0)
  );

  res.json({
    success: true,
    timestamp: Date.now(),
    data: {
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse(),
    },
  });
});

// WebSocket connection info
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    timestamp: Date.now(),
    data: {
      wsConnections: clients.size,
      lastPriceUpdate,
      tokenCount: priceCache.size,
      uptime: process.uptime(),
    },
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  wss.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
