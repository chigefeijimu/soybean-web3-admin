import { request } from '../request';

/** 代币信息 */
export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress: string;
  logo?: string;
}

/** 钱包持仓 */
export interface WalletPortfolio {
  address: string;
  chainId: number;
  ethBalance: string;
  tokens: TokenBalance[];
  totalUsdValue: string;
}

/** 代币余额 */
export interface TokenBalance {
  token: TokenInfo;
  balance: string;
  usdValue: string;
  price: string;
}

/**
 * 查询钱包持仓
 * @param address 钱包地址
 * @param chainId 链ID (默认1)
 */
export function fetchWalletPortfolio(address: string, chainId?: number) {
  return request<WalletPortfolio>({
    url: '/web3/portfolio',
    method: 'get',
    params: { address, chainId }
  });
}

/**
 * 获取支持的链列表
 */
export function fetchSupportedChains() {
  return request<{ id: number; name: string; symbol: string }[]>({
    url: '/web3/chains',
    method: 'get'
  });
}

/**
 * 直接调用合约 (通过后端API)
 */
export function callContractDirect(params: {
  contractAddress: string;
  abi: any[];
  method: string;
  args: any[];
  chainId?: number;
}) {
  return request({
    url: '/web3/contract/call',
    method: 'post',
    data: params
  });
}

/**
 * 获取交易列表
 */
export function getTransactionList(params: {
  address: string;
  chainId?: number;
  page?: number;
  limit?: number;
}) {
  return request({
    url: '/web3/transactions',
    method: 'get',
    params
  });
}

/**
 * 解析交易收据
 */
export function parseTransactionReceipt(txHash: string) {
  return request({
    url: `/web3/transaction/${txHash}/receipt`,
    method: 'get'
  });
}

/**
 * 获取代币余额
 */
export function getTokenBalances(address: string, chainId?: number) {
  return request({
    url: '/web3/tokens/balance',
    method: 'get',
    params: { address, chainId }
  });
}

/**
 * 获取代币价格
 */
export function getTokenPrices(tokens: string[]) {
  return request({
    url: '/web3/tokens/prices',
    method: 'get',
    params: { tokens: tokens.join(',') }
  });
}

/**
 * 获取K线数据
 */
export function getKLine(params: {
  symbol: string;
  interval?: string;
  limit?: number;
}) {
  return request({
    url: '/web3/market/kline',
    method: 'get',
    params
  });
}

/**
 * 获取价格
 */
export function getPrice(symbol: string) {
  return request({
    url: '/web3/market/price',
    method: 'get',
    params: { symbol }
  });
}

/**
 * 获取技术指标
 */
export function getIndicators(params: {
  symbol: string;
  interval?: string;
}) {
  return request({
    url: '/web3/market/indicators',
    method: 'get',
    params
  });
}

/**
 * 获取NFT详情
 */
export function getNFTDetails(contractAddress: string, tokenId: string) {
  return request({
    url: '/web3/nft/details',
    method: 'get',
    params: { contractAddress, tokenId }
  });
}

/**
 * 获取实时价格
 */
export function getRealPrice(symbols: string[]) {
  return request({
    url: '/web3/market/realtime',
    method: 'get',
    params: { symbols: symbols.join(',') }
  });
}

/**
 * 搜索币种
 */
export function searchCoins(query: string) {
  return request({
    url: '/web3/market/search',
    method: 'get',
    params: { q: query }
  });
}

/**
 * 获取热门币种
 */
export function getTopCoins() {
  return request({
    url: '/web3/market/top',
    method: 'get'
  });
}

/**
 * 获取区块信息
 */
export function getBlock(blockNumber: number, chainId?: number) {
  return request({
    url: '/web3/block',
    method: 'get',
    params: { blockNumber, chainId }
  });
}

/**
 * 获取最新区块
 */
export function getLatestBlock(chainId?: number) {
  return request({
    url: '/web3/block/latest',
    method: 'get',
    params: { chainId }
  });
}

/**
 * 获取交易收据
 */
export function getTransactionReceipt(txHash: string, chainId?: number) {
  return request({
    url: '/web3/transaction/receipt',
    method: 'get',
    params: { txHash, chainId }
  });
}

/**
 * 扫描区块
 */
export function scanBlocks(params: {
  fromBlock: number;
  toBlock: number;
  chainId?: number;
}) {
  return request({
    url: '/web3/blocks/scan',
    method: 'get',
    params
  });
}

// ==================== 价格提醒 API ====================

/** 价格提醒 */
export interface PriceAlert {
  id: string;
  token: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  userId?: string;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
}

/**
 * 创建价格提醒
 */
export function createPriceAlert(params: {
  token: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  userId?: string;
}) {
  return request<PriceAlert>({
    url: '/web3/price-alerts',
    method: 'post',
    data: params
  });
}

/**
 * 获取价格提醒列表
 */
export function fetchPriceAlerts(userId?: string) {
  return request<PriceAlert[]>({
    url: '/web3/price-alerts',
    method: 'get',
    params: { userId }
  });
}

/**
 * 删除价格提醒
 */
export function deletePriceAlert(id: string) {
  return request<{ success: boolean }>({
    url: `/web3/price-alerts/${id}`,
    method: 'delete'
  });
}

/**
 * 检查代币价格是否触发提醒
 */
export function checkPriceAlerts(token: string) {
  return request<{
    currentPrice: number;
    triggeredAlerts: PriceAlert[];
  }>({
    url: `/web3/price-alerts/check/${token}`,
    method: 'get'
  });
}

// ==================== Gas Price API ====================

/** Gas价格 */
export interface GasPrice {
  chain: string;
  chainId: number;
  slow: number;
  normal: number;
  fast: number;
  unit: string;
  lastUpdated: string;
}

/** Gas历史记录 */
export interface GasHistory {
  timestamp: string;
  slow: number;
  normal: number;
  fast: number;
}

/** 费用估算 */
export interface FeeEstimate {
  chainId: number;
  gasLimit: number;
  slow: string;
  normal: string;
  fast: string;
  currency: string;
}

/**
 * 获取所有链的Gas价格
 */
export function fetchGasPrices() {
  return request<GasPrice[]>({
    url: '/web3/gas/prices',
    method: 'get'
  });
}

/**
 * 获取指定链的Gas价格
 */
export function fetchGasPrice(chainId: number) {
  return request<GasPrice>({
    url: '/web3/gas/prices',
    method: 'get',
    params: { chainId }
  });
}

/**
 * 获取Gas价格历史
 */
export function fetchGasHistory(chainId: number, hours?: number) {
  return request<GasHistory[]>({
    url: '/web3/gas/history',
    method: 'get',
    params: { chainId, hours }
  });
}

/**
 * 估算交易Gas费用
 */
export function estimateGasFee(chainId: number, gasLimit: number) {
  return request<FeeEstimate>({
    url: '/web3/gas/estimate',
    method: 'get',
    params: { chainId, gasLimit }
  });
}

// ==================== Token Launch Calendar API ====================

/** 代币发售 */
export interface TokenLaunch {
  id: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  platform: string;
  type: 'IDO' | 'IEO' | 'ICO' | 'Airdrop' | 'Fair Launch';
  chain: string;
  chainId: number;
  startTime: string;
  endTime: string;
  price: number;
  targetRaise: number;
  raisedAmount: number;
  participants: number;
  links: {
    website?: string;
    twitter?: string;
    telegram?: string;
    whitepaper?: string;
  };
  status: 'upcoming' | 'active' | 'ended';
  tier?: string;
  requirements?: string[];
}

/** 空投信息 */
export interface Airdrop {
  id: string;
  name: string;
  symbol: string;
  logoUrl: string;
  description: string;
  snapshotDate?: string;
  claimDate?: string;
  distributionMethod: string;
  requirements: string[];
  chain: string;
  status: 'announced' | 'snapshot' | 'claimable' | 'ended';
  links: {
    website?: string;
    twitter?: string;
    telegram?: string;
  };
  estimatedValue?: number;
}

/** 发射平台 */
export interface LaunchPlatform {
  id: string;
  name: string;
  chain: string;
}

/** 日历项 */
export interface CalendarItem {
  id: string;
  name: string;
  symbol: string;
  type: string;
  platform: string;
  startTime: string;
  endTime: string;
  chain: string;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 获取即将到来的代币发售列表
 */
export function fetchUpcomingLaunches(params?: {
  page?: number;
  limit?: number;
  platform?: string;
}) {
  return request<PaginatedResponse<TokenLaunch>>({
    url: '/web3/launch/upcoming',
    method: 'get',
    params
  });
}

/**
 * 获取空投列表
 */
export function fetchAirdrops(params?: {
  page?: number;
  limit?: number;
}) {
  return request<PaginatedResponse<Airdrop>>({
    url: '/web3/launch/airdrops',
    method: 'get',
    params
  });
}

/**
 * 获取代币发售详情
 */
export function fetchLaunchDetail(id: string) {
  return request<TokenLaunch | Airdrop>({
    url: '/web3/launch/detail',
    method: 'get',
    params: { id }
  });
}

/**
 * 获取支持的发射平台
 */
export function fetchLaunchPlatforms() {
  return request<LaunchPlatform[]>({
    url: '/web3/launch/platforms',
    method: 'get'
  });
}

/**
 * 获取代币发售日历
 */
export function fetchLaunchCalendar(month: number, year: number) {
  return request<CalendarItem[]>({
    url: '/web3/launch/calendar',
    method: 'get',
    params: { month, year }
  });
}

/**
 * 获取热门即将发售代币
 */
export function fetchTrendingLaunches() {
  return request<TokenLaunch[]>({
    url: '/web3/launch/trending',
    method: 'get'
  });
}

/**
 * 获取用户追踪的发售
 */
export function fetchTrackedLaunches(address: string) {
  return request<TokenLaunch[]>({
    url: '/web3/launch/my-tracked',
    method: 'get',
    params: { address }
  });
}

/**
 * 追踪代币发售
 */
export function trackLaunch(address: string, launchId: string) {
  return request<{ success: boolean; tracked: number }>({
    url: '/web3/launch/track',
    method: 'get',
    params: { address, launchId }
  });
}

/**
 * 取消追踪代币发售
 */
export function untrackLaunch(address: string, launchId: string) {
  return request<{ success: boolean; tracked: number }>({
    url: '/web3/launch/untrack',
    method: 'get',
    params: { address, launchId }
  });
}

// ==================== ENS Domain Service API ====================

/** ENS解析结果 */
export interface EnsResolveResult {
  name: string;
  address: string | null;
  resolved: boolean;
  chainId?: number;
  error?: string;
}

/** ENS反向解析结果 */
export interface EnsReverseResult {
  address: string;
  name: string | null;
  reverseResolved: boolean;
  error?: string;
}

/** ENS域名详情 */
export interface EnsDetails {
  name: string;
  owner: string | null;
  resolvedAddress: string | null;
  avatar: string | null;
  expiryDate: string | null;
  registrationDate: string | null;
  isExpired: boolean | null;
  is2LD: boolean;
  error?: string;
}

/** ENS头像 */
export interface EnsAvatar {
  name: string;
  avatar: string | null;
}

/** ENS记录 */
export interface EnsRecords {
  name: string;
  records: any;
  error?: string;
}

/** ENS历史事件 */
export interface EnsHistory {
  name: string;
  events: any[];
  error?: string;
}

/** ENS搜索结果 */
export interface EnsSearchResult {
  query: string;
  totalSupply?: number;
  floorPrice?: number;
  description?: string;
  imageUrl?: string;
  results?: any[];
  error?: string;
}

/** 批量解析结果 */
export interface EnsBatchResult {
  total: number;
  resolved: number;
  results: EnsResolveResult[];
}

/**
 * ENS正向解析 - 域名解析为地址
 * @param name ENS域名 (如 vitalik.eth)
 * @param chainId 链ID (默认1)
 */
export function resolveEnsName(name: string, chainId?: number) {
  return request<EnsResolveResult>({
    url: '/web3/ens/resolve',
    method: 'get',
    params: { name, chainId }
  });
}

/**
 * ENS反向解析 - 地址解析为域名
 * @param address ETH地址
 */
export function reverseResolveEns(address: string) {
  return request<EnsReverseResult>({
    url: '/web3/ens/reverse',
    method: 'get',
    params: { address }
  });
}

/**
 * 获取ENS域名详细信息
 * @param name ENS域名
 */
export function getEnsDetails(name: string) {
  return request<EnsDetails>({
    url: '/web3/ens/details',
    method: 'get',
    params: { name }
  });
}

/**
 * 批量查询ENS域名
 * @param names 逗号分隔的域名列表
 */
export function batchResolveEns(names: string) {
  return request<EnsBatchResult>({
    url: '/web3/ens/batch',
    method: 'get',
    params: { names }
  });
}

/**
 * 获取ENS域名头像URL
 * @param name ENS域名
 */
export function getEnsAvatar(name: string) {
  return request<EnsAvatar>({
    url: '/web3/ens/avatar',
    method: 'get',
    params: { name }
  });
}

/**
 * 获取ENS域名所有记录
 * @param name ENS域名
 */
export function getEnsRecords(name: string) {
  return request<EnsRecords>({
    url: '/web3/ens/records',
    method: 'get',
    params: { name }
  });
}

/**
 * 获取ENS域名交易历史
 * @param name ENS域名
 */
export function getEnsHistory(name: string) {
  return request<EnsHistory>({
    url: '/web3/ens/history',
    method: 'get',
    params: { name }
  });
}

/**
 * 搜索ENS域名
 * @param query 搜索关键词
 * @param limit 返回数量限制
 */
export function searchEnsDomains(query: string, limit?: number) {
  return request<EnsSearchResult>({
    url: '/web3/ens/search',
    method: 'get',
    params: { query, limit }
  });
}

/**
 * 获取热门ENS域名
 * @param limit 返回数量限制
 */
export function getPopularEnsDomains(limit?: number) {
  return request<{
    total: number;
    results: EnsDetails[];
  }>({
    url: '/web3/ens/popular',
    method: 'get',
    params: { limit }
  });
}

// ==================== Portfolio Comparator API ====================

export interface ComparatorToken {
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: string;
  price: number;
  value: number;
  change24h: number;
}

export interface ComparatorPortfolio {
  address: string;
  totalValue: number;
  tokens: ComparatorToken[];
  ethBalance: string;
}

export interface ComparatorResult {
  portfolioA: ComparatorPortfolio;
  portfolioB: ComparatorPortfolio;
  comparison: {
    totalValueDiff: number;
    totalValueDiffPercent: number;
    commonTokens: ComparatorToken[];
    uniqueToA: ComparatorToken[];
    uniqueToB: ComparatorToken[];
    overlappingValue: number;
    divergenceScore: number;
  };
  ranking: { address: string; totalValue: number; rank: number }[];
}

export function comparePortfolios(addressA: string, addressB: string, chainId?: number) {
  return request<ComparatorResult>({
    url: '/web3/portfolio-comparator/compare',
    method: 'get',
    params: { addressA, addressB, chainId }
  });
}

export function rankPortfolios(addresses: string[], chainId?: number) {
  return request<{
    rankings: { address: string; totalValue: number; rank: number }[];
  }>({
    url: '/web3/portfolio-comparator/rank',
    method: 'get',
    params: { addresses: addresses.join(','), chainId }
  });
}

// ==================== DeFi Protocol Explorer API ====================

/** DeFi Protocol Info */
export interface DefiProtocol {
  id: string;
  name: string;
  logo: string;
  description: string;
  supportedActions: string[];
  chains: number[];
  contractAddress: string;
}

/** Get supported DeFi protocols */
export function getDefiProtocols() {
  return request<{ data: DefiProtocol[] }>({
    url: '/web3/defi/protocols',
    method: 'get'
  });
}

/** Get Uniswap V3 positions */
export function getUniswapPositions(address: string, chainId?: number) {
  return request<{ data: any[] }>({
    url: `/web3/defi/uniswap/positions/${address}`,
    method: 'get',
    params: { chainId }
  });
}

/** Get Aave supply positions */
export function getAaveSupply(address: string, chainId?: number) {
  return request<{ data: any[] }>({
    url: `/web3/defi/aave/supply/${address}`,
    method: 'get',
    params: { chainId }
  });
}

/** Get Compound positions */
export function getCompoundPositions(address: string, chainId?: number) {
  return request<{ data: any[] }>({
    url: `/web3/defi/compound/positions/${address}`,
    method: 'get',
    params: { chainId }
  });
}

/** Get Curve pools */
export function getCurvePools(chainId?: number) {
  return request<{ data: any[] }>({
    url: '/web3/defi/curve/pools',
    method: 'get',
    params: { chainId }
  });
}

/** Get protocol APR */
export function getProtocolApr(protocol: string, chainId?: number) {
  return request<{ data: Record<string, string> }>({
    url: `/web3/defi/apr/${protocol}`,
    method: 'get',
    params: { chainId }
  });
}

/** Get DeFi stats */
export function getDefiStats() {
  return request<{ data: any }>({
    url: '/web3/defi/stats',
    method: 'get'
  });
}

// ==================== Blockchain Heatmap API ====================

/** 区块链热力图网络数据 */
export interface NetworkHeatmapData {
  chainId: number;
  name: string;
  symbol: string;
  color: string;
  activity: number;
  txCount: number;
  activeAddresses: number;
  gasPrice: number;
  gasPriceGwei: number;
  tvl: number;
  tvlChange24h: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  congestion: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: number;
}

/** 热力图历史数据 */
export interface HeatmapHistory {
  timestamp: number;
  data: {
    chainId: number;
    activity: number;
    txCount: number;
    gasPrice: number;
  }[];
}

/** 获取所有链的热力图数据 */
export function getNetworksHeatmap() {
  return request<NetworkHeatmapData[]>({
    url: '/blockchain-heatmap/networks',
    method: 'get'
  });
}

/** 获取指定链的详细信息 */
export function getNetworkDetails(chainId: number) {
  return request<NetworkHeatmapData | null>({
    url: `/blockchain-heatmap/network`,
    method: 'get',
    params: { chainId }
  });
}

/** 获取热力图历史数据 */
export function getHeatmapHistory(chainId?: number, period: string = '24h') {
  return request<HeatmapHistory[]>({
    url: '/blockchain-heatmap/history',
    method: 'get',
    params: { chainId, period }
  });
}

/** 获取跨链Gas价格 */
export function getGasPricesAcrossChains() {
  return request<{
    chainId: number;
    name: string;
    symbol: string;
    gasPriceGwei: number;
    congestion: string;
  }[]>({
    url: '/blockchain-heatmap/gas-prices',
    method: 'get'
  });
}

// ============ Whale Tracker API ============

export interface WhaleTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  fromLabel: string;
  to: string;
  toLabel: string;
  value: number;
  valueUsd: number;
  tokenSymbol: string;
  tokenAddress?: string;
  tokenDecimals: number;
  gasUsed: number;
  gasPrice: number;
  isLargeTransfer: boolean;
  isWhaleActivity: boolean;
}

export interface WhaleProfile {
  address: string;
  label: string;
  type: 'exchange' | 'whale' | 'defi' | 'dao' | 'contract' | 'unknown';
  totalReceived: number;
  totalReceivedUsd: number;
  totalSent: number;
  totalSentUsd: number;
  transactionCount: number;
  firstSeen: number;
  lastActive: number;
  avgTransactionSize: number;
  tokensHeld: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface WhaleAlert {
  id: string;
  type: 'large_transfer' | 'whale_movement' | 'exchange_flow' | 'defi_activity';
  transaction: WhaleTransaction;
  amount: number;
  amountUsd: number;
  timestamp: number;
  chain: string;
  read: boolean;
}

export interface WhaleStats {
  totalWhaleTransactions24h: number;
  totalVolume24h: number;
  avgTransactionSize: number;
  topNetworks: { chain: string; count: number; volume: number }[];
  topTokens: { symbol: string; count: number; volume: number }[];
  largestTransaction: WhaleTransaction | null;
  recentAlerts: WhaleAlert[];
}

/** 获取鲸鱼交易列表 */
export function getWhaleTransactions(limit?: number, address?: string) {
  return request<WhaleTransaction[]>({
    url: '/whale-tracker/transactions',
    method: 'get',
    params: { limit, address }
  });
}

/** 获取鲸鱼统计 */
export function getWhaleStats() {
  return request<WhaleStats>({
    url: '/whale-tracker/stats',
    method: 'get'
  });
}

/** 获取鲸鱼档案 */
export function getWhaleProfiles() {
  return request<WhaleProfile[]>({
    url: '/whale-tracker/profiles',
    method: 'get'
  });
}

/** 获取鲸鱼告警 */
export function getWhaleAlerts(limit?: number) {
  return request<WhaleAlert[]>({
    url: '/whale-tracker/alerts',
    method: 'get',
    params: { limit }
  });
}

/** 搜索鲸鱼 */
export function searchWhales(query: string) {
  return request<WhaleTransaction[]>({
    url: '/whale-tracker/search',
    method: 'get',
    params: { q: query }
  });
}

/** 获取网络鲸鱼活动 */
export function getNetworkWhaleActivity(chainId?: number) {
  return request<{ time: string; volume: number; count: number }[]>({
    url: '/whale-tracker/network-activity',
    method: 'get',
    params: { chainId }
  });
}

/** 获取Top鲸鱼 */
export function getTopWhales(limit?: number) {
  return request<{ address: string; label: string; volume24h: number; txCount: number }[]>({
    url: '/whale-tracker/top-whales',
    method: 'get',
    params: { limit }
  });
}

/** 获取地址信息 */
export function getAddressInfo(address: string) {
  return request<{
    address: string;
    label: string;
    type: string;
    isKnown: boolean;
    transactionCount: number;
    recentTransactions: WhaleTransaction[];
  }>({
    url: `/whale-tracker/address/${address}`,
    method: 'get'
  });
}

// ==================== Smart Money Flow API ====================

export interface ProtocolFlow {
  name: string;
  address: string;
  chain: string;
  inflow24h: number;
  outflow24h: number;
  netFlow: number;
  tvl: number;
  change24h: string;
}

export interface SmartMoneyTransaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  token: string;
  timestamp: string;
  type: 'IN' | 'OUT';
  protocol: string;
}

export interface FlowSummary {
  chain: string;
  period: string;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  flowRatio: string;
  topProtocols: { name: string; netFlow: number; txCount: number }[];
  whaleActivity: {
    activeWhales: number;
    totalVolume: number;
    avgTransactionSize: number;
  };
}

export interface FlowAlert {
  id: string;
  type: string;
  address: string;
  token: string;
  value: number;
  protocol: string;
  timestamp: string;
  risk: 'HIGH' | 'NORMAL';
}

export interface FlowHistory {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  txCount: number;
}

export interface TokenFlow {
  symbol: string;
  inflow24h: number;
  outflow24h: number;
  netFlow: number;
  holders: number;
  volume24h: number;
}

export interface AddressFlow {
  address: string;
  isWhale: boolean;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  txCount: number;
  lastActivity: string;
  protocols: { name: string; txCount: number; volume: number }[];
}

/** 获取协议资金流 */
export function getProtocolFlows(chain?: string) {
  return request<{
    success: boolean;
    timestamp: string;
    chain: string;
    protocols: ProtocolFlow[];
  }>({
    url: '/smart-money/protocols',
    method: 'get',
    params: { chain }
  });
}

/** 获取鲸鱼/聪明钱交易 */
export function getSmartMoneyTransactions(address?: string, limit?: number) {
  return request<{
    success: boolean;
    timestamp: string;
    transactions: SmartMoneyTransaction[];
  }>({
    url: '/smart-money/transactions',
    method: 'get',
    params: { address, limit }
  });
}

/** 获取资金流汇总 */
export function getFlowSummary(chain?: string, period?: string) {
  return request<{
    success: boolean;
    timestamp: string;
  } & FlowSummary>({
    url: '/smart-money/summary',
    method: 'get',
    params: { chain, period }
  });
}

/** 获取资金流告警 */
export function getFlowAlerts(limit?: number) {
  return request<{
    success: boolean;
    timestamp: string;
    alerts: FlowAlert[];
  }>({
    url: '/smart-money/alerts',
    method: 'get',
    params: { limit }
  });
}

/** 获取历史资金流数据 */
export function getHistoricalFlow(chain?: string, days?: number) {
  return request<{
    success: boolean;
    timestamp: string;
    chain: string;
    days: number;
    data: FlowHistory[];
  }>({
    url: '/smart-money/history',
    method: 'get',
    params: { chain, days }
  });
}

/** 获取代币资金流 */
export function getTokenFlows(token?: string, chain?: string) {
  return request<{
    success: boolean;
    timestamp: string;
    chain: string;
    tokens: TokenFlow[];
  }>({
    url: '/smart-money/tokens',
    method: 'get',
    params: { token, chain }
  });
}

/** 追踪特定地址 */
export function trackAddressFlow(address: string) {
  return request<{
    success: boolean;
    timestamp: string;
  } & AddressFlow>({
    url: '/smart-money/track',
    method: 'post',
    data: { address }
  });
}

// ==================== Voting Tracker API ====================

/** 提案 */
export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  proposer: string;
  network: string;
  contractAddress: string;
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  totalVotes: string;
  quorum: string;
  startBlock: number;
  endBlock: number;
  startTime: number;
  endTime: number;
  createdAt: number;
}

/** 投票 */
export interface Vote {
  id: string;
  proposalId: string;
  voter: string;
  support: 'for' | 'against' | 'abstain';
  weight: string;
  reason?: string;
  timestamp: number;
  txHash: string;
}

/** 委托信息 */
export interface DelegateInfo {
  address: string;
  delegatedVotes: string;
  tokenBalance: string;
  numberOfDelegators: number;
  votingPower: string;
}

/** DAO信息 */
export interface DaoInfo {
  name: string;
  symbol: string;
  network: string;
  contractAddress: string;
  activeProposals: number;
  totalProposals: number;
  totalVotes: string;
  logo: string;
}

/** 投票统计 */
export interface VotingStats {
  totalProposals: number;
  activeProposals: number;
  passedProposals: number;
  rejectedProposals: number;
  totalVotes: string;
  averageParticipation: string;
}

/** 投票历史（含提案信息） */
export interface VotingHistory {
  id: string;
  proposalId: string;
  voter: string;
  support: 'for' | 'against' | 'abstain';
  weight: string;
  reason?: string;
  timestamp: number;
  txHash: string;
  proposalTitle: string;
  proposalStatus: string;
}

/**
 * 获取提案列表
 */
export function getProposals(params?: {
  network?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return request<{
    proposals: Proposal[];
    total: number;
    offset: number;
    limit: number;
  }>({
    url: '/web3/voting/proposals',
    method: 'get',
    params
  });
}

/**
 * 获取单个提案详情
 */
export function getProposal(id: string) {
  return request<Proposal>({
    url: `/web3/voting/proposals/${id}`,
    method: 'get'
  });
}

/**
 * 获取提案的投票列表
 */
export function getProposalVotes(id: string, support?: string) {
  return request<Vote[]>({
    url: `/web3/voting/proposals/${id}/votes`,
    method: 'get',
    params: { support }
  });
}

/**
 * 获取地址的投票历史
 */
export function getVotingHistory(address: string) {
  return request<VotingHistory[]>({
    url: `/web3/voting/votes/${address}`,
    method: 'get'
  });
}

/**
 * 获取委托信息
 */
export function getDelegateInfo(address: string) {
  return request<DelegateInfo>({
    url: `/web3/voting/delegate/${address}`,
    method: 'get'
  });
}

/**
 * 获取DAO列表
 */
export function getDaos() {
  return request<DaoInfo[]>({
    url: '/web3/voting/daos',
    method: 'get'
  });
}

/**
 * 获取投票统计
 */
export function getVotingStats() {
  return request<VotingStats>({
    url: '/web3/voting/stats',
    method: 'get'
  });
}

// ==================== Airdrop Tracker API ====================

/** 空投项目 */
export interface AirdropProject {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  contractAddress: string;
  claimUrl: string;
  snapshotDate: string;
  expiryDate: string;
  description: string;
  logoUrl: string;
  status: 'active' | 'expired' | 'upcoming';
}

/** 空投认领状态 */
export interface AirdropClaim {
  address: string;
  projectId: string;
  projectName: string;
  symbol: string;
  chain: string;
  amount: string;
  claimable: boolean;
  claimed: boolean;
  expiryDate: string;
  transactionHash?: string;
}

/** 钱包空投状态 */
export interface WalletAirdropStatus {
  address: string;
  totalAirdrops: number;
  claimable: number;
  claimed: number;
  airdrops: AirdropClaim[];
}

/** 空投统计 */
export interface AirdropStats {
  totalProjects: number;
  activeProjects: number;
  expiredProjects: number;
  upcomingProjects: number;
  chains: string[];
}

/**
 * 获取所有空投项目
 */
export function getAirdropProjects() {
  return request<AirdropProject[]>({
    url: '/airdrop-tracker/projects',
    method: 'get'
  });
}

/**
 * 获取活跃空投项目
 */
export function getActiveAirdrops() {
  return request<AirdropProject[]>({
    url: '/airdrop-tracker/projects/active',
    method: 'get'
  });
}

/**
 * 获取空投项目详情
 */
export function getAirdropProjectDetails(id: string) {
  return request<AirdropProject>({
    url: `/airdrop-tracker/projects/${id}`,
    method: 'get'
  });
}

/**
 * 按链获取空投
 */
export function getAirdropsByChain(chain: string) {
  return request<AirdropProject[]>({
    url: `/airdrop-tracker/projects/chain/${chain}`,
    method: 'get'
  });
}

/**
 * 获取即将到来的空投
 */
export function getUpcomingAirdrops() {
  return request<AirdropProject[]>({
    url: '/airdrop-tracker/upcoming',
    method: 'get'
  });
}

/**
 * 检查钱包空投状态
 */
export function checkWalletAirdrops(address: string) {
  return request<WalletAirdropStatus>({
    url: `/airdrop-tracker/check/${address}`,
    method: 'get'
  });
}

/**
 * 获取空投统计数据
 */
export function getAirdropStats() {
  return request<AirdropStats>({
    url: '/airdrop-tracker/stats',
    method: 'get'
  });
}

// ==================== Fear & Greed Index API ====================

/** 恐惧贪婪指数 */
export interface FearGreedIndex {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

/** 恐惧贪婪历史数据 */
export interface FearGreedHistoryItem {
  value: string;
  value_classification: string;
  timestamp: string;
}

/** 恐惧贪婪历史 */
export interface FearGreedHistory {
  data: FearGreedHistoryItem[];
}

/**
 * 获取当前恐惧贪婪指数
 */
export function getCurrentFearGreedIndex() {
  return request<FearGreedIndex>({
    url: '/web3/fear-greed',
    method: 'get'
  });
}

/**
 * 获取恐惧贪婪指数历史
 * @param limit 返回数量 (默认30，最大90)
 */
export function getFearGreedHistory(limit?: number) {
  return request<FearGreedHistory>({
    url: '/web3/fear-greed/history',
    method: 'get',
    params: limit ? { limit } : {}
  });
}

/**
 * 获取指定日期范围的恐惧贪婪指数
 * @param start 开始日期 (Unix timestamp)
 * @param end 结束日期 (Unix timestamp)
 */
export function getFearGreedByDateRange(start: number, end: number) {
  return request<FearGreedHistory>({
    url: '/web3/fear-greed/range',
    method: 'get',
    params: { start, end }
  });
}

// ==================== Stablecoin Yield API ====================

/** 协议收益 */
export interface ProtocolYield {
  protocol: string;
  logo: string;
  token: string;
  apy: number;
  tvl: number;
  chain: string;
}

/** 稳定币数据 */
export interface StablecoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

/** 收益对比 */
export interface YieldComparison {
  stablecoin: StablecoinData;
  yields: ProtocolYield[];
  bestYield: ProtocolYield | null;
  averageApy: number;
}

/** 收益计算结果 */
export interface EarningsResult {
  earnings: number;
  finalAmount: number;
  apy: number;
}

/**
 * 获取综合收益对比
 */
export function getYieldComparison() {
  return request<YieldComparison[]>({
    url: '/web3/stablecoin-yield/comparison',
    method: 'get'
  });
}

/**
 * 获取特定代币的收益
 */
export function getYieldsByToken(symbol: string) {
  return request<ProtocolYield[]>({
    url: `/web3/stablecoin-yield/token/${symbol}`,
    method: 'get'
  });
}

/**
 * 获取特定链的收益
 */
export function getYieldsByChain(chain: string) {
  return request<ProtocolYield[]>({
    url: `/web3/stablecoin-yield/chain/${chain}`,
    method: 'get'
  });
}

/**
 * 获取最高收益排行
 */
export function getTopYields(limit?: number) {
  return request<ProtocolYield[]>({
    url: '/web3/stablecoin-yield/top',
    method: 'get',
    params: limit ? { limit } : {}
  });
}

/**
 * 获取特定协议的收益
 */
export function getProtocolYields(protocol: string) {
  return request<ProtocolYield[]>({
    url: `/web3/stablecoin-yield/protocol/${protocol}`,
    method: 'get'
  });
}

/**
 * 获取支持的链列表
 */
export function getSupportedYieldChains() {
  return request<string[]>({
    url: '/web3/stablecoin-yield/chains',
    method: 'get'
  });
}

/**
 * 获取支持的协议列表
 */
export function getSupportedProtocols() {
  return request<string[]>({
    url: '/web3/stablecoin-yield/protocols',
    method: 'get'
  });
}

/**
 * 计算潜在收益
 */
export function calculateEarnings(principal: number, token: string, days?: number) {
  return request<EarningsResult>({
    url: '/web3/stablecoin-yield/earnings',
    method: 'get',
    params: { principal, token, days }
  });
}

// ========== Portfolio Rebalancer ==========

export interface RebalanceToken {
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: string;
  price: number;
  value: number;
  change24h: number;
}

export interface TargetAllocation {
  symbol: string;
  percentage: number;
}

export interface RebalanceTrade {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  estimatedValue: number;
  gasEstimate: number;
  reason: string;
}

export interface RebalancePlan {
  currentAllocation: { symbol: string; value: number; percentage: number }[];
  targetAllocation: TargetAllocation[];
  trades: RebalanceTrade[];
  totalValue: number;
  estimatedGasCost: number;
  rebalanceRatio: number;
}

export interface PresetStrategy {
  name: string;
  description: string;
  allocation: TargetAllocation[];
}

/**
 * 获取钱包当前投资组合
 */
export function getPortfolioRebalancerPortfolio(address: string, chainId?: number) {
  return request<{ tokens: RebalanceToken[]; totalValue: number }>({
    url: '/portfolio-rebalancer/portfolio',
    method: 'get',
    params: { address, chainId }
  });
}

/**
 * 生成再平衡计划
 */
export function generateRebalancePlan(
  address: string,
  targetAllocation: TargetAllocation[],
  chainId?: number,
  slippageTolerance?: number
) {
  return request<RebalancePlan>({
    url: '/portfolio-rebalancer/plan',
    method: 'post',
    data: { address, targetAllocation, chainId, slippageTolerance }
  });
}

/**
 * 获取预设策略
 */
export function getRebalanceStrategies() {
  return request<PresetStrategy[]>({
    url: '/portfolio-rebalancer/strategies',
    method: 'get'
  });
}

// ==================== Options Tracker ====================

export interface OptionsOverview {
  timestamp: string;
  totalOpenInterest: number;
  totalVolume24h: number;
  averageIv: number;
  averagePutCallRatio: number;
  assets: OptionsAsset[];
  marketSentiment: string;
}

export interface OptionsAsset {
  asset: string;
  symbol: string;
  totalOi: number;
  totalOiFormatted: string;
  callOi: number;
  putOi: number;
  putCallRatio: number;
  volume24h: number;
  volumeFormatted: string;
  volumeChange: number;
  iv: number;
  ivChange: number;
  nextExpiry: string;
  maxPain: number;
}

export function getOptionsOverview() {
  return request<OptionsOverview>({
    url: '/options-tracker/overview',
    method: 'get'
  });
}

export function getOpenInterest(asset: string, timeframe: string = '7d') {
  return request({
    url: '/options-tracker/oi',
    method: 'get',
    params: { asset, timeframe }
  });
}

export function getPutCallRatio(asset: string, expiry?: string) {
  return request({
    url: '/options-tracker/put-call-ratio',
    method: 'get',
    params: { asset, expiry }
  });
}

export function getImpliedVolatility(asset: string, strike?: string) {
  return request({
    url: '/options-tracker/iv',
    method: 'get',
    params: { asset, strike }
  });
}

// ============ Oracle Price Comparison API ============

export interface OraclePrice {
  source: string;
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number | null;
  change24h: number | null;
}

export interface PriceComparison {
  symbol: string;
  prices: OraclePrice[];
  averagePrice: number;
  priceDiffPercent: number;
  highestPrice: OraclePrice;
  lowestPrice: OraclePrice;
  arbitrageOpportunity: boolean;
}

export interface OracleStatus {
  source: string;
  status: string;
  latencyMs: number;
  lastUpdate: number;
}

export interface SupportedToken {
  symbol: string;
  name: string;
  chainlink: boolean;
  binance: boolean;
  coingecko: boolean;
  uniswap: boolean;
}

/**
 * Compare prices from multiple oracles for a symbol
 */
export function getPriceComparison(symbol: string) {
  return request<PriceComparison>({
    url: `/web3/oracle/compare/${symbol}`,
    method: 'get'
  });
}

/**
 * Compare prices for multiple symbols
 */
export function getMultiPriceComparison(symbols: string[]) {
  return request<PriceComparison[]>({
    url: '/web3/oracle/multi',
    method: 'post',
    data: { symbols }
  });
}

/**
 * Get oracle status
 */
export function getOracleStatus() {
  return request<OracleStatus[]>({
    url: '/web3/oracle/status',
    method: 'get'
  });
}

/**
 * Get supported tokens for oracle comparison
 */
export function getSupportedOracleTokens() {
  return request<SupportedToken[]>({
    url: '/web3/oracle/supported',
    method: 'get'
  });
}

// ==================== NFT Collection Tracker API ====================

export interface NftCollection {
  name: string;
  symbol: string;
  contractAddress: string;
  chain: string;
  floorPrice: number;
  floorPriceChange24h: number;
  totalVolume: number;
  volume24h: number;
  sales24h: number;
  holders: number;
  totalSupply: number;
  marketCap: number;
  imageUrl: string;
}

export interface NftCollectionDetails extends NftCollection {
  description: string;
  traits: { trait_type: string; value: string; count: number; percentage: number }[];
  owners: { address: string; tokens: number; percentage: number }[];
  priceHistory: { timestamp: number; price: number }[];
  volumeHistory: { timestamp: number; volume: number }[];
}

export interface NftListing {
  tokenId: string;
  price: number;
  seller: string;
  expiresAt: number;
}

export interface NftSale {
  tokenId: string;
  price: number;
  buyer: string;
  seller: string;
  timestamp: number;
  txHash: string;
}

export interface NftHolder {
  rank: number;
  address: string;
  tokens: number;
  percentage: string;
  lastActivity: number;
}

export interface WhaleActivity {
  type: 'buy' | 'sell' | 'transfer';
  address: string;
  tokens: number;
  totalValue: number;
  time: string;
}

/**
 * Get popular NFT collections
 */
export function fetchNftCollections(params?: {
  chain?: string;
  sortBy?: 'volume' | 'floorPrice' | 'volume24h' | 'sales24h' | 'holders' | 'change24h';
  limit?: number;
}) {
  return request<{ success: boolean; data: NftCollection[]; total: number }>({
    url: '/web3/nft-collection/collections',
    method: 'get',
    params
  });
}

/**
 * Get collection details
 */
export function fetchNftCollectionDetails(address: string) {
  return request<{ success: boolean; data: NftCollectionDetails }>({
    url: `/web3/nft-collection/collection/${address}`,
    method: 'get'
  });
}

/**
 * Get collection listings
 */
export function fetchNftListings(address: string, limit: number = 20) {
  return request<{ success: boolean; data: NftListing[] }>({
    url: `/web3/nft-collection/collection/${address}/listings`,
    method: 'get',
    params: { limit }
  });
}

/**
 * Get collection sales
 */
export function fetchNftSales(address: string, limit: number = 20) {
  return request<{ success: boolean; data: NftSale[] }>({
    url: `/web3/nft-collection/collection/${address}/sales`,
    method: 'get',
    params: { limit }
  });
}

/**
 * Get collection holders
 */
export function fetchNftHolders(address: string, limit: number = 50) {
  return request<{ success: boolean; data: NftHolder[]; totalHolders: number }>({
    url: `/web3/nft-collection/collection/${address}/holders`,
    method: 'get',
    params: { limit }
  });
}

/**
 * Get whale activities for collection
 */
export function fetchNftWhales(address: string) {
  return request<{ success: boolean; data: WhaleActivity[] }>({
    url: `/web3/nft-collection/collection/${address}/whales`,
    method: 'get'
  });
}

/**
 * Get trending NFT collections
 */
export function fetchTrendingCollections(timeRange: '24h' | '7d' | '30d' = '24h') {
  return request<{ success: boolean; data: NftCollection[]; timeRange: string }>({
    url: '/web3/nft-collection/trending',
    method: 'get',
    params: { timeRange }
  });
}

/**
 * Search NFT collections
 */
export function searchNftCollections(query: string) {
  return request<{ success: boolean; data: NftCollection[] }>({
    url: '/web3/nft-collection/search',
    method: 'get',
    params: { q: query }
  });
}

/** Order Book Entry */
export interface OrderBookEntry {
  price: string;
  amount: string;
  total: string;
}

/** Order Book Data */
export interface OrderBookData {
  symbol: string;
  baseToken: string;
  quoteToken: string;
  sellOrders: OrderBookEntry[];
  buyOrders: OrderBookEntry[];
  spread: string;
  spreadPercent: string;
  lastUpdate: string;
}

/**
 * Fetch Order Book from Binance API
 */
export async function fetchOrderBook(symbol: string = 'ETHUSDT'): Promise<OrderBookData> {
  const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`);
  const data = await response.json();
  
  const sells = (data.bids || []).map((item: string[]) => ({
    price: item[0],
    amount: item[1],
    total: (parseFloat(item[0]) * parseFloat(item[1])).toFixed(2)
  }));
  
  const buys = (data.asks || []).map((item: string[]) => ({
    price: item[0],
    amount: item[1],
    total: (parseFloat(item[0]) * parseFloat(item[1])).toFixed(2)
  }));
  
  const bestAsk = parseFloat(sells[0]?.price || '0');
  const bestBid = parseFloat(buys[0]?.price || '0');
  const spread = bestAsk - bestBid;
  const mid = (bestAsk + bestBid) / 2;
  
  return {
    symbol,
    baseToken: symbol.replace('USDT', '').replace('USDC', ''),
    quoteToken: symbol.includes('USDT') ? 'USDT' : 'USDC',
    sellOrders: sells,
    buyOrders: buys,
    spread: spread.toFixed(2),
    spreadPercent: mid > 0 ? ((spread / mid) * 100).toFixed(3) : '0',
    lastUpdate: new Date().toISOString()
  };
}

/** Trading pair */
export function getTradingPairs() {
  return [
    { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT' },
    { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT' },
    { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT' },
    { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT' },
  ];
}

/** K-line (candlestick) data */
export interface KLine {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetch K-line (candlestick) data from Binance
 */
export async function fetchKLines(symbol: string = 'ETHUSDT', interval: string = '1h', limit: number = 100): Promise<KLine[]> {
  const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  const data = await response.json();
  
  return data.map((item: any[]) => ({
    time: item[0],
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[5])
  }));
}

/**
 * Fetch current price from Binance
 */
export async function fetchCurrentPrice(symbol: string = 'ETHUSDT'): Promise<{ price: string; change: string }> {
  const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
  const data = await response.json();
  return {
    price: data.lastPrice || '0',
    change: data.priceChange || '0'
  };
}

/**
 * Fetch coin prices from CoinGecko (free, no API key)
 */
export async function fetchCoinPrices(ids: string[]): Promise<Record<string, { usd: number; usd_24h_change: number }>> {
  const idsStr = ids.join(',');
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${idsStr}&vs_currencies=usd&include_24hr_change=true`
  );
  return response.json();
}

/**
 * Fetch DeFi yields from DeFi Llama (free API)
 */
export async function fetchDefiYields(): Promise<any> {
  try {
    const response = await fetch('https://yields.llama.fi/protocols');
    return response.json();
  } catch (e) {
    console.error('Failed to fetch yields:', e);
    return [];
  }
}

/**
 * Fetch gas prices from Etherscan API
 */
export async function fetchGasPricesFromEtherscan(chain: string = 'ethereum'): Promise<{ slow: number; normal: number; fast: number }> {
  const chainIdMap: Record<string, string> = {
    ethereum: '1',
    polygon: '137',
    arbitrum: '42161',
    optimism: '10',
    bsc: '56'
  };
  const chainId = chainIdMap[chain] || '1';
  
  try {
    const response = await fetch(`https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken`);
    const data = await response.json();
    if (data.status === '1') {
      return {
        slow: parseFloat(data.result.SafeGasPrice),
        normal: parseFloat(data.result.ProposeGasPrice),
        fast: parseFloat(data.result.FastGasPrice)
      };
    }
  } catch (e) {
    console.error('Failed to fetch gas:', e);
  }
  
  // Fallback to typical values
  return { slow: 15, normal: 25, fast: 45 };
}

/**
 * Fetch ETH balance for an address
 */
export async function fetchEthBalance(address: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=YourApiKeyToken`
    );
    const data = await response.json();
    if (data.status === '1') {
      // Convert from Wei to ETH
      return (parseFloat(data.result) / 1e18).toFixed(6);
    }
  } catch (e) {
    console.error('Failed to fetch balance:', e);
  }
  return '0';
}
