<script setup lang="ts">
import { ref, computed } from 'vue'

interface TokenHolder {
  address: string
  balance: number
  percent: number
}

interface Transfer {
  from: string
  to: string
  amount: number
  timestamp: string
}

const tokenAddress = ref('')
const loading = ref(false)
const holders = ref<TokenHolder[]>([])
const transfers = ref<Transfer[]>([])
const depth = ref(3)

const loadGraph = async () => {
  if (!tokenAddress.value) return
  loading.value = true
  
  await new Promise(r => setTimeout(r, 1500))
  
  holders.value = [
    { address: '0x1234...abcd', balance: 1500000, percent: 15 },
    { address: '0x5678...efgh', balance: 800000, percent: 8 },
    { address: '0xabcd...1234', balance: 500000, percent: 5 },
  ]
  
  transfers.value = [
    { from: '0xaaa', to: '0xbbb', amount: 50000, timestamp: '2h ago' },
    { from: '0xccc', to: '0xddd', amount: 25000, timestamp: '5h ago' },
  ]
  
  loading.value = false
}

const maxHolderPercent = computed(() => Math.max(...holders.value.map(h => h.percent), 1))
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <h2 class="text-xl font-semibold">🕸️ Token Grapher</h2>
      <p class="text-sm text-slate-400 mt-1">Visualize token holder relationships</p>
    </div>

    <div class="p-6">
      <div class="flex gap-2 mb-6">
        <input 
          v-model="tokenAddress"
          placeholder="Enter token address..."
          class="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
        />
        <input 
          v-model="depth"
          type="number"
          min="1"
          max="5"
          class="w-20 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
        />
        <button 
          @click="loadGraph"
          :disabled="!tokenAddress || loading"
          class="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl font-medium"
        >
          {{ loading ? 'Loading...' : 'Graph' }}
        </button>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else-if="holders.length > 0" class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-slate-400 mb-3">Top Holders</h3>
          <div class="space-y-2">
            <div v-for="h in holders" :key="h.address" class="flex items-center gap-3">
              <div class="flex-1">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-mono">{{ h.address }}</span>
                  <span>{{ h.percent }}%</span>
                </div>
                <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-purple-500 rounded-full"
                    :style="{ width: (h.percent / maxHolderPercent * 100) + '%' }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-medium text-slate-400 mb-3">Recent Transfers</h3>
          <div class="space-y-2">
            <div v-for="(t, i) in transfers" :key="i" class="p-3 bg-slate-900/50 rounded-lg text-sm">
              <div class="flex justify-between">
                <span class="font-mono text-slate-400">{{ t.from.slice(0, 8) }} → {{ t.to.slice(0, 8) }}</span>
                <span class="text-purple-400">{{ t.amount.toLocaleString() }}</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ t.timestamp }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-slate-500">
        <span class="text-4xl mb-4 block">🕸️</span>
        <p>Enter token address to visualize</p>
      </div>
    </div>
  </div>
</template>
