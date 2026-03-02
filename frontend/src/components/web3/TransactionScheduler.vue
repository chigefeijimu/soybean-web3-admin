<template>
  <div class="transaction-scheduler">
    <div class="header">
      <h2>Transaction Scheduler ⏰</h2>
      <p class="subtitle">Schedule transactions to execute at optimal times or when conditions are met</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="stat-card executed">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ executedCount }}</div>
          <div class="stat-label">Executed</div>
        </div>
      </div>
      <div class="stat-card cancelled">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-value">{{ cancelledCount }}</div>
          <div class="stat-label">Cancelled</div>
        </div>
      </div>
      <div class="stat-card gas">
        <div class="stat-icon">⛽</div>
        <div class="stat-content">
          <div class="stat-value">{{ currentGas }}</div>
          <div class="stat-label">Current Gas</div>
        </div>
      </div>
    </div>

    <!-- Schedule Form -->
    <div class="card schedule-form">
      <h3>📅 Schedule New Transaction</h3>
      
      <div class="form-grid">
        <div class="form-group">
          <label>Chain</label>
          <select v-model="form.chainId">
            <option :value="1">Ethereum</option>
            <option :value="137">Polygon</option>
            <option :value="42161">Arbitrum</option>
            <option :value="10">Optimism</option>
            <option :value="56">BSC</option>
            <option :value="8453">Base</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Schedule Type</label>
          <select v-model="form.scheduleType" @change="onScheduleTypeChange">
            <option value="time">⏰ Time Based</option>
            <option value="gas">⛽ Gas Price Based</option>
            <option value="price">💰 Token Price Based</option>
          </select>
        </div>

        <div class="form-group" v-if="form.scheduleType === 'time'">
          <label>Execute At</label>
          <input type="datetime-local" v-model="form.scheduledFor" />
        </div>

        <div class="form-group" v-if="form.scheduleType === 'gas'">
          <label>Gas Price Threshold (Gwei)</label>
          <input type="number" v-model="form.gasPriceThreshold" placeholder="e.g., 30" />
        </div>

        <div class="form-group" v-if="form.scheduleType === 'price'">
          <label>Token Address</label>
          <input type="text" v-model="form.tokenAddress" placeholder="0x..." />
        </div>

        <div class="form-group" v-if="form.scheduleType === 'price'">
          <label>Target Price (USD)</label>
          <input type="number" v-model="form.targetPrice" placeholder="e.g., 2000" />
        </div>

        <div class="form-group">
          <label>To Address</label>
          <input type="text" v-model="form.to" placeholder="0x..." />
        </div>

        <div class="form-group">
          <label>Value (ETH)</label>
          <input type="number" v-model="form.value" placeholder="0.0" step="0.001" />
        </div>

        <div class="form-group full-width">
          <label>Data (Optional)</label>
          <input type="text" v-model="form.data" placeholder="0x..." />
        </div>
      </div>

      <button class="btn-primary" @click="scheduleTransaction" :disabled="!canSubmit">
        🚀 Schedule Transaction
      </button>
    </div>

    <!-- Gas Recommendations -->
    <div class="card gas-recommendations" v-if="gasRecommendations">
      <h3>⛽ Gas Price Recommendations</h3>
      <div class="gas-options">
        <div class="gas-option slow">
          <span class="label">🐢 Slow</span>
          <span class="value">{{ gasRecommendations.slow }}</span>
        </div>
        <div class="gas-option normal">
          <span class="label">🚶 Normal</span>
          <span class="value">{{ gasRecommendations.normal }}</span>
        </div>
        <div class="gas-option fast">
          <span class="label">🏃 Fast</span>
          <span class="value">{{ gasRecommendations.fast }}</span>
        </div>
        <div class="gas-option recommended">
          <span class="label">⭐ Recommended</span>
          <span class="value">{{ gasRecommendations.recommended }}</span>
        </div>
      </div>
    </div>

    <!-- Scheduled Transactions List -->
    <div class="card transactions-list">
      <div class="list-header">
        <h3>📋 Scheduled Transactions</h3>
        <div class="filter-buttons">
          <button 
            v-for="status in ['all', 'pending', 'executed', 'cancelled']" 
            :key="status"
            :class="['filter-btn', { active: filter === status }]"
            @click="filter = status"
          >
            {{ status === 'all' ? 'All' : status }}
          </button>
        </div>
      </div>

      <div class="transactions-table" v-if="filteredTransactions.length > 0">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>To</th>
              <th>Value</th>
              <th>Condition</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in filteredTransactions" :key="tx.id">
              <td>
                <span class="type-badge" :class="tx.scheduleType">
                  {{ tx.scheduleType === 'time' ? '⏰' : tx.scheduleType === 'gas' ? '⛽' : '💰' }}
                  {{ tx.scheduleType }}
                </span>
              </td>
              <td class="address-cell">
                <span class="address">{{ shortAddress(tx.to) }}</span>
              </td>
              <td>{{ tx.value }} ETH</td>
              <td>
                <span v-if="tx.scheduleType === 'time'">
                  {{ formatDate(tx.scheduledFor) }}
                </span>
                <span v-else-if="tx.scheduleType === 'gas'">
                  &lt; {{ tx.gasPriceThreshold }} gwei
                </span>
                <span v-else>
                  {{ tx.tokenAddress ? shortAddress(tx.tokenAddress) : 'N/A' }} &gt; ${{ tx.targetPrice }}
                </span>
              </td>
              <td>
                <span class="status-badge" :class="tx.status">
                  {{ tx.status }}
                </span>
              </td>
              <td>{{ formatDate(tx.createdAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button 
                    v-if="tx.status === 'pending'"
                    class="btn-small execute"
                    @click="executeNow(tx.id)"
                    title="Execute Now"
                  >
                    ⚡
                  </button>
                  <button 
                    v-if="tx.status === 'pending'"
                    class="btn-small cancel"
                    @click="cancelTransaction(tx.id)"
                    title="Cancel"
                  >
                    ❌
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" v-else>
        <p>No scheduled transactions found</p>
        <p class="hint">Schedule your first transaction above!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMessage } from 'naive-ui';

const message = useMessage();

interface ScheduledTransaction {
  id: string;
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: number;
  scheduleType: 'time' | 'gas' | 'price';
  scheduledFor: number;
  gasPriceThreshold?: string;
  tokenAddress?: string;
  targetPrice?: string;
  status: 'pending' | 'executed' | 'cancelled' | 'failed';
  txHash?: string;
  createdAt: Date;
  executedAt?: Date;
}

const form = ref({
  chainId: 1,
  scheduleType: 'time' as 'time' | 'gas' | 'price',
  scheduledFor: '',
  gasPriceThreshold: '',
  tokenAddress: '',
  targetPrice: '',
  to: '',
  value: '',
  data: '0x',
});

const transactions = ref<ScheduledTransaction[]>([]);
const filter = ref('all');
const gasRecommendations = ref<any>(null);
const currentGas = ref('35 gwei');

const pendingCount = computed(() => transactions.value.filter(t => t.status === 'pending').length);
const executedCount = computed(() => transactions.value.filter(t => t.status === 'executed').length);
const cancelledCount = computed(() => transactions.value.filter(t => t.status === 'cancelled').length);

const canSubmit = computed(() => {
  if (!form.value.to) return false;
  if (form.value.scheduleType === 'time' && !form.value.scheduledFor) return false;
  if (form.value.scheduleType === 'gas' && !form.value.gasPriceThreshold) return false;
  if (form.value.scheduleType === 'price' && (!form.value.tokenAddress || !form.value.targetPrice)) return false;
  return true;
});

const filteredTransactions = computed(() => {
  if (filter.value === 'all') return transactions.value;
  return transactions.value.filter(t => t.status === filter.value);
});

const onScheduleTypeChange = () => {
  // Reset relevant fields when type changes
  if (form.value.scheduleType !== 'time') {
    form.value.scheduledFor = '';
  }
  if (form.value.scheduleType !== 'gas') {
    form.value.gasPriceThreshold = '';
  }
  if (form.value.scheduleType !== 'price') {
    form.value.tokenAddress = '';
    form.value.targetPrice = '';
  }
};

const loadTransactions = async () => {
  try {
    const response = await fetch('/api/web3/transaction-scheduler/list');
    const result = await response.json();
    if (result.success) {
      transactions.value = result.data;
    }
  } catch (error) {
    console.error('Failed to load transactions:', error);
    // Demo data
    transactions.value = [
      {
        id: 'sched_1',
        from: '0x1234...',
        to: '0xABCD...',
        value: '0.1',
        data: '0x',
        chainId: 1,
        scheduleType: 'time',
        scheduledFor: Date.now() + 3600000,
        status: 'pending',
        createdAt: new Date(),
      },
      {
        id: 'sched_2',
        from: '0x1234...',
        to: '0xDEFG...',
        value: '0.5',
        data: '0x',
        chainId: 137,
        scheduleType: 'gas',
        gasPriceThreshold: '30',
        status: 'executed',
        createdAt: new Date(Date.now() - 86400000),
        executedAt: new Date(),
      },
    ];
  }
};

const loadGasRecommendations = async () => {
  try {
    const response = await fetch('/api/web3/transaction-scheduler/gas/recommendations?chainId=1');
    const result = await response.json();
    if (result.success) {
      gasRecommendations.value = result.data;
    }
  } catch (error) {
    console.error('Failed to load gas recommendations:', error);
    gasRecommendations.value = {
      slow: '20 gwei',
      normal: '35 gwei',
      fast: '50 gwei',
      recommended: '30 gwei',
    };
  }
};

const scheduleTransaction = async () => {
  try {
    const payload = {
      ...form.value,
      scheduledFor: form.value.scheduledFor ? new Date(form.value.scheduledFor).getTime() : Date.now() + 3600000,
    };
    
    const response = await fetch('/api/web3/transaction-scheduler/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    if (result.success) {
      transactions.value.unshift(result.data);
      message.success('Transaction scheduled successfully!');
      // Reset form
      form.value.to = '';
      form.value.value = '';
      form.value.data = '0x';
    }
  } catch (error) {
    console.error('Failed to schedule transaction:', error);
    // Demo: add locally
    const newTx: ScheduledTransaction = {
      id: `sched_${Date.now()}`,
      from: '0xMyAddress...',
      to: form.value.to,
      value: form.value.value,
      data: form.value.data,
      chainId: form.value.chainId,
      scheduleType: form.value.scheduleType,
      scheduledFor: form.value.scheduledFor ? new Date(form.value.scheduledFor).getTime() : Date.now() + 3600000,
      gasPriceThreshold: form.value.gasPriceThreshold,
      tokenAddress: form.value.tokenAddress,
      targetPrice: form.value.targetPrice,
      status: 'pending',
      createdAt: new Date(),
    };
    transactions.value.unshift(newTx);
    message.success('Transaction scheduled (demo mode)!');
  }
};

const executeNow = async (id: string) => {
  try {
    const response = await fetch(`/api/web3/transaction-scheduler/execute/${id}`, {
      method: 'POST',
    });
    const result = await response.json();
    if (result.success) {
      const index = transactions.value.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions.value[index] = result.data;
      }
      message.success('Transaction executed!');
    }
  } catch (error) {
    // Demo
    const index = transactions.value.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions.value[index].status = 'executed';
      transactions.value[index].executedAt = new Date();
      transactions.value[index].txHash = '0x' + Math.random().toString(36).substr(2, 64);
    }
    message.success('Transaction executed (demo)!');
  }
};

const cancelTransaction = async (id: string) => {
  try {
    const response = await fetch(`/api/web3/transaction-scheduler/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (result.success) {
      const index = transactions.value.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions.value[index].status = 'cancelled';
      }
      message.success('Transaction cancelled!');
    }
  } catch (error) {
    // Demo
    const index = transactions.value.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions.value[index].status = 'cancelled';
    }
    message.success('Transaction cancelled (demo)!');
  }
};

const shortAddress = (addr: string) => {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};

const formatDate = (date: Date | number) => {
  const d = new Date(date);
  return d.toLocaleString();
};

onMounted(() => {
  loadTransactions();
  loadGasRecommendations();
});
</script>

<style scoped>
.transaction-scheduler {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #fff;
}

.subtitle {
  color: #888;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.stat-label {
  color: #888;
  font-size: 12px;
}

.card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.card h3 {
  margin: 0 0 16px 0;
  color: #fff;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  color: #aaa;
  font-size: 12px;
}

.form-group input,
.form-group select {
  background: #0f0f23;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px;
  color: #fff;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gas-recommendations .gas-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.gas-option {
  background: #0f0f23;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.gas-option .label {
  color: #888;
  font-size: 12px;
}

.gas-option .value {
  color: #fff;
  font-weight: bold;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  background: #0f0f23;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 6px 12px;
  color: #888;
  cursor: pointer;
  text-transform: capitalize;
}

.filter-btn.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.transactions-table {
  overflow-x: auto;
}

.transactions-table table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th,
.transactions-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #333;
}

.transactions-table th {
  color: #888;
  font-weight: 500;
  font-size: 12px;
}

.transactions-table td {
  color: #fff;
}

.address-cell .address {
  font-family: monospace;
  color: #667eea;
}

.type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.type-badge.time {
  background: #3b82f6;
}

.type-badge.gas {
  background: #f59e0b;
}

.type-badge.price {
  background: #10b981;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.status-badge.pending {
  background: #f59e0b;
}

.status-badge.executed {
  background: #10b981;
}

.status-badge.cancelled {
  background: #ef4444;
}

.status-badge.failed {
  background: #dc2626;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-small {
  background: #0f0f23;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-small.execute:hover {
  background: #10b981;
}

.btn-small.cancel:hover {
  background: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #888;
}

.empty-state .hint {
  font-size: 14px;
}
</style>
