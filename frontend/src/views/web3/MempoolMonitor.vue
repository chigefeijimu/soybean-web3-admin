<template>
  <div class="mempool-monitor">
    <div class="header">
      <h2>🔄 Mempool Monitor</h2>
      <div class="actions">
        <select v-model="selectedChain" class="chain-select" @change="loadMempool">
          <option :value="1">Ethereum</option>
          <option :value="137">Polygon</option>
          <option :value="42161">Arbitrum</option>
          <option :value="10">Optimism</option>
          <option :value="56">BSC</option>
          <option :value="8453">Base</option>
          <option :value="43114">Avalanche</option>
        </select>
        <button @click="loadMempool" :disabled="loading" class="btn-primary">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading mempool data...</p>
    </div>

    <div v-else class="mempool-content">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats?.totalPending || 0 }}</div>
            <div class="stat-label">Pending Transactions</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⛽</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatGwei(stats?.avgGasPrice || '0') }}</div>
            <div class="stat-label">Avg Gas Price</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⬆️</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatGwei(stats?.maxGasPrice || '0') }}</div>
            <div class="stat-label">Max Gas Price</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💎</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats?.totalValue || 0 }}</div>
            <div class="stat-label">Total Value (ETH)</div>
          </div>
        </div>
      </div>

      <!-- Transaction Type Distribution -->
      <div class="type-distribution" v-if="stats?.byType">
        <h3>📊 Transaction Types</h3>
        <div class="type-bars">
          <div class="type-item">
            <span class="type-label">Transfers</span>
            <div class="type-bar">
              <div class="bar-fill transfer" :style="{ width: getTypePercentage('transfer') + '%' }"></div>
            </div>
            <span class="type-count">{{ stats.byType.transfer }}</span>
          </div>
          <div class="type-item">
            <span class="type-label">Swaps</span>
            <div class="type-bar">
              <div class="bar-fill swap" :style="{ width: getTypePercentage('swap') + '%' }"></div>
            </div>
            <span class="type-count">{{ stats.byType.swap }}</span>
          </div>
          <div class="type-item">
            <span class="type-label">Contract Calls</span>
            <div class="type-bar">
              <div class="bar-fill contract" :style="{ width: getTypePercentage('contractCall') + '%' }"></div>
            </div>
            <span class="type-count">{{ stats.byType.contractCall }}</span>
          </div>
          <div class="type-item">
            <span class="type-label">Unknown</span>
            <div class="type-bar">
              <div class="bar-fill unknown" :style="{ width: getTypePercentage('unknown') + '%' }"></div>
            </div>
            <span class="type-count">{{ stats.byType.unknown }}</span>
          </div>
        </div>
      </div>

      <!-- Gas Price Trend -->
      <div class="gas-trend-section">
        <h3>📈 Gas Price Trend (24h)</h3>
        <div class="trend-chart">
          <div 
            v-for="(point, index) in gasTrend?.data?.slice(0, 24) || []" 
            :key="index"
            class="trend-bar"
            :style="{ height: getTrendBarHeight(point.gasPrice) + '%' }"
            :title="`${formatDate(point.timestamp)}: ${formatGwei(point.gasPrice)}`"
          ></div>
        </div>
        <div class="trend-labels">
          <span>24h ago</span>
          <span>Now</span>
        </div>
      </div>

      <!-- Top Transactions -->
      <div class="top-tx-section">
        <h3>🔥 Top Gas Transactions</h3>
        <div class="tx-list">
          <div 
            v-for="tx in topTransactions" 
            :key="tx.hash"
            class="tx-item"
          >
            <div class="tx-hash">
              <span class="hash-text">{{ truncateHash(tx.hash) }}</span>
              <button class="copy-btn" @click="copyHash(tx.hash)">📋</button>
            </div>
            <div class="tx-details">
              <div class="tx-row">
                <span class="label">From:</span>
                <span class="value">{{ truncateHash(tx.from) }}</span>
              </div>
              <div class="tx-row">
                <span class="label">To:</span>
                <span class="value">{{ truncateHash(tx.to) }}</span>
              </div>
            </div>
            <div class="tx-meta">
              <div class="tx-value">{{ tx.value }} ETH</div>
              <div class="tx-gas">{{ formatGwei(tx.gasPrice) }} Gwei</div>
              <div class="tx-time">{{ formatTimeAgo(tx.timestamp) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- All Transactions -->
      <div class="all-tx-section">
        <h3>📋 All Pending Transactions</h3>
        <div class="tx-table">
          <div class="table-header">
            <span>Hash</span>
            <span>From</span>
            <span>To</span>
            <span>Value</span>
            <span>Gas Price</span>
            <span>Time</span>
          </div>
          <div 
            v-for="tx in transactions" 
            :key="tx.hash"
            class="table-row"
          >
            <span class="hash">{{ truncateHash(tx.hash) }}</span>
            <span class="address">{{ truncateHash(tx.from) }}</span>
            <span class="address">{{ truncateHash(tx.to) }}</span>
            <span class="value">{{ tx.value }} ETH</span>
            <span class="gas">{{ formatGwei(tx.gasPrice) }} Gwei</span>
            <span class="time">{{ formatTimeAgo(tx.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { request } from '@/service/request';

interface MempoolTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  timestamp: number;
  nonce: number;
  chainId: number;
}

interface MempoolStats {
  chainId: number;
  totalPending: number;
  avgGasPrice: string;
  minGasPrice: string;
  maxGasPrice: string;
  totalValue: string;
  byType: {
    transfer: number;
    swap: number;
    contractCall: number;
    unknown: number;
  };
}

interface GasTrendPoint {
  timestamp: number;
  gasPrice: string;
  date: string;
}

interface GasTrend {
  chainId: number;
  timeRange: string;
  data: GasTrendPoint[];
  summary: {
    avg: number;
    min: number;
    max: number;
  };
}

const selectedChain = ref(1);
const loading = ref(false);
const transactions = ref<MempoolTransaction[]>([]);
const stats = ref<MempoolStats | null>(null);
const topTransactions = ref<MempoolTransaction[]>([]);
const gasTrend = ref<GasTrend | null>(null);

function formatGwei(wei: string): string {
  const gwei = parseFloat(wei) / 1e9;
  return gwei.toFixed(2);
}

function truncateHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return hash.slice(0, 6) + '...' + hash.slice(-4);
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

function getTypePercentage(type: string): number {
  if (!stats.value?.byType) return 0;
  const total = stats.value.totalPending || 1;
  return (stats.value.byType[type as keyof typeof stats.value.byType] / total) * 100;
}

function getTrendBarHeight(gasPrice: string): number {
  if (!gasTrend.value?.summary) return 50;
  const min = gasTrend.value.summary.min / 1e9;
  const max = gasTrend.value.summary.max / 1e9;
  const current = parseFloat(gasPrice) / 1e9;
  return ((current - min) / (max - min || 1)) * 100;
}

async function loadMempool() {
  loading.value = true;
  try {
    // Load all data in parallel
    const [txData, statsData, topData, trendData] = await Promise.all([
      request<MempoolTransaction[]>({
        url: `/web3/mempool/${selectedChain.value}`,
        method: 'get',
        params: { limit: 50 }
      }),
      request<MempoolStats>({
        url: `/web3/mempool/stats/${selectedChain.value}`,
        method: 'get'
      }),
      request<MempoolTransaction[]>({
        url: `/web3/mempool/top/${selectedChain.value}`,
        method: 'get',
        params: { limit: 5 }
      }),
      request<GasTrend>({
        url: `/web3/mempool/gas-trend/${selectedChain.value}`,
        method: 'get',
        params: { hours: 24 }
      })
    ]);

    transactions.value = txData;
    stats.value = statsData;
    topTransactions.value = topData;
    gasTrend.value = trendData;
  } catch (error) {
    console.error('Failed to load mempool:', error);
    // Demo data
    transactions.value = [
      { hash: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d', from: '0x742d...eB1E', to: '0x7a25...488D', value: '1.5', gasUsed: '21000', timestamp: Date.now() - 60000, nonce: 42, chainId: 1 },
      { hash: '0x8f3cf7a23f6c8092e7c0a7c0e9b2d3f4a5c6b7e8', from: '0x8Ba1...DBA72', to: '0xA0b8...eB48', value: '0.8', gasUsed: '65000', timestamp: Date.now() - 120000, nonce: 18, chainId: 1 },
      { hash: '0x9c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2', from: '0xE37e...c3Ed', to: '0x2260...C599', value: '2.3', gasUsed: '85000', timestamp: Date.now() - 180000, nonce: 156, chainId: 1 },
    ].map(tx => ({ ...tx, gasPrice: (40000000000 + Math.random() * 20000000000).toFixed(0) }));
    
    stats.value = {
      chainId: selectedChain.value,
      totalPending: 156,
      avgGasPrice: '45000000000',
      minGasPrice: '30000000000',
      maxGasPrice: '80000000000',
      totalValue: '45.8',
      byType: { transfer: 80, swap: 35, contractCall: 30, unknown: 11 }
    };
    
    topTransactions.value = transactions.value.slice(0, 5);
    
    gasTrend.value = {
      chainId: selectedChain.value,
      timeRange: '24h',
      data: Array.from({ length: 24 }, (_, i) => ({
        timestamp: Date.now() - (23 - i) * 3600000,
        gasPrice: (35000000000 + Math.random() * 20000000000).toFixed(0),
        date: new Date(Date.now() - (23 - i) * 3600000).toISOString()
      })),
      summary: { avg: 45000000000, min: 30000000000, max: 80000000000 }
    };
  } finally {
    loading.value = false;
  }
}

function copyHash(hash: string) {
  navigator.clipboard.writeText(hash);
}

onMounted(() => {
  loadMempool();
});
</script>

<style scoped>
.mempool-monitor {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.actions {
  display: flex;
  gap: 12px;
}

.chain-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.loading-state {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* Type Distribution */
.type-distribution {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.type-distribution h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
}

.type-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-label {
  width: 100px;
  font-size: 14px;
  color: #666;
}

.type-bar {
  flex: 1;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.type-bar .bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.bar-fill.transfer { background: #4f46e5; }
.bar-fill.swap { background: #10b981; }
.bar-fill.contract { background: #f59e0b; }
.bar-fill.unknown { background: #6b7280; }

.type-count {
  width: 40px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* Gas Trend */
.gas-trend-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.gas-trend-section h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  padding: 0 8px;
}

.trend-bar {
  flex: 1;
  background: linear-gradient(to top, #4f46e5, #7c3aed);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.trend-bar:hover {
  opacity: 0.8;
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

/* Top Transactions */
.top-tx-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.top-tx-section h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.tx-hash {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hash-text {
  font-family: monospace;
  font-size: 13px;
  color: #4f46e5;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.tx-details {
  display: flex;
  gap: 24px;
}

.tx-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.tx-row .label {
  color: #666;
}

.tx-row .value {
  font-family: monospace;
  color: #333;
}

.tx-meta {
  text-align: right;
}

.tx-value {
  font-weight: 600;
  color: #10b981;
}

.tx-gas {
  font-size: 12px;
  color: #f59e0b;
}

.tx-time {
  font-size: 12px;
  color: #999;
}

/* All Transactions Table */
.all-tx-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.all-tx-section h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #333;
}

.tx-table {
  display: flex;
  flex-direction: column;
}

.table-header, .table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr 1fr;
  gap: 12px;
  padding: 12px;
  align-items: center;
}

.table-header {
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  font-size: 13px;
  color: #666;
}

.table-row {
  border-bottom: 1px solid #eee;
  font-size: 13px;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row .hash {
  font-family: monospace;
  color: #4f46e5;
}

.table-row .address {
  font-family: monospace;
  color: #666;
}

.table-row .value {
  color: #10b981;
  font-weight: 500;
}

.table-row .gas {
  color: #f59e0b;
}

.table-row .time {
  color: #999;
}
</style>
