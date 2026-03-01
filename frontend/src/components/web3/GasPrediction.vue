<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Prediction {
  timestamp: number
  gas: number
}

const chain = ref('ethereum')
const loading = ref(true)
const predictions = ref<Prediction[]>([])
const currentGas = ref(25)

const chains = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH' },
  { id: 'optimism', name: 'Optimism', symbol: 'ETH' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
]

const formatTime = (ts: number) => {
  const date = new Date(ts)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const recommendation = computed(() => {
  if (currentGas.value < 20) return { text: 'Good time to transact', color: 'green' }
  if (currentGas.value < 40) return { text: 'Normal conditions', color: 'yellow' }
  return { text: 'High congestion - wait if possible', color: 'red' }
})

onMounted(async () => {
  // Generate mock predictions
  const now = Date.now()
  const data: Prediction[] = []
  let base = 25 + Math.random() * 10
  
  for (let i = 0; i < 24; i++) {
    base = base + (Math.random() - 0.5) * 15
    base = Math.max(10, Math.min(60, base))
    data.push({
      timestamp: now + i * 3600000,
      gas: Math.round(base)
    })
  }
  
  predictions.value = data
  loading.value = false
})

const avgPrediction = computed(() => {
  if (!predictions.value.length) return 0
  return Math.round(predictions.value.reduce((sum, p) => sum + p.gas, 0) / predictions.value.length)
})
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <div class="p-6 border-b border-slate-700/50">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">⏳ Gas Prediction</h2>
          <p class="text-sm text-slate-400 mt-1">AI-powered gas price forecasting</p>
        </div>
        <select v-model="chain" class="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm">
          <option v-for="c in chains" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <div class="p-6">
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>

      <div v-else>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">Current Gas</p>
            <p class="text-2xl font-bold mt-1">{{ currentGas }} <span class="text-sm font-normal text-slate-400">Gwei</span></p>
          </div>
          <div class="p-4 bg-slate-900/50 rounded-xl">
            <p class="text-xs text-slate-400">24h Average</p>
            <p class="text-2xl font-bold mt-1">{{ avgPrediction }} <span class="text-sm font-normal text-slate-400">Gwei</span></p>
          </div>
        </div>

        <div class="mb-4">
          <div :class="['p-3 rounded-lg text-sm font-medium', 
            recommendation.color === 'green' ? 'bg-green-500/20 text-green-400' :
            recommendation.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400']">
            💡 {{ recommendation.text }}
          </div>
        </div>

        <div>
          <h3 class="text-sm font-medium text-slate-400 mb-3">24h Prediction</h3>
          <div class="h-32 flex items-end gap-1">
            <div v-for="(p, i) in predictions.slice(0, 24)" :key="i" 
              class="flex-1 bg-gradient-to-t from-purple-500/50 to-purple-500/20 rounded-t transition-all hover:from-purple-400/50"
              :style="{ height: (p.gas / 60 * 100) + '%' }"
              :title="formatTime(p.timestamp) + ': ' + p.gas + ' Gwei'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
