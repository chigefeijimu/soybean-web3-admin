<template>
  <div class="gas-smart-dashboard">
    <n-card title="⛽ Cross-chain Gas Smart Dashboard" :bordered="false">
      <n-tabs type="line" animated>
        <n-tab-pane name="overview" tab="Overview">
          <n-grid :cols="3" :x-gap="16" :y-gap="16">
            <n-gi>
              <n-statistic label="Total Chains" :value="chains.length" />
            </n-gi>
            <n-gi>
              <n-statistic label="Cheapest Chain" :value="cheapestChain" />
            </n-gi>
            <n-gi>
              <n-statistic label="Network Status" :value="healthyChains" suffix="/ OK" />
            </n-gi>
          </n-grid>
          
          <n-divider />
          
          <n-data-table :columns="chainColumns" :data="chains" :pagination="false" />
        </n-tab-pane>
        
        <n-tab-pane name="comparison" tab="Comparison">
          <n-card title="Chain Gas Price Ranking">
            <n-data-table :columns="rankingColumns" :data="comparisonData.ranking" :pagination="false" />
          </n-card>
          
          <n-divider />
          
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-card title="💚 Cheapest" segmentated>
                <n-statistic :label="comparisonData.cheapest?.chain" :value="comparisonData.cheapest?.gasPrice">
                  <template #suffix>{{ comparisonData.cheapest?.unit }}</template>
                </n-statistic>
              </n-card>
            </n-gi>
            <n-gi>
              <n-card title="🔴 Most Expensive" segmentated>
                <n-statistic :label="comparisonData.mostExpensive?.chain" :value="comparisonData.mostExpensive?.gasPrice">
                  <template #suffix>{{ comparisonData.mostExpensive?.unit }}</template>
                </n-statistic>
              </n-card>
            </n-gi>
          </n-grid>
        </n-tab-pane>
        
        <n-tab-pane name="analyzer" tab="Transaction Analyzer">
          <n-space vertical>
            <n-space>
              <n-select v-model:value="txChain" :options="chainOptions" placeholder="Select Chain" style="width: 200px" />
              <n-select v-model:value="txType" :options="txTypeOptions" placeholder="Transaction Type" style="width: 200px" />
              <n-select v-model:value="urgency" :options="urgencyOptions" placeholder="Urgency" style="width: 150px" />
              <n-button type="primary" @click="analyzeTransaction">Analyze</n-button>
            </n-space>
            
            <n-card v-if="analysis" title="Analysis Result">
              <n-descriptions :column="2" label-placement="left">
                <n-descriptions-item label="Chain">{{ analysis.chain }}</n-descriptions-item>
                <n-descriptions-item label="Recommended Speed">{{ analysis.recommendedSpeed }}</n-descriptions-item>
                <n-descriptions-item label="Gas Saved">{{ analysis.gasSaved }} Gwei</n-descriptions-item>
                <n-descriptions-item label="Savings">{{ analysis.savingsPercent?.toFixed(2) }}%</n-descriptions-item>
                <n-descriptions-item label="Best Time">{{ analysis.nextOptimalWindow?.start }} - {{ analysis.nextOptimalWindow?.end }}</n-descriptions-item>
                <n-descriptions-item label="Expected Gas">{{ analysis.nextOptimalWindow?.expectedGas }} Gwei</n-descriptions-item>
              </n-descriptions>
            </n-card>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="calculator" tab="Gas Calculator">
          <n-space vertical>
            <n-space>
              <n-select v-model:value="calcChain" :options="chainOptions" placeholder="Select Chain" style="width: 200px" />
              <n-select v-model:value="calcTxType" :options="txTypeOptions" placeholder="Transaction Type" style="width: 200px" />
              <n-input-number v-model:value="calcValue" placeholder="USD Value (optional)" style="width: 200px" />
              <n-button type="primary" @click="calculateGas">Calculate</n-button>
            </n-space>
            
            <n-card v-if="calculator" title="Gas Cost Estimate">
              <n-grid :cols="3" :x-gap="16">
                <n-gi>
                  <n-card>
                    <n-statistic label="🐢 Slow">
                      <template #default>{{ calculator.prices?.slow }}</template>
                      <template #suffix>{{ calcChain === 'Avalanche' ? 'nAVAX' : 'ETH' }}</template>
                    </n-statistic>
                    <n-tag v-if="calculator.usdValue" type="success" size="small">
                      ${{ calculator.usdValue?.slow }}
                    </n-tag>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card>
                    <n-statistic label="🚶 Average">
                      <template #default>{{ calculator.prices?.average }}</template>
                      <template #suffix>{{ calcChain === 'Avalanche' ? 'nAVAX' : 'ETH' }}</template>
                    </n-statistic>
                    <n-tag v-if="calculator.usdValue" type="warning" size="small">
                      ${{ calculator.usdValue?.average }}
                    </n-tag>
                  </n-card>
                </n-gi>
                <n-gi>
                  <n-card>
                    <n-statistic label="🚀 Fast">
                      <template #default>{{ calculator.prices?.fast }}</template>
                      <template #suffix>{{ calcChain === 'Avalanche' ? 'nAVAX' : 'ETH' }}</template>
                    </n-statistic>
                    <n-tag v-if="calculator.usdValue" type="error" size="small">
                      ${{ calculator.usdValue?.fast }}
                    </n-tag>
                  </n-card>
                </n-gi>
              </n-grid>
              
              <n-divider />
              
              <n-card title="Recommendations">
                <n-descriptions :column="3" label-placement="top">
                  <n-descriptions-item label="Value < $100">
                    {{ calculator.recommendations?.ifValueUnder100 }}
                  </n-descriptions-item>
                  <n-descriptions-item label="Value < $1000">
                    {{ calculator.recommendations?.ifValueUnder1000 }}
                  </n-descriptions-item>
                  <n-descriptions-item label="Value > $1000">
                    {{ calculator.recommendations?.ifValueOver1000 }}
                  </n-descriptions-item>
                </n-descriptions>
              </n-card>
            </n-card>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="history" tab="Gas History">
          <n-space vertical>
            <n-space>
              <n-select v-model:value="historyChain" :options="chainOptions" placeholder="Select Chain" style="width: 200px" />
              <n-select v-model:value="historyDays" :options="daysOptions" placeholder="Days" style="width: 150px" />
              <n-button type="primary" @click="loadHistory">Load History</n-button>
            </n-space>
            
            <n-card v-if="historyData">
              <n-statistic label="Average Gas" :value="historyData.stats?.avg" />
              <n-statistic label="Min Gas" :value="historyData.stats?.min" />
              <n-statistic label="Max Gas" :value="historyData.stats?.max" />
              <n-statistic label="Volatility" :value="historyData.stats?.volatility" suffix="%" />
            </n-card>
          </n-space>
        </n-tab-pane>
        
        <n-tab-pane name="crosschain" tab="Cross-chain">
          <n-space vertical>
            <n-space>
              <n-select v-model:value="fromChain" :options="chainOptions" placeholder="From Chain" style="width: 200px" />
              <n-select v-model:value="toChain" :options="chainOptions" placeholder="To Chain" style="width: 200px" />
              <n-button type="primary" @click="compareCrossChain">Compare</n-button>
            </n-space>
            
            <n-card v-if="crossChainData" title="Cross-chain Bridge Cost">
              <n-descriptions :column="2" label-placement="left">
                <n-descriptions-item label="From">{{ crossChainData.fromChain }}</n-descriptions-item>
                <n-descriptions-item label="To">{{ crossChainData.toChain }}</n-descriptions-item>
                <n-descriptions-item label="Recommended Bridge">{{ crossChainData.recommendedBridge }}</n-descriptions-item>
                <n-descriptions-item label="Total Cost">${{ crossChainData.totalCost }}</n-descriptions-item>
                <n-descriptions-item label="Time Estimate">{{ crossChainData.timeEstimate }}</n-descriptions-item>
                <n-descriptions-item label="Savings vs Native">{{ crossChainData.savingsVsNative }}%</n-descriptions-item>
              </n-descriptions>
            </n-card>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { gasSmartDashboardApi } from '@/service/gasSmartDashboard'

const chains = ref<any[]>([])
const comparisonData = ref<any>({})
const analysis = ref<any>(null)
const calculator = ref<any>(null)
const historyData = ref<any>(null)
const crossChainData = ref<any>(null)

// Form values
const txChain = ref('Ethereum')
const txType = ref('erc20_transfer')
const urgency = ref('medium')
const calcChain = ref('Ethereum')
const calcTxType = ref('erc20_transfer')
const calcValue = ref<number | undefined>(undefined)
const historyChain = ref('Ethereum')
const historyDays = ref(7)
const fromChain = ref('Ethereum')
const toChain = ref('Polygon')

const chainOptions = [
  { label: 'Ethereum', value: 'Ethereum' },
  { label: 'Polygon', value: 'Polygon' },
  { label: 'Arbitrum', value: 'Arbitrum' },
  { label: 'Optimism', value: 'Optimism' },
  { label: 'BSC', value: 'BSC' },
  { label: 'Base', value: 'Base' },
  { label: 'Avalanche', value: 'Avalanche' },
  { label: 'zkSync', value: 'zkSync' },
  { label: 'Starknet', value: 'Starknet' },
  { label: 'Linea', value: 'Linea' },
]

const txTypeOptions = [
  { label: 'ETH Transfer', value: 'eth_transfer' },
  { label: 'ERC20 Transfer', value: 'erc20_transfer' },
  { label: 'Swap', value: 'swap' },
  { label: 'NFT Transfer', value: 'nft_transfer' },
  { label: 'Approve', value: 'approve' },
  { label: 'Stake', value: 'stake' },
  { label: 'Bridge', value: 'bridge' },
]

const urgencyOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

const daysOptions = [
  { label: '7 Days', value: 7 },
  { label: '14 Days', value: 14 },
  { label: '30 Days', value: 30 },
]

const chainColumns = [
  { title: 'Chain', key: 'chain' },
  { title: 'Slow (Gwei)', key: 'current', render: (row: any) => row.current?.slow },
  { title: 'Average (Gwei)', key: 'current', render: (row: any) => row.current?.average },
  { title: 'Fast (Gwei)', key: 'current', render: (row: any) => row.current?.fast },
  { title: 'Trend', key: 'trend', render: (row: any) => {
    const colors = { rising: 'error', falling: 'success', stable: 'default' }
    return h(NTag, { type: colors[row.trend] as any, size: 'small' }, { default: () => row.trend })
  }},
  { title: 'Network', key: 'networkStatus', render: (row: any) => {
    const colors = { healthy: 'success', congested: 'error', degraded: 'warning' }
    return h(NTag, { type: colors[row.networkStatus] as any, size: 'small' }, { default: () => row.networkStatus })
  }},
  { title: 'Best Time', key: 'bestTime' },
]

const rankingColumns = [
  { title: 'Rank', key: 'rank', width: 80 },
  { title: 'Chain', key: 'chain' },
  { title: 'Gas Price', key: 'gasPrice' },
  { title: 'Unit', key: 'unit' },
]

import { h } from 'vue'
import { NTag, NCard, NStatistic, NGrid, NGi, NTabs, NTabPane, NButton, NSelect, NSpace, NDataTable, NDivider, NDescriptions, NDescriptionsItem, NInputNumber } from 'naive-ui'

const cheapestChain = computed(() => {
  if (!chains.value.length) return '-'
  const sorted = [...chains.value].sort((a, b) => a.current.average - b.current.average)
  return sorted[0]?.chain
})

const healthyChains = computed(() => {
  return chains.value.filter(c => c.networkStatus === 'healthy').length
})

const loadData = async () => {
  try {
    const [chainsRes, comparisonRes] = await Promise.all([
      gasSmartDashboardApi.getAllChainsGas(),
      gasSmartDashboardApi.getGasComparison(),
    ])
    chains.value = chainsRes
    comparisonData.value = comparisonRes
  } catch (error) {
    console.error('Failed to load gas data:', error)
  }
}

const analyzeTransaction = async () => {
  try {
    analysis.value = await gasSmartDashboardApi.analyzeGas(txChain.value, txType.value, urgency.value)
  } catch (error) {
    console.error('Failed to analyze:', error)
  }
}

const calculateGas = async () => {
  try {
    calculator.value = await gasSmartDashboardApi.calculateGas(calcTxType.value, calcChain.value, calcValue.value)
  } catch (error) {
    console.error('Failed to calculate:', error)
  }
}

const loadHistory = async () => {
  try {
    historyData.value = await gasSmartDashboardApi.getGasHistory(historyChain.value, historyDays.value)
  } catch (error) {
    console.error('Failed to load history:', error)
  }
}

const compareCrossChain = async () => {
  try {
    crossChainData.value = await gasSmartDashboardApi.getCrossChainComparison(fromChain.value, toChain.value)
  } catch (error) {
    console.error('Failed to compare:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.gas-smart-dashboard {
  padding: 16px;
}
</style>
