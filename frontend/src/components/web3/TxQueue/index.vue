<template>
  <div class="tx-queue-manager">
    <div class="header">
      <h3>📋 Transaction Queue Manager</h3>
      <div class="actions">
        <button @click="refreshQueue" class="btn btn-sm" :disabled="loading">
          🔄 Refresh
        </button>
        <button @click="clearQueue" class="btn btn-sm btn-danger" :disabled="loading">
          🗑️ Clear All
        </button>
      </div>
    </div>

    <!-- Queue Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">Pending</span>
        <span class="stat-value pending">{{ pendingCount }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ totalCount }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Chain</span>
        <span class="stat-value">{{ chainName }}</span>
      </div>
    </div>

    <!-- Add Transaction Form -->
    <div class="add-form">
      <h4>➕ Add Transaction to Queue</h4>
      <div class="form-grid">
        <div class="form-group">
          <label>To Address</label>
          <input 
            v-model="newTx.to" 
            placeholder="0x..." 
            class="input"
          />
        </div>
        <div class="form-group">
          <label>Value (ETH)</label>
          <input 
            v-model="newTx.value" 
            type="number" 
            step="0.0001" 
            placeholder="0.0" 
            class="input"
          />
        </div>
        <div class="form-group">
          <label>Gas Price (Gwei)</label>
          <input 
            v-model="newTx.gasPrice" 
            type="number" 
            step="1" 
            placeholder="Auto" 
            class="input"
          />
        </div>
        <div class="form-group">
          <label>Gas Limit</label>
          <input 
            v-model="newTx.gasLimit" 
            type="number" 
            placeholder="21000" 
            class="input"
          />
        </div>
        <div class="form-group full-width">
          <label>Data (hex)</label>
          <input 
            v-model="newTx.data" 
            placeholder="0x" 
            class="input"
          />
        </div>
      </div>
      <button @click="addTransaction" class="btn btn-primary" :disabled="!canAddTx">
        ➕ Add to Queue
      </button>
    </div>

    <!-- Transaction Queue List -->
    <div class="queue-list">
      <h4>📋 Transaction Queue</h4>
      
      <div v-if="loading" class="loading">Loading...</div>
      
      <div v-else-if="transactions.length === 0" class="empty-state">
        <p>No transactions in queue</p>
        <p class="hint">Add transactions above to start queuing</p>
      </div>
      
      <div v-else class="tx-items">
        <div 
          v-for="(tx, index) in transactions" 
          :key="tx.id" 
          class="tx-item"
          :class="tx.status"
        >
          <div class="tx-order">{{ index + 1 }}</div>
          
          <div class="tx-details">
            <div class="tx-row">
              <span class="tx-label">To:</span>
              <span class="tx-value address">{{ shortenAddress(tx.to) }}</span>
            </div>
            <div class="tx-row">
              <span class="tx-label">Value:</span>
              <span class="tx-value">{{ formatValue(tx.value) }} ETH</span>
            </div>
            <div class="tx-row" v-if="tx.gasPrice">
              <span class="tx-label">Gas:</span>
              <span class="tx-value">{{ formatGas(tx.gasPrice) }} Gwei</span>
            </div>
            <div class="tx-row" v-if="tx.gasLimit">
              <span class="tx-label">Limit:</span>
              <span class="tx-value">{{ tx.gasLimit.toLocaleString() }}</span>
            </div>
          </div>
          
          <div class="tx-status">
            <span class="status-badge" :class="tx.status">
              {{ tx.status.toUpperCase() }}
            </span>
          </div>
          
          <div class="tx-actions">
            <button 
              @click="updateStatus(tx.id, 'submitted')" 
              class="btn btn-xs"
              :disabled="tx.status !== 'pending'"
              title="Mark as Submitted"
            >
              📤
            </button>
            <button 
              @click="updateStatus(tx.id, 'confirmed')" 
              class="btn btn-xs"
              :disabled="tx.status !== 'submitted'"
              title="Mark as Confirmed"
            >
              ✅
            </button>
            <button 
              @click="updateStatus(tx.id, 'failed')" 
              class="btn btn-xs"
              :disabled="tx.status === 'confirmed' || tx.status === 'cancelled'"
              title="Mark as Failed"
            >
              ❌
            </button>
            <button 
              @click="removeTransaction(tx.id)" 
              class="btn btn-xs btn-danger"
              title="Remove"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reorder Mode -->
    <div class="reorder-section" v-if="transactions.length > 1">
      <h4>🔄 Reorder Queue</h4>
      <p class="hint">Drag and drop to reorder transactions (execution order)</p>
      <div class="reorder-buttons">
        <button @click="moveUp" class="btn btn-sm" :disabled="!canMoveUp">
          ⬆️ Move Up
        </button>
        <button @click="moveDown" class="btn btn-sm" :disabled="!canMoveDown">
          ⬇️ Move Down
        </button>
        <button @click="saveOrder" class="btn btn-sm btn-primary">
          💾 Save Order
        </button>
      </div>
    </div>

    <!-- Gas Estimation -->
    <div class="gas-estimate">
      <h4>⛽ Gas Estimation</h4>
      <div class="estimate-form">
        <input 
          v-model="estimateTo" 
          placeholder="Contract address" 
          class="input"
        />
        <input 
          v-model="estimateData" 
          placeholder="Call data (hex)" 
          class="input"
        />
        <button @click="estimateGas" class="btn btn-sm" :disabled="!estimateTo">
          📊 Estimate
        </button>
      </div>
      <div v-if="gasEstimate" class="estimate-result">
        <span>Estimated Gas: </span>
        <strong>{{ gasEstimate.toLocaleString() }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

interface TxItem {
  id: string;
  from: string;
  to: string;
  value: string;
  data: string;
  gasPrice: string;
  gasLimit: number;
  nonce: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed' | 'cancelled';
  chainId: number;
  hash?: string;
}

const { account, chainId } = useWeb3();

const loading = ref(false);
const transactions = ref<TxItem[]>([]);
const selectedIndex = ref(0);

// New transaction form
const newTx = ref({
  to: '',
  value: '',
  data: '0x',
  gasPrice: '',
  gasLimit: 21000,
});

// Gas estimation
const estimateTo = ref('');
const estimateData = ref('0x');
const gasEstimate = ref<number | null>(null);

// Computed
const pendingCount = computed(() => 
  transactions.value.filter(t => t.status === 'pending').length
);

const totalCount = computed(() => transactions.value.length);

const chainName = computed(() => {
  const names: Record<number, string> = {
    1: 'Ethereum',
    5: 'Goerli',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    56: 'BSC',
    8453: 'Base',
  };
  return names[chainId.value] || `Chain ${chainId.value}`;
});

const canAddTx = computed(() => 
  newTx.value.to && /^0x[a-fA-F0-9]{40}$/.test(newTx.value.to)
);

const canMoveUp = computed(() => selectedIndex.value > 0);
const canMoveDown = computed(() => selectedIndex.value < transactions.value.length - 1);

// Methods
async function refreshQueue() {
  if (!account.value) return;
  
  loading.value = true;
  try {
    const response = await fetch(
      `/api/web3/tx-queue/list/${account.value}?chainId=${chainId.value}`
    );
    const result = await response.json();
    if (result.success) {
      transactions.value = result.data || [];
    }
  } catch (error) {
    console.error('Failed to fetch queue:', error);
  } finally {
    loading.value = false;
  }
}

async function addTransaction() {
  if (!account.value || !canAddTx.value) return;
  
  const valueInWei = newTx.value.value 
    ? (parseFloat(newTx.value.value) * 1e18).toString()
    : '0';
  
  const gasPriceInWei = newTx.value.gasPrice
    ? (parseFloat(newTx.value.gasPrice) * 1e9).toString()
    : undefined;
  
  try {
    const response = await fetch('/api/web3/tx-queue/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: account.value,
        chainId: chainId.value,
        to: newTx.value.to,
        value: valueInWei,
        data: newTx.value.data,
        gasPrice: gasPriceInWei,
        gasLimit: newTx.value.gasLimit,
      }),
    });
    
    const result = await response.json();
    if (result.success) {
      transactions.value.push(result.data);
      // Reset form
      newTx.value = {
        to: '',
        value: '',
        data: '0x',
        gasPrice: '',
        gasLimit: 21000,
      };
    }
  } catch (error) {
    console.error('Failed to add transaction:', error);
  }
}

async function updateStatus(id: string, status: TxItem['status']) {
  try {
    const response = await fetch(`/api/web3/tx-queue/update/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    
    const result = await response.json();
    if (result.success) {
      const tx = transactions.value.find(t => t.id === id);
      if (tx) {
        tx.status = status;
      }
    }
  } catch (error) {
    console.error('Failed to update transaction:', error);
  }
}

async function removeTransaction(id: string) {
  try {
    const response = await fetch(`/api/web3/tx-queue/remove/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    if (result.success) {
      transactions.value = transactions.value.filter(t => t.id !== id);
    }
  } catch (error) {
    console.error('Failed to remove transaction:', error);
  }
}

async function clearQueue() {
  if (!account.value) return;
  
  if (!confirm('Clear all transactions from queue?')) return;
  
  try {
    const response = await fetch(
      `/api/web3/tx-queue/clear/${account.value}?chainId=${chainId.value}`,
      { method: 'POST' }
    );
    
    const result = await response.json();
    if (result.success) {
      transactions.value = [];
    }
  } catch (error) {
    console.error('Failed to clear queue:', error);
  }
}

function moveUp() {
  if (!canMoveUp.value) return;
  const temp = transactions.value[selectedIndex.value];
  transactions.value[selectedIndex.value] = transactions.value[selectedIndex.value - 1];
  transactions.value[selectedIndex.value - 1] = temp;
  selectedIndex.value--;
}

function moveDown() {
  if (!canMoveDown.value) return;
  const temp = transactions.value[selectedIndex.value];
  transactions.value[selectedIndex.value] = transactions.value[selectedIndex.value + 1];
  transactions.value[selectedIndex.value + 1] = temp;
  selectedIndex.value++;
}

async function saveOrder() {
  if (!account.value) return;
  
  const order = transactions.value.map(t => t.id);
  
  try {
    const response = await fetch('/api/web3/tx-queue/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: account.value,
        chainId: chainId.value,
        order,
      }),
    });
    
    const result = await response.json();
    if (result.success) {
      transactions.value = result.data;
    }
  } catch (error) {
    console.error('Failed to save order:', error);
  }
}

async function estimateGas() {
  if (!estimateTo.value) return;
  
  try {
    const response = await fetch(
      `/api/web3/tx-queue/estimate-gas?chainId=${chainId.value}&to=${estimateTo.value}&data=${estimateData.value}`
    );
    const result = await response.json();
    if (result.success) {
      gasEstimate.value = result.data.gasEstimate;
    }
  } catch (error) {
    console.error('Failed to estimate gas:', error);
  }
}

// Utility functions
function shortenAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatValue(wei: string): string {
  if (!wei) return '0';
  return (parseFloat(wei) / 1e18).toFixed(6);
}

function formatGas(wei: string): string {
  if (!wei) return '0';
  return (parseFloat(wei) / 1e9).toFixed(1);
}

// Lifecycle
onMounted(() => {
  if (account.value) {
    refreshQueue();
  }
});
</script>

<style scoped>
.tx-queue-manager {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h3 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 8px;
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: var(--bg-secondary, #f5f5f5);
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
}

.stat-value.pending {
  color: #f59e0b;
}

.add-form {
  background: var(--bg-secondary, #f5f5f5);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.add-form h4 {
  margin: 0 0 12px 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group label {
  font-size: 12px;
  margin-bottom: 4px;
  color: #666;
}

.input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.queue-list {
  margin-bottom: 16px;
}

.queue-list h4 {
  margin: 0 0 12px 0;
}

.tx-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tx-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 8px;
  border-left: 4px solid #ccc;
}

.tx-item.pending {
  border-left-color: #f59e0b;
}

.tx-item.submitted {
  border-left-color: #3b82f6;
}

.tx-item.confirmed {
  border-left-color: #10b981;
}

.tx-item.failed {
  border-left-color: #ef4444;
}

.tx-item.cancelled {
  border-left-color: #6b7280;
}

.tx-order {
  width: 24px;
  height: 24px;
  background: var(--bg-primary, #fff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.tx-details {
  flex: 1;
}

.tx-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.tx-label {
  color: #666;
}

.tx-value {
  font-family: monospace;
}

.tx-value.address {
  color: #3b82f6;
}

.tx-status {
  min-width: 80px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.submitted {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.confirmed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.tx-actions {
  display: flex;
  gap: 4px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.loading, .empty-state {
  text-align: center;
  padding: 24px;
  color: #666;
}

.hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.reorder-section {
  background: var(--bg-secondary, #f5f5f5);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.reorder-section h4 {
  margin: 0 0 8px 0;
}

.reorder-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.gas-estimate {
  background: var(--bg-secondary, #f5f5f5);
  padding: 16px;
  border-radius: 8px;
}

.gas-estimate h4 {
  margin: 0 0 12px 0;
}

.estimate-form {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.estimate-form .input {
  flex: 1;
}

.estimate-result {
  font-size: 14px;
}

.estimate-result strong {
  color: #3b82f6;
  font-size: 18px;
}
</style>
