import { ref, onMounted, onUnmounted } from 'vue';

export interface TokenPrice {
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

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  averageChange24h: number;
  btcDominance: number;
  tokenCount: number;
  lastUpdate: number;
}

export function useWebSocketPrice() {
  const ws = ref<WebSocket | null>(null);
  const prices = ref<TokenPrice[]>([]);
  const isConnected = ref(false);
  const error = ref<string | null>(null);
  const subscribedTokens = ref<Set<string>>(new Set());
  const marketOverview = ref<MarketOverview | null>(null);

  // Connect to WebSocket server
  const connect = (wsUrl: string = 'ws://localhost:3022') => {
    try {
      ws.value = new WebSocket(wsUrl);

      ws.value.onopen = () => {
        isConnected.value = true;
        error.value = null;
        console.log('WebSocket connected');
      };

      ws.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'prices_update':
            case 'price_update':
              if (Array.isArray(message.data)) {
                prices.value = message.data;
              } else if (message.data) {
                // Update single token
                const idx = prices.value.findIndex(p => p.id === message.data.id);
                if (idx >= 0) {
                  prices.value[idx] = message.data;
                } else {
                  prices.value.push(message.data);
                }
              }
              break;
            case 'subscribed':
              subscribedTokens.value = new Set(message.tokens);
              break;
            case 'market_overview':
              marketOverview.value = message.data;
              break;
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.value.onerror = (e) => {
        error.value = 'WebSocket connection error';
        console.error('WebSocket error:', e);
      };

      ws.value.onclose = () => {
        isConnected.value = false;
        console.log('WebSocket disconnected');
      };
    } catch (e) {
      error.value = 'Failed to create WebSocket connection';
      console.error('WebSocket connection error:', e);
    }
  };

  // Subscribe to specific tokens
  const subscribe = (tokenIds: string[]) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'subscribe',
        tokens: tokenIds
      }));
    }
  };

  // Unsubscribe from tokens
  const unsubscribe = (tokenIds: string[]) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'unsubscribe',
        tokens: tokenIds
      }));
    }
  };

  // Get specific token price
  const getPrice = (tokenId: string) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'get_price',
        tokenId
      }));
    }
  };

  // Disconnect
  const disconnect = () => {
    if (ws.value) {
      ws.value.close();
      ws.value = null;
    }
    isConnected.value = false;
  };

  // Fetch prices via REST API (fallback)
  const fetchPrices = async (apiUrl: string = 'http://localhost:3022') => {
    try {
      const response = await fetch(`${apiUrl}/api/prices`);
      const data = await response.json();
      if (data.success) {
        prices.value = data.data;
      }
    } catch (e) {
      error.value = 'Failed to fetch prices';
      console.error('Failed to fetch prices:', e);
    }
  };

  // Fetch market overview
  const fetchMarketOverview = async (apiUrl: string = 'http://localhost:3022') => {
    try {
      const response = await fetch(`${apiUrl}/api/market/overview`);
      const data = await response.json();
      if (data.success) {
        marketOverview.value = data.data;
      }
    } catch (e) {
      error.value = 'Failed to fetch market overview';
      console.error('Failed to fetch market overview:', e);
    }
  };

  // Fetch trending tokens
  const fetchTrending = async (apiUrl: string = 'http://localhost:3022') => {
    try {
      const response = await fetch(`${apiUrl}/api/market/trending`);
      const data = await response.json();
      return data.data;
    } catch (e) {
      console.error('Failed to fetch trending:', e);
      return null;
    }
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    prices,
    isConnected,
    error,
    subscribedTokens,
    marketOverview,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    getPrice,
    fetchPrices,
    fetchMarketOverview,
    fetchTrending
  };
}
