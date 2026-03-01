<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { fetchGasPrices, type GasPrice } from '@/service/api/web3'

interface GasPriceData {
  chain: string
  chainId: number
  slow: number
  normal: number
  fast: number
  unit: string
}

const gasPrices = ref<GasPriceData[]>([
  { chain: 'Ethereum', chainId: 1, slow: 15, normal: 25, fast: 45, unit: 'Gwei' },
  { chain: 'Polygon', chainId: 137, slow: 50, normal: 80, fast: 150, unit: 'Gwei' },
  { chain: 'Arbitrum', chainId: 42161, slow: 0.1, normal: 0.15, fast: 0.25, unit: 'Gwei' },
  { chain: 'Optimism', chainId: 10, slow: 0.001, normal: 0.002, fast: 0.005, unit: 'Gwei' },
  { chain: 'BSC', chainId: 56, slow: 3, normal: 5, fast: 8, unit: 'Gwei' },
])

const selectedChain = ref<number>(1)
const loading = ref(false)
const error = ref('')
const lastUpdated = ref<Date | null>(null)

const currentGas = computed(() => gasPrices.value.find(g => g.chainId === selectedChain.value) || gasPrices.value[0])

const formatGas = (value: number, unit: string) => {
  if (value < 1) return value.toFixed(3) + ' ' + unit
  return value.toFixed(0) + ' ' + unit
}

const getGasColor = (speed: 'slow' | 'normal' | 'fast') => {
  const gas = currentGas.value
  const value = gas[speed]
  if (value < gas.slow * 1.2) return 'text-green-400'
  if (value < gas.normal * 1.2) return 'text-yellow-400'
  return 'text-red-400'
}

const getEstimatedFee = (gas: number, unit: string) => {
  // ETH transfer: 21000 gas
  const ethPrice = 3000
  const fee = (gas * 21000 / 1e9) * ethPrice
  return '$' + fee.toFixed(2)
}

const estimateTime = (speed: 'slow' | 'normal' | 'fast') => {
  switch (speed) {
    case 'slow': return '>5 min'
    case 'normal': return '1-3 min'
    case 'fast': return '<30 sec'
  }
}

const loadGasPrices = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchGasPrices()
    if (data && data.length > 0) {
      gasPrices.value = data.map((g: GasPrice) => ({
        chain: g.chain,
        chainId: g.chainId,
        slow: g.slow,
        normal: g.normal,
        fast: g.fast,
        unit: g.unit
      }))
      lastUpdated.value = new Date()
    }
  } catch (e: any) {
    console.error('Failed to fetch gas prices:', e)
    error.value = 'Failed to load gas data'
  } finally {
    loading.value = false
  }
}

let interval: number
let refreshInterval: number

onMounted(() => {
  // Load initial data
  loadGasPrices()
  
  // Refresh every 30 seconds
  refreshInterval = window.setInterval(() => {
    loadGasPrices()
  }, 30000)
  
  // Fallback: simulate updates when API fails
  interval = window.setInterval(() => {
    if (error.value) {
      gasPrices.value = gasPrices.value.map(g => ({
        ...g,
        slow: g.slow * (0.9 + Math.random() * 0.2),
        normal: g.normal * (0.9 + Math.random() * 0.2),
        fast: g.fast * (0.9 + Math.random() * 0.2),
      }))
    }
  }, 10000)
})

onUnmounted(() => {
  clearInterval(interval)
  clearInterval(refreshInterval)
})

const formatLastUpdated = computed(() => {
  if (!lastUpdated.value) return 'Never'
  const now = new Date()
  const diff = Math.floor((now.getTime() - lastUpdated.value.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return lastUpdated.value.toLocaleTimeString()
})
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-slate-700/50">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">⛽ Gas Tracker</h2>
        <select 
          v-model="selectedChain"
          class="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1 text-sm focus:outline-none"
        >
          <option v-for="gas in gasPrices" :key="gas.chainId" :value="gas.chainId">
            {{ gas.chain }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading/Error State -->
    <div v-if="loading" class="p-4 text-center">
      <div class="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
      <p class="text-sm text-slate-400 mt-2">Loading gas prices...</p>
    </div>
    
    <div v-else-if="error" class="p-4 text-center">
      <p class="text-red-400 text-sm">{{ error }}</p>
      <button 
        class="mt-2 text-sm text-purple-400 hover:text-purple-300"
        @click="loadGasPrices"
      >
        Retry
      </button>
    </div>

    <!-- Gas Prices -->
    <div v-else class="p-4 space-y-3">
      <!-- Slow -->
      <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <span class="text-green-400">🐢</span>
          </div>
          <div>
            <p class="font-medium">Slow</p>
            <p class="text-xs text-slate-500">{{ estimateTime('slow') }}</p>
          </div>
        </div>
        <div class="text-right">
          <p :class="['font-semibold', getGasColor('slow')]">
            {{ formatGas(currentGas.slow, currentGas.unit) }}
          </p>
          <p class="text-xs text-slate-500">{{ getEstimatedFee(currentGas.slow, currentGas.unit) }}</p>
        </div>
      </div>

      <!-- Normal -->
      <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-yellow-500/30">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span class="text-yellow-400">🚗</span>
          </div>
          <div>
            <p class="font-medium">Normal</p>
            <p class="text-xs text-slate-500">{{ estimateTime('normal') }}</p>
          </div>
        </div>
        <div class="text-right">
          <p :class="['font-semibold', getGasColor('normal')]">
            {{ formatGas(currentGas.normal, currentGas.unit) }}
          </p>
          <p class="text-xs text-slate-500">{{ getEstimatedFee(currentGas.normal, currentGas.unit) }}</p>
        </div>
      </div>

      <!-- Fast -->
      <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <span class="text-red-400">🚀</span>
          </div>
          <div>
            <p class="font-medium">Fast</p>
            <p class="text-xs text-slate-500">{{ estimateTime('fast') }}</p>
          </div>
        </div>
        <div class="text-right">
          <p :class="['font-semibold', getGasColor('fast')]">
            {{ formatGas(currentGas.fast, currentGas.unit) }}
          </p>
          <p class="text-xs text-slate-500">{{ getEstimatedFee(currentGas.fast, currentGas.unit) }}</p>
        </div>
      </div>
    </div>

    <!-- Gas Stats -->
    <div class="p-4 border-t border-slate-700/50">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-slate-500">Network Congestion</p>
          <p class="font-medium" :class="currentGas.normal > 30 ? 'text-red-400' : currentGas.normal > 15 ? 'text-yellow-400' : 'text-green-400'">
            {{ currentGas.normal > 30 ? 'High' : currentGas.normal > 15 ? 'Medium' : 'Low' }}
          </p>
        </div>
        <div>
          <p class="text-slate-500">Last Updated</p>
          <p class="font-medium">{{ formatLastUpdated }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
