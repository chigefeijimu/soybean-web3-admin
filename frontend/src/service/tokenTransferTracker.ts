import { request } from '../request';

/** 转账记录 */
export interface Transfer {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  token: string;
  tokenSymbol: string;
  value: string;
  valueUsd: number;
  chain: string;
}

/** 转账统计 */
export interface TransferStats {
  totalTransfers: number;
  totalVolume: number;
  totalVolumeUsd: number;
  uniqueSenders: number;
  uniqueReceivers: number;
  avgTransferUsd: number;
}

/** 链上统计 */
export interface ChainStats {
  chain: string;
  transfers: number;
  volumeUsd: number;
}

/** 代币信息 */
export interface TokenInfo {
  token: string;
  symbol: string;
  transfers: number;
  volumeUsd: number;
  chain: string;
}

/** 历史数据点 */
export interface HistoryDataPoint {
  date: string;
  transfers: number;
  volumeUsd: number;
}

/** 地址活动 */
export interface AddressActivity {
  address: string;
  totalReceived: number;
  totalSent: number;
  firstSeen: number;
  lastSeen: number;
  chainActivity: Record<string, { received: number; sent: number }>;
}

/**
 * 获取转账记录
 */
export function fetchTokenTransfers(params: {
  address?: string;
  chain?: string;
  token?: string;
  startBlock?: number;
  endBlock?: number;
  page?: number;
  limit?: number;
}) {
  return request<{
    transfers: Transfer[];
    total: number;
    page: number;
    limit: number;
  }>({
    url: '/api/web3/token-transfer-tracker/transfers',
    method: 'get',
    params
  });
}

/**
 * 获取转账统计
 */
export function fetchTransferStats(params: {
  address?: string;
  chain?: string;
  token?: string;
  period?: string;
}) {
  return request<{
    stats: TransferStats;
    chainStats: ChainStats[];
    period: string;
  }>({
    url: '/api/web3/token-transfer-tracker/stats',
    method: 'get',
    params
  });
}

/**
 * 获取转账历史
 */
export function fetchTransferHistory(params: {
  address?: string;
  chain?: string;
  token?: string;
  period?: string;
}) {
  return request<{
    data: HistoryDataPoint[];
    period: string;
  }>({
    url: '/api/web3/token-transfer-tracker/history',
    method: 'get',
    params
  });
}

/**
 * 获取热门代币
 */
export function fetchTopTokens(params: {
  chain?: string;
  period?: string;
  limit?: number;
}) {
  return request<{
    tokens: TokenInfo[];
    period: string;
  }>({
    url: '/api/web3/token-transfer-tracker/top-tokens',
    method: 'get',
    params
  });
}

/**
 * 获取地址活动
 */
export function fetchAddressActivity(params: {
  address: string;
  chain?: string;
}) {
  return request<AddressActivity>({
    url: `/api/web3/token-transfer-tracker/address/${params.address}`,
    method: 'get',
    params: { chain: params.chain }
  });
}

/**
 * 获取支持的链
 */
export function fetchSupportedChains() {
  return request<{ chains: string[] }>({
    url: '/api/web3/token-transfer-tracker/chains',
    method: 'get'
  });
}
