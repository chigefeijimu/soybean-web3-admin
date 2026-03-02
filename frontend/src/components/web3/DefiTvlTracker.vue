<template>
  <div class="defi-tvl-tracker">
    <div class="header">
      <h2>📊 DeFi TVL Tracker</h2>
      <div class="actions">
        <button @click="refreshData" class="btn-refresh" :disabled="loading">
          {{ loading ? '⏳' : '🔄' }} Refresh
        </button>
      </div>
    </div>

    <!-- Overview Stats -->
    <div class="overview-grid" v-if="overview">
      <div class="stat-card main">
        <div class="stat-label">Total DeFi TVL</div>
        <div class="stat-value">{{ overview.totalTvlFormatted }}</div>
        <div class="stat-change" :class="overview.avgChange24h >= 0 ? 'positive' : 'negative'">
          {{ overview.avgChange24h >= 0 ? '📈' : '📉' }} {{ overview.avgChange24h }}% (24h)
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">24h Volume</div>
        <div class="stat-value">{{ overview.totalVolume24hFormatted }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">24h Revenue</div>
        <div class="stat-value">{{ overview.totalRevenue24hFormatted }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Protocols</div>
        <div class="stat-value">{{ overview.protocolCount }}</div>
      </div>
    </div>

    <!-- Category Distribution -->
    <div class="section" v-if="overview?.categories">
      <h3>📂 Category Distribution</h3>
      <div class="category-grid">
        <div 
          v-for="cat in overview.categories" 
          :key="cat.id" 
          class="category-card"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectCategory(cat.id)"
        >
          <div class="cat-name">{{ cat.name }}</div>
          <div class="cat-tvl">{{ formatTvl(cat.tvl) }}</div>
          <div class="cat-count">{{ cat.count }} protocols</div>
        </div>
      </div>
    </div>

    <!-- Protocol List -->
    <div class="section">
      <h3>🏆 Top Protocols</h3>
      <div class="protocol-list">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Protocol</th>
              <th>Category</th>
              <th>TVL</th>
              <th>24h Change</th>
              <th>7d Change</th>
              <th>24h Volume</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(protocol, index) in filteredProtocols" :key="protocol.id">
              <td>{{ index + 1 }}</td>
              <td class="protocol-cell">
                <span class="protocol-icon">{{ getProtocolIcon(protocol.category) }}</span>
                <span class="protocol-name">{{ protocol.name }}</span>
              </td>
              <td>
                <span class="category-badge">{{ protocol.category }}</span>
              </td>
              <td class="tvl-cell">{{ formatTvl(protocol.tvl) }}</td>
              <td :class="protocol.tvlChange24h >= 0 ? 'positive' : 'negative'">
                {{ protocol.tvlChange24h >= 0 ? '↑' : '↓' }} {{ Math.abs(protocol.tvlChange24h).toFixed(2) }}%
              </td>
              <td :class="protocol.tvlChange7d >= 0 ? 'positive' : 'negative'">
                {{ protocol.tvlChange7d >= 0 ? '↑' : '↓' }} {{ Math.abs(protocol.tvlChange7d).toFixed(2) }}%
              </td>
              <td>{{ formatTvl(protocol.volume24h) }}</td>
              <td>
                <button @click="showHistory(protocol)" class="btn-chart">📈</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Protocol History Chart -->
    <div class="section" v-if="showChart && selectedProtocol">
      <h3>📊 {{ selectedProtocol.name }} TVL History</h3>
      <div class="chart-container">
        <div class="chart-bars">
          <div 
            v-for="point in protocolHistory" 
            :key="point.date" 
            class="chart-bar"
            :style="{ height: getBarHeight(point.tvl) + '%' }"
            :title="`${point.date}: ${formatTvl(point.tvl)}`"
          >
            <span class="bar-tooltip">{{ formatTvl(point.tvl) }}</span>
          </div>
        </div>
        <div class="chart-labels">
          <span v-for="(point, i) in protocolHistory" :key="point.date + i">
            {{ formatDate(point.date) }}
          </span>
        </div>
      </div>
      <div class="chart-controls">
        <button 
          v-for="days in [7, 30, 90]" 
          :key="days" 
          @click="loadHistory(selectedProtocol.id, days)"
          class="btn-period"
          :class="{ active: historyDays === days }"
        >
          {{ days }}D
        </button>
      </div>
    </div>

    <!-- Trending -->
    <div class="section" v-if="trending.length">
      <h3>🔥 Trending (7d)</h3>
      <div class="trending-grid">
        <div v-for="protocol in trending" :key="protocol.id" class="trending-card">
          <div class="trending-name">{{ protocol.name }}</div>
          <div class="trending-change positive">↑ {{ protocol.tvlChange7d.toFixed(2) }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Protocol {
  id: string;
  name: string;
  symbol: string;
  category: string;
  chain: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  volume24h: number;
  revenue24h: number;
  logoUrl: string;
}

interface Category {
  id: string;
  name: string;
  tvl: number;
  count: number;
}

interface Overview {
  totalTvl: number;
  totalTvlFormatted: string;
  avgChange24h: string;
  avgChange7d: string;
  totalVolume24h: number;
  totalVolume24hFormatted: string;
  totalRevenue24h: number;
  totalRevenue24hFormatted: string;
  protocolCount: number;
  categories: Category[];
}

interface HistoryPoint {
  date: string;
  tvl: number;
  volume: number;
}

const loading = ref(false);
const protocols = ref<Protocol[]>([]);
const overview = ref<Overview | null>(null);
const trending = ref<Protocol[]>([]);
const selectedCategory = ref<string | null>(null);
const showChart = ref(false);
const selectedProtocol = ref<Protocol | null>(null);
const protocolHistory = ref<HistoryPoint[]>([]);
const historyDays = ref(30);

const filteredProtocols = computed(() => {
  if (!selectedCategory.value) return protocols.value;
  return protocols.value.filter(p => p.category.toLowerCase() === selectedCategory.value);
});

const API_BASE = '/api/web3/defi-tvl';

async function fetchData() {
  loading.value = true;
  try {
    const [protocolsRes, overviewRes, trendingRes] = await Promise.all([
      fetch(`${API_BASE}/protocols`).then(r => r.json()),
      fetch(`${API_BASE}/overview`).then(r => r.json()),
      fetch(`${API_BASE}/trending?days=7`).then(r => r.json()),
    ]);
    protocols.value = protocolsRes;
    overview.value = overviewRes;
    trending.value = trendingRes;
  } catch (e) {
    console.error('Failed to fetch DeFi TVL data:', e);
  } finally {
    loading.value = false;
  }
}

async function loadHistory(protocolId: string, days: number) {
  historyDays.value = days;
  const res = await fetch(`${API_BASE}/history?protocol=${protocolId}&days=${days}`);
  protocolHistory.value = await res.json();
}

async function showHistory(protocol: Protocol) {
  selectedProtocol.value = protocol;
  showChart.value = true;
  await loadHistory(protocol.id, historyDays.value);
}

function selectCategory(categoryId: string) {
  selectedCategory.value = selectedCategory.value === categoryId ? null : categoryId;
}

function refreshData() {
  fetchData();
}

function formatTvl(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getBarHeight(tvl: number): number {
  if (!protocolHistory.value.length) return 0;
  const max = Math.max(...protocolHistory.value.map(p => p.tvl));
  const min = Math.min(...protocolHistory.value.map(p => p.tvl));
  const range = max - min || 1;
  return ((tvl - min) / range) * 80 + 10;
}

function getProtocolIcon(category: string): string {
  const icons: Record<string, string> = {
    DEX: '🔄',
    Lending: '💰',
    Staking: '🔒',
    Yield: '🌾',
    Aggregator: '🔗',
  };
  return icons[category] || '📊';
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.defi-tvl-tracker {
  padding: 20px;
  background: #0d1117;
  border-radius: 12px;
  color: #e6edf3;
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
  color: #58a6ff;
}

.btn-refresh {
  background: #21262d;
  border: 1px solid #30363d;
  color: #e6edf3;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #30363d;
}

.btn-refresh:disabled {
  opacity: 0.6;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
}

.stat-card.main {
  grid-column: span 1;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-color: #58a6ff;
}

.stat-label {
  font-size: 12px;
  color: #8b949e;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #e6edf3;
}

.stat-change {
  font-size: 14px;
  margin-top: 8px;
}

.stat-change.positive { color: #3fb950; }
.stat-change.negative { color: #f85149; }

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #e6edf3;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.category-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-card:hover, .category-card.active {
  border-color: #58a6ff;
  background: #1f2937;
}

.cat-name {
  font-weight: 600;
  color: #e6edf3;
}

.cat-tvl {
  font-size: 18px;
  color: #58a6ff;
  margin: 4px 0;
}

.cat-count {
  font-size: 12px;
  color: #8b949e;
}

.protocol-list table {
  width: 100%;
  border-collapse: collapse;
  background: #161b22;
  border-radius: 8px;
  overflow: hidden;
}

.protocol-list th,
.protocol-list td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #30363d;
}

.protocol-list th {
  background: #21262d;
  color: #8b949e;
  font-size: 12px;
  text-transform: uppercase;
}

.protocol-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.protocol-icon {
  font-size: 20px;
}

.protocol-name {
  font-weight: 600;
}

.tvl-cell {
  font-weight: 600;
  color: #58a6ff;
}

.positive { color: #3fb950; }
.negative { color: #f85149; }

.category-badge {
  background: #21262d;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.btn-chart {
  background: #21262d;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-chart:hover {
  background: #30363d;
}

.chart-container {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 12px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 200px;
  padding-bottom: 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, #58a6ff 0%, #1f6feb 100%);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
  transition: all 0.2s;
}

.chart-bar:hover {
  background: linear-gradient(180deg, #79c0ff 0%, #58a6ff 100%);
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #21262d;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s;
}

.chart-bar:hover .bar-tooltip {
  opacity: 1;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #8b949e;
  margin-top: 8px;
}

.chart-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-period {
  background: #21262d;
  border: 1px solid #30363d;
  color: #8b949e;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-period.active {
  background: #58a6ff;
  color: white;
  border-color: #58a6ff;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.trending-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.trending-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.trending-change.positive {
  color: #3fb950;
  font-weight: 700;
}

@media (max-width: 1200px) {
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
  .category-grid { grid-template-columns: repeat(3, 1fr); }
  .trending-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .overview-grid { grid-template-columns: 1fr; }
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .trending-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
