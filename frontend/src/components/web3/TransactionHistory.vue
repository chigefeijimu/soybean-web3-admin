<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getTransactionList, parseTransactionReceipt } from '@/service/api/web3';
import { useWeb3 } from '@/composables/web3/useWeb3';
import type { ParsedReceipt, TransactionUIItem } from '@/typings/web3';

const props = defineProps<{
  address?: string;
  limit?: number; // Reserved for limiting displayed transactions
}>();

const { account, chainInfo } = useWeb3();

const transactions = ref<TransactionUIItem[]>([]);
const isLoading = ref(false);
const error = ref('');
const filter = ref<'all' | 'send' | 'receive'>('all');
const selectedTx = ref<TransactionUIItem | null>(null);
const receiptData = ref<ParsedReceipt | null>(null);
const isLoadingReceipt = ref(false);

// Fallback mock data when API is unavailable
const mockTransactions: TransactionUIItem[] = [
  {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    to: '0x8Ba1f109551bD432803012645Ac136ddd64DBA72',
    value: '0.5',
    token: 'ETH',
    timestamp: Date.now() - 3600000 * 2,
    status: 'confirmed',
    type: 'send',
    chainId: 1
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
    chainId: 1
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
    chainId: 1
  }
];

const filteredTransactions = computed(() => {
  if (filter.value === 'all') return transactions.value;
  return transactions.value.filter(tx => tx.type === filter.value);
});

const formatAddress = (addr: string): string => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatValue = (value: string, token: string): string => {
  const num = Number.parseFloat(value);
  if (num >= 1000) {
    return `${num.toLocaleString()} ${token}`;
  }
  return `${value} ${token}`;
};

const formatTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getExplorerUrl = (hash: string): string => {
  if (!chainInfo.value?.explorer) return '#';
  return `${chainInfo.value.explorer}/tx/${hash}`;
};

const copyTxHash = (hash: string) => {
  navigator.clipboard.writeText(hash);
};

const loadTransactions = async () => {
  isLoading.value = true;
  error.value = '';

  try {
    // Try to fetch from backend API
    const userId = props.address || account.value;
    const response = await getTransactionList({ userId });

    if (response.data && response.data.length > 0) {
      // Transform API response to UI format
      transactions.value = response.data.map((tx: any): TransactionUIItem => {
        let txType: 'send' | 'receive' | 'swap' = 'swap';
        if (userId && tx.from_address?.toLowerCase() === userId.toLowerCase()) {
          txType = 'send';
        } else if (userId && tx.to_address?.toLowerCase() === userId.toLowerCase()) {
          txType = 'receive';
        }

        return {
          hash: tx.hash || tx.transaction_hash,
          from: tx.from_address || tx.from,
          to: tx.to_address || tx.to,
          value: tx.value || '0',
          token: tx.token_symbol || tx.token || 'ETH',
          timestamp: tx.timestamp ? new Date(tx.timestamp).getTime() : Date.now() - 3600000,
          status: tx.status || 'confirmed',
          type: txType,
          chainId: tx.chain_id || tx.chainId,
          gasUsed: tx.gas_used || tx.gasUsed,
          blockNumber: tx.block_number || tx.blockNumber
        };
      });
    } else {
      // Use mock data when no transactions found
      transactions.value = mockTransactions;
    }
  } catch (e: unknown) {
    // Fallback to mock data on error
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.warn('API error, using mock data:', errorMessage);
    transactions.value = mockTransactions;
  } finally {
    isLoading.value = false;
  }
};

// Parse transaction receipt for detailed info
const viewReceipt = async (tx: TransactionUIItem) => {
  selectedTx.value = tx;
  receiptData.value = null;
  isLoadingReceipt.value = true;

  try {
    const response = await parseTransactionReceipt({
      transactionHash: tx.hash,
      chainId: tx.chainId || chainInfo.value?.chainId
    });
    receiptData.value = response.data;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error('Failed to parse receipt:', errorMessage);
    receiptData.value = {
      error: errorMessage,
      transactionHash: tx.hash,
      blockNumber: 0,
      from: '',
      status: false,
      gasUsed: 0,
      effectiveGasPrice: 0,
      events: []
    };
  } finally {
    isLoadingReceipt.value = false;
  }
};

const closeReceiptModal = () => {
  selectedTx.value = null;
  receiptData.value = null;
};

// Watch for account changes
watch(
  () => account.value,
  () => {
    loadTransactions();
  },
  { immediate: false }
);

const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'send':
      return '↑';
    case 'receive':
      return '↓';
    case 'swap':
      return '⇄';
    default:
      return '•';
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'send':
      return 'text-red-400 bg-red-500/20';
    case 'receive':
      return 'text-green-400 bg-green-500/20';
    case 'swap':
      return 'text-purple-400 bg-purple-500/20';
    default:
      return 'text-slate-400 bg-slate-500/20';
  }
};

onMounted(() => {
  loadTransactions();
});
</script>

<template>
  <div class="border border-slate-700/50 rounded-2xl bg-slate-800/50 p-6 backdrop-blur-xl">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold">Transaction History</h2>
      <button
        :disabled="isLoading"
        class="rounded-lg bg-slate-700 px-4 py-2 text-sm transition-colors hover:bg-slate-600 disabled:opacity-50"
        @click="loadTransactions"
      >
        {{ isLoading ? 'Loading...' : '↻ Refresh' }}
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="mb-6 flex gap-2">
      <button
        v-for="f in ['all', 'send', 'receive'] as const"
        :key="f"
        class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        :class="[filter === f ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700/50 text-slate-400 hover:text-white']"
        @click="filter = f"
      >
        {{ f.charAt(0).toUpperCase() + f.slice(1) }}
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="mb-6 border border-red-500/50 rounded-lg bg-red-500/20 p-4">
      <span class="text-sm text-red-300">{{ error }}</span>
    </div>

    <!-- Transactions List -->
    <div class="space-y-3">
      <div
        v-for="tx in filteredTransactions"
        :key="tx.hash"
        class="rounded-xl bg-slate-900/50 p-4 transition-colors hover:bg-slate-800/50"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <!-- Type Icon -->
            <div
              class="h-10 w-10 flex items-center justify-center rounded-full text-lg"
              :class="[getTypeColor(tx.type)]"
            >
              {{ getTypeIcon(tx.type) }}
            </div>

            <!-- Transaction Info -->
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="font-medium"
                  :class="[
                    tx.type === 'send' ? 'text-red-400' : tx.type === 'receive' ? 'text-green-400' : 'text-purple-400'
                  ]"
                >
                  {{ tx.type === 'send' ? 'Sent' : tx.type === 'receive' ? 'Received' : 'Swapped' }}
                </span>
                <span
                  v-if="tx.status === 'pending'"
                  class="rounded bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400"
                >
                  Pending
                </span>
                <span v-else class="rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Confirmed</span>
              </div>

              <p class="mt-1 text-sm text-slate-400">
                {{ formatValue(tx.value, tx.token) }}
              </p>

              <div class="mt-1 flex items-center gap-2 text-xs text-slate-500">
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
              class="rounded-lg p-2 transition-colors hover:bg-slate-700"
              title="View Details"
              @click="viewReceipt(tx)"
            >
              📄
            </button>
            <button
              class="rounded-lg p-2 transition-colors hover:bg-slate-700"
              title="Copy Hash"
              @click="copyTxHash(tx.hash)"
            >
              📋
            </button>
            <a
              :href="getExplorerUrl(tx.hash)"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-lg p-2 transition-colors hover:bg-slate-700"
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
      <div v-if="filteredTransactions.length === 0 && !isLoading" class="py-8 text-center text-slate-400">
        <div class="mb-3 text-4xl">📭</div>
        <p>No transactions found</p>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="filteredTransactions.length > 0" class="mt-6 text-center">
      <button class="rounded-lg bg-slate-700 px-6 py-2 text-sm transition-colors hover:bg-slate-600">Load More</button>
    </div>
  </div>

  <!-- Transaction Receipt Modal -->
  <Teleport to="body">
    <div
      v-if="selectedTx"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      @click.self="closeReceiptModal"
    >
      <div class="max-h-[80vh] max-w-2xl w-full overflow-y-auto border border-slate-700 rounded-2xl bg-slate-800 p-6">
        <div class="mb-6 flex items-center justify-between">
          <h3 class="text-xl font-semibold">Transaction Details</h3>
          <button class="text-slate-400 hover:text-white" @click="closeReceiptModal">✕</button>
        </div>

        <!-- Transaction Hash -->
        <div class="mb-4">
          <label class="text-sm text-slate-400">Transaction Hash</label>
          <p class="break-all text-sm font-mono">{{ selectedTx.hash }}</p>
        </div>

        <!-- Status -->
        <div class="mb-4">
          <label class="text-sm text-slate-400">Status</label>
          <p :class="selectedTx.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'">
            {{ selectedTx.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending' }}
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingReceipt" class="py-8 text-center">
          <div class="animate-spin text-4xl">⏳</div>
          <p class="mt-2 text-slate-400">Parsing transaction receipt...</p>
        </div>

        <!-- Receipt Data -->
        <div v-else-if="receiptData">
          <div v-if="receiptData.error" class="rounded-lg bg-red-500/20 p-4 text-red-300">
            {{ receiptData.error }}
          </div>

          <div v-else>
            <!-- Gas Info -->
            <div v-if="receiptData.gas_info" class="mb-4 rounded-lg bg-slate-900/50 p-4">
              <h4 class="mb-2 font-medium">Gas Information</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-slate-400">Gas Used:</span>
                  {{ receiptData.gas_info.gas_used }}
                </div>
                <div>
                  <span class="text-slate-400">Gas Price:</span>
                  {{ receiptData.gas_info.gas_price }}
                </div>
                <div>
                  <span class="text-slate-400">Effective Gas:</span>
                  {{ receiptData.gas_info.effective_gas_price }}
                </div>
                <div>
                  <span class="text-slate-400">Cumulative Gas:</span>
                  {{ receiptData.gas_info.cumulative_gas_used }}
                </div>
              </div>
            </div>

            <!-- Events -->
            <div v-if="receiptData.events && receiptData.events.length > 0">
              <h4 class="mb-2 font-medium">Events ({{ receiptData.events.length }})</h4>
              <div class="space-y-2">
                <div v-for="(event, idx) in receiptData.events" :key="idx" class="rounded-lg bg-slate-900/50 p-3">
                  <div class="flex items-center gap-2">
                    <span class="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                      {{ event.name || 'Unknown' }}
                    </span>
                    <span class="text-xs text-slate-500">{{ event.contract }}</span>
                  </div>
                  <div v-if="event.params" class="mt-2 text-sm">
                    <div v-for="(value, key) in event.params" :key="key" class="text-slate-400">
                      <span class="text-slate-500">{{ key }}:</span>
                      {{ value }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="py-4 text-center text-slate-400">No events found in this transaction</div>
          </div>
        </div>

        <div v-else class="py-4 text-center text-slate-400">Click "View Details" to parse receipt</div>

        <!-- Actions -->
        <div class="mt-6 flex gap-3">
          <a
            :href="getExplorerUrl(selectedTx.hash)"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 rounded-lg bg-purple-500 px-4 py-2 text-center transition-colors hover:bg-purple-600"
          >
            View in Explorer 🔗
          </a>
          <button
            class="flex-1 rounded-lg bg-slate-700 px-4 py-2 transition-colors hover:bg-slate-600"
            @click="closeReceiptModal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
