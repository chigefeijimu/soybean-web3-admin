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
