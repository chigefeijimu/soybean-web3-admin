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
