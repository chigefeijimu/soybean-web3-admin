import { request } from '@/service/request'

const baseUrl = '/api/nft-watchlist'

export interface NftWatchlistItem {
  id: string
  collectionAddress: string
  chain: string
  collectionName?: string
  symbol?: string
  floorPrice?: number
  floorPriceChange24h?: number
  volume24h?: number
  holders?: number
  imageUrl?: string
  addedAt: number
  notes?: string
  alertEnabled: boolean
  alertFloorPrice?: number
}

export interface WatchlistStats {
  totalItems: number
  chains: Record<string, number>
  totalFloorValue: number
  totalVolume24h: number
  alertsEnabled: number
}

export const nftWatchlist = {
  getWatchlist(userId?: string) {
    return request.get<NftWatchlistItem[]>(baseUrl, { params: { userId } })
  },

  addToWatchlist(data: {
    collectionAddress: string
    chain: string
    collectionName?: string
    notes?: string
    alertEnabled?: boolean
    alertFloorPrice?: number
    userId?: string
  }) {
    return request.post(baseUrl, data)
  },

  updateWatchlistItem(
    id: string,
    data: Partial<NftWatchlistItem>,
    userId?: string
  ) {
    return request.put(`${baseUrl}/${id}`, { ...data, userId })
  },

  removeFromWatchlist(id: string, userId?: string) {
    return request.delete(`${baseUrl}/${id}`, { params: { userId } })
  },

  getStats(userId?: string) {
    return request.get<WatchlistStats>(`${baseUrl}/stats`, { params: { userId } })
  },

  refreshPrices(userId?: string) {
    return request.post(`${baseUrl}/refresh-prices`, {}, { params: { userId } })
  },

  bulkAdd(
    collections: Array<{
      collectionAddress: string
      chain: string
      collectionName?: string
    }>,
    userId?: string
  ) {
    return request.post(`${baseUrl}/bulk-add`, { collections }, { params: { userId } })
  },

  clearWatchlist(userId?: string) {
    return request.post(`${baseUrl}/clear`, {}, { params: { userId } })
  },

  getAlerts(userId?: string) {
    return request.get(`${baseUrl}/alerts`, { params: { userId } })
  },

  health() {
    return request.get(`${baseUrl}/health`)
  }
}
