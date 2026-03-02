<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Types
interface MonitoredWallet {
  id: string
  address: string
  chainId: number
  chainName: string
  label: string
  createdAt: number
  lastActivityAt: number | null
  isActive: boolean
}

interface WalletActivity {
  id: string
  address: string
  chainId: number
  chainName: string
  hash: string
  timestamp: number
  type: 'incoming' | 'outgoing' | 'swap' | 'nft' | 'defi' | 'unknown'
  status: 'pending' | 'confirmed' | 'failed'
  value: string
  valueUsd: number
  token: string
  from: string
  to: string
  gasUsed: number
  gasFee: string
}

// Chain info
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
  { id: 56, name: 'BSC', symbol: 'BNB' },
  { id: 8453, name: 'Base', symbol: 'ETH' },
]

// Activity type icons
const typeIcons: Record<string, string> = {
  incoming: '📥',
  outgoing: '📤',
  swap: '🔄',
  nft: '🖼️',
  defi: '🧪',
  unknown: '❓',
}

// State
const monitoredWallets = ref<MonitoredWallet[]>([])
const activities = ref<WalletActivity[]>([])
const selectedWallet = ref<string | null>(null)
const showAddModal = ref(false)
const isLoading = ref(false)
const autoRefresh = ref(true)
const newWallet = ref({ address: '', chainId: 1, label: '' })
const filterType = ref('all')
const refreshInterval = ref<number | null>(null)

// Stats
const stats = computed(() => ({
  totalMonitored: monitoredWallets.value.length,
  activeMonitors: monitoredWallets.value.filter(w => w.isActive).length,
  todayActivities: activities.value.filter(a => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return a.timestamp >= today.getTime()
  }).length,
}))

// Filtered activities
const filteredActivities = computed(() => {
  let result = activities.value
  if (selectedWallet.value) {
    result = result.filter(a => a.address === selectedWallet.value)
  }
  if (filterType.value !== 'all') {
    result = result.filter(a => a.type === filterType.value)
  }
  return result.slice(0, 50)
})

// Generate mock data
const generateMockData = () => {
  // Sample addresses
  const sampleAddresses = [
    '0x742d35Cc6634C0532925a3b844Bc9e7595f',
    '0x1234567890abcdef1234567890abcdef12345678',
    '0xdeadbeef12345678deadbeef12345678deadbeef',
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  ]
  
  const labels = ['Main Wallet', 'Hot Wallet', 'Cold Storage', 'Treasury', 'Team']
  
  // Create monitored wallets
  monitoredWallets.value = sampleAddresses.slice(0, 3).map((addr, i) => ({
    id: `wallet_${i + 1}`,
    address: addr,
    chainId: chains[i % chains.length].id,
    chainName: chains[i % chains.length].name,
    label: labels[i],
    createdAt: Date.now() - (i + 1) * 86400000,
    lastActivityAt: Date.now() - Math.random() * 86400000,
    isActive: true,
  }))
  
  // Generate activities
  const activityTypes: WalletActivity['type'][] = ['incoming', 'outgoing', 'swap', 'defi', 'nft']
  const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'UNI', 'LINK', 'AAVE']
  const statuses: WalletActivity['status'][] = ['confirmed', 'confirmed', 'confirmed', 'pending']
  
  activities.value = []
  
  for (let i = 0; i < 30; i++) {
    const wallet = monitoredWallets.value[Math.floor(Math.random() * monitoredWallets.value.length)]
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)]
    const token = tokens[Math.floor(Math.random() * tokens.length)]
    const isIncoming = Math.random() > 0.5
    const value = (Math.random() * 5 + 0.01).toFixed(4)
    const valueUsd = parseFloat(value) * (token === 'ETH' ? 2500 : token === 'WBTC' ? 62000 : 1)
    
    activities.value.push({
      id: `activity_${i}`,
      address: wallet.address,
      chainId: wallet.chainId,
      chainName: wallet.chainName,
      hash: `0x${Math.random().toString(16).slice(2, 66)}`,
      timestamp: Date.now() - i * 3600000 - Math.floor(Math.random() * 3600000),
      type,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      value,
      valueUsd,
      token,
      from: isIncoming ? `0x${Math.random().toString(16).slice(2, 42)}` : wallet.address,
      to: isIncoming ? wallet.address : `0x${Math.random().toString(16).slice(2, 42)}`,
      gasUsed: 21000 + Math.floor(Math.random() * 150000),
      gasFee: (0.001 + Math.random() * 0.02).toFixed(6),
    })
  }
  
  activities.value.sort((a, b) => b.timestamp - a.timestamp)
}

// Add wallet
const addWallet = () => {
  if (!newWallet.value.address) return
  
  const chain = chains.find(c => c.id === newWallet.value.chainId)
  const wallet: MonitoredWallet = {
    id: `wallet_${Date.now()}`,
    address: newWallet.value.address.toLowerCase(),
    chainId: newWallet.value.chainId,
    chainName: chain?.name || 'Unknown',
    label: newWallet.value.label || `Wallet ${monitoredWallets.value.length + 1}`,
    createdAt: Date.now(),
    lastActivityAt: null,
    isActive: true,
  }
  
  monitoredWallets.value.push(wallet)
  
  // Generate mock activity for new wallet
  const activityTypes: WalletActivity['type'][] = ['incoming', 'outgoing', 'swap', 'defi', 'nft']
  const tokens = ['ETH', 'USDC', 'USDT', 'WBTC']
  
  for (let i = 0; i < 5; i++) {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)]
    const token = tokens[Math.floor(Math.random() * tokens.length)]
    const isIncoming = Math.random() > 0.5
    const value = (Math.random() * 2).toFixed(4)
    
    activities.value.unshift({
      id: `activity_new_${Date.now()}_${i}`,
      address: wallet.address,
      chainId: wallet.chainId,
      chainName: wallet.chainName,
      hash: `0x${Math.random().toString(16).slice(2, 66)}`,
      timestamp: Date.now() - i * 60000,
      type,
      status: 'confirmed',
      value,
      valueUsd: parseFloat(value) * (token === 'ETH' ? 2500 : 1),
      token,
      from: isIncoming ? `0x${Math.random().toString(16).slice(2, 42)}` : wallet.address,
      to: isIncoming ? wallet.address : `0x${Math.random().toString(16).slice(2, 42)}`,
      gasUsed: 21000 + Math.floor(Math.random() * 50000),
      gasFee: (0.001 + Math.random() * 0.01).toFixed(6),
    })
  }
  
  showAddModal.value = false
  newWallet.value = { address: '', chainId: 1, label: '' }
}

// Remove wallet
const removeWallet = (id: string) => {
  const wallet = monitoredWallets.value.find(w => w.id === id)
  if (wallet) {
    wallet.isActive = false
  }
}

// Format time
const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}

// Format address
const formatAddress = (addr: string) => {
  return `${addr.slice(0, 10)}...${addr.slice(-8)}`
}

// Toggle auto refresh
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
}

// Simulate new activity
const simulateNewActivity = () => {
  if (monitoredWallets.value.length === 0) return
  
  const wallet = monitoredWallets.value[Math.floor(Math.random() * monitoredWallets.value.length)]
  const activityTypes: WalletActivity['type'][] = ['incoming', 'outgoing', 'swap', 'defi', 'nft']
  const tokens = ['ETH', 'USDC', 'USDT']
  const type = activityTypes[Math.floor(Math.random() * activityTypes.length)]
  const token = tokens[Math.floor(Math.random() * tokens.length)]
  const isIncoming = Math.random() > 0.5
  const value = (Math.random() * 1).toFixed(4)
  
  activities.value.unshift({
    id: `activity_sim_${Date.now()}`,
    address: wallet.address,
    chainId: wallet.chainId,
    chainName: wallet.chainName,
    hash: `0x${Math.random().toString(16).slice(2, 66)}`,
    timestamp: Date.now(),
    type,
    status: 'pending',
    value,
    valueUsd: parseFloat(value) * (token === 'ETH' ? 2500 : 1),
    token,
    from: isIncoming ? `0x${Math.random().toString(16).slice(2, 42)}` : wallet.address,
    to: isIncoming ? wallet.address : `0x${Math.random().toString(16).slice(2, 42)}`,
    gasUsed: 0,
    gasFee: '0',
  })
  
  // Update wallet last activity
  wallet.lastActivityAt = Date.now()
}

// Lifecycle
onMounted(() => {
  generateMockData()
  
  // Auto refresh simulation
  if (autoRefresh.value) {
    refreshInterval.value = window.setInterval(() => {
      if (Math.random() > 0.7) {
        simulateNewActivity()
      }
    }, 10000)
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold">👀 Wallet Activity Monitor</h2>
        <p class="text-slate-400 mt-1">Track wallet activities in real-time</p>
      </div>
      <div class="flex gap-2">
        <button
          @click="toggleAutoRefresh"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'"
        >
          {{ autoRefresh ? '🔄 Auto' : '⏸️ Paused' }}
        </button>
        <button
          @click="simulateNewActivity"
          class="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium"
        >
          + Simulate
        </button>
        <button
          @click="showAddModal = true"
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium"
        >
          + Add Wallet
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <p class="text-sm text-slate-400">Monitored Wallets</p>
        <p class="text-2xl font-bold text-white">{{ stats.totalMonitored }}</p>
      </div>
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <p class="text-sm text-slate-400">Active Monitors</p>
        <p class="text-2xl font-bold text-green-400">{{ stats.activeMonitors }}</p>
      </div>
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <p class="text-sm text-slate-400">Today's Activities</p>
        <p class="text-2xl font-bold text-blue-400">{{ stats.todayActivities }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Wallet List -->
      <div class="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div class="p-4 border-b border-slate-700/50">
          <h3 class="font-semibold">Monitored Wallets</h3>
        </div>
        <div class="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
          <div
            v-for="wallet in monitoredWallets"
            :key="wallet.id"
            class="p-4 hover:bg-slate-700/30 cursor-pointer transition-colors"
            :class="{ 'bg-purple-500/10': selectedWallet === wallet.address }"
            @click="selectedWallet = selectedWallet === wallet.address ? null : wallet.address"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-medium">{{ wallet.label }}</p>
                <p class="text-xs text-slate-400 font-mono mt-1">{{ formatAddress(wallet.address) }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-xs px-2 py-0.5 bg-slate-700 rounded">{{ wallet.chainName }}</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded"
                    :class="wallet.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'"
                  >
                    {{ wallet.isActive ? 'Active' : 'Paused' }}
                  </span>
                </div>
              </div>
              <button
                @click.stop="removeWallet(wallet.id)"
                class="text-slate-500 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          </div>
          <div v-if="monitoredWallets.length === 0" class="p-8 text-center text-slate-500">
            No wallets monitored
          </div>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div class="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 class="font-semibold">Activity Feed</h3>
          <select
            v-model="filterType"
            class="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="incoming">Incoming</option>
            <option value="outgoing">Outgoing</option>
            <option value="swap">Swap</option>
            <option value="nft">NFT</option>
            <option value="defi">DeFi</option>
          </select>
        </div>
        <div class="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
          <div
            v-for="activity in filteredActivities"
            :key="activity.id"
            class="p-4 hover:bg-slate-700/20 transition-colors"
          >
            <div class="flex items-start gap-3">
              <div class="text-2xl">{{ typeIcons[activity.type] }}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="text-xs px-2 py-0.5 rounded"
                    :class="{
                      'bg-green-500/20 text-green-400': activity.type === 'incoming',
                      'bg-red-500/20 text-red-400': activity.type === 'outgoing',
                      'bg-blue-500/20 text-blue-400': activity.type === 'swap',
                      'bg-purple-500/20 text-purple-400': activity.type === 'nft',
                      'bg-yellow-500/20 text-yellow-400': activity.type === 'defi',
                    }"
                  >
                    {{ activity.type.toUpperCase() }}
                  </span>
                  <span
                    class="text-xs px-2 py-0.5 rounded"
                    :class="{
                      'bg-yellow-500/20 text-yellow-400': activity.status === 'pending',
                      'bg-green-500/20 text-green-400': activity.status === 'confirmed',
                      'bg-red-500/20 text-red-400': activity.status === 'failed',
                    }"
                  >
                    {{ activity.status }}
                  </span>
                  <span class="text-xs text-slate-500">{{ activity.chainName }}</span>
                </div>
                <p class="mt-1">
                  <span class="text-white font-medium">{{ activity.value }} {{ activity.token }}</span>
                  <span class="text-slate-400 text-sm ml-2">≈ ${{ activity.valueUsd.toFixed(2) }}</span>
                </p>
                <div class="flex items-center gap-4 mt-1 text-xs text-slate-500">
                  <span>{{ formatTime(activity.timestamp) }}</span>
                  <span class="font-mono">{{ formatAddress(activity.hash) }}</span>
                  <span v-if="activity.gasFee !== '0'">Gas: {{ activity.gasFee }} ETH</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="filteredActivities.length === 0" class="p-8 text-center text-slate-500">
            No activities found
          </div>
        </div>
      </div>
    </div>

    <!-- Add Wallet Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAddModal = false"
    >
      <div class="bg-slate-800 p-6 rounded-xl w-[450px] border border-slate-700">
        <h3 class="text-lg font-semibold mb-4">Add Wallet to Monitor</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">Wallet Address</label>
            <input
              v-model="newWallet.address"
              placeholder="0x..."
              class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg"
            />
          </div>
          
          <div>
            <label class="block text-sm text-slate-400 mb-1">Network</label>
            <select
              v-model="newWallet.chainId"
              class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg"
            >
              <option v-for="chain in chains" :key="chain.id" :value="chain.id">
                {{ chain.name }} ({{ chain.symbol }})
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm text-slate-400 mb-1">Label (optional)</label>
            <input
              v-model="newWallet.label"
              placeholder="My Wallet"
              class="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="showAddModal = false"
            class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="addWallet"
            class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
          >
            Add Wallet
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
