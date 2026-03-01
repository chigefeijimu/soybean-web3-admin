<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface GasPrice {
  chain: string
  chainId: number
  slow: number
  normal: number
  fast: number
  unit: string
}

const gasPrices = ref<GasPrice[]>([
  { chain: 'Ethereum', chainId: 1, slow: 15, normal: 25, fast: 45, unit: 'Gwei' },
  { chain: 'Polygon', chainId: 137, slow: 50, normal: 80, fast: 150, unit: 'Gwei' },
  { chain: 'Arbitrum', chainId: 42161, slow: 0.1, normal: 0.15, fast: 0.25, unit: 'Gwei' },
  { chain: 'Optimism', chainId: 10, slow: 0.001, normal: 0.002, fast: 0.005, unit: 'Gwei' },
  { chain: 'BSC', chainId: 56, slow: 3, normal: 5, fast: 8, unit: 'Gwei' },
])

const selectedChain = ref<number>(1)
const loading = ref(false)

const currentGas = () => gasPrices.value.find(g => g.chainId === selectedChain.value) || gasPrices.value[0]

const formatGas = (value: number, unit: string) => {
  if (value < 1) return value.toFixed(3) + ' ' + unit
  return value.toFixed(0) + ' ' + unit
}

const getGasColor = (speed: 'slow' | 'normal' | 'fast') => {
  const gas = currentGas()
  const value = gas[speed]
  if (value < gas.slow * 1.2) return 'text-green-400'
  if (value < gas.normal * 1.2) return 'text-yellow-400'
  return 'text-red-400'
}

const getEstimatedFee = (gas: number) => {
  // ETH transfer: 21000 gas
  // Token transfer: 65000 gas
  const ethPrice = 2500 // Mock
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

let interval: number
onMounted(() => {
  // Simulate real-time updates
  interval = window.setInterval(() => {
    gasPrices.value = gasPrices.value.map(g => ({
      ...g,
      slow: g.slow * (0.9 + Math.random() * 0.2),
      normal: g.normal * (0.9 + Math.random() * 0.2),
      fast: g.fast * (0.9 + Math.random() * 0.2),
    }))
  }, 10000)
})

onUnmounted(() => {
  clearInterval(interval)
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

    <!-- Gas Prices -->
    <div class="p-4 space-y-3">
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
            {{ formatGas(currentGas().slow, currentGas().unit) }}
          </p>
          <p class="text-xs text-slate-500">{{ getEstimatedFee(currentGas().slow) }}</p>
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
            {{ formatGas(currentGas().normal, currentGas().unit) }}
          </p>
          <p class="text-xs text-slate-500">{{ getEstimatedFee(currentGas().normal) }}</p>
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
            {{ formatGas(currentGas().fast, currentGas().unit) }}
          </p>
          <p class="text-xs text-slate-500">{{ getEstimatedFee(currentGas().fast) }}</p>
        </div>
      </div>
    </div>

    <!-- Gas Stats -->
    <div class="p-4 border-t border-slate-700/50">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-slate-500">Network Congestion</p>
          <p class="font-medium">Medium</p>
        </div>
        <div>
          <p class="text-slate-500">Last Updated</p>
          <p class="font-medium">Just now</p>
        </div>
      </div>
    </div>
  </div>
</template>
