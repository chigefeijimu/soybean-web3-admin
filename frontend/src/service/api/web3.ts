import { createRequest } from '@sa/axios'

const request = createRequest({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
})

// Wallet APIs
export async function verifyWallet(data: {
  walletAddress: string
  signature: string
  message: string
  walletType?: string
  chainId?: number
}) {
  return request({
    url: '/web3/wallet/verify',
    method: 'POST',
    data
  })
}

export async function getWalletList(params?: { userId?: string }) {
  return request({
    url: '/web3/wallet/list',
    method: 'GET',
    params
  })
}

export async function deleteWallet(id: string) {
  return request({
    url: `/web3/wallet/${id}`,
    method: 'DELETE'
  })
}

// Contract APIs
export async function getContractList() {
  return request({
    url: '/web3/contract/list',
    method: 'GET'
  })
}

export async function getContract(id: string) {
  return request({
    url: `/web3/contract/${id}`,
    method: 'GET'
  })
}

export async function createContract(data: {
  name: string
  contractAddress: string
  chainId: number
  abi?: string
  description?: string
}) {
  return request({
    url: '/web3/contract',
    method: 'POST',
    data
  })
}

export async function updateContract(data: {
  id: string
  name?: string
  contractAddress?: string
  chainId?: number
  abi?: string
  description?: string
}) {
  return request({
    url: `/web3/contract/${data.id}`,
    method: 'PUT',
    data
  })
}

export async function deleteContract(id: string) {
  return request({
    url: `/web3/contract/${id}`,
    method: 'DELETE'
  })
}

export async function callContractMethod(
  id: string,
  data: {
    methodName: string
    params?: string
    fromAddress?: string
    value?: string
  }
) {
  return request({
    url: `/web3/contract/${id}/call`,
    method: 'POST',
    data
  })
}

// Direct contract call by address (no contract ID needed)
export async function callContractDirect(data: {
  contractAddress: string
  chainId?: number
  methodName: string
  params?: string
  fromAddress?: string
}) {
  return request({
    url: '/web3/contract/call-direct',
    method: 'POST',
    data
  })
}

// Transaction APIs
export async function getTransactionList(params?: { userId?: string }) {
  return request({
    url: '/web3/transaction/list',
    method: 'GET',
    params
  })
}

// Token Balance APIs
export async function getTokenBalances(data: {
  ownerAddress: string
  tokenAddresses: string[]
  chainId?: number
}) {
  return request({
    url: '/web3/contract/token-balances',
    method: 'POST',
    data
  })
}

// Market Data APIs
export async function getMarketOverview() {
  return request({
    url: '/web3/market/overview',
    method: 'GET'
  })
}

export async function getTokenPrice(symbol: string) {
  return request({
    url: `/web3/market/price/${symbol}`,
    method: 'GET'
  })
}

export async function getTokenPrices() {
  return request({
    url: '/web3/market/prices',
    method: 'GET'
  })
}

export async function getGasPrice(chainId: string) {
  return request({
    url: `/web3/market/gas/${chainId}`,
    method: 'GET'
  })
}

export async function getDeFiProtocols() {
  return request({
    url: '/web3/market/defi',
    method: 'GET'
  })
}

export async function getPriceHistory(symbol: string, days: number = 7) {
  return request({
    url: `/web3/market/history/${symbol}/${days}`,
    method: 'GET'
  })
}

export async function searchTokens(query: string) {
  return request({
    url: `/web3/market/search/${query}`,
    method: 'GET'
  })
}

export async function getTrendingTokens() {
  return request({
    url: '/web3/market/trending',
    method: 'GET'
  })
}

export async function getTopGainers() {
  return request({
    url: '/web3/market/gainers',
    method: 'GET'
  })
}

export async function getTopLosers() {
  return request({
    url: '/web3/market/losers',
    method: 'GET'
  })
}

// Transaction Receipt Parser APIs
export async function parseTransactionReceipt(data: {
  transactionHash: string
  chainId?: number
}) {
  return request({
    url: '/web3/transaction/parse-receipt',
    method: 'POST',
    data
  })
}

// Block Scanner APIs
export async function getBlock(blockNumber: number) {
  return request({
    url: `/web3/block/${blockNumber}`,
    method: 'GET'
  })
}

export async function getLatestBlock() {
  return request({
    url: '/web3/block/latest',
    method: 'GET'
  })
}

export async function getTransactionReceipt(txHash: string) {
  return request({
    url: `/web3/transaction/receipt/${txHash}`,
    method: 'GET'
  })
}

export async function scanBlocks(from: number, to: number) {
  return request({
    url: `/web3/scan/${from}/${to}`,
    method: 'GET'
  })
}
