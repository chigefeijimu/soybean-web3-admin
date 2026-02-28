import 'viem'

// Extend viem Chain interface for custom chains
// Note: viem already has Chain interface, we augment it with custom properties if needed

// Extend wagmi config types
export interface Web3Wallet {
  id: string
  address: string
  chainId: number
  type: 'metamask' | 'walletconnect' | 'coinbase'
}

export interface Web3Transaction {
  id: string
  hash: string
  from: string
  to: string
  value: string
  status: 'pending' | 'confirmed' | 'failed'
  chainId: number
  timestamp: number
  blockNumber?: number
  gasUsed?: string
}

export interface ContractABI {
  name: string
  type: 'function' | 'event' | 'error'
  inputs?: { name: string; type: string; indexed?: boolean }[]
  outputs?: { name: string; type: string }[]
  stateMutability?: 'view' | 'pure' | 'nonpayable' | 'payable'
}

export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  logoUrl?: string
}

// Market Data Types
export interface TokenPrice {
  symbol: string
  name: string
  price: number
  change24h: number
  volume24h?: number
  marketCap?: number
  logoUrl?: string
}

export interface MarketOverview {
  totalMarketCap: number
  totalVolume: number
  btcDominance: number
  ethDominance: number
  topGainers: TokenPrice[]
  topLosers: TokenPrice[]
}

export interface GasPrice {
  slow: string
  standard: string
  fast: string
  estimatedConfirmationTime: {
    slow: number
    standard: number
    fast: number
  }
}

export interface DeFiProtocol {
  name: string
  logoUrl: string
  tvl: number
  category: string
  chains: string[]
}

export interface PriceHistory {
  timestamp: number
  price: number
}

export interface TrendingToken {
  item: {
    id: string
    name: string
    symbol: string
    marketCapRank: number
    thumb: string
    small: string
    large: string
    slug: string
    priceBtc: number
  }
}

// Transaction Receipt Types
export interface ParsedReceipt {
  transactionHash: string
  blockNumber: number
  from: string
  to?: string
  contractAddress?: string
  status: boolean
  gasUsed: number
  effectiveGasPrice: number
  events: ParsedEvent[]
}

export interface ParsedEvent {
  name: string
  signature: string
  address: string
  params: EventParam[]
  logIndex: number
}

export interface EventParam {
  name: string
  value: string
  indexed: boolean
}
