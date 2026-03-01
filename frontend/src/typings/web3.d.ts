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
  // Optional error for API failures
  error?: string
  // Optional gas info from API
  gas_info?: GasInfo
  // Optional contract name
  contract?: string
}

export interface ParsedEvent {
  name: string
  signature: string
  address: string
  params: EventParam[]
  logIndex: number
  contract?: string
}

export interface EventParam {
  name: string
  value: string
  indexed: boolean
}

// Block Explorer Types
export interface BlockInfo {
  number: number
  hash: string
  parentHash: string
  timestamp: number
  gasLimit: string
  gasUsed: string
  miner: string
  difficulty: string
  totalDifficulty: string
  size: number
  transactions: string[]
  transactionsRoot: string
  stateRoot: string
  receiptsRoot: string
  nonce: string
  extraData: string
}

export interface TransactionReceipt {
  transactionHash: string
  blockNumber: number
  blockHash: string
  from: string
  to: string
  contractAddress?: string
  status: string
  cumulativeGasUsed: string
  gasUsed: string
  logs: Log[]
  logsBloom: string
  effectiveGasPrice: string
}

export interface Log {
  address: string
  topics: string[]
  data: string
  logIndex: number
  transactionIndex: number
  transactionHash: string
  blockHash: string
  blockNumber: number
}

// API Response Types
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  list: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

// Transaction List Item (from API - snake_case)
export interface TransactionListItem {
  id: string
  user_id: string
  wallet_id: string
  hash: string
  from_address: string
  to_address: string
  value: string
  gas_price: string
  gas_used: string
  nonce: number
  chain_id: number
  status: string
  block_number?: number
  block_hash?: string
  transaction_index?: number
  input_data?: string
  created_at: string
  updated_at: string
}

// Transaction UI Model (for frontend display - camelCase)
export interface TransactionUIItem {
  hash: string
  from: string
  to: string
  value: string
  token: string
  timestamp: number
  status: string
  type: 'send' | 'receive' | 'swap'
  chainId: number
  gasUsed?: string
  blockNumber?: number
}

// Gas Info from receipt
export interface GasInfo {
  gas_used: string
  gas_price: string
  effective_gas_price: string
  cumulative_gas_used: string
}
