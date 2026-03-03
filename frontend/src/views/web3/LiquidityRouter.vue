<template>
  <div class="liquidity-router">
    <div class="header">
      <h2>🌉 Cross-chain Liquidity Router</h2>
      <p class="subtitle">Find optimal liquidity paths across chains for your token swaps</p>
    </div>

    <!-- Supported Info -->
    <div class="info-bar">
      <div class="info-item">
        <span class="info-label">Supported Chains:</span>
        <span class="info-value">{{ supportedChains.length }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Supported Bridges:</span>
        <span class="info-value">{{ supportedBridges.length }}</span>
      </div>
    </div>

    <!-- Swap Form -->
    <div class="card swap-form">
      <h3>🔄 Cross-chain Swap</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>From Chain</label>
          <select v-model="swapParams.fromChain">
            <option v-for="chain in supportedChains" :key="chain.id" :value="chain.id">
              {{ chain.name }} ({{ chain.symbol }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>To Chain</label>
          <select v-model="swapParams.toChain">
            <option v-for="chain in supportedChains" :key="chain.id" :value="chain.id">
              {{ chain.name }} ({{ chain.symbol }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>From Token</label>
          <input type="text" v-model="swapParams.fromToken" placeholder="ETH, USDC, etc." />
        </div>
        <div class="form-group">
          <label>To Token</label>
          <input type="text" v-model="swapParams.toToken" placeholder="ETH, USDC, etc." />
        </div>
        <div class="form-group">
          <label>Amount</label>
          <input type="number" v-model="swapParams.amount" placeholder="1000" min="0" />
        </div>
        <div class="form-group">
          <label>Slippage Tolerance (%)</label>
          <input type="number" v-model="swapParams.slippage" placeholder="0.5" step="0.1" min="0.1" max="50" />
        </div>
      </div>
      <div class="button-group">
        <button class="btn-primary" @click="findRoute" :disabled="loading.route">
          {{ loading.route ? 'Finding Best Route...' : '🔍 Find Best Route' }}
        </button>
        <button class="btn-secondary" @click="getQuotes" :disabled="loading.quotes">
          {{ loading.quotes ? 'Getting Quotes...' : '📊 Compare Quotes' }}
        </button>
        <button class="btn-secondary" @click="compareRoutes" :disabled="loading.compare">
          {{ loading.compare ? 'Comparing...' : '⚖️ Compare Routes' }}
        </button>
      </div>
    </div>

    <!-- Results: Best Route -->
    <div class="card result-card" v-if="routeResult">
      <div class="result-header">
        <h3>✨ Best Route Found</h3>
        <span class="badge success">Recommended</span>
      </div>
      
      <div class="route-summary">
        <div class="route-flow">
          <span class="token">{{ swapParams.fromToken }}</span>
          <span class="arrow">→</span>
          <span class="chain">{{ formatChainName(routeResult.fromChain) }}</span>
          <span class="arrow">→</span>
          <span class="chain">{{ formatChainName(routeResult.toChain) }}</span>
          <span class="arrow">→</span>
          <span class="token">{{ swapParams.toToken }}</span>
        </div>
      </div>

      <div class="route-details">
        <div class="detail-item">
          <span class="detail-label">Input Amount</span>
          <span class="detail-value">{{ routeResult.inputAmount }} {{ swapParams.fromToken }}</span>
        </div>
        <div class="detail-item highlight">
          <span class="detail-label">Output Amount</span>
          <span class="detail-value">{{ routeResult.outputAmount }} {{ swapParams.toToken }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Output USD</span>
          <span class="detail-value">${{ routeResult.outputAmountUSD }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Bridge</span>
          <span class="detail-value">{{ routeResult.route.bridge }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Est. Time</span>
          <span class="detail-value">{{ routeResult.route.estimatedTime }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Security</span>
          <span class="detail-value security">{{ routeResult.route.securityScore }}%</span>
        </div>
      </div>

      <div class="route-steps">
        <h4>📋 Route Steps</h4>
        <div class="steps-list">
          <div v-for="step in routeResult.route.steps" :key="step.step" class="step-item">
            <div class="step-number">{{ step.step }}</div>
            <div class="step-content">
              <div class="step-action">{{ step.action }}</div>
              <div class="step-desc">{{ step.description }}</div>
              <div class="step-time">{{ step.estimatedTime }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alternatives -->
      <div class="alternatives" v-if="routeResult.alternatives && routeResult.alternatives.length > 0">
        <h4>🔄 Alternative Routes</h4>
        <div class="alternatives-list">
          <div v-for="alt in routeResult.alternatives" :key="alt.rank" class="alt-item">
            <div class="alt-rank">#{{ alt.rank }}</div>
            <div class="alt-details">
              <span class="alt-bridge">{{ alt.route.bridge }}</span>
              <span class="alt-output">{{ alt.outputAmount }} {{ swapParams.toToken }} ($${alt.outputAmountUSD})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results: Quotes -->
    <div class="card quotes-card" v-if="quotesResult">
      <div class="result-header">
        <h3>📊 Bridge Quotes Comparison</h3>
      </div>

      <div class="quotes-summary">
        <div class="summary-item">
          <span class="summary-label">From</span>
          <span class="summary-value">{{ formatChainName(quotesResult.fromChain) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">To</span>
          <span class="summary-value">{{ formatChainName(quotesResult.toChain) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Amount</span>
          <span class="summary-value">{{ quotesResult.amount }} {{ quotesResult.fromToken }}</span>
        </div>
      </div>

      <div class="quotes-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Bridge</th>
              <th>Output</th>
              <th>Output USD</th>
              <th>Fee</th>
              <th>Est. Time</th>
              <th>Security</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(quote, index) in quotesResult.quotes" :key="quote.bridgeId" :class="{ 'best-quote': index === 0 }">
              <td>{{ index + 1 }}</td>
              <td>{{ quote.bridge }}</td>
              <td>{{ quote.outputAmount }} {{ swapParams.toToken }}</td>
              <td>${{ quote.outputAmountUSD }}</td>
              <td>${{ quote.bridgeFeeUSD }}</td>
              <td>{{ quote.estimatedTime }}</td>
              <td>
                <span class="security-badge" :class="getSecurityClass(quote.securityScore)">
                  {{ quote.securityScore }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Results: Compare Routes -->
    <div class="card compare-card" v-if="compareResult">
      <div class="result-header">
        <h3>⚖️ Route Comparison</h3>
      </div>

      <div class="compare-grid">
        <div 
          v-for="(route, index) in compareResult.routes" 
          :key="route.type"
          class="compare-item"
          :class="{ recommended: index === 0 }"
        >
          <div class="compare-header">
            <span class="compare-type">{{ route.name }}</span>
            <span v-if="index === 0" class="badge success">Best</span>
          </div>
          <div class="compare-details">
            <div class="compare-row">
              <span>Output:</span>
              <span>{{ route.outputAmount.toFixed(4) }} {{ swapParams.toToken }}</span>
            </div>
            <div class="compare-row">
              <span>Value:</span>
              <span>${{ route.outputAmountUSD.toFixed(2) }}</span>
            </div>
            <div class="compare-row">
              <span>Fees:</span>
              <span>${{ route.totalFees.toFixed(4) }}</span>
            </div>
            <div class="compare-row">
              <span>Time:</span>
              <span>{{ route.estimatedTime }}</span>
            </div>
            <div class="compare-row">
              <span>Hops:</span>
              <span>{{ route.hops }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popular Routes -->
    <div class="card popular-routes" v-if="popularRoutes.length > 0">
      <h3>🔥 Popular Routes</h3>
      <div class="popular-list">
        <div v-for="(route, index) in popularRoutes" :key="index" class="popular-item">
          <div class="popular-path">
            <span class="chain-tag">{{ formatChainName(route.from) }}</span>
            <span class="arrow">→</span>
            <span class="chain-tag">{{ formatChainName(route.to) }}</span>
          </div>
          <div class="popular-tokens">
            <span>{{ route.fromToken }}</span>
            <span>→</span>
            <span>{{ route.toToken }}</span>
          </div>
          <div class="popular-volume">
            24h: ${{ formatNumber(parseFloat(route.volume24h)) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { liquidityRouterApi, type Chain, type Bridge } from '@/service/liquidityRouter'

const supportedChains = ref<Chain[]>([])
const supportedBridges = ref<Bridge[]>([])
const popularRoutes = ref<any[]>([])

const swapParams = ref({
  fromChain: 'ethereum',
  toChain: 'arbitrum',
  fromToken: 'ETH',
  toToken: 'ETH',
  amount: '1',
  slippage: '0.5'
})

const loading = ref({
  route: false,
  quotes: false,
  compare: false
})

const routeResult = ref<any>(null)
const quotesResult = ref<any>(null)
const compareResult = ref<any>(null)

const chainNameMap: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  bsc: 'BNB Chain',
  base: 'Base',
  avalanche: 'Avalanche',
  solana: 'Solana',
  zksync: 'zkSync',
  starknet: 'Starknet',
  linea: 'Linea',
  scroll: 'Scroll',
  mantle: 'Mantle'
}

const formatChainName = (chain: string) => {
  return chainNameMap[chain] || chain
}

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const getSecurityClass = (score: number) => {
  if (score >= 90) return 'high'
  if (score >= 75) return 'medium'
  return 'low'
}

const findRoute = async () => {
  loading.value.route = true
  try {
    const res = await liquidityRouterApi.findRoute(swapParams.value)
    routeResult.value = res.data
    quotesResult.value = null
    compareResult.value = null
  } catch (error) {
    console.error('Error finding route:', error)
  } finally {
    loading.value.route = false
  }
}

const getQuotes = async () => {
  loading.value.quotes = true
  try {
    const res = await liquidityRouterApi.getQuotes(swapParams.value)
    quotesResult.value = res.data
    routeResult.value = null
    compareResult.value = null
  } catch (error) {
    console.error('Error getting quotes:', error)
  } finally {
    loading.value.quotes = false
  }
}

const compareRoutes = async () => {
  loading.value.compare = true
  try {
    const res = await liquidityRouterApi.compareRoutes(swapParams.value)
    compareResult.value = res.data
    routeResult.value = null
    quotesResult.value = null
  } catch (error) {
    console.error('Error comparing routes:', error)
  } finally {
    loading.value.compare = false
  }
}

const loadSupportedData = async () => {
  try {
    const [chainsRes, bridgesRes, popularRes] = await Promise.all([
      liquidityRouterApi.getSupportedChains(),
      liquidityRouterApi.getSupportedBridges(),
      liquidityRouterApi.getPopularRoutes()
    ])
    
    supportedChains.value = chainsRes.data.chains
    supportedBridges.value = bridgesRes.data.bridges
    popularRoutes.value = popularRes.data.routes
  } catch (error) {
    console.error('Error loading supported data:', error)
  }
}

onMounted(() => {
  loadSupportedData()
})
</script>

<style scoped>
.liquidity-router {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  margin-bottom: 8px;
  color: #1a1a2e;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.info-bar {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #666;
  font-size: 13px;
}

.info-value {
  font-weight: 600;
  color: #1a1a2e;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #1a1a2e;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.result-header h3 {
  margin: 0;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge.success {
  background: #d1fae5;
  color: #065f46;
}

.route-summary {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.route-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.route-flow .token {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.route-flow .chain {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.route-flow .arrow {
  color: #9ca3af;
  font-size: 18px;
}

.route-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.detail-value.highlight {
  color: #10b981;
}

.detail-value.security {
  color: #4f46e5;
}

.route-steps {
  margin-top: 20px;
}

.route-steps h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #374151;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-number {
  width: 28px;
  height: 28px;
  background: #4f46e5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-action {
  font-weight: 600;
  color: #1a1a2e;
  text-transform: capitalize;
}

.step-desc {
  font-size: 13px;
  color: #666;
}

.step-time {
  font-size: 12px;
  color: #9ca3af;
}

.alternatives {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.alternatives h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #374151;
}

.alternatives-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alt-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.alt-rank {
  font-weight: 600;
  color: #6b7280;
}

.alt-details {
  display: flex;
  justify-content: space-between;
  flex: 1;
}

.alt-bridge {
  font-weight: 500;
}

.alt-output {
  color: #10b981;
}

.quotes-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #666;
}

.summary-value {
  font-weight: 600;
}

.quotes-table {
  overflow-x: auto;
}

.quotes-table table {
  width: 100%;
  border-collapse: collapse;
}

.quotes-table th,
.quotes-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.quotes-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.quotes-table tr.best-quote {
  background: #d1fae5;
}

.security-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.security-badge.high {
  background: #d1fae5;
  color: #065f46;
}

.security-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.security-badge.low {
  background: #fee2e2;
  color: #991b1b;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.compare-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid transparent;
}

.compare-item.recommended {
  border-color: #10b981;
  background: #d1fae5;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.compare-type {
  font-weight: 600;
}

.compare-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compare-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.compare-row span:first-child {
  color: #666;
}

.popular-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.popular-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.popular-path {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chain-tag {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.popular-tokens {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.popular-volume {
  margin-left: auto;
  font-size: 12px;
  color: #10b981;
  font-weight: 500;
}
</style>
