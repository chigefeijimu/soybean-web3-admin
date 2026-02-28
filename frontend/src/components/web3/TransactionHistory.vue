<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWeb3 } from '@/composables/web3/useWeb3'

const props = defineProps<{
  address?: string
  limit?: number
}>()

const { account, chainInfo } = useWeb3()

const transactions = ref<any[]>([])
const isLoading = ref(false)
const error = ref('')
const filter = ref<'all' | 'send' | 'receive'>('all')

// Mock transaction data for demo
const mockTransactions = [
  {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    to: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
    value: '0.5',
    token: 'ETH',
    timestamp: Date.now() - 3600000 * 2,
    status: 'confirmed',
    type: 'send',
  },
  {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    from: '0x9Ba1f109551bD432803012645Ac136ddd64DBA72',
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    value: '1.2',
    token: 'ETH',
    timestamp: Date.now() - 3600000 * 24,
    status: 'confirmed',
    type: 'receive',
  },
  {
    hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    value: '5000',
    token: 'USDC',
    timestamp: Date.now() - 3600000 * 48,
    status: 'confirmed',
    type: 'swap',
  },
  {
    hash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    from: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
    to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    value: '0.1',
    token: 'ETH',
    timestamp: Date.now() - 3600000 * 72,
    status: 'confirmed',
    type: 'receive',
  },
  {
    hash: '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    to: '0x6B175474E89094C44Da98b954Eebc90fE31f3a2a',
    value: '1000',
    token: 'DAI',
    timestamp: Date.now() - 3600000 * 96,
    status: 'pending',
    type: 'send',
  },
]

const filteredTransactions = computed(() => {
  if (filter.value === 'all') return transactions.value
  return transactions.value.filter(tx => tx.type === filter.value)
})

const formatAddress = (addr: string): string => {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

const formatValue = (value: string, token: string): string => {
  const num = parseFloat(value)
  if (num >= 1000) {
    return num.toLocaleString() + ' ' + token
  }
  return value + ' ' + token
}

const formatTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const getExplorerUrl = (hash: string): string => {
  if (!chainInfo.value?.explorer) return '#'
  return `${chainInfo.value.explorer}/tx/${hash}`
}

const copyTxHash = (hash: string) => {
  navigator.clipboard.writeText(hash)
}

const loadTransactions = async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    // In production, fetch from API or blockchain
    // For demo, use mock data
    await new Promise(resolve => setTimeout(resolve, 500))
    transactions.value = mockTransactions
  } catch (e: any) {
    error.value = e.message || 'Failed to load transactions'
  } finally {
    isLoading.value = false
  }
}

const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'send': return '↑'
    case 'receive': return '↓'
    case 'swap': return '⇄'
    default: return '•'
  }
}

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'send': return 'text-red-400 bg-red-500/20'
    case 'receive': return 'text-green-400 bg-green-500/20'
    case 'swap': return 'text-purple-400 bg-purple-500/20'
    default: return 'text-slate-400 bg-slate-500/20'
  }
}

onMounted(() => {
  loadTransactions()
})
</script>

<template>
  <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold">Transaction History</h2>
      <button 
        @click="loadTransactions"
        :disabled="isLoading"
        class="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg text-sm transition-colors"
      >
        {{ isLoading ? 'Loading...' : '↻ Refresh' }}
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-2 mb-6">
      <button 
        v-for="f in ['all', 'send', 'receive']" 
        :key="f"
        @click="filter = f as any"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          filter === f 
            ? 'bg-purple-500/20 text-purple-400' 
            : 'bg-slate-700/50 text-slate-400 hover:text-white'
        ]"
      >
        {{ f.charAt(0).toUpperCase() + f.slice(1) }}
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
      <span class="text-red-300 text-sm">{{ error }}</span>
    </div>

    <!-- Transactions List -->
    <div class="space-y-3">
      <div 
        v-for="tx in filteredTransactions" 
        :key="tx.hash"
        class="p-4 bg-slate-900/50 rounded-xl hover:bg-slate-800/50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <!-- Type Icon -->
            <div 
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center text-lg',
                getTypeColor(tx.type)
              ]"
            >
              {{ getTypeIcon(tx.type) }}
            </div>
            
            <!-- Transaction Info -->
            <div>
              <div class="flex items-center gap-2">
                <span 
                  :class="[
                    'font-medium',
                    tx.type === 'send' ? 'text-red-400' : 
                    tx.type === 'receive' ? 'text-green-400' : 'text-purple-400'
                  ]"
                >
                  {{ tx.type === 'send' ? 'Sent' : tx.type === 'receive' ? 'Received' : 'Swapped' }}
                </span>
                <span 
                  v-if="tx.status === 'pending'"
                  class="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs"
                >
                  Pending
                </span>
                <span 
                  v-else
                  class="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs"
                >
                  Confirmed
                </span>
              </div>
              
              <p class="text-sm text-slate-400 mt-1">
                {{ formatValue(tx.value, tx.token) }}
              </p>
              
              <div class="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span v-if="tx.type === 'send'">To: {{ formatAddress(tx.to) }}</span>
                <span v-else>From: {{ formatAddress(tx.from) }}</span>
                <span>•</span>
                <span>{{ formatTime(tx.timestamp) }}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button 
              @click="copyTxHash(tx.hash)"
              class="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Copy Hash"
            >
              📋
            </button>
            <a 
              :href="getExplorerUrl(tx.hash)"
              target="_blank"
              class="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="View in Explorer"
            >
              🔗
            </a>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div 
        v-if="filteredTransactions.length === 0 && !isLoading"
        class="text-center py-8 text-slate-400"
      >
        <div class="text-4xl mb-3">📭</div>
        <p>No transactions found</p>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="filteredTransactions.length > 0" class="mt-6 text-center">
      <button class="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
        Load More
      </button>
    </div>
  </div>
</template>
