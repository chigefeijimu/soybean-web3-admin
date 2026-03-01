<script setup lang="ts">
import { ref } from 'vue'

interface MevProtection {
  type: string
  name: string
  description: string
  savings: string
}

const walletAddress = ref('')
const analyzing = ref(false)
const result = ref<{
  risk: 'low' | 'medium' | 'high'
  score: number
  suggestions: MevProtection[]
} | null>(null)

const analyze = async () => {
  if (!walletAddress.value) return
  analyzing.value = true
  
  await new Promise(r => setTimeout(r, 1500))
  
  result.value = {
    risk: 'medium',
    score: 65,
    suggestions: [
      { type: 'flashbots', name: 'Flashbots Protect', description: 'Private transactions', savings: '~$15/tx' },
      { type: 'mevguard', name: 'MEV Guard', description: 'Sandwich attack protection', savings: '~$8/tx' },
      { type: 'batch', name: 'Batch Transactions', description: 'Atomic swaps', savings: '~$5/tx' },
    ]
  }
  
  analyzing.value = false
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <h2 class="text-xl font-semibold">🛡️ MEV Protection</h2>
      <p class="text-sm text-slate-400 mt-1">Protect your transactions from MEV extraction</p>
    </div>

    <div class="p-6">
      <div class="flex gap-2 mb-6">
        <input 
          v-model="walletAddress"
          placeholder="Enter wallet address..."
          class="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
        />
        <button 
          @click="analyze"
          :disabled="!walletAddress || analyzing"
          class="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl font-medium"
        >
          {{ analyzing ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>

      <div v-if="result" class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
          <div>
            <p class="text-sm text-slate-400">MEV Risk Level</p>
            <p :class="['text-2xl font-bold mt-1',
              result.risk === 'low' ? 'text-green-400' :
              result.risk === 'medium' ? 'text-yellow-400' : 'text-red-400']">
              {{ result.risk.toUpperCase() }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-slate-400">Protection Score</p>
            <p class="text-2xl font-bold text-purple-400">{{ result.score }}/100</p>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-medium text-slate-400 mb-3">Protection Tools</h3>
          <div class="space-y-2">
            <div v-for="s in result.suggestions" :key="s.type" 
              class="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium">{{ s.name }}</p>
                  <p class="text-sm text-slate-400">{{ s.description }}</p>
                </div>
                <span class="text-green-400 text-sm">{{ s.savings }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-slate-500">
        <span class="text-4xl mb-4 block">🛡️</span>
        <p>Enter address to analyze MEV exposure</p>
      </div>
    </div>
  </div>
</template>
