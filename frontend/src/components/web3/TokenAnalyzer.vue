<script setup lang="ts">
import { ref } from 'vue'

interface TokenAnalysis {
  address: string
  name: string
  symbol: string
  holders: number
  transfers24h: number
  liquidity: number
  marketCap: number
  topHolders: { address: string; percent: number }[]
  risk: 'low' | 'medium' | 'high'
  riskFactors: string[]
}

const tokenAddress = ref('')
const analyzing = ref(false)
const result = ref<TokenAnalysis | null>(null)

const analyze = async () => {
  if (!tokenAddress.value) return
  
  analyzing.value = true
  
  // Simulate analysis
  await new Promise(r => setTimeout(r, 2000))
  
  result.value = {
    address: tokenAddress.value,
    name: 'Example Token',
    symbol: 'EXAMPLE',
    holders: 12450,
    transfers24h: 8920,
    liquidity: 1250000,
    marketCap: 8500000,
    topHolders: [
      { address: '0x1234...abcd', percent: 35.2 },
      { address: '0x5678...efgh', percent: 15.8 },
      { address: '0xabcd...1234', percent: 8.5 },
    ],
    risk: 'medium',
    riskFactors: [
      'Top 10 holders control 65% of supply',
      'No external audit found',
      'Trading volume suspicious'
    ]
  }
  
  analyzing.value = false
}

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
      <h2 class="text-xl font-semibold">🔍 Token Analyzer</h2>
      <p class="text-sm text-slate-400 mt-1">Analyze any token contract for risk and stats</p>
    </div>

    <div class="p-6">
      <!-- Search -->
      <div class="flex gap-2 mb-6">
        <input 
          v-model="tokenAddress"
          placeholder="Enter token contract address..."
          class="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
        />
        <button 
          @click="analyze"
          :disabled="!tokenAddress || analyzing"
          class="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl font-medium"
        >
          {{ analyzing ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>

      <!-- Results -->
      <div v-if="result" class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">{{ result.name }} ({{ result.symbol }})</h3>
            <p class="text-xs text-slate-400 font-mono">{{ result.address.slice(0, 10) }}...</p>
          </div>
          <span :class="['px-3 py-1 rounded-full text-sm font-medium', getRiskColor(result.risk)]">
            {{ result.risk.toUpperCase() }} RISK
          </span>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-4 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">Holders</p>
            <p class="text-xl font-semibold">{{ result.holders.toLocaleString() }}</p>
          </div>
          <div class="p-4 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">Transfers (24h)</p>
            <p class="text-xl font-semibold">{{ result.transfers24h.toLocaleString() }}</p>
          </div>
          <div class="p-4 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">Liquidity</p>
            <p class="text-xl font-semibold">${{ (result.liquidity / 1000).toFixed(0) }}K</p>
          </div>
          <div class="p-4 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">Market Cap</p>
            <p class="text-xl font-semibold">${{ (result.marketCap / 1000000).toFixed(1) }}M</p>
          </div>
        </div>

        <!-- Risk Factors -->
        <div v-if="result.riskFactors.length > 0">
          <h4 class="text-sm font-medium text-slate-400 mb-2">Risk Factors</h4>
          <div class="space-y-2">
            <div 
              v-for="(factor, i) in result.riskFactors" 
              :key="i"
              class="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <span class="text-red-400">⚠️</span>
              <span class="text-sm">{{ factor }}</span>
            </div>
          </div>
        </div>

        <!-- Top Holders -->
        <div>
          <h4 class="text-sm font-medium text-slate-400 mb-2">Top Holders</h4>
          <div class="space-y-2">
            <div 
              v-for="holder in result.topHolders"
              :key="holder.address"
              class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
            >
              <span class="font-mono text-sm">{{ holder.address }}</span>
              <span class="font-medium">{{ holder.percent }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 text-slate-500">
        <span class="text-4xl mb-4 block">🔍</span>
        <p>Enter a token address to analyze</p>
      </div>
    </div>
  </div>
</template>
