<template>
  <div class="yield-analytics-dashboard">
    <div class="header">
      <h2>📈 Yield Analytics Dashboard</h2>
      <p class="subtitle">Comprehensive yield analytics across all your DeFi positions</p>
    </div>

    <!-- Summary Stats -->
    <div class="summary-cards" v-if="analytics">
      <div class="card summary">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <div class="card-label">Total Value</div>
          <div class="card-value">${{ formatNumber(analytics.totalValue) }}</div>
        </div>
      </div>
      <div class="card summary">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <div class="card-label">Total Yield</div>
          <div class="card-value positive">+${{ formatNumber(analytics.totalYield) }}</div>
        </div>
      </div>
      <div class="card summary">
        <div class="card-icon">%</div>
        <div class="card-content">
          <div class="card-label">Yield Rate</div>
          <div class="card-value">{{ analytics.totalYieldPercent.toFixed(2) }}%</div>
        </div>
      </div>
      <div class="card summary">
        <div class="card-icon">🏆</div>
        <div class="card-content">
          <div class="card-label">Best Performer</div>
          <div class="card-value">{{ analytics.bestPerformer.protocol }}</div>
          <div class="card-sub">{{ analytics.bestPerformer.apy.toFixed(2) }}% APY</div>
        </div>
      </div>
    </div>

    <!-- Yield by Type -->
    <div class="card yield-by-type" v-if="yieldByType">
      <h3>📊 Yield by Category</h3>
      <div class="type-grid">
        <div class="type-card" v-for="(data, type) in yieldByType" :key="type">
          <div class="type-icon">{{ getTypeIcon(type) }}</div>
          <div class="type-name">{{ formatTypeName(type) }}</div>
          <div class="type-value">${{ formatNumber(data.value) }}</div>
          <div class="type-yield">+${{ formatNumber(data.yield) }}</div>
          <div class="type-apy">{{ data.apy.toFixed(2) }}% APY</div>
        </div>
      </div>
    </div>

    <!-- Chain Distribution -->
    <div class="card chain-distribution" v-if="analytics">
      <h3>🌐 Chain Distribution</h3>
      <div class="chain-grid">
        <div class="chain-card" v-for="chain in analytics.chains" :key="chain.chain">
          <div class="chain-header">
            <span class="chain-name">{{ chain.chainName }}</span>
            <span class="chain-apy">{{ chain.apy.toFixed(2) }}% APY</span>
          </div>
          <div class="chain-stats">
            <div class="chain-stat">
              <span class="stat-label">Value</span>
              <span class="stat-value">${{ formatNumber(chain.totalValue) }}</span>
            </div>
            <div class="chain-stat">
              <span class="stat-label">Yield</span>
              <span class="stat-value positive">+${{ formatNumber(chain.totalYield) }}</span>
            </div>
            <div class="chain-stat">
              <span class="stat-label">Positions</span>
              <span class="stat-value">{{ chain.positions }}</span>
            </div>
          </div>
          <div class="chain-bar">
            <div class="bar-fill" :style="{ width: getChainPercentage(chain.totalValue) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Protocol Distribution -->
    <div class="card protocol-distribution" v-if="analytics">
      <h3>🏦 Protocol Distribution</h3>
      <div class="protocol-table">
        <table>
          <thead>
            <tr>
              <th>Protocol</th>
              <th>Chains</th>
              <th>Positions</th>
              <th>Value</th>
              <th>Yield</th>
              <th>Avg APY</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="protocol in analytics.protocols" :key="protocol.protocol">
              <td>
                <span class="protocol-name">{{ protocol.protocolName }}</span>
              </td>
              <td>
                <div class="chain-badges">
                  <span class="chain-badge" v-for="chain in protocol.chains" :key="chain">{{ chain }}</span>
                </div>
              </td>
              <td>{{ protocol.positions }}</td>
              <td>${{ formatNumber(protocol.totalValue) }}</td>
              <td class="positive">+${{ formatNumber(protocol.totalYield) }}</td>
              <td>
                <span class="apy-badge" :class="getApyClass(protocol.apy)">
                  {{ protocol.apy.toFixed(2) }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Yield History Chart -->
    <div class="card yield-history" v-if="yieldHistory">
      <h3>📉 Yield History (Last 30 Days)</h3>
      <div class="history-stats">
        <div class="history-stat">
          <span class="stat-label">Total Yield</span>
          <span class="stat-value positive">+${{ formatNumber(yieldHistory.totalYield) }}</span>
        </div>
        <div class="history-stat">
          <span class="stat-label">Daily Average</span>
          <span class="stat-value">${{ formatNumber(yieldHistory.averageDailyYield) }}</span>
        </div>
      </div>
      <div class="history-chart">
        <div 
          v-for="(day, index) in yieldHistory.history" 
          :key="index"
          class="chart-bar"
          :style="{ height: getChartBarHeight(day.yield) + '%' }"
          :title="`${day.date}: $${formatNumber(day.yield)}`"
        ></div>
      </div>
      <div class="chart-labels">
        <span>{{ yieldHistory.history[0]?.date }}</span>
        <span>{{ yieldHistory.history[yieldHistory.history.length - 1]?.date }}</span>
      </div>
    </div>

    <!-- Positions Table -->
    <div class="card positions-section" v-if="positions.length">
      <h3>📋 All Positions</h3>
      <div class="positions-filter">
        <select v-model="positionFilter.type" @change="filterPositions">
          <option value="">All Types</option>
          <option value="staking">Staking</option>
          <option value="lending">Lending</option>
          <option value="liquidity">Liquidity</option>
          <option value="farming">Farming</option>
          <option value="bridge">Bridge</option>
        </select>
        <select v-model="positionFilter.chain" @change="filterPositions">
          <option value="">All Chains</option>
          <option v-for="chain in availableChains" :key="chain" :value="chain">{{ chain }}</option>
        </select>
      </div>
      <div class="positions-table">
        <table>
          <thead>
            <tr>
              <th>Protocol</th>
              <th>Chain</th>
              <th>Type</th>
              <th>Token(s)</th>
              <th>Value</th>
              <th>Yield</th>
              <th>APY</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="position in filteredPositions" :key="position.id">
              <td>
                <span class="protocol-badge">{{ position.protocol }}</span>
              </td>
              <td>{{ position.chain }}</td>
              <td>
                <span class="type-badge" :class="position.type">{{ position.type }}</span>
              </td>
              <td>{{ position.token1 ? `${position.token0}/${position.token1}` : position.token0 }}</td>
              <td>${{ formatNumber(position.valueUsd) }}</td>
              <td class="positive">+${{ formatNumber(position.yieldUsd) }}</td>
              <td>
                <span class="apy-badge" :class="getApyClass(position.apy)">
                  {{ position.apy.toFixed(2) }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>Loading yield analytics...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { yieldAnalyticsApi, type YieldAnalytics, type YieldTypeComparison, type YieldPosition } from '@/service/yieldAnalytics'

const analytics = ref<YieldAnalytics | null>(null)
const yieldByType = ref<YieldTypeComparison | null>(null)
const yieldHistory = ref<{ history: { date: string; yield: number }[]; totalYield: number; averageDailyYield: number } | null>(null)
const positions = ref<YieldPosition[]>([])
const filteredPositions = ref<YieldPosition[]>([])
const loading = ref(true)

const positionFilter = ref({
  type: '',
  chain: ''
})

const availableChains = computed(() => {
  const chains = new Set<string>()
  positions.value.forEach(p => chains.add(p.chain))
  return Array.from(chains)
})

const maxChainValue = computed(() => {
  if (!analytics.value) return 1
  return Math.max(...analytics.value.chains.map(c => c.totalValue), 1)
})

const maxDailyYield = computed(() => {
  if (!yieldHistory.value) return 1
  return Math.max(...yieldHistory.value.history.map(d => d.yield), 1)
})

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  return num.toFixed(2)
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    staking: '🔒',
    lending: '💳',
    liquidity: '🌊',
    farming: '🌾',
    bridge: '🌉'
  }
  return icons[type] || '📊'
}

function formatTypeName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function getChainPercentage(value: number): number {
  return (value / maxChainValue.value) * 100
}

function getChartBarHeight(yield: number): number {
  return (yield / maxDailyYield.value) * 100
}

function getApyClass(apy: number): string {
  if (apy >= 20) return 'high'
  if (apy >= 10) return 'medium'
  return 'low'
}

function filterPositions() {
  filteredPositions.value = positions.value.filter(p => {
    if (positionFilter.value.type && p.type !== positionFilter.value.type) return false
    if (positionFilter.value.chain && p.chain !== positionFilter.value.chain) return false
    return true
  })
}

async function loadData() {
  loading.value = true
  try {
    const [analyticsRes, typeRes, historyRes, positionsRes] = await Promise.all([
      yieldAnalyticsApi.getYieldAnalytics(),
      yieldAnalyticsApi.getYieldByType(),
      yieldAnalyticsApi.getYieldHistory(30),
      yieldAnalyticsApi.getYieldPositions()
    ])
    
    analytics.value = analyticsRes.data
    yieldByType.value = typeRes.data
    yieldHistory.value = historyRes.data
    positions.value = positionsRes.data
    filteredPositions.value = positionsRes.data
  } catch (error) {
    console.error('Failed to load yield analytics:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.yield-analytics-dashboard {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #666;
  margin: 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  font-size: 32px;
}

.card-label {
  font-size: 14px;
  color: #666;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
}

.card-sub {
  font-size: 12px;
  color: #666;
}

.positive {
  color: #10b981;
}

.yield-by-type {
  margin-bottom: 24px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.type-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.type-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.type-name {
  font-weight: 600;
  margin-bottom: 8px;
}

.type-value {
  font-size: 20px;
  font-weight: 700;
}

.type-yield {
  color: #10b981;
  font-size: 14px;
}

.type-apy {
  color: #6366f1;
  font-size: 14px;
  margin-top: 4px;
}

.chain-distribution {
  margin-bottom: 24px;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.chain-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.chain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chain-name {
  font-weight: 600;
}

.chain-apy {
  color: #6366f1;
  font-size: 14px;
}

.chain-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.chain-stat {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: #666;
  font-size: 12px;
}

.stat-value {
  font-weight: 600;
  font-size: 14px;
}

.chain-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.protocol-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.protocol-name {
  font-weight: 600;
}

.chain-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.chain-badge {
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.apy-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
}

.apy-badge.high {
  background: #dcfce7;
  color: #16a34a;
}

.apy-badge.medium {
  background: #fef3c7;
  color: #d97706;
}

.apy-badge.low {
  background: #e2e8f0;
  color: #64748b;
}

.yield-history {
  margin-bottom: 24px;
}

.history-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 16px;
}

.history-stat {
  display: flex;
  flex-direction: column;
}

.history-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  padding: 16px 0;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.chart-bar:hover {
  opacity: 0.8;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.positions-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.positions-filter select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.positions-table {
  overflow-x: auto;
}

.protocol-badge {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.type-badge.staking {
  background: #fef3c7;
  color: #d97706;
}

.type-badge.lending {
  background: #dbeafe;
  color: #2563eb;
}

.type-badge.liquidity {
  background: #d1fae5;
  color: #059669;
}

.type-badge.farming {
  background: #fce7f3;
  color: #db2777;
}

.type-badge.bridge {
  background: #e0e7ff;
  color: #4f46e5;
}

.loading {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
