<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface WhaleTransaction {
  hash: string
  from: string
  to: string
  value_usd: number
  token: string
  timestamp: number
  chain: string
  tx_type: string
}

interface SmartMoneyWallet {
  address: string
  total_profit: number
  win_rate: number
  total_trades: number
  avg_hold_time_hours: number
  last_active: number
  tokens_held: string[]
  pnl_24h: number
}

const activeTab = ref<'transactions' | 'wallets' | 'alerts'>('transactions')
const transactions = ref<WhaleTransaction[]>([])
const wallets = ref<SmartMoneyWallet[]>([])
const loading = ref(true)

// Mock data
const mockTransactions: WhaleTransaction[] = [
  {
    hash: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    from: '0xd8dA6BF26964aF9D7eEd09eE47c44cBda2CCECEC',
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f',
    value_usd: 1250000,
    token: 'ETH',
    timestamp: Date.now() - 3600000,
    chain: 'Ethereum',
    tx_type: 'buy'
  },
  {
    hash: '0x5678901234567890abcdef1234567890abcdef12',
    from: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    to: '0x1234567890abcdef1234567890abcdef12345678',
    value_usd: 850000,
    token: 'AAVE',
    timestamp: Date.now() - 7200000,
    chain: 'Ethereum',
    tx_type: 'buy'
  },
  {
    hash: '0xabcdef1234567890abcdef1234567890abcdef12',
    from: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    to: '0x9999999999999999999999999999999999999999',
    value_usd: 2500000,
    token: 'ETH',
    timestamp: Date.now() - 14400000,
    chain: 'Ethereum',
    tx_type: 'sell'
  },
]

const mockWallets: SmartMoneyWallet[] = [
  {
    address: '0xd8dA6BF26964aF9D7eEd09eE47c44cBda2CCECEC',
    total_profit: 1250000,
    win_rate: 0.72,
    total_trades: 156,
    avg_hold_time_hours: 48,
    last_active: Date.now() - 86400000,
    tokens_held: ['ETH', 'UNI', 'AAVE'],
    pnl_24h: 45000
  },
  {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    total_profit: 850000,
    win_rate: 0.68,
    total_trades: 89,
    avg_hold_time_hours: 72,
    last_active: Date.now() - 172800000,
    tokens_held: ['AAVE', 'ETH', 'USDC'],
    pnl_24h: 12500
  },
]

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
  return (value * 100).toFixed(0) + '%'
}

onMounted(() => {
  // Simulate API call
  setTimeout(() => {
    transactions.value = mockTransactions
    wallets.value = mockWallets
    loading.value = false
  }, 500)
})
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="p-4 border-b border-slate-700/50">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">🐋 Whale Tracker</h2>
        <span class="text-xs text-slate-500">Smart Money</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-700/50">
      <button
        v-for="tab in ['transactions', 'wallets', 'alerts']"
        :key="tab"
        @click="activeTab = tab as any"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors',
          activeTab === tab
            ? 'text-purple-400 border-b-2 border-purple-400'
            : 'text-slate-400 hover:text-white'
        ]"
      >
        {{ tab === 'transactions' ? '📊 Transactions' : tab === 'wallets' ? '👛 Wallets' : '🔔 Alerts' }}
      </button>
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
            <span :class="['text-lg', tx.tx_type === 'buy' ? 'text-green-400' : 'text-red-400']">
              {{ tx.tx_type === 'buy' ? '📈' : '📉' }}
            </span>
            <span class="font-medium">{{ tx.token }}</span>
            <span class="px-2 py-0.5 bg-slate-700 rounded text-xs">{{ tx.chain }}</span>
          </div>
          <span class="text-sm text-slate-500">{{ formatTime(tx.timestamp) }}</span>
        </div>
        
        <div class="text-sm text-slate-400 mb-2">
          {{ formatAddress(tx.from) }} → {{ formatAddress(tx.to) }}
        </div>
        
        <div class="flex items-center justify-between">
          <span class="font-semibold text-lg">{{ formatValue(tx.value_usd) }}</span>
          <code class="text-xs text-slate-500">{{ tx.hash }}</code>
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
            <div class="font-mono text-sm mb-1">{{ formatAddress(wallet.address) }}</div>
            <div class="flex gap-1">
              <span
                v-for="token in wallet.tokens_held"
                :key="token"
                class="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs"
              >
                {{ token }}
              </span>
            </div>
          </div>
          <div class="text-right">
            <div :class="['font-semibold', wallet.pnl_24h >= 0 ? 'text-green-400' : 'text-red-400']">
              {{ wallet.pnl_24h >= 0 ? '+' : '' }}{{ formatValue(wallet.pnl_24h) }}
            </div>
            <span class="text-xs text-slate-500">24h P&L</span>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div class="text-slate-500">Win Rate</div>
            <div class="font-medium">{{ formatPercent(wallet.win_rate) }}</div>
          </div>
          <div>
            <div class="text-slate-500">Total Trades</div>
            <div class="font-medium">{{ wallet.total_trades }}</div>
          </div>
          <div>
            <div class="text-slate-500">Total Profit</div>
            <div class="font-medium text-green-400">{{ formatValue(wallet.total_profit) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div v-else class="p-4 space-y-3 max-h-[500px] overflow-y-auto">
      <div class="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-green-400">🐋</span>
          <span class="font-medium">Large Buy Detected</span>
        </div>
        <p class="text-sm text-slate-400">
          0xd8dA... bought <span class="text-green-400">$250K</span> UNI
        </p>
        <span class="text-xs text-slate-500">2 hours ago</span>
      </div>
      
      <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-red-400">🐋</span>
          <span class="font-medium">Large Sell Detected</span>
        </div>
        <p class="text-sm text-slate-400">
          0x7Fc6... sold <span class="text-red-400">$500K</span> ETH
        </p>
        <span class="text-xs text-slate-500">5 hours ago</span>
      </div>
    </div>
  </div>
</template>
