import { request } from '../request';

// Types
export interface Chain {
  ETHEREUM: 'ethereum';
  POLYGON: 'polygon';
  ARBITRUM: 'arbitrum';
  OPTIMISM: 'optimism';
  BASE: 'base';
  SOLANA: 'solana';
}

export interface SignalType {
  STRONG_BUY: 'strong_buy';
  BUY: 'buy';
  HOLD: 'hold';
  SELL: 'sell';
  STRONG_SELL: 'strong_sell';
}

export type ChainType = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base' | 'solana';
export type SignalTypeEnum = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
export type TimeFrame = '1h' | '4h' | '24h' | '7d';

export interface FloorPricePrediction {
  currentFloor: number;
  predictedFloor: number;
  predictedChange: number;
  predictedChangePercent: number;
  confidence: number;
  signal: SignalTypeEnum;
  targetPrices: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
  trend: 'bullish' | 'bearish' | 'neutral';
  indicators: {
    rsi: number;
    macd: string;
    ema20: number;
    ema50: number;
    volumeTrend: string;
  };
  factors: string[];
}

export interface PredictFloorPriceParams {
  address: string;
  chain: ChainType;
  timeFrame?: TimeFrame;
}

export interface CollectionPredictions {
  collection: { address: string; chain: ChainType };
  predictions: {
    '1h': FloorPricePrediction;
    '4h': FloorPricePrediction;
    '24h': FloorPricePrediction;
    '7d': FloorPricePrediction;
  };
}

export interface WatchlistItem {
  id: string;
  userId: string;
  address: string;
  chain: ChainType;
  name: string;
  addedAt: number;
}

export interface TrendingCollection {
  name: string;
  address: string;
  floorPrice: number;
  change24h: number;
  prediction: FloorPricePrediction;
}

export interface Signal {
  collection: { name: string; address: string; chain: ChainType };
  prediction: FloorPricePrediction;
  generatedAt: number;
}

// API Functions
export const nftFloorPrediction = {
  // Predict floor price for a collection
  predict: (params: PredictFloorPriceParams) =>
    request.post<FloorPricePrediction>('/nft-floor-prediction/predict', params),

  // Get predictions across multiple timeframes
  getCollectionPredictions: (address: string, chain: ChainType) =>
    request.get<CollectionPredictions>(`/nft-floor-prediction/collection/${address}`, {
      params: { chain },
    }),

  // Get prediction history
  getHistory: (address: string, chain: ChainType, days?: number) =>
    request.get('/nft-floor-prediction/history', {
      params: { address, chain, days },
    }),

  // Watchlist management
  addToWatchlist: (userId: string, address: string, chain: ChainType, name?: string) =>
    request.post<WatchlistItem>('/nft-floor-prediction/watchlist', {
      userId,
      address,
      chain,
      name,
    }),

  getWatchlist: (userId: string) =>
    request.get<WatchlistItem[]>(`/nft-floor-prediction/watchlist/${userId}`),

  removeFromWatchlist: (id: string) =>
    request.delete(`/nft-floor-prediction/watchlist/${id}`),

  // Get trending collections
  getTrending: (chain: ChainType, limit?: number) =>
    request.get('/nft-floor-prediction/trending', {
      params: { chain, limit },
    }),

  // Get trading signals
  getSignals: (chain?: ChainType, signalType?: SignalTypeEnum) =>
    request.get('/nft-floor-prediction/signals', {
      params: { chain, signalType },
    }),

  // Get stats
  getStats: () => request.get('/nft-floor-prediction/stats'),
};
