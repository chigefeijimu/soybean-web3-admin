<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  fetchDefiProtocols,
  fetchDefiCategories,
  fetchDefiChains,
  fetchDefiTopByCategory,
  fetchDefiRankings,
  compareDefiProtocols,
  type Protocol,
  type ComparisonResult
} from '@/service/api/web3'

// State
const loading = ref(false)
const protocols = ref<Protocol[]>([])
const categories = ref<string[]>([])
const chains = ref<string[]>([])
const topByCategory = ref<Record<string, Protocol[]>>({})
const rankings = ref<{
  byTVL: Protocol[];
  byAPY: Protocol[];
  byUsers: Protocol[];
  bySafety: Protocol[];
} | null>(null)

const selectedCategory = ref('')
const selectedChain = ref('')
const selectedProtocols = ref<string[]>([])
const comparisonResult = ref<ComparisonResult | null>(null)
const activeView = ref<'browse' | 'compare' | 'rankings' | 'top'>('browse')

// Format numbers
function formatNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
  return `$${num.toFixed(2)}`
}

function formatAPY(apy: number): string {
  if (apy === 0) return '-'
  return `${apy.toFixed(1)}%`
}

function getRiskLabel(score: number): string {
  if (score <= 15) return { text: 'Low', color: 'text-green-400' }
  if (score <= 30) return { text: 'Medium', color: 'text-yellow-400' }
  return { text: 'High', color: 'text-red-400' }
}

// Load initial data
onMounted(async () => {
  loading.value = true
  try {
    const [cats, chs, tops, ranks] = await Promise.all([
      fetchDefiCategories(),
      fetchDefiChains(),
      fetchDefiTopByCategory(),
      fetchDefiRankings()
    ])
    categories.value = cats.data || []
    chains.value = chs.data || []
    topByCategory.value = tops.data || {}
    rankings.value = ranks.data
    protocols.value = await fetchDefiProtocols().then(r => r.data || [])
  } catch (e) {
    console.error('Failed to load data:', e)
    // Fallback data
    categories.value = ['Lending', 'DEX', 'Staking', 'Derivatives', 'Yield', 'Bridge']
    chains.value = ['ethereum', 'arbitrum', 'polygon', 'multi']
    protocols.value = [
      { id: 'aave', name: 'Aave', category: 'Lending', chain: 'ethereum', logo: '🦔', tvl: 12500000000, apy: 4.5, users: 180000, fees24h: 2500000, volume24h: 180000000, riskScore: 15, auditScore: 95, age: 2017, description: 'Decentralized liquidity protocol', website: 'https://aave.com' },
      { id: 'uniswap-v3', name: 'Uniswap V3', category: 'DEX', chain: 'ethereum', logo: '🦄', tvl: 4500000000, apy: 25.0, users: 350000, fees24h: 8500000, volume24h: 1200000000, riskScore: 10, auditScore: 98, age: 2021, description: 'Automated liquidity protocol', website: 'https://uniswap.org' },
      { id: 'lido', name: 'Lido', category: 'Staking', chain: 'ethereum', logo: '🛡️', tvl: 18000000000, apy: 3.2, users: 95000, fees24h: 4500000, volume24h: 320000000, riskScore: 20, auditScore: 92, age: 2020, description: 'Liquid staking', website: 'https://lido.fi' },
    ]
  } finally {
    loading.value = false
  }
})

// Watch filters
watch([selectedCategory, selectedChain], async () => {
  try {
    protocols.value = await fetchDefiProtocols(
      selectedCategory.value || undefined,
      selectedChain.value || undefined
    ).then(r => r.data || [])
  } catch (e) {
    console.error('Failed to filter protocols:', e)
  }
})

// Toggle protocol selection
function toggleProtocol(id: string) {
  const idx = selectedProtocols.value.indexOf(id)
  if (idx >= 0) {
    selectedProtocols.value.splice(idx, 1)
  } else if (selectedProtocols.value.length < 5) {
    selectedProtocols.value.push(id)
  }
}

// Compare protocols
async function runComparison() {
  if (selectedProtocols.value.length < 2) return
  
  loading.value = true
  try {
    comparisonResult.value = await compareDefiProtocols(selectedProtocols.value).then(r => r.data)
  } catch (e) {
    console.error('Failed to compare:', e)
  } finally {
    loading.value = false
  }
}

// Quick select for comparison
function quickCompare(protocolIds: string[]) {
  selectedProtocols.value = [...protocolIds]
  activeView.value = 'compare'
  setTimeout(runComparison, 100)
}
</script>

<template>
  <div class="defi-compare">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold">DeFi Protocol Comparison</h2>
      <p class="text-slate-400">Compare DeFi protocols side by side</p>
    </div>

    <!-- View Tabs -->
    <div class="mb-6 flex gap-2">
      <button
        v-for="view in [
          { id: 'browse', label: 'Browse', icon: '🔍' },
          { id: 'compare', label: 'Compare', icon: '⚖️' },
          { id: 'top', label: 'Top Lists', icon: '🏆' },
          { id: 'rankings', label: 'Rankings', icon: '📊' }
        ]"
        :key="view.id"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
        :class="[
          activeView === view.id
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
            : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
        ]"
        @click="activeView = view.id as any"
      >
        <span class="mr-2">{{ view.icon }}</span>
        {{ view.label }}
      </button>
    </div>

    <!-- Browse View -->
    <div v-show="activeView === 'browse'" class="space-y-4">
      <!-- Filters -->
      <div class="flex gap-4 flex-wrap">
        <select
          v-model="selectedCategory"
          class="rounded-lg bg-slate-800 px-4 py-2 text-sm border border-slate-700"
        >
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        
        <select
          v-model="selectedChain"
          class="rounded-lg bg-slate-800 px-4 py-2 text-sm border border-slate-700"
        >
          <option value="">All Chains</option>
          <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
        </select>
      </div>

      <!-- Protocols Grid -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="protocol in protocols"
          :key="protocol.id"
          class="rounded-xl border p-4 transition-all cursor-pointer"
          :class="[
            selectedProtocols.includes(protocol.id)
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          ]"
          @click="toggleProtocol(protocol.id)"
        >
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl">{{ protocol.logo }}</span>
              <div>
                <h3 class="font-semibold">{{ protocol.name }}</h3>
                <span class="text-xs text-slate-400">{{ protocol.category }} • {{ protocol.chain }}</span>
              </div>
            </div>
            <div v-if="selectedProtocols.includes(protocol.id)" class="text-purple-400">✓</div>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-slate-400">TVL</span>
              <p class="font-semibold">{{ formatNumber(protocol.tvl) }}</p>
            </div>
            <div>
              <span class="text-slate-400">APY</span>
              <p class="font-semibold text-green-400">{{ formatAPY(protocol.apy) }}</p>
            </div>
            <div>
              <span class="text-slate-400">Users</span>
              <p class="font-semibold">{{ protocol.users.toLocaleString() }}</p>
            </div>
            <div>
              <span class="text-slate-400">Risk</span>
              <p class="font-semibold" :class="getRiskLabel(protocol.riskScore).color">
                {{ getRiskLabel(protocol.riskScore).text }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Compare Button -->
      <div v-if="selectedProtocols.length >= 2" class="sticky bottom-4 mt-4 text-center">
        <button
          class="rounded-xl bg-purple-500 px-8 py-3 font-semibold transition-all hover:bg-purple-600"
          @click="activeView = 'compare'; runComparison()"
        >
          Compare {{ selectedProtocols.length }} Protocols →
        </button>
      </div>
    </div>

    <!-- Compare View -->
    <div v-show="activeView === 'compare'" class="space-y-6">
      <div v-if="loading" class="text-center py-12">
        <div class="text-2xl mb-2">⏳</div>
        <p class="text-slate-400">Loading comparison...</p>
      </div>
      
      <div v-else-if="comparisonResult" class="space-y-6">
        <!-- Quick Select -->
        <div class="flex gap-2 flex-wrap">
          <span class="text-slate-400 py-2">Quick compare:</span>
          <button
            v-for="cat in categories.slice(0, 4)"
            :key="cat"
            class="rounded-lg bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"
            @click="quickCompare(topByCategory[cat]?.slice(0, 3).map(p => p.id) || [])"
          >
            {{ cat }} Top 3
          </button>
        </div>

        <!-- Comparison Cards -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="protocol in comparisonResult.protocols"
            :key="protocol.id"
            class="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
          >
            <div class="mb-4 flex items-center gap-2">
              <span class="text-2xl">{{ protocol.logo }}</span>
              <div>
                <h3 class="font-semibold">{{ protocol.name }}</h3>
                <span class="text-xs text-slate-400">{{ protocol.chain }}</span>
              </div>
            </div>
            
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-400">TVL</span>
                <span class="font-semibold">{{ formatNumber(protocol.tvl) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">APY</span>
                <span class="font-semibold text-green-400">{{ formatAPY(protocol.apy) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Users</span>
                <span class="font-semibold">{{ protocol.users.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">24h Fees</span>
                <span class="font-semibold">{{ formatNumber(protocol.fees24h) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Risk</span>
                <span class="font-semibold" :class="getRiskLabel(protocol.riskScore).color">
                  {{ getRiskLabel(protocol.riskScore).text }} ({{ protocol.riskScore }})
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Audit</span>
                <span class="font-semibold text-green-400">{{ protocol.auditScore }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">Since</span>
                <span class="font-semibold">{{ protocol.age }}</span>
              </div>
            </div>
            
            <a
              :href="protocol.website"
              target="_blank"
              class="mt-4 block rounded-lg bg-slate-700 py-2 text-center text-sm hover:bg-slate-600"
            >
              Visit Website →
            </a>
          </div>
        </div>

        <!-- Recommendations -->
        <div v-if="comparisonResult.recommendations.length" class="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h3 class="mb-4 text-lg font-semibold">💡 Recommendations</h3>
          <ul class="space-y-2">
            <li v-for="(rec, idx) in comparisonResult.recommendations" :key="idx" class="flex items-center gap-2">
              <span>{{ rec }}</span>
            </li>
          </ul>
        </div>

        <!-- Comparison Charts -->
        <div class="grid gap-4 md:grid-cols-2">
          <!-- TVL Comparison -->
          <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <h3 class="mb-3 font-semibold">TVL Comparison</h3>
            <div class="space-y-2">
              <div v-for="item in comparisonResult.metrics.tvlComparison" :key="item.name" class="flex items-center gap-2">
                <span class="w-24 text-sm text-slate-400">{{ item.name }}</span>
                <div class="flex-1 h-4 bg-slate-700 rounded overflow-hidden">
                  <div
                    class="h-full bg-purple-500"
                    :style="{ width: `${(item.value / Math.max(...comparisonResult.metrics.tvlComparison.map(m => m.value))) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm w-20 text-right">{{ formatNumber(item.value) }}</span>
              </div>
            </div>
          </div>

          <!-- APY Comparison -->
          <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
            <h3 class="mb-3 font-semibold">APY Comparison</h3>
            <div class="space-y-2">
              <div v-for="item in comparisonResult.metrics.apyComparison" :key="item.name" class="flex items-center gap-2">
                <span class="w-24 text-sm text-slate-400">{{ item.name }}</span>
                <div class="flex-1 h-4 bg-slate-700 rounded overflow-hidden">
                  <div
                    class="h-full bg-green-500"
                    :style="{ width: `${(item.value / Math.max(...comparisonResult.metrics.apyComparison.map(m => m.value))) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm w-20 text-right">{{ formatAPY(item.value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="text-center py-12 text-slate-400">
        <div class="text-4xl mb-4">⚖️</div>
        <p>Select protocols to compare</p>
        <p class="text-sm mt-2">Choose at least 2 protocols from the Browse tab</p>
      </div>
    </div>

    <!-- Top Lists View -->
    <div v-show="activeView === 'top'" class="space-y-6">
      <div v-for="(protocols, category) in topByCategory" :key="category" class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <h3 class="mb-3 font-semibold">{{ category }} Top Protocols</h3>
        <div class="space-y-2">
          <div
            v-for="(protocol, idx) in protocols"
            :key="protocol.id"
            class="flex items-center gap-3 rounded-lg bg-slate-900/50 p-3"
          >
            <span class="text-lg font-bold w-8" :class="idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-slate-500'">
              {{ idx + 1 }}
            </span>
            <span class="text-xl">{{ protocol.logo }}</span>
            <div class="flex-1">
              <p class="font-semibold">{{ protocol.name }}</p>
              <p class="text-xs text-slate-400">{{ protocol.chain }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold">{{ formatNumber(protocol.tvl) }}</p>
              <p class="text-xs text-slate-400">TVL</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-green-400">{{ formatAPY(protocol.apy) }}</p>
              <p class="text-xs text-slate-400">APY</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rankings View -->
    <div v-show="activeView === 'rankings'" class="space-y-6">
      <div class="grid gap-4 md:grid-cols-2">
        <!-- By TVL -->
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 class="mb-3 font-semibold">🏆 By TVL</h3>
          <div class="space-y-2">
            <div
              v-for="(protocol, idx) in rankings?.byTVL || []"
              :key="protocol.id"
              class="flex items-center gap-2 text-sm"
            >
              <span class="w-6 text-slate-400">{{ idx + 1 }}</span>
              <span>{{ protocol.logo }}</span>
              <span class="flex-1">{{ protocol.name }}</span>
              <span class="text-slate-400">{{ formatNumber(protocol.tvl) }}</span>
            </div>
          </div>
        </div>

        <!-- By APY -->
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 class="mb-3 font-semibold">📈 By APY</h3>
          <div class="space-y-2">
            <div
              v-for="(protocol, idx) in rankings?.byAPY || []"
              :key="protocol.id"
              class="flex items-center gap-2 text-sm"
            >
              <span class="w-6 text-slate-400">{{ idx + 1 }}</span>
              <span>{{ protocol.logo }}</span>
              <span class="flex-1">{{ protocol.name }}</span>
              <span class="text-green-400">{{ formatAPY(protocol.apy) }}</span>
            </div>
          </div>
        </div>

        <!-- By Users -->
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 class="mb-3 font-semibold">👥 By Users</h3>
          <div class="space-y-2">
            <div
              v-for="(protocol, idx) in rankings?.byUsers || []"
              :key="protocol.id"
              class="flex items-center gap-2 text-sm"
            >
              <span class="w-6 text-slate-400">{{ idx + 1 }}</span>
              <span>{{ protocol.logo }}</span>
              <span class="flex-1">{{ protocol.name }}</span>
              <span class="text-slate-400">{{ protocol.users.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- By Safety -->
        <div class="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h3 class="mb-3 font-semibold">🛡️ By Safety</h3>
          <div class="space-y-2">
            <div
              v-for="(protocol, idx) in rankings?.bySafety || []"
              :key="protocol.id"
              class="flex items-center gap-2 text-sm"
            >
              <span class="w-6 text-slate-400">{{ idx + 1 }}</span>
              <span>{{ protocol.logo }}</span>
              <span class="flex-1">{{ protocol.name }}</span>
              <span class="text-green-400">Score: {{ 100 - protocol.riskScore }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.defi-compare {
  @apply text-white;
}
</style>
