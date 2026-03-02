<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { 
  getNetworkStatuses, 
  getNetworkStats, 
  getNetworkAlerts,
  getTrendingNetworks,
  getCheapestNetworks,
  getFastestNetworks,
  type NetworkStatus, 
  type NetworkStats, 
  type NetworkAlert 
} from '@/service/api/web3'

const activeTab = ref<'overview' | 'networks' | 'alerts' | 'compare'>('overview')
const networks = ref<NetworkStatus[]>([])
const stats = ref<NetworkStats | null>(null)
const alerts = ref<NetworkAlert[]>([])
const trending = ref<NetworkStatus[]>([])
const cheapest = ref<NetworkStatus[]>([])
const fastest = ref<NetworkStatus[]>([])
const loading = ref(true)
const error = ref('')
const selectedNetworks = ref<number[]>([])
const compareNetworks = ref<NetworkStatus[]>([])
let refreshInterval: number | null = null

const fetchData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [networksData, statsData, alertsData, trendingData, cheapestData, fastestData] = await Promise.all([
      getNetworkStatuses(),
      getNetworkStats(),
      getNetworkAlerts(),
      getTrendingNetworks(),
      getCheapestNetworks(),
      getFastestNetworks()
    ])
    networks.value = networksData
    stats.value = statsData
    alerts.value = alertsData
    trending.value = trendingData
    cheapest.value = cheapestData
    fastest.value = fastestData
  } catch (e: any) {
    console.error('Failed to fetch network status:', e)
    error.value = e.message || 'Failed to fetch data'
    // Use mock data as fallback
    networks.value = generateMockNetworks()
    stats.value = generateMockStats()
    alerts.value = generateMockAlerts()
    trending.value = networks.value.slice(0, 5)
    cheapest.value = [...networks.value].sort((a, b) => a.gasPriceGwei - b.gasPriceGwei).slice(0, 5)
    fastest.value = [...networks.value].sort((a, b) => a.avgBlockTime - b.avgBlockTime).slice(0, 5)
  } finally {
    loading.value = false
  }
}

const generateMockNetworks = (): NetworkStatus[] => {
  return [
    { chainId: 1, chainName: 'Ethereum', symbol: 'ETH', status: 'healthy', blockNumber: 19200000, blockTime: 12, gasPrice: 25000000000, gasPriceGwei: 25, tps: 15, avgBlockTime: 12.1, lastBlockTime: Date.now() - 8000, uptime: 99.98, latency: 120, validators: 890000, activeValidators: 875000, pendingTransactions: 150000, chainLogo: '🟣', color: '#627EEA', features: ['EVM', 'PoS', 'L2'] },
    { chainId: 42161, chainName: 'Arbitrum One', symbol: 'ETH', status: 'healthy', blockNumber: 185000000, blockTime: 0.25, gasPrice: 100000000, gasPriceGwei: 0.1, tps: 50, avgBlockTime: 0.26, lastBlockTime: Date.now() - 200, uptime: 99.95, latency: 45, validators: 100, activeValidators: 98, pendingTransactions: 5000, chainLogo: '🔵', color: '#28A0F0', features: ['Arbitrum', 'Rollup', 'L2'] },
    { chainId: 10, chainName: 'Optimism', symbol: 'ETH', status: 'healthy', blockNumber: 115000000, blockTime: 2, gasPrice: 2000000000, gasPriceGwei: 2, tps: 30, avgBlockTime: 2.1, lastBlockTime: Date.now() - 1500, uptime: 99.92, latency: 80, validators: 50, activeValidators: 49, pendingTransactions: 8000, chainLogo: '🔴', color: '#FF0420', features: ['Optimism', 'Rollup', 'L2'] },
    { chainId: 137, chainName: 'Polygon', symbol: 'MATIC', status: 'healthy', blockNumber: 55000000, blockTime: 2.1, gasPrice: 35000000000, gasPriceGwei: 35, tps: 45, avgBlockTime: 2.2, lastBlockTime: Date.now() - 1800, uptime: 99.99, latency: 35, validators: 100, activeValidators: 100, pendingTransactions: 3000, chainLogo: '🟣', color: '#8247E5', features: ['PoS', 'L2', 'Plasma'] },
    { chainId: 56, chainName: 'BSC', symbol: 'BNB', status: 'healthy', blockNumber: 35000000, blockTime: 3, gasPrice: 3000000000, gasPriceGwei: 3, tps: 120, avgBlockTime: 3.1, lastBlockTime: Date.now() - 2500, uptime: 99.90, latency: 25, validators: 21, activeValidators: 21, pendingTransactions: 50000, chainLogo: '🟡', color: '#F3BA2F', features: ['PoSA', 'EVM'] },
    { chainId: 8453, chainName: 'Base', symbol: 'ETH', status: 'healthy', blockNumber: 15000000, blockTime: 2, gasPrice: 500000000, gasPriceGwei: 0.5, tps: 20, avgBlockTime: 2.0, lastBlockTime: Date.now() - 1500, uptime: 99.97, latency: 40, validators: 10, activeValidators: 10, pendingTransactions: 2000, chainLogo: '🔵', color: '#0052FF', features: ['Base', 'L2', 'OP Stack'] },
    { chainId: 43114, chainName: 'Avalanche', symbol: 'AVAX', status: 'healthy', blockNumber: 40000000, blockTime: 0.9, gasPrice: 25000000000, gasPriceGwei: 25, tps: 8, avgBlockTime: 0.95, lastBlockTime: Date.now() - 800, uptime: 99.95, latency: 50, validators: 1200, activeValidators: 1180, pendingTransactions: 1000, chainLogo: '🟢', color: '#E84142', features: ['Snowman', 'PoS'] },
    { chainId: 1101, chainName: 'zkEVM', symbol: 'ETH', status: 'healthy', blockNumber: 8000000, blockTime: 1, gasPrice: 5000000000, gasPriceGwei: 5, tps: 25, avgBlockTime: 1.1, lastBlockTime: Date.now() - 900, uptime: 99.88, latency: 60, validators: 30, activeValidators: 29, pendingTransactions: 1500, chainLogo: '⚫', color: '#5C6BC0', features: ['zkEVM', 'L2', 'ZK-Rollup'] },
    { chainId: 324, chainName: 'zkSync Era', symbol: 'ETH', status: 'healthy', blockNumber: 45000000, blockTime: 1, gasPrice: 3000000000, gasPriceGwei: 3, tps: 35, avgBlockTime: 1.05, lastBlockTime: Date.now() - 900, uptime: 99.85, latency: 55, validators: 20, activeValidators: 19, pendingTransactions: 2500, chainLogo: '⚡', color: '#8B5CF6', features: ['zkSync', 'L2', 'ZK-Rollup'] },
    { chainId: 5000, chainName: 'Mantle', symbol: 'MNT', status: 'healthy', blockNumber: 25000000, blockTime: 2, gasPrice: 1000000000, gasPriceGwei: 1, tps: 40, avgBlockTime: 2.0, lastBlockTime: Date.now() - 1500, uptime: 99.92, latency: 42, validators: 50, activeValidators: 49, pendingTransactions: 3000, chainLogo: '🟢', color: '#05B8CC', features: ['Mantle', 'L2', 'Modular'] },
    { chainId: 11155111, chainName: 'Sepolia', symbol: 'ETH', status: 'healthy', blockNumber: 5000000, blockTime: 12, gasPrice: 1000000000, gasPriceGwei: 1, tps: 5, avgBlockTime: 12.5, lastBlockTime: Date.now() - 10000, uptime: 99.50, latency: 150, validators: 5000, activeValidators: 4800, pendingTransactions: 100, chainLogo: '🧪', color: '#A855F7', features: ['Testnet', 'PoS'] },
    { chainId: 5, chainName: 'Goerli', symbol: 'ETH', status: 'degraded', blockNumber: 10000000, blockTime: 15, gasPrice: 5000000000, gasPriceGwei: 5, tps: 2, avgBlockTime: 18, lastBlockTime: Date.now() - 25000, uptime: 97.00, latency: 300, validators: 1000, activeValidators: 700, pendingTransactions: 50, chainLogo: '🧪', color: '#FCD34D', features: ['Testnet', 'PoS', 'Deprecated'] }
  ]
}

const generateMockStats = (): NetworkStats => ({
  totalChains: 12,
  healthyChains: 11,
  degradedChains: 1,
  downChains: 0,
  avgGasPrice: 10.5,
  totalTps: 348,
  totalValidators: 903079
})

const generateMockAlerts = (): NetworkAlert[] => [
  { id: '1', chainId: 5, chainName: 'Goerli', type: 'upgrade', severity: 'medium', message: 'Goerli testnet is deprecated. Users should migrate to Sepolia or Holesky.', timestamp: Date.now() - 86400000 * 2, resolved: false },
  { id: '2', chainId: 1, chainName: 'Ethereum', type: 'gas_spike', severity: 'low', message: 'Gas prices are slightly elevated due to increased DeFi activity.', timestamp: Date.now() - 3600000, resolved: true },
  { id: '3', chainId: 42161, chainName: 'Arbitrum', type: 'upgrade', severity: 'low', message: 'Scheduled upgrade in 48 hours. Expect brief downtime.', timestamp: Date.now() - 7200000, resolved: false }
]

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy': return '#22c55e'
    case 'degraded': return '#f59e0b'
    case 'down': return '#ef4444'
    default: return '#6b7280'
  }
}

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return '#ef4444'
    case 'high': return '#f97316'
    case 'medium': return '#f59e0b'
    case 'low': return '#3b82f6'
    default: return '#6b7280'
  }
}

const toggleNetworkSelection = (chainId: number) => {
  const index = selectedNetworks.value.indexOf(chainId)
  if (index === -1) {
    if (selectedNetworks.value.length < 4) {
      selectedNetworks.value.push(chainId)
    }
  } else {
    selectedNetworks.value.splice(index, 1)
  }
  compareNetworks.value = networks.value.filter(n => selectedNetworks.value.includes(n.chainId))
}

onMounted(() => {
  fetchData()
  refreshInterval = window.setInterval(fetchData, 30000) // Refresh every 30 seconds
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<template>
  <div class="network-status-monitor">
    <!-- Header Stats -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Networks</div>
        <div class="stat-value">{{ stats.totalChains }}</div>
      </div>
      <div class="stat-card healthy">
        <div class="stat-label">Healthy</div>
        <div class="stat-value">{{ stats.healthyChains }}</div>
      </div>
      <div class="stat-card degraded">
        <div class="stat-label">Degraded</div>
        <div class="stat-value">{{ stats.degradedChains }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total TPS</div>
        <div class="stat-value">{{ formatNumber(stats.totalTps) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Gas (Gwei)</div>
        <div class="stat-value">{{ stats.avgGasPrice.toFixed(2) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Validators</div>
        <div class="stat-value">{{ formatNumber(stats.totalValidators) }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="['tab', { active: activeTab === 'overview' }]"
        @click="activeTab = 'overview'"
      >
        📊 Overview
      </button>
      <button 
        :class="['tab', { active: activeTab === 'networks' }]"
        @click="activeTab = 'networks'"
      >
        🌐 Networks
      </button>
      <button 
        :class="['tab', { active: activeTab === 'alerts' }]"
        @click="activeTab = 'alerts'"
      >
        🔔 Alerts ({{ alerts.filter(a => !a.resolved).length }})
      </button>
      <button 
        :class="['tab', { active: activeTab === 'compare' }]"
        @click="activeTab = 'compare'"
      >
        ⚖️ Compare
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Loading network status...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      ⚠️ {{ error }}
      <button @click="fetchData">Retry</button>
    </div>

    <!-- Overview Tab -->
    <div v-else-if="activeTab === 'overview'" class="overview">
      <!-- Quick Rankings -->
      <div class="rankings">
        <div class="ranking-card">
          <h3>🔥 Trending by TPS</h3>
          <div class="ranking-list">
            <div v-for="(network, index) in trending" :key="network.chainId" class="ranking-item">
              <span class="rank">#{{ index + 1 }}</span>
              <span class="chain-logo">{{ network.chainLogo }}</span>
              <span class="chain-name">{{ network.chainName }}</span>
              <span class="rank-value">{{ network.tps }} TPS</span>
            </div>
          </div>
        </div>
        
        <div class="ranking-card">
          <h3>💰 Cheapest Gas</h3>
          <div class="ranking-list">
            <div v-for="(network, index) in cheapest" :key="network.chainId" class="ranking-item">
              <span class="rank">#{{ index + 1 }}</span>
              <span class="chain-logo">{{ network.chainLogo }}</span>
              <span class="chain-name">{{ network.chainName }}</span>
              <span class="rank-value">{{ network.gasPriceGwei }} Gwei</span>
            </div>
          </div>
        </div>
        
        <div class="ranking-card">
          <h3>⚡ Fastest Block Time</h3>
          <div class="ranking-list">
            <div v-for="(network, index) in fastest" :key="network.chainId" class="ranking-item">
              <span class="rank">#{{ index + 1 }}</span>
              <span class="chain-logo">{{ network.chainLogo }}</span>
              <span class="chain-name">{{ network.chainName }}</span>
              <span class="rank-value">{{ network.avgBlockTime.toFixed(2) }}s</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Grid -->
      <div class="network-grid">
        <div 
          v-for="network in networks" 
          :key="network.chainId"
          class="network-card"
          :style="{ borderColor: getStatusColor(network.status) }"
        >
          <div class="network-header">
            <span class="chain-logo">{{ network.chainLogo }}</span>
            <span class="chain-name">{{ network.chainName }}</span>
            <span 
              class="status-badge"
              :style="{ backgroundColor: getStatusColor(network.status) }"
            >
              {{ network.status }}
            </span>
          </div>
          
          <div class="network-stats">
            <div class="network-stat">
              <span class="label">Block</span>
              <span class="value">#{{ formatNumber(network.blockNumber) }}</span>
            </div>
            <div class="network-stat">
              <span class="label">Gas</span>
              <span class="value">{{ network.gasPriceGwei }} Gwei</span>
            </div>
            <div class="network-stat">
              <span class="label">TPS</span>
              <span class="value">{{ network.tps }}</span>
            </div>
            <div class="network-stat">
              <span class="label">Uptime</span>
              <span class="value">{{ network.uptime }}%</span>
            </div>
          </div>
          
          <div class="network-features">
            <span v-for="feature in network.features" :key="feature" class="feature-tag">
              {{ feature }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Networks Tab -->
    <div v-else-if="activeTab === 'networks'" class="networks-list">
      <table class="networks-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Network</th>
            <th>Block</th>
            <th>Gas (Gwei)</th>
            <th>TPS</th>
            <th>Block Time</th>
            <th>Uptime</th>
            <th>Latency</th>
            <th>Validators</th>
            <th>Pending TX</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="network in networks" :key="network.chainId">
            <td>
              <span 
                class="status-dot"
                :style="{ backgroundColor: getStatusColor(network.status) }"
              ></span>
              {{ network.status }}
            </td>
            <td>
              <span class="chain-logo">{{ network.chainLogo }}</span>
              {{ network.chainName }}
            </td>
            <td>#{{ formatNumber(network.blockNumber) }}</td>
            <td>{{ network.gasPriceGwei }}</td>
            <td>{{ network.tps }}</td>
            <td>{{ network.avgBlockTime.toFixed(2) }}s</td>
            <td>{{ network.uptime }}%</td>
            <td>{{ network.latency }}ms</td>
            <td>{{ formatNumber(network.activeValidators) }}</td>
            <td>{{ formatNumber(network.pendingTransactions) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Alerts Tab -->
    <div v-else-if="activeTab === 'alerts'" class="alerts-list">
      <div 
        v-for="alert in alerts" 
        :key="alert.id"
        class="alert-card"
        :class="{ resolved: alert.resolved }"
      >
        <div class="alert-header">
          <span 
            class="severity-badge"
            :style="{ backgroundColor: getSeverityColor(alert.severity) }"
          >
            {{ alert.severity }}
          </span>
          <span class="alert-type">{{ alert.type.replace('_', ' ') }}</span>
          <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
          <span v-if="alert.resolved" class="resolved-badge">✓ Resolved</span>
        </div>
        <div class="alert-content">
          <strong>{{ alert.chainName }}</strong>: {{ alert.message }}
        </div>
      </div>
    </div>

    <!-- Compare Tab -->
    <div v-else-if="activeTab === 'compare'" class="compare-view">
      <div class="compare-selection">
        <h3>Select Networks to Compare (max 4)</h3>
        <div class="network-select">
          <button 
            v-for="network in networks" 
            :key="network.chainId"
            :class="['select-btn', { selected: selectedNetworks.includes(network.chainId) }]"
            @click="toggleNetworkSelection(network.chainId)"
          >
            {{ network.chainLogo }} {{ network.chainName }}
          </button>
        </div>
      </div>

      <div v-if="compareNetworks.length > 0" class="compare-grid">
        <div 
          v-for="network in compareNetworks" 
          :key="network.chainId"
          class="compare-card"
        >
          <div class="compare-header">
            <span class="chain-logo">{{ network.chainLogo }}</span>
            <span class="chain-name">{{ network.chainName }}</span>
          </div>
          <div class="compare-stats">
            <div class="compare-stat">
              <span class="label">Status</span>
              <span 
                class="value"
                :style="{ color: getStatusColor(network.status) }"
              >
                {{ network.status }}
              </span>
            </div>
            <div class="compare-stat">
              <span class="label">Gas Price</span>
              <span class="value">{{ network.gasPriceGwei }} Gwei</span>
            </div>
            <div class="compare-stat">
              <span class="label">TPS</span>
              <span class="value">{{ network.tps }}</span>
            </div>
            <div class="compare-stat">
              <span class="label">Block Time</span>
              <span class="value">{{ network.avgBlockTime.toFixed(2) }}s</span>
            </div>
            <div class="compare-stat">
              <span class="label">Uptime</span>
              <span class="value">{{ network.uptime }}%</span>
            </div>
            <div class="compare-stat">
              <span class="label">Latency</span>
              <span class="value">{{ network.latency }}ms</span>
            </div>
            <div class="compare-stat">
              <span class="label">Validators</span>
              <span class="value">{{ formatNumber(network.activeValidators) }}</span>
            </div>
            <div class="compare-stat">
              <span class="label">Pending TX</span>
              <span class="value">{{ formatNumber(network.pendingTransactions) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="compare-empty">
        Select networks above to compare
      </div>
    </div>
  </div>
</template>

<style scoped>
.network-status-monitor {
  padding: 16px;
  background: #1a1a2e;
  min-height: 100vh;
  color: #e0e0e0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: #16213e;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  border: 1px solid #0f3460;
}

.stat-card.healthy {
  border-color: #22c55e;
}

.stat-card.degraded {
  border-color: #f59e0b;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab {
  padding: 8px 16px;
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 6px;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  background: #1f3460;
}

.tab.active {
  background: #0f3460;
  color: #fff;
  border-color: #3b82f6;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #0f3460;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  background: #3b1f1f;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 16px;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error button {
  background: #ef4444;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.rankings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.ranking-card {
  background: #16213e;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #0f3460;
}

.ranking-card h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #888;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #0f3460;
  border-radius: 4px;
}

.rank {
  font-size: 12px;
  color: #888;
  min-width: 24px;
}

.chain-logo {
  font-size: 16px;
}

.chain-name {
  flex: 1;
  font-size: 13px;
}

.rank-value {
  font-size: 13px;
  font-weight: bold;
  color: #3b82f6;
}

.network-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.network-card {
  background: #16213e;
  border-radius: 8px;
  padding: 12px;
  border: 2px solid #0f3460;
}

.network-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.network-header .chain-name {
  flex: 1;
  font-weight: bold;
}

.status-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
  text-transform: uppercase;
}

.network-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.network-stat {
  background: #0f3460;
  padding: 6px 8px;
  border-radius: 4px;
}

.network-stat .label {
  font-size: 10px;
  color: #888;
  display: block;
}

.network-stat .value {
  font-size: 13px;
  font-weight: bold;
}

.network-features {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.feature-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: #1f3460;
  border-radius: 3px;
  color: #888;
}

.networks-table {
  width: 100%;
  border-collapse: collapse;
  background: #16213e;
  border-radius: 8px;
  overflow: hidden;
}

.networks-table th,
.networks-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #0f3460;
}

.networks-table th {
  background: #0f3460;
  font-size: 12px;
  color: #888;
}

.networks-table td {
  font-size: 13px;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card {
  background: #16213e;
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid #f59e0b;
}

.alert-card.resolved {
  opacity: 0.6;
  border-left-color: #22c55e;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.severity-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
  text-transform: uppercase;
}

.alert-type {
  font-size: 12px;
  color: #888;
  text-transform: capitalize;
}

.alert-time {
  font-size: 12px;
  color: #666;
  margin-left: auto;
}

.resolved-badge {
  font-size: 11px;
  color: #22c55e;
}

.alert-content {
  font-size: 13px;
  color: #ccc;
}

.compare-view {
  padding: 16px;
}

.compare-selection {
  margin-bottom: 20px;
}

.compare-selection h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #888;
}

.network-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.select-btn {
  padding: 8px 12px;
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 6px;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s;
}

.select-btn:hover {
  background: #1f3460;
}

.select-btn.selected {
  background: #0f3460;
  color: #fff;
  border-color: #3b82f6;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.compare-card {
  background: #16213e;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #0f3460;
}

.compare-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #0f3460;
}

.compare-header .chain-name {
  font-weight: bold;
  font-size: 16px;
}

.compare-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compare-stat {
  display: flex;
  justify-content: space-between;
}

.compare-stat .label {
  font-size: 12px;
  color: #888;
}

.compare-stat .value {
  font-size: 13px;
  font-weight: bold;
}

.compare-empty {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #16213e;
  border-radius: 8px;
}
</style>
