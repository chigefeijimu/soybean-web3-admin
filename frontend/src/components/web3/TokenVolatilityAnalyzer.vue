<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  analyzeTokenVolatility,
  getVolatilityHistory,
  getVolatilityRankings,
  getRiskAssessment,
  compareTokenVolatility,
  type VolatilityResult,
  type VolatilityHistory,
  type RiskAssessment,
  type VolatilityRanking
} from '@/service/api/web3';

const loading = ref(false);
const error = ref('');
const searchAddress = ref('');
const selectedChain = ref('ethereum');
const selectedTimeframe = ref('30d');
const compareAddresses = ref('');
const compareMode = ref(false);

const volatilityResult = ref<VolatilityResult | null>(null);
const volatilityHistory = ref<VolatilityHistory | null>(null);
const riskAssessment = ref<RiskAssessment | null>(null);
const rankings = ref<VolatilityRanking | null>(null);
const comparisonResults = ref<VolatilityResult[]>([]);

const chains = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
  { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
  { id: 'arbitrum', name: 'Arbitrum', symbol: 'ARB' },
  { id: 'optimism', name: 'Optimism', symbol: 'OP' },
  { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX' },
  { id: 'base', name: 'Base', symbol: 'BASE' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
];

const popularTokens = [
  { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', name: 'Ethereum', chain: 'ethereum' },
  { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped Bitcoin', chain: 'ethereum' },
  { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', chain: 'ethereum' },
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether', chain: 'ethereum' },
  { address: '0x514910771af9ca656af840dff83e8264ecf986ca', symbol: 'LINK', name: 'Chainlink', chain: 'ethereum' },
  { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae', symbol: 'AAVE', name: 'Aave', chain: 'ethereum' },
  { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'UNI', name: 'Uniswap', chain: 'ethereum' },
];

const timeframes = [
  { id: '24h', name: '24 Hours' },
  { id: '7d', name: '7 Days' },
  { id: '30d', name: '30 Days' },
  { id: '90d', name: '90 Days' },
  { id: '1y', name: '1 Year' },
];

const formatPrice = (price: number) => {
  if (!price && price !== 0) return '$0.00';
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2const formatPercent = })}`;
};

 (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return '0.00';
  return value.toFixed(2);
};

const getRiskColor = (level: string) => {
  switch (level) {
    case 'low': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'high': return '#ef4444';
    case 'extreme': return '#dc2626';
    default: return '#6b7280';
  }
};

const getRiskBgColor = (level: string) => {
  switch (level) {
    case 'low': return 'rgba(16, 185, 129, 0.1)';
    case 'medium': return 'rgba(245, 158, 11, 0.1)';
    case 'high': return 'rgba(239, 68, 68, 0.1)';
    case 'extreme': return 'rgba(220, 38, 38, 0.1)';
    default: return 'rgba(107, 114, 128, 0.1)';
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'bullish': return '📈';
    case 'bearish': return '📉';
    case 'volatile': return '🎢';
    default: return '➡️';
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'bullish': return '#10b981';
    case 'bearish': return '#ef4444';
    case 'volatile': return '#f59e0b';
    default: return '#6b7280';
  }
};

const searchToken = async () => {
  if (!searchAddress.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const [volResult, history, risk] = await Promise.all([
      analyzeTokenVolatility(searchAddress.value, selectedChain.value, selectedTimeframe.value),
      getVolatilityHistory(searchAddress.value, selectedChain.value, 90),
      getRiskAssessment(searchAddress.value, selectedChain.value),
    ]);
    
    volatilityResult.value = volResult;
    volatilityHistory.value = history;
    riskAssessment.value = risk;
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch volatility data';
    console.error('Error:', e);
  } finally {
    loading.value = false;
  }
};

const loadRankings = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    rankings.value = await getVolatilityRankings(selectedChain.value, 'volatility', 20);
  } catch (e: any) {
    error.value = e.message || 'Failed to load rankings';
  } finally {
    loading.value = false;
  }
};

const compareTokens = async () => {
  if (!compareAddresses.value) return;
  
  const addresses = compareAddresses.value.split(',').map(a => a.trim()).filter(a => a);
  if (addresses.length < 2) {
    error.value = 'Please enter at least 2 addresses to compare';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    comparisonResults.value = await compareTokenVolatility(addresses, selectedChain.value, selectedTimeframe.value);
  } catch (e: any) {
    error.value = e.message || 'Failed to compare tokens';
  } finally {
    loading.value = false;
  }
};

const selectPopularToken = (token: any) => {
  searchAddress.value = token.address;
  selectedChain.value = token.chain;
  searchToken();
};

const toggleCompareMode = () => {
  compareMode.value = !compareMode.value;
  if (!compareMode.value) {
    comparisonResults.value = [];
    compareAddresses.value = '';
  }
};

onMounted(() => {
  loadRankings();
});
</script>

<template>
  <div class="volatility-analyzer">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">📊 Token Volatility Analyzer</h1>
        <p class="page-subtitle">Analyze token price volatility and risk metrics</p>
      </div>
      <div class="header-right">
        <button 
          class="btn btn-outline" 
          :class="{ active: compareMode }"
          @click="toggleCompareMode"
        >
          ⚖️ Compare Mode
        </button>
      </div>
    </div>

    <!-- Search Panel -->
    <div class="search-panel">
      <div class="search-form">
        <div class="form-group">
          <label>Chain</label>
          <select v-model="selectedChain" class="form-select">
            <option v-for="chain in chains" :key="chain.id" :value="chain.id">
              {{ chain.name }} ({{ chain.symbol }})
            </option>
          </select>
        </div>
        
        <div class="form-group flex-grow">
          <label>Token Address</label>
          <input 
            v-model="searchAddress" 
            type="text" 
            class="form-input" 
            placeholder="Enter token address (e.g., 0x...)"
            @keyup.enter="searchToken"
          />
        </div>
        
        <div class="form-group" v-if="!compareMode">
          <label>Timeframe</label>
          <select v-model="selectedTimeframe" class="form-select">
            <option v-for="tf in timeframes" :key="tf.id" :value="tf.id">
              {{ tf.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>&nbsp;</label>
          <button class="btn btn-primary" @click="searchToken" :disabled="loading">
            {{ loading ? 'Loading...' : 'Analyze' }}
          </button>
        </div>
      </div>
      
      <!-- Popular Tokens -->
      <div class="popular-tokens" v-if="!compareMode">
        <span class="label">Popular:</span>
        <button 
          v-for="token in popularTokens" 
          :key="token.address"
          class="token-chip"
          @click="selectPopularToken(token)"
        >
          {{ token.symbol }}
        </button>
      </div>
      
      <!-- Compare Mode Input -->
      <div class="compare-form" v-if="compareMode">
        <div class="form-group flex-grow">
          <label>Addresses to Compare (comma separated)</label>
          <input 
            v-model="compareAddresses" 
            type="text" 
            class="form-input" 
            placeholder="Enter addresses separated by commas"
            @keyup.enter="compareTokens"
          />
        </div>
        <div class="form-group">
          <label>&nbsp;</label>
          <button class="btn btn-primary" @click="compareTokens" :disabled="loading">
            {{ loading ? 'Comparing...' : 'Compare' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div class="error-message" v-if="error">
      {{ error }}
    </div>

    <!-- Comparison Results -->
    <div class="comparison-section" v-if="compareMode && comparisonResults.length > 0">
      <h2 class="section-title">📊 Volatility Comparison</h2>
      <div class="comparison-grid">
        <div 
          v-for="(token, index) in comparisonResults" 
          :key="index"
          class="comparison-card"
        >
          <div class="card-header">
            <span class="rank">#{{ index + 1 }}</span>
            <span class="token-symbol">{{ token.token.slice(0, 6) }}...</span>
          </div>
          <div class="card-body">
            <div class="metric">
              <span class="metric-label">Current Price</span>
              <span class="metric-value">{{ formatPrice(token.currentPrice) }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">24h Change</span>
              <span 
                class="metric-value" 
                :style="{ color: token.priceChange24h >= 0 ? '#10b981' : '#ef4444' }"
              >
                {{ token.priceChange24h >= 0 ? '+' : '' }}{{ formatPercent(token.priceChange24h) }}%
              </span>
            </div>
            <div class="metric">
              <span class="metric-label">Monthly Volatility</span>
              <span class="metric-value">{{ formatPercent(token.volatility.monthly) }}%</span>
            </div>
            <div class="metric">
              <span class="metric-label">Risk Level</span>
              <span 
                class="metric-badge"
                :style="{ 
                  backgroundColor: getRiskBgColor(token.riskMetrics.level),
                  color: getRiskColor(token.riskMetrics.level)
                }"
              >
                {{ token.riskMetrics.level.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Volatility Results -->
    <div class="results-section" v-if="volatilityResult && !compareMode">
      <!-- Price Overview -->
      <div class="overview-cards">
        <div class="overview-card">
          <div class="card-label">Current Price</div>
          <div class="card-value">{{ formatPrice(volatilityResult.currentPrice) }}</div>
        </div>
        <div class="overview-card">
          <div class="card-label">24h Change</div>
          <div 
            class="card-value" 
            :style="{ color: volatilityResult.priceChange24h >= 0 ? '#10b981' : '#ef4444' }"
          >
            {{ volatilityResult.priceChange24h >= 0 ? '+' : '' }}{{ formatPercent(volatilityResult.priceChange24h) }}%
          </div>
        </div>
        <div class="overview-card">
          <div class="card-label">Trend</div>
          <div class="card-value" :style="{ color: getTrendColor(volatilityResult.trend) }">
            {{ getTrendIcon(volatilityResult.trend) }} {{ volatilityResult.trend.toUpperCase() }}
          </div>
        </div>
        <div class="overview-card">
          <div class="card-label">Risk Score</div>
          <div 
            class="card-value" 
            :style="{ color: getRiskColor(volatilityResult.riskMetrics.level) }"
          >
            {{ volatilityResult.riskMetrics.score }}/100
          </div>
        </div>
      </div>

      <!-- Volatility Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <h3 class="card-title">📈 Volatility Metrics</h3>
          <div class="metric-list">
            <div class="metric-item">
              <span class="metric-label">Daily Volatility</span>
              <span class="metric-value">{{ formatPercent(volatilityResult.volatility.daily) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Weekly Volatility</span>
              <span class="metric-value">{{ formatPercent(volatilityResult.volatility.weekly) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Monthly Volatility</span>
              <span class="metric-value highlight">{{ formatPercent(volatilityResult.volatility.monthly) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Annualized Volatility</span>
              <span class="metric-value">{{ formatPercent(volatilityResult.volatility.annualized) }}%</span>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <h3 class="card-title">⚠️ Risk Metrics</h3>
          <div class="metric-list">
            <div class="metric-item">
              <span class="metric-label">Risk Level</span>
              <span 
                class="metric-badge large"
                :style="{ 
                  backgroundColor: getRiskBgColor(volatilityResult.riskMetrics.level),
                  color: getRiskColor(volatilityResult.riskMetrics.level)
                }"
              >
                {{ volatilityResult.riskMetrics.level.toUpperCase() }}
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Sharpe Ratio</span>
              <span class="metric-value">{{ volatilityResult.riskMetrics.sharpeRatio }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Max Drawdown</span>
              <span class="metric-value negative">-{{ formatPercent(volatilityResult.riskMetrics.maxDrawdown) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">VaR (95%)</span>
              <span class="metric-value negative">-{{ formatPercent(volatilityResult.riskMetrics.var95) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div class="risk-assessment" v-if="riskAssessment">
        <h3 class="section-title">🎯 Risk Assessment</h3>
        <div class="risk-content">
          <div class="risk-score-display">
            <div 
              class="score-circle"
              :style="{ 
                borderColor: getRiskColor(riskAssessment.riskLevel),
                color: getRiskColor(riskAssessment.riskLevel)
              }"
            >
              <span class="score-value">{{ riskAssessment.riskScore }}</span>
              <span class="score-label">Risk Score</span>
            </div>
          </div>
          <div class="risk-details">
            <div class="risk-recommendation">
              <strong>Recommendation:</strong> {{ riskAssessment.recommendation }}
            </div>
            <div class="risk-factors" v-if="riskAssessment.factors.length > 0">
              <strong>Risk Factors:</strong>
              <ul>
                <li v-for="(factor, idx) in riskAssessment.factors" :key="idx">
                  {{ factor }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Volatility History Chart Placeholder -->
      <div class="history-section" v-if="volatilityHistory">
        <h3 class="section-title">📉 Volatility History (90 Days)</h3>
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div 
              v-for="(vol, idx) in volatilityHistory.volatilities.slice(-30)" 
              :key="idx"
              class="chart-bar"
              :style="{ 
                height: `${Math.min(100, vol)}%`,
                backgroundColor: vol > 50 ? '#ef4444' : vol > 30 ? '#f59e0b' : '#10b981'
              }"
              :title="`${vol.toFixed(2)}%`"
            ></div>
          </div>
          <div class="chart-legend">
            <span class="legend-item low">🟢 Low (&lt;20%)</span>
            <span class="legend-item medium">🟡 Medium (20-50%)</span>
            <span class="legend-item high">🔴 High (&gt;50%)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Volatility Rankings -->
    <div class="rankings-section" v-if="!compareMode">
      <h2 class="section-title">🏆 Token Volatility Rankings</h2>
      <div class="rankings-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Token</th>
              <th>Price</th>
              <th>24h Change</th>
              <th>Monthly Volatility</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(token, idx) in rankings?.tokens || []" :key="idx">
              <td class="rank">{{ idx + 1 }}</td>
              <td class="token-info">
                <span class="token-symbol">{{ token.symbol }}</span>
                <span class="token-name">{{ token.name }}</span>
              </td>
              <td class="price">{{ formatPrice(token.price) }}</td>
              <td 
                class="change" 
                :style="{ color: token.change24h >= 0 ? '#10b981' : '#ef4444' }"
              >
                {{ token.change24h >= 0 ? '+' : '' }}{{ formatPercent(token.change24h) }}%
              </td>
              <td class="volatility">{{ formatPercent(token.volatility) }}%</td>
              <td>
                <span 
                  class="risk-badge"
                  :style="{ 
                    backgroundColor: getRiskBgColor(token.riskLevel),
                    color: getRiskColor(token.riskLevel)
                  }"
                >
                  {{ token.riskLevel.toUpperCase() }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.volatility-analyzer {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-outline.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.search-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-form, .compare-form {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.flex-grow {
  flex: 1;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.form-input, .form-select {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.popular-tokens {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.popular-tokens .label {
  font-size: 13px;
  color: #6b7280;
}

.token-chip {
  padding: 6px 12px;
  background: #f3f4f6;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.token-chip:hover {
  background: #e5e7eb;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.metric-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-label {
  color: #6b7280;
  font-size: 14px;
}

.metric-value {
  font-weight: 600;
  color: #1f2937;
}

.metric-value.highlight {
  color: #3b82f6;
  font-size: 18px;
}

.metric-value.negative {
  color: #ef4444;
}

.metric-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.metric-badge.large {
  padding: 6px 14px;
  font-size: 14px;
}

.risk-assessment {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.risk-content {
  display: flex;
  gap: 24px;
  align-items: center;
}

.risk-score-display {
  flex-shrink: 0;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
}

.score-label {
  font-size: 12px;
  opacity: 0.8;
}

.risk-details {
  flex: 1;
}

.risk-recommendation {
  margin-bottom: 12px;
  color: #374151;
}

.risk-factors ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
  color: #6b7280;
}

.risk-factors li {
  margin-bottom: 4px;
}

.history-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-placeholder {
  padding: 20px 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 150px;
  padding: 0 10px;
}

.chart-bar {
  flex: 1;
  min-width: 8px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
}

.chart-bar:hover {
  opacity: 0.8;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
}

.legend-item {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-item.low { color: #10b981; }
.legend-item.medium { color: #f59e0b; }
.legend-item.high { color: #ef4444; }

.comparison-section {
  margin-bottom: 24px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.comparison-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.comparison-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.comparison-card .rank {
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.comparison-card .token-symbol {
  font-weight: 600;
  color: #1f2937;
}

.comparison-card .metric {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.comparison-card .metric:last-child {
  border-bottom: none;
}

.rankings-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.rankings-table {
  overflow-x: auto;
}

.rankings-table table {
  width: 100%;
  border-collapse: collapse;
}

.rankings-table th,
.rankings-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.rankings-table th {
  font-weight: 600;
  color: #6b7280;
  font-size: 13px;
}

.rankings-table td {
  color: #1f2937;
}

.rankings-table .rank {
  font-weight: 600;
  color: #6b7280;
}

.rankings-table .token-info {
  display: flex;
  flex-direction: column;
}

.rankings-table .token-symbol {
  font-weight: 600;
}

.rankings-table .token-name {
  font-size: 12px;
  color: #6b7280;
}

.rankings-table .price {
  font-weight: 500;
}

.rankings-table .change {
  font-weight: 600;
}

.rankings-table .volatility {
  font-weight: 600;
  color: #3b82f6;
}

.risk-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .form-input, .form-select {
    min-width: 100%;
  }
  
  .risk-content {
    flex-direction: column;
  }
}
</style>
