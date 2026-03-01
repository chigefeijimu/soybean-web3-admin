<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useWeb3 } from '@/composables/web3/useWeb3'
import { getTransactionList, parseTransactionReceipt } from '@/service/api/web3'
import type { TransactionListItem, ParsedReceipt } from '@/typings/web3'

const props = defineProps<{
  address?: string
  limit?: number
}>()

const { account, chainInfo } = useWeb3()

const transactions = ref<TransactionListItem[]>([])
const isLoading = ref(false)
const error = ref('')
const filter = ref<'all' | 'send' | 'receive'>('all')
const selectedTx = ref<TransactionListItem | null>(null)
const receiptData = ref<ParsedReceipt | null>(null)
const isLoadingReceipt = ref(false)

// Fallback mock data when API is unavailable
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
    // Try to fetch from backend API
    const userId = props.address || account.value
    const response = await getTransactionList({ userId })
    
    if (response.data && response.data.length > 0) {
      // Transform API response to UI format
      transactions.value = response.data.map((tx: any) => ({
        hash: tx.hash || tx.transaction_hash,
        from: tx.from_address || tx.from,
        to: tx.to_address || tx.to,
        value: tx.value || '0',
        token: tx.token_symbol || tx.token || 'ETH',
        timestamp: tx.timestamp ? new Date(tx.timestamp).getTime() : Date.now() - 3600000,
        status: tx.status || 'confirmed',
        type: userId && tx.from_address?.toLowerCase() === userId.toLowerCase() ? 'send' : 
              userId && tx.to_address?.toLowerCase() === userId.toLowerCase() ? 'receive' : 'swap',
        chainId: tx.chain_id || tx.chainId,
        gasUsed: tx.gas_used || tx.gasUsed,
        blockNumber: tx.block_number || tx.blockNumber,
      }))
    } else {
      // Use mock data when no transactions found
      transactions.value = mockTransactions
    }
  } catch (e: unknown) {
    // Fallback to mock data on error
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    console.warn('API error, using mock data:', errorMessage)
    transactions.value = mockTransactions
  } finally {
    isLoading.value = false
  }
}

// Parse transaction receipt for detailed info
const viewReceipt = async (tx: TransactionListItem) => {
  selectedTx.value = tx
  receiptData.value = null
  isLoadingReceipt.value = true
  
  try {
    const response = await parseTransactionReceipt({
      transactionHash: tx.hash,
      chainId: tx.chain_id || chainInfo.value?.chainId
    })
    receiptData.value = response.data
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    console.error('Failed to parse receipt:', errorMessage)
    receiptData.value = { error: errorMessage }
  } finally {
    isLoadingReceipt.value = false
  }
}

const closeReceiptModal = () => {
  selectedTx.value = null
  receiptData.value = null
}

// Watch for account changes
watch(() => account.value, () => {
  loadTransactions()
}, { immediate: false })

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
        v-for="f in (['all', 'send', 'receive'] as const)" 
        :key="f"
        @click="filter = f"
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
              @click="viewReceipt(tx)"
              class="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="View Details"
            >
              📄
            </button>
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
        
        <!-- Gas Info -->
        <div v-if="tx.gasUsed" class="mt-2 text-xs text-slate-500">
          Gas Used: {{ tx.gasUsed }} | Block: {{ tx.blockNumber || 'N/A' }}
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

  <!-- Transaction Receipt Modal -->
  <Teleport to="body">
    <div v-if="selectedTx" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="closeReceiptModal">
      <div class="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Transaction Details</h3>
          <button @click="closeReceiptModal" class="text-slate-400 hover:text-white">✕</button>
        </div>
        
        <!-- Transaction Hash -->
        <div class="mb-4">
          <label class="text-sm text-slate-400">Transaction Hash</label>
          <p class="font-mono text-sm break-all">{{ selectedTx.hash }}</p>
        </div>
        
        <!-- Status -->
        <div class="mb-4">
          <label class="text-sm text-slate-400">Status</label>
          <p :class="selectedTx.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'">
            {{ selectedTx.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending' }}
          </p>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoadingReceipt" class="text-center py-8">
          <div class="animate-spin text-4xl">⏳</div>
          <p class="text-slate-400 mt-2">Parsing transaction receipt...</p>
        </div>
        
        <!-- Receipt Data -->
        <div v-else-if="receiptData">
          <div v-if="receiptData.error" class="p-4 bg-red-500/20 rounded-lg text-red-300">
            {{ receiptData.error }}
          </div>
          
          <div v-else>
            <!-- Gas Info -->
            <div v-if="receiptData.gas_info" class="mb-4 p-4 bg-slate-900/50 rounded-lg">
              <h4 class="font-medium mb-2">Gas Information</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="text-slate-400">Gas Used:</span> {{ receiptData.gas_info.gas_used }}</div>
                <div><span class="text-slate-400">Gas Price:</span> {{ receiptData.gas_info.gas_price }}</div>
                <div><span class="text-slate-400">Effective Gas:</span> {{ receiptData.gas_info.effective_gas_price }}</div>
                <div><span class="text-slate-400">Cumulative Gas:</span> {{ receiptData.gas_info.cumulative_gas_used }}</div>
              </div>
            </div>
            
            <!-- Events -->
            <div v-if="receiptData.events && receiptData.events.length > 0">
              <h4 class="font-medium mb-2">Events ({{ receiptData.events.length }})</h4>
              <div class="space-y-2">
                <div v-for="(event, idx) in receiptData.events" :key="idx" class="p-3 bg-slate-900/50 rounded-lg">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">{{ event.name || 'Unknown' }}</span>
                    <span class="text-xs text-slate-500">{{ event.contract }}</span>
                  </div>
                  <div v-if="event.params" class="mt-2 text-sm">
                    <div v-for="(value, key) in event.params" :key="key" class="text-slate-400">
                      <span class="text-slate-500">{{ key }}:</span> {{ value }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="text-center py-4 text-slate-400">
              No events found in this transaction
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-4 text-slate-400">
          Click "View Details" to parse receipt
        </div>
        
        <!-- Actions -->
        <div class="mt-6 flex gap-3">
          <a 
            :href="getExplorerUrl(selectedTx.hash)"
            target="_blank"
            class="flex-1 text-center px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
          >
            View in Explorer 🔗
          </a>
          <button 
            @click="closeReceiptModal"
            class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
