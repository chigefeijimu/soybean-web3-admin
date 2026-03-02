import express, { Request, Response } from 'express';
import axios from 'axios';

const app: any = express();
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

// Token price cache
const priceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute

// Order types
type OrderType = 'take_profit' | 'stop_loss' | 'limit_buy' | 'limit_sell';
type OrderStatus = 'pending' | 'active' | 'triggered' | 'cancelled' | 'expired' | 'failed';

// Order interface
interface SmartOrder {
  id: string;
  userAddress: string;
  chainId: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  orderType: OrderType;
  side: 'buy' | 'sell';
  amount: string;
  triggerPrice: number;
  currentPrice: number;
  limitPrice?: number;
  status: OrderStatus;
  createdAt: number;
  triggeredAt?: number;
  expiresAt?: number;
  notes?: string;
}

// In-memory order storage
const orders: Map<string, SmartOrder> = new Map();

// Get token price with caching
async function getTokenPrice(chainId: string, tokenAddress: string): Promise<number> {
  const cacheKey = `${chainId}-${tokenAddress}`;
  const cached = priceCache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }
  
  try {
    // Mock prices for demo - in production would use CoinGecko/Oracle
    const mockPrices: Record<string, number> = {
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 1.0, // USDC
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 1.0, // USDT
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 65000, // WBTC
      '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9': 280, // AAVE
      '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': 18, // UNI
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 1.0, // USDC Polygon
      '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': 1.0, // USDT Polygon
      'native-ETH': 2500,
      'native-MATIC': 0.85,
      'native-BNB': 380,
      'native-AVAX': 42,
    };
    
    const key = tokenAddress.toLowerCase();
    let price = mockPrices[key] || mockPrices[`native-${CHAIN_CONFIG[chainId]?.nativeSymbol}`] || 100;
    
    // Add some randomness for demo
    price = price * (1 + (Math.random() - 0.5) * 0.02);
    
    priceCache[cacheKey] = { price, timestamp: Date.now() };
    return price;
  } catch (error) {
    return 100;
  }
}

// Get multiple token prices
async function getMultiplePrices(chainId: string, tokens: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  for (const token of tokens) {
    prices[token] = await getTokenPrice(chainId, token);
  }
  return prices;
}

// ==================== ROUTES ====================

// Get supported chains
app.get('/smart-order/chains', (req: Request, res: Response) => {
  const chains = Object.entries(CHAIN_CONFIG).map(([id, config]) => ({
    chainId: id,
    name: config.name,
    symbol: config.nativeSymbol,
    color: config.color,
  }));
  res.json({ chains });
});

// Get popular tokens
app.get('/smart-order/tokens/:chainId', (req: Request, res: Response) => {
  const { chainId } = req.params;
  
  const tokens: Record<string, Array<{ address: string; symbol: string; name: string; decimals: number; logo?: string }>> = {
    '1': [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, logo: '🔷' },
      { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6, logo: '🔵' },
      { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', decimals: 6, logo: '🟢' },
      { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, logo: '🟡' },
      { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', symbol: 'AAVE', name: 'Aave', decimals: 18, logo: '👻' },
      { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', decimals: 18, logo: '🦄' },
    ],
    '137': [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'MATIC', name: 'Polygon', decimals: 18, logo: '🟣' },
      { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6, logo: '🔵' },
      { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether', decimals: 6, logo: '🟢' },
    ],
    '42161': [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, logo: '🔷' },
      { address: '0xAF88d065d77C12cC73919fF65E128f40466C8D0', symbol: 'USDC', name: 'USD Coin', decimals: 6, logo: '🔵' },
    ],
    '8453': [
      { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', decimals: 18, logo: '🔷' },
      { address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed', symbol: 'DEGEN', name: 'Degen', decimals: 18, logo: '🐕' },
    ],
  };
  
  res.json({ tokens: tokens[chainId] || tokens['1'] });
});

// Get token price
app.get('/smart-order/price/:chainId/:tokenAddress', async (req: Request, res: Response) => {
  try {
    const { chainId, tokenAddress } = req.params;
    const price = await getTokenPrice(chainId, tokenAddress);
    res.json({ price, timestamp: Date.now() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get multiple token prices
app.post('/smart-order/prices', async (req: Request, res: Response) => {
  try {
    const { chainId, tokens } = req.body;
    if (!chainId || !tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'chainId and tokens array required' });
    }
    const prices = await getMultiplePrices(chainId, tokens);
    res.json({ prices, timestamp: Date.now() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new order
app.post('/smart-order/create', async (req: Request, res: Response) => {
  try {
    const {
      userAddress,
      chainId,
      tokenAddress,
      tokenSymbol,
      tokenName,
      orderType,
      side,
      amount,
      triggerPrice,
      limitPrice,
      expiresInHours,
      notes
    } = req.body;
    
    // Validation
    if (!userAddress || !chainId || !tokenAddress || !orderType || !side || !amount || !triggerPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['take_profit', 'stop_loss', 'limit_buy', 'limit_sell'].includes(orderType)) {
      return res.status(400).json({ error: 'Invalid order type' });
    }
    
    if (!['buy', 'sell'].includes(side)) {
      return res.status(400).json({ error: 'Invalid side' });
    }
    
    // Get current price
    const currentPrice = await getTokenPrice(chainId, tokenAddress);
    
    // Create order
    const order: SmartOrder = {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userAddress: userAddress.toLowerCase(),
      chainId,
      tokenAddress,
      tokenSymbol: tokenSymbol || 'UNKNOWN',
      tokenName: tokenName || 'Unknown Token',
      orderType,
      side,
      amount,
      triggerPrice: parseFloat(triggerPrice),
      currentPrice,
      limitPrice: limitPrice ? parseFloat(limitPrice) : undefined,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: expiresInHours ? Date.now() + expiresInHours * 60 * 60 * 1000 : undefined,
      notes,
    };
    
    orders.set(order.id, order);
    
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's orders
app.get('/smart-order/orders/:userAddress', (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;
    const status = req.query.status as string;
    const chainId = req.query.chainId as string;
    
    let userOrders = Array.from(orders.values())
      .filter(order => order.userAddress === userAddress.toLowerCase());
    
    if (status) {
      userOrders = userOrders.filter(order => order.status === status);
    }
    
    if (chainId) {
      userOrders = userOrders.filter(order => order.chainId === chainId);
    }
    
    // Sort by created time descending
    userOrders.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({ orders: userOrders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
app.get('/smart-order/order/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = orders.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update order (cancel, etc.)
app.put('/smart-order/order/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, triggerPrice, notes } = req.body;
    
    const order = orders.get(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (status) {
      if (!['pending', 'active', 'triggered', 'cancelled', 'expired', 'failed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      order.status = status;
      if (status === 'triggered') {
        order.triggeredAt = Date.now();
      }
    }
    
    if (triggerPrice) {
      order.triggerPrice = parseFloat(triggerPrice);
    }
    
    if (notes !== undefined) {
      order.notes = notes;
    }
    
    orders.set(orderId, order);
    
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order
app.delete('/smart-order/order/:orderId', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    
    if (!orders.has(orderId)) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    orders.delete(orderId);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check orders status (simulate price monitoring)
app.post('/smart-order/check', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'userAddress required' });
    }
    
    const userOrders = Array.from(orders.values())
      .filter(order => order.userAddress === userAddress.toLowerCase() && order.status === 'active');
    
    const updatedOrders: SmartOrder[] = [];
    
    for (const order of userOrders) {
      // Get current price
      const currentPrice = await getTokenPrice(order.chainId, order.tokenAddress);
      order.currentPrice = currentPrice;
      
      // Check if order should trigger
      let triggered = false;
      
      if (order.orderType === 'take_profit' && order.side === 'sell') {
        // Sell when price goes up to trigger price
        triggered = currentPrice >= order.triggerPrice;
      } else if (order.orderType === 'stop_loss' && order.side === 'sell') {
        // Sell when price goes down to trigger price
        triggered = currentPrice <= order.triggerPrice;
      } else if (order.orderType === 'limit_buy' && order.side === 'buy') {
        // Buy when price goes down to trigger price
        triggered = currentPrice <= order.triggerPrice;
      } else if (order.orderType === 'limit_sell' && order.side === 'sell') {
        // Sell when price goes up to trigger price
        triggered = currentPrice >= order.triggerPrice;
      }
      
      // Check expiration
      if (order.expiresAt && Date.now() > order.expiresAt) {
        order.status = 'expired';
        updatedOrders.push(order);
      } else if (triggered) {
        order.status = 'triggered';
        order.triggeredAt = Date.now();
        updatedOrders.push(order);
      }
      
      orders.set(order.id, order);
    }
    
    res.json({ checked: userOrders.length, triggered: updatedOrders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get order statistics
app.get('/smart-order/stats/:userAddress', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;
    
    const userOrders = Array.from(orders.values())
      .filter(order => order.userAddress === userAddress.toLowerCase());
    
    const stats = {
      total: userOrders.length,
      active: userOrders.filter(o => o.status === 'active').length,
      triggered: userOrders.filter(o => o.status === 'triggered').length,
      cancelled: userOrders.filter(o => o.status === 'cancelled').length,
      expired: userOrders.filter(o => o.status === 'expired').length,
      byType: {
        take_profit: userOrders.filter(o => o.orderType === 'take_profit').length,
        stop_loss: userOrders.filter(o => o.orderType === 'stop_loss').length,
        limit_buy: userOrders.filter(o => o.orderType === 'limit_buy').length,
        limit_sell: userOrders.filter(o => o.orderType === 'limit_sell').length,
      },
      byChain: {} as Record<string, number>,
    };
    
    // Count by chain
    for (const order of userOrders) {
      stats.byChain[order.chainId] = (stats.byChain[order.chainId] || 0) + 1;
    }
    
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get market prices for orders
app.get('/smart-order/market/:chainId', async (req: Request, res: Response) => {
  try {
    const { chainId } = req.params;
    
    const tokens = await getMultiplePrices(chainId, [
      '0x0000000000000000000000000000000000000000',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    ]);
    
    res.json({ prices: tokens, timestamp: Date.now() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Smart Order Manager API running on port ${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   GET  /smart-order/chains - Supported chains`);
  console.log(`   GET  /smart-order/tokens/:chainId - Popular tokens`);
  console.log(`   GET  /smart-order/price/:chainId/:tokenAddress - Token price`);
  console.log(`   POST /smart-order/prices - Multiple token prices`);
  console.log(`   POST /smart-order/create - Create order`);
  console.log(`   GET  /smart-order/orders/:userAddress - User orders`);
  console.log(`   GET  /smart-order/order/:orderId - Single order`);
  console.log(`   PUT  /smart-order/order/:orderId - Update order`);
  console.log(`   DELETE /smart-order/order/:orderId - Delete order`);
  console.log(`   POST /smart-order/check - Check/trigger orders`);
  console.log(`   GET  /smart-order/stats/:userAddress - Order statistics`);
  console.log(`   GET  /smart-order/market/:chainId - Market prices`);
});

export default app;
