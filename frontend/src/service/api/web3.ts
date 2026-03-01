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
