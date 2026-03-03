<template>
  <div class="bridge-analytics">
    <div class="header">
      <h1>🌉 Cross-chain Bridge Analytics</h1>
      <p class="subtitle">跨链桥接分析器 - 实时监控和分析跨链桥接数据</p>
    </div>

    <!-- Overview Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Volume (24h)</div>
        <div class="stat-value">${{ formatNumber(overview.totalVolume) }}</div>
        <div class="stat-change positive">+12.5%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Transactions (24h)</div>
        <div class="stat-value">{{ formatNumber(overview.totalTransactions) }}</div>
        <div class="stat-change positive">+8.3%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Users (24h)</div>
        <div class="stat-value">{{ formatNumber(overview.activeUsers) }}</div>
        <div class="stat-change positive">+5.2%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Transaction Time</div>
        <div class="stat-value">{{ overview.avgTransactionTime?.toFixed(0) }}s</div>
        <div class="stat-change negative">-3.1%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Success Rate</div>
        <div class="stat-value">{{ overview.avgSuccessRate?.toFixed(2) }}%</div>
        <div class="stat-change positive">+0.5%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Supported Bridges</div>
        <div class="stat-value">{{ overview.supportedBridges }}</div>
        <div class="stat-info">{{ overview.supportedChains }} chains</div>
      </div>
    </div>

    <!-- Time Range Selector -->
    <div class="filter-bar">
      <div class="time-selector">
        <button 
          v-for="range in timeRanges" 
          :key="range"
          :class="['time-btn', { active: selectedTimeRange === range }]"
          @click="changeTimeRange(range)"
        >
          {{ range }}
        </button>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-grid">
      <div class="chart-card full-width">
        <h3>📈 Bridge Volume Trends</h3>
        <div class="chart-placeholder">
          <div class="trend-chart" v-if="trendData.length">
            <div 
              v-for="(point, index) in trendData" 
              :key="index"
              class="trend-bar"
              :style="{ height: (point.volume / maxVolume * 100) + '%' }"
            >
              <span class="bar-tooltip">${{ formatNumber(point.volume) }}</span>
            </div>
          </div>
          <div v-else class="loading">Loading trends...</div>
        </div>
      </div>

      <div class="chart-card">
        <h3>⛓️ Chain Volume Distribution</h3>
        <div class="chain-list">
          <div 
            v-for="chain in chainVolumes" 
            :key="chain.chain"
            class="chain-item"
          >
            <span class="chain-name">{{ chain.chain }}</span>
            <div class="chain-bar-container">
              <div 
                class="chain-bar" 
                :style="{ width: (chain.totalVolume / maxChainVolume * 100) + '%' }"
              ></div>
            </div>
            <span class="chain-volume">${{ formatNumber(chain.totalVolume) }}</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>🌐 Bridge Comparison</h3>
        <div class="bridge-list">
          <div 
            v-for="bridge in bridgeStats" 
            :key="bridge.bridge"
            class="bridge-item"
          >
            <div class="bridge-header">
              <span class="bridge-name">{{ bridge.bridge }}</span>
              <span class="bridge-volume">${{ formatNumber(bridge.volume) }}</span>
            </div>
            <div class="bridge-stats">
              <span>Tx: {{ formatNumber(bridge.transactions) }}</span>
              <span>Rate: {{ bridge.successRate?.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Popular Routes -->
    <div class="section">
      <h2>🔥 Popular Bridge Routes</h2>
      <div class="routes-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Route</th>
              <th>Bridge</th>
              <th>Volume</th>
              <th>Transactions</th>
              <th>Avg Time</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="route in popularRoutes" :key="route.id">
              <td>#{{ route.id }}</td>
              <td>{{ route.sourceChain }} → {{ route.destChain }}</td>
              <td>{{ route.bridge }}</td>
              <td>${{ formatNumber(route.volume) }}</td>
              <td>{{ formatNumber(route.transactions) }}</td>
              <td>{{ route.avgTime?.toFixed(0) }}s</td>
              <td>
                <span :class="['rate-badge', route.successRate > 95 ? 'high' : 'medium']">
                  {{ route.successRate?.toFixed(1) }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Popular Tokens -->
    <div class="section">
      <h2>💰 Popular Bridged Tokens</h2>
      <div class="tokens-grid">
        <div 
          v-for="token in popularTokens" 
          :key="token.symbol"
          class="token-card"
        >
          <div class="token-rank">#{{ token.rank }}</div>
          <div class="token-symbol">{{ token.symbol }}</div>
          <div class="token-name">{{ token.name }}</div>
          <div class="token-volume">${{ formatNumber(token.volume24h) }}</div>
          <div class="token-tx">{{ formatNumber(token.transactions24h) }} txns</div>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div class="section">
      <h2>🚨 Bridge Alerts</h2>
      <div class="alerts-list">
        <div 
          v-for="alert in alerts" 
          :key="alert.id"
          :class="['alert-item', alert.severity]"
        >
          <div class="alert-icon">
            {{ alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵' }}
          </div>
          <div class="alert-content">
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-meta">
              <span>{{ alert.affectedBridge }}</span>
              <span>{{ formatTime(alert.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bridge Efficiency -->
    <div class="section">
      <h2>📊 Bridge Efficiency Analysis</h2>
      <div class="efficiency-grid">
        <div 
          v-for="eff in efficiencyData" 
          :key="eff.bridgeName"
          class="efficiency-card"
        >
          <h4>{{ eff.bridgeName }}</h4>
          <div class="efficiency-metrics">
            <div class="metric">
              <span class="label">Avg Time</span>
              <span class="value">{{ eff.avgCompletionTime?.toFixed(0) }}s</span>
            </div>
            <div class="metric">
              <span class="label">Success Rate</span>
              <span class="value">{{ eff.successRate?.toFixed(1) }}%</span>
            </div>
            <div class="metric">
              <span class="label">Gas Efficiency</span>
              <span class="value">{{ eff.gasEfficiency?.toFixed(0) }}%</span>
            </div>
            <div class="metric">
              <span class="label">Reliability</span>
              <span class="value">{{ eff.reliabilityScore?.toFixed(0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const timeRanges = ['24h', '7d', '30d', '90d'];
const selectedTimeRange = ref('7d');

const overview = ref<any>({});
const stats = ref<any>({});
const trendData = ref<any[]>([]);
const chainVolumes = ref<any[]>([]);
const bridgeStats = ref<any[]>([]);
const popularRoutes = ref<any[]>([]);
const popularTokens = ref<any[]>([]);
const alerts = ref<any[]>([]);
const efficiencyData = ref<any[]>([]);

const maxVolume = computed(() => {
  if (!trendData.value.length) return 1;
  return Math.max(...trendData.value.map((d: any) => d.volume));
});

const maxChainVolume = computed(() => {
  if (!chainVolumes.value.length) return 1;
  return Math.max(...chainVolumes.value.map((c: any) => c.totalVolume));
});

const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatTime = (timestamp: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const loadData = async () => {
  try {
    const [overviewRes, statsRes, trendsRes, chainsRes, routesRes, tokensRes, alertsRes, efficiencyRes] = await Promise.all([
      fetch('/api/web3/cross-chain-bridge-analytics/overview').then(r => r.json()),
      fetch(`/api/web3/cross-chain-bridge-analytics/stats?timeRange=${selectedTimeRange.value}`).then(r => r.json()),
      fetch('/api/web3/cross-chain-bridge-analytics/trends?timeRange=30d&interval=24h').then(r => r.json()),
      fetch(`/api/web3/cross-chain-bridge-analytics/chains/volume?timeRange=${selectedTimeRange.value}`).then(r => r.json()),
      fetch(`/api/web3/cross-chain-bridge-analytics/routes/popular?limit=10&timeRange=${selectedTimeRange.value}`).then(r => r.json()),
      fetch(`/api/web3/cross-chain-bridge-analytics/tokens/popular?limit=10&timeRange=${selectedTimeRange.value}`).then(r => r.json()),
      fetch('/api/web3/cross-chain-bridge-analytics/alerts').then(r => r.json()),
      fetch(`/api/web3/cross-chain-bridge-analytics/efficiency?timeRange=${selectedTimeRange.value}`).then(r => r.json()),
    ]);

    overview.value = overviewRes.data || {};
    stats.value = statsRes.data || {};
    trendData.value = trendsRes.data?.data || [];
    chainVolumes.value = chainsRes.data || [];
    bridgeStats.value = stats.value.volumeByBridge || [];
    popularRoutes.value = routesRes.data || [];
    popularTokens.value = tokensRes.data || [];
    alerts.value = alertsRes.data || [];
    efficiencyData.value = efficiencyRes.data || [];
  } catch (error) {
    console.error('Failed to load bridge analytics data:', error);
  }
};

const changeTimeRange = (range: string) => {
  selectedTimeRange.value = range;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.bridge-analytics {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 12px;
  font-weight: 600;
}

.stat-change.positive {
  color: #10b981;
}

.stat-change.negative {
  color: #ef4444;
}

.stat-info {
  font-size: 12px;
  color: #999;
}

.filter-bar {
  margin-bottom: 20px;
}

.time-selector {
  display: flex;
  gap: 8px;
}

.time-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.time-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1a1a2e;
}

.chart-placeholder {
  height: 200px;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100%;
  padding-top: 20px;
}

.trend-bar {
  flex: 1;
  background: linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
  cursor: pointer;
  transition: opacity 0.2s;
}

.trend-bar:hover {
  opacity: 0.8;
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.trend-bar:hover .bar-tooltip {
  opacity: 1;
}

.chain-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chain-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chain-name {
  width: 80px;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a2e;
}

.chain-bar-container {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.chain-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 4px;
}

.chain-volume {
  width: 80px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

.bridge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bridge-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.bridge-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.bridge-name {
  font-weight: 600;
  color: #1a1a2e;
}

.bridge-volume {
  font-weight: 600;
  color: #3b82f6;
}

.bridge-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1a1a2e;
}

.routes-table {
  overflow-x: auto;
}

.routes-table table {
  width: 100%;
  border-collapse: collapse;
}

.routes-table th,
.routes-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.routes-table th {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.routes-table td {
  font-size: 13px;
  color: #1a1a2e;
}

.rate-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.rate-badge.high {
  background: #d1fae5;
  color: #059669;
}

.rate-badge.medium {
  background: #fef3c7;
  color: #d97706;
}

.tokens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.token-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.token-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.token-rank {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 4px;
}

.token-symbol {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.token-name {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.token-volume {
  font-size: 14px;
  font-weight: 600;
  color: #10b981;
}

.token-tx {
  font-size: 11px;
  color: #999;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
}

.alert-item.critical {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.alert-item.warning {
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
}

.alert-item.info {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.alert-icon {
  font-size: 20px;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.alert-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #666;
}

.efficiency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.efficiency-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
}

.efficiency-card h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 12px;
}

.efficiency-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.metric {
  display: flex;
  flex-direction: column;
}

.metric .label {
  font-size: 11px;
  color: #666;
}

.metric .value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}
</style>
