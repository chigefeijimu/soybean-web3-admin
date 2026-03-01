<script setup lang="ts">
import { ref } from 'vue'

interface FeeRecord {
  id: string
  hash: string
  type: string
  gasUsed: number
  gasPrice: number
  fee: number
  timestamp: string
}

const fees = ref<FeeRecord[]>([
  { id: '1', hash: '0xabc123...', type: 'Swap', gasUsed: 150000, gasPrice: 30, fee: 0.0045, timestamp: '2h ago' },
  { id: '2', hash: '0xdef456...', type: 'Transfer', gasUsed: 21000, gasPrice: 25, fee: 0.000525, timestamp: '5h ago' },
  { id: '3', hash: '0xghi789...', type: 'NFT Transfer', gasUsed: 65000, gasPrice: 28, fee: 0.00182, timestamp: '1d ago' },
])

const totalFees = () => fees.value.reduce((sum, f) => sum + f.fee, 0)
const avgGas = () => Math.round(fees.value.reduce((sum, f) => sum + f.gasPrice, 0) / fees.value.length)
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold">💸 Transaction Fee Tracker</h2>
          <p class="text-sm text-slate-400 mt-1">Monitor your gas spending</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">Total Spent</p>
          <p class="text-2xl font-bold text-red-400">{{ totalFees().toFixed(4) }} ETH</p>
        </div>
      </div>
    </div>

    <div class="p-6">
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="p-4 bg-slate-900/50 rounded-xl">
          <p class="text-xs text-slate-400">Transactions</p>
          <p class="text-2xl font-bold">{{ fees.length }}</p>
        </div>
        <div class="p-4 bg-slate-900/50 rounded-xl">
          <p class="text-xs text-slate-400">Avg Gas Price</p>
          <p class="text-2xl font-bold">{{ avgGas() }} Gwei</p>
        </div>
      </div>

      <div class="space-y-3">
        <div v-for="fee in fees" :key="fee.id" 
          class="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
          <div class="flex justify-between items-start">
            <div>
              <span class="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                {{ fee.type }}
              </span>
              <p class="text-sm text-slate-400 mt-2 font-mono">{{ fee.hash }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold">{{ fee.fee }} ETH</p>
              <p class="text-xs text-slate-400">{{ fee.gasUsed.toLocaleString() }} gas</p>
            </div>
          </div>
          <p class="text-xs text-slate-500 mt-2">{{ fee.timestamp }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
