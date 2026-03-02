<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

const API_BASE = 'http://localhost:3002';

interface Transaction {
  to: string;
  value: string;
  data: string;
  chainId: number;
  gasLimit?: string;
}

interface Bundle {
  id: string;
  transactions: Transaction[];
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  executedAt?: string;
  totalGasUsed?: string;
  results?: any[];
}

const { chainId, account, isConnected } = useWeb3();

// State
const bundles = ref<Bundle[]>([]);
const pendingTxs = ref<Transaction[]>([]);
const newTx = ref<Transaction>({
  to: '',
  value: '',
  data: '0x',
  chainId: 1,
  gasLimit: ''
});
const loading = ref(false);
const error = ref('');
const success = ref('');
const currentBundleId = ref<string | null>(null);

// Chain options
const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ETH' },
  { id: 10, name: 'Optimism', symbol: 'ETH' },
  { id: 56, name: 'BSC', symbol: 'BNB' },
  { id: 8453, name: 'Base', symbol: 'ETH' },
];

// Computed
const totalValue = computed(() => {
  return pendingTxs.value.reduce((sum, tx) => sum + (parseFloat(tx.value) || 0), 0);
});

const estimatedGas = computed(() => {
  return pendingTxs.value.length * 21000;
});

// Methods
const addTransaction = () => {
  if (!newTx.value.to) {
    error.value = 'Please enter a recipient address';
    return;
  }
  
  const tx: Transaction = {
    ...newTx.value,
    chainId: newTx.value.chainId || chainId.value || 1,
    data: newTx.value.data || '0x',
  };
  
  pendingTxs.value.push(tx);
  newTx.value = { to: '', value: '', data: '0x', chainId: chainId.value || 1, gasLimit: '' };
  error.value = '';
};

const removeTransaction = (index: number) => {
  pendingTxs.value.splice(index, 1);
};

const createBundle = async (executeImmediately = false) => {
  if (pendingTxs.value.length === 0) {
    error.value = 'No transactions in bundle';
    return;
  }
  
  loading.value = true;
  error.value = '';
  success.value = '';
  
  try {
    const response = await fetch(`${API_BASE}/tx-bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: pendingTxs.value,
        executeImmediately
      })
    });
    
    if (!response.ok) throw new Error('Failed to create bundle');
    
    const bundle = await response.json();
    bundles.value.unshift(bundle);
    currentBundleId.value = bundle.id;
    pendingTxs.value = [];
    success.value = `Bundle created: ${bundle.id}`;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const executeBundle = async (bundleId: string) => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`${API_BASE}/tx-bundle/${bundleId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gasMultiplier: 1.2 })
    });
    
    if (!response.ok) throw new Error('Failed to execute bundle');
    
    const bundle = await response.json();
    const index = bundles.value.findIndex(b => b.id === bundleId);
    if (index !== -1) {
      bundles.value[index] = bundle;
    }
    success.value = 'Bundle executed successfully';
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const cancelBundle = async (bundleId: string) => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`${API_BASE}/tx-bundle/${bundleId}/cancel`, {
      method: 'POST'
    });
    
    if (!response.ok) throw new Error('Failed to cancel bundle');
    
    const bundle = await response.json();
    const index = bundles.value.findIndex(b => b.id === bundleId);
    if (index !== -1) {
      bundles.value[index] = bundle;
    }
    success.value = 'Bundle cancelled';
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const refreshBundle = async (bundleId: string) => {
  try {
    const response = await fetch(`${API_BASE}/tx-bundle/${bundleId}`);
    if (!response.ok) return;
    
    const bundle = await response.json();
    const index = bundles.value.findIndex(b => b.id === bundleId);
    if (index !== -1) {
      bundles.value[index] = bundle;
    }
  } catch (e) {
    console.error('Failed to refresh bundle');
  }
};

const estimateGas = async () => {
  try {
    const response = await fetch(`${API_BASE}/tx-bundle/estimate/gas?chainId=${chainId.value || 1}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  success.value = 'Copied to clipboard';
};

// Status badge helper
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    executing: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
};

// Quick add common transactions
const quickAdd = (type: string) => {
  if (type === 'transfer') {
    newTx.value = { to: '', value: '0.01', data: '0x', chainId: chainId.value || 1 };
  } else if (type === 'approve') {
    newTx.value = { 
      to: '0x0000000000000000000000000000000000000000', 
      value: '0', 
      data: '0x095ea7b3000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 
      chainId: chainId.value || 1 
    };
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white">Transaction Bundle</h2>
        <p class="text-slate-400">Queue & execute multiple transactions in one go</p>
      </div>
      <div class="flex gap-2">
        <button
          v-if="pendingTxs.length > 0"
          class="rounded-lg bg-purple-500/20 px-4 py-2 text-purple-400 hover:bg-purple-500/30"
          @click="pendingTxs = []"
        >
          Clear All
        </button>
      </div>
    </div>

    <!-- Error/Success Messages -->
    <div v-if="error" class="rounded-lg bg-red-500/20 p-4 text-red-400">
      {{ error }}
    </div>
    <div v-if="success" class="rounded-lg bg-green-500/20 p-4 text-green-400">
      {{ success }}
    </div>

    <!-- Add Transaction Form -->
    <div class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
      <h3 class="mb-4 text-lg font-semibold text-white">Add Transaction</h3>
      
      <!-- Quick Actions -->
      <div class="mb-4 flex gap-2">
        <button
          class="rounded-lg bg-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-600"
          @click="quickAdd('transfer')"
        >
          💸 Transfer
        </button>
        <button
          class="rounded-lg bg-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-600"
          @click="quickAdd('approve')"
        >
          ✅ Approve
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm text-slate-400">Recipient Address</label>
          <input
            v-model="newTx.to"
            type="text"
            placeholder="0x..."
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-400">Value (ETH)</label>
          <input
            v-model="newTx.value"
            type="text"
            placeholder="0.0"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-400">Chain</label>
          <select
            v-model="newTx.chainId"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
          >
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-400">Data (hex)</label>
          <input
            v-model="newTx.data"
            type="text"
            placeholder="0x..."
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>
      
      <button
        class="mt-4 rounded-lg bg-purple-500 px-6 py-2 font-semibold text-white hover:bg-purple-600"
        @click="addTransaction"
      >
        + Add Transaction
      </button>
    </div>

    <!-- Pending Transactions Queue -->
    <div v-if="pendingTxs.length > 0" class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white">
          Pending Transactions ({{ pendingTxs.length }})
        </h3>
        <div class="text-sm text-slate-400">
          Total: <span class="text-white font-semibold">{{ totalValue.toFixed(4) }} ETH</span>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="(tx, index) in pendingTxs"
          :key="index"
          class="flex items-center justify-between rounded-lg bg-slate-900/50 p-3"
        >
          <div class="flex items-center gap-3">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs text-purple-400">
              {{ index + 1 }}
            </span>
            <div>
              <p class="text-sm text-white font-mono">{{ tx.to.substring(0, 10) }}...{{ tx.to.substring(36) }}</p>
              <p class="text-xs text-slate-400">{{ tx.value }} ETH</p>
            </div>
          </div>
          <button
            class="text-red-400 hover:text-red-300"
            @click="removeTransaction(index)"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Bundle Actions -->
      <div class="mt-4 flex gap-3">
        <button
          class="rounded-lg bg-green-500 px-6 py-2 font-semibold text-white hover:bg-green-600"
          :disabled="loading"
          @click="createBundle(false)"
        >
          📦 Save Bundle
        </button>
        <button
          class="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600"
          :disabled="loading"
          @click="createBundle(true)"
        >
          🚀 Create & Execute
        </button>
      </div>
    </div>

    <!-- Saved Bundles -->
    <div v-if="bundles.length > 0" class="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
      <h3 class="mb-4 text-lg font-semibold text-white">Your Bundles</h3>
      
      <div class="space-y-3">
        <div
          v-for="bundle in bundles"
          :key="bundle.id"
          class="rounded-lg bg-slate-900/50 p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-sm text-white font-mono">{{ bundle.id }}</p>
              <p class="text-xs text-slate-400">{{ bundle.transactions.length }} transactions</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-medium"
              :class="getStatusColor(bundle.status)"
            >
              {{ bundle.status }}
            </span>
          </div>

          <!-- Transaction List -->
          <div class="mb-3 space-y-1">
            <div
              v-for="(tx, idx) in bundle.transactions"
              :key="idx"
              class="text-xs text-slate-400"
            >
              {{ idx + 1 }}. {{ tx.to.substring(0, 14) }}... → {{ tx.value }} ETH
            </div>
          </div>

          <!-- Results -->
          <div v-if="bundle.results" class="mb-3 rounded bg-slate-800 p-2">
            <p class="text-xs text-green-400 mb-1">✓ Executed successfully</p>
            <p class="text-xs text-slate-400">Gas used: {{ bundle.totalGasUsed }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              v-if="bundle.status === 'pending'"
              class="rounded bg-green-500/20 px-3 py-1 text-xs text-green-400 hover:bg-green-500/30"
              @click="executeBundle(bundle.id)"
            >
              Execute
            </button>
            <button
              v-if="bundle.status === 'pending'"
              class="rounded bg-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/30"
              @click="cancelBundle(bundle.id)"
            >
              Cancel
            </button>
            <button
              v-if="bundle.status === 'executing'"
              class="rounded bg-blue-500/20 px-3 py-1 text-xs text-blue-400 hover:bg-blue-500/30"
              @click="refreshBundle(bundle.id)"
            >
              Refresh
            </button>
            <button
              v-if="bundle.status === 'completed' && bundle.results"
              class="rounded bg-purple-500/20 px-3 py-1 text-xs text-purple-400 hover:bg-purple-500/30"
              @click="copyToClipboard(JSON.stringify(bundle.results, null, 2))"
            >
              Copy Results
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div class="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
      <h4 class="font-semibold text-blue-400 mb-2">💡 Tips</h4>
      <ul class="text-sm text-slate-400 space-y-1">
        <li>• Bundle multiple transactions to save time</li>
        <li>• Execute atomic swaps or DeFi operations in sequence</li>
        <li>• Cancel pending bundles before execution</li>
        <li>• Gas estimates are based on average network conditions</li>
      </ul>
    </div>
  </div>
</template>
