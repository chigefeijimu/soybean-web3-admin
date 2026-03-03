<template>
  <div class="nft-bridge">
    <div class="header">
      <h2>🌉 Cross-chain NFT Bridge</h2>
      <p class="subtitle">Compare and find the best NFT bridge across multiple chains</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Bridges</div>
        <div class="stat-value">{{ stats.totalBridges }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Operational</div>
        <div class="stat-value success">{{ stats.operationalBridges }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Fee</div>
        <div class="stat-value">{{ stats.avgFee.toFixed(2) }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Chains Supported</div>
        <div class="stat-value">{{ stats.chainsSupported }}/{{ stats.totalChains }}</div>
      </div>
    </div>

    <!-- Route Selection -->
    <div class="route-section">
      <h3>Bridge Route</h3>
      <div class="route-form">
        <div class="form-group">
          <label>From Chain</label>
          <select v-model="fromChain" class="form-select">
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }}
            </option>
          </select>
        </div>
        <div class="swap-icon">⇄</div>
        <div class="form-group">
          <label>To Chain</label>
          <select v-model="toChain" class="form-select">
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }}
            </option>
          </select>
        </div>
        <button @click="getRoutes" class="btn-primary" :disabled="loading">
          {{ loading ? 'Loading...' : 'Find Routes' }}
        </button>
      </div>
    </div>

    <!-- Routes Results -->
    <div v-if="routes" class="routes-section">
      <div class="route-summary">
        <div class="route-badge fastest">
          <span class="badge-icon">⚡</span>
          <span class="badge-label">Fastest</span>
          <span class="badge-value">{{ getBridgeName(routes.fastestOption) }}</span>
        </div>
        <div class="route-badge cheapest">
          <span class="badge-icon">💰</span>
          <span class="badge-label">Cheapest</span>
          <span class="badge-value">{{ getBridgeName(routes.cheapestOption) }}</span>
        </div>
        <div class="route-badge best">
          <span class="badge-icon">🏆</span>
          <span class="badge-label">Best Overall</span>
          <span class="badge-value">{{ getBridgeName(routes.bestOption) }}</span>
        </div>
      </div>

      <!-- Bridges List -->
      <div class="bridges-list">
        <div 
          v-for="bridge in routes.bridges" 
          :key="bridge.id" 
          class="bridge-card"
          :class="{ selected: selectedBridge?.id === bridge.id }"
          @click="selectBridge(bridge)"
        >
          <div class="bridge-header">
            <div class="bridge-info">
              <img :src="bridge.logo" :alt="bridge.name" class="bridge-logo" />
              <div class="bridge-name">
                <h4>{{ bridge.name }}</h4>
                <span class="status" :class="bridge.status">{{ bridge.status }}</span>
              </div>
            </div>
            <div class="bridge-score">
              <div class="security-score" :class="getScoreClass(bridge.securityScore)">
                {{ bridge.securityScore }}
              </div>
              <span class="score-label">Security</span>
            </div>
          </div>

          <div class="bridge-details">
            <div class="detail-item">
              <span class="label">Fee</span>
              <span class="value">{{ (bridge.fee * 100).toFixed(2) }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Est. Time</span>
              <span class="value">{{ bridge.avgBridgeTime }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Chains</span>
              <span class="value">{{ bridge.supportedChains.length }}</span>
            </div>
          </div>

          <div class="bridge-features">
            <span v-for="feature in bridge.features" :key="feature" class="feature-tag">
              {{ feature }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quote Section -->
    <div v-if="selectedBridge && routes" class="quote-section">
      <h3>Bridge Quote</h3>
      <div class="quote-form">
        <div class="form-group">
          <label>NFT Contract Address</label>
          <input v-model="nftContract" type="text" placeholder="0x..." class="form-input" />
        </div>
        <div class="form-group">
          <label>Token ID</label>
          <input v-model="tokenId" type="text" placeholder="1" class="form-input" />
        </div>
        <button @click="getQuote" class="btn-primary" :disabled="loadingQuote">
          {{ loadingQuote ? 'Getting Quote...' : 'Get Quote' }}
        </button>
      </div>

      <div v-if="quote" class="quote-result">
        <div class="quote-overview">
          <div class="quote-item">
            <span class="label">Estimated Time</span>
            <span class="value">{{ quote.estimatedTime }}</span>
          </div>
          <div class="quote-item">
            <span class="label">Estimated Fee</span>
            <span class="value">{{ quote.estimatedFee.toFixed(4) }} {{ quote.feeToken }}</span>
          </div>
        </div>

        <div class="bridge-steps">
          <h4>Bridge Steps</h4>
          <div class="steps-list">
            <div v-for="step in quote.steps" :key="step.step" class="step-item">
              <div class="step-number">{{ step.step }}</div>
              <div class="step-content">
                <span class="step-description">{{ step.description }}</span>
                <span class="step-action">{{ step.action }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popular Routes -->
    <div class="popular-routes-section">
      <h3>🔥 Popular Routes</h3>
      <div class="popular-routes">
        <div v-for="route in popularRoutes" :key="`${route.from}-${route.to}`" class="popular-route">
          <span class="chain-badge">{{ route.from }}</span>
          <span class="arrow">→</span>
          <span class="chain-badge">{{ route.to }}</span>
          <span class="bridge-name">{{ getBridgeName(route.bridge) }}</span>
          <span class="count">{{ formatNumber(route.count) }} bridges</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Chain {
  id: string
  name: string
  symbol: string
  logo: string
}

interface Bridge {
  id: string
  name: string
  logo: string
  supportedChains: string[]
  supportedNftStandards: string[]
  fee: number
  feeType: string
  avgBridgeTime: string
  status: string
  securityScore: number
  features: string[]
  description: string
}

interface Route {
  fromChain: string
  toChain: string
  bridges: Bridge[]
  bestOption: string
  fastestOption: string
  cheapestOption: string
}

interface Quote {
  bridgeId: string
  fromChain: string
  toChain: string
  nftContract: string
  tokenId: string
  estimatedTime: string
  estimatedFee: number
  feeToken: string
  steps: { step: number; description: string; action: string }[]
}

interface Stats {
  totalBridges: number
  operationalBridges: number
  avgFee: number
  avgBridgeTime: string
  chainsSupported: number
  totalChains: number
}

const loading = ref(false)
const loadingQuote = ref(false)
const chains = ref<Chain[]>([])
const fromChain = ref('ethereum')
const toChain = ref('polygon')
const routes = ref<Route | null>(null)
const selectedBridge = ref<Bridge | null>(null)
const quote = ref<Quote | null>(null)
const nftContract = ref('')
const tokenId = ref('')
const stats = ref<Stats>({
  totalBridges: 0,
  operationalBridges: 0,
  avgFee: 0,
  avgBridgeTime: '',
  chainsSupported: 0,
  totalChains: 0
})
const popularRoutes = ref<{ from: string; to: string; bridge: string; count: number }[]>([])

const API_BASE = '/api/web3-nft-bridge-api'

const fetchStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/stats`)
    stats.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch stats:', e)
  }
}

const fetchChains = async () => {
  try {
    const res = await fetch(`${API_BASE}/chains`)
    chains.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch chains:', e)
    chains.value = [
      { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', logo: '' },
      { id: 'polygon', name: 'Polygon', symbol: 'MATIC', logo: '' },
      { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', logo: '' },
      { id: 'optimism', name: 'Optimism', symbol: 'ETH', logo: '' },
      { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', logo: '' },
      { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', logo: '' },
      { id: 'base', name: 'Base', symbol: 'ETH', logo: '' },
      { id: 'solana', name: 'Solana', symbol: 'SOL', logo: '' }
    ]
  }
}

const fetchPopularRoutes = async () => {
  try {
    const res = await fetch(`${API_BASE}/popular-routes`)
    popularRoutes.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch popular routes:', e)
    popularRoutes.value = [
      { from: 'ethereum', to: 'polygon', bridge: 'layerzero', count: 12500 },
      { from: 'ethereum', to: 'arbitrum', bridge: 'wormhole', count: 9800 },
      { from: 'polygon', to: 'avalanche', bridge: 'axelar', count: 7500 }
    ]
  }
}

const getRoutes = async () => {
  loading.value = true
  selectedBridge.value = null
  quote.value = null
  try {
    const res = await fetch(`${API_BASE}/route/${fromChain.value}/${toChain.value}`)
    routes.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch routes:', e)
  } finally {
    loading.value = false
  }
}

const selectBridge = (bridge: Bridge) => {
  selectedBridge.value = bridge
}

const getQuote = async () => {
  if (!selectedBridge.value) return
  loadingQuote.value = true
  try {
    const res = await fetch(
      `${API_BASE}/quote/${selectedBridge.value.id}?fromChain=${fromChain.value}&toChain=${toChain.value}&nftContract=${nftContract.value || '0x0000000000000000000000000000000000000000'}&tokenId=${tokenId.value || '1'}`
    )
    quote.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch quote:', e)
  } finally {
    loadingQuote.value = false
  }
}

const getBridgeName = (id: string): string => {
  if (!routes.value) return id
  const bridge = routes.value.bridges.find(b => b.id === id)
  return bridge?.name || id
}

const getScoreClass = (score: number): string => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'fair'
  return 'poor'
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num)
}

onMounted(() => {
  fetchStats()
  fetchChains()
  fetchPopularRoutes()
})
</script>

<style scoped>
.nft-bridge {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.stat-value.success {
  color: #10b981;
}

.route-section, .routes-section, .quote-section, .popular-routes-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.route-section h3, .quote-section h3, .popular-routes-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.route-form {
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
}

.swap-icon {
  font-size: 24px;
  color: #667eea;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.route-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.route-badge {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
}

.route-badge.fastest {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.route-badge.cheapest {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.route-badge.best {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.badge-icon {
  font-size: 18px;
}

.badge-label {
  color: #666;
}

.badge-value {
  font-weight: 600;
}

.bridges-list {
  display: grid;
  gap: 12px;
}

.bridge-card {
  background: #f9fafb;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.bridge-card:hover {
  border-color: #e5e7eb;
  background: white;
}

.bridge-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
}

.bridge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bridge-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bridge-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.bridge-name h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status.operational {
  background: #d1fae5;
  color: #059669;
}

.status.degraded {
  background: #fef3c7;
  color: #d97706;
}

.status.maintenance {
  background: #fee2e2;
  color: #dc2626;
}

.bridge-score {
  text-align: center;
}

.security-score {
  font-size: 20px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 6px;
}

.security-score.excellent {
  background: #d1fae5;
  color: #059669;
}

.security-score.good {
  background: #dbeafe;
  color: #2563eb;
}

.security-score.fair {
  background: #fef3c7;
  color: #d97706;
}

.security-score.poor {
  background: #fee2e2;
  color: #dc2626;
}

.score-label {
  font-size: 10px;
  color: #666;
}

.bridge-details {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.detail-item .label {
  font-size: 11px;
  color: #666;
  display: block;
  margin-bottom: 2px;
}

.detail-item .value {
  font-size: 14px;
  font-weight: 600;
}

.bridge-features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-tag {
  font-size: 11px;
  padding: 4px 8px;
  background: #e5e7eb;
  border-radius: 4px;
  color: #444;
}

.quote-form {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 20px;
}

.quote-result {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
}

.quote-overview {
  display: flex;
  gap: 32px;
  margin-bottom: 20px;
}

.quote-item .label {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.quote-item .value {
  font-size: 18px;
  font-weight: 600;
}

.bridge-steps h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-number {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.step-content {
  display: flex;
  justify-content: space-between;
  flex: 1;
}

.step-description {
  font-size: 13px;
}

.step-action {
  font-size: 11px;
  color: #666;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.popular-routes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.popular-route {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
}

.chain-badge {
  padding: 4px 8px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.arrow {
  color: #667eea;
}

.bridge-name {
  color: #667eea;
  font-weight: 500;
}

.count {
  margin-left: auto;
  color: #666;
  font-size: 11px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .route-form {
    flex-direction: column;
  }
  
  .popular-routes {
    grid-template-columns: 1fr;
  }
}
</style>
