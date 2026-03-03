<template>
  <div class="ai-market-prediction-container">
    <div class="header">
      <h1>🤖 AI Market Prediction</h1>
      <p>AI-powered market predictions combining technical analysis, on-chain metrics, and sentiment</p>
    </div>

    <!-- Market Summary -->
    <n-card class="summary-card" v-if="marketSummary">
      <n-row :gutter="20">
        <n-col :span="6">
          <div class="summary-item">
            <div class="summary-label">Market Trend</div>
            <div class="summary-value" :class="marketSummary.marketTrend">
              {{ marketSummary.marketTrend === 'bullish' ? '🐂 Bullish' : marketSummary.marketTrend === 'bearish' ? '🐻 Bearish' : '➡️ Neutral' }}
            </div>
          </div>
        </n-col>
        <n-col :span="6">
          <div class="summary-item">
            <div class="summary-label">Confidence</div>
            <div class="summary-value">{{ marketSummary.overallConfidence.toFixed(1) }}%</div>
          </div>
        </n-col>
        <n-col :span="6">
          <div class="summary-item">
            <div class="summary-label">Top Pick</div>
            <div class="summary-value highlight">{{ marketSummary.topPick }}</div>
          </div>
        </n-col>
        <n-col :span="6">
          <div class="summary-item">
            <div class="summary-label">Risk Level</div>
            <div class="summary-value" :class="marketSummary.riskLevel">
              {{ marketSummary.riskLevel === 'low' ? '🟢 Low' : marketSummary.riskLevel === 'medium' ? '🟡 Medium' : '🔴 High' }}
            </div>
          </div>
        </n-col>
      </n-row>
    </n-card>

    <!-- Quick Actions -->
    <n-card class="actions-card">
      <n-space>
        <n-button @click="loadAllPredictions" :loading="loading">
          📊 All Predictions
        </n-button>
        <n-button @click="loadTopBullish" :loading="loading">
          🐂 Top Bullish
        </n-button>
        <n-button @click="loadTopBearish" :loading="loading">
          🐻 Top Bearish
        </n-button>
        <n-button @click="loadStrongBuy" :loading="loading">
          ⭐ Strong Buy Signals
        </n-button>
      </n-space>
    </n-card>

    <!-- Search Token -->
    <n-card class="search-card">
      <n-form inline :model="searchForm">
        <n-form-item label="Token Symbol">
          <n-input
            v-model:value="searchForm.symbol"
            placeholder="BTC, ETH, SOL..."
            clearable
            style="width: 200px"
          />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="searchToken" :loading="loading">
            🔍 Analyze
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <!-- Token Prediction Detail -->
    <n-card v-if="selectedPrediction" class="prediction-detail-card">
      <template #header>
        <span>{{ selectedPrediction.symbol }} - {{ selectedPrediction.name }} Analysis</span>
      </template>
      
      <n-row :gutter="20">
        <!-- Price Info -->
        <n-col :span="8">
          <n-card class="info-card">
            <div class="info-title">💰 Price Info</div>
            <div class="info-row">
              <span>Current:</span>
              <span class="value">${{ formatPrice(selectedPrediction.currentPrice) }}</span>
            </div>
            <div class="info-row">
              <span>24h Change:</span>
              <span class="value" :class="selectedPrediction.priceChange24h >= 0 ? 'positive' : 'negative'">
                {{ selectedPrediction.priceChange24h >= 0 ? '+' : '' }}{{ selectedPrediction.priceChange24h.toFixed(2) }}%
              </span>
            </div>
          </n-card>
        </n-col>

        <!-- Prediction -->
        <n-col :span="8">
          <n-card class="info-card">
            <div class="info-title">🎯 Prediction</div>
            <div class="info-row">
              <span>Trend:</span>
              <span class="value" :class="selectedPrediction.prediction.trend">{{ selectedPrediction.prediction.trend }}</span>
            </div>
            <div class="info-row">
              <span>Signal:</span>
              <n-tag :type="getSignalType(selectedPrediction.prediction.signal)">
                {{ getSignalLabel(selectedPrediction.prediction.signal) }}
              </n-tag>
            </div>
            <div class="info-row">
              <span>Confidence:</span>
              <span class="value">{{ selectedPrediction.prediction.confidence.toFixed(1) }}%</span>
            </div>
          </n-card>
        </n-col>

        <!-- Risk -->
        <n-col :span="8">
          <n-card class="info-card">
            <div class="info-title">⚠️ Risk Assessment</div>
            <div class="info-row">
              <span>Level:</span>
              <n-tag :type="getRiskType(selectedPrediction.riskAssessment.level)">
                {{ selectedPrediction.riskAssessment.level.toUpperCase() }}
              </n-tag>
            </div>
            <div class="info-row">
              <span>Sentiment:</span>
              <span class="value">{{ selectedPrediction.sentimentScore.toFixed(1) }}/100</span>
            </div>
          </n-card>
        </n-col>
      </n-row>

      <!-- Technical Indicators -->
      <n-card class="indicators-card">
        <template #header>
          <span>📈 Technical Indicators</span>
        </template>
        <n-row :gutter="16">
          <n-col :span="4">
            <div class="indicator-item">
              <span class="indicator-label">RSI (14)</span>
              <span class="indicator-value" :class="getRsiClass(selectedPrediction.technicalIndicators.rsi)">
                {{ selectedPrediction.technicalIndicators.rsi.toFixed(1) }}
              </span>
            </div>
          </n-col>
          <n-col :span="4">
            <div class="indicator-item">
              <span class="indicator-label">MACD</span>
              <span class="indicator-value">{{ selectedPrediction.technicalIndicators.macd }}</span>
            </div>
          </n-col>
          <n-col :span="4">
            <div class="indicator-item">
              <span class="indicator-label">EMA 20</span>
              <span class="indicator-value">${{ formatPrice(selectedPrediction.technicalIndicators.ema20) }}</span>
            </div>
          </n-col>
          <n-col :span="4">
            <div class="indicator-item">
              <span class="indicator-label">EMA 50</span>
              <span class="indicator-value">${{ formatPrice(selectedPrediction.technicalIndicators.ema50) }}</span>
            </div>
          </n-col>
          <n-col :span="4">
            <div class="indicator-item">
              <span class="indicator-label">Trend</span>
              <span class="indicator-value" :class="selectedPrediction.technicalIndicators.trend">
                {{ selectedPrediction.technicalIndicators.trend }}
              </span>
            </div>
          </n-col>
          <n-col :span="4">
            <div class="indicator-item">
              <span class="indicator-label">BB Upper</span>
              <span class="indicator-value">${{ formatPrice(selectedPrediction.technicalIndicators.bollingerBands.upper) }}</span>
            </div>
          </n-col>
        </n-row>
      </n-card>

      <!-- On-chain Metrics -->
      <n-card class="onchain-card">
        <template #header>
          <span>⛓️ On-chain Metrics</span>
        </template>
        <n-row :gutter="16">
          <n-col :span="4">
            <div class="metric-item">
              <span class="metric-label">Exchange Flow</span>
              <span class="metric-value">{{ (selectedPrediction.onChainMetrics.exchangeFlowRatio * 100).toFixed(1) }}%</span>
            </div>
          </n-col>
          <n-col :span="4">
            <div class="metric-item">
              <span class="metric-label">Whale Activity</span>
              <span class="metric-value">{{ selectedPrediction.onChainMetrics.whaleActivity }}</span>
            </div>
          </n-col>
          <n-col :span="4">
            <div class="metric-item">
              <span class="metric-label">Network Growth</span>
              <span class="metric-value" :class="selectedPrediction.onChainMetrics.networkGrowth >= 0 ? 'positive' : 'negative'">
                {{ selectedPrediction.onChainMetrics.networkGrowth >= 0 ? '+' : '' }}{{ selectedPrediction.onChainMetrics.networkGrowth.toFixed(1) }}%
              </span>
            </div>
          </n-col>
          <n-col :span="4">
            <div class="metric-item">
              <span class="metric-label">Active Addresses</span>
              <span class="metric-value">{{ formatNumber(selectedPrediction.onChainMetrics.activeAddresses) }}</span>
            </div>
          </n-col>
          <n-col :span="4">
            <div class="metric-item">
              <span class="metric-label">Tx Volume</span>
              <span class="metric-value">${{ formatNumber(selectedPrediction.onChainMetrics.transactionVolume) }}</span>
            </div>
          </n-col>
        </n-row>
      </n-card>

      <!-- Risk Factors -->
      <n-card v-if="selectedPrediction.riskAssessment.factors.length > 0" class="risk-factors-card">
        <template #header>
          <span>⚠️ Risk Factors</span>
        </template>
        <n-space>
          <n-tag v-for="(factor, idx) in selectedPrediction.riskAssessment.factors" :key="idx" type="warning">
            {{ factor }}
          </n-tag>
        </n-space>
      </n-card>
    </n-card>

    <!-- Predictions Table -->
    <n-card v-if="predictions.length > 0" class="predictions-card">
      <template #header>
        <span>📊 Predictions ({{ predictions.length }})</span>
      </template>
      <n-data-table :columns="columns" :data="predictions" :bordered="false" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NButton, NTag, NCard, NInput, NSelect, NForm, NFormItem, NSpace, NRow, NCol, NDataTable, useMessage } from 'naive-ui'

const message = useMessage()
const loading = ref(false)
const predictions = ref<any[]>([])
const marketSummary = ref<any>(null)
const selectedPrediction = ref<any>(null)

const searchForm = ref({
  symbol: 'BTC'
})

const chainOptions = [
  { label: 'All Chains', value: 'all' },
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'BSC', value: 'bsc' },
]

const depthOptions = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
]

const columns = [
  {
    title: 'Token',
    key: 'symbol',
    width: 100,
    render: (row: any) => h('strong', row.symbol)
  },
  {
    title: 'Name',
    key: 'name',
    width: 120
  },
  {
    title: 'Price',
    key: 'currentPrice',
    width: 120,
    render: (row: any) => `$${formatPrice(row.currentPrice)}`
  },
  {
    title: '24h %',
    key: 'priceChange24h',
    width: 100,
    render: (row: any) => h('span', { 
      class: row.priceChange24h >= 0 ? 'positive' : 'negative' 
    }, `${row.priceChange24h >= 0 ? '+' : ''}${row.priceChange24h.toFixed(2)}%`)
  },
  {
    title: 'Trend',
    key: 'prediction.trend',
    width: 100,
    render: (row: any) => h(NTag, { 
      type: row.prediction.trend === 'bullish' ? 'success' : row.prediction.trend === 'bearish' ? 'error' : 'default',
      size: 'small'
    }, () => row.prediction.trend)
  },
  {
    title: 'Signal',
    key: 'prediction.signal',
    width: 120,
    render: (row: any) => h(NTag, { 
      type: getSignalType(row.prediction.signal),
      size: 'small'
    }, () => getSignalLabel(row.prediction.signal))
  },
  {
    title: 'Confidence',
    key: 'prediction.confidence',
    width: 100,
    render: (row: any) => `${row.prediction.confidence.toFixed(1)}%`
  },
  {
    title: 'RSI',
    key: 'technicalIndicators.rsi',
    width: 80,
    render: (row: any) => h('span', { 
      class: getRsiClass(row.technicalIndicators.rsi)
    }, row.technicalIndicators.rsi.toFixed(1))
  },
  {
    title: 'Risk',
    key: 'riskAssessment.level',
    width: 100,
    render: (row: any) => h(NTag, { 
      type: getRiskType(row.riskAssessment.level),
      size: 'small'
    }, () => row.riskAssessment.level.toUpperCase())
  },
  {
    title: 'Action',
    key: 'action',
    width: 100,
    render: (row: any) => h(NButton, { 
      size: 'small', 
      onClick: () => viewDetail(row)
    }, () => 'View')
  }
]

const formatPrice = (price: number) => {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return price.toFixed(2)
  return price.toFixed(4)
}

const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toString()
}

const getSignalType = (signal: string) => {
  const types: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    'strong_buy': 'success',
    'buy': 'success',
    'hold': 'info',
    'sell': 'warning',
    'strong_sell': 'error'
  }
  return types[signal] || 'info'
}

const getSignalLabel = (signal: string) => {
  const labels: Record<string, string> = {
    'strong_buy': '⭐ Strong Buy',
    'buy': 'Buy',
    'hold': 'Hold',
    'sell': 'Sell',
    'strong_sell': '💥 Strong Sell'
  }
  return labels[signal] || signal
}

const getRiskType = (risk: string) => {
  const types: Record<string, 'success' | 'warning' | 'error'> = {
    'low': 'success',
    'medium': 'warning',
    'high': 'error'
  }
  return types[risk] || 'info'
}

const getRsiClass = (rsi: number) => {
  if (rsi > 70) return 'overbought'
  if (rsi < 30) return 'oversold'
  return ''
}

const apiUrl = '/api/web3/ai-market-prediction'

const loadMarketSummary = async () => {
  try {
    const res = await fetch(`${apiUrl}/summary/market`)
    const data = await res.json()
    if (data.success) {
      marketSummary.value = data.data
    }
  } catch (e) {
    console.error('Failed to load market summary:', e)
  }
}

const loadAllPredictions = async () => {
  loading.value = true
  try {
    const res = await fetch(`${apiUrl}/all/list`)
    const data = await res.json()
    if (data.success) {
      predictions.value = data.data
      selectedPrediction.value = null
    }
  } catch (e) {
    message.error('Failed to load predictions')
  } finally {
    loading.value = false
  }
}

const loadTopBullish = async () => {
  loading.value = true
  try {
    const res = await fetch(`${apiUrl}/top/bullish?limit=10`)
    const data = await res.json()
    if (data.success) {
      predictions.value = data.data
      selectedPrediction.value = null
    }
  } catch (e) {
    message.error('Failed to load bullish predictions')
  } finally {
    loading.value = false
  }
}

const loadTopBearish = async () => {
  loading.value = true
  try {
    const res = await fetch(`${apiUrl}/top/bearish?limit=10`)
    const data = await res.json()
    if (data.success) {
      predictions.value = data.data
      selectedPrediction.value = null
    }
  } catch (e) {
    message.error('Failed to load bearish predictions')
  } finally {
    loading.value = false
  }
}

const loadStrongBuy = async () => {
  loading.value = true
  try {
    const res = await fetch(`${apiUrl}/signals/strong-buy?limit=10`)
    const data = await res.json()
    if (data.success) {
      predictions.value = data.data
      selectedPrediction.value = null
    }
  } catch (e) {
    message.error('Failed to load strong buy signals')
  } finally {
    loading.value = false
  }
}

const searchToken = async () => {
  if (!searchForm.value.symbol) {
    message.warning('Please enter a token symbol')
    return
  }
  loading.value = true
  try {
    const res = await fetch(`${apiUrl}/${searchForm.value.symbol.toUpperCase()}`)
    const data = await res.json()
    if (data.success) {
      selectedPrediction.value = data.data
      predictions.value = []
    } else {
      message.error(data.error || 'Token not found')
    }
  } catch (e) {
    message.error('Failed to search token')
  } finally {
    loading.value = false
  }
}

const viewDetail = (row: any) => {
  selectedPrediction.value = row
}

onMounted(async () => {
  await loadMarketSummary()
  await loadAllPredictions()
})
</script>

<style scoped>
.ai-market-prediction-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.summary-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: white;
}

.summary-value.highlight {
  color: #ffd700;
}

.summary-value.bullish {
  color: #4caf50;
}

.summary-value.bearish {
  color: #f44336;
}

.summary-value.neutral {
  color: #ffc107;
}

.actions-card {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.prediction-detail-card {
  margin-bottom: 20px;
}

.info-card {
  height: 100%;
}

.info-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .value {
  font-weight: 600;
}

.info-row .value.positive {
  color: #4caf50;
}

.info-row .value.negative {
  color: #f44336;
}

.info-row .value.bullish {
  color: #4caf50;
}

.info-row .value.bearish {
  color: #f44336;
}

.indicators-card,
.onchain-card {
  margin-top: 20px;
}

.indicator-item,
.metric-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.indicator-label,
.metric-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.indicator-value,
.metric-value {
  font-size: 16px;
  font-weight: 600;
}

.indicator-value.overbought {
  color: #f44336;
}

.indicator-value.oversold {
  color: #4caf50;
}

.indicator-value.uptrend {
  color: #4caf50;
}

.indicator-value.downtrend {
  color: #f44336;
}

.metric-value.positive {
  color: #4caf50;
}

.metric-value.negative {
  color: #f44336;
}

.risk-factors-card {
  margin-top: 20px;
}

.predictions-card {
  margin-top: 20px;
}

.positive {
  color: #4caf50;
}

.negative {
  color: #f44336;
}
</style>
