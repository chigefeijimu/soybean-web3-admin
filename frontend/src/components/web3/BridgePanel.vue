<script setup lang="ts">
import { ref, computed } from 'vue'

interface BridgeRoute {
  name: string
  logo: string
  fee: number
  time: string
  minAmount: number
}

const fromChain = ref('ethereum')
const toChain = ref('polygon')
const amount = ref('')
const selectedRoute = ref<string | null>(null)

const chains = [
  { id: 'ethereum', name: 'Ethereum', logo: '🔷', color: '#627EEA' },
  { id: 'polygon', name: 'Polygon', logo: '🟣', color: '#8247E5' },
  { id: 'arbitrum', name: 'Arbitrum', logo: '🔵', color: '#28A0F0' },
  { id: 'optimism', name: 'Optimism', logo: '🟠', color: '#FF0420' },
  { id: 'bsc', name: 'BNB Chain', logo: '🟡', color: '#F3BA2F' },
]

const routes = ref<BridgeRoute[]>([
  { name: 'Stargate', logo: '🌉', fee: 0.06, time: '5-15 min', minAmount: 10 },
  { name: 'LayerZero', logo: '🔗', fee: 0.05, time: '3-10 min', minAmount: 50 },
  { name: 'Across', logo: '➡️', fee: 0.04, time: '10-30 min', minAmount: 100 },
  { name: 'Hop', logo: '🐰', fee: 0.03, time: '5-20 min', minAmount: 10 },
])

const fromChainData = computed(() => chains.find(c => c.id === fromChain.value))
const toChainData = computed(() => chains.find(c => c.id === toChain.value))

const estimatedReceive = computed(() => {
  if (!amount.value) return '0'
  const amt = parseFloat(amount.value)
  if (isNaN(amt)) return '0'
  // Simulate 0.5% fee
  return (amt * 0.995).toFixed(4)
})

const isValidAmount = computed(() => {
  const amt = parseFloat(amount.value)
  return !isNaN(amt) && amt > 0
})

const swapChains = () => {
  const temp = fromChain.value
  fromChain.value = toChain.value
  toChain.value = temp
}

const handleBridge = () => {
  if (!isValidAmount.value || !selectedRoute.value) return
  alert(`Bridge initiated: ${amount.value} ETH from ${fromChain.value} to ${toChain.value}`)
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="p-6 border-b border-slate-700/50">
      <h2 class="text-xl font-semibold">🌉 Cross-Chain Bridge</h2>
      <p class="text-sm text-slate-400 mt-1">Transfer tokens across different blockchains</p>
    </div>

    <!-- From/To Chains -->
    <div class="p-6">
      <!-- From -->
      <div class="mb-4">
        <label class="block text-sm text-slate-400 mb-2">From</label>
        <div class="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <select 
            v-model="fromChain"
            class="flex-1 bg-transparent border-none focus:outline-none font-medium"
          >
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.logo }} {{ chain.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Swap Button -->
      <div class="flex justify-center -my-2 relative z-10">
        <button 
          @click="swapChains"
          class="w-10 h-10 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center transition-colors"
        >
          ⇅
        </button>
      </div>

      <!-- To -->
      <div class="mb-6">
        <label class="block text-sm text-slate-400 mb-2">To</label>
        <div class="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <select 
            v-model="toChain"
            class="flex-1 bg-transparent border-none focus:outline-none font-medium"
          >
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.logo }} {{ chain.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Amount -->
      <div class="mb-6">
        <label class="block text-sm text-slate-400 mb-2">Amount</label>
        <div class="relative">
          <input 
            v-model="amount"
            type="number"
            placeholder="0.00"
            class="w-full px-4 py-4 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-xl font-semibold"
          />
          <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">ETH</span>
        </div>
      </div>

      <!-- Estimated Receive -->
      <div v-if="amount" class="mb-6 p-4 bg-slate-900/50 rounded-xl">
        <div class="flex justify-between items-center">
          <span class="text-slate-400">You'll receive</span>
          <span class="text-xl font-semibold">{{ estimatedReceive }} ETH</span>
        </div>
      </div>

      <!-- Routes -->
      <div class="mb-6">
        <label class="block text-sm text-slate-400 mb-2">Select Route</label>
        <div class="space-y-2">
          <div 
            v-for="route in routes"
            :key="route.name"
            @click="selectedRoute = route.name"
            :class="[
              'p-4 rounded-xl border cursor-pointer transition-all',
              selectedRoute === route.name 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-slate-700 hover:border-slate-600'
            ]"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ route.logo }}</span>
                <div>
                  <p class="font-medium">{{ route.name }}</p>
                  <p class="text-xs text-slate-400">{{ route.time }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-medium">{{ route.fee }}%</p>
                <p class="text-xs text-slate-400">Min: {{ route.minAmount }} ETH</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bridge Button -->
      <button 
        @click="handleBridge"
        :disabled="!isValidAmount || !selectedRoute"
        :class="[
          'w-full py-4 rounded-xl font-semibold text-lg transition-all',
          isValidAmount && selectedRoute
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
        ]"
      >
        Bridge Now
      </button>

      <!-- Warning -->
      <p class="text-xs text-slate-500 mt-4 text-center">
        ⚠️ Cross-chain transfers may take 5-30 minutes depending on network conditions
      </p>
    </div>
  </div>
</template>
