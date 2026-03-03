<template>
  <div class="defi-market-overview">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <h1>📊 DeFi Market Overview</h1>
        <p class="subtitle">Comprehensive DeFi protocol analytics and market trends</p>
      </div>
      <div class="header-actions">
        <select v-model="selectedChain" class="chain-select">
          <option value="">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="avalanche">Avalanche</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
        </select>
        <button @click="refreshData" class="refresh-btn">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Overview Stats -->
    <div class="stats-grid" v-if="overview">
      <div class="stat-card primary">
        <div class="stat-label">Total DeFi TVL</div>
        <div class="stat-value">${{ formatNumber(overview.totalTvl) }}</div>
        <div class="stat-change" :class="overview.avgTvlChange24h >= 0 ? 'positive' : 'negative'">
          {{ overview.avgTvlChange24h >= 0 ? '↑' : '↓' }} {{ Math.abs(overview.avgTvlChange24h).toFixed(2) }}% (24h)
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">24h Volume</div>
        <div class="stat-value">${{ formatNumber(overview.totalVolume24h) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">24h Fees</div>
        <div class="stat-value">${{ formatNumber(overview.totalFees24h) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Protocols</div>
        <div class="stat-value">{{ overview.numProtocols }}</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <!-- TVL Trend Chart -->
      <div class="chart-card">
        <div class="card-header">
          <h3>📈 TVL Trend</h3>
          <div class="period-tabs">
            <button 
              v-for="p in ['7d', '30d', '90d']" 
              :key="p"
              :class="['tab', { active: selectedPeriod === p }]"
              @click="changePeriod(p)"
            >
              {{ p.toUpperCase() }}
            </button>
          </div>
        </div>
        <div class="chart-container" ref="trendChartRef"></div>
      </div>

      <!-- Category Distribution -->
      <div class="chart-card">
        <div class="card-header">
          <h3>📊 Category Distribution</h3>
        </div>
        <div class="category-list" v-if="overview">
          <div 
            v-for="(value, category) in overview.categoryBreakdown" 
            :key="category"
            class="category-item"
          >
            <div class="category-info">
              <span class="category-name">{{ formatCategory(category) }}</span>
              <span class="category-value">${{ formatNumber(value) }}</span>
            </div>
            <div class="category-bar">
              <div 
                class="category-fill" 
                :style="{ width: (value / overview.totalTvl * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chain Stats -->
    <div class="section">
      <div class="section-header">
        <h2>⛓️ Chain Statistics</h2>
      </div>
      <div class="chain-grid" v-if="chainStats">
        <div 
          v-for="chain in chainStats.chains" 
          :key="chain.chain"
          class="chain-card"
        >
          <div class="chain-header">
            <span class="chain-name">{{ formatChain(chain.chain) }}</span>
            <span class="chain-badge">#{{ chainStats.chains.indexOf(chain) + 1 }}</span>
          </div>
          <div class="chain-tvl">${{ formatNumber(chain.tvl) }}</div>
          <div class="chain-change" :class="chain.tvlChange24h >= 0 ? 'positive' : 'negative'">
            {{ chain.tvlChange24h >= 0 ? '+' : '' }}{{ chain.tvlChange24h.toFixed(2) }}% (24h)
          </div>
          <div class="chain-protocols">{{ chain.numProtocols }} protocols</div>
          <div class="chain-dominant">🏆 {{ chain.dominantProtocol }}</div>
        </div>
      </div>
    </div>

    <!-- Top Gainers/Losers -->
    <div class="section">
      <div class="section-header">
        <h2>🔥 Top Gainers & Losers</h2>
        <select v-model="gainersPeriod" class="period-select">
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
        </select>
      </div>
      <div class="gainers-losers" v-if="gainersLosers">
        <div class="panel gainers">
          <h4>📈 Top Gainers</h4>
          <div class="protocol-list">
            <div 
              v-for="protocol in gainersLosers.topGainers.slice(0, 5)" 
              :key="protocol.id"
              class="protocol-item"
            >
              <span class="protocol-name">{{ protocol.name }}</span>
              <span class="protocol-change positive">+{{ protocol.change.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
        <div class="panel losers">
          <h4>📉 Top Losers</h4>
          <div class="protocol-list">
            <div 
              v-for="protocol in gainersLosers.topLosers.slice(0, 5)" 
              :key="protocol.id"
              class="protocol-item"
            >
              <span class="protocol-name">{{ protocol.name }}</span>
              <span class="protocol-change negative">{{ protocol.change.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Protocols Table -->
    <div class="section">
      <div class="section-header">
        <h2>📋 Protocol Rankings</h2>
        <div class="table-controls">
          <select v-model="protocolSort" class="sort-select">
            <option value="tvl">Sort by TVL</option>
            <option value="volume">Sort by Volume</option>
            <option value="fees">Sort by Fees</option>
            <option value="change24h">Sort by 24h Change</option>
          </select>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search protocols..."
            class="search-input"
          />
        </div>
      </div>
      <div class="table-container">
        <table class="protocols-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Protocol</th>
              <th>Category</th>
              <th>Chain</th>
              <th>TVL</th>
              <th>24h Change</th>
              <th>7d Change</th>
              <th>24h Volume</th>
              <th>24h Fees</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(protocol, index) in filteredProtocols" 
              :key="protocol.id"
              @click="showProtocolDetails(protocol)"
            >
              <td>{{ index + 1 }}</td>
              <td class="protocol-name-cell">
                <span class="protocol-icon">🔷</span>
                {{ protocol.name }}
              </td>
              <td>
                <span class="category-badge">{{ protocol.category }}</span>
              </td>
              <td>
                <span class="chain-badge-small">{{ formatChain(protocol.chain) }}</span>
              </td>
              <td>${{ formatNumber(protocol.tvl) }}</td>
              <td :class="protocol.tvlChange24h >= 0 ? 'positive' : 'negative'">
                {{ protocol.tvlChange24h >= 0 ? '+' : '' }}{{ protocol.tvlChange24h.toFixed(2) }}%
              </td>
              <td :class="protocol.tvlChange7d >= 0 ? 'positive' : 'negative'">
                {{ protocol.tvlChange7d >= 0 ? '+' : '' }}{{ protocol.tvlChange7d.toFixed(2) }}%
              </td>
              <td>${{ formatNumber(protocol.volume24h) }}</td>
              <td>${{ formatNumber(protocol.fees24h) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Yield Opportunities -->
    <div class="section">
      <div class="section-header">
        <h2>🌾 Top Yield Opportunities</h2>
      </div>
      <div class="yield-grid" v-if="yieldOpportunities">
        <div 
          v-for="opp in yieldOpportunities.opportunities.slice(0, 8)" 
          :key="opp.protocol"
          class="yield-card"
        >
          <div class="yield-header">
            <span class="yield-protocol">{{ opp.protocol }}</span>
            <span class="yield-chain">{{ formatChain(opp.chain) }}</span>
          </div>
          <div class="yield-apy">{{ opp.apy?.toFixed(2) }}% APY</div>
          <div class="yield-tvl">${{ formatNumber(opp.tvl) }} TVL</div>
          <div class="yield-risk" :class="'risk-' + opp.riskLevel">
            {{ opp.riskLevel.toUpperCase() }} Risk
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading market data...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { defiMarketOverviewApi } from '../service/api/defiMarketOverview';

// State
const loading = ref(false);
const selectedChain = ref('');
const selectedPeriod = ref('30d');
const gainersPeriod = ref('24h');
const protocolSort = ref('tvl');
const searchQuery = ref('');

// Data refs
const overview = ref<any>(null);
const protocols = ref<any[]>([]);
const chainStats = ref<any>(null);
const gainersLosers = ref<any>(null);
const yieldOpportunities = ref<any>(null);
const trends = ref<any>(null);
const trendChartRef = ref<HTMLElement | null>(null);

// Computed
const filteredProtocols = computed(() => {
  let result = [...protocols.value];
  
  if (selectedChain.value) {
    result = result.filter(p => p.chain === selectedChain.value);
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }
  
  // Sort
  result.sort((a, b) => {
    switch (protocolSort.value) {
      case 'tvl': return b.tvl - a.tvl;
      case 'volume': return b.volume24h - a.volume24h;
      case 'fees': return b.fees24h - a.fees24h;
      case 'change24h': return b.tvlChange24h - a.tvlChange24h;
      default: return 0;
    }
  });
  
  return result.slice(0, 50);
});

// Methods
const formatNumber = (num: number): string => {
  if (!num) return '0';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatCategory = (category: string): string => {
  const names: Record<string, string> = {
    'lending': 'Lending',
    'dexes': 'DEX',
    'yield': 'Yield',
    'bridge': 'Bridge',
    'derivatives': 'Derivatives',
    'stabes': 'Stablecoins',
    'liquid-staking': 'Liquid Staking',
    'nft': 'NFT',
    'options': 'Options',
  };
  return names[category] || category;
};

const formatChain = (chain: string): string => {
  const names: Record<string, string> = {
    'ethereum': 'Ethereum',
    'polygon': 'Polygon',
    'arbitrum': 'Arbitrum',
    'optimism': 'Optimism',
    'avalanche': 'Avalanche',
    'bsc': 'BSC',
    'base': 'Base',
    'solana': 'Solana',
  };
  return names[chain] || chain;
};

const loadData = async () => {
  loading.value = true;
  try {
    const [overviewData, protocolsData, chainData, gainersData, yieldData, trendsData] = await Promise.all([
      defiMarketOverviewApi.getOverview(selectedChain.value),
      defiMarketOverviewApi.getProtocols({ sort: protocolSort.value, limit: 50 }),
      defiMarketOverviewApi.getChainStats(),
      defiMarketOverviewApi.getTopGainersLosers(gainersPeriod.value),
      defiMarketOverviewApi.getYieldOpportunities(selectedChain.value),
      defiMarketOverviewApi.getTrends(selectedPeriod.value),
    ]);
    
    overview.value = overviewData;
    protocols.value = protocolsData.protocols;
    chainStats.value = chainData;
    gainersLosers.value = gainersData;
    yieldOpportunities.value = yieldData;
    trends.value = trendsData;
    
    renderTrendChart();
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    loading.value = false;
  }
};

const renderTrendChart = () => {
  if (!trendChartRef.value || !trends.value?.trends) return;
  
  const container = trendChartRef.value;
  container.innerHTML = '';
  
  const width = container.clientWidth || 400;
  const height = 200;
  const padding = 40;
  
  const data = trends.value.trends;
  const maxVal = Math.max(...data.map((d: any) => d.tvl));
  const minVal = Math.min(...data.map((d: any) => d.tvl));
  const range = maxVal - minVal;
  
  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height.toString());
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.background = 'transparent';
  
  // Create gradient
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'areaGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '0%');
  gradient.setAttribute('y2', '100%');
  
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#10b981');
  stop1.setAttribute('stop-opacity', '0.3');
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#10b981');
  stop2.setAttribute('stop-opacity', '0');
  
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  svg.appendChild(defs);
  
  // Create path
  const points = data.map((d: any, i: number) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: height - padding - ((d.tvl - minVal) / range) * (height - padding * 2),
  }));
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', linePath);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#10b981');
  path.setAttribute('stroke-width', '2');
  svg.appendChild(path);
  
  // Area path
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  area.setAttribute('d', areaPath);
  area.setAttribute('fill', 'url(#areaGradient)');
  svg.appendChild(area);
  
  // Add dots
  points.forEach((p, i) => {
    if (i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x.toString());
      circle.setAttribute('cy', p.y.toString());
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', '#10b981');
      svg.appendChild(circle);
    }
  });
  
  container.appendChild(svg);
};

const changePeriod = (period: string) => {
  selectedPeriod.value = period;
  defiMarketOverviewApi.getTrends(period).then(data => {
    trends.value = data;
    renderTrendChart();
  });
};

const refreshData = () => {
  loadData();
};

const showProtocolDetails = (protocol: any) => {
  console.log('Show details for:', protocol);
  // Could open a modal or navigate to details page
};

// Watchers
watch(selectedChain, () => {
  loadData();
});

watch(gainersPeriod, () => {
  defiMarketOverviewApi.getTopGainersLosers(gainersPeriod.value).then(data => {
    gainersLosers.value = data;
  });
});

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.defi-market-overview {
  padding: 20px;
  background: #0a0a0f;
  min-height: 100vh;
  color: #e0e0e0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 28px;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #888;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.chain-select, .period-select, .sort-select {
  padding: 8px 16px;
  background: #1a1a24;
  border: 1px solid #333;
  border-radius: 8px;
  color: #e0e0e0;
  cursor: pointer;
}

.refresh-btn {
  padding: 8px 16px;
  background: #10b981;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #059669;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #1a1a24;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;
}

.stat-card.primary {
  background: linear-gradient(135deg, #10b98120, #06b6d420);
  border-color: #10b981;
}

.stat-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.stat-change {
  font-size: 14px;
  margin-top: 8px;
}

.stat-change.positive { color: #10b981; }
.stat-change.negative { color: #ef4444; }

/* Charts */
.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: #1a1a24;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}

.period-tabs {
  display: flex;
  gap: 8px;
}

.tab {
  padding: 4px 12px;
  background: transparent;
  border: 1px solid #444;
  border-radius: 6px;
  color: #888;
  cursor: pointer;
  font-size: 12px;
}

.tab.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.chart-container {
  height: 200px;
}

/* Category List */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.category-name {
  color: #e0e0e0;
}

.category-value {
  color: #10b981;
}

.category-bar {
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #06b6d4);
  transition: width 0.3s ease;
}

/* Chain Stats */
.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
}

.chain-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.chain-card {
  background: #1a1a24;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #333;
}

.chain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chain-name {
  font-weight: bold;
}

.chain-badge {
  background: #10b981;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.chain-tvl {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.chain-change {
  font-size: 13px;
  margin: 4px 0;
}

.chain-change.positive { color: #10b981; }
.chain-change.negative { color: #ef4444; }

.chain-protocols {
  font-size: 12px;
  color: #888;
}

.chain-dominant {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

/* Gainers/Losers */
.gainers-losers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.panel {
  background: #1a1a24;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;
}

.panel.gainers { border-color: #10b98140; }
.panel.losers { border-color: #ef444440; }

.panel h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.protocol-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.protocol-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #0a0a0f;
  border-radius: 8px;
}

.protocol-change.positive { color: #10b981; }
.protocol-change.negative { color: #ef4444; }

/* Table */
.table-controls {
  display: flex;
  gap: 12px;
}

.search-input {
  padding: 8px 16px;
  background: #1a1a24;
  border: 1px solid #333;
  border-radius: 8px;
  color: #e0e0e0;
}

.table-container {
  overflow-x: auto;
}

.protocols-table {
  width: 100%;
  border-collapse: collapse;
}

.protocols-table th,
.protocols-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #333;
}

.protocols-table th {
  background: #1a1a24;
  color: #888;
  font-weight: 500;
  font-size: 13px;
}

.protocols-table tr:hover {
  background: #1a1a24;
}

.protocols-table td.positive { color: #10b981; }
.protocols-table td.negative { color: #ef4444; }

.protocol-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.protocol-icon {
  font-size: 16px;
}

.category-badge {
  background: #10b98130;
  color: #10b981;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.chain-badge-small {
  background: #06b6d430;
  color: #06b6d4;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* Yield Grid */
.yield-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.yield-card {
  background: #1a1a24;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #333;
}

.yield-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.yield-protocol {
  font-weight: bold;
}

.yield-chain {
  font-size: 12px;
  color: #888;
}

.yield-apy {
  font-size: 24px;
  font-weight: bold;
  color: #10b981;
}

.yield-tvl {
  font-size: 13px;
  color: #888;
  margin: 4px 0;
}

.yield-risk {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.yield-risk.risk-low { background: #10b98130; color: #10b981; }
.yield-risk.risk-medium { background: #f59e0b30; color: #f59e0b; }
.yield-risk.risk-high { background: #ef444430; color: #ef4444; }

/* Loading */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #0a0a0f90;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
  .chain-grid { grid-template-columns: repeat(2, 1fr); }
  .yield-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .chain-grid { grid-template-columns: 1fr; }
  .yield-grid { grid-template-columns: 1fr; }
  .gainers-losers { grid-template-columns: 1fr; }
}
</style>
