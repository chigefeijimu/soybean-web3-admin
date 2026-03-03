import axios from 'axios';

// =============== Types ===============
export interface GasPrice {
  chainId: number;
  chainName: string;
  slow: number;
  normal: number;
  fast: number;
  baseFee: number;
  lastUpdated: number;
}

export interface ChainMetrics {
  chainId: number;
  chainName: string;
  tps: number;
  gasPrice: number;
  gasPriceUSD: number;
  blockNumber: number;
  blockTime: number;
  activeAddresses: number;
  txCount24h: number;
  tvl: number;
  lastUpdated: number;
}

export interface NFTSale {
  collection: string;
  tokenId: string;
  price: number;
  priceUSD: number;
  seller: string;
  buyer: string;
  chain: string;
  timestamp: number;
}

export interface Liquidation {
  chain: string;
  protocol: string;
  borrower: string;
  collateralAmount: number;
  collateralSymbol: string;
  debtAmount: number;
  debtSymbol: string;
  liquidationPrice: number;
  timestamp: number;
}

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  valueUSD: number;
  chain: string;
  timestamp: number;
  type: string;
}

export interface OverviewData {
  totalTPS: number;
  totalTVL: number;
  totalTx24h: number;
  chainCount: number;
  activeClients: number;
  lastUpdate: number;
  topChains: ChainMetrics[];
  recentEvents: {
    nftSales: NFTSale[];
    liquidations: Liquidation[];
    whaleTxs: WhaleTransaction[];
  };
}

export interface StatusData {
  wsConnections: number;
  gasPricesCount: number;
  chainMetricsCount: number;
  recentSalesCount: number;
  recentLiquidationsCount: number;
  recentWhaleTxsCount: number;
  lastMetricsUpdate: number;
  uptime: number;
}

// =============== API Client ===============
const API_BASE_URL = import.meta.env.DEV 
  ? '/proxy-realtimeMetrics' 
  : '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// =============== API Functions ===============
export const realtimeMetricsApi = {
  // Get all gas prices
  getGasPrices: () => apiClient.get<{ success: boolean; data: GasPrice[] }>('/api/gas'),
  
  // Get gas price for specific chain
  getGasPrice: (chainId: number) => 
    apiClient.get<{ success: boolean; data: GasPrice }>(`/api/gas/${chainId}`),
  
  // Get all chain metrics
  getChainMetrics: () => 
    apiClient.get<{ success: boolean; data: ChainMetrics[] }>('/api/metrics'),
  
  // Get specific chain metrics
  getChainMetric: (chainId: number) => 
    apiClient.get<{ success: boolean; data: ChainMetrics }>(`/api/metrics/${chainId}`),
  
  // Get recent NFT sales
  getNftSales: (limit?: number) => 
    apiClient.get<{ success: boolean; data: NFTSale[] }>('/api/nft-sales', { 
      params: { limit: limit || 20 } 
    }),
  
  // Get recent liquidations
  getLiquidations: (limit?: number) => 
    apiClient.get<{ success: boolean; data: Liquidation[] }>('/api/liquidations', { 
      params: { limit: limit || 10 } 
    }),
  
  // Get recent whale transactions
  getWhaleTxs: (limit?: number) => 
    apiClient.get<{ success: boolean; data: WhaleTransaction[] }>('/api/whale-txs', { 
      params: { limit: limit || 20 } 
    }),
  
  // Get supported chains
  getChains: () => 
    apiClient.get<{ success: boolean; data: any[] }>('/api/chains'),
  
  // Get dashboard overview
  getOverview: () => 
    apiClient.get<{ success: boolean; data: OverviewData }>('/api/overview'),
  
  // Get API status
  getStatus: () => 
    apiClient.get<{ success: boolean; data: StatusData }>('/api/status'),
};

// =============== WebSocket Helper ===============
export class RealtimeMetricsWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 5000;
  private subscriptions: Set<string> = new Set();
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isConnected: boolean = false;

  constructor(port: number = 3023) {
    // In development, connect to proxy; in production, connect directly
    this.url = import.meta.env.DEV 
      ? `ws://localhost:${port}` 
      : `ws://${window.location.hostname}:${port}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('Realtime Metrics WebSocket connected');
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const handler = this.messageHandlers.get(message.type);
            if (handler) {
              handler(message.data);
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onclose = () => {
          console.log('Realtime Metrics WebSocket disconnected');
          this.isConnected = false;
          setTimeout(() => this.connect(), this.reconnectInterval);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  subscribe(channels: string[]) {
    channels.forEach(ch => this.subscriptions.add(ch));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', channels }));
    }
  }

  unsubscribe(channels: string[]) {
    channels.forEach(ch => this.subscriptions.delete(ch));
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', channels }));
    }
  }

  on(eventType: string, handler: (data: any) => void) {
    this.messageHandlers.set(eventType, handler);
  }

  off(eventType: string) {
    this.messageHandlers.delete(eventType);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get connected() {
    return this.isConnected;
  }
}
