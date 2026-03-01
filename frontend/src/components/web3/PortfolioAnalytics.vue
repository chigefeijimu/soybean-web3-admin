<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface PortfolioData {
  label: string
  value: number
  color: string
}

interface TimeSeries {
  date: string
  value: number
}

const portfolioData = ref<PortfolioData[]>([
  { label: 'ETH', value: 45, color: '#627EEA' },
  { label: 'BTC', value: 25, color: '#F7931A' },
  { label: 'USDC', value: 15, color: '#2775CA' },
  { label: 'AAVE', value: 10, color: '#2EBAC6' },
  { label: 'UNI', value: 5, color: '#FF007A' },
])

const historyData = ref<TimeSeries[]>([])
const loading = ref(true)

const totalValue = ref(125000)

const formatValue = (value: number) => {
  if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M'
  if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'K'
  return '$' + value.toFixed(2)
}

const totalPercent = () => portfolioData.value.reduce((sum, p) => sum + p.value, 0)

// Generate mock history data
onMounted(() => {
  const data: TimeSeries[] = []
  let value = 100000
  for (let i = 30; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    value = value * (1 + (Math.random() - 0.45) * 0.05)
    data.push({
      date: date.toISOString().split('T')[0],
      value
    })
  }
  historyData.value = data
  loading.value = false
})

const minValue = () => Math.min(...historyData.value.map(d => d.value))
const maxValue = () => Math.max(...historyData.value.map(d => d.value))

const change24h = ref(2.5)
const change7d = ref(8.3)
const change30d = ref(15.7)
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="p-6 border-b border-slate-700/50">
      <h2 class="text-xl font-semibold">📊 Portfolio Analytics</h2>
    </div>

    <!-- Total Value -->
    <div class="p-6 border-b border-slate-700/50">
      <p class="text-sm text-slate-400">Total Portfolio Value</p>
      <p class="text-3xl font-bold mt-1">{{ formatValue(totalValue) }}</p>
      <div class="flex gap-4 mt-2">
        <span :class="['text-sm font-medium', change24h >= 0 ? 'text-green-400' : 'text-red-400']">
          {{ change24h >= 0 ? '+' : '' }}{{ change24h }}% (24h)
        </span>
        <span :class="['text-sm font-medium', change7d >= 0 ? 'text-green-400' : 'text-red-400']">
          {{ change7d >= 0 ? '+' : '' }}{{ change7d }}% (7d)
        </span>
        <span :class="['text-sm font-medium', change30d >= 0 ? 'text-green-400' : 'text-red-400']">
          {{ change30d >= 0 ? '+' : '' }}{{ change30d }}% (30d)
        </span>
      </div>
    </div>

    <!-- Chart Area -->
    <div class="p-6 border-b border-slate-700/50">
      <h3 class="text-sm font-medium text-slate-400 mb-4">Portfolio History (30d)</h3>
      
      <!-- Simple Bar Chart -->
      <div v-if="!loading && historyData.length > 0" class="h-32 flex items-end gap-1">
        <div 
          v-for="(point, i) in historyData.slice(-14)"
          :key="i"
          class="flex-1 bg-gradient-to-t from-purple-500/50 to-purple-500/20 rounded-t transition-all hover:from-purple-400/50 hover:to-purple-400/20"
          :style="{ height: ((point.value - minValue()) / (maxValue() - minValue()) * 100 + '%') }"
          :title="point.date + ': ' + formatValue(point.value)"
        />
      </div>
      
      <!-- Loading -->
      <div v-else class="h-32 flex items-center justify-center">
        <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    </div>

    <!-- Allocation -->
    <div class="p-6">
      <h3 class="text-sm font-medium text-slate-400 mb-4">Asset Allocation</h3>
      
      <div class="space-y-3">
        <div v-for="item in portfolioData" :key="item.label" class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: item.color }"></div>
          <div class="flex-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium">{{ item.label }}</span>
              <span>{{ item.value }}%</span>
            </div>
            <div class="h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all"
                :style="{ width: item.value + '%', backgroundColor: item.color }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-700/50">
        <div>
          <p class="text-xs text-slate-500">Best Performer</p>
          <p class="font-medium text-green-400">AAVE +12.5%</p>
        </div>
        <div>
          <p class="text-xs text-slate-500">Worst Performer</p>
          <p class="font-medium text-red-400">UNI -2.3%</p>
        </div>
      </div>
    </div>
  </div>
</template>
