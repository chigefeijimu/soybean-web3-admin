import request from '@/service/request'

// Portfolio Stress Tester API

export interface StressTestRequest {
  address: string
  chains?: string[]
  scenarios?: string[]
}

export interface ScenarioConfig {
  address: string
  name: string
  type: string
  severity: number
  probability?: number
  chains?: string[]
  parameters?: Record<string, any>
}

export const getPortfolioStressSummary = (address: string, chains?: string[]) => {
  const params = new URLSearchParams()
  if (chains && chains.length > 0) {
    params.append('chains', chains.join(','))
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  return request({
    url: `/web3/portfolio-stress-tester/summary/${address}${query}`,
    method: 'get'
  })
}

export const getHistoricalCrashes = (limit: number = 10) => {
  return request({
    url: `/web3/portfolio-stress-tester/historical-crashes?limit=${limit}`,
    method: 'get'
  })
}

export const getPortfolioSnapshot = (address: string, chains?: string[]) => {
  const params = new URLSearchParams()
  if (chains && chains.length > 0) {
    params.append('chains', chains.join(','))
  }
  const query = params.toString() ? `?${params.toString()}` : ''
  return request({
    url: `/web3/portfolio-stress-tester/portfolio-snapshot/${address}${query}`,
    method: 'get'
  })
}

export const runStressTest = (data: StressTestRequest) => {
  return request({
    url: '/web3/portfolio-stress-tester/analyze',
    method: 'post',
    data
  })
}

export const runCustomScenario = (data: ScenarioConfig) => {
  return request({
    url: '/web3/portfolio-stress-tester/scenarios',
    method: 'post',
    data
  })
}

export const comparePortfolios = (addresses: string[]) => {
  return request({
    url: '/web3/portfolio-stress-tester/compare',
    method: 'post',
    data: { addresses }
  })
}
