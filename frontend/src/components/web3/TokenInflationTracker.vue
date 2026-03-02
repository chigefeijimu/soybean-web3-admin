<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  getTokenSupply,
  getSupplyHistory,
  getInflationAnalysis,
  getTrendingInflation,
  compareTokens,
  getInflationRate,
  type TokenInflationData,
  type TokenSupplyHistory,
  type InflationAnalysis
} from '@/service/api/web3';

const loading = ref(false);
const error = ref('');
const searchAddress = ref('');
const selectedChain = ref('eth');
const compareAddresses = ref('');
const compareMode = ref(false);

const inflationData = ref<TokenInflationData | null>(null);
const supplyHistory = ref<TokenSupplyHistory[]>([]);
const analysis = ref<InflationAnalysis | null>(null);
const trendingTokens = ref<any[]>([]);
const inflationRates = ref<any>(null);
const comparisonResults = ref<InflationAnalysis[]>([]);

const chains = [
  { id: 'eth', name: 'Ethereum', symbol: 'ETH' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'base', name: 'Base', symbol: 'BASE' },
];

const popularTokens = [
  { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', chain: 'eth' },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', chain: 'eth' },
  { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether', chain: 'eth' },
  { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaEe9', symbol: 'AAVE', name: 'Aave', chain: 'eth' },
  { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', symbol: 'UNI', name: 'Uniswap', chain: 'eth' },
  { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', symbol: 'LINK', name: 'Chainlink', chain: 'eth' },
  { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether', chain: 'bsc' },
  { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', chain: 'bsc' },
];

const formatSupply = (supply: string, decimals: number = 18) => {
  if (!supply) return '0';
  try {
    const value = BigInt(supply);
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = value / divisor;
    const fraction = value % divisor;
    
    if (whole === BigInt(0) && fraction === BigInt(0)) return '0';
    
    const wholeStr = Number(whole).toLocaleString();
    if (fraction === BigInt(0)) return wholeStr;
    
    return `${wholeStr}.${fraction.toString().padStart(decimals, '0').slice(0, 4)}`;
  } catch {
    return supply;
  }
};

const formatPercent = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return '0.00';
  return value.toFixed(2);
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'low': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'high': return '#ef4444';
    default: return '#6b7280';
  }
};

const getInflationTrend = (rate: number) => {
  if (rate < 0) return { emoji: '📉', text: 'Deflationary', color: '#10b981' };
  if (rate < 1) return { emoji: '➡️', text: 'Stable', color: '#6b7280' };
  if (rate < 5) return { emoji: '📈', text: 'Low Inflation', color: '#3b82f6' };
  return { emoji: '🚀', text: 'High Inflation', color: '#ef4444' };
};

const searchToken = async () => {
  if (!searchAddress.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const [supply, history, analysisData, rates] = await Promise.all([
      getTokenSupply(selectedChain.value, searchAddress.value),
      getSupplyHistory(selectedChain.value, searchAddress.value, 30),
      getInflationAnalysis(selectedChain.value, searchAddress.value),
      getInflationRate(selectedChain.value, searchAddress.value, 30),
    ]);
    
    inflationData.value = supply;
    supplyHistory.value = history;
    analysis.value = analysisData;
    inflationRates.value = rates;
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch token inflation data';
  } finally {
    loading.value = false;
  }
};

const loadTrending = async () => {
  try {
    trendingTokens.value = await getTrendingInflation(selectedChain.value, 10);
  } catch (e) {
    console.error('Failed to load trending tokens', e);
  }
};

const selectPopularToken = (token: any) => {
  searchAddress.value = token.address;
  selectedChain.value = token.chain;
  searchToken();
};

const compareTokensHandler = async () => {
  if (!compareAddresses.value) return;
  
  const addresses = compareAddresses.value.split(',').map(a => a.trim()).filter(a => a);
  if (addresses.length < 2) {
    error.value = 'Please enter at least 2 addresses to compare';
    return;
  }
  
  loading.value = true;
  error.value = '';
  compareMode.value = true;
  
  try {
    comparisonResults.value = await compareTokens(selectedChain.value, addresses);
  } catch (e: any) {
    error.value = e.message || 'Failed to compare tokens';
  } finally {
    loading.value = false;
  }
};

const resetCompare = () => {
  compareMode.value = false;
  comparisonResults.value = [];
  compareAddresses.value = '';
};

const refreshData = async () => {
  if (compareMode.value) {
    await compareTokensHandler();
  } else if (searchAddress.value) {
    await searchToken();
  } else {
    await loadTrending();
  }
};

onMounted(() => {
  loadTrending();
});
</script>

<template>
  <div class="token-inflation-tracker">
    <div class="header">
      <h2>💰 Token Inflation Tracker</h2>
      <div class="actions">
        <button @click="refreshData" class="btn-refresh" :disabled="loading">
          {{ loading ? '⏳' : '🔄' }} Refresh
        </button>
      </div>
    </div>

    <!-- Chain Selector -->
    <div class="chain-selector">
      <label>Network:</label>
      <select v-model="selectedChain" :disabled="loading">
        <option v-for="chain in chains" :key="chain.id" :value="chain.id">
          {{ chain.name }} ({{ chain.symbol }})
        </option>
      </select>
    </div>

    <!-- Search Input -->
    <div class="search-section" v-if="!compareMode">
      <div class="search-box">
        <input
          v-model="searchAddress"
          type="text"
          placeholder="Enter token contract address..."
          @keyup.enter="searchToken"
          :disabled="loading"
        />
        <button @click="searchToken" :disabled="loading" class="btn-search">
          🔍 Analyze
        </button>
      </div>
      
      <div class="popular-tokens">
        <span class="label">Popular:</span>
        <button
          v-for="token in popularTokens"
          :key="token.address"
          @click="selectPopularToken(token)"
          class="token-chip"
          :class="{ active: searchAddress === token.address }"
        >
          {{ token.symbol }}
        </button>
      </div>

      <!-- Compare Mode Toggle -->
      <div class="compare-toggle">
        <button @click="compareMode = true; error = ''" class="btn-compare">
          ⚖️ Compare Tokens
        </button>
      </div>
    </div>

    <!-- Compare Mode -->
    <div class="compare-section" v-if="compareMode">
      <h3>⚖️ Token Comparison</h3>
      <div class="compare-input">
        <textarea
          v-model="compareAddresses"
          placeholder="Enter addresses separated by commas&#10;Example: 0x...,0x...,0x..."
          rows="3"
        ></textarea>
        <div class="compare-actions">
          <button @click="compareTokensHandler" :disabled="loading" class="btn-compare-action">
            ⚖️ Compare
          </button>
          <button @click="resetCompare" class="btn-back">
            ← Back
          </button>
        </div>
      </div>

      <!-- Comparison Results -->
      <div class="comparison-results" v-if="comparisonResults.length > 0">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Current Supply</th>
              <th>24h Change</th>
              <th>7d Change</th>
              <th>30d Change</th>
              <th>Inflation Rate</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in comparisonResults" :key="item.address">
              <td class="token-cell">
                <span class="token-symbol">{{ item.symbol }}</span>
                <span class="token-name">{{ item.name }}</span>
              </td>
              <td>{{ formatSupply(item.currentSupply) }}</td>
              <td :class="item.supplyChange24h >= 0 ? 'positive' : 'negative'">
                {{ item.supplyChange24h >= 0 ? '+' : '' }}{{ formatPercent(item.supplyChange24h) }}%
              </td>
              <td :class="item.supplyChange7d >= 0 ? 'positive' : 'negative'">
                {{ item.supplyChange7d >= 0 ? '+' : '' }}{{ formatPercent(item.supplyChange7d) }}%
              </td>
              <td :class="item.supplyChange30d >= 0 ? 'positive' : 'negative'">
                {{ item.supplyChange30d >= 0 ? '+' : '' }}{{ formatPercent(item.supplyChange30d) }}%
              </td>
              <td>{{ formatPercent(item.inflationRate30d) }}%</td>
              <td>
                <span class="risk-badge" :style="{ backgroundColor: getRiskColor(item.riskLevel) }">
                  {{ item.riskLevel.toUpperCase() }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Error Message -->
    <div class="error-message" v-if="error">
      ⚠️ {{ error }}
    </div>

    <!-- Main Results -->
    <div class="results-section" v-if="inflationData && !compareMode">
      <!-- Token Overview -->
      <div class="token-overview">
        <div class="token-header">
          <div class="token-info">
            <h3>{{ inflationData.name }} ({{ inflationData.symbol }})</h3>
            <span class="chain-badge">{{ inflationData.chain.toUpperCase() }}</span>
          </div>
          <div class="inflation-badge" :style="{ color: getInflationTrend(analysis?.inflationRate30d || 0).color }">
            {{ getInflationTrend(analysis?.inflationRate30d || 0).emoji }}
            {{ getInflationTrend(analysis?.inflationRate30d || 0).text }}
          </div>
        </div>

        <!-- Supply Stats -->
        <div class="supply-stats">
          <div class="stat-card">
            <div class="stat-label">Total Supply</div>
            <div class="stat-value">{{ formatSupply(inflationData.totalSupply) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Circulating Supply</div>
            <div class="stat-value">{{ formatSupply(inflationData.circulatingSupply) }}</div>
          </div>
          <div class="stat-card" v-if="inflationData.maxSupply">
            <div class="stat-label">Max Supply</div>
            <div class="stat-value">{{ formatSupply(inflationData.maxSupply) }}</div>
          </div>
          <div class="stat-card highlight">
            <div class="stat-label">Non-Circulating</div>
            <div class="stat-value">{{ inflationData.inflationRate.toFixed(2) }}%</div>
          </div>
        </div>
      </div>

      <!-- Inflation Analysis -->
      <div class="analysis-section" v-if="analysis">
        <h3>📊 Inflation Analysis</h3>
        
        <div class="analysis-content">
          <p class="analysis-text">{{ analysis.analysis }}</p>
          
          <div class="supply-changes">
            <div class="change-item">
              <span class="change-label">24h Change:</span>
              <span :class="analysis.supplyChange24h >= 0 ? 'positive' : 'negative'">
                {{ analysis.supplyChange24h >= 0 ? '+' : '' }}{{ formatPercent(analysis.supplyChange24h) }}%
              </span>
            </div>
            <div class="change-item">
              <span class="change-label">7d Change:</span>
              <span :class="analysis.supplyChange7d >= 0 ? 'positive' : 'negative'">
                {{ analysis.supplyChange7d >= 0 ? '+' : '' }}{{ formatPercent(analysis.supplyChange7d) }}%
              </span>
            </div>
            <div class="change-item">
              <span class="change-label">30d Change:</span>
              <span :class="analysis.supplyChange30d >= 0 ? 'positive' : 'negative'">
                {{ analysis.supplyChange30d >= 0 ? '+' : '' }}{{ formatPercent(analysis.supplyChange30d) }}%
              </span>
            </div>
          </div>

          <!-- Risk Level -->
          <div class="risk-section">
            <span class="risk-label">Risk Level:</span>
            <span class="risk-badge large" :style="{ backgroundColor: getRiskColor(analysis.riskLevel) }">
              {{ analysis.riskLevel.toUpperCase() }}
            </span>
          </div>

          <!-- Recommendations -->
          <div class="recommendations" v-if="analysis.recommendations.length > 0">
            <h4>💡 Recommendations</h4>
            <ul>
              <li v-for="(rec, idx) in analysis.recommendations" :key="idx">{{ rec }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Inflation Rates -->
      <div class="rates-section" v-if="inflationRates">
        <h3>📈 Inflation Rates</h3>
        <div class="rates-grid">
          <div class="rate-card">
            <div class="rate-label">Daily</div>
            <div class="rate-value">{{ formatPercent(inflationRates.dailyRate) }}%</div>
          </div>
          <div class="rate-card">
            <div class="rate-label">Weekly</div>
            <div class="rate-value">{{ formatPercent(inflationRates.weeklyRate) }}%</div>
          </div>
          <div class="rate-card">
            <div class="rate-label">Monthly</div>
            <div class="rate-value">{{ formatPercent(inflationRates.monthlyRate) }}%</div>
          </div>
          <div class="rate-card">
            <div class="rate-label">Yearly</div>
            <div class="rate-value">{{ formatPercent(inflationRates.yearlyRate) }}%</div>
          </div>
        </div>
      </div>

      <!-- Supply History Chart -->
      <div class="history-section" v-if="supplyHistory.length > 0">
        <h3>📉 Supply History (30 Days)</h3>
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div
              v-for="(point, idx) in supplyHistory"
              :key="idx"
              class="bar"
              :style="{
                height: `${((parseFloat(point.totalSupply) / parseFloat(supplyHistory[0]?.totalSupply || 1)) - 1) * 1000 + 50}%`,
                backgroundColor: parseFloat(point.change) >= 0 ? '#3b82f6' : '#ef4444'
              }"
              :title="`${point.date}: ${formatSupply(point.totalSupply)} (${formatPercent(point.changePercent)}%)`"
            ></div>
          </div>
          <div class="chart-labels">
            <span>{{ supplyHistory[0]?.date }}</span>
            <span>{{ supplyHistory[supplyHistory.length - 1]?.date }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trending Tokens (when no search) -->
    <div class="trending-section" v-if="!inflationData && !compareMode">
      <h3>🔥 Trending Tokens by Market Cap</h3>
      <div class="trending-grid">
        <div
          v-for="token in trendingTokens"
          :key="token.id"
          class="trending-card"
          @click="searchAddress = token.id.includes('-') ? token.id : token.id; searchToken()"
        >
          <div class="trending-symbol">{{ token.symbol }}</div>
          <div class="trending-name">{{ token.name }}</div>
          <div class="trending-supply">
            <div class="supply-row">
              <span>Total:</span>
              <span>{{ formatSupply(token.totalSupply.toString()) }}</span>
            </div>
            <div class="supply-row">
              <span>Circulating:</span>
              <span>{{ formatSupply(token.circulatingSupply.toString()) }}</span>
            </div>
          </div>
          <div class="trending-inflation" :style="{ color: getInflationTrend(token.inflationRate).color }">
            {{ getInflationTrend(token.inflationRate).emoji }} {{ token.inflationRate.toFixed(2) }}% non-circulating
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.token-inflation-tracker {
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
}

.btn-refresh {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chain-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.chain-selector select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.search-section {
  margin-bottom: 30px;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-box input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.btn-search {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  background: #10b981;
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.popular-tokens {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.popular-tokens .label {
  font-weight: 600;
  color: #6b7280;
}

.token-chip {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.token-chip:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.token-chip.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.compare-toggle {
  margin-top: 15px;
}

.btn-compare {
  padding: 10px 20px;
  border: 1px solid #8b5cf6;
  border-radius: 6px;
  background: #8b5cf6;
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.compare-section {
  margin-bottom: 30px;
}

.compare-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-family: monospace;
  resize: vertical;
}

.compare-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-compare-action {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #8b5cf6;
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.btn-back {
  padding: 10px 20px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.comparison-results {
  margin-top: 20px;
  overflow-x: auto;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.compare-table th,
.compare-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.compare-table th {
  background: #f9fafb;
  font-weight: 600;
}

.token-cell {
  display: flex;
  flex-direction: column;
}

.token-symbol {
  font-weight: 600;
}

.token-name {
  font-size: 12px;
  color: #6b7280;
}

.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.error-message {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  margin-bottom: 20px;
}

.token-overview {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-info h3 {
  margin: 0;
}

.chain-badge {
  padding: 4px 8px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.inflation-badge {
  font-weight: 600;
  font-size: 16px;
}

.supply-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-card {
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-card.highlight {
  background: #f0f9ff;
  border: 2px solid #3b82f6;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.analysis-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.analysis-section h3 {
  margin-top: 0;
}

.analysis-text {
  line-height: 1.6;
  color: #374151;
}

.supply-changes {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin: 20px 0;
}

.change-item {
  display: flex;
  gap: 8px;
}

.change-label {
  color: #6b7280;
}

.risk-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
}

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.risk-badge.large {
  padding: 6px 12px;
  font-size: 14px;
}

.recommendations {
  margin-top: 20px;
  padding: 15px;
  background: #f0fdf4;
  border-radius: 8px;
}

.recommendations h4 {
  margin: 0 0 10px 0;
  color: #166534;
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.recommendations li {
  color: #166534;
  margin-bottom: 5px;
}

.rates-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.rates-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.rate-card {
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
}

.rate-label {
  font-size: 13px;
  color: #6b7280;
}

.rate-value {
  font-size: 20px;
  font-weight: 600;
  margin-top: 5px;
}

.history-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding: 10px 0;
}

.bar {
  flex: 1;
  min-width: 4px;
  border-radius: 2px 2px 0 0;
  transition: all 0.3s;
}

.bar:hover {
  opacity: 0.8;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}

.trending-section {
  margin-top: 30px;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.trending-card {
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.trending-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.trending-symbol {
  font-size: 18px;
  font-weight: 600;
}

.trending-name {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
}

.trending-supply {
  font-size: 12px;
  margin-bottom: 10px;
}

.supply-row {
  display: flex;
  justify-content: space-between;
}

.trending-inflation {
  font-size: 13px;
  font-weight: 500;
}
</style>
