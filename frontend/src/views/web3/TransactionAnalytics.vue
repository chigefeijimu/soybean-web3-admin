<template>
  <div class="transaction-analytics">
    <div class="header">
      <h1>📊 Transaction Analytics</h1>
      <p class="subtitle">Analyze your transaction patterns, gas usage, and activity</p>
    </div>

    <!-- Controls -->
    <div class="controls">
      <input
        v-model="address"
        placeholder="Enter wallet address (0x...)"
        class="input-field"
        @keyup.enter="fetchAnalytics"
      />
      <select v-model="chainId" class="select-field">
        <option :value="1">Ethereum</option>
        <option :value="56">BSC</option>
        <option :value="137">Polygon</option>
        <option :value="42161">Arbitrum</option>
        <option :value="10">Optimism</option>
        <option :value="8453">Base</option>
        <option :value="43114">Avalanche</option>
      </select>
      <select v-model="days" class="select-field">
        <option :value="7">7 Days</option>
        <option :value="30">30 Days</option>
        <option :value="90">90 Days</option>
      </select>
      <button class="btn-primary" @click="fetchAnalytics" :disabled="loading">
        {{ loading ? 'Loading...' : 'Analyze' }}
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Analyzing transactions...</p>
    </div>

    <div v-else-if="data" class="analytics-content">
      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-value">{{ data.summary.total }}</div>
          <div class="stat-label">Total Transactions</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📥</div>
          <div class="stat-value">{{ data.summary.incoming }}</div>
          <div class="stat-label">Incoming</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📤</div>
          <div class="stat-value">{{ data.summary.outgoing }}</div>
          <div class="stat-label">Outgoing</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⛽</div>
          <div class="stat-value">{{ data.gasStats.total.toFixed(4) }}</div>
          <div class="stat-label">Total Gas (ETH)</div>
        </div>
      </div>

      <!-- Activity Heatmap -->
      <div class="card">
        <h3>📅 Activity Heatmap</h3>
        <div class="heatmap">
          <div
            v-for="item in data.activityHeatmap"
            :key="item.date"
            class="heatmap-cell"
            :style="{ backgroundColor: getHeatmapColor(item.count) }"
            :title="`${item.date}: ${item.count} transactions`"
          >
            <span class="heatmap-tooltip">{{ item.date }}: {{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- Time Distribution -->
      <div class="two-col">
        <div class="card">
          <h3>🕐 Transactions by Hour</h3>
          <div class="bar-chart">
            <div
              v-for="item in data.timeDistribution.byHour"
              :key="item.hour"
              class="bar-item"
            >
              <div class="bar" :style="{ height: `${(item.count / maxHourCount) * 100}%` }"></div>
              <span class="bar-label">{{ item.hour }}</span>
            </div>
          </div>
        </div>
        <div class="card">
          <h3>📆 Transactions by Day</h3>
          <div class="bar-chart horizontal">
            <div
              v-for="item in data.timeDistribution.byDay"
              :key="item.day"
              class="bar-item-h"
            >
              <span class="bar-label">{{ item.day }}</span>
              <div class="bar-h" :style="{ width: `${(item.count / maxDayCount) * 100}%` }"></div>
              <span class="bar-value">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction Types -->
      <div class="card">
        <h3>📦 Transaction Types</h3>
        <div class="type-list">
          <div
            v-for="(count, type) in data.transactionTypes"
            :key="type"
            class="type-item"
          >
            <span class="type-name">{{ type }}</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${(count / data.summary.total) * 100}%` }"></div>
            </div>
            <span class="type-count">{{ count }}</span>
          </div>
        </div>
      </div>

      <!-- Top Contracts -->
      <div class="card">
        <h3>🔝 Top Contracts</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Contract Address</th>
              <th>Interactions</th>
              <th>Total Gas (ETH)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contract in data.topContracts" :key="contract.address">
              <td>
                <a :href="getExplorerUrl(contract.address)" target="_blank" class="link">
                  {{ formatAddress(contract.address) }}
                </a>
              </td>
              <td>{{ contract.interactions }}</td>
              <td>{{ (contract.totalGas / 1e18).toFixed(4) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Gas Analysis -->
      <div class="card" v-if="gasData">
        <h3>⛽ Gas Analysis</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Average Gas Price</div>
            <div class="stat-value">{{ gasData.avgGasPrice.toFixed(2) }} Gwei</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Average Gas Used</div>
            <div class="stat-value">{{ gasData.avgGasUsed.toFixed(0) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Cost (USD)</div>
            <div class="stat-value">${{ gasData.costAnalysis.totalUSD.toFixed(2) }}</div>
          </div>
        </div>
        
        <div v-if="gasData.tips.length" class="tips">
          <h4>💡 Optimization Tips</h4>
          <div v-for="tip in gasData.tips" :key="tip.title" class="tip-alert">
            <strong>{{ tip.title }}:</strong> {{ tip.description }}
          </div>
        </div>
      </div>

      <!-- Activity Pattern -->
      <div class="card" v-if="patternData">
        <h3>🎯 Activity Pattern</h3>
        <div class="profile-badge">
          {{ patternData.profile }}
        </div>
        
        <div class="habits">
          <div v-for="habit in patternData.habits" :key="habit.title" class="habit-item">
            <div class="habit-title">{{ habit.title }}</div>
            <div class="habit-value">{{ habit.value }}</div>
            <div class="habit-desc">{{ habit.description }}</div>
          </div>
        </div>

        <div v-if="patternData.insights.length" class="insights">
          <h4>💡 Insights</h4>
          <div v-for="insight in patternData.insights" :key="insight.title" class="insight-tag">
            <strong>{{ insight.title }}:</strong> {{ insight.description }}
          </div>
        </div>

        <div v-if="patternData.recommendations.length" class="recommendations">
          <h4>🚀 Recommendations</h4>
          <div v-for="rec in patternData.recommendations" :key="rec.title" class="rec-alert">
            <strong>{{ rec.title }}:</strong> {{ rec.description }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Enter a wallet address to analyze transactions</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { transactionAnalytics, gasAnalysis, activityPattern } from '@/service/api/web3'

const address = ref('')
const chainId = ref(1)
const days = ref(30)
const loading = ref(false)
const data = ref<any>(null)
const gasData = ref<any>(null)
const patternData = ref<any>(null)

const maxHourCount = computed(() => {
  if (!data.value) return 1
  return Math.max(...data.value.timeDistribution.byHour.map((h: any) => h.count), 1)
})

const maxDayCount = computed(() => {
  if (!data.value) return 1
  return Math.max(...data.value.timeDistribution.byDay.map((d: any) => d.count), 1)
})

const getHeatmapColor = (count: number) => {
  if (!data.value) return '#eee'
  const max = Math.max(...data.value.activityHeatmap.map((h: any) => h.count), 1)
  const intensity = count / max
  return `rgba(64, 158, 255, ${Math.max(0.1, intensity)})`
}

const formatAddress = (addr: string) => {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

const getExplorerUrl = (addr: string) => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    56: 'https://bscscan.com',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    8453: 'https://basescan.org',
    43114: 'https://snowtrace.io',
  }
  return `${explorers[chainId.value] || explorers[1]}/address/${addr}`
}

const fetchAnalytics = async () => {
  if (!address.value) {
    alert('Please enter a wallet address')
    return
  }

  loading.value = true
  try {
    const [analyticsRes, gasRes, patternRes] = await Promise.all([
      transactionAnalytics(address.value, chainId.value, days.value),
      gasAnalysis(address.value, chainId.value, days.value),
      activityPattern(address.value, chainId.value, 90),
    ])
    
    data.value = analyticsRes.data
    gasData.value = gasRes.data
    patternData.value = patternRes.data
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    alert('Failed to fetch transaction analytics')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.transaction-analytics {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #9ca3af;
  margin: 0;
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.input-field {
  flex: 1;
  min-width: 300px;
  padding: 10px 14px;
  border: 1px solid #374151;
  border-radius: 8px;
  background: #1f2937;
  color: #fff;
  font-size: 14px;
}

.input-field:focus {
  outline: none;
  border-color: #6366f1;
}

.select-field {
  padding: 10px 14px;
  border: 1px solid #374151;
  border-radius: 8px;
  background: #1f2937;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: scale(1.02);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #374151;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #6366f1;
}

.stat-label {
  color: #9ca3af;
  font-size: 13px;
  margin-top: 4px;
}

.card {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.heatmap {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.heatmap-cell {
  width: 18px;
  height: 18px;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.heatmap-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 10;
}

.heatmap-cell:hover .heatmap-tooltip {
  display: block;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  height: 180px;
  gap: 3px;
}

.bar-chart.horizontal {
  flex-direction: column;
  height: auto;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar {
  width: 100%;
  background: #6366f1;
  border-radius: 3px 3px 0 0;
  min-height: 1px;
}

.bar-h {
  height: 22px;
  background: #10b981;
  border-radius: 3px;
  min-width: 1px;
}

.bar-item-h {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.bar-label {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  width: 60px;
}

.bar-value {
  font-size: 12px;
  color: #d1d5db;
  min-width: 30px;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-name {
  width: 140px;
  font-weight: 500;
  font-size: 14px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s;
}

.type-count {
  width: 50px;
  text-align: right;
  color: #9ca3af;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #374151;
}

.data-table th {
  color: #9ca3af;
  font-weight: 500;
  font-size: 13px;
}

.link {
  color: #6366f1;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.tips,
.insights,
.recommendations {
  margin-top: 20px;
}

.tips h4,
.insights h4,
.recommendations h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #d1d5db;
}

.tip-alert,
.rec-alert {
  background: #064e3b;
  border: 1px solid #059669;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  color: #a7f3d0;
  font-size: 13px;
}

.insight-tag {
  display: inline-block;
  background: #78350f;
  border: 1px solid #d97706;
  border-radius: 16px;
  padding: 6px 12px;
  margin: 0 8px 8px 0;
  color: #fcd34d;
  font-size: 13px;
}

.profile-badge {
  display: inline-block;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}

.habits {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.habit-item {
  padding: 16px;
  background: #111827;
  border-radius: 8px;
}

.habit-title {
  color: #9ca3af;
  font-size: 12px;
  margin-bottom: 4px;
}

.habit-value {
  font-size: 18px;
  font-weight: bold;
  color: #6366f1;
}

.habit-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .two-col {
    grid-template-columns: 1fr;
  }
  
  .habits {
    grid-template-columns: 1fr;
  }
}
</style>
