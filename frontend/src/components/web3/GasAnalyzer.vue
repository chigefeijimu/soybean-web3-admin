<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface GasPrice {
  chainId: number
  chainName: string
  slow: string
  standard: string
  fast: string
  baseFee: string
  timestamp: number
}

interface GasHistoryPoint {
  timestamp: number
  avgGas: number
  avgBaseFee: number
  transactionCount: number
}

interface HourlyAverage {
  hour: number
  avgGas: number
}

interface WeeklyAverage {
  day: number
  avgGas: number
}

interface NetworkStatus {
  congestion: 'low' | 'medium' | 'high' | 'critical'
  trend: 'rising' | 'falling' | 'stable'
  change24h: number
}

interface Prediction {
  recommended: 'slow' | 'standard' | 'fast'
  estimatedTime: string
  confidence: number
  savings: {
    slowVsFast: number
    slowVsStandard: number
  }
}

interface ChainGasInfo {
  chainId: number
  chainName: string
  chainSymbol: string
  currentGas: string
  avgGas24h: string
  gasUnit: string
  explorerUrl: string
}

const selectedChain = ref(1)
const loading = ref(false)
const currentGas = ref<GasPrice | null>(null)
const gasHistory = ref<GasHistoryPoint[]>([])
const hourlyAverage = ref<HourlyAverage[]>([])
const weeklyAverage = ref<WeeklyAverage[]>([])
const networkStatus = ref<NetworkStatus | null>(null)
const prediction = ref<Prediction | null>(null)
const multiChainGas = ref<ChainGasInfo[]>([])
const activeTab = ref<'dashboard' | 'history' | 'multi-chain' | 'calculator'>('dashboard')
const gasLimit = ref(21000)
const calculateSpeed = ref<'slow' | 'standard' | 'fast'>('standard')
const calculatedFee = ref<{ fee: string; feeUsd: string; gasPrice: string } | null>(null)

const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
  { id: 8453, name: 'Base', symbol: 'ETH' },
]

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const congestionColor = computed(() => {
  if (!networkStatus.value) return 'text-gray-400'
  switch (networkStatus.value.congestion) {
    case 'low': return 'text-green-400'
    case 'medium': return 'text-yellow-400'
    case 'high': return 'text-orange-400'
    case 'critical': return 'text-red-400'
  }
})

const trendIcon = computed(() => {
  if (!networkStatus.value) return '➡️'
  switch (networkStatus.value.trend) {
    case 'rising': return '📈'
    case 'falling': return '📉'
    case 'stable': return '➡️'
  }
})

const fetchGasData = async () => {
  loading.value = true
  try {
    // Fetch prediction data which includes all needed info
    const response = await fetch(`/api/gas-analyzer/prediction?chainId=${selectedChain.value}`)
    const data = await response.json()
    
    currentGas.value = data.current
    gasHistory.value = data.historical
    hourlyAverage.value = data.hourlyAverage
    weeklyAverage.value = data.weeklyAverage
    networkStatus.value = data.networkStatus
    prediction.value = data.prediction
  } catch (error) {
    console.error('Failed to fetch gas data:', error)
  }
  loading.value = false
}

const fetchMultiChainGas = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/gas-analyzer/multi-chain')
    multiChainGas.value = await response.json()
  } catch (error) {
    console.error('Failed to fetch multi-chain gas:', error)
  }
  loading.value = false
}

const calculateFee = async () => {
  try {
    const response = await fetch(
      `/api/gas-analyzer/fee-calculate?chainId=${selectedChain.value}&gasLimit=${gasLimit.value}&speed=${calculateSpeed.value}`
    )
    calculatedFee.value = await response.json()
  } catch (error) {
    console.error('Failed to calculate fee:', error)
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

const formatHour = (hour: number) => {
  return `${hour.toString().padStart(2, '0')}:00`
}

const formatGas = (gas: string) => {
  return parseFloat(gas).toFixed(0)
}

onMounted(() => {
  fetchGasData()
})

const changeTab = (tab: 'dashboard' | 'history' | 'multi-chain' | 'calculator') => {
  activeTab.value = tab
  if (tab === 'multi-chain') {
    fetchMultiChainGas()
  } else if (tab === 'dashboard') {
    fetchGasData()
  }
}
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="p-6 border-b border-slate-700/50">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">⛽ Gas Analyzer</h2>
          <p class="text-sm text-slate-400 mt-1">Real-time gas prices & predictions</p>
        </div>
        <select 
          v-model="selectedChain" 
          @change="fetchGasData"
          class="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.name }}
          </option>
        </select>
      </div>
      
      <!-- Tabs -->
      <div class="flex gap-2 mt-4">
        <button 
          v-for="tab in ['dashboard', 'history', 'multi-chain', 'calculator']" 
          :key="tab"
          @click="changeTab(tab as any)"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === tab 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'text-slate-400 hover:bg-slate-700/50'
          ]"
        >
          {{ tab === 'dashboard' ? '📊 Dashboard' : tab === 'history' ? '📈 History' : tab === 'multi-chain' ? '🌐 Multi-Chain' : '🧮 Calculator' }}
        </button>
      </div>
    </div>

    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>

      <!-- Dashboard Tab -->
      <div v-else-if="activeTab === 'dashboard' && currentGas">
        <!-- Current Gas Prices -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="p-4 bg-slate-900/50 rounded-xl border border-green-500/20">
            <p class="text-sm text-slate-400 mb-1">🐢 Slow</p>
            <p class="text-2xl font-bold text-green-400">{{ formatGas(currentGas.slow) }} <span class="text-sm font-normal">Gwei</span></p>
            <p class="text-xs text-slate-500 mt-1">~15 min</p>
          </div>
          <div class="p-4 bg-slate-900/50 rounded-xl border border-yellow-500/20">
            <p class="text-sm text-slate-400 mb-1">🚗 Standard</p>
            <p class="text-2xl font-bold text-yellow-400">{{ formatGas(currentGas.standard) }} <span class="text-sm font-normal">Gwei</span></p>
            <p class="text-xs text-slate-500 mt-1">~3 min</p>
          </div>
          <div class="p-4 bg-slate-900/50 rounded-xl border border-red-500/20">
            <p class="text-sm text-slate-400 mb-1">🚀 Fast</p>
            <p class="text-2xl font-bold text-red-400">{{ formatGas(currentGas.fast) }} <span class="text-sm font-normal">Gwei</span></p>
            <p class="text-xs text-slate-500 mt-1">~30 sec</p>
          </div>
        </div>

        <!-- Network Status -->
        <div v-if="networkStatus" class="flex items-center gap-6 p-4 bg-slate-900/50 rounded-xl mb-6">
          <div>
            <p class="text-xs text-slate-400">Network Congestion</p>
            <p :class="['text-lg font-semibold capitalize', congestionColor]">
              {{ networkStatus.congestion }}
            </p>
          </div>
          <div>
            <p class="text-xs text-slate-400">Trend (24h)</p>
            <p class="text-lg font-semibold">
              {{ trendIcon }} <span :class="networkStatus.change24h > 0 ? 'text-red-400' : 'text-green-400'">
                {{ networkStatus.change24h > 0 ? '+' : '' }}{{ networkStatus.change24h }}%
              </span>
            </p>
          </div>
          <div v-if="prediction">
            <p class="text-xs text-slate-400">Recommended</p>
            <p class="text-lg font-semibold text-blue-400 capitalize">
              {{ prediction.recommended }} ({{ prediction.estimatedTime }})
            </p>
          </div>
        </div>

        <!-- Best Time to Transact -->
        <div class="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 mb-6">
          <p class="text-sm text-slate-400 mb-2">🎯 Best Time to Transact</p>
          <p class="text-lg font-semibold">
            {{ dayNames[prediction?.bestTimeToTransact?.dayOfWeek || 0] }} at {{ formatHour(prediction?.bestTimeToTransact?.hour || 12) }}
            <span class="text-slate-400"> - Avg: {{ prediction?.bestTimeToTransact?.avgGas || 0 }} Gwei</span>
          </p>
        </div>

        <!-- Hourly Pattern -->
        <div class="mb-6">
          <p class="text-sm text-slate-400 mb-3">Hourly Gas Pattern (24h)</p>
          <div class="flex items-end gap-1 h-24">
            <div 
              v-for="hour in hourlyAverage" 
              :key="hour.hour"
              class="flex-1 bg-blue-500/50 hover:bg-blue-400 rounded-t transition-all"
              :style="{ height: `${Math.min(100, (hour.avgGas / 50) * 100)}%` }"
              :title="`${formatHour(hour.hour)}: ${hour.avgGas} Gwei`"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 mt-1">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </div>

        <!-- Weekly Pattern -->
        <div>
          <p class="text-sm text-slate-400 mb-3">Weekly Gas Pattern</p>
          <div class="flex items-end gap-2 h-20">
            <div 
              v-for="day in weeklyAverage" 
              :key="day.day"
              class="flex-1 bg-purple-500/50 hover:bg-purple-400 rounded-t transition-all"
              :style="{ height: `${Math.min(100, (day.avgGas / 50) * 100)}%` }"
              :title="`${dayNames[day.day]}: ${day.avgGas} Gwei`"
            ></div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 mt-1">
            <span v-for="name in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="name">
              {{ name }}
            </span>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-else-if="activeTab === 'history'">
        <p class="text-sm text-slate-400 mb-4">Gas Price History (Last 7 Days)</p>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div 
            v-for="(point, index) in gasHistory" 
            :key="index"
            class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
          >
            <span class="text-sm text-slate-400">{{ formatTime(point.timestamp) }}</span>
            <div class="flex items-center gap-4">
              <span class="text-sm">Avg: <span class="text-blue-400 font-medium">{{ point.avgGas }} Gwei</span></span>
              <span class="text-sm">Txs: <span class="text-slate-400">{{ point.transactionCount.toLocaleString() }}</span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Multi-Chain Tab -->
      <div v-else-if="activeTab === 'multi-chain'">
        <p class="text-sm text-slate-400 mb-4">Gas Prices Across Chains</p>
        <div class="grid gap-3">
          <div 
            v-for="chain in multiChainGas" 
            :key="chain.chainId"
            class="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl"
          >
            <div>
              <p class="font-medium">{{ chain.chainName }}</p>
              <p class="text-sm text-slate-400">{{ chain.chainSymbol }}</p>
            </div>
            <div class="text-right">
              <p class="text-xl font-bold text-blue-400">{{ chain.currentGas }} <span class="text-sm font-normal">Gwei</span></p>
              <p class="text-xs text-slate-500">24h avg: {{ chain.avgGas24h }} Gwei</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Calculator Tab -->
      <div v-else-if="activeTab === 'calculator'">
        <div class="max-w-md mx-auto space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-2">Gas Limit</label>
            <input 
              v-model.number="gasLimit"
              type="number"
              class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div class="flex gap-2 mt-2">
              <button @click="gasLimit = 21000" class="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded">ETH Transfer (21k)</button>
              <button @click="gasLimit = 65000" class="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded">ERC20 Transfer (65k)</button>
              <button @click="gasLimit = 200000" class="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded">Swap (200k)</button>
            </div>
          </div>

          <div>
            <label class="block text-sm text-slate-400 mb-2">Speed</label>
            <div class="flex gap-2">
              <button 
                v-for="speed in ['slow', 'standard', 'fast']" 
                :key="speed"
                @click="calculateSpeed = speed as any; calculateFee()"
                :class="[
                  'flex-1 py-3 rounded-xl font-medium transition-all',
                  calculateSpeed === speed 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600'
                ]"
              >
                {{ speed.charAt(0).toUpperCase() + speed.slice(1) }}
              </button>
            </div>
          </div>

          <button 
            @click="calculateFee"
            class="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium"
          >
            Calculate Fee
          </button>

          <div v-if="calculatedFee" class="p-4 bg-slate-900/50 rounded-xl text-center">
            <p class="text-sm text-slate-400">Estimated Fee</p>
            <p class="text-3xl font-bold text-blue-400">{{ calculatedFee.fee }} ETH</p>
            <p class="text-lg text-slate-400">~${{ calculatedFee.feeUsd }}</p>
            <p class="text-xs text-slate-500 mt-2">Gas Price: {{ calculatedFee.gasPrice }} Gwei</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
