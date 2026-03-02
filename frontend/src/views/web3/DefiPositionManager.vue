<template>
  <div class="defi-position-manager">
    <div class="header">
      <h2>🎯 DeFi Position Manager</h2>
      <div class="actions">
        <input 
          v-model="walletAddress" 
          placeholder="Enter wallet address..." 
          class="address-input"
          @keyup.enter="loadPortfolio"
        />
        <button @click="loadPortfolio" :loading="loading" class="btn-primary">
          Load Portfolio
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="portfolio" class="portfolio-content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card total-value">
          <div class="card-label">Total Value</div>
          <div class="card-value">${{ formatNumber(portfolio.totalValueUSD) }}</div>
          <div class="card-sub" :class="portfolio.pnl24hPercent >= 0 ? 'positive' : 'negative'">
            {{ portfolio.pnl24hPercent >= 0 ? '+' : '' }}{{ portfolio.pnl24hPercent }}% (24h)
          </div>
        </div>
        <div class="card avg-apy">
          <div class="card-label">Avg APY</div>
          <div class="card-value">{{ portfolio.totalApy }}%</div>
        </div>
        <div class="card positions">
          <div class="card-label">Positions</div>
          <div class="card-value">{{ portfolio.positions.length }}</div>
        </div>
        <div class="card health" :class="healthStatusClass">
          <div class="card-label">Health</div>
          <div class="card-value">{{ health?.overallHealth || 'N/A' }}</div>
          <div class="card-sub">{{ health?.status || 'N/A' }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Positions Tab -->
        <div v-if="activeTab === 'positions'" class="positions-list">
          <table class="data-table">
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Chain</th>
                <th>Type</th>
                <th>Token</th>
                <th>Value (USD)</th>
                <th>APY</th>
                <th>P&L (24h)</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pos in portfolio.positions" :key="pos.id">
                <td>{{ pos.protocol }}</td>
                <td>{{ pos.chain }}</td>
                <td>{{ pos.type }}</td>
                <td>{{ pos.token0 }}{{ pos.token1 ? `/${pos.token1}` : '' }}</td>
                <td>${{ formatNumber(pos.valueUSD) }}</td>
                <td>{{ pos.apy }}%</td>
                <td :class="pos.pnl24h >= 0 ? 'positive' : 'negative'">
                  {{ pos.pnl24h >= 0 ? '+' : '' }}${{ formatNumber(pos.pnl24h) }}
                </td>
                <td v-if="pos.health">{{ pos.health.toFixed(2) }}</td>
                <td v-else>-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Allocation Tab -->
        <div v-if="activeTab === 'allocation'" class="allocation-view">
          <div class="allocation-section">
            <h3>By Token</h3>
            <div class="allocation-bars">
              <div v-for="item in allocation?.byToken" :key="item.token" class="allocation-item">
                <div class="allocation-label">
                  <span>{{ item.token }}</span>
                  <span>${{ formatNumber(item.valueUSD) }} ({{ item.percentage }}%)</span>
                </div>
                <div class="bar">
                  <div class="bar-fill" :style="{ width: item.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="allocation-section">
            <h3>By Protocol</h3>
            <div class="allocation-bars">
              <div v-for="item in allocation?.byProtocol" :key="item.protocol" class="allocation-item">
                <div class="allocation-label">
                  <span>{{ item.protocol }}</span>
                  <span>${{ formatNumber(item.valueUSD) }} ({{ item.percentage }}%)</span>
                </div>
                <div class="bar">
                  <div class="bar-fill protocol" :style="{ width: item.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="allocation-section">
            <h3>By Chain</h3>
            <div class="allocation-bars">
              <div v-for="item in allocation?.byChain" :key="item.chain" class="allocation-item">
                <div class="allocation-label">
                  <span>{{ item.chain }}</span>
                  <span>${{ formatNumber(item.valueUSD) }} ({{ item.percentage }}%)</span>
                </div>
                <div class="bar">
                  <div class="bar-fill chain" :style="{ width: item.percentage + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Health Tab -->
        <div v-if="activeTab === 'health'" class="health-view">
          <div class="health-score" :class="healthStatusClass">
            <div class="score-value">{{ health?.overallHealth }}</div>
            <div class="score-label">Health Score</div>
          </div>
          <div v-if="health?.warnings?.length" class="warnings">
            <h3>⚠️ Warnings</h3>
            <ul>
              <li v-for="(warning, idx) in health.warnings" :key="idx">{{ warning }}</li>
            </ul>
          </div>
          <div v-if="health?.recommendations?.length" class="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
              <li v-for="(rec, idx) in health.recommendations" :key="idx">{{ rec }}</li>
            </ul>
          </div>
        </div>

        <!-- Yield Tab -->
        <div v-if="activeTab === 'yield'" class="yield-view">
          <div class="yield-summary">
            <div class="yield-stat">
              <div class="stat-label">Total Value</div>
              <div class="stat-value">${{ formatNumber(yield_?.totalValueUSD) }}</div>
            </div>
            <div class="yield-stat">
              <div class="stat-label">Avg APY</div>
              <div class="stat-value">{{ yield_?.avgApy }}%</div>
            </div>
            <div class="yield-stat">
              <div class="stat-label">Estimated Yield ({{ yield_?.period }})</div>
              <div class="stat-value positive">+${{ formatNumber(yield_?.estimatedYieldUSD) }}</div>
            </div>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Value</th>
                <th>APY</th>
                <th>Estimated Yield</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in yield_?.yieldBreakdown" :key="item.protocol">
                <td>{{ item.protocol }}</td>
                <td>${{ formatNumber(item.value) }}</td>
                <td>{{ item.apy }}%</td>
                <td class="positive">+${{ formatNumber(item.estimatedYield) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Enter a wallet address to view DeFi positions</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const walletAddress = ref('')
const loading = ref(false)
const portfolio = ref<any>(null)
const summary = ref<any>(null)
const health = ref<any>(null)
const allocation = ref<any>(null)
const yield_ = ref<any>(null)
const activeTab = ref('positions')

const tabs = [
  { id: 'positions', label: 'Positions' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'health', label: 'Health' },
  { id: 'yield', label: 'Yield' },
]

const healthStatusClass = computed(() => {
  if (!health.value) return ''
  if (health.value.status === 'Healthy') return 'status-healthy'
  if (health.value.status === 'Warning') return 'status-warning'
  return 'status-critical'
})

const formatNumber = (num: number) => {
  if (!num && num !== 0) return '0'
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const loadPortfolio = async () => {
  if (!walletAddress.value) return
  
  loading.value = true
  try {
    const baseUrl = '/api/defi-position-manager'
    
    const [portfolioRes, summaryRes, healthRes, allocationRes, yieldRes] = await Promise.all([
      fetch(`${baseUrl}/portfolio?address=${walletAddress.value}`).then(r => r.json()),
      fetch(`${baseUrl}/summary?address=${walletAddress.value}`).then(r => r.json()),
      fetch(`${baseUrl}/health?address=${walletAddress.value}`).then(r => r.json()),
      fetch(`${baseUrl}/allocation?address=${walletAddress.value}`).then(r => r.json()),
      fetch(`${baseUrl}/yield?address=${walletAddress.value}&period=30d`).then(r => r.json()),
    ])

    portfolio.value = portfolioRes
    summary.value = summaryRes
    health.value = healthRes
    allocation.value = allocationRes
    yield_.value = yieldRes
  } catch (error) {
    console.error('Failed to load portfolio:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.defi-position-manager {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 10px;
}

.address-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 300px;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #4338ca;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.card {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.card-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  margin: 4px 0;
}

.card-sub {
  font-size: 12px;
}

.positive { color: #10b981; }
.negative { color: #ef4444; }

.card.health.status-healthy { background: #d1fae5; }
.card.health.status-warning { background: #fef3c7; }
.card.health.status-critical { background: #fee2e2; }

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.tab {
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.tab.active {
  color: #4f46e5;
  border-bottom: 2px solid #4f46e5;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  color: #666;
}

.allocation-section {
  margin-bottom: 24px;
}

.allocation-section h3 {
  margin-bottom: 12px;
}

.allocation-item {
  margin-bottom: 8px;
}

.allocation-label {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 4px;
}

.bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #4f46e5;
  transition: width 0.3s;
}

.bar-fill.protocol { background: #10b981; }
.bar-fill.chain { background: #f59e0b; }

.health-score {
  text-align: center;
  padding: 40px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.health-score.status-healthy { background: #d1fae5; }
.health-score.status-warning { background: #fef3c7; }
.health-score.status-critical { background: #fee2e2; }

.score-value {
  font-size: 48px;
  font-weight: bold;
}

.score-label {
  font-size: 14px;
  color: #666;
}

.warnings, .recommendations {
  margin-bottom: 20px;
}

.warnings h3 { color: #ef4444; }
.recommendations h3 { color: #10b981; }

.warnings ul, .recommendations ul {
  list-style: none;
  padding: 0;
}

.warnings li, .recommendations li {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.yield-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.yield-stat {
  flex: 1;
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
}
</style>
