<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Types
interface LiquidationPosition {
  id: string
  address: string
  chain: string
  protocol: string
  collateralToken: string
  debtToken: string
  collateralValue: number
  debtValue: number
  healthFactor: number
  liquidationThreshold: number
  riskLevel: 'safe' | 'warning' | 'danger' | 'critical'
  estimatedLiquidationBonus: number
  lastUpdated: string
}

interface AlertSubscription {
  id: string
  address: string
  chains: string[]
  protocols: string[]
  healthFactorThreshold: number
  webhookUrl?: string
  isActive: boolean
  createdAt: string
}

interface MarketStats {
  totalPositions: number
  atRiskPositions: number
  totalCollateralValue: number
  totalDebtValue: number
  chainDistribution: Record<string, number>
  protocolDistribution: Record<string, number>
  riskDistribution: Record<string, number>
}

// State
const activeTab = ref('positions')
const positions = ref<LiquidationPosition[]>([])
const subscriptions = ref<AlertSubscription[]>([])
const stats = ref<MarketStats | null>(null)
const loading = ref(false)
const searchAddress = ref('')
const selectedChain = ref('')
const selectedProtocol = ref('')
const selectedRiskLevel = ref('')

// Filter options
const chains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'avalanche']
const protocols = ['aave', 'compound', 'liquity', 'morpho']
const riskLevels = ['safe', 'warning', 'danger', 'critical']

// New subscription form
const showCreateModal = ref(false)
const newSubscription = ref({
  address: '',
  chains: ['ethereum'],
  protocols: ['aave'],
  healthFactorThreshold: 1.2,
  webhookUrl: ''
})

// Computed
const filteredPositions = computed(() => {
  return positions.value.filter(pos => {
    if (selectedChain.value && pos.chain !== selectedChain.value) return false
    if (selectedProtocol.value && pos.protocol !== selectedProtocol.value) return false
    if (selectedRiskLevel.value && pos.riskLevel !== selectedRiskLevel.value) return false
    if (searchAddress.value && !pos.address.toLowerCase().includes(searchAddress.value.toLowerCase())) return false
    return true
  })
})

const atRiskCount = computed(() => positions.value.filter(p => p.riskLevel !== 'safe').length)
const criticalCount = computed(() => positions.value.filter(p => p.riskLevel === 'critical').length)

// Methods
const getRiskColor = (level: string) => {
  const colors: Record<string, string> = {
    safe: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    critical: '#991b1b'
  }
  return colors[level] || '#6b7280'
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num)
}

const formatAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

const loadPositions = async () => {
  loading.value = true
  try {
    // Mock data for demo
    positions.value = [
      {
        id: 'pos-001',
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
        chain: 'ethereum',
        protocol: 'aave',
        collateralToken: 'ETH',
        debtToken: 'USDC',
        collateralValue: 125000,
        debtValue: 85000,
        healthFactor: 1.15,
        liquidationThreshold: 1.0,
        riskLevel: 'warning',
        estimatedLiquidationBonus: 4250,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'pos-002',
        address: '0x9f8F72aA9304c8B593d555F12eF6589cC4BAb85',
        chain: 'polygon',
        protocol: 'aave',
        collateralToken: 'MATIC',
        debtToken: 'USDT',
        collateralValue: 45000,
        debtValue: 42000,
        healthFactor: 0.92,
        liquidationThreshold: 1.0,
        riskLevel: 'danger',
        estimatedLiquidationBonus: 2100,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'pos-003',
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        chain: 'arbitrum',
        protocol: 'compound',
        collateralToken: 'WBTC',
        debtToken: 'ETH',
        collateralValue: 280000,
        debtValue: 195000,
        healthFactor: 1.18,
        liquidationThreshold: 1.0,
        riskLevel: 'warning',
        estimatedLiquidationBonus: 14000,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'pos-004',
        address: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA',
        chain: 'optimism',
        protocol: 'aave',
        collateralToken: 'OP',
        debtToken: 'DAI',
        collateralValue: 32000,
        debtValue: 30000,
        healthFactor: 0.85,
        liquidationThreshold: 1.0,
        riskLevel: 'critical',
        estimatedLiquidationBonus: 1500,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'pos-005',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chain: 'base',
        protocol: 'aave',
        collateralToken: 'ETH',
        debtToken: 'USDC',
        collateralValue: 180000,
        debtValue: 120000,
        healthFactor: 1.25,
        liquidationThreshold: 1.0,
        riskLevel: 'safe',
        estimatedLiquidationBonus: 9000,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'pos-006',
        address: '0xB4e16d0168e5234c70A95A4b9e2a0B7dC7e7b5e',
        chain: 'avalanche',
        protocol: 'aave',
        collateralToken: 'AVAX',
        debtToken: 'USDC',
        collateralValue: 65000,
        debtValue: 58000,
        healthFactor: 0.95,
        liquidationThreshold: 1.0,
        riskLevel: 'danger',
        estimatedLiquidationBonus: 2900,
        lastUpdated: new Date().toISOString()
      }
    ]
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  stats.value = {
    totalPositions: 156,
    atRiskPositions: 42,
    totalCollateralValue: 12500000,
    totalDebtValue: 8900000,
    chainDistribution: { ethereum: 45, polygon: 32, arbitrum: 28, optimism: 22, base: 18, avalanche: 11 },
    protocolDistribution: { aave: 78, compound: 45, liquity: 21, morpho: 12 },
    riskDistribution: { safe: 114, warning: 25, danger: 12, critical: 5 }
  }
}

const createSubscription = async () => {
  const sub: AlertSubscription = {
    id: `sub-${Date.now()}`,
    address: newSubscription.value.address,
    chains: newSubscription.value.chains,
    protocols: newSubscription.value.protocols,
    healthFactorThreshold: newSubscription.value.healthFactorThreshold,
    webhookUrl: newSubscription.value.webhookUrl,
    isActive: true,
    createdAt: new Date().toISOString()
  }
  subscriptions.value.push(sub)
  showCreateModal.value = false
  newSubscription.value = { address: '', chains: ['ethereum'], protocols: ['aave'], healthFactorThreshold: 1.2, webhookUrl: '' }
}

const deleteSubscription = (id: string) => {
  subscriptions.value = subscriptions.value.filter(s => s.id !== id)
}

onMounted(() => {
  loadPositions()
  loadStats()
})
</script>

<template>
  <div class="liquidation-alert">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">⚠️ Liquidation Alert API</h1>
        <p class="page-subtitle">Cross-chain DeFi liquidation risk monitoring with API services</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showCreateModal = true">
          <span class="btn-icon">+</span>
          Create Alert Subscription
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon" style="background: #3b82f6;">📊</div>
        <div class="stat-info">
          <span class="stat-label">Total Positions</span>
          <span class="stat-value">{{ stats.totalPositions }}</span>
        </div>
      </div>
      <div class="stat-card" :class="{ 'risk': atRiskCount > 0 }">
        <div class="stat-icon" style="background: #ef4444;">⚠️</div>
        <div class="stat-info">
          <span class="stat-label">At Risk</span>
          <span class="stat-value">{{ atRiskCount }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #22c55e;">💰</div>
        <div class="stat-info">
          <span class="stat-label">Total Collateral</span>
          <span class="stat-value">${{ formatNumber(stats.totalCollateralValue) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f59e0b;">🔧</div>
        <div class="stat-info">
          <span class="stat-label">Total Debt</span>
          <span class="stat-value">${{ formatNumber(stats.totalDebtValue) }}</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        class="tab" 
        :class="{ active: activeTab === 'positions' }"
        @click="activeTab = 'positions'"
      >
        📋 Positions
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'subscriptions' }"
        @click="activeTab = 'subscriptions'"
      >
        🔔 Subscriptions
      </button>
      <button 
        class="tab" 
        :class="{ active: activeTab === 'api' }"
        @click="activeTab = 'api'"
      >
        🔌 API Docs
      </button>
    </div>

    <!-- Positions Tab -->
    <div v-if="activeTab === 'positions'" class="tab-content">
      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <input 
            v-model="searchAddress" 
            type="text" 
            placeholder="Search by address..."
            class="search-input"
          />
        </div>
        <select v-model="selectedChain" class="filter-select">
          <option value="">All Chains</option>
          <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
        </select>
        <select v-model="selectedProtocol" class="filter-select">
          <option value="">All Protocols</option>
          <option v-for="protocol in protocols" :key="protocol" :value="protocol">{{ protocol }}</option>
        </select>
        <select v-model="selectedRiskLevel" class="filter-select">
          <option value="">All Risk Levels</option>
          <option v-for="level in riskLevels" :key="level" :value="level">{{ level }}</option>
        </select>
      </div>

      <!-- Risk Distribution Bar -->
      <div class="risk-bar" v-if="stats">
        <div class="risk-segment safe" :style="{ width: (stats.riskDistribution.safe / stats.totalPositions * 100) + '%' }">
          <span>Safe: {{ stats.riskDistribution.safe }}</span>
        </div>
        <div class="risk-segment warning" :style="{ width: (stats.riskDistribution.warning / stats.totalPositions * 100) + '%' }">
          <span>Warning: {{ stats.riskDistribution.warning }}</span>
        </div>
        <div class="risk-segment danger" :style="{ width: (stats.riskDistribution.danger / stats.totalPositions * 100) + '%' }">
          <span>Danger: {{ stats.riskDistribution.danger }}</span>
        </div>
        <div class="risk-segment critical" :style="{ width: (stats.riskDistribution.critical / stats.totalPositions * 100) + '%' }">
          <span>Critical: {{ stats.riskDistribution.critical }}</span>
        </div>
      </div>

      <!-- Positions Table -->
      <div class="positions-table">
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Chain</th>
              <th>Protocol</th>
              <th>Collateral</th>
              <th>Debt</th>
              <th>Health Factor</th>
              <th>Risk Level</th>
              <th>Liq. Bonus</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pos in filteredPositions" :key="pos.id">
              <td class="address-cell">
                <span class="address">{{ formatAddress(pos.address) }}</span>
              </td>
              <td>
                <span class="chain-badge">{{ pos.chain }}</span>
              </td>
              <td>
                <span class="protocol-badge">{{ pos.protocol }}</span>
              </td>
              <td>${{ formatNumber(pos.collateralValue) }}</td>
              <td>${{ formatNumber(pos.debtValue) }}</td>
              <td>
                <span class="health-factor" :class="{ danger: pos.healthFactor < 1 }">
                  {{ pos.healthFactor.toFixed(2) }}
                </span>
              </td>
              <td>
                <span class="risk-badge" :style="{ background: getRiskColor(pos.riskLevel) }">
                  {{ pos.riskLevel }}
                </span>
              </td>
              <td>${{ formatNumber(pos.estimatedLiquidationBonus) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Subscriptions Tab -->
    <div v-if="activeTab === 'subscriptions'" class="tab-content">
      <div v-if="subscriptions.length === 0" class="empty-state">
        <p>No alert subscriptions yet</p>
        <button class="btn btn-primary" @click="showCreateModal = true">Create Your First Alert</button>
      </div>
      <div v-else class="subscriptions-list">
        <div v-for="sub in subscriptions" :key="sub.id" class="subscription-card">
          <div class="sub-header">
            <span class="sub-address">{{ formatAddress(sub.address) }}</span>
            <span class="sub-status" :class="{ active: sub.isActive }">
              {{ sub.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="sub-details">
            <div class="sub-chains">
              <span class="label">Chains:</span>
              <span v-for="chain in sub.chains" :key="chain" class="chain-tag">{{ chain }}</span>
            </div>
            <div class="sub-protocols">
              <span class="label">Protocols:</span>
              <span v-for="protocol in sub.protocols" :key="protocol" class="protocol-tag">{{ protocol }}</span>
            </div>
            <div class="sub-threshold">
              <span class="label">Health Factor Threshold:</span>
              <span class="value">&lt; {{ sub.healthFactorThreshold }}</span>
            </div>
          </div>
          <div class="sub-actions">
            <button class="btn btn-danger btn-sm" @click="deleteSubscription(sub.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- API Docs Tab -->
    <div v-if="activeTab === 'api'" class="tab-content">
      <div class="api-docs">
        <h3>🔌 Liquidation Alert API</h3>
        <p class="api-desc">Standardized REST API for monitoring DeFi liquidation risks across multiple chains.</p>
        
        <div class="api-section">
          <h4>Endpoints</h4>
          
          <div class="api-endpoint">
            <div class="endpoint-header">
              <span class="method GET">GET</span>
              <code>/api/v1/liquidation/positions</code>
            </div>
            <p>Get liquidation positions with optional filtering</p>
            <div class="endpoint-params">
              <span class="param">chain</span>
              <span class="param">protocol</span>
              <span class="param">riskLevel</span>
              <span class="param">minHealthFactor</span>
              <span class="param">limit</span>
              <span class="param">offset</span>
            </div>
          </div>

          <div class="api-endpoint">
            <div class="endpoint-header">
              <span class="method GET">GET</span>
              <code>/api/v1/liquidation/positions/:address</code>
            </div>
            <p>Get positions for a specific wallet address</p>
          </div>

          <div class="api-endpoint">
            <div class="endpoint-header">
              <span class="method GET">GET</span>
              <code>/api/v1/liquidation/opportunities</code>
            </div>
            <p>Get liquidation opportunities (high risk positions)</p>
          </div>

          <div class="api-endpoint">
            <div class="endpoint-header">
              <span class="method POST">POST</span>
              <code>/api/v1/liquidation/subscriptions</code>
            </div>
            <p>Create a new liquidation alert subscription</p>
          </div>

          <div class="api-endpoint">
            <div class="endpoint-header">
              <span class="method GET">GET</span>
              <code>/api/v1/liquidation/stats</code>
            </div>
            <p>Get market statistics for liquidation risk</p>
          </div>
        </div>

        <div class="api-section">
          <h4>Supported Networks</h4>
          <div class="networks-list">
            <span class="network-tag">Ethereum</span>
            <span class="network-tag">Polygon</span>
            <span class="network-tag">Arbitrum</span>
            <span class="network-tag">Optimism</span>
            <span class="network-tag">Base</span>
            <span class="network-tag">Avalanche</span>
          </div>
        </div>

        <div class="api-section">
          <h4>Supported Protocols</h4>
          <div class="protocols-list">
            <span class="protocol-tag-item">Aave</span>
            <span class="protocol-tag-item">Compound</span>
            <span class="protocol-tag-item">Liquity</span>
            <span class="protocol-tag-item">Morpho</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Create Alert Subscription</h3>
          <button class="close-btn" @click="showCreateModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Wallet Address</label>
            <input v-model="newSubscription.address" type="text" placeholder="0x..." />
          </div>
          <div class="form-group">
            <label>Chains</label>
            <div class="checkbox-group">
              <label v-for="chain in chains" :key="chain">
                <input type="checkbox" :value="chain" v-model="newSubscription.chains" />
                {{ chain }}
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Protocols</label>
            <div class="checkbox-group">
              <label v-for="protocol in protocols" :key="protocol">
                <input type="checkbox" :value="protocol" v-model="newSubscription.protocols" />
                {{ protocol }}
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Health Factor Threshold</label>
            <input v-model.number="newSubscription.healthFactorThreshold" type="number" step="0.1" min="0.5" max="2" />
          </div>
          <div class="form-group">
            <label>Webhook URL (Optional)</label>
            <input v-model="newSubscription.webhookUrl" type="text" placeholder="https://..." />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">Cancel</button>
          <button class="btn btn-primary" @click="createSubscription">Create Subscription</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.liquidation-alert {
  padding: 24px;
  background: #0f172a;
  min-height: 100vh;
  color: #e2e8f0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #ef4444, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  color: #94a3b8;
  margin: 8px 0 0;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.btn-secondary {
  background: #334155;
  color: white;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card.risk {
  border: 2px solid #ef4444;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-label {
  display: block;
  color: #94a3b8;
  font-size: 14px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #334155;
  padding-bottom: 8px;
}

.tab {
  padding: 12px 24px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s;
}

.tab:hover {
  background: #1e293b;
  color: white;
}

.tab.active {
  background: #ef4444;
  color: white;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input, .filter-select {
  padding: 10px 16px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: white;
  font-size: 14px;
}

.search-input {
  flex: 1;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #ef4444;
}

.risk-bar {
  display: flex;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.risk-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.risk-segment.safe { background: #22c55e; }
.risk-segment.warning { background: #f59e0b; }
.risk-segment.danger { background: #ef4444; }
.risk-segment.critical { background: #991b1b; }

.positions-table {
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #334155;
}

th {
  background: #0f172a;
  font-weight: 600;
  color: #94a3b8;
  font-size: 12px;
  text-transform: uppercase;
}

td {
  font-size: 14px;
}

.address {
  font-family: monospace;
  color: #60a5fa;
}

.chain-badge, .protocol-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.chain-badge {
  background: #1e40af;
  color: #93c5fd;
}

.protocol-badge {
  background: #7c3aed;
  color: #ddd6fe;
}

.health-factor {
  font-weight: 600;
}

.health-factor.danger {
  color: #ef4444;
}

.risk-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 48px;
  color: #94a3b8;
}

.subscriptions-list {
  display: grid;
  gap: 16px;
}

.subscription-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.sub-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sub-address {
  font-family: monospace;
  font-size: 16px;
  color: #60a5fa;
}

.sub-status {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  background: #334155;
}

.sub-status.active {
  background: #22c55e;
}

.sub-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.sub-details .label {
  color: #94a3b8;
  margin-right: 8px;
}

.chain-tag, .protocol-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #334155;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 4px;
  text-transform: capitalize;
}

.api-docs {
  background: #1e293b;
  border-radius: 12px;
  padding: 24px;
}

.api-docs h3 {
  margin: 0 0 8px;
}

.api-desc {
  color: #94a3b8;
  margin-bottom: 24px;
}

.api-section {
  margin-bottom: 24px;
}

.api-section h4 {
  margin: 0 0 16px;
  color: #60a5fa;
}

.api-endpoint {
  background: #0f172a;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.endpoint-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.method {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
}

.method.GET { background: #22c55e; color: white; }
.method.POST { background: #3b82f6; color: white; }
.method.PUT { background: #f59e0b; color: white; }
.method.DELETE { background: #ef4444; color: white; }

code {
  font-family: monospace;
  color: #e2e8f0;
}

.endpoint-params {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.param {
  padding: 2px 8px;
  background: #334155;
  border-radius: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.networks-list, .protocols-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.network-tag, .protocol-tag-item {
  padding: 8px 16px;
  background: #334155;
  border-radius: 8px;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1e293b;
  border-radius: 16px;
  width: 500px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #334155;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #94a3b8;
}

.form-group input {
  width: 100%;
  padding: 10px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: white;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #334155;
}
</style>
