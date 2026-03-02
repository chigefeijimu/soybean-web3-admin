<template>
  <div class="pnl-tracker">
    <div class="header">
      <h2>📊 Realized P&L Tracker</h2>
      <div class="header-actions">
        <a-input-search
          v-model:value="walletAddress"
          placeholder="Enter wallet address"
          style="width: 400px"
          @search="loadWalletData"
          enter-button="Analyze"
        />
        <a-button type="primary" @click="generateDemoData" :loading="loading">
          Load Demo Data
        </a-button>
        <a-button @click="exportCSV" :disabled="!walletAddress">
          Export CSV
        </a-button>
      </div>
    </div>

    <a-spin :spinning="loading">
      <template v-if="pnlSummary">
        <!-- Summary Cards -->
        <a-row :gutter="16" class="summary-cards">
          <a-col :span="6">
            <a-card>
              <a-statistic
                title="Total Realized P&L"
                :value="pnlSummary.totalRealizedPnlUsd"
                :precision="2"
                prefix="$"
                :value-style="{ color: pnlSummary.totalRealizedPnlUsd >= 0 ? '#3f8600' : '#cf1322' }"
              >
                <template #suffix>
                  <span class="pnl-label">({{ pnlSummary.totalTrades }} trades)</span>
                </template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card>
              <a-statistic
                title="Unrealized P&L"
                :value="pnlSummary.totalUnrealizedPnlUsd"
                :precision="2"
                prefix="$"
                :value-style="{ color: pnlSummary.totalUnrealizedPnlUsd >= 0 ? '#3f8600' : '#cf1322' }"
              />
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card>
              <a-statistic
                title="Total Gas Fees"
                :value="pnlSummary.totalGasFeesUsd"
                :precision="2"
                prefix="$"
                value-style="{ color: '#cf1322' }"
              />
            </a-card>
          </a-col>
          <a-col :span="6">
            <a-card>
              <a-statistic
                title="Net P&L (Realized + Unrealized)"
                :value="pnlSummary.totalRealizedPnlUsd + pnlSummary.totalUnrealizedPnlUsd"
                :precision="2"
                prefix="$"
                :value-style="{ color: (pnlSummary.totalRealizedPnlUsd + pnlSummary.totalUnrealizedPnlUsd) >= 0 ? '#3f8600' : '#cf1322' }"
              />
            </a-card>
          </a-col>
        </a-row>

        <!-- Period Tabs -->
        <a-tabs v-model:activeKey="selectedPeriod" @change="loadPerformance" class="period-tabs">
          <a-tab-pane key="daily" tab="Daily" />
          <a-tab-pane key="weekly" tab="Weekly" />
          <a-tab-pane key="monthly" tab="Monthly" />
          <a-tab-pane key="yearly" tab="Yearly" />
          <a-tab-pane key="all" tab="All Time" />
        </a-tabs>

        <!-- Period P&L Details -->
        <a-row :gutter="16" v-if="currentPeriodPnl">
          <a-col :span="8">
            <a-card size="small" title="P&L Summary">
              <a-descriptions :column="1" size="small">
                <a-descriptions-item label="Total Realized">
                  <span :style="{ color: currentPeriodPnl.totalRealizedPnlUsd >= 0 ? '#3f8600' : '#cf1322' }">
                    ${{ currentPeriodPnl.totalRealizedPnlUsd.toFixed(2) }}
                  </span>
                </a-descriptions-item>
                <a-descriptions-item label="Total Trades">
                  {{ currentPeriodPnl.totalTrades }}
                </a-descriptions-item>
                <a-descriptions-item label="Buy Trades">
                  {{ currentPeriodPnl.totalBuyTrades }}
                </a-descriptions-item>
                <a-descriptions-item label="Sell Trades">
                  {{ currentPeriodPnl.totalSellsTrades }}
                </a-descriptions-item>
                <a-descriptions-item label="Win Rate">
                  {{ currentPeriodPnl.winRate.toFixed(1) }}%
                </a-descriptions-item>
                <a-descriptions-item label="Total Volume">
                  ${{ currentPeriodPnl.totalVolumeUsd.toFixed(2) }}
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card size="small" title="Trade Statistics">
              <a-descriptions :column="1" size="small">
                <a-descriptions-item label="Winning Trades">
                  {{ currentPeriodPnl.winningTrades }}
                </a-descriptions-item>
                <a-descriptions-item label="Losing Trades">
                  {{ currentPeriodPnl.losingTrades }}
                </a-descriptions-item>
                <a-descriptions-item label="Average Trade P&L">
                  ${{ currentPeriodPnl.averageTradePnl.toFixed(2) }}
                </a-descriptions-item>
                <a-descriptions-item label="Best Trade">
                  ${{ currentPeriodPnl.bestTradePnl.toFixed(2) }}
                </a-descriptions-item>
                <a-descriptions-item label="Worst Trade">
                  ${{ currentPeriodPnl.worstTradePnl.toFixed(2) }}
                </a-descriptions-item>
                <a-descriptions-item label="Gas Fees">
                  ${{ currentPeriodPnl.totalGasFeesUsd.toFixed(2) }}
                </a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card size="small" title="Performance Chart">
              <div ref="performanceChartRef" style="height: 200px"></div>
            </a-card>
          </a-col>
        </a-row>

        <!-- Performance Chart -->
        <a-card title="Portfolio Performance Over Time" class="performance-card" v-if="performance">
          <div ref="portfolioChartRef" style="height: 300px"></div>
        </a-card>

        <!-- Token Positions -->
        <a-card title="Token Positions" class="positions-card">
          <a-table
            :dataSource="pnlSummary.positions"
            :columns="positionColumns"
            :pagination="false"
            rowKey="tokenAddress"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'token'">
                <a-tag :color="getChainColor(record.chain)">{{ record.chain.toUpperCase() }}</a-tag>
                {{ record.tokenSymbol }}
              </template>
              <template v-else-if="column.key === 'holding'">
                {{ record.currentHolding.toFixed(4) }}
              </template>
              <template v-else-if="column.key === 'avgBuy'">
                ${{ record.averageBuyPrice.toFixed(2) }}
              </template>
              <template v-else-if="column.key === 'realizedPnl'">
                <span :style="{ color: record.realizedPnlUsd >= 0 ? '#3f8600' : '#cf1322' }">
                  ${{ record.realizedPnlUsd.toFixed(2) }}
                </span>
              </template>
              <template v-else-if="column.key === 'unrealizedPnl'">
                <span :style="{ color: record.unrealizedPnlUsd >= 0 ? '#3f8600' : '#cf1322' }">
                  ${{ record.unrealizedPnlUsd.toFixed(2) }}
                </span>
              </template>
              <template v-else-if="column.key === 'gas'">
                ${{ record.totalGasFeesUsd.toFixed(2) }}
              </template>
            </template>
          </a-table>
        </a-card>

        <!-- Token P&L Breakdown -->
        <a-card title="P&L by Token" class="token-pnl-card" v-if="currentPeriodPnl && currentPeriodPnl.tokenPnl">
          <a-table
            :dataSource="currentPeriodPnl.tokenPnl"
            :columns="tokenPnlColumns"
            :pagination="false"
            rowKey="tokenAddress"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'token'">
                <a-tag :color="getChainColor(record.chain)">{{ record.chain.toUpperCase() }}</a-tag>
                {{ record.tokenSymbol }}
              </template>
              <template v-else-if="column.key === 'realizedPnl'">
                <span :style="{ color: record.realizedPnlUsd >= 0 ? '#3f8600' : '#cf1322' }">
                  ${{ record.realizedPnlUsd.toFixed(2) }}
                </span>
              </template>
              <template v-else-if="column.key === 'volume'">
                ${{ record.totalVolumeUsd.toFixed(2) }}
              </template>
              <template v-else-if="column.key === 'avgSize'">
                ${{ record.averageTradeSizeUsd.toFixed(2) }}
              </template>
            </template>
          </a-table>
        </a-card>

        <!-- Add Trade Form -->
        <a-card title="Add Trade" class="add-trade-card">
          <a-form :model="tradeForm" layout="inline" @finish="addTrade">
            <a-form-item label="Token Address" name="tokenAddress">
              <a-input v-model:value="tradeForm.tokenAddress" placeholder="0x..." style="width: 200px" />
            </a-form-item>
            <a-form-item label="Symbol" name="tokenSymbol">
              <a-input v-model:value="tradeForm.tokenSymbol" placeholder="ETH" style="width: 100px" />
            </a-form-item>
            <a-form-item label="Chain" name="chain">
              <a-select v-model:value="tradeForm.chain" style="width: 120px">
                <a-select-option value="ethereum">ETH</a-select-option>
                <a-select-option value="polygon">Polygon</a-select-option>
                <a-select-option value="arbitrum">Arbitrum</a-select-option>
                <a-select-option value="optimism">Optimism</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="Type" name="tradeType">
              <a-select v-model:value="tradeForm.tradeType" style="width: 100px">
                <a-select-option value="buy">Buy</a-select-option>
                <a-select-option value="sell">Sell</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="Amount" name="amount">
              <a-input-number v-model:value="tradeForm.amount" :min="0" style="width: 120px" />
            </a-form-item>
            <a-form-item label="Price (USD)" name="priceUsd">
              <a-input-number v-model:value="tradeForm.priceUsd" :min="0" :precision="2" style="width: 120px" />
            </a-form-item>
            <a-form-item label="Gas Fee" name="gasFeeUsd">
              <a-input-number v-model:value="tradeForm.gasFeeUsd" :min="0" :precision="2" style="width: 100px" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" html-type="submit" :loading="addingTrade">Add Trade</a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </template>

      <a-empty v-else-if="!loading && !walletAddress" description="Enter a wallet address to analyze P&L" />
    </a-spin>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import * as echarts from 'echarts'

const walletAddress = ref('')
const loading = ref(false)
const addingTrade = ref(false)
const pnlSummary = ref(null)
const performance = ref(null)
const selectedPeriod = ref('monthly')

const performanceChartRef = ref(null)
const portfolioChartRef = ref(null)

const tradeForm = ref({
  tokenAddress: '',
  tokenSymbol: '',
  chain: 'ethereum',
  tradeType: 'buy',
  amount: 1,
  priceUsd: 0,
  gasFeeUsd: 0
})

const positionColumns = [
  { title: 'Token', key: 'token', width: 150 },
  { title: 'Holding', key: 'holding', width: 120 },
  { title: 'Avg Buy Price', key: 'avgBuy', width: 120 },
  { title: 'Realized P&L', key: 'realizedPnl', width: 120 },
  { title: 'Unrealized P&L', key: 'unrealizedPnl', width: 120 },
  { title: 'Gas Fees', key: 'gas', width: 100 },
]

const tokenPnlColumns = [
  { title: 'Token', key: 'token', width: 150 },
  { title: 'Trades', dataIndex: 'tradeCount', key: 'trades', width: 80 },
  { title: 'Realized P&L', key: 'realizedPnl', width: 120 },
  { title: 'Volume', key: 'volume', width: 120 },
  { title: 'Avg Trade Size', key: 'avgSize', width: 120 },
]

const currentPeriodPnl = computed(() => {
  if (!pnlSummary.value || !pnlSummary.value.periodPnl) return null
  return pnlSummary.value.periodPnl[selectedPeriod.value]
})

const getChainColor = (chain) => {
  const colors = {
    ethereum: '#627EEA',
    polygon: '#8247E5',
    arbitrum: '#28A0F0',
    optimism: '#FF0420',
    bsc: '#F3BA2F',
    base: '#0052FF'
  }
  return colors[chain] || '#666'
}

const loadWalletData = async () => {
  if (!walletAddress.value) {
    message.warning('Please enter a wallet address')
    return
  }
  
  loading.value = true
  try {
    const response = await fetch(`/api/web3/pnl/summary/${walletAddress.value}`)
    const result = await response.json()
    
    if (result.success) {
      pnlSummary.value = result.data
      await loadPerformance()
    } else {
      message.error(result.msg || 'Failed to load P&L data')
    }
  } catch (error) {
    message.error('Failed to load P&L data: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadPerformance = async () => {
  if (!walletAddress.value) return
  
  try {
    const response = await fetch(`/api/web3/pnl/performance/${walletAddress.value}/${selectedPeriod.value}`)
    const result = await response.json()
    
    if (result.success) {
      performance.value = result.data
      await nextTick()
      renderCharts()
    }
  } catch (error) {
    console.error('Failed to load performance:', error)
  }
}

const renderCharts = () => {
  // Performance Pie Chart
  if (performanceChartRef.value && pnlSummary.value) {
    const chart = echarts.init(performanceChartRef.value)
    const data = [
      { value: Math.max(0, pnlSummary.value.totalRealizedPnlUsd), name: 'Realized P&L' },
      { value: Math.max(0, pnlSummary.value.totalUnrealizedPnlUsd), name: 'Unrealized P&L' },
      { value: pnlSummary.value.totalGasFeesUsd, name: 'Gas Fees' },
    ]
    
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '${c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data,
        label: { formatter: '{b}: ${c}' }
      }]
    })
  }
  
  // Portfolio Performance Line Chart
  if (portfolioChartRef.value && performance.value && performance.value.timeframeReturn) {
    const chart = echarts.init(portfolioChartRef.value)
    const dates = performance.value.timeframeReturn.map(t => t.date)
    const values = performance.value.timeframeReturn.map(t => t.valueUsd)
    
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', axisLabel: { formatter: '${value}' } },
      series: [{
        type: 'line',
        data: values,
        smooth: true,
        areaStyle: { opacity: 0.3 },
        lineStyle: { color: '#1890ff' },
        itemStyle: { color: '#1890ff' }
      }]
    })
  }
}

const generateDemoData = async () => {
  if (!walletAddress.value) {
    message.warning('Please enter a wallet address first')
    return
  }
  
  loading.value = true
  try {
    const response = await fetch(`/api/web3/pnl/demo/${walletAddress.value}`)
    const result = await response.json()
    
    if (result.success) {
      message.success('Demo data loaded successfully')
      await loadWalletData()
    } else {
      message.error(result.msg || 'Failed to generate demo data')
    }
  } catch (error) {
    message.error('Failed to generate demo data: ' + error.message)
  } finally {
    loading.value = false
  }
}

const addTrade = async () => {
  if (!walletAddress.value) {
    message.warning('Please enter a wallet address')
    return
  }
  
  addingTrade.value = true
  try {
    const input = {
      ...tradeForm.value,
      walletAddress: walletAddress.value,
      gasFeeUsd: tradeForm.value.gasFeeUsd || 0,
      timestamp: Date.now() / 1000,
      txHash: `local_${Date.now()}`
    }
    
    const response = await fetch('/api/web3/pnl/trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    
    const result = await response.json()
    
    if (result.success) {
      message.success('Trade added successfully')
      await loadWalletData()
    } else {
      message.error(result.msg || 'Failed to add trade')
    }
  } catch (error) {
    message.error('Failed to add trade: ' + error.message)
  } finally {
    addingTrade.value = false
  }
}

const exportCSV = async () => {
  if (!walletAddress.value) return
  
  try {
    const response = await fetch(`/api/web3/pnl/export/${walletAddress.value}`)
    const result = await response.json()
    
    if (result.success) {
      const blob = new Blob([result.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pnl_trades_${walletAddress.value.slice(0, 8)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      message.success('CSV exported successfully')
    } else {
      message.error(result.msg || 'Failed to export CSV')
    }
  } catch (error) {
    message.error('Failed to export CSV: ' + error.message)
  }
}
</script>

<style scoped>
.pnl-tracker {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.summary-cards {
  margin-bottom: 20px;
}

.pnl-label {
  font-size: 12px;
  color: #666;
}

.performance-card,
.positions-card,
.token-pnl-card,
.add-trade-card {
  margin-top: 20px;
}

.period-tabs {
  margin-bottom: 20px;
}
</style>
