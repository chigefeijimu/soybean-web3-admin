<template>
  <div class="wallet-activity">
    <div class="header-section">
      <h2>📊 Wallet Activity Analytics</h2>
      <p class="subtitle">Track wallet activity patterns, gas spending, and behavioral analysis</p>
    </div>

    <div class="search-section">
      <div class="search-box">
        <input
          v-model="searchAddress"
          type="text"
          placeholder="Enter wallet address (0x...)"
          @keyup.enter="analyzeWallet"
        />
        <select v-model="selectedChain">
          <option value="1">Ethereum</option>
          <option value="137">Polygon</option>
          <option value="42161">Arbitrum</option>
          <option value="10">Optimism</option>
          <option value="56">BSC</option>
          <option value="8453">Base</option>
          <option value="43114">Avalanche</option>
        </select>
        <button @click="analyzeWallet" :disabled="loading">
          {{ loading ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="analysis" class="analysis-results">
      <!-- Activity Score -->
      <div class="score-section">
        <div class="activity-score" :class="getScoreClass(analysis.summary.activityScore)">
          <div class="score-circle">
            <span class="score-value">{{ analysis.summary.activityScore }}</span>
            <span class="score-label">Activity Score</span>
          </div>
        </div>
        <div class="score-details">
          <div class="detail-item">
            <span class="label">Total Transactions:</span>
            <span class="value">{{ analysis.summary.totalTransactions }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Total Gas Spent:</span>
            <span class="value">{{ analysis.summary.totalGasSpent }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Total Gas Value:</span>
            <span class="value">${{ analysis.summary.totalGasValueUSD }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Avg Gas/Tx:</span>
            <span class="value">{{ analysis.summary.averageGasPerTx }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Days Since Last Activity:</span>
            <span class="value">{{ analysis.summary.daysSinceLastActivity >= 0 ? analysis.summary.daysSinceLastActivity + ' days' : 'N/A' }}</span>
          </div>
        </div>
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

      <!-- Heatmap Tab -->
      <div v-if="activeTab === 'heatmap'" class="tab-content">
        <h3>🗓️ Activity Heatmap</h3>
        <div class="heatmap-container">
          <div class="heatmap">
            <div class="heatmap-labels">
              <div v-for="(row, idx) in heatmapData" :key="idx" class="heatmap-row">
                <span class="day-label">{{ row.day }}</span>
                <div class="hour-cells">
                  <div 
                    v-for="(value, hourIdx) in row.hours" 
                    :key="hourIdx"
                    class="hour-cell"
                    :class="getHeatmapClass(value)"
                    :title="`${row.day} ${hourIdx}:00 - ${value} transactions`"
                  ></div>
                </div>
              </div>
            </div>
            <div class="heatmap-legend">
              <span>Less</span>
              <div class="legend-cells">
                <div class="hour-cell level-0"></div>
                <div class="hour-cell level-1"></div>
                <div class="hour-cell level-2"></div>
                <div class="hour-cell level-3"></div>
                <div class="hour-cell level-4"></div>
              </div>
              <span>More</span>
            </div>
          </div>
          <div class="peak-info" v-if="heatmapResult">
            <div class="peak-item">
              <span class="label">Peak Day:</span>
              <span class="value">{{ heatmapResult.peakDay }}</span>
            </div>
            <div class="peak-item">
              <span class="label">Peak Hour:</span>
              <span class="value">{{ heatmapResult.peakHour }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Gas Stats Tab -->
      <div v-if="activeTab === 'gas'" class="tab-content">
        <h3>⛽ Gas Statistics</h3>
        <div v-if="gasStats" class="gas-stats">
          <div class="gas-grid">
            <div class="gas-card">
              <div class="card-label">Average Gas Price</div>
              <div class="card-value">{{ gasStats.gasStats.averageGasPrice }}</div>
            </div>
            <div class="gas-card">
              <div class="card-label">Average Gas Used</div>
              <div class="card-value">{{ gasStats.gasStats.averageGasUsed }}</div>
            </div>
            <div class="gas-card">
              <div class="card-label">Average Tx Cost</div>
              <div class="card-value">${{ gasStats.gasStats.averageTxCostUSD }}</div>
            </div>
            <div class="gas-card">
              <div class="card-label">Gas Trend</div>
              <div class="card-value" :class="gasStats.gasStats.gasTrend > 0 ? 'negative' : 'positive'">
                {{ gasStats.gasStats.gasTrend > 0 ? '+' : '' }}{{ gasStats.gasStats.gasTrend }}%
              </div>
            </div>
          </div>
          
          <div class="tx-comparison" v-if="gasStats.gasStats.cheapestTx && gasStats.gasStats.mostExpensiveTx">
            <h4>Transaction Comparison</h4>
            <div class="comparison-grid">
              <div class="comparison-card cheap">
                <div class="label">Cheapest Tx</div>
                <div class="value">${{ gasStats.gasStats.cheapestTx.gasUSD }}</div>
                <div class="hash">{{ truncateHash(gasStats.gasStats.cheapestTx.hash) }}</div>
              </div>
              <div class="comparison-card expensive">
                <div class="label">Most Expensive Tx</div>
                <div class="value">${{ gasStats.gasStats.mostExpensiveTx.gasUSD }}</div>
                <div class="hash">{{ truncateHash(gasStats.gasStats.mostExpensiveTx.hash) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">No gas data available</div>
      </div>

      <!-- Patterns Tab -->
      <div v-if="activeTab === 'patterns'" class="tab-content">
        <h3>🔍 Transaction Patterns</h3>
        <div v-if="patterns && patterns.patterns" class="patterns-content">
          <div class="pattern-badges">
            <span v-if="patterns.patterns.isActive" class="badge active">Active</span>
            <span v-if="patterns.patterns.isHeavyUser" class="badge heavy">Heavy User</span>
            <span v-if="patterns.patterns.isTrader" class="badge trader">Trader</span>
            <span v-if="patterns.patterns.isDefiUser" class="badge defi">DeFi User</span>
            <span v-if="patterns.patterns.isNftTrader" class="badge nft">NFT Trader</span>
          </div>
          
          <div class="pattern-details">
            <div class="detail-row">
              <span class="label">Average Tx/Day:</span>
              <span class="value">{{ patterns.patterns.avgTxPerDay }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Transaction Frequency:</span>
              <span class="value">{{ patterns.patterns.txFrequency }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Most Active Hour:</span>
              <span class="value">{{ patterns.patterns.mostActiveHour }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Most Active Day:</span>
              <span class="value">{{ patterns.patterns.mostActiveDay }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-data">No pattern data available</div>
      </div>

      <!-- Hourly Tab -->
      <div v-if="activeTab === 'hourly'" class="tab-content">
        <h3>⏰ Hourly Activity Distribution</h3>
        <div class="chart-container">
          <div class="bar-chart">
            <div 
              v-for="(stat, idx) in hourlyStats.hourlyStats" 
              :key="idx"
              class="bar-wrapper"
            >
              <div 
                class="bar" 
                :style="{ height: (stat.transactionCount / maxHourlyCount * 100) + '%' }"
                :title="`${stat.hour}: ${stat.transactionCount} transactions`"
              ></div>
              <span class="bar-label">{{ stat.hour.split(':')[0] }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Tab -->
      <div v-if="activeTab === 'weekly'" class="tab-content">
        <h3>📅 Weekly Activity Distribution</h3>
        <div class="chart-container">
          <div class="week-chart">
            <div 
              v-for="(stat, idx) in weeklyStats.weeklyStats" 
              :key="idx"
              class="day-wrapper"
            >
              <div 
                class="day-bar" 
                :style="{ height: (stat.transactionCount / maxWeeklyCount * 100) + '%' }"
                :title="`${stat.day}: ${stat.transactionCount} transactions`"
              ></div>
              <span class="day-label">{{ stat.day.slice(0, 3) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Interactions Tab -->
      <div v-if="activeTab === 'interactions'" class="tab-content">
        <h3>🔗 Top Contract Interactions</h3>
        <div v-if="topInteractions && topInteractions.topInteractions.length" class="interactions-list">
          <div 
            v-for="(interaction, idx) in topInteractions.topInteractions" 
            :key="idx"
            class="interaction-card"
          >
            <div class="rank">#{{ idx + 1 }}</div>
            <div class="address-info">
              <div class="address">{{ truncateHash(interaction.address) }}</div>
              <div class="stats">
                <span>{{ interaction.transactionCount }} txs</span>
                <span>${{ interaction.totalGasUSD }} gas</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">No interaction data available</div>
      </div>
    </div>

    <div v-if="!analysis && !loading && !error" class="empty-state">
      <div class="empty-icon">📊</div>
      <p>Enter a wallet address to analyze activity patterns</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const API_BASE = 'http://localhost:3000';

const searchAddress = ref('');
const selectedChain = ref('1');
const loading = ref(false);
const error = ref('');
const analysis = ref<any>(null);
const heatmapResult = ref<any>(null);
const gasStats = ref<any>(null);
const patterns = ref<any>(null);
const hourlyStats = ref<any>(null);
const weeklyStats = ref<any>(null);
const topInteractions = ref<any>(null);
const activeTab = ref('heatmap');

const tabs = [
  { id: 'heatmap', label: 'Heatmap', icon: '🗓️' },
  { id: 'gas', label: 'Gas Stats', icon: '⛽' },
  { id: 'patterns', label: 'Patterns', icon: '🔍' },
  { id: 'hourly', label: 'Hourly', icon: '⏰' },
  { id: 'weekly', label: 'Weekly', icon: '📅' },
  { id: 'interactions', label: 'Top Contracts', icon: '🔗' },
];

const heatmapData = computed(() => {
  if (!heatmapResult.value?.heatmap) return [];
  return heatmapResult.value.heatmap;
});

const maxHourlyCount = computed(() => {
  if (!hourlyStats.value?.hourlyStats) return 1;
  return Math.max(...hourlyStats.value.hourlyStats.map((h: any) => h.transactionCount), 1);
});

const maxWeeklyCount = computed(() => {
  if (!weeklyStats.value?.weeklyStats) return 1;
  return Math.max(...weeklyStats.value.weeklyStats.map((w: any) => w.transactionCount), 1);
});

async function analyzeWallet() {
  if (!searchAddress.value) {
    error.value = 'Please enter a wallet address';
    return;
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(searchAddress.value)) {
    error.value = 'Invalid Ethereum address format';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    // Fetch all data in parallel
    const [analysisRes, heatmapRes, gasRes, patternsRes, hourlyRes, weeklyRes, interactionsRes] = await Promise.all([
      fetch(`${API_BASE}/wallet-activity/analyze?address=${searchAddress.value}&chainId=${selectedChain.value}`),
      fetch(`${API_BASE}/wallet-activity/activity-heatmap?address=${searchAddress.value}&chainId=${selectedChain.value}`),
      fetch(`${API_BASE}/wallet-activity/gas-stats?address=${searchAddress.value}&chainId=${selectedChain.value}`),
      fetch(`${API_BASE}/wallet-activity/transaction-patterns?address=${searchAddress.value}&chainId=${selectedChain.value}`),
      fetch(`${API_BASE}/wallet-activity/hourly-stats?address=${searchAddress.value}&chainId=${selectedChain.value}`),
      fetch(`${API_BASE}/wallet-activity/weekly-stats?address=${searchAddress.value}&chainId=${selectedChain.value}`),
      fetch(`${API_BASE}/wallet-activity/top-interactions?address=${searchAddress.value}&chainId=${selectedChain.value}`),
    ]);

    analysis.value = await analysisRes.json();
    heatmapResult.value = await heatmapRes.json();
    gasStats.value = await gasRes.json();
    patterns.value = await patternsRes.json();
    hourlyStats.value = await hourlyRes.json();
    weeklyStats.value = await weeklyRes.json();
    topInteractions.value = await interactionsRes.json();

    if (!analysis.value?.summary?.totalTransactions) {
      error.value = 'No transactions found for this address';
    }
  } catch (e: any) {
    error.value = 'Failed to fetch wallet data: ' + e.message;
  } finally {
    loading.value = false;
  }
}

function getScoreClass(score: number): string {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function getHeatmapClass(value: number): string {
  if (value >= 75) return 'level-4';
  if (value >= 50) return 'level-3';
  if (value >= 25) return 'level-2';
  if (value > 0) return 'level-1';
  return 'level-0';
}

function truncateHash(hash: string): string {
  if (!hash) return '';
  return hash.slice(0, 6) + '...' + hash.slice(-4);
}
</script>

<style scoped>
.wallet-activity {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 24px;
}

.header-section h2 {
  font-size: 24px;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.search-section {
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.search-box input {
  flex: 1;
  min-width: 300px;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-box select {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.search-box button {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.search-box button:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.analysis-results {
  margin-top: 24px;
}

/* Activity Score */
.score-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.activity-score {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-score.high {
  background: linear-gradient(135deg, #10b981, #059669);
}

.activity-score.medium {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.activity-score.low {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.score-circle {
  text-align: center;
  color: white;
}

.score-value {
  display: block;
  font-size: 32px;
  font-weight: bold;
}

.score-label {
  font-size: 10px;
  text-transform: uppercase;
}

.score-details {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  font-size: 12px;
  color: #666;
}

.detail-item .value {
  font-size: 16px;
  font-weight: 600;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tabs button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.tabs button.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.tab-content {
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.tab-content h3 {
  margin-bottom: 16px;
}

/* Heatmap */
.heatmap-container {
  overflow-x: auto;
}

.heatmap {
  min-width: 600px;
}

.heatmap-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.day-label {
  width: 80px;
  font-size: 12px;
  color: #666;
}

.hour-cells {
  display: flex;
  gap: 2px;
}

.hour-cell {
  width: 20px;
  height: 20px;
  border-radius: 2px;
}

.level-0 { background: #f3f4f6; }
.level-1 { background: #bbf7d0; }
.level-2 { background: #86efac; }
.level-3 { background: #4ade80; }
.level-4 { background: #22c55e; }

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: #666;
}

.legend-cells {
  display: flex;
  gap: 2px;
}

.peak-info {
  display: flex;
  gap: 24px;
  margin-top: 16px;
}

.peak-item {
  display: flex;
  gap: 8px;
}

.peak-item .label {
  color: #666;
}

.peak-item .value {
  font-weight: 600;
}

/* Gas Stats */
.gas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.gas-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.gas-card .card-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.gas-card .card-value {
  font-size: 20px;
  font-weight: 600;
}

.gas-card .card-value.positive {
  color: #10b981;
}

.gas-card .card-value.negative {
  color: #ef4444;
}

.tx-comparison h4 {
  margin-bottom: 12px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.comparison-card {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.comparison-card.cheap {
  background: #d1fae5;
}

.comparison-card.expensive {
  background: #fee2e2;
}

.comparison-card .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.comparison-card .value {
  font-size: 18px;
  font-weight: 600;
}

.comparison-card .hash {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

/* Patterns */
.pattern-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge.active { background: #dbeafe; color: #1d4ed8; }
.badge.heavy { background: #fce7f3; color: #db2777; }
.badge.trader { background: #fef3c7; color: #d97706; }
.badge.defi { background: #d1fae5; color: #059669; }
.badge.nft { background: #ede9fe; color: #7c3aed; }

.pattern-details {
  background: white;
  padding: 16px;
  border-radius: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  color: #666;
}

.detail-row .value {
  font-weight: 500;
  text-transform: capitalize;
}

/* Charts */
.chart-container {
  height: 250px;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  height: 220px;
  gap: 2px;
  padding-bottom: 24px;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar {
  width: 100%;
  background: #4f46e5;
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  transition: height 0.3s;
}

.bar-label {
  font-size: 10px;
  color: #666;
  margin-top: 4px;
}

.week-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  gap: 16px;
  padding: 0 20px;
}

.day-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.day-bar {
  width: 100%;
  max-width: 60px;
  background: #8b5cf6;
  border-radius: 8px 8px 0 0;
  min-height: 4px;
}

.day-label {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

/* Interactions */
.interactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.interaction-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
}

.interaction-card .rank {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.interaction-card .address-info {
  flex: 1;
}

.interaction-card .address {
  font-family: monospace;
  font-weight: 500;
}

.interaction-card .stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  color: #666;
}
</style>
