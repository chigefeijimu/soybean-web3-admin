<template>
  <div class="dex-trading-journal">
    <div class="header">
      <h2>📝 DEX Trading Journal</h2>
      <p class="subtitle">Track and analyze your DEX trading history</p>
    </div>

    <!-- Address Input -->
    <div class="search-bar card">
      <div class="search-row">
        <div class="input-group">
          <label>Wallet Address</label>
          <input 
            v-model="address" 
            type="text" 
            placeholder="Enter wallet address (0x...)"
            class="address-input"
          />
        </div>
        <div class="input-group">
          <label>Chain</label>
          <select v-model="selectedChain">
            <option value="">All Chains</option>
            <option v-for="chain in chains" :key="chain" :value="chain">
              {{ chain }}
            </option>
          </select>
        </div>
        <div class="input-group">
          <label>DEX</label>
          <select v-model="selectedDex">
            <option value="">All DEXes</option>
            <option v-for="dex in dexes" :key="dex" :value="dex">
              {{ dex }}
            </option>
          </select>
        </div>
        <button @click="loadData" :disabled="loading || !address" class="btn-primary">
          {{ loading ? 'Loading...' : 'Analyze' }}
        </button>
      </div>
    </div>

    <!-- Stats Dashboard -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Volume</div>
        <div class="stat-value">${{ formatNumber(stats.totalVolume) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Trades</div>
        <div class="stat-value">{{ stats.totalTrades }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Win Rate</div>
        <div class="stat-value" :class="getWinRateClass(stats.winRate)">
          {{ (stats.winRate * 100).toFixed(1) }}%
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Fees</div>
        <div class="stat-value">${{ formatNumber(stats.totalFees) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Trade Size</div>
        <div class="stat-value">${{ formatNumber(stats.averageTradeSize) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Most Used DEX</div>
        <div class="stat-value">{{ stats.mostUsedDex }}</div>
      </div>
    </div>

    <!-- Charts Section -->
    <div v-if="stats" class="charts-section">
      <div class="chart-card">
        <h3>Volume Over Time</h3>
        <div class="simple-chart">
          <div 
            v-for="(item, index) in stats.dailyVolume.slice(-14)" 
            :key="index"
            class="chart-bar"
            :style="{ height: getBarHeight(item.volume, maxVolume) + '%' }"
            :title="`${item.date}: $${formatNumber(item.volume)}`"
          ></div>
        </div>
        <div class="chart-labels">
          <span v-for="(item, index) in stats.dailyVolume.slice(-7)" :key="index">
            {{ formatDate(item.date) }}
          </span>
        </div>
      </div>

      <div class="chart-card">
        <h3>Chain Distribution</h3>
        <div class="distribution-list">
          <div 
            v-for="(value, chain) in stats.chainDistribution" 
            :key="chain"
            class="distribution-item"
          >
            <span class="distribution-label">{{ chain }}</span>
            <div class="distribution-bar">
              <div 
                class="distribution-fill" 
                :style="{ width: (value / stats.totalVolume * 100) + '%' }"
              ></div>
            </div>
            <span class="distribution-value">{{ (value / stats.totalVolume * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>DEX Distribution</h3>
        <div class="distribution-list">
          <div 
            v-for="(value, dex) in stats.dexDistribution" 
            :key="dex"
            class="distribution-item"
          >
            <span class="distribution-label">{{ dex }}</span>
            <div class="distribution-bar">
              <div 
                class="distribution-fill dex" 
                :style="{ width: (value / stats.totalVolume * 100) + '%' }"
              ></div>
            </div>
            <span class="distribution-value">{{ (value / stats.totalVolume * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trades Table -->
    <div v-if="trades.length > 0" class="trades-section card">
      <h3>Recent Trades</h3>
      <div class="table-container">
        <table class="trades-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Chain</th>
              <th>DEX</th>
              <th>From</th>
              <th>To</th>
              <th>Value</th>
              <th>Gas Fee</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trade in trades" :key="trade.hash">
              <td>{{ formatTimestamp(trade.timestamp) }}</td>
              <td><span class="chain-badge">{{ trade.chain }}</span></td>
              <td>{{ trade.dex }}</td>
              <td>{{ trade.fromAmount }} {{ trade.fromToken }}</td>
              <td>{{ trade.toAmount }} {{ trade.toToken }}</td>
              <td>${{ formatNumber(trade.fromValue) }}</td>
              <td>${{ trade.gasFee.toFixed(2) }}</td>
              <td>
                <span :class="['status-badge', trade.status]">
                  {{ trade.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Market Overview -->
    <div class="market-section">
      <div class="card">
        <h3>🔥 Trending Pairs</h3>
        <div class="trending-grid">
          <div 
            v-for="pair in trendingPairs" 
            :key="pair.pair"
            class="trending-item"
          >
            <div class="pair-name">{{ pair.pair }}</div>
            <div class="pair-dex">{{ pair.dex }}</div>
            <div class="pair-volume">${{ formatNumber(pair.volume24h) }}</div>
            <div :class="['pair-change', pair.priceChange24h >= 0 ? 'positive' : 'negative']">
              {{ pair.priceChange24h >= 0 ? '+' : '' }}{{ pair.priceChange24h.toFixed(2) }}%
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>📊 DEX Performance</h3>
        <div class="dex-performance-list">
          <div 
            v-for="dex in dexPerformance" 
            :key="dex.dex"
            class="dex-performance-item"
          >
            <div class="dex-name">{{ dex.dex }}</div>
            <div class="dex-stats">
              <div>Volume: ${{ formatNumber(dex.volume24h) }}</div>
              <div>Trades: {{ dex.trades24h.toLocaleString() }}</div>
              <div>Avg Gas: ${{ dex.avgGas.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!stats && !loading && address" class="empty-state">
      <p>No trades found for this address</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { dexTradingJournal, type DexTrade, type TradingStats } from '@/service/dexTradingJournal';

const address = ref('');
const selectedChain = ref('');
const selectedDex = ref('');
const loading = ref(false);
const trades = ref<DexTrade[]>([]);
const stats = ref<TradingStats | null>(null);
const trendingPairs = ref<any[]>([]);
const dexPerformance = ref<any[]>([]);

const chains = ['ethereum', 'arbitrum', 'optimism', 'polygon', 'bsc', 'base', 'avalanche'];
const dexes = ['uniswap', 'sushiswap', 'pancakeswap', 'quickswap', 'curve', 'balancer', 'aerodrome', 'velodrome'];

const loadData = async () => {
  if (!address.value) return;
  
  loading.value = true;
  try {
    const [tradesRes, statsRes] = await Promise.all([
      dexTradingJournal.getTrades(address.value, selectedChain.value || undefined, selectedDex.value || undefined),
      dexTradingJournal.getStats(address.value, selectedChain.value || undefined, selectedDex.value || undefined),
    ]);
    trades.value = tradesRes.data || [];
    stats.value = statsRes.data || null;
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    loading.value = false;
  }
};

const loadMarketData = async () => {
  try {
    const [trendingRes, performanceRes] = await Promise.all([
      dexTradingJournal.getTrendingPairs('ethereum'),
      dexTradingJournal.getDexPerformance(),
    ]);
    trendingPairs.value = trendingRes.data || [];
    dexPerformance.value = performanceRes.data || [];
  } catch (error) {
    console.error('Error loading market data:', error);
  }
};

const formatNumber = (num: number): string => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatDate = (dateStr: string): string => {
  return dateStr.slice(5); // MM-DD
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getBarHeight = (value: number, max: number): number => {
  if (!max) return 0;
  return (value / max) * 100;
};

const maxVolume = computed(() => {
  const vol = stats.value?.dailyVolume;
  if (!vol || !vol.length) return 0;
  return Math.max(...vol.map((d: any) => d.volume));
});

const getWinRateClass = (rate: number): string => {
  if (rate >= 0.6) return 'positive';
  if (rate >= 0.4) return 'neutral';
  return 'negative';
};

onMounted(() => {
  loadMarketData();
});
</script>

<style scoped>
.dex-trading-journal {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0 0 5px 0;
  color: #1a1a2e;
}

.subtitle {
  color: #666;
  margin: 0;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-bar {
  padding: 20px;
}

.search-row {
  display: flex;
  gap: 15px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-group label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.input-group input,
.input-group select {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 180px;
}

.address-input {
  width: 350px !important;
}

.btn-primary {
  padding: 10px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.stat-value.positive {
  color: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

.stat-value.neutral {
  color: #f59e0b;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #1a1a2e;
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  padding: 10px 0;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #4f46e5, #7c3aed);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}

.chart-bar:hover {
  background: linear-gradient(to top, #4338ca, #6d28d9);
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #999;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.distribution-label {
  width: 80px;
  font-size: 12px;
  color: #666;
}

.distribution-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.distribution-fill {
  height: 100%;
  background: #4f46e5;
  border-radius: 4px;
}

.distribution-fill.dex {
  background: #7c3aed;
}

.distribution-value {
  width: 50px;
  text-align: right;
  font-size: 12px;
  color: #666;
}

.trades-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #1a1a2e;
}

.table-container {
  overflow-x: auto;
}

.trades-table {
  width: 100%;
  border-collapse: collapse;
}

.trades-table th,
.trades-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.trades-table th {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.trades-table td {
  font-size: 13px;
}

.chain-badge {
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 11px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.status-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.market-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.trending-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.pair-name {
  font-weight: 600;
  font-size: 14px;
}

.pair-dex {
  font-size: 11px;
  color: #666;
}

.pair-volume {
  font-size: 13px;
  color: #1a1a2e;
}

.pair-change {
  font-size: 12px;
}

.pair-change.positive {
  color: #10b981;
}

.pair-change.negative {
  color: #ef4444;
}

.dex-performance-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dex-performance-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.dex-name {
  font-weight: 600;
  font-size: 14px;
}

.dex-stats {
  font-size: 12px;
  color: #666;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
