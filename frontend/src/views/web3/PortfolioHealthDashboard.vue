<template>
  <div class="portfolio-health-dashboard">
    <div class="header">
      <h2>🏥 Cross-chain Portfolio Health Dashboard</h2>
      <div class="actions">
        <input 
          v-model="walletAddress" 
          placeholder="Enter wallet address..." 
          class="address-input"
          @keyup.enter="analyzePortfolio"
        />
        <button @click="analyzePortfolio" :disabled="loading" class="btn-primary">
          {{ loading ? 'Analyzing...' : 'Analyze Portfolio' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing cross-chain portfolio health...</p>
    </div>

    <div v-else-if="healthData" class="dashboard-content">
      <!-- Health Score Overview -->
      <div class="health-score-section">
        <div class="overall-score" :class="healthData.riskLevel">
          <div class="score-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" class="score-bg" />
              <circle 
                cx="50" cy="50" r="45" 
                class="score-progress"
                :style="{ strokeDashoffset: 283 - (283 * healthData.score.overall / 100) }"
              />
            </svg>
            <div class="score-value">
              <span class="score-number">{{ healthData.score.overall }}</span>
              <span class="score-label">Health Score</span>
            </div>
          </div>
          <div class="score-details">
            <p class="summary-text">{{ healthData.summary }}</p>
            <span class="risk-badge" :class="healthData.riskLevel">
              {{ healthData.riskLevel.toUpperCase() }} RISK
            </span>
          </div>
        </div>

        <!-- Score Breakdown -->
        <div class="score-breakdown">
          <div class="score-item">
            <span class="score-label">Diversification</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: healthData.score.diversification + '%' }"></div>
            </div>
            <span class="score-value">{{ healthData.score.diversification }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">Risk Management</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: healthData.score.riskManagement + '%' }"></div>
            </div>
            <span class="score-value">{{ healthData.score.riskManagement }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">Gas Efficiency</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: healthData.score.gasEfficiency + '%' }"></div>
            </div>
            <span class="score-value">{{ healthData.score.gasEfficiency }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">Concentration</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: healthData.score.concentration + '%' }"></div>
            </div>
            <span class="score-value">{{ healthData.score.concentration }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">Liquidity</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: healthData.score.liquidity + '%' }"></div>
            </div>
            <span class="score-value">{{ healthData.score.liquidity }}</span>
          </div>
        </div>
      </div>

      <!-- Alerts Section -->
      <div v-if="healthData.alerts.length > 0" class="alerts-section">
        <h3>⚠️ Alerts</h3>
        <div class="alerts-list">
          <div 
            v-for="(alert, index) in healthData.alerts" 
            :key="index" 
            class="alert-item"
            :class="alert.type"
          >
            <span class="alert-icon">
              {{ alert.type === 'danger' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵' }}
            </span>
            <span class="alert-message">{{ alert.message }}</span>
          </div>
        </div>
      </div>

      <!-- Chain Distribution -->
      <div class="chain-distribution">
        <h3>🌐 Chain Distribution</h3>
        <div class="chain-grid">
          <div 
            v-for="chain in healthData.chainDistribution" 
            :key="chain.chain" 
            class="chain-card"
          >
            <div class="chain-header">
              <span class="chain-name">{{ formatChainName(chain.chain) }}</span>
              <span class="chain-value">${{ formatNumber(chain.totalValue) }}</span>
            </div>
            <div class="chain-bar">
              <div 
                class="chain-fill"
                :style="{ width: (chain.totalValue / totalPortfolioValue * 100) + '%' }"
              ></div>
            </div>
            <div class="chain-tokens">
              <span class="token-count">{{ chain.tokens }} tokens</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations-section">
        <h3>💡 Recommendations</h3>
        <div class="recommendations-list">
          <div 
            v-for="(rec, index) in healthData.recommendations" 
            :key="index" 
            class="recommendation-card"
            :class="rec.priority"
          >
            <div class="rec-header">
              <span class="rec-type">{{ getRecommendationIcon(rec.type) }}</span>
              <span class="rec-title">{{ rec.title }}</span>
              <span class="rec-priority" :class="rec.priority">{{ rec.priority }}</span>
            </div>
            <p class="rec-description">{{ rec.description }}</p>
            <div class="rec-footer">
              <span class="rec-impact">{{ rec.potentialImpact }}</span>
              <span class="rec-benefit">+${{ formatNumber(rec.estimatedBenefit) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Portfolio Metrics -->
      <div class="metrics-section">
        <h3>📊 Portfolio Metrics</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-label">Total Value</span>
            <span class="metric-value">${{ formatNumber(healthData.metrics.totalValue) }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Chains</span>
            <span class="metric-value">{{ healthData.metrics.totalChains }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Total Tokens</span>
            <span class="metric-value">{{ healthData.metrics.totalTokens }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Stablecoin Ratio</span>
            <span class="metric-value">{{ (healthData.metrics.stablecoinRatio * 100).toFixed(1) }}%</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">DeFi Ratio</span>
            <span class="metric-value">{{ (healthData.metrics.defiRatio * 100).toFixed(1) }}%</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Avg Gas</span>
            <span class="metric-value">${{ healthData.metrics.avgTransactionGas.toFixed(2) }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Volatility</span>
            <span class="metric-value">{{ healthData.metrics.volatilityScore.toFixed(1) }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Last Activity</span>
            <span class="metric-value">{{ formatDate(healthData.metrics.lastActivity) }}</span>
          </div>
        </div>
      </div>

      <!-- Health Trends -->
      <div class="trends-section">
        <h3>📈 Health Trends</h3>
        <div class="trends-controls">
          <select v-model="trendDays" @change="loadTrends" class="trend-select">
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
          </select>
          <button @click="loadTrends" class="btn-secondary">Refresh Trends</button>
        </div>
        <div v-if="trendData.length > 0" class="trends-chart">
          <div class="chart-placeholder">
            <div 
              v-for="point in trendData" 
              :key="point.date"
              class="chart-bar"
              :style="{ height: point.overall + '%' }"
              :title="`${point.date}: ${point.overall.toFixed(0)}`"
            ></div>
          </div>
          <div class="chart-legend">
            <span>Overall Health Score Over Time</span>
          </div>
        </div>
      </div>

      <!-- Rebalancing Strategy -->
      <div class="rebalance-section">
        <h3>⚖️ Rebalancing Strategy</h3>
        <button @click="loadRebalance" :disabled="rebalancingLoading" class="btn-primary">
          {{ rebalancingLoading ? 'Calculating...' : 'Get Rebalancing Strategy' }}
        </button>
        <div v-if="rebalanceData" class="rebalance-content">
          <div class="rebalance-summary">
            <span>Portfolio Value: ${{ formatNumber(rebalanceData.totalPortfolioValue) }}</span>
            <span>Est. Gas Cost: ${{ rebalanceData.estimatedGasCost.toFixed(2) }}</span>
          </div>
          <div class="rebalance-actions">
            <div 
              v-for="action in rebalanceData.rebalancingActions" 
              :key="action.chain"
              class="action-item"
              :class="action.action"
            >
              <span class="action-chain">{{ formatChainName(action.chain) }}</span>
              <span class="action-change" :class="action.action">
                {{ action.action === 'increase' ? '↑' : action.action === 'decrease' ? '↓' : '→' }}
                {{ Math.abs(action.difference).toFixed(1) }}%
              </span>
              <span class="action-amount">${{ formatNumber(action.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Enter a wallet address to analyze portfolio health across chains</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { get } from '@/utils/http'

const walletAddress = ref('')
const loading = ref(false)
const healthData = ref(null)
const trendDays = ref('30')
const trendData = ref([])
const rebalancingLoading = ref(false)
const rebalanceData = ref(null)

const totalPortfolioValue = computed(() => {
  if (!healthData.value) return 0
  return healthData.value.metrics.totalValue
})

const analyzePortfolio = async () => {
  if (!walletAddress.value) return
  
  loading.value = true
  try {
    const response = await get(`/portfolio-health-dashboard/analyze/${walletAddress.value}`)
    healthData.value = response
  } catch (error) {
    console.error('Error analyzing portfolio:', error)
  } finally {
    loading.value = false
  }
}

const loadTrends = async () => {
  if (!walletAddress.value) return
  
  try {
    const response = await get(`/portfolio-health-dashboard/trends/${walletAddress.value}?days=${trendDays.value}`)
    trendData.value = response
  } catch (error) {
    console.error('Error loading trends:', error)
  }
}

const loadRebalance = async () => {
  if (!walletAddress.value) return
  
  rebalancingLoading.value = true
  try {
    const response = await get(`/portfolio-health-dashboard/rebalance/${walletAddress.value}`)
    rebalanceData.value = response
  } catch (error) {
    console.error('Error loading rebalance strategy:', error)
  } finally {
    rebalancingLoading.value = false
  }
}

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(2)
}

const formatChainName = (chain) => {
  return chain.charAt(0).toUpperCase() + chain.slice(1)
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString()
}

const getRecommendationIcon = (type) => {
  const icons = {
    rebalance: '⚖️',
    diversify: '🌈',
    reduce_risk: '🛡️',
    optimize_gas: '⛽',
    add_liquidity: '💧'
  }
  return icons[type] || '💡'
}
</script>

<style scoped>
.portfolio-health-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.actions {
  display: flex;
  gap: 10px;
}

.address-input {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 300px;
  font-size: 14px;
}

.btn-primary {
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:disabled {
  background: #a5a5a5;
}

.btn-secondary {
  padding: 8px 16px;
  background: #f3f4f6;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px;
  color: #666;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Health Score Section */
.health-score-section {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.overall-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.overall-score.low { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
.overall-score.medium { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.overall-score.high { background: linear-gradient(135deg, #fee2e2, #fecaca); }
.overall-score.critical { background: linear-gradient(135deg, #fecaca, #fca5a5); }

.score-circle {
  position: relative;
  width: 150px;
  height: 150px;
}

.score-circle svg {
  transform: rotate(-90deg);
}

.score-bg {
  fill: none;
  stroke: rgba(255,255,255,0.5);
  stroke-width: 8;
}

.score-progress {
  fill: none;
  stroke: #4f46e5;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 283;
  transition: stroke-dashoffset 1s ease;
}

.score-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-number {
  display: block;
  font-size: 36px;
  font-weight: bold;
  color: #1f2937;
}

.score-label {
  font-size: 12px;
  color: #6b7280;
}

.score-details {
  margin-top: 20px;
  text-align: center;
}

.summary-text {
  margin: 0 0 15px 0;
  color: #374151;
}

.risk-badge {
  display: inline-block;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.risk-badge.low { background: #10b981; color: white; }
.risk-badge.medium { background: #f59e0b; color: white; }
.risk-badge.high { background: #ef4444; color: white; }
.risk-badge.critical { background: #dc2626; color: white; }

.score-breakdown {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.score-item {
  display: grid;
  grid-template-columns: 140px 1fr 50px;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.score-item:last-child {
  margin-bottom: 0;
}

.score-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* Alerts Section */
.alerts-section {
  margin-bottom: 30px;
}

.alerts-section h3 {
  margin-bottom: 15px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  border-radius: 8px;
  background: white;
}

.alert-item.danger {
  background: #fef2f2;
  border-left: 4px solid #ef4444;
}

.alert-item.warning {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
}

.alert-item.info {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

/* Chain Distribution */
.chain-distribution {
  margin-bottom: 30px;
}

.chain-distribution h3 {
  margin-bottom: 15px;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.chain-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chain-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chain-name {
  font-weight: 600;
  color: #1f2937;
}

.chain-value {
  font-weight: bold;
  color: #4f46e5;
}

.chain-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.chain-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  border-radius: 3px;
}

.chain-tokens {
  font-size: 12px;
  color: #6b7280;
}

/* Recommendations */
.recommendations-section {
  margin-bottom: 30px;
}

.recommendations-section h3 {
  margin-bottom: 15px;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.recommendation-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #e5e7eb;
}

.recommendation-card.high {
  border-left-color: #ef4444;
}

.recommendation-card.medium {
  border-left-color: #f59e0b;
}

.recommendation-card.low {
  border-left-color: #10b981;
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.rec-type {
  font-size: 20px;
}

.rec-title {
  font-weight: 600;
  flex: 1;
}

.rec-priority {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.rec-priority.high { background: #fee2e2; color: #dc2626; }
.rec-priority.medium { background: #fef3c7; color: #d97706; }
.rec-priority.low { background: #d1fae5; color: #059669; }

.rec-description {
  color: #6b7280;
  margin: 0 0 15px 0;
}

.rec-footer {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.rec-impact {
  color: #6b7280;
}

.rec-benefit {
  color: #10b981;
  font-weight: 600;
}

/* Metrics Section */
.metrics-section {
  margin-bottom: 30px;
}

.metrics-section h3 {
  margin-bottom: 15px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
}

/* Trends Section */
.trends-section {
  margin-bottom: 30px;
}

.trends-section h3 {
  margin-bottom: 15px;
}

.trends-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.trend-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.trends-chart {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-placeholder {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 150px;
  padding: 20px 0;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #4f46e5, #7c3aed);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
}

.chart-legend {
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  margin-top: 10px;
}

/* Rebalance Section */
.rebalance-section {
  margin-bottom: 30px;
}

.rebalance-section h3 {
  margin-bottom: 15px;
}

.rebalance-section > button {
  margin-bottom: 20px;
}

.rebalance-content {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.rebalance-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.rebalance-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-item {
  display: grid;
  grid-template-columns: 1fr 80px 100px;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.action-change {
  font-weight: 600;
  text-align: center;
}

.action-change.increase { color: #10b981; }
.action-change.decrease { color: #ef4444; }
.action-change.hold { color: #6b7280; }

.action-amount {
  text-align: right;
  color: #4f46e5;
  font-weight: 600;
}
</style>
