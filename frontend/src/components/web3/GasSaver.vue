<script setup lang="ts">
import { ref, computed } from 'vue'

interface GasStrategy {
  name: string
  description: string
  savings: number
  risk: 'low' | 'medium' | 'high'
}

const strategies = ref<GasStrategy[]>([
  { name: 'Schedule Transactions', description: 'Execute during low-congestion periods', savings: 40, risk: 'low' },
  { name: 'Batch Multiple Tx', description: 'Combine multiple operations', savings: 25, risk: 'low' },
  { name: 'Use Layer 2', description: 'Bridge to Arbitrum/Optimism', savings: 60, risk: 'medium' },
  { name: 'Flashbots Bundle', description: 'Private transactions', savings: 15, risk: 'low' },
])

const monthlyGasSpend = ref(500)
const potentialSavings = computed(() => Math.round(monthlyGasSpend.value * 0.4))
const yearlySavings = computed(() => potentialSavings.value * 12)

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low': return 'text-green-400 bg-green-500/20'
    case 'medium': return 'text-yellow-400 bg-yellow-500/20'
    case 'high': return 'text-red-400 bg-red-500/20'
    default: return 'text-slate-400'
  }
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <h2 class="text-xl font-semibold">💰 Gas Saver</h2>
      <p class="text-sm text-slate-400 mt-1">Optimize your gas spending with smart strategies</p>
    </div>

    <div class="p-6">
      <div class="mb-6">
        <label class="block text-sm text-slate-400 mb-2">Monthly Gas Spend (USD)</label>
        <input 
          v-model="monthlyGasSpend"
          type="number"
          class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <p class="text-xs text-slate-400">Potential Monthly Savings</p>
          <p class="text-2xl font-bold text-green-400">${{ potentialSavings }}</p>
        </div>
        <div class="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <p class="text-xs text-slate-400">Yearly Savings</p>
          <p class="text-2xl font-bold text-purple-400">${{ yearlySavings }}</p>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-medium text-slate-400 mb-3">Optimization Strategies</h3>
        <div class="space-y-3">
          <div v-for="s in strategies" :key="s.name" 
            class="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="font-medium">{{ s.name }}</p>
                <p class="text-sm text-slate-400">{{ s.description }}</p>
              </div>
              <span :class="['px-2 py-1 rounded text-xs font-medium', getRiskColor(s.risk)]">
                {{ s.risk }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-3">
              <span class="text-green-400 font-semibold">-{{ s.savings }}% gas</span>
              <button class="ml-auto px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30">
                Enable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
