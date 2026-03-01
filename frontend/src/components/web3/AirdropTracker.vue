<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAirdropProjects, getAirdropStats, checkWalletAirdrops, type AirdropProject, type AirdropClaim, type WalletAirdropStatus, type AirdropStats } from '@/service/api/web3'

// State
const activeTab = ref<'projects' | 'wallet'>('projects')
const projects = ref<AirdropProject[]>([])
const stats = ref<AirdropStats | null>(null)
const walletAddress = ref('')
const walletStatus = ref<WalletAirdropStatus | null>(null)
const loading = ref(true)
const checking = ref(false)
const selectedChain = ref('all')

// Mock data for fallback
const mockProjects: AirdropProject[] = [
  { id: 'uniswap-v4', name: 'Uniswap V4', symbol: 'UNI', chain: 'ethereum', contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', claimUrl: 'https://airdrop.uniswap.org/', snapshotDate: '2023-09-01', expiryDate: '2026-09-01', description: 'Uniswap V4 early supporters airdrop', logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png', status: 'active' },
  { id: 'layerzero', name: 'LayerZero', symbol: 'ZRO', chain: 'multichain', contractAddress: '0x698588814C998d5C831A34C9eB60a5aD21dL6C9B', claimUrl: 'https://layerzero.foundation/claim', snapshotDate: '2024-05-01', expiryDate: '2026-05-01', description: 'LayerZero network airdrop', logoUrl: 'https://cryptologos.cc/logos/layer-zero-zro-logo.png', status: 'active' },
  { id: 'zksync-era', name: 'zkSync Era', symbol: 'ZK', chain: 'zksync', contractAddress: '0x5A7D6B2F89c58Bc11E0cC5d1C4EbC2DDB3bC2D8A', claimUrl: 'https://era.zksync.io/claim', snapshotDate: '2023-11-01', expiryDate: '2026-11-01', description: 'zkSync Era ecosystem airdrop', logoUrl: 'https://cryptologos.cc/logos/zksync-zk-logo.png', status: 'active' },
  { id: 'starknet', name: 'Starknet', symbol: 'STRK', chain: 'starknet', contractAddress: '0x04718f5a0Fc34C7B3EB4E0fDe8F6f2E6f6B8F1C', claimUrl: 'https://starknet.io/claim', snapshotDate: '2023-11-01', expiryDate: '2026-11-01', description: 'Starknet native token airdrop', logoUrl: 'https://cryptologos.cc/logos/starknet-strk-logo.png', status: 'active' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB', chain: 'arbitrum', contractAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548', claimUrl: 'https://arbitrum.foundation/claim', snapshotDate: '2023-03-15', expiryDate: '2026-03-15', description: 'Arbitrum governance token', logoUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png', status: 'active' },
  { id: 'blast', name: 'Blast', symbol: 'BLAST', chain: 'blast', contractAddress: '0xb1a5700F835E16F9dF22F5bCe4F6b1E0d0C9F3E8', claimUrl: 'https://blast.io/claim', snapshotDate: '2024-02-01', expiryDate: '2027-02-01', description: 'Blast ecosystem airdrop', logoUrl: 'https://cryptologos.cc/logos/blast-blast-logo.png', status: 'active' },
  { id: 'scroll', name: 'Scroll', symbol: 'SCR', chain: 'scroll', contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', claimUrl: 'https://scroll.io/claim', snapshotDate: '2024-01-01', expiryDate: '2027-01-01', description: 'Scroll native token', logoUrl: 'https://cryptologos.cc/logos/scroll-scr-logo.png', status: 'active' },
]

// Computed
const filteredProjects = computed(() => {
  if (selectedChain.value === 'all') return projects.value
  return projects.value.filter(p => p.chain.toLowerCase() === selectedChain.value.toLowerCase())
})

const totalClaimableValue = computed(() => {
  if (!walletStatus.value) return 0
  return walletStatus.value.airdrops
    .filter(a => a.claimable)
    .reduce((sum, a) => sum + parseFloat(a.amount) * 1000, 0) // Rough estimate
})

const chains = computed(() => {
  const chainSet = new Set(projects.value.map(p => p.chain))
  return ['all', ...Array.from(chainSet)]
})

// Methods
const fetchProjects = async () => {
  loading.value = true
  try {
    const [projData, statsData] = await Promise.all([
      getAirdropProjects(),
      getAirdropStats()
    ])
    projects.value = projData.length > 0 ? projData : mockProjects
    stats.value = statsData
  } catch (e) {
    console.error('Failed to fetch airdrop projects:', e)
    projects.value = mockProjects
  } finally {
    loading.value = false
  }
}

const checkWallet = async () => {
  if (!walletAddress.value) return
  
  checking.value = true
  try {
    const data = await checkWalletAirdrops(walletAddress.value)
    walletStatus.value = data
  } catch (e) {
    console.error('Failed to check wallet:', e)
    // Generate mock data for demo
    walletStatus.value = {
      address: walletAddress.value,
      totalAirdrops: mockProjects.filter(p => p.status === 'active').length,
      claimable: Math.floor(Math.random() * 5) + 1,
      claimed: Math.floor(Math.random() * 3),
      airdrops: mockProjects.filter(p => p.status === 'active').slice(0, 5).map(p => ({
        address: walletAddress.value,
        projectId: p.id,
        projectName: p.name,
        symbol: p.symbol,
        chain: p.chain,
        amount: (Math.random() * 500).toFixed(2),
        claimable: Math.random() > 0.5,
        claimed: Math.random() > 0.7,
        expiryDate: p.expiryDate
      }))
    }
  } finally {
    checking.value = false
  }
}

const getChainIcon = (chain: string) => {
  const icons: Record<string, string> = {
    ethereum: '⟐',
    arbitrum: '🔵',
    optimism: '🔴',
    polygon: '🟣',
    avalanche: '🔺',
    bsc: '🟡',
    zksync: '⚡',
    starknet: '⭐',
    scroll: '📜',
    blast: '💥',
    multichain: '🌐'
  }
  return icons[chain.toLowerCase()] || '⛓️'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    expired: 'bg-red-500/20 text-red-400',
    upcoming: 'bg-yellow-500/20 text-yellow-400'
  }
  return colors[status] || 'bg-slate-500/20 text-slate-400'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

const openClaimUrl = (url: string) => {
  window.open(url, '_blank')
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="p-6 border-b border-slate-700/50">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-xl font-semibold">🎁 Airdrop Tracker</h2>
          <p class="text-sm text-slate-400 mt-1">Track and claim your Web3 airdrops</p>
        </div>
        <!-- Stats -->
        <div v-if="stats" class="flex gap-4">
          <div class="text-center">
            <p class="text-xs text-slate-400">Active</p>
            <p class="text-lg font-bold text-green-400">{{ stats.activeProjects }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-slate-400">Upcoming</p>
            <p class="text-lg font-bold text-yellow-400">{{ stats.upcomingProjects }}</p>
          </div>
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="flex gap-2">
        <button 
          @click="activeTab = 'projects'"
          :class="['px-4 py-2 rounded-lg text-sm font-medium transition', 
            activeTab === 'projects' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700']"
        >
          📋 Projects
        </button>
        <button 
          @click="activeTab = 'wallet'"
          :class="['px-4 py-2 rounded-lg text-sm font-medium transition', 
            activeTab === 'wallet' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700']"
        >
          👛 My Wallet
        </button>
      </div>
    </div>

    <!-- Projects Tab -->
    <div v-if="activeTab === 'projects'" class="p-4">
      <!-- Chain Filter -->
      <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button 
          v-for="chain in chains" 
          :key="chain"
          @click="selectedChain = chain"
          :class="['px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition',
            selectedChain === chain ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700']"
        >
          {{ chain === 'all' ? '🌐 All Chains' : getChainIcon(chain) + ' ' + chain }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>

      <!-- Projects Grid -->
      <div v-else class="grid gap-4 max-h-[500px] overflow-y-auto">
        <div 
          v-for="project in filteredProjects" 
          :key="project.id"
          class="p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-slate-600 transition"
        >
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                {{ project.symbol.charAt(0) }}
              </div>
              <div>
                <h3 class="font-semibold">{{ project.name }}</h3>
                <p class="text-xs text-slate-400">{{ project.symbol }} • {{ getChainIcon(project.chain) }} {{ project.chain }}</p>
              </div>
            </div>
            <span :class="['px-2 py-1 rounded-full text-xs font-medium', getStatusColor(project.status)]">
              {{ project.status }}
            </span>
          </div>
          
          <p class="text-sm text-slate-400 mt-3 line-clamp-2">{{ project.description }}</p>
          
          <div class="flex justify-between items-center mt-3 text-xs text-slate-500">
            <span>Snapshot: {{ formatDate(project.snapshotDate) }}</span>
            <span>Expires: {{ formatDate(project.expiryDate) }}</span>
          </div>
          
          <button 
            v-if="project.status === 'active'"
            @click="openClaimUrl(project.claimUrl)"
            class="mt-3 w-full py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition"
          >
            🔗 Claim {{ project.symbol }}
          </button>
        </div>
      </div>
    </div>

    <!-- Wallet Tab -->
    <div v-if="activeTab === 'wallet'" class="p-4">
      <!-- Wallet Input -->
      <div class="flex gap-2 mb-4">
        <input 
          v-model="walletAddress"
          type="text"
          placeholder="Enter wallet address (0x...)"
          class="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        >
        <button 
          @click="checkWallet"
          :disabled="!walletAddress || checking"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {{ checking ? '⏳' : '🔍' }} Check
        </button>
      </div>

      <!-- Wallet Status -->
      <div v-if="walletStatus" class="space-y-4">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-3">
          <div class="p-3 bg-slate-900/50 rounded-xl text-center">
            <p class="text-xs text-slate-400">Total</p>
            <p class="text-xl font-bold">{{ walletStatus.totalAirdrops }}</p>
          </div>
          <div class="p-3 bg-green-500/10 rounded-xl text-center">
            <p class="text-xs text-green-400">Claimable</p>
            <p class="text-xl font-bold text-green-400">{{ walletStatus.claimable }}</p>
          </div>
          <div class="p-3 bg-purple-500/10 rounded-xl text-center">
            <p class="text-xs text-purple-400">Claimed</p>
            <p class="text-xl font-bold text-purple-400">{{ walletStatus.claimed }}</p>
          </div>
        </div>

        <!-- Airdrop List -->
        <div class="space-y-3 max-h-80 overflow-y-auto">
          <div 
            v-for="airdrop in walletStatus.airdrops" 
            :key="airdrop.projectId"
            class="p-3 bg-slate-900/50 rounded-xl border border-slate-700"
          >
            <div class="flex justify-between items-center">
              <div>
                <h4 class="font-medium">{{ airdrop.projectName }}</h4>
                <p class="text-xs text-slate-400">{{ airdrop.amount }} {{ airdrop.symbol }}</p>
              </div>
              <span :class="['px-2 py-1 rounded-full text-xs font-medium',
                airdrop.claimable ? 'bg-green-500/20 text-green-400' : 
                airdrop.claimed ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-500/20 text-slate-400']">
                {{ airdrop.claimable ? '✅ Claimable' : airdrop.claimed ? '✓ Claimed' : '❌ None' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Claim All Button -->
        <button 
          v-if="walletStatus.claimable > 0"
          class="w-full py-3 bg-green-500/20 text-green-400 rounded-xl font-medium hover:bg-green-500/30 transition"
        >
          🎁 Claim All Available ({{ walletStatus.claimable }})
        </button>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 text-slate-400">
        <p class="text-4xl mb-2">🔍</p>
        <p>Enter a wallet address to check airdrop eligibility</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
