<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  fetchVotingPower, 
  fetchDelegates, 
  fetchProposals, 
  fetchPowerAnalytics,
  fetchPowerHistory,
  compareVotingPower,
  fetchSupportedDaos,
  type VotingPowerResult,
  type DelegateInfo,
  type ProposalInfo,
  type PowerAnalytics,
  type PowerHistory
} from '@/service/api/web3'

// State
const address = ref('')
const compareAddress = ref('')
const selectedDao = ref('')
const selectedPeriod = ref(90)
const activeView = ref<'power' | 'delegates' | 'proposals' | 'analytics' | 'history' | 'compare'>('power')
const loading = ref(false)

// Data
const votingPower = ref<VotingPowerResult | null>(null)
const delegates = ref<DelegateInfo | null>(null)
const proposals = ref<ProposalInfo | null>(null)
const analytics = ref<PowerAnalytics | null>(null)
const powerHistory = ref<PowerHistory | null>(null)
const compareResult = ref<any>(null)
const supportedDaos = ref<{ id: string; name: string; token: string; chain: string }[]>([])

// Load supported DAOs on mount
onMounted(async () => {
  try {
    const result = await fetchSupportedDaos()
    supportedDaos.value = result.data || []
    if (supportedDaos.value.length > 0) {
      selectedDao.value = supportedDaos.value[0].id
    }
  } catch (e) {
    console.error('Failed to load DAOs:', e)
    supportedDaos.value = [
      { id: 'uniswap', name: 'Uniswap', token: 'UNI', chain: 'ethereum' },
      { id: 'aave', name: 'Aave', token: 'AAVE', chain: 'ethereum' },
      { id: 'compound', name: 'Compound', token: 'COMP', chain: 'ethereum' },
      { id: 'makerdao', name: 'MakerDAO', token: 'MKR', chain: 'ethereum' },
      { id: 'curve', name: 'Curve DAO', token: 'CRV', chain: 'ethereum' },
    ]
    selectedDao.value = 'uniswap'
  }
})

// Watch for address changes
watch(address, (newVal) => {
  if (newVal && newVal.length === 42) {
    loadData()
  }
})

watch(selectedDao, () => {
  if (activeView.value === 'delegates') {
    loadDelegates()
  } else if (activeView.value === 'proposals') {
    loadProposals()
  }
})

// Load all data
async function loadData() {
  if (!address.value || address.value.length !== 42) return
  
  loading.value = true
  try {
    const result = await fetchVotingPower(address.value)
    votingPower.value = result.data
  } catch (e) {
    console.error('Failed to load voting power:', e)
  } finally {
    loading.value = false
  }
}

// Load delegates
async function loadDelegates() {
  if (!selectedDao.value) return
  
  loading.value = true
  try {
    const result = await fetchDelegates(selectedDao.value)
    delegates.value = result.data
  } catch (e) {
    console.error('Failed to load delegates:', e)
  } finally {
    loading.value = false
  }
}

// Load proposals
async function loadProposals() {
  if (!selectedDao.value) return
  
  loading.value = true
  try {
    const result = await fetchProposals(selectedDao.value)
    proposals.value = result.data
  } catch (e) {
    console.error('Failed to load proposals:', e)
  } finally {
    loading.value = false
  }
}

// Load analytics
async function loadAnalytics() {
  if (!address.value || address.value.length !== 42) return
  
  loading.value = true
  try {
    const result = await fetchPowerAnalytics(address.value)
    analytics.value = result.data
  } catch (e) {
    console.error('Failed to load analytics:', e)
  } finally {
    loading.value = false
  }
}

// Load power history
async function loadHistory() {
  if (!address.value || address.value.length !== 42) return
  
  loading.value = true
  try {
    const result = await fetchPowerHistory(address.value, selectedDao.value || 'uniswap', selectedPeriod.value)
    powerHistory.value = result.data
  } catch (e) {
    console.error('Failed to load history:', e)
  } finally {
    loading.value = false
  }
}

// Compare voting power
async function loadCompare() {
  if (!address.value || !compareAddress.value) return
  
  loading.value = true
  try {
    const result = await compareVotingPower(address.value, compareAddress.value)
    compareResult.value = result.data
  } catch (e) {
    console.error('Failed to compare:', e)
  } finally {
    loading.value = false
  }
}

// Switch view
function switchView(view: typeof activeView.value) {
  activeView.value = view
  
  if (view === 'delegates') {
    loadDelegates()
  } else if (view === 'proposals') {
    loadProposals()
  } else if (view === 'analytics' && address.value) {
    loadAnalytics()
  } else if (view === 'history' && address.value) {
    loadHistory()
  } else if (view === 'compare' && address.value && compareAddress.value) {
    loadCompare()
  }
}

// Format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  }
  return num.toFixed(2)
}

// Format address
function formatAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

// Get status color
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-yellow-500',
    passed: 'text-green-500',
    failed: 'text-red-500',
    executed: 'text-blue-500'
  }
  return colors[status] || 'text-gray-500'
}

// Get DAO color
function getDaoColor(dao: string): string {
  const colors: Record<string, string> = {
    uniswap: '#FF007A',
    aave: '#2EBAC6',
    compound: '#00D395',
    makerdao: '#1AAB9B',
    curve: '#FF6B6B',
    balancer: '#1E1E1E',
    lido: '#00A3FF',
    ens: '#4C4C4C',
    optimism: '#FF0420',
    arbitrum: '#28A0F0'
  }
  return colors[dao] || '#666666'
}

// Calculate vote percentage
function getVotePercentage(forVotes: number, againstVotes: number): number {
  const total = forVotes + againstVotes
  if (total === 0) return 0
  return (forVotes / total) * 100
}
</script>

<template>
  <div class="governance-power-tracker">
    <!-- Header -->
    <div class="header-section">
      <h2 class="text-2xl font-bold mb-4">🗳️ Governance Power Tracker</h2>
      <p class="text-gray-400 mb-4">Track DAO voting power, delegates, and governance participation</p>
      
      <!-- Address Input -->
      <div class="flex gap-4 mb-4">
        <input 
          v-model="address" 
          type="text" 
          placeholder="Enter wallet address (0x...)" 
          class="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <select 
          v-model="selectedDao"
          class="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none"
        >
          <option v-for="dao in supportedDaos" :key="dao.id" :value="dao.id">
            {{ dao.name }} ({{ dao.token }})
          </option>
        </select>
      </div>
    </div>

    <!-- View Tabs -->
    <div class="view-tabs flex gap-2 mb-6">
      <button 
        @click="switchView('power')"
        :class="['px-4 py-2 rounded-lg transition-colors', activeView === 'power' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700']"
      >
        📊 Voting Power
      </button>
      <button 
        @click="switchView('delegates')"
        :class="['px-4 py-2 rounded-lg transition-colors', activeView === 'delegates' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700']"
      >
        👥 Delegates
      </button>
      <button 
        @click="switchView('proposals')"
        :class="['px-4 py-2 rounded-lg transition-colors', activeView === 'proposals' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700']"
      >
        📝 Proposals
      </button>
      <button 
        @click="switchView('analytics')"
        :class="['px-4 py-2 rounded-lg transition-colors', activeView === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700']"
      >
        📈 Analytics
      </button>
      <button 
        @click="switchView('history')"
        :class="['px-4 py-2 rounded-lg transition-colors', activeView === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700']"
      >
        📜 History
      </button>
      <button 
        @click="switchView('compare')"
        :class="['px-4 py-2 rounded-lg transition-colors', activeView === 'compare' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700']"
      >
        ⚖️ Compare
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state text-center py-12">
      <div class="text-4xl mb-4">⏳</div>
      <p class="text-gray-400">Loading governance data...</p>
    </div>

    <!-- Voting Power View -->
    <div v-else-if="activeView === 'power'" class="power-view">
      <div v-if="votingPower" class="power-content">
        <!-- Summary Stats -->
        <div class="stats-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Total Voting Power</div>
            <div class="text-2xl font-bold text-blue-400">{{ formatNumber(votingPower.totalVotingPower) }}</div>
          </div>
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Active DAOs</div>
            <div class="text-2xl font-bold text-green-400">{{ votingPower.daos.length }}</div>
          </div>
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Address</div>
            <div class="text-sm font-mono text-gray-300">{{ formatAddress(votingPower.address) }}</div>
          </div>
        </div>

        <!-- DAO Breakdown -->
        <div class="dao-breakdown">
          <h3 class="text-xl font-semibold mb-4">DAO Breakdown</h3>
          <div class="dao-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="dao in votingPower.daos" 
              :key="dao.dao"
              class="dao-card bg-gray-800 rounded-xl p-4 border-l-4"
              :style="{ borderLeftColor: getDaoColor(dao.dao) }"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <div class="font-semibold text-lg">{{ dao.daoName }}</div>
                  <div class="text-sm text-gray-400">{{ dao.token }} • {{ dao.chain }}</div>
                </div>
                <div class="text-right">
                  <div class="text-xl font-bold">{{ formatNumber(dao.votingPower?.normalized || 0) }}</div>
                  <div class="text-xs text-gray-500">votes</div>
                </div>
              </div>
              <div class="power-breakdown mt-2 text-sm">
                <div class="flex justify-between text-gray-400">
                  <span>Self-delegated:</span>
                  <span>{{ formatNumber(dao.votingPower?.selfDelegated || 0) }}</span>
                </div>
                <div class="flex justify-between text-gray-400">
                  <span>Delegated:</span>
                  <span>{{ formatNumber(dao.votingPower?.delegated || 0) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Data Message -->
        <div v-if="votingPower.daos.length === 0" class="no-data text-center py-12">
          <div class="text-4xl mb-4">🔍</div>
          <p class="text-gray-400">No governance power found for this address</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state text-center py-12">
        <div class="text-4xl mb-4">🗳️</div>
        <p class="text-gray-400">Enter a wallet address to view governance power</p>
      </div>
    </div>

    <!-- Delegates View -->
    <div v-else-if="activeView === 'delegates'" class="delegates-view">
      <div v-if="delegates" class="delegates-content">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold">{{ delegates.daoName }} Delegates</h3>
          <div class="text-gray-400">Total: {{ delegates.totalDelegates }}</div>
        </div>
        
        <div class="delegates-list bg-gray-800 rounded-xl overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-gray-300">Rank</th>
                <th class="px-4 py-3 text-left text-gray-300">Address</th>
                <th class="px-4 py-3 text-right text-gray-300">Votes</th>
                <th class="px-4 py-3 text-right text-gray-300">Proposals</th>
                <th class="px-4 py-3 text-right text-gray-300">Voters</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(delegate, index) in delegates.delegates" 
                :key="delegate.address"
                class="border-t border-gray-700 hover:bg-gray-750"
              >
                <td class="px-4 py-3">
                  <span 
                    v-if="index < 3" 
                    class="px-2 py-1 rounded text-xs font-bold"
                    :class="index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-400 text-black' : 'bg-orange-600 text-white'"
                  >
                    #{{ index + 1 }}
                  </span>
                  <span v-else class="text-gray-500">{{ index + 1 }}</span>
                </td>
                <td class="px-4 py-3 font-mono text-sm">{{ formatAddress(delegate.address) }}</td>
                <td class="px-4 py-3 text-right font-semibold">{{ formatNumber(delegate.votes) }}</td>
                <td class="px-4 py-3 text-right">{{ delegate.proposals }}</td>
                <td class="px-4 py-3 text-right">{{ delegate.voters }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Proposals View -->
    <div v-else-if="activeView === 'proposals'" class="proposals-view">
      <div v-if="proposals" class="proposals-content">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold">{{ proposals.daoName }} Proposals</h3>
          <div class="text-gray-400">Total: {{ proposals.totalProposals }}</div>
        </div>
        
        <div class="proposals-list space-y-4">
          <div 
            v-for="proposal in proposals.proposals" 
            :key="proposal.id"
            class="proposal-card bg-gray-800 rounded-xl p-4"
          >
            <div class="flex justify-between items-start mb-2">
              <div class="flex-1">
                <div class="font-semibold mb-1">{{ proposal.title }}</div>
                <div class="text-sm text-gray-500">ID: {{ proposal.id }}</div>
              </div>
              <span 
                class="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                :class="{
                  'bg-yellow-500/20 text-yellow-500': proposal.status === 'active',
                  'bg-green-500/20 text-green-500': proposal.status === 'passed',
                  'bg-red-500/20 text-red-500': proposal.status === 'failed',
                  'bg-blue-500/20 text-blue-500': proposal.status === 'executed'
                }"
              >
                {{ proposal.status }}
              </span>
            </div>
            
            <!-- Vote Bar -->
            <div class="vote-bar mt-3">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-green-400">For: {{ formatNumber(proposal.forVotes) }}</span>
                <span class="text-red-400">Against: {{ formatNumber(proposal.againstVotes) }}</span>
              </div>
              <div class="h-2 bg-gray-700 rounded-full overflow-hidden flex">
                <div 
                  class="bg-green-500"
                  :style="{ width: getVotePercentage(proposal.forVotes, proposal.againstVotes) + '%' }"
                ></div>
                <div 
                  class="bg-red-500"
                  :style="{ width: (100 - getVotePercentage(proposal.forVotes, proposal.againstVotes)) + '%' }"
                ></div>
              </div>
            </div>
            
            <div class="text-xs text-gray-500 mt-2">
              Blocks: {{ proposal.startBlock.toLocaleString() }} - {{ proposal.endBlock.toLocaleString() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Analytics View -->
    <div v-else-if="activeView === 'analytics'" class="analytics-view">
      <div v-if="analytics" class="analytics-content">
        <div class="stats-grid grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Total DAOs</div>
            <div class="text-2xl font-bold text-blue-400">{{ analytics.summary.totalDaos }}</div>
          </div>
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Total Voting Power</div>
            <div class="text-2xl font-bold text-green-400">{{ formatNumber(analytics.summary.totalVotingPower) }}</div>
          </div>
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Total Proposals</div>
            <div class="text-2xl font-bold text-purple-400">{{ analytics.summary.totalProposals }}</div>
          </div>
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Active Proposals</div>
            <div class="text-2xl font-bold text-yellow-400">{{ analytics.summary.activeProposals }}</div>
          </div>
        </div>

        <!-- Top Holders -->
        <div class="mb-6">
          <h3 class="text-xl font-semibold mb-4">Top DAO Holdings</h3>
          <div class="bg-gray-800 rounded-xl p-4">
            <div 
              v-for="(holder, index) in analytics.topHolders" 
              :key="holder.dao"
              class="flex justify-between items-center py-2 border-b border-gray-700 last:border-0"
            >
              <span class="font-medium">{{ holder.dao }}</span>
              <span class="text-blue-400">{{ formatNumber(holder.power) }} votes</span>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div>
          <h3 class="text-xl font-semibold mb-4">💡 Recommendations</h3>
          <div class="bg-gray-800 rounded-xl p-4">
            <ul class="space-y-2">
              <li v-for="rec in analytics.recommendations" :key="rec" class="flex items-start gap-2">
                <span class="text-blue-400">•</span>
                <span class="text-gray-300">{{ rec }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- History View -->
    <div v-else-if="activeView === 'history'" class="history-view">
      <div class="period-selector flex gap-2 mb-4">
        <button 
          @click="selectedPeriod = 30; loadHistory()"
          :class="['px-3 py-1 rounded', selectedPeriod === 30 ? 'bg-blue-600' : 'bg-gray-800']"
        >
          30D
        </button>
        <button 
          @click="selectedPeriod = 90; loadHistory()"
          :class="['px-3 py-1 rounded', selectedPeriod === 90 ? 'bg-blue-600' : 'bg-gray-800']"
        >
          90D
        </button>
        <button 
          @click="selectedPeriod = 180; loadHistory()"
          :class="['px-3 py-1 rounded', selectedPeriod === 180 ? 'bg-blue-600' : 'bg-gray-800']"
        >
          180D
        </button>
      </div>

      <div v-if="powerHistory" class="history-content">
        <!-- Stats -->
        <div class="stats-grid grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Average</div>
            <div class="text-xl font-bold">{{ formatNumber(powerHistory.stats.average) }}</div>
          </div>
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Max</div>
            <div class="text-xl font-bold text-green-400">{{ formatNumber(powerHistory.stats.max) }}</div>
          </div>
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Min</div>
            <div class="text-xl font-bold text-red-400">{{ formatNumber(powerHistory.stats.min) }}</div>
          </div>
          <div class="stat-card bg-gray-800 rounded-xl p-4">
            <div class="text-gray-400 text-sm">Trend</div>
            <div class="text-xl font-bold" :class="powerHistory.stats.trend === 'increasing' ? 'text-green-400' : 'text-red-400'">
              {{ powerHistory.stats.trend === 'increasing' ? '↗️ Increasing' : '↘️ Decreasing' }}
            </div>
          </div>
        </div>

        <!-- Chart Placeholder -->
        <div class="chart-container bg-gray-800 rounded-xl p-4">
          <h3 class="text-lg font-semibold mb-4">Voting Power Over Time</h3>
          <div class="chart-area h-64 flex items-end justify-between gap-1">
            <div 
              v-for="(point, index) in powerHistory.history.slice(-30)" 
              :key="index"
              class="chart-bar flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-400"
              :style="{ 
                height: (point.votingPower / powerHistory.stats.max * 100) + '%',
                minHeight: '4px'
              }"
              :title="`${point.date}: ${formatNumber(point.votingPower)}`"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Compare View -->
    <div v-else-if="activeView === 'compare'" class="compare-view">
      <div class="compare-inputs flex gap-4 mb-6">
        <input 
          v-model="compareAddress" 
          type="text" 
          placeholder="Enter second wallet address" 
          class="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button 
          @click="loadCompare"
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
        >
          Compare
        </button>
      </div>

      <div v-if="compareResult" class="compare-content">
        <!-- Summary -->
        <div class="compare-summary grid grid-cols-3 gap-4 mb-6">
          <div class="text-center">
            <div class="text-gray-400 text-sm">Address 1</div>
            <div class="font-mono text-sm">{{ formatAddress(compareResult.address1) }}</div>
            <div class="text-2xl font-bold text-blue-400">{{ formatNumber(compareResult.summary.totalPower1) }}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-sm">Winner</div>
            <div class="text-4xl">🏆</div>
            <div class="font-semibold">{{ formatAddress(compareResult.summary.winner) }}</div>
          </div>
          <div class="text-center">
            <div class="text-gray-400 text-sm">Address 2</div>
            <div class="font-mono text-sm">{{ formatAddress(compareResult.address2) }}</div>
            <div class="text-2xl font-bold text-green-400">{{ formatNumber(compareResult.summary.totalPower2) }}</div>
          </div>
        </div>

        <!-- DAO Comparison -->
        <div class="dao-comparison">
          <h3 class="text-xl font-semibold mb-4">DAO-by-DAO Comparison</h3>
          <div class="comparison-list space-y-3">
            <div 
              v-for="item in compareResult.comparison" 
              :key="item.dao"
              class="comparison-item bg-gray-800 rounded-xl p-4"
            >
              <div class="flex justify-between items-center">
                <span class="font-semibold">{{ item.daoName }}</span>
                <span 
                  class="px-2 py-1 rounded text-xs font-bold"
                  :class="item.winner === compareResult.address1 ? 'bg-blue-500' : 'bg-green-500'"
                >
                  Winner: {{ formatAddress(item.winner) }}
                </span>
              </div>
              <div class="flex justify-between mt-2 text-sm">
                <span class="text-blue-400">{{ formatAddress(compareResult.address1) }}: {{ formatNumber(item.address1Power) }}</span>
                <span class="text-green-400">{{ formatAddress(compareResult.address2) }}: {{ formatNumber(item.address2Power) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.governance-power-tracker {
  padding: 1rem;
}

.header-section {
  margin-bottom: 1.5rem;
}

.view-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stats-grid {
  display: grid;
  gap: 1rem;
}

.dao-grid {
  display: grid;
  gap: 1rem;
}

.power-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.delegates-list table {
  width: 100%;
  border-collapse: collapse;
}

.delegates-list th,
.delegates-list td {
  padding: 0.75rem 1rem;
}

.delegates-list tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.vote-bar {
  margin-top: 0.75rem;
}

.vote-bar .flex {
  display: flex;
}

.chart-area {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16rem;
}

.chart-bar {
  flex: 1;
  border-radius: 2px 2px 0 0;
  transition: all 0.2s;
}

.chart-bar:hover {
  opacity: 0.8;
}

.hover\:bg-gray-750:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

@media (min-width: 768px) {
  .grid-cols-1.md\:grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .grid-cols-1.md\:grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .grid-cols-1.md\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
