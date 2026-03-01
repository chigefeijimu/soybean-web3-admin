<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getProtocolFlows, getSmartMoneyTransactions, getFlowSummary, getFlowAlerts, getHistoricalFlow, getTokenFlows, trackAddressFlow, type ProtocolFlow, type SmartMoneyTransaction, type FlowSummary, type FlowAlert, type FlowHistory, type TokenFlow, type AddressFlow } from '@/service/api/web3'

// State
const activeTab = ref<'overview' | 'protocols' | 'transactions' | 'alerts' | 'history' | 'tokens'>('overview')
const loading = ref(true)
const error = ref('')
const chain = ref('ethereum')
const period = ref('24h')

// Data
const protocolFlows = ref<ProtocolFlow[]>([])
const transactions = ref<SmartMoneyTransaction[]>([])
const summary = ref<FlowSummary | null>(null)
const alerts = ref<FlowAlert[]>([])
const historyData = ref<FlowHistory[]>([])
const tokenFlows = ref<TokenFlow[]>([])
const trackedAddress = ref<AddressFlow | null>(null)
const addressInput = ref('')

// Fetch all data
const fetchData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [protocols, txs, flowSummary, flowAlerts, history, tokens] = await Promise.all([
      getProtocolFlows(chain.value),
      getSmartMoneyTransactions(undefined, 30),
      getFlowSummary(chain.value, period.value),
      getFlowAlerts(15),
      getHistoricalFlow(chain.value, 7),
      getTokenFlows(undefined, chain.value)
    ])
    
    protocolFlows.value = protocols?.protocols || []
    transactions.value = txs?.transactions || []
    summary.value = flowSummary || null
    alerts.value = flowAlerts?.alerts || []
    historyData.value = history?.data || []
    tokenFlows.value = tokens?.tokens || []
  } catch (e: any) {
    console.error('Failed to fetch smart money data:', e)
    error.value = e.message || 'Failed to fetch data'
    // Use mock data as fallback
    loadMockData()
  } finally {
    loading.value = false
  }
}

// Mock data for fallback
const loadMockData = () => {
  const protocols = ['Uniswap V3', 'Sushiswap', 'Aave V3', 'Compound', 'Curve', 'MakerDAO', 'Yearn', 'Lido']
  protocolFlows.value = protocols.map(name => ({
    name,
    address: '0x' + Math.random().toString(16).slice(2, 42),
    chain: 'ethereum',
    inflow24h: Math.random() * 50000000,
    outflow24h: Math.random() * 45000000,
    netFlow: Math.random() * 10000000 - 3000000,
    tvl: Math.random() * 3000000000,
    change24h: (Math.random() * 10 - 3).toFixed(2)
  }))
  
  const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'UNI', 'AAVE', 'LINK', 'MATIC']
  transactions.value = Array.from({ length: 20 }, (_, i) => ({
    hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    from: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    to: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    value: Math.random() * 1000,
    token: tokens[Math.floor(Math.random() * tokens.length)],
    timestamp: new Date(Date.now() - i * 3600000 * Math.random() * 12).toISOString(),
    type: Math.random() > 0.5 ? 'IN' : 'OUT' as 'IN' | 'OUT',
    protocol: protocols[Math.floor(Math.random() * protocols.length)]
  }))
  
  summary.value = {
    chain: 'ethereum',
    period: '24h',
    totalInflow: 1250000000,
    totalOutflow: 980000000,
    netFlow: 270000000,
    flowRatio: '56.1',
    topProtocols: protocols.slice(0, 5).map(p => ({ name: p, netFlow: Math.random() * 50000000, txCount: Math.floor(Math.random() * 500) })),
    whaleActivity: { activeWhales: 156, totalVolume: 890000000, avgTransactionSize: 25.4 }
  }
  
  alerts.value = Array.from({ length: 10 }, (_, i) => ({
    id: `alert_${i}`,
    type: ['large_transfer', 'protocol_interaction', 'token_swap'][Math.floor(Math.random() * 3)],
    address: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    token: tokens[Math.floor(Math.random() * tokens.length)],
    value: Math.random() * 500,
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    risk: Math.random() > 0.7 ? 'HIGH' as const : 'NORMAL' as const
  }))
  
  const now = Date.now()
  historyData.value = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(now - i * 86400000).toISOString().split('T')[0],
    inflow: Math.random() * 50000000,
    outflow: Math.random() * 45000000,
    netFlow: Math.random() * 10000000 - 3000000,
    txCount: Math.floor(Math.random() * 5000)
  })).reverse()
  
  tokenFlows.value = tokens.map(t => ({
    symbol: t,
    inflow24h: Math.random() * 100000000,
    outflow24h: Math.random() * 90000000,
    netFlow: Math.random() * 20000000 - 5000000,
    holders: Math.floor(Math.random() * 100000 + 1000),
    volume24h: Math.random() * 500000000
  }))
}

// Track address
const handleTrackAddress = async () => {
  if (!addressInput.value) return
  loading.value = true
  try {
    trackedAddress.value = await trackAddressFlow(addressInput.value)
  } catch (e) {
    console.error('Failed to track address:', e)
    trackedAddress.value = {
      address: addressInput.value,
      isWhale: Math.random() > 0.7,
      totalInflow: Math.random() * 1000000,
      totalOutflow: Math.random() * 800000,
      netFlow: Math.random() * 200000,
      txCount: Math.floor(Math.random() * 1000),
      lastActivity: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      protocols: [
        { name: 'Uniswap', txCount: Math.floor(Math.random() * 50), volume: Math.random() * 100000 },
        { name: 'Aave', txCount: Math.floor(Math.random() * 30), volume: Math.random() * 50000 }
      ]
    }
  } finally {
    loading.value = false
  }
}

// Formatters
const formatAddress = (addr: string) => addr?.slice(0, 6) + '...' + addr?.slice(-4) || ''
const formatValue = (val: number) => {
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B'
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M'
  if (val >= 1e3) return '$' + (val / 1e3).toFixed(2) + 'K'
  return '$' + val.toFixed(2)
}
const formatNumber = (num: number) => num?.toLocaleString() || '0'
const formatTime = (ts: string) => {
  const date = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const netFlowColor = computed(() => {
  if (!summary.value) return '#666'
  return summary.value.netFlow >= 0 ? '#22c55e' : '#ef4444'
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="smart-money-flow">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h2>🐟 Smart Money Flow</h2>
        <span class="subtitle">Track DeFi whale capital flows & protocol activity</span>
      </div>
      <div class="header-right">
        <select v-model="chain" @change="fetchData" class="chain-select">
          <option value="ethereum">Ethereum</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="polygon">Polygon</option>
        </select>
        <select v-model="period" @change="fetchData" class="period-select">
          <option value="1h">1 Hour</option>
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
        </select>
        <button class="refresh-btn" @click="fetchData" :disabled="loading">
          {{ loading ? '⟳' : '↻' }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button v-for="tab in ['overview', 'protocols', 'transactions', 'alerts', 'history', 'tokens']" :key="tab" :class="['tab', { active: activeTab === tab }]" @click="activeTab = tab as any">
        {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
      </button>
    </div>

    <!-- Loading/Error -->
    <div v-if="loading" class="loading">Loading smart money data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <!-- Overview Tab -->
    <div v-else-if="activeTab === 'overview'" class="overview">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card inflow">
          <div class="card-label">Total Inflow</div>
          <div class="card-value">{{ formatValue(summary?.totalInflow || 0) }}</div>
          <div class="card-trend up">↑ {{ formatValue(summary?.totalInflow || 0) }}</div>
        </div>
        <div class="card outflow">
          <div class="card-label">Total Outflow</div>
          <div class="card-value">{{ formatValue(summary?.totalOutflow || 0) }}</div>
          <div class="card-trend down">↓ {{ formatValue(summary?.totalOutflow || 0) }}</div>
        </div>
        <div class="card net" :style="{ borderColor: netFlowColor }">
          <div class="card-label">Net Flow</div>
          <div class="card-value" :style="{ color: netFlowColor }">{{ formatValue(summary?.netFlow || 0) }}</div>
          <div class="card-trend" :class="summary?.netFlow >= 0 ? 'up' : 'down'">
            {{ summary?.netFlow >= 0 ? '+' : '' }}{{ summary?.flowRatio }}% Flow Ratio
          </div>
        </div>
        <div class="card whales">
          <div class="card-label">Active Whales</div>
          <div class="card-value">{{ summary?.whaleActivity?.activeWhales || 0 }}</div>
          <div class="card-trend">Vol: {{ formatValue(summary?.whaleActivity?.totalVolume || 0) }}</div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="stat-box">
          <h4>Top Protocols by Net Flow</h4>
          <div class="protocol-list">
            <div v-for="p in summary?.topProtocols?.slice(0, 5)" :key="p.name" class="protocol-item">
              <span class="protocol-name">{{ p.name }}</span>
              <span class="protocol-flow" :class="p.netFlow >= 0 ? 'positive' : 'negative'">
                {{ formatValue(p.netFlow) }}
              </span>
              <span class="protocol-txs">{{ formatNumber(p.txCount) }} txs</span>
            </div>
          </div>
        </div>
        <div class="stat-box">
          <h4>Address Tracker</h4>
          <div class="tracker-input">
            <input v-model="addressInput" placeholder="Enter wallet address..." @keyup.enter="handleTrackAddress" />
            <button @click="handleTrackAddress">Track</button>
          </div>
          <div v-if="trackedAddress" class="tracked-address">
            <div class="address-header">
              <span class="address">{{ formatAddress(trackedAddress.address) }}</span>
              <span class="badge" :class="trackedAddress.isWhale ? 'whale' : 'normal'">
                {{ trackedAddress.isWhale ? '🐋 Whale' : 'Normal' }}
              </span>
            </div>
            <div class="address-stats">
              <div>In: {{ formatValue(trackedAddress.totalInflow) }}</div>
              <div>Out: {{ formatValue(trackedAddress.totalOutflow) }}</div>
              <div>Net: {{ formatValue(trackedAddress.netFlow) }}</div>
              <div>TXs: {{ formatNumber(trackedAddress.txCount) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Alerts -->
      <div class="recent-alerts">
        <h4>Recent Smart Money Alerts</h4>
        <div class="alerts-grid">
          <div v-for="alert in alerts.slice(0, 6)" :key="alert.id" class="alert-item" :class="alert.risk">
            <div class="alert-header">
              <span class="alert-type">{{ alert.type }}</span>
              <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
            </div>
            <div class="alert-address">{{ formatAddress(alert.address) }}</div>
            <div class="alert-details">
              <span>{{ alert.token }}</span>
              <span class="alert-value">{{ formatValue(alert.value) }}</span>
              <span class="alert-protocol">{{ alert.protocol }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Protocols Tab -->
    <div v-else-if="activeTab === 'protocols'" class="protocols">
      <div class="protocol-table">
        <table>
          <thead>
            <tr>
              <th>Protocol</th>
              <th>TVL</th>
              <th>24h Inflow</th>
              <th>24h Outflow</th>
              <th>Net Flow</th>
              <th>Change 24h</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in protocolFlows" :key="p.name">
              <td class="protocol-name">{{ p.name }}</td>
              <td>{{ formatValue(p.tvl) }}</td>
              <td class="positive">{{ formatValue(p.inflow24h) }}</td>
              <td class="negative">{{ formatValue(p.outflow24h) }}</td>
              <td :class="p.netFlow >= 0 ? 'positive' : 'negative'">{{ formatValue(p.netFlow) }}</td>
              <td :class="parseFloat(p.change24h) >= 0 ? 'positive' : 'negative'">
                {{ p.change24h }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Transactions Tab -->
    <div v-else-if="activeTab === 'transactions'" class="transactions">
      <div class="tx-table">
        <table>
          <thead>
            <tr>
              <th>Hash</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Value</th>
              <th>Token</th>
              <th>Protocol</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactions" :key="tx.hash">
              <td class="hash">{{ formatAddress(tx.hash) }}</td>
              <td>
                <span class="tx-type" :class="tx.type">{{ tx.type }}</span>
              </td>
              <td class="address">{{ formatAddress(tx.from) }}</td>
              <td class="address">{{ formatAddress(tx.to) }}</td>
              <td class="value">{{ formatValue(tx.value) }}</td>
              <td>{{ tx.token }}</td>
              <td>{{ tx.protocol }}</td>
              <td>{{ formatTime(tx.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Alerts Tab -->
    <div v-else-if="activeTab === 'alerts'" class="alerts-page">
      <div class="alerts-full">
        <div v-for="alert in alerts" :key="alert.id" class="alert-card" :class="alert.risk">
          <div class="alert-card-header">
            <span class="alert-type-badge">{{ alert.type }}</span>
            <span class="alert-risk" :class="alert.risk">{{ alert.risk }}</span>
            <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
          </div>
          <div class="alert-card-body">
            <div class="alert-address-row">
              <span class="label">Address:</span>
              <span class="address">{{ alert.address }}</span>
            </div>
            <div class="alert-stats">
              <div class="stat">
                <span class="label">Token:</span>
                <span>{{ alert.token }}</span>
              </div>
              <div class="stat">
                <span class="label">Value:</span>
                <span class="value">{{ formatValue(alert.value) }}</span>
              </div>
              <div class="stat">
                <span class="label">Protocol:</span>
                <span>{{ alert.protocol }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- History Tab -->
    <div v-else-if="activeTab === 'history'" class="history">
      <div class="history-chart">
        <div class="chart-header">Flow History (7 Days)</div>
        <div class="chart-bars">
          <div v-for="day in historyData" :key="day.date" class="chart-bar">
            <div class="bar-container">
              <div class="bar-inflow" :style="{ height: `${Math.min((day.inflow / 50000000) * 100, 100)}%` }"></div>
              <div class="bar-outflow" :style="{ height: `${Math.min((day.outflow / 50000000) * 100, 100)}%` }"></div>
            </div>
            <div class="bar-label">{{ day.date.slice(5) }}</div>
            <div class="bar-net" :class="day.netFlow >= 0 ? 'positive' : 'negative'">
              {{ formatValue(day.netFlow) }}
            </div>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item inflow">Inflow</span>
          <span class="legend-item outflow">Outflow</span>
        </div>
      </div>
    </div>

    <!-- Tokens Tab -->
    <div v-else-if="activeTab === 'tokens'" class="tokens">
      <div class="token-grid">
        <div v-for="token in tokenFlows" :key="token.symbol" class="token-card">
          <div class="token-header">
            <span class="token-symbol">{{ token.symbol }}</span>
            <span class="token-flow" :class="token.netFlow >= 0 ? 'positive' : 'negative'">
              {{ formatValue(token.netFlow) }}
            </span>
          </div>
          <div class="token-stats">
            <div class="stat">
              <span class="label">Inflow 24h</span>
              <span class="positive">{{ formatValue(token.inflow24h) }}</span>
            </div>
            <div class="stat">
              <span class="label">Outflow 24h</span>
              <span class="negative">{{ formatValue(token.outflow24h) }}</span>
            </div>
            <div class="stat">
              <span class="label">Holders</span>
              <span>{{ formatNumber(token.holders) }}</span>
            </div>
            <div class="stat">
              <span class="label">Volume 24h</span>
              <span>{{ formatValue(token.volume24h) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.smart-money-flow {
  padding: 20px;
  background: #0d1117;
  color: #e6edf3;
  min-height: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #58a6ff;
}

.subtitle {
  color: #8b949e;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chain-select, .period-select {
  background: #161b22;
  border: 1px solid #30363d;
  color: #e6edf3;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.refresh-btn {
  background: #238636;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #30363d;
  padding-bottom: 10px;
}

.tab {
  background: transparent;
  border: none;
  color: #8b949e;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab:hover {
  background: #161b22;
  color: #e6edf3;
}

.tab.active {
  background: #1f6feb;
  color: white;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #8b949e;
}

.error {
  color: #f85149;
}

/* Overview */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid;
}

.card.inflow { border-left-color: #22c55e; }
.card.outflow { border-left-color: #ef4444; }
.card.net { border-left-color: #3b82f6; }
.card.whales { border-left-color: #a855f7; }

.card-label {
  color: #8b949e;
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.card-trend {
  font-size: 12px;
  color: #8b949e;
}

.card-trend.up { color: #22c55e; }
.card-trend.down { color: #ef4444; }

.quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-box {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
}

.stat-box h4 {
  margin: 0 0 12px 0;
  color: #e6edf3;
}

.protocol-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.protocol-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #0d1117;
  border-radius: 4px;
}

.protocol-name { color: #58a6ff; }
.protocol-flow.positive { color: #22c55e; }
.protocol-flow.negative { color: #ef4444; }
.protocol-txs { color: #8b949e; font-size: 12px; }

.tracker-input {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tracker-input input {
  flex: 1;
  background: #0d1117;
  border: 1px solid #30363d;
  color: #e6edf3;
  padding: 8px;
  border-radius: 4px;
}

.tracker-input button {
  background: #238636;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.tracked-address {
  background: #0d1117;
  padding: 12px;
  border-radius: 6px;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.address { color: #58a6ff; }

.badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.badge.whale { background: #a855f7; color: white; }
.badge.normal { background: #238636; color: white; }

.address-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 12px;
}

.recent-alerts h4 {
  margin: 0 0 12px 0;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.alert-item {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 12px;
}

.alert-item.HIGH {
  border-color: #f85149;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.alert-type {
  color: #8b949e;
  font-size: 12px;
  text-transform: uppercase;
}

.alert-time {
  color: #8b949e;
  font-size: 12px;
}

.alert-address {
  color: #58a6ff;
  font-size: 13px;
  margin-bottom: 8px;
}

.alert-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8b949e;
}

.alert-value {
  color: #22c55e;
  font-weight: bold;
}

/* Tables */
.protocol-table, .tx-table {
  background: #161b22;
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #30363d;
}

th {
  background: #0d1117;
  color: #8b949e;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.positive { color: #22c55e; }
.negative { color: #ef4444; }

.hash, .address {
  font-family: monospace;
  color: #58a6ff;
}

.tx-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.tx-type.IN { background: #22c55e20; color: #22c55e; }
.tx-type.OUT { background: #ef444420; color: #ef4444; }

.value { font-weight: 600; }

/* Alerts Page */
.alerts-full {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
}

.alert-card.HIGH {
  border-color: #f85149;
}

.alert-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.alert-type-badge {
  background: #1f6feb;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.alert-risk {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.alert-risk.HIGH { background: #f85149; color: white; }
.alert-risk.NORMAL { background: #238636; color: white; }

.alert-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-address-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.alert-address-row .label { color: #8b949e; }

.alert-stats {
  display: flex;
  gap: 24px;
}

.alert-stats .stat {
  display: flex;
  gap: 8px;
}

.alert-stats .label { color: #8b949e; }
.alert-stats .value { color: #22c55e; font-weight: bold; }

/* History */
.history-chart {
  background: #161b22;
  border-radius: 8px;
  padding: 20px;
}

.chart-header {
  text-align: center;
  margin-bottom: 20px;
  font-size: 16px;
  color: #e6edf3;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  padding: 0 20px;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.bar-container {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 150px;
}

.bar-inflow {
  width: 20px;
  background: #22c55e;
  border-radius: 4px 4px 0 0;
}

.bar-outflow {
  width: 20px;
  background: #ef4444;
  border-radius: 4px 4px 0 0;
}

.bar-label {
  font-size: 12px;
  color: #8b949e;
}

.bar-net {
  font-size: 11px;
  font-weight: bold;
}

.bar-net.positive { color: #22c55e; }
.bar-net.negative { color: #ef4444; }

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-item::before {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-item.inflow::before { background: #22c55e; }
.legend-item.outflow::before { background: #ef4444; }

/* Tokens */
.token-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.token-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.token-symbol {
  font-size: 18px;
  font-weight: bold;
  color: #58a6ff;
}

.token-flow {
  font-weight: bold;
}

.token-flow.positive { color: #22c55e; }
.token-flow.negative { color: #ef4444; }

.token-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.token-stats .stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.token-stats .label { color: #8b949e; }

@media (max-width: 1200px) {
  .summary-cards { grid-template-columns: repeat(2, 1fr); }
  .quick-stats { grid-template-columns: 1fr; }
  .alerts-grid { grid-template-columns: repeat(2, 1fr); }
  .token-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .summary-cards { grid-template-columns: 1fr; }
  .alerts-grid { grid-template-columns: 1fr; }
  .token-grid { grid-template-columns: 1fr; }
}
</style>
