<template>
  <div class="token-transfer-analyzer">
    <div class="header">
      <h2>🔄 Token Transfer Analyzer</h2>
      <div class="header-controls">
        <div class="network-select">
          <select v-model="selectedChain" @change="loadData">
            <option v-for="network in networks" :key="network.id" :value="network.id">
              {{ network.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="search-box">
      <input 
        v-model="searchAddress" 
        placeholder="Enter wallet address (0x...)" 
        @keyup.enter="loadData"
        class="address-input"
      />
      <button @click="loadData" :disabled="loading" class="analyze-btn">
        {{ loading ? 'Analyzing...' : 'Analyze' }}
      </button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <!-- Results Section -->
    <div v-if="data" class="results">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card received">
          <div class="stat-icon">📥</div>
          <div class="stat-content">
            <div class="stat-label">Total Received</div>
            <div class="stat-value">{{ formatValue(data.stats?.totalReceived) }} ETH</div>
          </div>
        </div>
        <div class="stat-card sent">
          <div class="stat-icon">📤</div>
          <div class="stat-content">
            <div class="stat-label">Total Sent</div>
            <div class="stat-value">{{ formatValue(data.stats?.totalSent) }} ETH</div>
          </div>
        </div>
        <div class="stat-card net" :class="netFlowClass">
          <div class="stat-icon">{{ netFlow >= 0 ? '📈' : '📉' }}</div>
          <div class="stat-content">
            <div class="stat-label">Net Flow</div>
            <div class="stat-value">{{ formatValue(data.stats?.netFlow) }} ETH</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔢</div>
          <div class="stat-content">
            <div class="stat-label">Transactions</div>
            <div class="stat-value">{{ data.stats?.transactionCount || 0 }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🪙</div>
          <div class="stat-content">
            <div class="stat-label">Unique Tokens</div>
            <div class="stat-value">{{ data.stats?.uniqueTokens || 0 }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">Avg Transfer</div>
            <div class="stat-value">{{ formatValue(data.stats?.averageTransfer) }} ETH</div>
          </div>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div v-if="data.riskAssessment" class="risk-card" :class="riskClass">
        <div class="risk-header">
          <span class="risk-icon">{{ riskIcon }}</span>
          <span class="risk-title">Risk Assessment</span>
          <span class="risk-score">Score: {{ data.riskAssessment.score }}/100</span>
        </div>
        <div class="risk-factors" v-if="data.riskAssessment.factors?.length">
          <span class="risk-factor" v-for="factor in data.riskAssessment.factors" :key="factor">
            {{ factor }}
          </span>
        </div>
        <div class="risk-level">Level: {{ data.riskAssessment.level?.toUpperCase() }}</div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <!-- Token Breakdown -->
      <div v-if="activeTab === 'tokens'" class="tokens-section">
        <h3>🪙 Token Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Symbol</th>
              <th>Received</th>
              <th>Sent</th>
              <th>Tx Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="token in data.tokenBreakdown" :key="token.token">
              <td class="token-address">{{ shortenAddress(token.token) }}</td>
              <td class="symbol">{{ token.symbol }}</td>
              <td class="received">{{ formatValue(token.received) }}</td>
              <td class="sent">{{ formatValue(token.sent) }}</td>
              <td>{{ token.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Transfers -->
      <div v-if="activeTab === 'transfers'" class="transfers-section">
        <h3>📜 Recent Transfers</h3>
        <div class="filter-row">
          <select v-model="transferFilter" @change="loadTransfers">
            <option value="all">All</option>
            <option value="in">Incoming</option>
            <option value="out">Outgoing</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Hash</th>
              <th>Direction</th>
              <th>Token</th>
              <th>Value</th>
              <th>From/To</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transfers" :key="tx.hash">
              <td class="hash">{{ shortenAddress(tx.hash) }}</td>
              <td :class="tx.direction">
                {{ tx.direction === 'in' ? '📥 In' : '📤 Out' }}
              </td>
              <td class="symbol">{{ tx.tokenSymbol }}</td>
              <td class="value">{{ formatValue(tx.value) }}</td>
              <td class="address">{{ shortenAddress(tx.direction === 'in' ? tx.from : tx.to) }}</td>
              <td class="time">{{ formatTime(tx.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Counterparties -->
      <div v-if="activeTab === 'counterparties'" class="counterparties-section">
        <h3>🤝 Top Counterparties</h3>
        <table>
          <thead>
            <tr>
              <th>Address</th>
              <th>Total Received</th>
              <th>Total Sent</th>
              <th>Tx Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="party in data.counterparties" :key="party.address">
              <td class="address">{{ shortenAddress(party.address) }}</td>
              <td class="received">{{ formatValue(party.totalReceived) }} ETH</td>
              <td class="sent">{{ formatValue(party.totalSent) }} ETH</td>
              <td>{{ party.transactionCount }}</td>
              <td>
                <button @click="searchAddress = party.address; loadData()" class="small-btn">
                  Analyze
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Time Distribution -->
      <div v-if="activeTab === 'time'" class="time-section">
        <h3>⏰ Transfer Time Distribution</h3>
        <div class="time-chart">
          <div 
            v-for="period in data.timeDistribution" 
            :key="period.period" 
            class="time-bar"
          >
            <div class="bar-label">{{ period.period }}</div>
            <div class="bar-container">
              <div class="bar" :style="{ width: getBarWidth(period.count) + '%' }"></div>
            </div>
            <div class="bar-value">{{ period.count }} tx</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Large Transfers Section -->
    <div class="large-transfers-section">
      <div class="section-header">
        <h3>🐋 Large Transfers on Network</h3>
        <button @click="loadLargeTransfers" :disabled="loadingLarge">
          {{ loadingLarge ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
      <div v-if="largeTransfers.length" class="large-tx-list">
        <div 
          v-for="tx in largeTransfers" 
          :key="tx.hash" 
          class="large-tx-card"
        >
          <div class="tx-hash">{{ shortenAddress(tx.hash) }}</div>
          <div class="tx-details">
            <span class="tx-token">{{ tx.tokenSymbol }}</span>
            <span class="tx-value">{{ formatValue(tx.value) }}</span>
          </div>
          <div class="tx-time">{{ formatTime(tx.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- Popular Tokens -->
    <div class="popular-tokens-section">
      <h3>🔥 Popular Tokens</h3>
      <div class="token-grid">
        <div 
          v-for="token in popularTokens" 
          :key="token.address" 
          class="token-card"
          @click="selectToken(token)"
        >
          <div class="token-symbol">{{ token.symbol }}</div>
          <div class="token-name">{{ token.name }}</div>
        </div>
      </div>
    </div>

    <!-- Top Transferrers -->
    <div class="top-transferrers-section">
      <div class="section-header">
        <h3>🏆 Top Transferrers (24h)</h3>
        <button @click="loadTopTransferrers" :disabled="loadingTop">
          {{ loadingTop ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
      <table v-if="topTransferrers.length">
        <thead>
          <tr>
            <th>#</th>
            <th>Address</th>
            <th>Label</th>
            <th>Volume (ETH)</th>
            <th>Tx Count</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in topTransferrers" :key="item.address">
            <td>{{ item.rank }}</td>
            <td class="address">{{ shortenAddress(item.address) }}</td>
            <td>{{ item.label }}</td>
            <td>{{ Number(item.volume).toFixed(2) }}</td>
            <td>{{ item.txCount }}</td>
            <td :class="item.type">{{ item.type }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const searchAddress = ref('');
const selectedChain = ref(1);
const loading = ref(false);
const loadingLarge = ref(false);
const loadingTop = ref(false);
const error = ref('');
const data = ref<any>(null);
const transfers = ref<any[]>([]);
const largeTransfers = ref<any[]>([]);
const topTransferrers = ref<any[]>([]);
const popularTokens = ref<any[]>([]);
const transferFilter = ref('all');
const activeTab = ref('tokens');

const networks = [
  { id: 1, name: 'Ethereum' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' },
  { id: 56, name: 'BSC' },
];

const tabs = [
  { id: 'tokens', label: 'Tokens', icon: '🪙' },
  { id: 'transfers', label: 'Transfers', icon: '📜' },
  { id: 'counterparties', label: 'Counterparties', icon: '🤝' },
  { id: 'time', label: 'Time', icon: '⏰' },
];

const netFlow = computed(() => {
  if (!data.value?.stats?.netFlow) return 0;
  return Number(data.value.stats.netFlow) / 1e18;
});

const netFlowClass = computed(() => ({
  positive: netFlow.value >= 0,
  negative: netFlow.value < 0,
}));

const riskClass = computed(() => {
  if (!data.value?.riskAssessment?.level) return '';
  return `risk-${data.value.riskAssessment.level}`;
});

const riskIcon = computed(() => {
  if (!data.value?.riskAssessment?.level) return '⚖️';
  const icons: Record<string, string> = {
    low: '✅',
    medium: '⚠️',
    high: '🚨',
  };
  return icons[data.value.riskAssessment.level] || '⚖️';
});

function shortenAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatValue(value: string | number): string {
  if (!value) return '0';
  const num = typeof value === 'string' ? Number(value) : value;
  if (num === 0) return '0';
  if (num < 0.0001) return num.toExponential(2);
  if (num >= 1e24) return (num / 1e24).toFixed(2) + 'M';
  if (num >= 1e21) return (num / 1e21).toFixed(2) + 'K';
  if (num >= 1e18) return (num / 1e18).toFixed(4);
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(4);
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 30) {
    return date.toLocaleDateString();
  } else if (days > 0) {
    return `${days}d ago`;
  } else {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  }
}

function getBarWidth(count: number): number {
  if (!data.value?.timeDistribution) return 0;
  const max = Math.max(...data.value.timeDistribution.map((p: any) => p.count));
  return max > 0 ? (count / max) * 100 : 0;
}

async function loadData() {
  if (!searchAddress.value) {
    error.value = 'Please enter an address';
    return;
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(searchAddress.value)) {
    error.value = 'Invalid address format';
    return;
  }

  loading.value = true;
  error.value = '';
  
  try {
    const response = await axios.get(`/api/token-transfer/analyze/${searchAddress.value}`, {
      params: { chainId: selectedChain.value },
    });
    data.value = response.data;
    transfers.value = response.data.transfers || [];
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
}

async function loadTransfers() {
  if (!searchAddress.value) return;
  
  try {
    const response = await axios.get(`/api/token-transfer/transfers/${searchAddress.value}`, {
      params: { 
        chainId: selectedChain.value,
        direction: transferFilter.value === 'all' ? undefined : transferFilter.value,
        limit: 50,
      },
    });
    transfers.value = response.data || [];
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load transfers';
  }
}

async function loadLargeTransfers() {
  loadingLarge.value = true;
  try {
    const response = await axios.get('/api/token-transfer/large-transfers', {
      params: { 
        chainId: selectedChain.value,
        minValue: 10000,
        limit: 10,
      },
    });
    largeTransfers.value = response.data || [];
  } catch (e: any) {
    error.value = 'Failed to load large transfers';
  } finally {
    loadingLarge.value = false;
  }
}

async function loadTopTransferrers() {
  loadingTop.value = true;
  try {
    const response = await axios.get('/api/token-transfer/top-transferrers', {
      params: { 
        chainId: selectedChain.value,
        timeRange: '24h',
        limit: 10,
      },
    });
    topTransferrers.value = response.data || [];
  } catch (e: any) {
    error.value = 'Failed to load top transferrers';
  } finally {
    loadingTop.value = false;
  }
}

async function loadPopularTokens() {
  try {
    const response = await axios.get('/api/token-transfer/tokens/popular', {
      params: { chainId: selectedChain.value },
    });
    popularTokens.value = response.data || [];
  } catch (e) {
    console.error('Failed to load popular tokens');
  }
}

function selectToken(token: any) {
  // Could add token filtering functionality
  console.log('Selected token:', token);
}

onMounted(() => {
  loadLargeTransfers();
  loadTopTransferrers();
  loadPopularTokens();
});
</script>

<style scoped>
.token-transfer-analyzer {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #fff;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.network-select select {
  padding: 8px 12px;
  border-radius: 8px;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  background: #1a1a1a;
  color: #fff;
  border: 1px solid #333;
  font-size: 14px;
}

.address-input:focus {
  outline: none;
  border-color: #4a9eff;
}

.analyze-btn {
  padding: 12px 24px;
  border-radius: 8px;
  background: #4a9eff;
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  background: #3a8eef;
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  background: #ff4444;
  color: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid #333;
}

.stat-card.received {
  border-left: 4px solid #4caf50;
}

.stat-card.sent {
  border-left: 4px solid #f44336;
}

.stat-card.net.positive {
  border-left: 4px solid #4caf50;
}

.stat-card.net.negative {
  border-left: 4px solid #f44336;
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.risk-card {
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #333;
}

.risk-card.risk-low {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4caf50;
}

.risk-card.risk-medium {
  background: rgba(255, 152, 0, 0.1);
  border-color: #ff9800;
}

.risk-card.risk-high {
  background: rgba(244, 67, 54, 0.1);
  border-color: #f44336;
}

.risk-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.risk-icon {
  font-size: 20px;
}

.risk-title {
  font-weight: 600;
  color: #fff;
}

.risk-score {
  margin-left: auto;
  color: #888;
}

.risk-factors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.risk-factor {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 12px;
  color: #ccc;
}

.risk-level {
  color: #888;
  font-size: 14px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}

.tabs button {
  padding: 10px 16px;
  border-radius: 8px;
  background: transparent;
  color: #888;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.tabs button.active {
  background: #4a9eff;
  color: #fff;
}

.tabs button:hover:not(.active) {
  background: rgba(74, 158, 255, 0.1);
}

.tokens-section table,
.transfers-section table,
.counterparties-section table,
.top-transferrers-section table {
  width: 100%;
  border-collapse: collapse;
}

.tokens-section th,
.transfers-section th,
.counterparties-section th,
.top-transferrers-section th {
  text-align: left;
  padding: 12px;
  color: #888;
  font-weight: 500;
  border-bottom: 1px solid #333;
}

.tokens-section td,
.transfers-section td,
.counterparties-section td,
.top-transferrers-section td {
  padding: 12px;
  color: #fff;
  border-bottom: 1px solid #2a2a2a;
}

.token-address,
.hash,
.address {
  font-family: monospace;
  color: #4a9eff;
}

.symbol {
  font-weight: 600;
}

.received {
  color: #4caf50;
}

.sent {
  color: #f44336;
}

.value {
  font-weight: 600;
}

.time {
  color: #888;
  font-size: 13px;
}

.filter-row {
  margin-bottom: 16px;
}

.filter-row select {
  padding: 8px 12px;
  background: #1a1a1a;
  color: #fff;
  border: 1px solid #333;
  border-radius: 6px;
}

.small-btn {
  padding: 6px 12px;
  background: #4a9eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.small-btn:hover {
  background: #3a8eef;
}

.time-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.time-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 60px;
  color: #888;
  font-size: 13px;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: #1a1a1a;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #4a9eff, #7c4dff);
  transition: width 0.3s ease;
}

.bar-value {
  width: 60px;
  text-align: right;
  color: #888;
  font-size: 13px;
}

.large-transfers-section,
.popular-tokens-section,
.top-transferrers-section {
  margin-top: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  color: #fff;
}

.section-header button {
  padding: 8px 16px;
  background: #2a2a2a;
  color: #fff;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
}

.section-header button:hover:not(:disabled) {
  background: #3a3a3a;
}

.large-tx-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.large-tx-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
}

.tx-hash {
  font-family: monospace;
  color: #4a9eff;
}

.tx-details {
  flex: 1;
  display: flex;
  gap: 12px;
}

.tx-token {
  color: #888;
}

.tx-value {
  color: #fff;
  font-weight: 600;
}

.tx-time {
  color: #666;
  font-size: 13px;
}

.token-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.token-card {
  padding: 16px;
  background: #1a1a1a;
  border-radius: 8px;
  border: 1px solid #333;
  cursor: pointer;
  transition: all 0.2s;
}

.token-card:hover {
  border-color: #4a9eff;
  transform: translateY(-2px);
}

.token-symbol {
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.token-name {
  font-size: 12px;
  color: #888;
}

.exchange {
  color: #4caf50;
}

.whale {
  color: #ff9800;
}
</style>
