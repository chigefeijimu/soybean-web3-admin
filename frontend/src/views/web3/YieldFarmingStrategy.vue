<template>
  <div class="yield-farming-strategy">
    <div class="header">
      <h2>🎯 Yield Farming Strategy Generator</h2>
      <p class="subtitle">AI-powered yield farming strategy generator based on your preferences and market conditions</p>
    </div>

    <!-- Market Overview -->
    <div class="overview-section" v-if="marketOverview">
      <h3>📊 Market Overview by Chain</h3>
      <div class="chain-cards">
        <div 
          v-for="chain in marketOverview.chains" 
          :key="chain.chain" 
          class="chain-card"
        >
          <div class="chain-name">{{ formatChainName(chain.chain) }}</div>
          <div class="chain-apy">Avg APY: <span class="highlight">{{ chain.avgApy.toFixed(2) }}%</span></div>
          <div class="chain-tvl">TVL: ${{ formatNumber(chain.totalTvl) }}</div>
          <div class="chain-pools">{{ chain.poolCount }} pools</div>
          <div class="top-pool" v-if="chain.topPool">
            Top: {{ chain.topPool.protocol }} ({{ chain.topPool.apy.toFixed(1) }}%)
          </div>
        </div>
      </div>
    </div>

    <!-- Strategy Generator Form -->
    <div class="card strategy-form">
      <h3>🔧 Generate Your Strategy</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>💰 Investment Capital (USD)</label>
          <input type="number" v-model="strategyParams.capital" placeholder="10000" min="100" />
        </div>
        <div class="form-group">
          <label>⚠️ Risk Tolerance</label>
          <select v-model="strategyParams.riskTolerance">
            <option value="low">Low Risk - Stable yields, minimal volatility</option>
            <option value="medium">Medium Risk - Balanced approach</option>
            <option value="high">High Risk - Maximum yield, higher volatility</option>
          </select>
        </div>
        <div class="form-group">
          <label>🎯 Investment Goal</label>
          <select v-model="strategyParams.investmentGoal">
            <option value="stable">Stable Income - Focus on capital preservation</option>
            <option value="balanced">Balanced Growth - Mix of stability and growth</option>
            <option value="aggressive">Aggressive - Maximum returns</option>
          </select>
        </div>
        <div class="form-group">
          <label>⏱️ Timeframe</label>
          <select v-model="strategyParams.timeframe">
            <option value="short">Short Term (1-30 days)</option>
            <option value="medium">Medium Term (1-6 months)</option>
            <option value="long">Long Term (6+ months)</option>
          </select>
        </div>
        <div class="form-group">
          <label>🔗 Preferred Chains</label>
          <div class="checkbox-group">
            <label v-for="chain in availableChains" :key="chain" class="checkbox-label">
              <input 
                type="checkbox" 
                :value="chain" 
                v-model="strategyParams.preferredChains"
              />
              {{ formatChainName(chain) }}
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>🏦 Preferred Protocols</label>
          <div class="checkbox-group">
            <label v-for="protocol in availableProtocols" :key="protocol" class="checkbox-label">
              <input 
                type="checkbox" 
                :value="protocol" 
                v-model="strategyParams.preferredProtocols"
              />
              {{ protocol }}
            </label>
          </div>
        </div>
      </div>
      <button class="btn-primary" @click="generateStrategy" :disabled="loading.strategy">
        {{ loading.strategy ? 'Generating Strategy...' : '🚀 Generate Strategy' }}
      </button>
    </div>

    <!-- Generated Strategy Results -->
    <div class="card strategy-result" v-if="generatedStrategy">
      <div class="result-header">
        <h3>📋 Your Generated Strategy</h3>
        <span class="strategy-name">{{ generatedStrategy.name }}</span>
      </div>
      
      <div class="strategy-description">
        {{ generatedStrategy.description }}
      </div>

      <div class="strategy-metrics">
        <div class="metric">
          <span class="metric-label">Total APY</span>
          <span class="metric-value positive">{{ generatedStrategy.totalApy.toFixed(2) }}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">Expected Return</span>
          <span class="metric-value">${{ formatNumber(generatedStrategy.expectedReturn) }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Risk Score</span>
          <span class="metric-value" :class="getRiskClass(generatedStrategy.riskScore)">
            {{ generatedStrategy.riskScore }}/100
          </span>
        </div>
      </div>

      <div class="allocations">
        <h4>💼 Portfolio Allocation</h4>
        <div class="allocation-chart">
          <div 
            v-for="(alloc, index) in generatedStrategy.allocations" 
            :key="index"
            class="allocation-item"
          >
            <div class="alloc-header">
              <span class="alloc-protocol">{{ alloc.protocol }}</span>
              <span class="alloc-percentage">{{ alloc.percentage }}%</span>
            </div>
            <div class="alloc-bar">
              <div 
                class="alloc-fill" 
                :style="{ width: alloc.percentage + '%' }"
              ></div>
            </div>
            <div class="alloc-details">
              <span>{{ alloc.pool }} on {{ formatChainName(alloc.chain) }}</span>
              <span class="alloc-amount">${{ formatNumber(alloc.amount) }} @ {{ alloc.apy.toFixed(1) }}% APY</span>
            </div>
          </div>
        </div>
      </div>

      <div class="recommendations">
        <h4>💡 Recommendations</h4>
        <p>{{ generatedStrategy.recommendation }}</p>
      </div>

      <button class="btn-secondary" @click="generateStrategy">
        🔄 Regenerate Strategy
      </button>
    </div>

    <!-- Top Pre-defined Strategies -->
    <div class="card top-strategies" v-if="topStrategies.length">
      <h3>🏆 Top Strategies</h3>
      <div class="strategy-list">
        <div 
          v-for="strategy in topStrategies" 
          :key="strategy.id" 
          class="strategy-card"
          @click="selectStrategy(strategy)"
        >
          <div class="strategy-info">
            <span class="strategy-title">{{ strategy.name }}</span>
            <span class="strategy-desc">{{ strategy.description }}</span>
          </div>
          <div class="strategy-stats">
            <span class="apy">{{ strategy.apy.toFixed(1) }}% APY</span>
            <span class="risk" :class="'risk-' + strategy.risk">{{ strategy.risk }}</span>
          </div>
          <div class="strategy-chains">
            <span v-for="chain in strategy.chains" :key="chain" class="chain-tag">
              {{ formatChainName(chain) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Supported Protocols -->
    <div class="card protocols-section" v-if="protocols.length">
      <h3>🏦 Supported Protocols</h3>
      <div class="protocols-grid">
        <div 
          v-for="protocol in protocols" 
          :key="protocol.name" 
          class="protocol-card"
        >
          <div class="protocol-name">{{ protocol.name }}</div>
          <div class="protocol-category">{{ protocol.category }}</div>
          <div class="protocol-chains">
            <span v-for="chain in protocol.chains" :key="chain" class="chain-badge">
              {{ formatChainName(chain) }}
            </span>
          </div>
          <div class="protocol-stats">
            <span>Avg APY: {{ protocol.avgApy.toFixed(1) }}%</span>
            <span>TVL: ${{ formatNumber(protocol.totalTvl) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { yieldFarmingStrategyApi, type Strategy, type StrategyParams, type TopStrategy, type Protocol, type ChainOverview } from '@/service/yieldFarmingStrategy'

const loading = ref({
  strategy: false,
  overview: false
})

const marketOverview = ref<{
  timestamp: string
  chains: ChainOverview[]
  marketTrend: 'bullish' | 'bearish' | 'neutral'
  totalPools: number
} | null>(null)

const topStrategies = ref<TopStrategy[]>([])
const protocols = ref<Protocol[]>([])
const generatedStrategy = ref<Strategy | null>(null)

const availableChains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'avalanche', 'base', 'bsc']

const strategyParams = ref<StrategyParams>({
  capital: 10000,
  riskTolerance: 'medium',
  preferredChains: [],
  preferredProtocols: [],
  investmentGoal: 'balanced',
  timeframe: 'medium'
})

const availableProtocols = ['Aave', 'Compound', 'Uniswap V3', 'Curve', 'Yearn', 'Lido', 'GMX', 'QuickSwap', 'Velodrome', 'PancakeSwap', 'Trader Joe', 'Aerodrome']

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(2)
}

const formatChainName = (chain: string): string => {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    polygon: 'Polygon',
    avalanche: 'Avalanche',
    base: 'Base',
    bsc: 'BSC'
  }
  return names[chain] || chain
}

const getRiskClass = (risk: number | string): string => {
  if (typeof risk === 'number') {
    if (risk < 33) return 'risk-low'
    if (risk < 66) return 'risk-medium'
    return 'risk-high'
  }
  return `risk-${risk}`
}

const generateStrategy = async () => {
  loading.value.strategy = true
  try {
    const result = await yieldFarmingStrategyApi.generateStrategy(strategyParams.value)
    generatedStrategy.value = result
  } catch (error) {
    console.error('Failed to generate strategy:', error)
  } finally {
    loading.value.strategy = false
  }
}

const selectStrategy = (strategy: TopStrategy) => {
  // Pre-fill based on selected strategy
  strategyParams.value.riskTolerance = strategy.risk
  strategyParams.value.preferredChains = strategy.chains
  generateStrategy()
}

const loadData = async () => {
  try {
    const [overview, strategies, protos] = await Promise.all([
      yieldFarmingStrategyApi.getMarketOverview(),
      yieldFarmingStrategyApi.getTopStrategies(),
      yieldFarmingStrategyApi.getProtocols()
    ])
    marketOverview.value = overview
    topStrategies.value = strategies
    protocols.value = protos
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.yield-farming-strategy {
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
  color: #fff;
}

.subtitle {
  color: #888;
  font-size: 14px;
}

.overview-section {
  margin-bottom: 24px;
}

.overview-section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #fff;
}

.chain-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.chain-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 14px;
  transition: transform 0.2s, border-color 0.2s;
}

.chain-card:hover {
  transform: translateY(-2px);
  border-color: #4a4a6a;
}

.chain-name {
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.chain-apy {
  font-size: 13px;
  color: #aaa;
  margin-bottom: 4px;
}

.chain-apy .highlight {
  color: #10b981;
  font-weight: 600;
}

.chain-tvl, .chain-pools {
  font-size: 12px;
  color: #888;
}

.top-pool {
  font-size: 11px;
  color: #666;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #2a2a4a;
}

.card {
  background: #16162a;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.card h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #fff;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  color: #aaa;
}

.form-group input,
.form-group select {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4a4a8a;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #aaa;
  cursor: pointer;
}

.checkbox-label input {
  width: 14px;
  height: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #2a2a4a;
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  padding: 10px 20px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #3a3a5a;
}

/* Strategy Result Styles */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.strategy-name {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.strategy-description {
  color: #aaa;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 12px;
  background: #1a1a2e;
  border-radius: 8px;
}

.strategy-metrics {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 12px;
  color: #888;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.metric-value.positive {
  color: #10b981;
}

.allocations h4 {
  font-size: 14px;
  margin-bottom: 12px;
  color: #fff;
}

.allocation-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.allocation-item {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 12px;
}

.alloc-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.alloc-protocol {
  font-weight: 600;
  color: #fff;
}

.alloc-percentage {
  color: #667eea;
  font-weight: 600;
}

.alloc-bar {
  height: 8px;
  background: #2a2a4a;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.alloc-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.alloc-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
}

.alloc-amount {
  color: #10b981;
}

.recommendations {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.recommendations h4 {
  font-size: 14px;
  margin-bottom: 8px;
  color: #fff;
}

.recommendations p {
  font-size: 13px;
  color: #aaa;
  line-height: 1.6;
}

/* Top Strategies */
.strategy-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.strategy-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.strategy-card:hover {
  border-color: #4a4a8a;
}

.strategy-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.strategy-title {
  font-weight: 600;
  color: #fff;
}

.strategy-desc {
  font-size: 12px;
  color: #888;
}

.strategy-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.apy {
  color: #10b981;
  font-weight: 600;
}

.risk {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
}

.risk-low {
  background: #10b98122;
  color: #10b981;
}

.risk-medium {
  background: #f59e0b22;
  color: #f59e0b;
}

.risk-high {
  background: #ef444422;
  color: #ef4444;
}

.strategy-chains {
  display: flex;
  gap: 4px;
}

.chain-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: #2a2a4a;
  border-radius: 4px;
  color: #888;
}

/* Protocols Section */
.protocols-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.protocol-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 12px;
}

.protocol-name {
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.protocol-category {
  font-size: 12px;
  color: #667eea;
  margin-bottom: 8px;
}

.protocol-chains {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.chain-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #2a2a4a;
  border-radius: 4px;
  color: #888;
}

.protocol-stats {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #666;
}

.risk-low { color: #10b981; }
.risk-medium { color: #f59e0b; }
.risk-high { color: #ef4444; }
</style>
