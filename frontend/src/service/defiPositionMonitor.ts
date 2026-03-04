// ============================================
// Cross-chain DeFi Position Monitor API
// ============================================

import axios from '@/service/request'

// Types
export interface ChainInfo {
  id: number
  name: string
  symbol: string
  icon: string
}

export interface ProtocolInfo {
  id: string
  name: string
  category: string
  chains: number[]
  icon: string
}

export interface PositionToken {
  symbol: string
  name: string
  address: string
  balance: number
  value_usd: number
  is_collateral: boolean
  is_debt: boolean
}

export interface RewardInfo {
  symbol: string
  name: string
  amount: number
  value_usd: number
  claimable: boolean
}

export type PositionStatus = 'Active' | 'Closing' | 'Liquidated' | 'Unknown'

export interface DefiPosition {
  id: string
  wallet_address: string
  protocol_id: string
  protocol_name: string
  chain_id: number
  chain_name: string
  position_type: string
  tokens: PositionToken[]
  total_value_usd: number
  position_value: number
  debt_value?: number
  health_factor?: number
  apy?: number
  rewards: RewardInfo[]
  last_updated: string
  status: PositionStatus
}

export interface ChainDistribution {
  chain_id: number
  chain_name: string
  value_usd: number
  percentage: number
  positions_count: number
}

export interface ProtocolDistribution {
  protocol_id: string
  protocol_name: string
  value_usd: number
  percentage: number
  positions_count: number
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export interface PortfolioSummary {
  wallet_address: string
  total_value_usd: number
  total_debt_usd: number
  net_value_usd: number
  positions_count: number
  chains_count: number
  protocols_count: number
  total_apy: number
  positions: DefiPosition[]
  chain_distribution: ChainDistribution[]
  protocol_distribution: ProtocolDistribution[]
  risk_level: RiskLevel
}

export type AlertType = 'LowHealthFactor' | 'NearLiquidation' | 'PositionClosed' | 'RewardClaimable' | 'APYDrops'
export type AlertSeverity = 'Info' | 'Warning' | 'Critical'

export interface PositionAlert {
  id: string
  wallet_address: string
  position_id: string
  alert_type: AlertType
  message: string
  severity: AlertSeverity
  created_at: string
  acknowledged: boolean
}

// API Functions

/**
 * Get portfolio summary for a wallet address
 */
export async function getPortfolioSummary(walletAddress: string): Promise<PortfolioSummary> {
  const response = await axios.get(`/api/web3/defi/positions/${walletAddress}`)
  return response.data.data
}

/**
 * Get positions for a wallet with optional filters
 */
export async function getPositions(
  walletAddress: string,
  options?: {
    chainIds?: number[]
    protocolIds?: string[]
    positionTypes?: string[]
  }
): Promise<DefiPosition[]> {
  const params = new URLSearchParams()
  params.append('walletAddress', walletAddress)
  
  if (options?.chainIds) {
    params.append('chainIds', options.chainIds.join(','))
  }
  if (options?.protocolIds) {
    params.append('protocolIds', options.protocolIds.join(','))
  }
  if (options?.positionTypes) {
    params.append('positionTypes', options.positionTypes.join(','))
  }
  
  const response = await axios.get(`/api/web3/defi/positions?${params.toString()}`)
  return response.data.data
}

/**
 * Get position details by ID
 */
export async function getPositionDetails(positionId: string): Promise<DefiPosition> {
  const response = await axios.get(`/api/web3/defi/position/${positionId}`)
  return response.data.data
}

/**
 * Get alerts for a wallet
 */
export async function getAlerts(walletAddress: string): Promise<PositionAlert[]> {
  const response = await axios.get(`/api/web3/defi/alerts/${walletAddress}`)
  return response.data.data
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  const response = await axios.post(`/api/web3/defi/alerts/${alertId}/acknowledge`)
  return response.data.success
}

/**
 * Get supported chains
 */
export async function getSupportedChains(): Promise<ChainInfo[]> {
  const response = await axios.get('/api/web3/defi/chains')
  return response.data.data
}

/**
 * Get supported protocols
 */
export async function getSupportedProtocols(): Promise<ProtocolInfo[]> {
  const response = await axios.get('/api/web3/defi/protocols')
  return response.data.data
}

/**
 * Get portfolio health score
 */
export async function getPortfolioHealth(walletAddress: string): Promise<{
  score: number
  level: RiskLevel
  factors: {
    diversification: number
    health_factor: number
    debt_ratio: number
    rewards_availability: number
  }
}> {
  const response = await axios.get(`/api/web3/defi/health/${walletAddress}`)
  return response.data.data
}

/**
 * Calculate potential liquidation price
 */
export async function getLiquidationPrice(walletAddress: string, positionId: string): Promise<{
  current_price: number
  liquidation_price: number
  distance_percent: number
  margin_of_safety: number
}> {
  const response = await axios.get(`/api/web3/defi/liquidation/${walletAddress}/${positionId}`)
  return response.data.data
}
