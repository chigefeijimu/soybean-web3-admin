<script setup lang="ts">
import { ref } from 'vue'

interface GasRebate {
  id: string
  date: string
  amount: number
  type: string
  txHash: string
}

const rebates = ref<GasRebate[]>([
  { id: '1', date: '2026-03-01', amount: 0.05, type: 'L2 Rebate', txHash: '0xabc...123' },
  { id: '2', date: '2026-02-28', amount: 0.03, type: 'Flashbots', txHash: '0xdef...456' },
])

const total = () => rebates.value.reduce((sum, r) => sum + r.amount, 0)
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
    <h2 class="text-xl font-semibold mb-4">💰 Gas Rebates</h2>
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="p-4 bg-slate-900/50 rounded-xl">
        <p class="text-xs text-slate-400">Total Rebates</p>
        <p class="text-2xl font-bold text-green-400">{{ total().toFixed(4) }} ETH</p>
      </div>
      <div class="p-4 bg-slate-900/50 rounded-xl">
        <p class="text-xs text-slate-400">Transactions</p>
        <p class="text-2xl font-bold">{{ rebates.length }}</p>
      </div>
    </div>
    <div class="space-y-3">
      <div v-for="r in rebates" :key="r.id" class="p-3 bg-slate-900/50 rounded-lg flex justify-between">
        <div>
          <p class="font-medium">{{ r.type }}</p>
          <p class="text-xs text-slate-500">{{ r.date }} • {{ r.txHash }}</p>
        </div>
        <span class="text-green-400">+{{ r.amount }} ETH</span>
      </div>
    </div>
  </div>
</template>
