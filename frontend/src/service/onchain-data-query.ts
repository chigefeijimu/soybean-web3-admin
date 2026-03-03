import { request } from '@/utils/request';

export function executeQuery(query: string, chain?: string) {
  return request({
    url: '/onchain-data-query/query',
    method: 'POST',
    data: { query, chain },
  });
}

export function getChainStats(chain: string) {
  return request({
    url: '/onchain-data-query/chain-stats',
    method: 'GET',
    params: { chain },
  });
}

export function getBlockData(chain: string, blockNumber: number) {
  return request({
    url: '/onchain-data-query/block',
    method: 'GET',
    params: { chain, blockNumber },
  });
}

export function getTransactions(
  chain: string,
  address: string,
  fromBlock?: number,
  toBlock?: number,
  limit?: number,
) {
  return request({
    url: '/onchain-data-query/transactions',
    method: 'GET',
    params: { chain, address, fromBlock, toBlock, limit },
  });
}

export function getTokenTransfers(
  chain: string,
  address: string,
  tokenAddress?: string,
  fromBlock?: number,
  toBlock?: number,
  limit?: number,
) {
  return request({
    url: '/onchain-data-query/tokens',
    method: 'GET',
    params: { chain, address, tokenAddress, fromBlock, toBlock, limit },
  });
}

export function getNativeBalanceHistory(
  chain: string,
  address: string,
  fromBlock?: number,
  toBlock?: number,
) {
  return request({
    url: '/onchain-data-query/native-balance-history',
    method: 'GET',
    params: { chain, address, fromBlock, toBlock },
  });
}

export function getSupportedChains() {
  return request({
    url: '/onchain-data-query/supported-chains',
    method: 'GET',
  });
}

export function getQueryTemplates() {
  return request({
    url: '/onchain-data-query/query-templates',
    method: 'GET',
  });
}
