<script setup lang="ts">
import { ref } from 'vue'

interface Position {
  protocol: string
  type: string
  token0: string
  token1: string
  value: number
  apy: number
}

const positions = ref<Position[]>([
  { protocol: 'Aave', type: 'Lending', token0: 'USDC', token1: '', value: 15000, apy: 4.2 },
  { protocol: 'Uniswap', type: 'LP', token0: 'ETH', token1: 'USDC', value: 8500, apy: 12.5 },
  { protocol: 'Compound', type: 'Lending', token0: 'ETH', token1: '', value: 5200, apy: 3.8 },
])

const totalValue = () => positions.value.reduce((sum, p) => sum + p.value, 0)
const avgApy = () => positions.value.reduce((sum, p) => sum + p.apy, 0) / positions.value.length
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <h2 class="text-xl font-semibold">📋 DeFi Positions</h2>
      <p class="text-sm text-slate-400 mt-1">Track your active DeFi positions</p>
    </div>

    <div class="p-6">
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="p-4 bg-slate-900/50 rounded-xl">
          <p class="text-xs text-slate-400">Total Value</p>
          <p class="text-2xl font-bold text-purple-400">${{ totalValue().toLocaleString() }}</p>
        </div>
        <div class="p-4 bg-slate-900/50 rounded-xl">
          <p class="text-xs text-slate-400">Avg APY</p>
          <p class="text-2xl font-bold text-green-400">{{ avgApy().toFixed(1) }}%</p>
        </div>
      </div>

      <div class="space-y-3">
        <div v-for="(p, i) in positions" :key="i" 
          class="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium">{{ p.protocol }} - {{ p.type }}</p>
              <p class="text-sm text-slate-400">{{ p.token0 }}<span v-if="p.token1">/{{ p.token1 }}</span></p>
            </div>
            <div class="text-right">
              <p class="font-semibold">${{ p.value.toLocaleString() }}</p>
              <p class="text-sm text-green-400">{{ p.apy }}% APY</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
