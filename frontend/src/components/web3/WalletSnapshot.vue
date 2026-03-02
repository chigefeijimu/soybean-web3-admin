<template>
  <div class="wallet-snapshot">
    <div class="header">
      <h2>Wallet Snapshot 📸</h2>
      <p class="subtitle">Save and compare wallet portfolio snapshots over time</p>
    </div>

    <!-- Address Input -->
    <div class="card">
      <h3>Wallet Address</h3>
      <div class="address-input">
        <input 
          v-model="walletAddress" 
          placeholder="Enter wallet address (0x...)" 
          class="address-field"
        />
        <button class="load-btn" @click="loadSnapshots" :disabled="!walletAddress">
          Load Snapshots
        </button>
      </div>
    </div>

    <!-- Current Portfolio Snapshot -->
    <div class="card" v-if="walletAddress">
      <h3>Take Snapshot</h3>
      <p class="hint">Save current portfolio state for future comparison</p>
      <div class="snapshot-actions">
        <button class="snapshot-btn" @click="takeSnapshot" :disabled="loading">
          📸 Take Snapshot
        </button>
        <span class="snapshot-count" v-if="snapshots.length">
          {{ snapshots.length }} snapshots saved
        </span>
      </div>
    </div>

    <!-- Snapshot List -->
    <div class="card" v-if="snapshots.length">
      <h3>Snapshot History</h3>
      <div class="snapshot-list">
        <div 
          v-for="(snap, index) in snapshots" 
          :key="index"
          class="snapshot-item"
          :class="{ selected: selectedSnapshot === index }"
          @click="selectSnapshot(index)"
        >
          <div class="snap-date">{{ formatDate(snap.timestamp) }}</div>
          <div class="snap-value">${{ formatNumber(snap.totalValue) }}</div>
          <div class="snap-tokens">{{ snap.tokens?.length || 0 }} tokens</div>
        </div>
      </div>
    </div>

    <!-- Compare Snapshots -->
    <div class="card" v-if="snapshots.length >= 2">
      <h3>Compare Snapshots</h3>
      <div class="compare-form">
        <select v-model="compareStart">
          <option :value="snapshots.length - 2">Older: {{ formatDate(snapshots[snapshots.length - 2]?.timestamp) }}</option>
          <option v-for="(snap, i) in snapshots.slice(0, -1)" :key="i" :value="i">
            {{ formatDate(snap.timestamp) }} - ${{ formatNumber(snap.totalValue) }}
          </option>
        </select>
        <span class="vs">vs</span>
        <select v-model="compareEnd">
          <option :value="snapshots.length - 1">Newer: {{ formatDate(snapshots[snapshots.length - 1]?.timestamp) }}</option>
          <option v-for="(snap, i) in snapshots" :key="i" :value="i">
            {{ formatDate(snap.timestamp) }} - ${{ formatNumber(snap.totalValue) }}
          </option>
        </select>
        <button class="compare-btn" @click="compareSnapshots">
          Compare
        </button>
      </div>
    </div>

    <!-- Comparison Result -->
    <div class="card" v-if="comparison">
      <h3>Comparison Result</h3>
      <div class="comparison-summary">
        <div class="summary-item">
          <span class="label">Value Change</span>
          <span :class="['value', comparison.change.value >= 0 ? 'positive' : 'negative']">
            {{ comparison.change.value >= 0 ? '+' : '' }}${{ formatNumber(comparison.change.value) }}
            ({{ comparison.change.percent }}%)
          </span>
        </div>
        <div class="summary-item">
          <span class="label">Period</span>
          <span class="value">{{ comparison.daysDiff }} days</span>
        </div>
      </div>

      <!-- Token Changes -->
      <div class="changes-section" v-if="comparison.tokenChanges?.length">
        <h4>Token Changes</h4>
        <div class="changes-list">
          <div 
            v-for="(change, i) in comparison.tokenChanges" 
            :key="i"
            class="change-item"
            :class="change.change"
          >
            <span class="symbol">{{ change.symbol }}</span>
            <span class="change-type">{{ formatChangeType(change.change) }}</span>
            <span class="change-value" :class="change.value >= 0 ? 'positive' : 'negative'">
              {{ change.value >= 0 ? '+' : '' }}{{ change.value >= 0 ? '$' : '-$' }}{{ formatNumber(Math.abs(change.value)) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Portfolio History Chart -->
    <div class="card" v-if="history">
      <h3>Portfolio History</h3>
      <div class="history-stats">
        <div class="stat">
          <span class="stat-label">Current</span>
          <span class="stat-value">${{ formatNumber(history.metrics?.current || 0) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Max</span>
          <span class="stat-value positive">${{ formatNumber(history.metrics?.max || 0) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Min</span>
          <span class="stat-value negative">${{ formatNumber(history.metrics?.min || 0) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Change</span>
          <span class="stat-value" :class="parseFloat(history.metrics?.periodChange || 0) >= 0 ? 'positive' : 'negative'">
            {{ history.metrics?.periodChange || 0 }}%
          </span>
        </div>
        <div class="stat">
          <span class="stat-label">Volatility</span>
          <span class="stat-value">{{ history.metrics?.volatility || 0 }}%</span>
        </div>
      </div>
      
      <!-- Simple Chart -->
      <div class="chart-container">
        <div class="chart">
          <div 
            v-for="(point, i) in history.history" 
            :key="i"
            class="chart-bar"
            :style="{ height: getBarHeight(point.totalValue) + '%' }"
            :title="`${point.date}: $${formatNumber(point.totalValue)}`"
          ></div>
        </div>
        <div class="chart-labels">
          <span>{{ history.history[0]?.date }}</span>
          <span>{{ history.history[history.history.length - 1]?.date }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading" v-if="loading">
      Loading...
    </div>

    <!-- Empty State -->
    <div class="empty-state" v-if="!loading && walletAddress && !snapshots.length">
      <p>No snapshots found. Take a snapshot to start tracking!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';

const walletAddress = ref('');
const loading = ref(false);
const snapshots = ref<any[]>([]);
const selectedSnapshot = ref<number | null>(null);
const comparison = ref<any>(null);
const history = ref<any>(null);
const compareStart = ref(0);
const compareEnd = ref(1);

const formatNumber = (num: number) => {
  if (!num) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatChangeType = (type: string) => {
  const types: Record<string, string> = {
    'new': '🆕 New',
    'removed': '❌ Removed',
    'increased': '📈 Increased',
    'decreased': '📉 Decreased',
  };
  return types[type] || type;
};

const loadSnapshots = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  try {
    const res = await axios.get(`/api/web3/wallet-snapshot/list/${walletAddress.value}`, { params: { limit: 20 } });
    snapshots.value = res.data.snapshots || [];
    
    if (snapshots.value.length > 0) {
      compareEnd.value = snapshots.value.length - 1;
      compareStart.value = Math.max(0, snapshots.value.length - 2);
      await loadHistory();
    }
  } catch (e) {
    console.error('Failed to load snapshots:', e);
    snapshots.value = [];
  }
  loading.value = false;
};

const takeSnapshot = async () => {
  if (!walletAddress.value) return;
  
  loading.value = true;
  try {
    // Get current portfolio data - this would normally come from an API
    const snapshotData = {
      address: walletAddress.value,
      timestamp: Date.now(),
      totalValue: Math.random() * 100000, // Mock data - would be real portfolio value
      chain: 'Ethereum',
      tokens: [
        { symbol: 'ETH', address: '0x000...', balance: 10, value: 30000, chain: 'Ethereum' },
        { symbol: 'USDC', address: '0x000...', balance: 50000, value: 50000, chain: 'Ethereum' },
      ],
      nfts: [],
    };
    
    await axios.post('/api/web3/wallet-snapshot/save', snapshotData);
    await loadSnapshots();
  } catch (e) {
    console.error('Failed to take snapshot:', e);
  }
  loading.value = false;
};

const selectSnapshot = (index: number) => {
  selectedSnapshot.value = index;
};

const compareSnapshots = async () => {
  if (!walletAddress.value || compareStart.value === compareEnd.value) return;
  
  loading.value = true;
  try {
    comparison.value = await axios.get(`/api/web3/wallet-snapshot/compare`, {
      params: {
        address: walletAddress.value,
        startIndex: compareStart.value,
        endIndex: compareEnd.value,
      }
    });
  } catch (e) {
    console.error('Failed to compare snapshots:', e);
  }
  loading.value = false;
};

const loadHistory = async () => {
  if (!walletAddress.value) return;
  
  try {
    history.value = await axios.get(`/api/web3/wallet-snapshot/history/${walletAddress.value}`, { params: { days: 30 } });
  } catch (e) {
    console.error('Failed to load history:', e);
  }
};

const getBarHeight = (value: number) => {
  if (!history.value?.metrics?.max) return 0;
  return (value / history.value.metrics.max) * 100;
};
</script>

<style scoped>
.wallet-snapshot {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #333;
}

.subtitle {
  color: #666;
  margin: 0;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.card h4 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: #555;
}

.hint {
  color: #888;
  font-size: 14px;
  margin-bottom: 16px;
}

.address-input {
  display: flex;
  gap: 12px;
}

.address-field {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.load-btn, .snapshot-btn, .compare-btn {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.load-btn:hover, .snapshot-btn:hover, .compare-btn:hover {
  background: #4338ca;
}

.load-btn:disabled, .snapshot-btn:disabled, .compare-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.snapshot-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.snapshot-count {
  color: #666;
  font-size: 14px;
}

.snapshot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.snapshot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.snapshot-item:hover {
  background: #f0f0f5;
}

.snapshot-item.selected {
  background: #e8eaf6;
  border: 1px solid #4f46e5;
}

.snap-date {
  font-size: 14px;
  color: #333;
}

.snap-value {
  font-size: 16px;
  font-weight: 600;
  color: #4f46e5;
}

.snap-tokens {
  font-size: 12px;
  color: #888;
}

.compare-form {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.compare-form select {
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
}

.vs {
  color: #888;
  font-weight: 500;
}

.comparison-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item .label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
}

.summary-item .value {
  font-size: 18px;
  font-weight: 600;
}

.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #f8f9fa;
  border-radius: 8px;
}

.change-item .symbol {
  font-weight: 600;
  min-width: 60px;
}

.change-item .change-type {
  flex: 1;
  font-size: 14px;
}

.change-item .change-value {
  font-weight: 500;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.chart-container {
  margin-top: 20px;
}

.chart {
  display: flex;
  align-items: flex-end;
  height: 120px;
  gap: 4px;
  padding: 10px 0;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #4f46e5, #7c3aed);
  border-radius: 4px 4px 0 0;
  min-width: 8px;
  transition: height 0.3s ease;
}

.chart-bar:hover {
  background: linear-gradient(to top, #4338ca, #6d28d9);
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #888;
  margin-top: 8px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #888;
}
</style>
