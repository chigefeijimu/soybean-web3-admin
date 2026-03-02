<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface ProtectionStats {
  totalProtected: number
  savings24h: number
  savingsTotal: number
  sandwichesAvoided: number
  avgProtectionTime: number
}

interface ProtectConfig {
  useFlashbots: boolean
  useMEVBoost: boolean
  bundleSupport: boolean
  privacyEnabled: boolean
  gasSpeed: 'slow' | 'normal' | 'fast'
}

interface TransactionSimulator {
  withProtection: number
  withoutProtection: number
  savingsPercent: number
  risk: 'low' | 'medium' | 'high'
}

interface ProtectRecommendation {
  network: string
  gasPrice: number
  recommendedGasSpeed: 'slow' | 'normal' | 'fast'
  estimatedSavings: number
  bestTimeToSend: string
  protectionLevel: 'minimal' | 'standard' | 'maximum'
}

interface Relay {
  name: string
  url: string
  latency: string
  reliability: number
}

interface HistoricalSaving {
  date: string
  protected: number
  saved: number
}

const { t } = useI18n()

// Stats
const stats = ref<ProtectionStats | null>(null)
const config = ref<ProtectConfig | null>(null)
const recommendations = ref<ProtectRecommendation[]>([])
const relays = ref<Relay[]>([])
const tips = ref<string[]>([])
const history = ref<HistoricalSaving[]>([])
const status = ref<{ flashbots: boolean; mevBoost: boolean; privacyMode: boolean; bundleTx: boolean } | null>(null)

// Simulation
const simulatorTxAmount = ref(10000)
const simulatorTokenIn = ref('WETH')
const simulatorTokenOut = ref('USDC')
const simulationResult = ref<TransactionSimulator | null>(null)
const simulating = ref(false)

// Estimation
const estTxAmount = ref(10000)
const estFrequency = ref(1)
const estimateResult = ref<{ daily: number; weekly: number; monthly: number; yearly: number } | null>(null)

// UI State
const loading = ref(true)
const activeTab = ref('dashboard')
const showConfigModal = ref(false)

// Fetch all data
const fetchData = async () => {
  loading.value = true
  try {
    const [statsRes, configRes, recsRes, relaysRes, tipsRes, historyRes, statusRes] = await Promise.all([
      fetch('/api/mev-protect/stats').then(r => r.json()),
      fetch('/api/mev-protect/config').then(r => r.json()),
      fetch('/api/mev-protect/recommendations').then(r => r.json()),
      fetch('/api/mev-protect/relays').then(r => r.json()),
      fetch('/api/mev-protect/tips').then(r => r.json()),
      fetch('/api/mev-protect/history?days=30').then(r => r.json()),
      fetch('/api/mev-protect/status').then(r => r.json())
    ])
    
    stats.value = statsRes
    config.value = configRes
    recommendations.value = recsRes
    relays.value = relaysRes
    tips.value = tipsRes
    history.value = historyRes
    status.value = statusRes
  } catch (e) {
    console.error('Failed to fetch MEV protect data:', e)
  } finally {
    loading.value = false
  }
}

// Simulate transaction
const simulateTransaction = async () => {
  simulating.value = true
  try {
    const res = await fetch(`/api/mev-protect/simulate?amount=${simulatorTxAmount.value}&tokenIn=${simulatorTokenIn.value}&tokenOut=${simulatorTokenOut.value}`)
    simulationResult.value = await res.json()
  } catch (e) {
    console.error('Simulation failed:', e)
  } finally {
    simulating.value = false
  }
}

// Estimate savings
const estimateSavings = async () => {
  try {
    const res = await fetch(`/api/mev-protect/estimate?amount=${estTxAmount.value}&frequency=${estFrequency.value}`)
    estimateResult.value = await res.json()
  } catch (e) {
    console.error('Estimate failed:', e)
  }
}

// Update config
const updateConfig = async (newConfig: Partial<ProtectConfig>) => {
  try {
    const res = await fetch('/api/mev-protect/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    })
    config.value = await res.json()
  } catch (e) {
    console.error('Config update failed:', e)
  }
}

// Format helpers
const formatCurrency = (val: number) => `$${val.toLocaleString()}`
const formatPercent = (val: number) => `${val.toFixed(1)}%`
const formatTime = (time: string) => new Date(time).toLocaleTimeString()

// Risk color
const riskColor = computed(() => {
  if (!simulationResult.value) return 'text-gray-400'
  switch (simulationResult.value.risk) {
    case 'low': return 'text-green-400'
    case 'medium': return 'text-yellow-400'
    case 'high': return 'text-red-400'
    default: return 'text-gray-400'
  }
})

// Protection level colors
const levelColor = (level: string) => {
  switch (level) {
    case 'minimal': return 'text-green-400'
    case 'standard': return 'text-yellow-400'
    case 'maximum': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl p-6 border border-purple-700/30">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-white flex items-center gap-3">
            🛡️ MEV Protection Dashboard
          </h1>
          <p class="text-purple-300 mt-1">Protect your transactions from MEV extraction & sandwich attacks</p>
        </div>
        <button 
          @click="showConfigModal = true"
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
        >
          ⚙️ Settings
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
    </div>

    <template v-else>
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p class="text-slate-400 text-sm">Total Protected</p>
          <p class="text-2xl font-bold text-white mt-1">{{ stats?.totalProtected?.toLocaleString() || 0 }}</p>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p class="text-slate-400 text-sm">Savings (24h)</p>
          <p class="text-2xl font-bold text-green-400 mt-1">${{ stats?.savings24h?.toFixed(2) || 0 }}</p>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p class="text-slate-400 text-sm">Total Savings</p>
          <p class="text-2xl font-bold text-green-400 mt-1">${{ stats?.savingsTotal?.toFixed(2) || 0 }}</p>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p class="text-slate-400 text-sm">Attacks Avoided</p>
          <p class="text-2xl font-bold text-purple-400 mt-1">{{ stats?.sandwichesAvoided || 0 }}</p>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p class="text-slate-400 text-sm">Avg Protection Time</p>
          <p class="text-2xl font-bold text-blue-400 mt-1">{{ stats?.avgProtectionTime || 0 }}s</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 border-b border-slate-700 pb-2">
        <button 
          v-for="tab in ['dashboard', 'recommendations', 'simulator', 'history']" 
          :key="tab"
          @click="activeTab = tab"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            activeTab === tab ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          ]"
        >
          {{ tab === 'dashboard' ? '📊 Dashboard' : tab === 'recommendations' ? '💡 Recommendations' : tab === 'simulator' ? '🧪 Simulator' : '📈 History' }}
        </button>
      </div>

      <!-- Dashboard Tab -->
      <div v-if="activeTab === 'dashboard'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Protection Status -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h3 class="text-lg font-semibold mb-4">🔒 Protection Status</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-300">Flashbots</span>
              <span :class="status?.flashbots ? 'text-green-400' : 'text-red-400'">
                {{ status?.flashbots ? '✅ Enabled' : '❌ Disabled' }}
              </span>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-300">MEV-Boost</span>
              <span :class="status?.mevBoost ? 'text-green-400' : 'text-red-400'">
                {{ status?.mevBoost ? '✅ Enabled' : '❌ Disabled' }}
              </span>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-300">Privacy Mode</span>
              <span :class="status?.privacyMode ? 'text-green-400' : 'text-red-400'">
                {{ status?.privacyMode ? '✅ Enabled' : '❌ Disabled' }}
              </span>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-300">Bundle Transactions</span>
              <span :class="status?.bundleTx ? 'text-green-400' : 'text-red-400'">
                {{ status?.bundleTx ? '✅ Enabled' : '❌ Disabled' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Relays -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h3 class="text-lg font-semibold mb-4">🌐 MEV Relays</h3>
          <div class="space-y-2">
            <div v-for="relay in relays" :key="relay.name" 
              class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
            >
              <div>
                <p class="font-medium">{{ relay.name }}</p>
                <p class="text-xs text-slate-500">{{ relay.latency }}</p>
              </div>
              <span :class="relay.reliability >= 99 ? 'text-green-400' : 'text-yellow-400'">
                {{ relay.reliability }}% reliable
              </span>
            </div>
          </div>
        </div>

        <!-- Protection Tips -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 lg:col-span-2">
          <h3 class="text-lg font-semibold mb-4">💡 Protection Tips</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div v-for="tip in tips" :key="tip" class="flex items-start gap-2 p-3 bg-slate-900/50 rounded-lg">
              <span class="text-purple-400">•</span>
              <span class="text-slate-300 text-sm">{{ tip }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations Tab -->
      <div v-if="activeTab === 'recommendations'" class="space-y-4">
        <div v-for="rec in recommendations" :key="rec.network"
          class="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-2xl">
                {{ rec.network === 'ethereum' ? '🔷' : rec.network === 'arbitrum' ? '🔵' : rec.network === 'optimism' ? '🔴' : rec.network === 'polygon' ? '🟣' : '🟡' }}
              </span>
              <h3 class="text-lg font-semibold capitalize">{{ rec.network }}</h3>
            </div>
            <span :class="['px-3 py-1 rounded-full text-sm font-medium', 
              rec.protectionLevel === 'maximum' ? 'bg-red-500/20 text-red-400' :
              rec.protectionLevel === 'standard' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            ]">
              {{ rec.protectionLevel }} protection
            </span>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-slate-400 text-sm">Gas Price</p>
              <p class="text-xl font-bold">{{ rec.gasPrice }} Gwei</p>
            </div>
            <div>
              <p class="text-slate-400 text-sm">Recommended Speed</p>
              <p class="text-xl font-bold capitalize">{{ rec.recommendedGasSpeed }}</p>
            </div>
            <div>
              <p class="text-slate-400 text-sm">Est. Savings</p>
              <p class="text-xl font-bold text-green-400">{{ rec.estimatedSavings }}%</p>
            </div>
            <div>
              <p class="text-slate-400 text-sm">Best Time</p>
              <p class="text-xl font-bold">{{ rec.bestTimeToSend }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Simulator Tab -->
      <div v-if="activeTab === 'simulator'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Simulation Form -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h3 class="text-lg font-semibold mb-4">🧪 Transaction Simulator</h3>
          <div class="space-y-4">
            <div>
              <label class="text-slate-400 text-sm">Transaction Amount (USD)</label>
              <input v-model.number="simulatorTxAmount" type="number" 
                class="w-full mt-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-slate-400 text-sm">Token In</label>
                <select v-model="simulatorTokenIn"
                  class="w-full mt-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg"
                >
                  <option>WETH</option>
                  <option>WBTC</option>
                  <option>USDC</option>
                  <option>USDT</option>
                  <option>DAI</option>
                </select>
              </div>
              <div>
                <label class="text-slate-400 text-sm">Token Out</label>
                <select v-model="simulatorTokenOut"
                  class="w-full mt-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg"
                >
                  <option>USDC</option>
                  <option>USDT</option>
                  <option>WETH</option>
                  <option>DAI</option>
                  <option>WBTC</option>
                </select>
              </div>
            </div>
            <button @click="simulateTransaction" :disabled="simulating"
              class="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-medium"
            >
              {{ simulating ? 'Simulating...' : 'Run Simulation' }}
            </button>
          </div>

          <!-- Savings Estimator -->
          <div class="mt-6 pt-6 border-t border-slate-700">
            <h4 class="font-semibold mb-4">💰 Savings Estimator</h4>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-slate-400 text-sm">Tx Amount ($)</label>
                  <input v-model.number="estTxAmount" type="number"
                    class="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label class="text-slate-400 text-sm">Txs / Day</label>
                  <input v-model.number="estFrequency" type="number"
                    class="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg"
                  />
                </div>
              </div>
              <button @click="estimateSavings"
                class="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
              >
                Calculate Savings
              </button>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div class="space-y-4">
          <!-- Simulation Result -->
          <div v-if="simulationResult" class="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 class="text-lg font-semibold mb-4">📊 Simulation Results</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span class="text-slate-400">Without Protection</span>
                <span class="text-red-400 font-bold">${{ simulationResult.withoutProtection.toLocaleString() }}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span class="text-slate-400">With Protection</span>
                <span class="text-green-400 font-bold">${{ simulationResult.withProtection.toLocaleString() }}</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span class="text-slate-400">Savings</span>
                <span class="text-green-400 font-bold">{{ simulationResult.savingsPercent }}%</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span class="text-slate-400">Risk Level</span>
                <span :class="['font-bold capitalize', riskColor]">{{ simulationResult.risk }}</span>
              </div>
            </div>
          </div>

          <!-- Estimate Result -->
          <div v-if="estimateResult" class="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 class="text-lg font-semibold mb-4">💵 Estimated Savings</h3>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-slate-900/50 rounded-lg text-center">
                <p class="text-slate-400 text-sm">Daily</p>
                <p class="text-xl font-bold text-green-400">${{ estimateResult.daily }}</p>
              </div>
              <div class="p-3 bg-slate-900/50 rounded-lg text-center">
                <p class="text-slate-400 text-sm">Weekly</p>
                <p class="text-xl font-bold text-green-400">${{ estimateResult.weekly }}</p>
              </div>
              <div class="p-3 bg-slate-900/50 rounded-lg text-center">
                <p class="text-slate-400 text-sm">Monthly</p>
                <p class="text-xl font-bold text-green-400">${{ estimateResult.monthly }}</p>
              </div>
              <div class="p-3 bg-slate-900/50 rounded-lg text-center">
                <p class="text-slate-400 text-sm">Yearly</p>
                <p class="text-xl font-bold text-green-400">${{ estimateResult.yearly }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h3 class="text-lg font-semibold mb-4">📈 Savings History (30 Days)</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-slate-400 border-b border-slate-700">
                <th class="pb-3">Date</th>
                <th class="pb-3">Protected Txs</th>
                <th class="pb-3">Saved ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in history" :key="item.date" class="border-b border-slate-700/50">
                <td class="py-3 text-slate-300">{{ item.date }}</td>
                <td class="py-3 text-white">{{ item.protected }}</td>
                <td class="py-3 text-green-400">${{ item.saved }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Config Modal -->
    <div v-if="showConfigModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showConfigModal = false">
      <div class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <h3 class="text-xl font-semibold mb-4">⚙️ Protection Settings</h3>
        <div class="space-y-4">
          <label class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span>Use Flashbots</span>
            <input type="checkbox" v-model="config!.useFlashbots" @change="updateConfig({ useFlashbots: config!.useFlashbots })"
              class="w-5 h-5 accent-purple-500" />
          </label>
          <label class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span>Use MEV-Boost</span>
            <input type="checkbox" v-model="config!.useMEVBoost" @change="updateConfig({ useMEVBoost: config!.useMEVBoost })"
              class="w-5 h-5 accent-purple-500" />
          </label>
          <label class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span>Bundle Support</span>
            <input type="checkbox" v-model="config!.bundleSupport" @change="updateConfig({ bundleSupport: config!.bundleSupport })"
              class="w-5 h-5 accent-purple-500" />
          </label>
          <label class="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer">
            <span>Privacy Mode</span>
            <input type="checkbox" v-model="config!.privacyEnabled" @change="updateConfig({ privacyEnabled: config!.privacyEnabled })"
              class="w-5 h-5 accent-purple-500" />
          </label>
          <div>
            <label class="text-slate-400 text-sm">Gas Speed</label>
            <select v-model="config!.gasSpeed" @change="updateConfig({ gasSpeed: config!.gasSpeed })"
              class="w-full mt-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg"
            >
              <option value="slow">🐢 Slow</option>
              <option value="normal">🚶 Normal</option>
              <option value="fast">🚀 Fast</option>
            </select>
          </div>
        </div>
        <button @click="showConfigModal = false"
          class="w-full mt-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
