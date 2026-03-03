<template>
  <div class="defi-tvl-history">
    <div class="header">
      <h2>📈 DeFi Protocol TVL History Tracker</h2>
      <div class="actions">
        <select v-model="selectedChain" class="chain-select" @change="loadStatistics">
          <option value="">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="polygon">Polygon</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
          <option value="avalanche">Avalanche</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading TVL data...</p>
    </div>

    <div v-else class="tvl-content">
      <!-- Statistics Overview -->
      <div v-if="statistics" class="statistics-overview">
        <div class="stat-card primary">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <span class="stat-label">Total DeFi TVL</span>
            <span class="stat-value">${{ formatNumber(statistics.totalTvl) }}</span>
            <span class="stat-count">{{ statistics.protocolCount }} protocols tracked</span>
          </div>
        </div>
      </div>

      <!-- Chain Distribution -->
      <div v-if="statistics?.chainDistribution" class="section chain-distribution">
        <h3>🌐 TVL by Chain</h3>
        <div class="chain-grid">
          <div v-for="chain in statistics.chainDistribution" :key="chain.chain" class="chain-card">
            <div class="chain-header">
              <span class="chain-name">{{ formatChainName(chain.chain) }}</span>
              <span class="chain-share">{{ chain.share.toFixed(1) }}%</span>
            </div>
            <div class="chain-tvl">${{ formatNumber(chain.tvl) }}</div>
            <div class="chain-bar">
              <div class="bar-fill" :style="{ width: chain.share + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Protocols -->
      <div v-if="statistics?.topProtocols" class="section top-protocols">
        <h3>🏆 Top Protocols by TVL</h3>
        <div class="protocols-table">
          <div class="table-header">
            <span>Protocol</span>
            <span>TVL</span>
            <span>Market Share</span>
          </div>
          <div v-for="protocol in statistics.topProtocols" :key="protocol.name" class="table-row">
            <span class="protocol-name">{{ protocol.name }}</span>
            <span class="protocol-tvl">${{ formatNumber(protocol.tvl) }}</span>
            <span class="protocol-share">
              <div class="share-bar">
                <div class="bar-fill" :style="{ width: protocol.share + '%' }"></div>
              </div>
              {{ protocol.share.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Protocol Search & TVL History -->
      <div class="section protocol-analysis">
        <h3>🔍 Protocol TVL Analysis</h3>
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            placeholder="Search protocol (e.g., Aave, Uniswap, Curve)..."
            class="search-input"
            @input="handleSearch"
          />
          <select v-model="timeframe" class="timeframe-select">
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="180d">180 Days</option>
            <option value="1y">1 Year</option>
          </select>
          <button @click="loadProtocolTvl" :disabled="!selectedProtocol || loadingProtocol" class="btn-primary">
            {{ loadingProtocol ? 'Loading...' : 'Analyze' }}
          </button>
        </div>

        <!-- Search Results -->
        <div v-if="searchResults.length > 0 && !selectedProtocol" class="search-results">
          <div 
            v-for="result in searchResults" 
            :key="result.name" 
            class="search-result-item"
            @click="selectProtocol(result.name)"
          >
            <span class="result-name">{{ result.name }}</span>
            <span class="result-chain">{{ result.chain }}</span>
            <span class="result-tvl">${{ formatNumber(result.tvl) }}</span>
          </div>
        </div>

        <!-- Protocol TVL Chart -->
        <div v-if="protocolData" class="protocol-detail">
          <div class="protocol-header">
            <h4>{{ protocolData.protocol }}</h4>
            <span class="chain-badge">{{ protocolData.chain }}</span>
          </div>
          
          <div class="protocol-stats">
            <div class="pstat">
              <span class="pstat-label">Current TVL</span>
              <span class="pstat-value">${{ formatNumber(protocolData.currentTvl) }}</span>
            </div>
            <div class="pstat">
              <span class="pstat-label">Average (Period)</span>
              <span class="pstat-value">${{ formatNumber(protocolData.statistics.average) }}</span>
            </div>
            <div class="pstat">
              <span class="pstat-label">Change</span>
              <span class="pstat-value" :class="protocolData.statistics.change24h >= 0 ? 'positive' : 'negative'">
                {{ protocolData.statistics.change24h >= 0 ? '+' : '' }}{{ protocolData.statistics.change24h.toFixed(2) }}%
              </span>
            </div>
            <div class="pstat">
              <span class="pstat-label">Volatility</span>
              <span class="pstat-value">{{ protocolData.statistics.volatility.toFixed(2) }}%</span>
            </div>
          </div>

          <div v-if="protocolData.history.length > 0" class="chart-container">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- TVL Trends -->
      <div class="section tvl-trends">
        <h3>📈 TVL Trends (7 Day)</h3>
        <div v-if="trends.length > 0" class="trends-grid">
          <div v-for="trend in trends.slice(0, 12)" :key="trend.protocol" class="trend-card" @click="selectProtocol(trend.protocol)">
            <div class="trend-header">
              <span class="trend-protocol">{{ trend.protocol }}</span>
              <span class="trend-direction" :class="trend.trendDirection">
                {{ trend.trendDirection === 'up' ? '📈' : trend.trendDirection === 'down' ? '📉' : '➡️' }}
              </span>
            </div>
            <div class="trend-chain">{{ formatChainName(trend.chain) }}</div>
            <div class="trend-tvl">${{ formatNumber(trend.currentTvl) }}</div>
            <div class="trend-change" :class="trend.trend7d >= 0 ? 'positive' : 'negative'">
              {{ trend.trend7d >= 0 ? '+' : '' }}{{ trend.trend7d.toFixed(1) }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { defiTvlHistoryApi, type TvlStatisticsData, type TvlTrend, type ProtocolTvlHistory } from '@/service/defiTvlHistory';

const loading = ref(false);
const loadingProtocol = ref(false);
const selectedChain = ref('');
const searchQuery = ref('');
const timeframe = ref('30d');
const selectedProtocol = ref('');
const statistics = ref<TvlStatisticsData | null>(null);
const trends = ref<TvlTrend[]>([]);
const protocolData = ref<ProtocolTvlHistory | null>(null);
const searchResults = ref<{ name: string; chain: string; tvl: number }[]>([]);
const chartCanvas = ref<HTMLCanvasElement | null>(null);

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatChainName = (chain: string): string => {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    polygon: 'Polygon',
    bsc: 'BSC',
    base: 'Base',
    avalanche: 'Avalanche',
  };
  return names[chain] || chain;
};

const loadStatistics = async () => {
  loading.value = true;
  try {
    statistics.value = await defiTvlHistoryApi.getTvlStatistics(selectedChain.value || undefined);
  } catch (e) {
    console.error('Failed to load statistics:', e);
  } finally {
    loading.value = false;
  }
};

const loadTrends = async () => {
  try {
    trends.value = await defiTvlHistoryApi.getTvlTrends();
  } catch (e) {
    console.error('Failed to load trends:', e);
  }
};

const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  try {
    searchResults.value = await defiTvlHistoryApi.searchProtocols(searchQuery.value);
  } catch (e) {
    console.error('Failed to search:', e);
  }
};

const selectProtocol = (name: string) => {
  selectedProtocol.value = name;
  searchQuery.value = name;
  searchResults.value = [];
  loadProtocolTvl();
};

const loadProtocolTvl = async () => {
  if (!selectedProtocol.value) return;
  
  loadingProtocol.value = true;
  try {
    protocolData.value = await defiTvlHistoryApi.getProtocolTvlHistory(
      selectedProtocol.value,
      { timeframe: timeframe.value }
    );
    
    await nextTick();
    drawChart();
  } catch (e) {
    console.error('Failed to load protocol TVL:', e);
  } finally {
    loadingProtocol.value = false;
  }
};

const drawChart = () => {
  if (!chartCanvas.value || !protocolData.value?.history.length) return;
  
  const canvas = chartCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const data = protocolData.value.history;
  const width = canvas.width = canvas.offsetWidth || 600;
  const height = canvas.height = 300;
  
  ctx.clearRect(0, 0, width, height);
  
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const values = data.map(d => d.tvl);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  
  // Draw grid
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }
  
  // Draw line
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  data.forEach((point, i) => {
    const x = padding + (chartWidth / (data.length - 1)) * i;
    const y = padding + chartHeight - ((point.tvl - minVal) / range) * chartHeight;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Fill area
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.closePath();
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.fill();
};

onMounted(() => {
  loadStatistics();
  loadTrends();
});
</script>

<style scoped>
.defi-tvl-history {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.actions {
  display: flex;
  gap: 12px;
}

.chain-select, .search-input, .timeframe-select {
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.chain-select:focus, .search-input:focus, .timeframe-select:focus {
  border-color: #3b82f6;
}

.btn-primary {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.statistics-overview {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-count {
  font-size: 12px;
  opacity: 0.8;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1a1a2e;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.chain-card {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.chain-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.chain-name {
  font-weight: 600;
  color: #1a1a2e;
}

.chain-share {
  color: #6b7280;
  font-size: 14px;
}

.chain-tvl {
  font-size: 20px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 8px;
}

.chain-bar, .share-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.chain-bar .bar-fill, .share-bar .bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
}

.protocols-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 12px 16px;
  background: #f9fafb;
  font-weight: 600;
  font-size: 14px;
  color: #6b7280;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  align-items: center;
  font-size: 14px;
}

.protocol-name {
  font-weight: 500;
}

.protocol-tvl {
  color: #1a1a2e;
}

.protocol-share {
  display: flex;
  align-items: center;
  gap: 8px;
}

.share-bar {
  flex: 1;
  height: 4px;
}

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
}

.search-results {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #f9fafb;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-name {
  font-weight: 500;
}

.result-chain {
  color: #6b7280;
  font-size: 14px;
}

.result-tvl {
  color: #3b82f6;
  font-weight: 500;
}

.protocol-detail {
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.protocol-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.protocol-header h4 {
  font-size: 20px;
  font-weight: 600;
}

.chain-badge {
  padding: 4px 8px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.protocol-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.pstat {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.pstat-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.pstat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.pstat-value.positive {
  color: #10b981;
}

.pstat-value.negative {
  color: #ef4444;
}

.chart-container {
  height: 300px;
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.chart-container canvas {
  width: 100%;
  height: 100%;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.trend-card {
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.trend-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.trend-protocol {
  font-weight: 600;
  font-size: 14px;
}

.trend-chain {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.trend-tvl {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.trend-change {
  font-size: 14px;
  font-weight: 500;
}

.trend-change.positive {
  color: #10b981;
}

.trend-change.negative {
  color: #ef4444;
}
</style>
