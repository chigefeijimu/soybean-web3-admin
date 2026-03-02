<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  fetchTransactionTimeline, 
  fetchTransactionPatterns, 
  fetchHourlyDistribution,
  fetchTxTimelineChains,
  type TimelineGroup,
  type TimelineStats,
  type TransactionPatterns,
  type HourlyDistribution
} from '@/service/api/web3'

// State
const address = ref('')
const selectedChain = ref('ethereum')
const selectedPeriod = ref<'day' | 'week' | 'month'>('day')
const days = ref(30)
const loading = ref(false)
const timelineData = ref<{ timeline: TimelineGroup[]; stats: TimelineStats } | null>(null)
const patterns = ref<TransactionPatterns | null>(null)
const distribution = ref<HourlyDistribution | null>(null)
const supportedChains = ref<string[]>([])
const activeTab = ref<'timeline' | 'patterns' | 'distribution'>('timeline')

// Day names
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Load supported chains
onMounted(async () => {
  try {
    const result = await fetchTxTimelineChains()
    supportedChains.value = result.chains
  } catch (e) {
    console.error('Failed to load chains:', e)
    supportedChains.value = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche']
  }
})

// Watch for address changes and refetch
watch([address, selectedChain, selectedPeriod, days], () => {
  if (address.value) {
    loadData()
  }
})

// Load all data
async function loadData() {
  if (!address.value) return
  
  loading.value = true
  try {
    const [timeline, pats, dist] = await Promise.all([
      fetchTransactionTimeline({
        address: address.value,
        chain: selectedChain.value,
        period: selectedPeriod.value,
        days: days.value
      }),
      fetchTransactionPatterns(address.value, selectedChain.value),
      fetchHourlyDistribution(address.value, selectedChain.value)
    ])
    
    timelineData.value = timeline
    patterns.value = pats
    distribution.value = dist
  } catch (e) {
    console.error('Failed to load data:', e)
  } finally {
    loading.value = false
  }
}

// Format timestamp
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

// Format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

// Get status color
function getStatusColor(status: string): string {
  return status === 'success' ? 'text-green-500' : 'text-red-500'
}

// Get type label
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'uniswap_swap': 'Uniswap Swap',
    'uniswap_v3': 'Uniswap V3',
    'sushi_swap': 'SushiSwap',
    'compound': 'Compound',
    'aave': 'Aave',
    'transfer': 'Transfer'
  }
  return labels[type] || type
}

// Truncate address
function truncateAddress(addr: string): string {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

// Calculate pattern data
const patternChartData = computed(() => {
  if (!patterns.value) return []
  return patterns.value.transactionTypes.map(t => ({
    label: getTypeLabel(t.type),
    value: t.count,
    percentage: ((t.count / patterns.value!.transactionTypes.reduce((sum, x) => sum + x.count, 0)) * 100).toFixed(1)
  }))
})

// Calculate hourly distribution data
const hourlyChartData = computed(() => {
  if (!distribution.value) return []
  return distribution.value.hours.map(h => ({
    hour: h.hour,
    count: h.count,
    percentage: h.percentage
  }))
})

// Calculate daily distribution data
const dailyChartData = computed(() => {
  if (!distribution.value) return []
  return distribution.value.days.map(d => ({
    name: d.name,
    count: d.count,
    percentage: d.percentage
  }))
})
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">📊 Transaction Timeline</h1>
      <p class="text-gray-400">Analyze wallet transaction patterns over time</p>
    </div>

    <!-- Search Form -->
    <div class="bg-gray-800 rounded-lg p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm text-gray-400 mb-1">Wallet Address</label>
          <input 
            v-model="address" 
            type="text" 
            placeholder="0x..." 
            class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Chain</label>
          <select 
            v-model="selectedChain" 
            class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option v-for="chain in supportedChains" :key="chain" :value="chain">
              {{ chain.charAt(0).toUpperCase() + chain.slice(1) }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Period</label>
          <select 
            v-model="selectedPeriod" 
            class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-400 mb-1">Days</label>
          <select 
            v-model="days" 
            class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option :value="7">7 Days</option>
            <option :value="14">14 Days</option>
            <option :value="30">30 Days</option>
            <option :value="60">60 Days</option>
            <option :value="90">90 Days</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <p class="mt-2 text-gray-400">Loading transaction data...</p>
    </div>

    <!-- Results -->
    <div v-else-if="timelineData">
      <!-- Tabs -->
      <div class="flex gap-2 mb-6">
        <button 
          @click="activeTab = 'timeline'"
          :class="['px-4 py-2 rounded', activeTab === 'timeline' ? 'bg-blue-600' : 'bg-gray-700']"
        >
          📅 Timeline
        </button>
        <button 
          @click="activeTab = 'patterns'"
          :class="['px-4 py-2 rounded', activeTab === 'patterns' ? 'bg-blue-600' : 'bg-gray-700']"
        >
          📈 Patterns
        </button>
        <button 
          @click="activeTab = 'distribution'"
          :class="['px-4 py-2 rounded', activeTab === 'distribution' ? 'bg-blue-600' : 'bg-gray-700']"
        >
          ⏰ Distribution
        </button>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-gray-800 rounded-lg p-4">
          <div class="text-gray-400 text-sm">Total Transactions</div>
          <div class="text-2xl font-bold">{{ timelineData.stats.totalTransactions }}</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4">
          <div class="text-gray-400 text-sm">Total Value (ETH)</div>
          <div class="text-2xl font-bold">{{ parseFloat(timelineData.stats.totalValue).toFixed(4) }}</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4">
          <div class="text-gray-400 text-sm">Success Rate</div>
          <div class="text-2xl font-bold" :class="parseFloat(timelineData.stats.successRate) > 90 ? 'text-green-500' : 'text-yellow-500'">
            {{ timelineData.stats.successRate }}%
          </div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4">
          <div class="text-gray-400 text-sm">Avg Gas Price</div>
          <div class="text-2xl font-bold">{{ timelineData.stats.averageGasPrice }} gwei</div>
        </div>
        <div class="bg-gray-800 rounded-lg p-4">
          <div class="text-gray-400 text-sm">Total Gas Used</div>
          <div class="text-2xl font-bold">{{ (parseInt(timelineData.stats.totalGasUsed) / 1000).toFixed(1) }}K</div>
        </div>
      </div>

      <!-- Timeline Tab -->
      <div v-if="activeTab === 'timeline'" class="space-y-4">
        <div 
          v-for="group in timelineData.timeline" 
          :key="group.date"
          class="bg-gray-800 rounded-lg p-4"
        >
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-semibold">{{ formatDate(group.date) }}</h3>
            <div class="text-sm text-gray-400">
              {{ group.count }} transactions · {{ parseFloat(group.totalValue).toFixed(4) }} ETH
            </div>
          </div>
          
          <div class="space-y-2">
            <div 
              v-for="tx in group.transactions.slice(0, 5)" 
              :key="tx.hash"
              class="bg-gray-700 rounded p-3 flex justify-between items-center"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono text-gray-400 truncate">{{ truncateAddress(tx.hash) }}</span>
                  <span :class="['text-xs', getStatusColor(tx.status)]">{{ tx.status }}</span>
                </div>
                <div class="text-sm text-gray-300 mt-1">
                  {{ truncateAddress(tx.from) }} → {{ truncateAddress(tx.to) }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold">{{ tx.value }} ETH</div>
                <div class="text-xs text-gray-400">{{ formatTime(tx.timestamp) }}</div>
              </div>
            </div>
            <div v-if="group.transactions.length > 5" class="text-center text-gray-400 text-sm">
              + {{ group.transactions.length - 5 }} more transactions
            </div>
          </div>
        </div>
      </div>

      <!-- Patterns Tab -->
      <div v-if="activeTab === 'patterns' && patterns" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-800 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-4">🏆 Transaction Types</h3>
          <div class="space-y-3">
            <div v-for="pattern in patternChartData" :key="pattern.label" class="flex items-center gap-3">
              <div class="w-24 text-sm text-gray-400">{{ pattern.label }}</div>
              <div class="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  class="bg-blue-500 h-full rounded-full"
                  :style="{ width: pattern.percentage + '%' }"
                ></div>
              </div>
              <div class="w-16 text-right text-sm">{{ pattern.value }}</div>
            </div>
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-4">📊 Activity Insights</h3>
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-400">Most Active Hour</span>
              <span class="font-semibold">{{ patterns.mostActiveHour }}:00</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Most Active Day</span>
              <span class="font-semibold">{{ dayNames[patterns.mostActiveDay] }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">Average TX Value</span>
              <span class="font-semibold">{{ parseFloat(patterns.averageTxValue).toFixed(4) }} ETH</span>
            </div>
          </div>

          <h4 class="text-md font-semibold mt-6 mb-3">Top Interactions</h4>
          <div class="space-y-2">
            <div 
              v-for="interaction in patterns.commonInteractions.slice(0, 5)" 
              :key="interaction.address"
              class="flex justify-between text-sm"
            >
              <span class="font-mono text-gray-400">{{ truncateAddress(interaction.address) }}</span>
              <span>{{ interaction.count }} txns</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Distribution Tab -->
      <div v-if="activeTab === 'distribution' && distribution" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-800 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-4">🕐 Hourly Distribution</h3>
          <div class="grid grid-cols-6 gap-1">
            <div 
              v-for="hour in hourlyChartData" 
              :key="hour.hour"
              class="text-center"
            >
              <div 
                class="rounded mb-1"
                :style="{ 
                  height: '30px', 
                  backgroundColor: `rgba(59, 130, 246, ${Math.min(parseFloat(hour.percentage) / 100, 1)})`
                }"
              ></div>
              <div class="text-xs text-gray-400">{{ hour.hour }}</div>
            </div>
          </div>
          <div class="mt-2 text-center text-sm text-gray-400">
            Peak: {{ hourlyChartData.reduce((max, h) => h.count > max.count ? h : max, hourlyChartData[0]).hour }}:00
          </div>
        </div>

        <div class="bg-gray-800 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-4">📅 Daily Distribution</h3>
          <div class="space-y-3">
            <div v-for="day in dailyChartData" :key="day.name" class="flex items-center gap-3">
              <div class="w-20 text-sm text-gray-400">{{ day.name }}</div>
              <div class="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  class="bg-green-500 h-full rounded-full"
                  :style="{ width: day.percentage + '%' }"
                ></div>
              </div>
              <div class="w-16 text-right text-sm">{{ day.percentage }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 text-gray-400">
      <p>Enter a wallet address to view transaction timeline</p>
    </div>
  </div>
</template>
