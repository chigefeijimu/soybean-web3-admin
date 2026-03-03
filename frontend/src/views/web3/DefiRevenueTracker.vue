<template>
  <div class="defi-revenue-tracker">
    <n-card title="DeFi Protocol Revenue & Fee Tracker" :bordered="false" class="revenue-card">
      <template #header-extra>
        <n-button text type="primary" @click="refreshData" :loading="loading">
          <template #icon>
            <n-icon><Refresh /></n-icon>
          </template>
          Refresh
        </n-button>
      </template>

      <n-tabs type="line" animated>
        <!-- Overview Tab -->
        <n-tab-pane name="overview" tab="Overview">
          <n-row :gutter="16">
            <n-col :span="6">
              <n-statistic label="Total 24h Revenue" :value="formatNumber(metrics?.totalProtocolRevenue || 0)" prefix="$">
                <template #suffix>USD</template>
              </n-statistic>
            </n-col>
            <n-col :span="6">
              <n-statistic label="Total 24h Fees" :value="formatNumber(metrics?.totalFees || 0)" prefix="$">
                <template #suffix>USD</template>
              </n-statistic>
            </n-col>
            <n-col :span="6">
              <n-statistic label="Protocols Tracked" :value="protocols?.length || 0" />
            </n-col>
            <n-col :span="6">
              <n-statistic label="Chains Supported" :value="uniqueChains" />
            </n-col>
          </n-row>

          <n-divider />

          <n-h3>Revenue by Category</n-h3>
          <n-row :gutter="16">
            <n-col :span="12">
              <div ref="categoryChartRef" style="height: 300px"></div>
            </n-col>
            <n-col :span="12">
              <n-data-table
                :columns="categoryColumns"
                :data="metrics?.revenueByCategory || []"
                :bordered="false"
              />
            </n-col>
          </n-row>

          <n-divider />

          <n-h3>Revenue by Chain</n-h3>
          <n-row :gutter="16">
            <n-col :span="12">
              <div ref="chainChartRef" style="height: 300px"></div>
            </n-col>
            <n-col :span="12">
              <n-data-table
                :columns="chainColumns"
                :data="metrics?.revenueByChain || []"
                :bordered="false"
              />
            </n-col>
          </n-row>
        </n-tab-pane>

        <!-- Protocols Tab -->
        <n-tab-pane name="protocols" tab="Protocols">
          <n-space vertical>
            <n-space>
              <n-select
                v-model:value="filterChain"
                placeholder="Filter by Chain"
                :options="chainOptions"
                clearable
                style="width: 200px"
              />
              <n-select
                v-model:value="filterCategory"
                placeholder="Filter by Category"
                :options="categoryOptions"
                clearable
                style="width: 200px"
              />
            </n-space>

            <n-data-table
              :columns="protocolColumns"
              :data="filteredProtocols"
              :bordered="false"
              :pagination="pagination"
            />
          </n-space>
        </n-tab-pane>

        <!-- Comparison Tab -->
        <n-tab-pane name="comparison" tab="Comparison">
          <n-space vertical>
            <n-space>
              <n-select
                v-model:value="selectedProtocols"
                placeholder="Select protocols to compare"
                :options="protocolOptions"
                multiple
                style="width: 400px"
              />
              <n-button type="primary" @click="compareSelected" :disabled="selectedProtocols.length < 2">
                Compare
              </n-button>
            </n-space>

            <n-card v-if="comparison" title="Comparison Results">
              <n-row :gutter="16">
                <n-col :span="8">
                  <n-statistic label="Total 24h Revenue" :value="formatNumber(comparison.totalRevenue24h)" prefix="$" />
                </n-col>
                <n-col :span="8">
                  <n-statistic label="Total 30d Revenue" :value="formatNumber(comparison.totalRevenue30d)" prefix="$" />
                </n-col>
                <n-col :span="4">
                  <n-statistic :label="`Top Gainer: ${comparison.topGainer?.name || '-'}`" :value="formatPercent(comparison.topGainer?.change || 0)" />
                </n-col>
                <n-col :span="4">
                  <n-statistic :label="`Top Loser: ${comparison.topLoser?.name || '-'}`" :value="formatPercent(comparison.topLoser?.change || 0)" />
                </n-col>
              </n-row>

              <n-divider />

              <n-data-table
                :columns="comparisonColumns"
                :data="comparison.protocols"
                :bordered="false"
              />
            </n-card>
          </n-space>
        </n-tab-pane>

        <!-- Fees Tab -->
        <n-tab-pane name="fees" tab="Fees Breakdown">
          <n-data-table
            :columns="feeColumns"
            :data="fees"
            :bordered="false"
            :pagination="pagination"
          />
        </n-tab-pane>

        <!-- History Tab -->
        <n-tab-pane name="history" tab="Revenue History">
          <n-space vertical>
            <n-space>
              <n-select
                v-model:value="historyProtocol"
                placeholder="Select Protocol"
                :options="protocolOptions"
                clearable
                style="width: 200px"
              />
              <n-select
                v-model:value="historyDays"
                :options="timeRangeOptions"
                style="width: 150px"
              />
              <n-button type="primary" @click="loadHistory">
                Load History
              </n-button>
            </n-space>

            <div ref="historyChartRef" style="height: 400px"></div>
          </n-space>
        </n-tab-pane>

        <!-- Alerts Tab -->
        <n-tab-pane name="alerts" tab="Alerts">
          <n-space vertical>
            <n-card title="Create Alert">
              <n-form ref="alertForm" :model="alertForm" inline>
                <n-form-item label="Protocol" path="protocol">
                  <n-select v-model:value="alertForm.protocol" :options="protocolOptions" style="width: 200px" />
                </n-form-item>
                <n-form-item label="Condition" path="condition">
                  <n-select v-model:value="alertForm.condition" :options="conditionOptions" style="width: 150px" />
                </n-form-item>
                <n-form-item label="Threshold ($)" path="threshold">
                  <n-input-number v-model:value="alertForm.threshold" :min="0" style="width: 200px" />
                </n-form-item>
                <n-form-item>
                  <n-button type="primary" @click="createAlert" :loading="loading">Create Alert</n-button>
                </n-form-item>
              </n-form>
            </n-card>

            <n-data-table
              :columns="alertColumns"
              :data="alerts"
              :bordered="false"
            />
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { NCard, NTabs, NTabPane, NStatistic, NRow, NCol, NButton, NSpace, NSelect, NDataTable, NDivider, NH3, NForm, NFormItem, NInputNumber, NIcon, NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Refresh } from '@vicons/ionicons5'
import * as echarts from 'echarts'

const message = useMessage()
const loading = ref(false)

// Data refs
const protocols = ref<any[]>([])
const metrics = ref<any>(null)
const comparison = ref<any>(null)
const fees = ref<any[]>([])
const alerts = ref<any[]>([])
const historyData = ref<any[]>([])

// Filters
const filterChain = ref<string | null>(null)
const filterCategory = ref<string | null>(null)
const selectedProtocols = ref<string[]>([])
const historyProtocol = ref<string | null>(null)
const historyDays = ref(30)

// Form refs
const alertForm = ref({
  protocol: null as string | null,
  condition: 'above',
  threshold: 1000000
})

// Chart refs
const categoryChartRef = ref<HTMLElement>()
const chainChartRef = ref<HTMLElement>()
const historyChartRef = ref<HTMLElement>()

// Computed
const uniqueChains = computed(() => {
  const chains = new Set(protocols.value.map(p => p.chain))
  return chains.size
})

const filteredProtocols = computed(() => {
  let result = protocols.value
  if (filterChain.value) {
    result = result.filter(p => p.chain === filterChain.value)
  }
  if (filterCategory.value) {
    result = result.filter(p => p.category === filterCategory.value)
  }
  return result
})

// Options
const chainOptions = computed(() => {
  const chains = [...new Set(protocols.value.map(p => p.chain))]
  return chains.map(c => ({ label: c, value: c }))
})

const categoryOptions = [
  { label: 'DEX', value: 'dex' },
  { label: 'Lending', value: 'lending' },
  { label: 'Liquid Staking', value: 'liquid_staking' },
  { label: 'Yield', value: 'yield' },
  { label: 'Bridge', value: 'bridge' },
  { label: 'Derivatives', value: 'derivatives' }
]

const protocolOptions = computed(() => {
  return protocols.value.map(p => ({ label: p.protocol, value: p.protocol }))
})

const timeRangeOptions = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 }
]

const conditionOptions = [
  { label: 'Above', value: 'above' },
  { label: 'Below', value: 'below' }
]

const pagination = {
  pageSize: 10
}

// Table columns
const categoryColumns: DataTableColumns<any> = [
  { title: 'Category', key: 'category' },
  { title: 'Revenue (24h)', key: 'revenue', render: (row) => formatNumber(row.revenue) },
  { title: 'Share (%)', key: 'percentage', render: (row) => formatPercent(row.percentage) }
]

const chainColumns: DataTableColumns<any> = [
  { title: 'Chain', key: 'chain' },
  { title: 'Revenue (24h)', key: 'revenue', render: (row) => formatNumber(row.revenue) },
  { title: 'Share (%)', key: 'percentage', render: (row) => formatPercent(row.percentage) }
]

const protocolColumns: DataTableColumns<any> = [
  { title: 'Protocol', key: 'protocol' },
  { title: 'Chain', key: 'chain' },
  { title: 'Category', key: 'category', render: (row) => h(NTag, { type: getCategoryType(row.category), size: 'small' }, { default: () => row.category }) },
  { title: 'Revenue (24h)', key: 'revenue24h', render: (row) => formatNumber(row.revenue24h) },
  { title: 'Revenue (7d)', key: 'revenue7d', render: (row) => formatNumber(row.revenue7d) },
  { title: 'Revenue (30d)', key: 'revenue30d', render: (row) => formatNumber(row.revenue30d) },
  { title: 'TVL', key: 'totalValueLocked', render: (row) => formatNumber(row.totalValueLocked) }
]

const comparisonColumns: DataTableColumns<any> = [
  { title: 'Protocol', key: 'name' },
  { title: 'Revenue (24h)', key: 'revenue24h', render: (row) => formatNumber(row.revenue24h) },
  { title: 'Revenue (30d)', key: 'revenue30d', render: (row) => formatNumber(row.revenue30d) },
  { title: 'TVL', key: 'tvl', render: (row) => formatNumber(row.tvl) },
  { title: 'Revenue/TVL (%)', key: 'revenueToTvl', render: (row) => formatPercent(row.revenueToTvl) }
]

const feeColumns: DataTableColumns<any> = [
  { title: 'Protocol', key: 'protocol' },
  { title: 'Chain', key: 'chain' },
  { title: 'Fee Type', key: 'feeType' },
  { title: 'Fee (24h)', key: 'fee24h', render: (row) => formatNumber(row.fee24h) },
  { title: 'Avg Fee (7d)', key: 'fee7dAvg', render: (row) => formatNumber(row.fee7dAvg) },
  { title: 'Fee %', key: 'feePercentage', render: (row) => formatPercent(row.feePercentage) }
]

const alertColumns: DataTableColumns<any> = [
  { title: 'Protocol', key: 'protocol' },
  { title: 'Condition', key: 'condition', render: (row) => h(NTag, { type: row.condition === 'above' ? 'success' : 'warning', size: 'small' }, { default: () => row.condition }) },
  { title: 'Threshold', key: 'threshold', render: (row) => formatNumber(row.threshold) },
  { title: 'Current', key: 'currentRevenue', render: (row) => formatNumber(row.currentRevenue) },
  { title: 'Triggered', key: 'triggered', render: (row) => h(NTag, { type: row.triggered ? 'error' : 'default', size: 'small' }, { default: () => row.triggered ? 'Yes' : 'No' }) },
  { title: 'Created', key: 'createdAt', render: (row) => new Date(row.createdAt).toLocaleDateString() }
]

// Helper functions
function formatNumber(value: number): string {
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B'
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M'
  if (value >= 1e3) return '$' + (value / 1e3).toFixed(2) + 'K'
  return '$' + value.toFixed(2)
}

function formatPercent(value: number): string {
  return (value >= 0 ? '+' : '') + value.toFixed(2) + '%'
}

function getCategoryType(category: string): 'success' | 'info' | 'warning' | 'error' {
  const types: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    dex: 'success',
    lending: 'info',
    liquid_staking: 'warning',
    yield: 'error',
    bridge: 'info',
    derivatives: 'warning'
  }
  return types[category] || 'info'
}

// API calls (mock for now - in production would use actual API)
async function loadData() {
  loading.value = true
  try {
    // Mock data for demonstration
    protocols.value = [
      { protocol: 'Uniswap', chain: 'Ethereum', category: 'dex', revenue24h: 4523000, revenue7d: 31661000, revenue30d: 135690000, totalValueLocked: 8950000000 },
      { protocol: 'Aave', chain: 'Ethereum', category: 'lending', revenue24h: 1890000, revenue7d: 13230000, revenue30d: 56700000, totalValueLocked: 15600000000 },
      { protocol: 'Curve', chain: 'Ethereum', category: 'dex', revenue24h: 1234000, revenue7d: 8638000, revenue30d: 37020000, totalValueLocked: 4200000000 },
      { protocol: 'Lido', chain: 'Ethereum', category: 'liquid_staking', revenue24h: 2100000, revenue7d: 14700000, revenue30d: 63000000, totalValueLocked: 32000000000 },
      { protocol: 'Sushiswap', chain: 'Ethereum', category: 'dex', revenue24h: 567000, revenue7d: 3969000, revenue30d: 17010000, totalValueLocked: 1800000000 },
      { protocol: 'Compound', chain: 'Ethereum', category: 'lending', revenue24h: 892000, revenue7d: 6244000, revenue30d: 26760000, totalValueLocked: 5200000000 },
      { protocol: 'Yearn', chain: 'Ethereum', category: 'yield', revenue24h: 456000, revenue7d: 3192000, revenue30d: 13680000, totalValueLocked: 3800000000 },
      { protocol: 'MakerDAO', chain: 'Ethereum', category: 'lending', revenue24h: 1234000, revenue7d: 8638000, revenue30d: 37020000, totalValueLocked: 8900000000 },
      { protocol: 'GMX', chain: 'Arbitrum', category: 'derivatives', revenue24h: 1890000, revenue7d: 13230000, revenue30d: 56700000, totalValueLocked: 1200000000 },
      { protocol: 'Balancer', chain: 'Ethereum', category: 'dex', revenue24h: 345000, revenue7d: 2415000, revenue30d: 10350000, totalValueLocked: 1800000000 },
      { protocol: 'dYdX', chain: 'Ethereum', category: 'derivatives', revenue24h: 987000, revenue7d: 6909000, revenue30d: 29610000, totalValueLocked: 890000000 },
      { protocol: 'Stargate', chain: 'Ethereum', category: 'bridge', revenue24h: 234000, revenue7d: 1638000, revenue30d: 7020000, totalValueLocked: 3400000000 }
    ]

    metrics.value = {
      totalProtocolRevenue: 16354000,
      totalFees: 12154000,
      revenueByCategory: [
        { category: 'dex', revenue: 6667000, percentage: 40.77 },
        { category: 'lending', revenue: 4016000, percentage: 24.56 },
        { category: 'liquid_staking', revenue: 2100000, percentage: 12.84 },
        { category: 'derivatives', revenue: 2877000, percentage: 17.59 },
        { category: 'yield', revenue: 456000, percentage: 2.79 },
        { category: 'bridge', revenue: 234000, percentage: 1.43 }
      ],
      revenueByChain: [
        { chain: 'Ethereum', revenue: 14476000, percentage: 88.52 },
        { chain: 'Arbitrum', revenue: 1878000, percentage: 11.48 }
      ]
    }

    fees.value = protocols.value.map(p => ({
      protocol: p.protocol,
      chain: p.chain,
      feeType: getFeeType(p.category),
      fee24h: p.revenue24h,
      fee7dAvg: p.revenue7d / 7,
      fee30dAvg: p.revenue30d / 30,
      feePercentage: (p.revenue24h / p.totalValueLocked) * 100
    }))

    // Generate mock history
    historyData.value = generateHistory(30)

    message.success('Data loaded successfully')
    updateCharts()
  } catch (error) {
    message.error('Failed to load data')
    console.error(error)
  } finally {
    loading.value = false
  }
}

function generateHistory(days: number) {
  const data = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toISOString().split('T')[0],
      revenue: 1000000 + Math.random() * 3000000
    })
  }
  return data
}

function getFeeType(category: string): string {
  const mapping: Record<string, string> = {
    dex: 'swap',
    lending: 'borrow',
    liquid_staking: 'stake',
    yield: 'other',
    bridge: 'bridge',
    derivatives: 'other'
  }
  return mapping[category] || 'other'
}

function updateCharts() {
  // Category chart
  if (categoryChartRef.value) {
    const chart = echarts.init(categoryChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: metrics.value?.revenueByCategory?.map((c: any) => ({ name: c.category, value: c.revenue })) || [],
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }]
    })
  }

  // Chain chart
  if (chainChartRef.value) {
    const chart = echarts.init(chainChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: metrics.value?.revenueByChain?.map((c: any) => ({ name: c.chain, value: c.revenue })) || [],
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }]
    })
  }

  // History chart
  if (historyChartRef.value) {
    const chart = echarts.init(historyChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: historyData.value.map(h => h.date) },
      yAxis: { type: 'value', axisLabel: { formatter: (value: number) => formatNumber(value) } },
      series: [{
        data: historyData.value.map(h => h.revenue),
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#18a058' }
      }]
    })
  }
}

async function refreshData() {
  await loadData()
}

async function compareSelected() {
  loading.value = true
  try {
    const total24h = selectedProtocols.value.reduce((sum, p) => {
      const protocol = protocols.value.find(proto => proto.protocol === p)
      return sum + (protocol?.revenue24h || 0)
    }, 0)

    const total30d = selectedProtocols.value.reduce((sum, p) => {
      const protocol = protocols.value.find(proto => proto.protocol === p)
      return sum + (protocol?.revenue30d || 0)
    }, 0)

    comparison.value = {
      protocols: selectedProtocols.value.map(p => {
        const protocol = protocols.value.find(proto => proto.protocol === p)
        return {
          name: p,
          revenue24h: protocol?.revenue24h || 0,
          revenue30d: protocol?.revenue30d || 0,
          tvl: protocol?.totalValueLocked || 0,
          revenueToTvl: ((protocol?.revenue24h || 0) / (protocol?.totalValueLocked || 1)) * 100
        }
      }),
      totalRevenue24h: total24h,
      totalRevenue30d: total30d,
      topGainer: { name: selectedProtocols.value[0], change: 5.2 },
      topLoser: { name: selectedProtocols.value[selectedProtocols.value.length - 1], change: -2.1 }
    }
    message.success('Comparison complete')
  } catch (error) {
    message.error('Comparison failed')
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  if (historyChartRef.value) {
    const chart = echarts.init(historyChartRef.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: historyData.value.map(h => h.date) },
      yAxis: { type: 'value', axisLabel: { formatter: (value: number) => formatNumber(value) } },
      series: [{
        data: historyData.value.map(h => h.revenue),
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#18a058' }
      }]
    })
  }
}

async function createAlert() {
  if (!alertForm.value.protocol) {
    message.warning('Please select a protocol')
    return
  }
  const newAlert = {
    id: `alert_${Date.now()}`,
    protocol: alertForm.value.protocol,
    condition: alertForm.value.condition,
    threshold: alertForm.value.threshold,
    currentRevenue: protocols.value.find(p => p.protocol === alertForm.value.protocol)?.revenue24h || 0,
    triggered: false,
    createdAt: new Date().toISOString()
  }
  alerts.value.push(newAlert)
  message.success('Alert created')
}

// Initialize
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.defi-revenue-tracker {
  padding: 16px;
}

.revenue-card {
  border-radius: 8px;
}

.help-text {
  font-size: 12px;
  color: #888;
}
</style>
