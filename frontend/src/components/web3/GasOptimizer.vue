<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface GasRecommendation {
  chainId: number
  urgency: string
  recommendedGas: number
  estimatedFee: string
  savings: number
  bestTimeToSend: string
  confidence: number
  reasons: string[]
}

interface TimeSlot {
  hour: number
  dayOfWeek: number
  averageGas: number
  recommendation: 'excellent' | 'good' | 'fair' | 'poor'
}

interface GasTrend {
  timestamp: string
  average: number
  slow: number
  fast: number
  trend: string
}

interface Savings {
  currentFee: string
  optimizedFee: string
  savingsAmount: string
  savingsPercent: number
  annualSavings: string
}

const chainId = ref(1)
const activeTab = ref('recommend')
const loading = ref(true)
const recommendation = ref<GasRecommendation | null>(null)
const schedule = ref<TimeSlot[]>([])
const scheduleSummary = ref('')
const trends = ref<GasTrend[]>([])
const trendAnalysis = ref('')
const savings = ref<Savings | null>(null)
const urgency = ref<'low' | 'normal' | 'high'>('normal')

const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
]

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const currentChain = computed(() => chains.find(c => c.id === chainId.value) || chains[0])

const bestTimeSlots = computed(() => {
  return schedule.value.filter(s => s.recommendation === 'excellent').slice(0, 6)
})

const getRecommendationColor = (rec: string) => {
  switch (rec) {
    case 'excellent': return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'good': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'fair': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'poor': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-slate-700 text-slate-300'
  }
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'rising': return '📈'
    case 'falling': return '📉'
    default: return '➡️'
  }
}

const fetchRecommendation = async () => {
  try {
    const res = await fetch(`/api/web3/gas-optimizer/recommend?chainId=${chainId.value}&urgency=${urgency.value}`)
    recommendation.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch recommendation:', e)
  }
}

const fetchSchedule = async () => {
  try {
    const res = await fetch(`/api/web3/gas-optimizer/schedule?chainId=${chainId.value}`)
    const data = await res.json()
    schedule.value = data.schedule
    scheduleSummary.value = data.summary
  } catch (e) {
    console.error('Failed to fetch schedule:', e)
  }
}

const fetchTrends = async () => {
  try {
    const res = await fetch(`/api/web3/gas-optimizer/trends?chainId=${chainId.value}&hours=72`)
    const data = await res.json()
    trends.value = data.trends
    trendAnalysis.value = data.analysis
  } catch (e) {
    console.error('Failed to fetch trends:', e)
  }
}

const fetchSavings = async () => {
  try {
    const res = await fetch(`/api/web3/gas-optimizer/savings?chainId=${chainId.value}&gasLimit=21000&useOptimizer=true`)
    savings.value = await res.json()
  } catch (e) {
    console.error('Failed to fetch savings:', e)
  }
}

const loadData = async () => {
  loading.value = true
  await Promise.all([
    fetchRecommendation(),
    fetchSchedule(),
    fetchTrends(),
    fetchSavings(),
  ])
  loading.value = false
}

onMounted(() => {
  loadData()
})

const tabs = [
  { id: 'recommend', name: '💡 推荐', icon: 'bulb' },
  { id: 'schedule', name: '📅 时间表', icon: 'calendar' },
  { id: 'trends', name: '📊 趋势', icon: 'chart' },
  { id: 'savings', name: '💰 节省', icon: 'money' },
]
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="p-6 border-b border-slate-700/50">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-xl font-semibold">⛽ Gas Fee Optimizer</h2>
          <p class="text-sm text-slate-400 mt-1">智能Gas费用优化器 - 节省最多30% Gas费</p>
        </div>
        <div class="flex items-center gap-3">
          <select v-model="chainId" @change="loadData" class="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm">
            <option v-for="c in chains" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mt-4 overflow-x-auto">
        <button v-for="tab in tabs" :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
            activeTab === tab.id 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
              : 'bg-slate-900/30 text-slate-400 border border-transparent hover:bg-slate-900/50'
          ]"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full"></div>
      </div>

      <!-- Recommend Tab -->
      <div v-else-if="activeTab === 'recommend'">
        <!-- Urgency Selector -->
        <div class="flex gap-2 mb-6">
          <button v-for="u in ['low', 'normal', 'high']" :key="u"
            @click="urgency = u as any; fetchRecommendation()"
            :class="[
              'flex-1 py-3 rounded-lg text-sm font-medium transition-all capitalize',
              urgency === u
                ? u === 'low' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : u === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-900/30 text-slate-400 border border-transparent hover:bg-slate-900/50'
            ]"
          >
            {{ u === 'low' ? '🐢 不紧急' : u === 'high' ? '🚀 紧急' : '🚶 普通' }}
          </button>
        </div>

        <div v-if="recommendation" class="space-y-4">
          <!-- Main Recommendation Card -->
          <div class="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
            <div class="flex items-start justify-between mb-4">
              <div>
                <p class="text-sm text-slate-400">推荐 Gas Price</p>
                <p class="text-4xl font-bold text-white mt-1">
                  {{ recommendation.recommendedGas }}
                  <span class="text-lg font-normal text-slate-400">Gwei</span>
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-slate-400">预计费用</p>
                <p class="text-xl font-semibold text-white">{{ recommendation.estimatedFee }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div>
                <p class="text-xs text-slate-400">置信度</p>
                <p class="text-lg font-semibold text-purple-400">{{ recommendation.confidence }}%</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-slate-400">预计节省</p>
                <p class="text-lg font-semibold text-green-400">{{ recommendation.savings }}%</p>
              </div>
            </div>
          </div>

          <!-- Best Time to Send -->
          <div class="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <div class="flex items-center gap-3">
              <span class="text-2xl">⏰</span>
              <div>
                <p class="text-sm text-slate-400">最佳发送时间</p>
                <p class="text-lg font-semibold text-blue-400">{{ recommendation.bestTimeToSend }}</p>
              </div>
            </div>
          </div>

          <!-- Reasons -->
          <div class="space-y-2">
            <p class="text-sm text-slate-400">分析原因</p>
            <div v-for="(reason, i) in recommendation.reasons" :key="i"
              class="p-3 bg-slate-900/30 rounded-lg text-sm text-slate-300"
            >
              {{ reason }}
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Tab -->
      <div v-else-if="activeTab === 'schedule'">
        <div v-if="scheduleSummary" class="mb-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
          <p class="text-green-400">{{ scheduleSummary }}</p>
        </div>

        <div class="mb-4">
          <p class="text-sm text-slate-400 mb-2">最佳交易时段 (Excellent)</p>
          <div class="flex flex-wrap gap-2">
            <span v-for="slot in bestTimeSlots" :key="`${slot.dayOfWeek}-${slot.hour}`"
              :class="['px-3 py-1.5 rounded-lg text-sm font-medium', getRecommendationColor(slot.recommendation)]"
            >
              周{{ dayNames[slot.dayOfWeek] }} {{ slot.hour }}:00
            </span>
          </div>
        </div>

        <!-- Weekly Grid -->
        <div class="overflow-x-auto">
          <div class="min-w-[600px]">
            <div class="grid grid-cols-8 gap-1 text-xs">
              <div class="p-2 text-slate-400"></div>
              <div v-for="day in dayNames" :key="day" class="p-2 text-center text-slate-400 font-medium">{{ day }}</div>
            </div>
            <div v-for="hour in 24" :key="hour" class="grid grid-cols-8 gap-1">
              <div class="p-1 text-xs text-slate-500">{{ hour - 1 }}:00</div>
              <div v-for="day in 7" :key="`${hour}-${day}`" 
                :class="[
                  'p-1 rounded text-xs text-center transition-all hover:scale-110 cursor-pointer',
                  getRecommendationColor(schedule.find(s => s.hour === hour - 1 && s.dayOfWeek === day - 1)?.recommendation || 'fair')
                ]"
                :title="`${dayNames[day - 1]} ${hour - 1}:00 - Gas: ${schedule.find(s => s.hour === hour - 1 && s.dayOfWeek === day - 1)?.averageGas || '-'}x`"
              >
              </div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex gap-4 mt-4 text-xs">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-green-500/30"></span> Excellent</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-blue-500/30"></span> Good</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-yellow-500/30"></span> Fair</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-red-500/30"></span> Poor</span>
        </div>
      </div>

      <!-- Trends Tab -->
      <div v-else-if="activeTab === 'trends'">
        <div v-if="trendAnalysis" class="mb-6 p-4 bg-slate-900/50 rounded-xl">
          <p class="text-slate-300">{{ trendAnalysis }}</p>
        </div>

        <!-- Chart -->
        <div class="h-64 mb-4">
          <div class="h-full flex items-end gap-1">
            <div v-for="(t, i) in trends.slice(-48)" :key="i" 
              class="flex-1 bg-gradient-to-t from-blue-500/50 to-blue-500/20 rounded-t transition-all hover:from-blue-400/50"
              :style="{ height: (t.average / Math.max(...trends.map(x => x.average)) * 100) + '%' }"
              :title="`${new Date(t.timestamp).toLocaleString()}: ${t.average} Gwei`"
            />
          </div>
        </div>

        <div class="flex justify-between text-xs text-slate-400">
          <span>48h ago</span>
          <span>Now</span>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4 mt-6">
          <div class="p-4 bg-slate-900/30 rounded-xl text-center">
            <p class="text-xs text-slate-400">Average</p>
            <p class="text-xl font-bold text-white">{{ (trends.reduce((s, t) => s + t.average, 0) / trends.length).toFixed(1) }} Gwei</p>
          </div>
          <div class="p-4 bg-slate-900/30 rounded-xl text-center">
            <p class="text-xs text-slate-400">Lowest</p>
            <p class="text-xl font-bold text-green-400">{{ Math.min(...trends.map(t => t.slow)).toFixed(1) }} Gwei</p>
          </div>
          <div class="p-4 bg-slate-900/30 rounded-xl text-center">
            <p class="text-xs text-slate-400">Highest</p>
            <p class="text-xl font-bold text-red-400">{{ Math.max(...trends.map(t => t.fast)).toFixed(1) }} Gwei</p>
          </div>
        </div>
      </div>

      <!-- Savings Tab -->
      <div v-else-if="activeTab === 'savings' && savings">
        <div class="space-y-4">
          <!-- Savings Card -->
          <div class="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20 text-center">
            <p class="text-sm text-slate-400">预计节省</p>
            <p class="text-5xl font-bold text-green-400 mt-2">{{ savings.savingsPercent }}%</p>
            <p class="text-slate-400 mt-2">每次交易可节省 {{ savings.savingsAmount }}</p>
          </div>

          <!-- Comparison -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-slate-900/50 rounded-xl">
              <p class="text-xs text-slate-400 mb-1">普通Gas费用</p>
              <p class="text-xl font-semibold text-white">{{ savings.currentFee }}</p>
            </div>
            <div class="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <p class="text-xs text-green-400 mb-1">优化后费用</p>
              <p class="text-xl font-semibold text-green-400">{{ savings.optimizedFee }}</p>
            </div>
          </div>

          <!-- Annual Savings -->
          <div class="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-400">年度预计节省 (每周1笔)</p>
                <p class="text-2xl font-bold text-purple-400">{{ savings.annualSavings }}</p>
              </div>
              <span class="text-4xl">🎉</span>
            </div>
          </div>

          <!-- Tips -->
          <div class="p-4 bg-slate-900/30 rounded-xl">
            <p class="text-sm font-medium text-slate-300 mb-2">💡 节省Gas的技巧</p>
            <ul class="text-sm text-slate-400 space-y-1">
              <li>• 在凌晨2-6点进行交易，此时Gas价格最低</li>
              <li>• 周末的Gas价格通常比工作日低20-30%</li>
              <li>• 使用"低紧迫度"模式进行非紧急转账</li>
              <li>• 在Polygon或Arbitrum上进行交易，Gas费更低</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
