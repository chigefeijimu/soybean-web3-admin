<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getWhaleTransactions, getWhaleStats, getWhaleProfiles, getWhaleAlerts, type WhaleTransaction, type WhaleStats, type WhaleProfile, type WhaleAlert } from '@/service/api/web3'

const activeTab = ref<'transactions' | 'wallets' | 'alerts' | 'stats'>('transactions')
const transactions = ref<WhaleTransaction[]>([])
const wallets = ref<WhaleProfile[]>([])
const alerts = ref<WhaleAlert[]>([])
const stats = ref<WhaleStats | null>(null)
const loading = ref(true)
const error = ref('')

// Fetch data from API
const fetchData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [txs, profiles, whaleAlerts, whaleStats] = await Promise.all([
      getWhaleTransactions(50),
      getWhaleProfiles(),
      getWhaleAlerts(20),
      getWhaleStats()
    ])
    transactions.value = txs
    wallets.value = profiles
    alerts.value = whaleAlerts
    stats.value = whaleStats
  } catch (e: any) {
    console.error('Failed to fetch whale data:', e)
    error.value = e.message || 'Failed to fetch data'
    // Use mock data as fallback
    transactions.value = generateMockTransactions()
    wallets.value = generateMockWallets()
    alerts.value = generateMockAlerts()
  } finally {
    loading.value = false
  }
}

// Mock data generators for fallback
const generateMockTransactions = (): WhaleTransaction[] => {
  const tokens = ['ETH', 'USDC', 'USDT', 'WBTC', 'LINK', 'UNI', 'AAVE']
  const addresses = [
    { addr: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'Vitalik' },
    { addr: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', label: 'Vitalik (old)' },
    { addr: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', label: 'Gavin Wood' },
    { addr: '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022', label: 'Lido Finance' },
  ]
  const now = Date.now()
  
  return Array.from({ length: 20 }, (_, i) => {
    const from = addresses[Math.floor(Math.random() * addresses.length)]
    const to = addresses[Math.floor(Math.random() * addresses.length)]
    const token = tokens[Math.floor(Math.random() * tokens.length)]
    const value = Math.random() * 1000000 + 10000
    
    return {
      hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      blockNumber: 19000000 - i * 10,
      timestamp: now - i * 3600000 * Math.random() * 12,
      from: from.addr,
      fromLabel: from.label,
      to: to.addr,
      toLabel: to.label,
      value: value / (token === 'ETH' ? 2845 : 1),
      valueUsd: value,
      tokenSymbol: token,
      tokenAddress: '',
      tokenDecimals: 18,
      gasUsed: 21000 + Math.floor(Math.random() * 100000),
      gasPrice: Math.floor(Math.random() * 50 + 20) * 1e9,
      isLargeTransfer: value > 10000,
      isWhaleActivity: true
    }
  })
}

const generateMockWallets = (): WhaleProfile[] => {
  return [
    { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'Vitalik Buterin', type: 'whale', totalReceived: 50000, totalReceivedUsd: 142250000, totalSent: 20000, totalSentUsd: 56900000, transactionCount: 500, firstSeen: 1609459200000, lastActive: Date.now() - 86400000, avgTransactionSize: 25, tokensHeld: 15, riskLevel: 'low' },
    { address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', label: 'Gavin Wood', type: 'whale', totalReceived: 30000, totalReceivedUsd: 85350000, totalSent: 15000, totalSentUsd: 42675000, transactionCount: 300, firstSeen: 1609459200000, lastActive: Date.now() - 172800000, avgTransactionSize: 20, tokensHeld: 10, riskLevel: 'low' },
    { address: '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022', label: 'Lido Finance', type: 'defi', totalReceived: 1000000, totalReceivedUsd: 2845000000, totalSent: 800000, totalSentUsd: 2276000000, transactionCount: 5000, firstSeen: 1609459200000, lastActive: Date.now() - 3600000, avgTransactionSize: 100, tokensHeld: 5, riskLevel: 'medium' },
  ]
}

const generateMockAlerts = (): WhaleAlert[] => {
  const now = Date.now()
  return [
    { id: '1', type: 'whale_movement', transaction: transactions.value[0] || generateMockTransactions()[0], amount: 100, amountUsd: 284500, timestamp: now - 3600000, chain: 'Ethereum', read: false },
    { id: '2', type: 'large_transfer', transaction: generateMockTransactions()[1], amount: 500, amountUsd: 1422500, timestamp: now - 7200000, chain: 'Ethereum', read: false },
    { id: '3', type: 'exchange_flow', transaction: generateMockTransactions()[2], amount: 1000, amountUsd: 2845000, timestamp: now - 14400000, chain: 'Ethereum', read: true },
  ]
}

const formatAddress = (addr: string) => {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

const formatValue = (value: number) => {
  if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M'
  if (value >= 1000) return '$' + (value / 1000).toFixed(1) + 'K'
  return '$' + value.toFixed(2)
}

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return '<1h ago'
  if (hours < 24) return hours + 'h ago'
  return Math.floor(hours / 24) + 'd ago'
}

const formatPercent = (value: number) => {
  return value.toFixed(0) + '%'
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString()
}

const getAlertTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    large_transfer: '💰',
    whale_movement: '🐋',
    exchange_flow: '🏦',
    defi_activity: '🧪'
  }
  return icons[type] || '📊'
}

const getAlertTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    large_transfer: 'green',
    whale_movement: 'purple',
    exchange_flow: 'blue',
    defi_activity: 'yellow'
  }
  return colors[type] || 'gray'
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-slate-700/50">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">🐋 Whale Tracker</h2>
        <div class="flex items-center gap-2">
          <button 
            @click="fetchData" 
            class="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Refresh"
          >
            🔄
          </button>
          <span class="text-xs text-slate-500">Real-time</span>
        </div>
      </div>
      
      <!-- Stats Summary -->
      <div v-if="stats" class="grid grid-cols-3 gap-2 mt-3">
        <div class="bg-slate-700/30 rounded-lg p-2 text-center">
          <div class="text-lg font-bold text-purple-400">{{ stats.totalWhaleTransactions24h }}</div>
          <div class="text-xs text-slate-500">24h Transactions</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-2 text-center">
          <div class="text-lg font-bold text-green-400">{{ formatValue(stats.totalVolume24h) }}</div>
          <div class="text-xs text-slate-500">24h Volume</div>
        </div>
        <div class="bg-slate-700/30 rounded-lg p-2 text-center">
          <div class="text-lg font-bold text-blue-400">{{ formatValue(stats.avgTransactionSize) }}</div>
          <div class="text-xs text-slate-500">Avg Size</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-700/50">
      <button
        v-for="tab in ['transactions', 'wallets', 'alerts', 'stats']"
        :key="tab"
        @click="activeTab = tab as any"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors',
          activeTab === tab
            ? 'text-purple-400 border-b-2 border-purple-400'
            : 'text-slate-400 hover:text-white'
        ]"
      >
        {{ tab === 'transactions' ? '📊 Txs' : tab === 'wallets' ? '👛 Wallets' : tab === 'alerts' ? '🔔 Alerts' : '📈 Stats' }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/30 m-4 rounded-lg">
      <span class="text-red-400 text-sm">{{ error }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-8 text-center">
      <div class="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
    </div>

    <!-- Transactions -->
    <div v-else-if="activeTab === 'transactions'" class="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
      <div
        v-for="tx in transactions"
        :key="tx.hash"
        class="p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <span :class="['text-lg', tx.isLargeTransfer ? 'text-green-400' : 'text-slate-400']">
              {{ tx.isLargeTransfer ? '📈' : '📉' }}
            </span>
            <span class="font-medium">{{ tx.tokenSymbol }}</span>
            <span class="px-2 py-0.5 bg-slate-700 rounded text-xs">Ethereum</span>
            <span v-if="tx.isLargeTransfer" class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Large</span>
          </div>
          <span class="text-sm text-slate-500">{{ formatTime(tx.timestamp) }}</span>
        </div>
        
        <div class="text-sm text-slate-400 mb-2">
          <span class="text-purple-400">{{ tx.fromLabel || formatAddress(tx.from) }}</span> → 
          <span class="text-blue-400">{{ tx.toLabel || formatAddress(tx.to) }}</span>
        </div>
        
        <div class="flex items-center justify-between">
          <span class="font-semibold text-lg" :class="tx.valueUsd > 100000 ? 'text-green-400' : ''">
            {{ formatValue(tx.valueUsd) }}
          </span>
          <code class="text-xs text-slate-500">{{ formatAddress(tx.hash) }}</code>
        </div>
      </div>
    </div>

    <!-- Wallets -->
    <div v-else-if="activeTab === 'wallets'" class="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
      <div
        v-for="wallet in wallets"
        :key="wallet.address"
        class="p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="font-medium mb-1">{{ wallet.label }}</div>
            <div class="font-mono text-sm text-slate-400">{{ formatAddress(wallet.address) }}</div>
          </div>
          <div class="text-right">
            <div :class="['font-semibold', wallet.riskLevel === 'low' ? 'text-green-400' : wallet.riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400']">
              {{ wallet.riskLevel.toUpperCase() }}
            </div>
            <span class="text-xs text-slate-500">Risk</span>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-2 text-sm mb-3">
          <div>
            <div class="text-slate-500">Total Received</div>
            <div class="font-medium text-green-400">{{ formatValue(wallet.totalReceivedUsd) }}</div>
          </div>
          <div>
            <div class="text-slate-500">Transactions</div>
            <div class="font-medium">{{ wallet.transactionCount }}</div>
          </div>
          <div>
            <div class="text-slate-500">Tokens Held</div>
            <div class="font-medium">{{ wallet.tokensHeld }}</div>
          </div>
        </div>
        
        <div class="text-xs text-slate-500">
          First seen: {{ formatDate(wallet.firstSeen) }} • Last active: {{ formatTime(wallet.lastActive) }}
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div v-else-if="activeTab === 'alerts'" class="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        :class="[
          'p-4 transition-colors',
          alert.read ? 'bg-slate-800/30' : 'bg-slate-700/20'
        ]"
      >
        <div class="flex items-start gap-3">
          <span class="text-2xl">{{ getAlertTypeIcon(alert.type) }}</span>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span :class="['font-medium', `text-${getAlertTypeColor(alert.type)}-400`]">
                {{ alert.type.replace('_', ' ').toUpperCase() }}
              </span>
              <span class="text-xs text-slate-500">{{ formatTime(alert.timestamp) }}</span>
            </div>
            <p class="text-sm text-slate-400 mb-2">
              {{ alert.transaction.fromLabel }} → {{ alert.transaction.toLabel }}
            </p>
            <div class="flex items-center gap-2">
              <span class="font-semibold" :class="alert.amountUsd > 100000 ? 'text-green-400' : ''">
                {{ formatValue(alert.amountUsd) }}
              </span>
              <span class="px-2 py-0.5 bg-slate-700 rounded text-xs">{{ alert.transaction.tokenSymbol }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div v-else-if="activeTab === 'stats'" class="p-4 space-y-4">
      <div v-if="stats" class="space-y-4">
        <!-- Top Networks -->
        <div class="bg-slate-700/30 rounded-xl p-4">
          <h3 class="font-medium mb-3">🌐 Top Networks</h3>
          <div class="space-y-2">
            <div v-for="network in stats.topNetworks" :key="network.chain" class="flex justify-between items-center">
              <span>{{ network.chain }}</span>
              <div class="text-right">
                <div class="font-medium">{{ network.count }} txs</div>
                <div class="text-xs text-slate-500">{{ formatValue(network.volume) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Tokens -->
        <div class="bg-slate-700/30 rounded-xl p-4">
          <h3 class="font-medium mb-3">🪙 Top Tokens</h3>
          <div class="space-y-2">
            <div v-for="token in stats.topTokens" :key="token.symbol" class="flex justify-between items-center">
              <span class="font-medium">{{ token.symbol }}</span>
              <div class="text-right">
                <div class="font-medium">{{ token.count }} txs</div>
                <div class="text-xs text-slate-500">{{ formatValue(token.volume) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Largest Transaction -->
        <div v-if="stats.largestTransaction" class="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30">
          <h3 class="font-medium mb-3">🏆 Largest Transaction</h3>
          <div class="flex justify-between items-center">
            <div>
              <div class="text-green-400 font-semibold text-xl">{{ formatValue(stats.largestTransaction.valueUsd) }}</div>
              <div class="text-sm text-slate-400">{{ stats.largestTransaction.tokenSymbol }}</div>
            </div>
            <div class="text-right">
              <div class="font-mono text-sm">{{ formatAddress(stats.largestTransaction.hash) }}</div>
              <div class="text-xs text-slate-500">{{ formatTime(stats.largestTransaction.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
