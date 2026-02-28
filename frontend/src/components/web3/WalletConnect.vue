<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWeb3 } from '@/composables/web3/useWeb3'

const {
  isConnected,
  account,
  chainId,
  balance,
  isConnecting,
  chainInfo,
  connectWallet,
  disconnectWallet,
  switchChain,
  formatAddress,
  CHAIN_INFO,
  updateBalance,
} = useWeb3()

const activeTab = ref('dashboard')
const error = ref('')
const isLoading = ref(false)

// Stats
const stats = computed(() => ({
  totalBalance: balance.value || '0',
  walletAddress: account.value || '',
  network: chainInfo.value?.name || 'Unknown',
}))

// Quick actions
const quickActions = [
  { id: 'send', label: 'Send', icon: '↑', color: 'blue' },
  { id: 'receive', label: 'Receive', icon: '↓', color: 'green' },
  { id: 'swap', label: 'Swap', icon: '⇄', color: 'purple' },
  { id: 'bridge', label: 'Bridge', icon: '🌉', color: 'orange' },
]

// Recent activity (mock data for demo)
const recentActivity = ref([
  { type: 'receive', amount: '0.5 ETH', from: '0x1234...5678', time: '2 hours ago', status: 'confirmed' },
  { type: 'send', amount: '0.1 ETH', to: '0xabcd...efgh', time: '1 day ago', status: 'confirmed' },
  { type: 'swap', amount: '100 USDC → 0.03 ETH', time: '3 days ago', status: 'confirmed' },
])

const handleConnect = async () => {
  error.value = ''
  isLoading.value = true
  try {
    await connectWallet()
  } catch (e: any) {
    error.value = e.message || 'Failed to connect'
  } finally {
    isLoading.value = false
  }
}

const handleDisconnect = async () => {
  await disconnectWallet()
}

const handleSwitchNetwork = async (chainId: number) => {
  error.value = ''
  try {
    await switchChain(chainId)
  } catch (e: any) {
    error.value = e.message
  }
}

const copyAddress = () => {
  if (account.value) {
    navigator.clipboard.writeText(account.value)
  }
}

onMounted(() => {
  if (window.ethereum?.selectedAddress) {
    connectWallet()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Web3 Dashboard
        </h1>
        <p class="text-slate-400 text-sm mt-1">Manage your crypto assets</p>
      </div>
      
      <!-- Network Selector -->
      <div class="flex items-center gap-3">
        <select 
          :value="chainId" 
          @change="handleSwitchNetwork(Number(($event.target as HTMLSelectElement).value))"
          class="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option v-for="chain in Object.entries(CHAIN_INFO)" :key="chain[0]" :value="chain[0]">
            {{ chain[1].name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex justify-between items-center">
      <span class="text-red-300">{{ error }}</span>
      <button @click="error = ''" class="text-red-400 hover:text-white">✕</button>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column - Wallet Info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Wallet Card -->
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Wallet</h2>
            <span v-if="isConnected" class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-2">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Connected
            </span>
          </div>
          
          <div v-if="isConnected" class="space-y-4">
            <!-- Address -->
            <div class="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
              <div>
                <p class="text-slate-400 text-sm">Address</p>
                <p class="font-mono text-lg">{{ formatAddress(account!) }}</p>
              </div>
              <button @click="copyAddress" class="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Copy">
                📋
              </button>
            </div>
            
            <!-- Balance -->
            <div class="p-4 bg-slate-900/50 rounded-xl">
              <p class="text-slate-400 text-sm mb-1">Balance</p>
              <p class="text-3xl font-bold text-green-400">
                {{ parseFloat(stats.totalBalance).toFixed(4) }}
                <span class="text-lg text-slate-400">{{ chainInfo?.symbol || 'ETH' }}</span>
              </p>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-4 gap-3">
              <button 
                v-for="action in quickActions" 
                :key="action.id"
                class="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all hover:scale-105 flex flex-col items-center gap-2"
              >
                <span class="text-2xl">{{ action.icon }}</span>
                <span class="text-sm">{{ action.label }}</span>
              </button>
            </div>

            <!-- Disconnect -->
            <button 
              @click="handleDisconnect"
              class="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
            >
              Disconnect Wallet
            </button>
          </div>

          <!-- Connect Button -->
          <div v-else class="text-center py-8">
            <div class="text-6xl mb-4">🔗</div>
            <p class="text-slate-400 mb-6">Connect your wallet to get started</p>
            <button 
              @click="handleConnect"
              :disabled="isLoading"
              class="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50"
            >
              {{ isLoading ? 'Connecting...' : 'Connect Wallet' }}
            </button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
          <div class="space-y-3">
            <div 
              v-for="(activity, index) in recentActivity" 
              :key="index"
              class="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl"
            >
              <div class="flex items-center gap-3">
                <span 
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  :class="activity.type === 'receive' ? 'bg-green-500/20 text-green-400' : activity.type === 'send' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'"
                >
                  {{ activity.type === 'receive' ? '↓' : activity.type === 'send' ? '↑' : '⇄' }}
                </span>
                <div>
                  <p class="font-medium">{{ activity.amount }}</p>
                  <p class="text-slate-400 text-sm">{{ activity.time }}</p>
                </div>
              </div>
              <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                {{ activity.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Stats & Info -->
      <div class="space-y-6">
        <!-- Network Info -->
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-xl font-semibold mb-4">Network</h2>
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-400">Chain</span>
              <span class="font-medium">{{ chainInfo?.name || 'Not Connected' }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-400">Chain ID</span>
              <span class="font-mono">{{ chainId || '-' }}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-400">Explorer</span>
              <span class="font-mono">{{ chainInfo?.explorer || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Gas Tracker -->
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-xl font-semibold mb-4">Gas Tracker</h2>
          <div class="space-y-3">
            <div class="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-400">Slow</span>
              <span class="text-green-400">5 Gwei</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-400">Normal</span>
              <span class="text-yellow-400">15 Gwei</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
              <span class="text-slate-400">Fast</span>
              <span class="text-red-400">30 Gwei</span>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h2 class="text-xl font-semibold mb-4">Explore</h2>
          <div class="space-y-2">
            <a href="#" class="block p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-colors">
              📈 Uniswap
            </a>
            <a href="#" class="block p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-colors">
              🎨 OpenSea
            </a>
            <a href="#" class="block p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-colors">
              🌉 Arbitrum Bridge
            </a>
            <a href="#" class="block p-3 bg-slate-900/50 hover:bg-slate-700 rounded-lg transition-colors">
              📄 Etherscan
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, var(--tw-gradient-stops));
}
.from-slate-900 { --tw-gradient-from: #0f172a; }
.via-purple-900 { --tw-gradient-via: #581c87; }
.to-slate-900 { --tw-gradient-to: #0f172a; }
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}
</style>
