<template>
  <div class="gas-station-network">
    <div class="header">
      <h1>⛽ Cross-chain Gas Station Network</h1>
      <p class="subtitle">Find the best gas prices across chains and optimize your transaction costs</p>
    </div>

    <!-- Network Status -->
    <div class="status-bar">
      <div class="status-indicator" :class="networkStatus.overallStatus">
        <span class="dot"></span>
        Network Status: {{ networkStatus.overallStatus }}
      </div>
      <div class="last-updated">
        Last updated: {{ lastUpdated }}
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stat-card cheapest">
        <div class="stat-label">Cheapest Chain</div>
        <div class="stat-value">{{ summary.cheapestChain?.chain || 'N/A' }}</div>
        <div class="stat-detail">{{ summary.cheapestChain?.normal }} Gwei</div>
      </div>
      <div class="stat-card fast">
        <div class="stat-label">Fastest Confirmation</div>
        <div class="stat-value">{{ summary.fastestChain?.chain || 'N/A' }}</div>
        <div class="stat-detail">~{{ summary.fastestChain?.fast }} Gwei</div>
      </div>
      <div class="stat-card avg">
        <div class="stat-label">Average Gas</div>
        <div class="stat-value">{{ (summary.overallAvgGas || 0).toFixed(2) }}</div>
        <div class="stat-detail">Gwei across {{ summary.totalChains }} chains</div>
      </div>
      <div class="stat-card savings">
        <div class="stat-label">Potential Savings</div>
        <div class="stat-value">{{ recommendation?.savingsPercent?.toFixed(1) || 0 }}%</div>
        <div class="stat-detail">vs average</div>
      </div>
    </div>

    <!-- Main Content Tabs -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Gas Prices Table -->
      <div v-if="activeTab === 'prices'" class="prices-panel">
        <div class="panel-header">
          <h3>Live Gas Prices</h3>
          <div class="filters">
            <select v-model="selectedChain" class="chain-select">
              <option value="">All Chains</option>
              <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
            </select>
          </div>
        </div>
        
        <div class="prices-table-wrapper">
          <table class="prices-table">
            <thead>
              <tr>
                <th>Chain</th>
                <th>🐢 Slow</th>
                <th>⚡ Normal</th>
                <th>🚀 Fast</th>
                <th>Trend</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="price in filteredPrices" :key="price.chain">
                <td class="chain-cell">
                  <span class="chain-icon">{{ getChainIcon(price.chain) }}</span>
                  {{ price.chain }}
                </td>
                <td :class="['gas-price', 'slow', { lowest: isLowest(price.slow, 'slow') }]">
                  {{ price.slow }} {{ price.unit }}
                </td>
                <td :class="['gas-price', 'normal', { lowest: isLowest(price.normal, 'normal') }]">
                  {{ price.normal }} {{ price.unit }}
                </td>
                <td :class="['gas-price', 'fast', { lowest: isLowest(price.fast, 'fast') }]">
                  {{ price.fast }} {{ price.unit }}
                </td>
                <td>
                  <span :class="['trend', price.trend]">
                    {{ getTrendIcon(price.trend) }} {{ price.trend }}
                  </span>
                </td>
                <td>
                  <div class="confidence-bar">
                    <div class="confidence-fill" :style="{ width: price.confidence + '%' }"></div>
                  </div>
                  <span class="confidence-text">{{ price.confidence }}%</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="activeTab === 'recommend'" class="recommend-panel">
        <div class="recommendation-card">
          <div class="rec-header">
            <h3>🎯 Recommended Transaction</h3>
          </div>
          <div class="rec-body">
            <div class="rec-chain">
              <span class="rec-label">Best Chain</span>
              <span class="rec-value">{{ recommendation?.recommendedChain }}</span>
            </div>
            <div class="rec-speed">
              <span class="rec-label">Speed</span>
              <span class="rec-value">{{ recommendation?.recommendedSpeed }}</span>
            </div>
            <div class="rec-time">
              <span class="rec-label">Est. Time</span>
              <span class="rec-value">{{ recommendation?.estimatedTime }}</span>
            </div>
            <div class="rec-savings">
              <span class="rec-label">Potential Savings</span>
              <span class="rec-value highlight">{{ recommendation?.savingsPercent }}%</span>
            </div>
          </div>
        </div>

        <div class="alternatives-section">
          <h4>Alternative Chains</h4>
          <div class="alternatives-grid">
            <div v-for="alt in recommendation?.alternativeChains" :key="alt.chain" class="alt-card">
              <div class="alt-header">
                <span class="alt-chain">{{ alt.chain }}</span>
                <span class="alt-recommend">{{ alt.recommendation }}</span>
              </div>
              <div class="alt-details">
                <div class="alt-item">
                  <span>Gas Price:</span>
                  <span>{{ alt.gasPrice }} Gwei</span>
                </div>
                <div class="alt-item">
                  <span>Est. Time:</span>
                  <span>{{ alt.estimatedTime }}</span>
                </div>
                <div class="alt-item">
                  <span>Bridge Cost:</span>
                  <span>${{ alt.crossChainCost }}</span>
                </div>
                <div class="alt-item total">
                  <span>Total Cost:</span>
                  <span>${{ alt.totalCost }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Best Time to Transact -->
        <div class="best-time-card">
          <h4>⏰ Best Time to Transact</h4>
          <div class="time-info">
            <div class="time-item">
              <span class="time-label">Best Hour (UTC)</span>
              <span class="time-value">{{ bestTime?.bestHour }}:00</span>
            </div>
            <div class="time-item">
              <span class="time-label">Best Day</span>
              <span class="time-value">{{ getDayName(bestTime?.bestDay) }}</span>
            </div>
            <div class="time-item">
              <span class="time-label">Est. Savings</span>
              <span class="time-value">{{ bestTime?.estimatedSavings?.toFixed(1) }}%</span>
            </div>
          </div>
          <p class="pattern">{{ bestTime?.pattern }}</p>
        </div>
      </div>

      <!-- Transaction Estimates -->
      <div v-if="activeTab === 'estimates'" class="estimates-panel">
        <div class="estimate-controls">
          <label>Transaction Type:</label>
          <select v-model="selectedTxType" @change="fetchEstimates">
            <option v-for="type in txTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="estimates-table-wrapper">
          <table class="estimates-table">
            <thead>
              <tr>
                <th>Chain</th>
                <th>🐢 Slow</th>
                <th>⚡ Normal</th>
                <th>🚀 Fast</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="est in estimates" :key="est.chain">
                <td class="chain-cell">{{ est.chain }}</td>
                <td class="gas-price">{{ est.slow }} {{ est.currency }}</td>
                <td class="gas-price">{{ est.normal }} {{ est.currency }}</td>
                <td class="gas-price">{{ est.fast }} {{ est.currency }}</td>
                <td>{{ est.currency }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Chain Comparison -->
      <div v-if="activeTab === 'compare'" class="compare-panel">
        <div class="comparison-grid">
          <div v-for="chain in chainComparisons" :key="chain.chain" class="comparison-card" :class="getRecommendationClass(chain.recommendation)">
            <div class="comp-header">
              <span class="comp-chain">{{ chain.chain }}</span>
              <span class="comp-score">{{ chain.score }}</span>
            </div>
            <div class="comp-details">
              <div class="comp-item">
                <span>Avg Gas:</span>
                <span>{{ chain.avgGasPrice.toFixed(2) }} Gwei</span>
              </div>
              <div class="comp-item">
                <span>Confirm Time:</span>
                <span>{{ chain.avgConfirmationTime }}s</span>
              </div>
            </div>
            <div class="comp-footer">
              <span class="comp-recommend">{{ chain.recommendation }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Gas History Chart -->
      <div v-if="activeTab === 'history'" class="history-panel">
        <div class="history-controls">
          <select v-model="selectedHistoryChain" @change="fetchHistory">
            <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
          </select>
          <select v-model="historyDays" @change="fetchHistory">
            <option :value="7">7 Days</option>
            <option :value="14">14 Days</option>
            <option :value="30">30 Days</option>
          </select>
        </div>
        
        <div class="chart-placeholder">
          <div class="chart-legend">
            <span class="legend-item slow">🐢 Slow</span>
            <span class="legend-item normal">⚡ Normal</span>
            <span class="legend-item fast">🚀 Fast</span>
          </div>
          <div class="chart-bars">
            <div v-for="(point, idx) in gasHistory" :key="idx" class="chart-bar-group">
              <div class="bar slow" :style="{ height: (point.slow * 1e9 / maxGas) + '%' }"></div>
              <div class="bar normal" :style="{ height: (point.normal * 1e9 / maxGas) + '%' }"></div>
              <div class="bar fast" :style="{ height: (point.fast * 1e9 / maxGas) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Saving Tips -->
      <div v-if="activeTab === 'tips'" class="tips-panel">
        <div class="tips-grid">
          <div v-for="tip in savingTips" :key="tip.tip" class="tip-card" :class="tip.difficulty">
            <div class="tip-header">
              <span class="tip-text">{{ tip.tip }}</span>
              <span class="tip-difficulty">{{ tip.difficulty }}</span>
            </div>
            <div class="tip-savings">💰 Save {{ tip.savings }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading gas data...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { get } from '/@/utils/http';

// State
const loading = ref(true);
const activeTab = ref('prices');
const prices = ref<any[]>([]);
const summary = ref<any>({});
const recommendation = ref<any>(null);
const estimates = ref<any[]>([]);
const chainComparisons = ref<any[]>([]);
const gasHistory = ref<any[]>([]);
const savingTips = ref<any[]>([]);
const bestTime = ref<any>(null);
const networkStatus = ref<any>({ chains: [], overallStatus: 'healthy' });
const lastUpdated = ref('');

// Filters
const selectedChain = ref('');
const selectedTxType = ref('swap');
const selectedHistoryChain = ref('Ethereum');
const historyDays = ref(7);

// Constants
const tabs = [
  { id: 'prices', name: 'Live Prices', icon: '⛽' },
  { id: 'recommend', name: 'Recommendations', icon: '🎯' },
  { id: 'estimates', name: 'Cost Estimates', icon: '💰' },
  { id: 'compare', name: 'Chain Compare', icon: '⚖️' },
  { id: 'history', name: 'History', icon: '📊' },
  { id: 'tips', name: 'Saving Tips', icon: '💡' },
];

const chains = [
  'Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'BSC', 'Base', 'Avalanche', 'zkSync', 'Linea', 'Scroll'
];

const txTypes = [
  { value: 'eth_transfer', label: 'ETH Transfer' },
  { value: 'erc20_transfer', label: 'ERC20 Transfer' },
  { value: 'swap', label: 'DEX Swap' },
  { value: 'nft_transfer', label: 'NFT Transfer' },
  { value: 'approve', label: 'Token Approval' },
  { value: 'contract_deploy', label: 'Contract Deployment' },
  { value: 'stake', label: 'Staking' },
  { value: 'bridge', label: 'Cross-chain Bridge' },
];

// Computed
const filteredPrices = computed(() => {
  if (!selectedChain.value) return prices.value;
  return prices.value.filter(p => p.chain === selectedChain.value);
});

const maxGas = computed(() => {
  if (!gasHistory.value.length) return 100;
  return Math.max(...gasHistory.value.map(p => p.normal * 1e9)) * 1.2;
});

// Methods
const isLowest = (value: number, type: string) => {
  const typeIndex = { slow: 0, normal: 1, fast: 2 }[type];
  const filtered = filteredPrices.value;
  if (!filtered.length) return false;
  const min = Math.min(...filtered.map(p => p[type]));
  return value === min;
};

const getChainIcon = (chain: string) => {
  const icons: Record<string, string> = {
    Ethereum: '🔷',
    Polygon: '🟣',
    Arbitrum: '🔵',
    Optimism: '🔴',
    BSC: '🟡',
    Base: '🔵',
    Avalanche: '🔺',
    zkSync: '⚡',
    Linea: '🟢',
    Scroll: '📜',
  };
  return icons[chain] || '⚪';
};

const getTrendIcon = (trend: string) => {
  const icons: Record<string, string> = {
    rising: '📈',
    falling: '📉',
    stable: '➡️',
  };
  return icons[trend] || '➡️';
};

const getDayName = (day: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'N/A';
};

const getRecommendationClass = (recommendation: string) => {
  if (recommendation?.includes('Highly')) return 'highly-recommended';
  if (recommendation?.includes('Recommended')) return 'recommended';
  if (recommendation?.includes('Acceptable')) return 'acceptable';
  return 'not-recommended';
};

// API Calls
const fetchPrices = async () => {
  try {
    const data = await get('/api/gas-station-network/prices');
    prices.value = data.prices || [];
    summary.value = data.summary || {};
    lastUpdated.value = new Date().toLocaleString();
  } catch (e) {
    console.error('Failed to fetch prices:', e);
  }
};

const fetchRecommendation = async () => {
  try {
    const data = await get(`/api/gas-station-network/recommendation?txType=${selectedTxType.value}`);
    recommendation.value = data;
  } catch (e) {
    console.error('Failed to fetch recommendation:', e);
  }
};

const fetchEstimates = async () => {
  try {
    const data = await get(`/api/gas-station-network/estimates?txType=${selectedTxType.value}`);
    estimates.value = data || [];
  } catch (e) {
    console.error('Failed to fetch estimates:', e);
  }
};

const fetchChainComparisons = async () => {
  try {
    const data = await get('/api/gas-station-network/compare');
    chainComparisons.value = data || [];
  } catch (e) {
    console.error('Failed to fetch comparisons:', e);
  }
};

const fetchHistory = async () => {
  try {
    const data = await get(`/api/gas-station-network/history/${selectedHistoryChain.value}?days=${historyDays.value}`);
    gasHistory.value = data.history || [];
  } catch (e) {
    console.error('Failed to fetch history:', e);
  }
};

const fetchSavingTips = async () => {
  try {
    const data = await get('/api/gas-station-network/saving-tips');
    savingTips.value = data || [];
  } catch (e) {
    console.error('Failed to fetch tips:', e);
  }
};

const fetchBestTime = async () => {
  try {
    const data = await get('/api/gas-station-network/best-time');
    bestTime.value = data;
  } catch (e) {
    console.error('Failed to fetch best time:', e);
  }
};

const fetchNetworkStatus = async () => {
  try {
    const data = await get('/api/gas-station-network/network-status');
    networkStatus.value = data;
  } catch (e) {
    console.error('Failed to fetch network status:', e);
  }
};

// Initialize
onMounted(async () => {
  loading.value = true;
  await Promise.all([
    fetchPrices(),
    fetchRecommendation(),
    fetchEstimates(),
    fetchChainComparisons(),
    fetchHistory(),
    fetchSavingTips(),
    fetchBestTime(),
    fetchNetworkStatus(),
  ]);
  loading.value = false;
});
</script>

<style scoped>
.gas-station-network {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.status-indicator .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
}

.status-indicator.congested .dot { background: #ef4444; }
.status-indicator.degraded .dot { background: #f59e0b; }

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
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  text-align: center;
}

.stat-card.cheapest { border-left: 4px solid #22c55e; }
.stat-card.fast { border-left: 4px solid #3b82f6; }
.stat-card.avg { border-left: 4px solid #8b5cf6; }
.stat-card.savings { border-left: 4px solid #f59e0b; }

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1a1a1a;
}

.stat-detail {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 16px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #e2e8f0;
}

.tab-btn.active {
  background: #667eea;
  color: white;
}

.tab-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  margin: 0;
}

.chain-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.prices-table-wrapper, .estimates-table-wrapper {
  overflow-x: auto;
}

.prices-table, .estimates-table {
  width: 100%;
  border-collapse: collapse;
}

.prices-table th, .estimates-table th,
.prices-table td, .estimates-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.prices-table th {
  background: #f8fafc;
  font-weight: 600;
  font-size: 13px;
  color: #64748b;
}

.chain-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.chain-icon {
  font-size: 18px;
}

.gas-price {
  font-family: monospace;
}

.gas-price.lowest {
  background: #dcfce7;
  color: #166534;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.trend {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.trend.rising { background: #fee2e2; color: #dc2626; }
.trend.falling { background: #dcfce7; color: #16a34a; }
.trend.stable { background: #f1f5f9; color: #64748b; }

.confidence-bar {
  width: 60px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  display: inline-block;
  margin-right: 6px;
}

.confidence-fill {
  height: 100%;
  background: #22c55e;
  transition: width 0.3s;
}

.confidence-text {
  font-size: 12px;
  color: #64748b;
}

/* Recommendation Panel */
.recommendation-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  margin-bottom: 24px;
}

.rec-header h3 {
  margin: 0 0 16px 0;
}

.rec-body {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.rec-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.rec-value {
  font-size: 18px;
  font-weight: 600;
}

.rec-value.highlight {
  color: #fbbf24;
}

.alternatives-section h4 {
  margin: 0 0 16px 0;
}

.alternatives-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.alt-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.alt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.alt-chain {
  font-weight: 600;
}

.alt-recommend {
  font-size: 12px;
  color: #64748b;
}

.alt-details .alt-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  color: #64748b;
}

.alt-item.total {
  border-top: 1px solid #e2e8f0;
  margin-top: 8px;
  padding-top: 8px;
  font-weight: 600;
  color: #1a1a1a;
}

.best-time-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
}

.best-time-card h4 {
  margin: 0 0 16px 0;
}

.time-info {
  display: flex;
  gap: 32px;
  margin-bottom: 12px;
}

.time-item {
  display: flex;
  flex-direction: column;
}

.time-label {
  font-size: 12px;
  color: #64748b;
}

.time-value {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.pattern {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* Estimate Controls */
.estimate-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.estimate-controls select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

/* Comparison Grid */
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.comparison-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.comparison-card.highly-recommended { border-color: #22c55e; background: #f0fdf4; }
.comparison-card.recommended { border-color: #3b82f6; background: #eff6ff; }
.comparison-card.acceptable { border-color: #f59e0b; background: #fffbeb; }
.comparison-card.not-recommended { border-color: #ef4444; background: #fef2f2; }

.comp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comp-chain {
  font-weight: 600;
}

.comp-score {
  background: #1a1a1a;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
}

.comp-details .comp-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  color: #64748b;
}

.comp-footer {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
}

.comp-recommend {
  font-size: 12px;
  font-weight: 500;
}

/* History Panel */
.history-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.history-controls select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.chart-placeholder {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  min-height: 300px;
}

.chart-legend {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.legend-item {
  font-size: 13px;
}

.legend-item.slow { color: #22c55e; }
.legend-item.normal { color: #3b82f6; }
.legend-item.fast { color: #ef4444; }

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 200px;
}

.chart-bar-group {
  flex: 1;
  display: flex;
  gap: 1px;
  align-items: flex-end;
}

.bar {
  flex: 1;
  min-width: 4px;
  transition: height 0.3s;
}

.bar.slow { background: #22c55e; }
.bar.normal { background: #3b82f6; }
.bar.fast { background: #ef4444; }

/* Tips Panel */
.tips-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.tip-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.tip-card.easy { border-left: 4px solid #22c55e; }
.tip-card.medium { border-left: 4px solid #f59e0b; }
.tip-card.hard { border-left: 4px solid #ef4444; }

.tip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.tip-text {
  font-size: 14px;
  font-weight: 500;
}

.tip-difficulty {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  text-transform: uppercase;
}

.tip-savings {
  font-size: 14px;
  color: #16a34a;
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .alternatives-grid,
  .comparison-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tips-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .rec-body {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .alternatives-grid,
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>
