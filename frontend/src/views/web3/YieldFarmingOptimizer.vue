<template>
  <div class="yield-farming-optimizer">
    <div class="header">
      <h2>🌾 Yield Farming Optimizer</h2>
      <p class="subtitle">Find and optimize your yield farming opportunities across multiple chains</p>
    </div>

    <!-- Market Overview -->
    <div class="overview-cards" v-if="marketOverview">
      <div class="card overview">
        <div class="card-title">Total TVL</div>
        <div class="card-value">${{ formatNumber(marketOverview.totalTvl) }}</div>
      </div>
      <div class="card overview">
        <div class="card-title">24h Volume</div>
        <div class="card-value">${{ formatNumber(marketOverview.totalVolume24h) }}</div>
      </div>
      <div class="card overview">
        <div class="card-title">Average APY</div>
        <div class="card-value">{{ marketOverview.averageApy.toFixed(2) }}%</div>
      </div>
    </div>

    <!-- Optimization Form -->
    <div class="card optimizer-form">
      <h3>🎯 Optimize Your Yield Strategy</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Investment Amount (USD)</label>
          <input type="number" v-model="optimizeRequest.principal" placeholder="10000" />
        </div>
        <div class="form-group">
          <label>Duration (days)</label>
          <input type="number" v-model="optimizeRequest.duration" placeholder="30" />
        </div>
        <div class="form-group">
          <label>Risk Tolerance</label>
          <select v-model="optimizeRequest.riskTolerance">
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
        <div class="form-group">
          <label>Preferred Chain</label>
          <select v-model="optimizeRequest.preferredChains">
            <option value="">All Chains</option>
            <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
          </select>
        </div>
      </div>
      <button class="btn-primary" @click="handleOptimize" :disabled="loading.optimize">
        {{ loading.optimize ? 'Optimizing...' : 'Get Optimized Strategy' }}
      </button>
    </div>

    <!-- Optimization Results -->
    <div class="card results" v-if="optimizationResult">
      <h3>📊 Your Optimized Strategy</h3>
      <div class="recommendation">
        {{ optimizationResult.recommendation }}
      </div>
      <div class="strategy-summary">
        <div class="summary-item">
          <span class="label">Expected Return:</span>
          <span class="value positive">${{ formatNumber(optimizationResult.totalExpectedReturn) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Risk Score:</span>
          <span class="value">{{ optimizationResult.totalRisk.toFixed(1) }}/3</span>
        </div>
      </div>
      
      <div class="strategy-allocation">
        <h4>Strategy Allocation</h4>
        <div class="allocation-bars">
          <div 
            v-for="(strategy, index) in optimizationResult.strategies" 
            :key="index"
            class="allocation-bar"
          >
            <div class="bar-header">
              <span class="protocol">{{ strategy.protocol }}</span>
              <span class="allocation">{{ strategy.allocation }}%</span>
            </div>
            <div class="bar-track">
              <div 
                class="bar-fill" 
                :style="{ width: strategy.allocation + '%' }"
                :class="getRiskClass(strategy.risk)"
              ></div>
            </div>
            <div class="bar-details">
              <span>{{ strategy.pool }} on {{ strategy.chain }}</span>
              <span class="expected">+${{ formatNumber(strategy.expectedReturn) }}</span>
            </div>
            <div class="reasons" v-if="strategy.reasons.length">
              <span v-for="(reason, i) in strategy.reasons.slice(0, 2)" :key="i" class="reason-tag">
                {{ reason }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pool List -->
    <div class="card pools-section">
      <div class="section-header">
        <h3>🔥 Top Yield Pools</h3>
        <div class="filters">
          <select v-model="poolFilters.chain" @change="loadPools">
            <option value="">All Chains</option>
            <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
          </select>
          <select v-model="poolFilters.risk" @change="loadPools">
            <option value="">All Risks</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      <div class="pools-table" v-if="pools.length">
        <table>
          <thead>
            <tr>
              <th>Protocol</th>
              <th>Chain</th>
              <th>Pair</th>
              <th>TVL</th>
              <th>Volume 24h</th>
              <th>APY</th>
              <th>Risk</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pool in pools" :key="pool.id">
              <td>
                <span class="protocol-badge">{{ pool.protocol }}</span>
              </td>
              <td>{{ pool.chain }}</td>
              <td>{{ pool.pair }}</td>
              <td>${{ formatNumber(pool.tvl) }}</td>
              <td>${{ formatNumber(pool.volume24h) }}</td>
              <td>
                <span class="apy-badge" :class="getApyClass(pool.apy)">
                  {{ pool.apy.toFixed(2) }}%
                </span>
              </td>
              <td>
                <span class="risk-badge" :class="pool.risk">{{ pool.risk }}</span>
              </td>
              <td>
                <button class="btn-small" @click="viewPoolDetails(pool)">Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        No pools found matching your criteria
      </div>
    </div>

    <!-- Pool Details Modal -->
    <div class="modal-overlay" v-if="selectedPool" @click="selectedPool = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedPool.pair }}</h3>
          <button class="close-btn" @click="selectedPool = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Protocol</span>
              <span class="value">{{ selectedPool.protocol }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Chain</span>
              <span class="value">{{ selectedPool.chain }}</span>
            </div>
            <div class="detail-item">
              <span class="label">TVL</span>
              <span class="value">${{ formatNumber(selectedPool.tvl) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">24h Volume</span>
              <span class="value">${{ formatNumber(selectedPool.volume24h) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">APY</span>
              <span class="value highlight">{{ selectedPool.apy.toFixed(2) }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">APR</span>
              <span class="value">{{ selectedPool.apr.toFixed(2) }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Risk</span>
              <span class="risk-badge" :class="selectedPool.risk">{{ selectedPool.risk }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Farm Type</span>
              <span class="value">{{ selectedPool.farmType }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Lock Period</span>
              <span class="value">{{ selectedPool.lockPeriod === 0 ? 'No lock' : selectedPool.lockPeriod + ' days' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Impermanent Loss</span>
              <span class="value">{{ (selectedPool.impermanentLoss * 100).toFixed(2) }}%</span>
            </div>
          </div>

          <!-- Compound Calculator -->
          <div class="compound-calculator">
            <h4>💰 Compound Growth Calculator</h4>
            <div class="calc-inputs">
              <input type="number" v-model="compoundCalc.principal" placeholder="Principal" />
              <select v-model="compoundCalc.frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input type="number" v-model="compoundCalc.days" placeholder="Days" />
              <button class="btn-primary" @click="calculateCompound">Calculate</button>
            </div>
            <div class="calc-result" v-if="compoundResult">
              <div>Final Amount: <strong>${{ formatNumber(compoundResult.finalAmount) }}</strong></div>
              <div>Total Return: <strong class="positive">+${{ formatNumber(compoundResult.totalReturn) }}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { yieldFarmingOptimizerApi, type YieldPool, type OptimizationResult, type MarketOverview, type PoolFilters, type OptimizationRequest } from '../../service/yieldFarmingOptimizer'

const chains = ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Avalanche', 'BSC', 'Base']

const loading = reactive({
  pools: false,
  optimize: false,
  overview: false
})

const marketOverview = ref<MarketOverview | null>(null)
const pools = ref<YieldPool[]>([])
const optimizationResult = ref<OptimizationResult | null>(null)
const selectedPool = ref<YieldPool | null>(null)

const poolFilters = reactive<PoolFilters>({
  chain: '',
  risk: ''
})

const optimizeRequest = reactive<OptimizationRequest>({
  principal: 10000,
  duration: 30,
  riskTolerance: 'medium',
  preferredChains: []
})

const compoundCalc = reactive({
  principal: 10000,
  frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
  days: 30
})

const compoundResult = ref<{ finalAmount: number; totalReturn: number } | null>(null)

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const getApyClass = (apy: number): string => {
  if (apy > 20) return 'high'
  if (apy > 10) return 'medium'
  return 'low'
}

const getRiskClass = (risk: number): string => {
  if (risk <= 1) return 'low'
  if (risk <= 2) return 'medium'
  return 'high'
}

const loadMarketOverview = async () => {
  try {
    loading.overview = true
    marketOverview.value = await yieldFarmingOptimizerApi.getMarketOverview()
  } catch (error) {
    console.error('Failed to load market overview:', error)
  } finally {
    loading.overview = false
  }
}

const loadPools = async () => {
  try {
    loading.pools = true
    const filters: PoolFilters = {}
    if (poolFilters.chain) filters.chain = poolFilters.chain
    if (poolFilters.risk) filters.risk = poolFilters.risk
    pools.value = await yieldFarmingOptimizerApi.getTopPools(20)
  } catch (error) {
    console.error('Failed to load pools:', error)
  } finally {
    loading.pools = false
  }
}

const handleOptimize = async () => {
  try {
    loading.optimize = true
    const request: OptimizationRequest = {
      principal: optimizeRequest.principal,
      duration: optimizeRequest.duration,
      riskTolerance: optimizeRequest.riskTolerance,
      preferredChains: optimizeRequest.preferredChains ? [optimizeRequest.preferredChains] : []
    }
    optimizationResult.value = await yieldFarmingOptimizerApi.optimizeYield(request)
  } catch (error) {
    console.error('Failed to optimize:', error)
  } finally {
    loading.optimize = false
  }
}

const viewPoolDetails = (pool: YieldPool) => {
  selectedPool.value = pool
  compoundCalc.principal = 10000
  compoundCalc.frequency = 'daily'
  compoundCalc.days = 30
  compoundResult.value = null
}

const calculateCompound = async () => {
  if (!selectedPool.value) return
  try {
    const result = await yieldFarmingOptimizerApi.calculateCompoundGrowth(
      compoundCalc.principal,
      selectedPool.value.apy,
      compoundCalc.frequency,
      compoundCalc.days
    )
    compoundResult.value = result
  } catch (error) {
    console.error('Failed to calculate compound:', error)
  }
}

onMounted(() => {
  loadMarketOverview()
  loadPools()
})
</script>

<style scoped>
.yield-farming-optimizer {
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
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card.overview {
  text-align: center;
}

.card-title {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-top: 8px;
}

.optimizer-form {
  margin-bottom: 24px;
}

.optimizer-form h3 {
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.btn-primary {
  background: #4f46e5;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-small {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-small:hover {
  background: #e5e7eb;
}

.results {
  margin-bottom: 24px;
}

.recommendation {
  background: #f0f9ff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.strategy-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-item .label {
  color: #666;
  font-size: 14px;
}

.summary-item .value {
  font-weight: 600;
  font-size: 16px;
}

.summary-item .value.positive {
  color: #10b981;
}

.strategy-allocation h4 {
  margin-bottom: 12px;
}

.allocation-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.allocation-bar {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
}

.bar-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.protocol {
  font-weight: 600;
}

.allocation {
  color: #4f46e5;
  font-weight: 600;
}

.bar-track {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-fill.low {
  background: #10b981;
}

.bar-fill.medium {
  background: #f59e0b;
}

.bar-fill.high {
  background: #ef4444;
}

.bar-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.bar-details .expected {
  color: #10b981;
  font-weight: 500;
}

.reasons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.reason-tag {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.pools-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
}

.filters {
  display: flex;
  gap: 8px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.pools-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
}

td {
  font-size: 14px;
}

.protocol-badge {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.apy-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
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
  background: #f3f4f6;
  color: #6b7280;
}

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.risk-badge.low {
  background: #dcfce7;
  color: #16a34a;
}

.risk-badge.medium {
  background: #fef3c7;
  color: #d97706;
}

.risk-badge.high {
  background: #fee2e2;
  color: #dc2626;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.detail-item .value {
  font-weight: 500;
}

.detail-item .value.highlight {
  color: #4f46e5;
  font-size: 18px;
}

.compound-calculator {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.compound-calculator h4 {
  margin-bottom: 12px;
}

.calc-inputs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.calc-inputs input,
.calc-inputs select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  flex: 1;
  min-width: 100px;
}

.calc-result {
  display: flex;
  gap: 24px;
  font-size: 14px;
}

.calc-result .positive {
  color: #10b981;
}
</style>
