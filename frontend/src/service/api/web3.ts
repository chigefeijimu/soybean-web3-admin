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
