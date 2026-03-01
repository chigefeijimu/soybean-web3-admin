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
