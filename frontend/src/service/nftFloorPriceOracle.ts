import { request } from '@/service/request'

const baseUrl = '/api/web3/nft-floor-price-oracle'

export interface FloorPriceResult {
  collection: string
  chain: string
  floorPrice: number
  floorPriceUSD: number
  volume24h: number
  sales24h: number
  listings: number
  avgPrice24h: number
  marketplace: string
  lastUpdated: number
  priceChange24h: number
  holders: number
  totalSupply: number
}

export interface CollectionStats {
  collection: string
  chain: string
  name: string
  symbol: string
  floorPrice: number
  floorPriceUSD: number
  volume24h: number
  volume7d: number
  volume30d: number
  sales24h: number
  avgPrice: number
  highestSale: number
  lowestSale: number
  totalSales: number
  holders: number
  totalSupply: number
  marketCap: number
  listingChange24h: number
  floorChange24h: number
}

export interface MarketplaceComparison {
  collection: string
  chain: string
  marketplaces: {
    name: string
    floorPrice: number
    listings: number
    volume24h: number
  }[]
  bestMarketplace: string
  potentialSavings: number
}

export interface HistoricalFloorPrice {
  collection: string
  chain: string
  prices: {
    timestamp: number
    floorPrice: number
    floorPriceUSD: number
  }[]
}

export const nftFloorPriceOracle = {
  getFloorPrice(collection: string, chain: string, marketplace?: string) {
    return request.get<FloorPriceResult>(`${baseUrl}/floor-price`, {
      params: { collection, chain, marketplace }
    })
  },

  getCollectionStats(collection: string, chain: string) {
    return request.get<CollectionStats>(`${baseUrl}/collection-stats`, {
      params: { collection, chain }
    })
  },

  getMarketplaceComparison(collection: string, chain: string) {
    return request.get<MarketplaceComparison>(`${baseUrl}/marketplace-comparison`, {
      params: { collection, chain }
    })
  },

  getHistoricalFloorPrice(collection: string, chain: string, days: number = 7) {
    return request.get<HistoricalFloorPrice>(`${baseUrl}/historical-floor-price`, {
      params: { collection, chain, days }
    })
  },

  getTrendingCollections(chain: string, limit: number = 10) {
    return request.get(`${baseUrl}/trending-collections`, {
      params: { chain, limit }
    })
  },

  getSupportedChains() {
    return request.get<string[]>(`${baseUrl}/supported-chains`)
  },

  getSupportedMarketplaces() {
    return request.get<string[]>(`${baseUrl}/supported-marketplaces`)
  }
}
