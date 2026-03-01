<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getNetworksHeatmap, getHeatmapHistory, type NetworkHeatmapData, type HeatmapHistory } from '@/service/api/web3'

const networks = ref<NetworkHeatmapData[]>([])
const history = ref<HeatmapHistory[]>([])
const loading = ref(false)
const error = ref('')
const selectedPeriod = ref<'24h' | '7d' | '30d'>('24h')
const selectedNetwork = ref<number | null>(null)
const lastUpdated = ref<Date | null>(null)

// Format numbers
const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'
  return num.toFixed(0)
}

const formatPrice = (num: number): string => {
  if (num >= 1000) return '$' + num.toLocaleString()
  if (num >= 1) return '$' + num.toFixed(2)
  return '$' + num.toFixed(4)
}

// Get heat color based on activity
const getActivityColor = (activity: number): string => {
  if (activity >= 80) return 'bg-red-500'
  if (activity >= 60) return 'bg-orange-500'
  if (activity >= 40) return 'bg-yellow-500'
  if (activity >= 20) return 'bg-green-400'
  return 'bg-green-600'
}

// Get congestion color
const getCongestionColor = (congestion: string): string => {
  switch (congestion) {
    case 'critical': return 'text-red-500'
    case 'high': return 'text-orange-500'
    case 'medium': return 'text-yellow-500'
    default: return 'text-green-500'
  }
}

// Get congestion icon
const getCongestionIcon = (congestion: string): string => {
  switch (congestion) {
    case 'critical': return '🔴'
    case 'high': return '🟠'
    case 'medium': return '🟡'
    default: return '🟢'
  }
}

// Activity bar width
const getActivityWidth = (activity: number): string => {
  return activity + '%'
}

// Sorted networks by activity
const sortedNetworks = computed(() => {
  return [...networks.value].sort((a, b) => b.activity - a.activity)
})

// Selected network details
const selectedNetworkData = computed(() => {
  if (!selectedNetwork.value) return null
  return networks.value.find(n => n.chainId === selectedNetwork.value)
})

// Total stats
const totalStats = computed(() => {
  const totalTx = networks.value.reduce((sum, n) => sum + n.txCount, 0)
  const totalAddr = networks.value.reduce((sum, n) => sum + n.activeAddresses, 0)
  const totalTvl = networks.value.reduce((sum, n) => sum + n.tvl, 0)
  return { totalTx, totalAddr, totalTvl }
})

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [heatmapData, historyData] = await Promise.all([
      getNetworksHeatmap(),
      getHeatmapHistory(selectedNetwork.value || undefined, selectedPeriod.value)
    ])
    networks.value = heatmapData
    history.value = historyData
    lastUpdated.value = new Date()
  } catch (e: any) {
    console.error('Failed to fetch heatmap data:', e)
    error.value = 'Failed to load blockchain data'
  } finally {
    loading.value = false
  }
}

const selectNetwork = (chainId: number) => {
  selectedNetwork.value = selectedNetwork.value === chainId ? null : chainId
}

const changePeriod = (period: '24h' | '7d' | '30d') => {
  selectedPeriod.value = period
  loadData()
}

onMounted(() => {
  loadData()
  // Auto-refresh every 30 seconds
  setInterval(loadData, 30000)
})
</script>

<template>
  <div class="rounded-xl bg-slate-800/50 p-4 backdrop-blur-sm border border-slate-700">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-white">🔥 Blockchain Heatmap</h3>
        <p class="text-xs text-slate-400">Real-time network activity across chains</p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="period in ['24h', '7d', '30d']"
          :key="period"
          @click="changePeriod(period as '24h' | '7d' | '30d')"
          :class="[
            'rounded px-2 py-1 text-xs font-medium transition',
            selectedPeriod === period 
              ? 'bg-purple-600 text-white' 
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          ]"
        >
          {{ period }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && networks.length === 0" class="flex h-32 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded bg-red-500/10 p-3 text-center text-red-400">
      {{ error }}
    </div>

    <!-- Stats Overview -->
    <div v-else class="mb-4 grid grid-cols-3 gap-2">
      <div class="rounded bg-slate-700/50 p-2 text-center">
        <div class="text-lg font-bold text-white">{{ formatNumber(totalStats.totalTx) }}</div>
        <div class="text-xs text-slate-400">Total Tx</div>
      </div>
      <div class="rounded bg-slate-700/50 p-2 text-center">
        <div class="text-lg font-bold text-white">{{ formatNumber(totalStats.totalAddr) }}</div>
        <div class="text-xs text-slate-400">Active Addr</div>
      </div>
      <div class="rounded bg-slate-700/50 p-2 text-center">
        <div class="text-lg font-bold text-white">${{ formatNumber(totalStats.totalTvl) }}</div>
        <div class="text-xs text-slate-400">Total TVL</div>
      </div>
    </div>

    <!-- Network Grid -->
    <div v-if="!loading && networks.length > 0" class="space-y-2">
      <div
        v-for="network in sortedNetworks"
        :key="network.chainId"
        @click="selectNetwork(network.chainId)"
        :class="[
          'cursor-pointer rounded-lg border p-3 transition',
          selectedNetwork === network.chainId 
            ? 'border-purple-500 bg-slate-700/50' 
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
        ]"
      >
        <!-- Network Header -->
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div 
              class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
              :style="{ backgroundColor: network.color + '20', color: network.color }"
            >
              {{ network.symbol.charAt(0) }}
            </div>
            <div>
              <div class="font-medium text-white">{{ network.name }}</div>
              <div class="text-xs text-slate-400">{{ network.symbol }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ getCongestionIcon(network.congestion) }}</span>
            <span :class="['text-xs font-medium', getCongestionColor(network.congestion)]">
              {{ network.congestion.toUpperCase() }}
            </span>
          </div>
        </div>

        <!-- Activity Bar -->
        <div class="mb-2">
          <div class="mb-1 flex justify-between text-xs">
            <span class="text-slate-400">Activity</span>
            <span class="text-white">{{ network.activity }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-700">
            <div 
              :class="['h-full transition-all duration-500', getActivityColor(network.activity)]"
              :style="{ width: getActivityWidth(network.activity) }"
            ></div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-4 gap-2 text-xs">
          <div>
            <div class="text-slate-400">Tx</div>
            <div class="font-medium text-white">{{ formatNumber(network.txCount) }}</div>
          </div>
          <div>
            <div class="text-slate-400">Addr</div>
            <div class="font-medium text-white">{{ formatNumber(network.activeAddresses) }}</div>
          </div>
          <div>
            <div class="text-slate-400">Gas</div>
            <div class="font-medium text-white">{{ network.gasPriceGwei }} Gwei</div>
          </div>
          <div>
            <div class="text-slate-400">TVL</div>
            <div class="font-medium text-white">${{ formatNumber(network.tvl) }}</div>
          </div>
        </div>

        <!-- Expanded Details -->
        <div v-if="selectedNetwork === network.chainId" class="mt-3 border-t border-slate-600 pt-3">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="flex justify-between">
              <span class="text-slate-400">Price</span>
              <span class="text-white">{{ formatPrice(network.price) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">24h Change</span>
              <span :class="network.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ network.priceChange24h >= 0 ? '+' : '' }}{{ network.priceChange24h }}%
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">TVL Change</span>
              <span :class="network.tvlChange24h >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ network.tvlChange24h >= 0 ? '+' : '' }}{{ network.tvlChange24h }}%
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">24h Volume</span>
              <span class="text-white">${{ formatNumber(network.volume24h) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Last Updated -->
    <div v-if="lastUpdated" class="mt-3 text-center text-xs text-slate-500">
      Last updated: {{ lastUpdated.toLocaleTimeString() }}
    </div>
  </div>
</template>
