<template>
  <div class="liquidity-heatmap">
    <div class="header">
      <h2>🔥 Cross-chain Liquidity Heatmap</h2>
      <p>Visualize liquidity distribution across DEXs and chains</p>
    </div>

    <!-- Overview Stats -->
    <div class="stats-grid" v-if="overview">
      <div class="stat-card">
        <div class="stat-label">Total TVL</div>
        <div class="stat-value">${{ formatNumber(overview.totalTvl) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">24h Volume</div>
        <div class="stat-value">${{ formatNumber(overview.totalVolume24h) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Pools</div>
        <div class="stat-value">{{ overview.totalPools }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Supported Chains</div>
        <div class="stat-value">{{ overview.chains }}</div>
      </div>
    </div>

    <!-- Chain Distribution -->
    <div class="section">
      <h3>📊 Chain Distribution</h3>
      <div class="chain-bars" v-if="overview?.chainDistribution">
        <div 
          v-for="(tvl, chain) in overview.chainDistribution" 
          :key="chain" 
          class="chain-bar-item"
        >
          <div class="chain-label">
            <span class="chain-name">{{ chain }}</span>
            <span class="chain-value">${{ formatNumber(tvl) }}</span>
          </div>
          <div class="chain-bar">
            <div 
              class="chain-bar-fill" 
              :style="{ width: getBarWidth(tvl) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Heatmap -->
    <div class="section">
      <div class="section-header">
        <h3>🗺️ Liquidity Heatmap</h3>
        <div class="filters">
          <select v-model="selectedChain" @change="loadHeatmap">
            <option value="">All Chains</option>
            <option v-for="chain in supportedChains" :key="chain" :value="chain">
              {{ chain }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="heatmap-grid" v-if="heatmap.length">
        <div 
          v-for="cell in heatmap" 
          :key="`${cell.chain}-${cell.dex}`"
          class="heatmap-cell"
          :style="{ backgroundColor: getHeatmapColor(cell.liquidityScore) }"
          @click="showDexDetails(cell)"
        >
          <div class="cell-chain">{{ cell.chain }}</div>
          <div class="cell-dex">{{ cell.dex }}</div>
          <div class="cell-score">{{ cell.liquidityScore }}</div>
          <div class="cell-tvl">${{ formatNumber(cell.tvl) }}</div>
        </div>
      </div>
    </div>

    <!-- Top Pools -->
    <div class="section">
      <h3>🏆 Top Liquidity Pools</h3>
      <div class="pools-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>DEX</th>
              <th>Chain</th>
              <th>Token Pair</th>
              <th>TVL</th>
              <th>24h Volume</th>
              <th>APY</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(pool, index) in topPools" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ pool.dex }}</td>
              <td><span class="chain-tag">{{ pool.chain }}</span></td>
              <td>{{ pool.token0 }}/{{ pool.token1 }}</td>
              <td>${{ formatNumber(pool.tvl) }}</td>
              <td>${{ formatNumber(pool.volume24h) }}</td>
              <td>{{ pool.apy.toFixed(2) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Token Pair Search -->
    <div class="section">
      <h3>🔍 Token Pair Liquidity</h3>
      <div class="search-form">
        <input 
          v-model="token0" 
          placeholder="Token 0 (e.g., ETH)"
          @keyup.enter="searchTokenPair"
        />
        <span>/</span>
        <input 
          v-model="token1" 
          placeholder="Token 1 (e.g., USDC)"
          @keyup.enter="searchTokenPair"
        />
        <button @click="searchTokenPair">Search</button>
      </div>
      
      <div class="pair-results" v-if="pairResults">
        <div class="results-header">
          <h4>{{ pairResults.token0 }}/{{ pairResults.token1 }}</h4>
          <div v-if="pairResults.bestRoute" class="best-route">
            <span class="badge">Best Route</span>
            {{ pairResults.bestRoute.chain }} - {{ pairResults.bestRoute.dex }}
          </div>
        </div>
        <div class="results-list">
          <div 
            v-for="result in pairResults.results" 
            :key="result.chain"
            class="result-item"
          >
            <div class="result-chain">{{ result.chain }}</div>
            <div class="result-dex">{{ result.dex }}</div>
            <div class="result-tvl">TVL: ${{ formatNumber(result.bestTvl) }}</div>
            <div class="result-volume">Vol: ${{ formatNumber(result.bestVolume) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trends -->
    <div class="section">
      <h3>📈 Liquidity Trends (30 Days)</h3>
      <div class="trends-chart" v-if="trends">
        <div class="trend-summary">
          <div class="trend-item">
            <span class="trend-label">Avg TVL</span>
            <span class="trend-value">${{ formatNumber(trends.summary?.avgTvl || 0) }}</span>
          </div>
          <div class="trend-item">
            <span class="trend-label">TVL Change</span>
            <span 
              class="trend-value"
              :class="trends.summary?.tvlChange > 0 ? 'positive' : 'negative'"
            >
              {{ trends.summary?.tvlChange }}%
            </span>
          </div>
          <div class="trend-item">
            <span class="trend-label">Volume Change</span>
            <span 
              class="trend-value"
              :class="trends.summary?.volumeChange > 0 ? 'positive' : 'negative'"
            >
              {{ trends.summary?.volumeChange }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchApi } from '@/service/api';

const overview = ref<any>(null);
const heatmap = ref<any[]>([]);
const topPools = ref<any[]>([]);
const trends = ref<any>(null);
const supportedChains = ref<string[]>([]);
const selectedChain = ref('');
const token0 = ref('ETH');
const token1 = ref('USDC');
const pairResults = ref<any>(null);

onMounted(async () => {
  await loadOverview();
  await loadHeatmap();
  await loadTopPools();
  await loadTrends();
  await loadSupportedChains();
});

async function loadOverview() {
  try {
    overview.value = await fetchApi('/web3/liquidity-heatmap/overview');
  } catch (e) {
    console.error('Failed to load overview:', e);
  }
}

async function loadHeatmap() {
  try {
    const params = selectedChain.value ? `?chain=${selectedChain.value}` : '';
    heatmap.value = await fetchApi(`/web3/liquidity-heatmap/heatmap${params}`);
  } catch (e) {
    console.error('Failed to load heatmap:', e);
  }
}

async function loadTopPools() {
  try {
    topPools.value = await fetchApi('/web3/liquidity-heatmap/top-pools?limit=15');
  } catch (e) {
    console.error('Failed to load top pools:', e);
  }
}

async function loadTrends() {
  try {
    trends.value = await fetchApi('/web3/liquidity-heatmap/trends?days=30');
  } catch (e) {
    console.error('Failed to load trends:', e);
  }
}

async function loadSupportedChains() {
  try {
    supportedChains.value = await fetchApi('/web3/liquidity-heatmap/chains');
  } catch (e) {
    console.error('Failed to load chains:', e);
  }
}

async function searchTokenPair() {
  if (!token0.value || !token1.value) return;
  try {
    pairResults.value = await fetchApi(
      `/web3/liquidity-heatmap/token-pair/${token0.value}/${token1.value}`
    );
  } catch (e) {
    console.error('Failed to search token pair:', e);
  }
}

function showDexDetails(cell: any) {
  console.log('DEX Details:', cell);
}

function formatNumber(num: number): string {
  if (!num) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

function getBarWidth(value: number): number {
  if (!overview.value?.totalTvl) return 0;
  return Math.min((value / overview.value.totalTvl) * 100, 100);
}

function getHeatmapColor(score: number): string {
  if (score >= 80) return 'rgba(0, 200, 83, 0.8)';
  if (score >= 60) return 'rgba(139, 195, 74, 0.8)';
  if (score >= 40) return 'rgba(255, 235, 59, 0.8)';
  if (score >= 20) return 'rgba(255, 152, 0, 0.8)';
  return 'rgba(244, 67, 54, 0.8)';
}
</script>

<style scoped>
.liquidity-heatmap {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
}

.chain-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chain-bar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chain-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.chain-name {
  text-transform: capitalize;
  color: #333;
}

.chain-value {
  color: #666;
}

.chain-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.chain-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.heatmap-cell {
  padding: 12px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.heatmap-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.cell-chain {
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.9;
}

.cell-dex {
  font-size: 12px;
  font-weight: 600;
  margin: 4px 0;
}

.cell-score {
  font-size: 20px;
  font-weight: 700;
}

.cell-tvl {
  font-size: 11px;
  opacity: 0.9;
}

.pools-table {
  overflow-x: auto;
}

.pools-table table {
  width: 100%;
  border-collapse: collapse;
}

.pools-table th,
.pools-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.pools-table th {
  font-weight: 600;
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
}

.chain-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.search-form input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 150px;
}

.search-form button {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-form button:hover {
  background: #43a047;
}

.pair-results {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.results-header h4 {
  margin: 0;
}

.badge {
  background: #4caf50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.results-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.result-item {
  background: white;
  padding: 12px;
  border-radius: 4px;
}

.result-chain {
  font-weight: 600;
  text-transform: capitalize;
}

.result-dex {
  color: #666;
  font-size: 13px;
}

.result-tvl,
.result-volume {
  font-size: 12px;
  color: #888;
}

.trend-summary {
  display: flex;
  gap: 24px;
}

.trend-item {
  display: flex;
  flex-direction: column;
}

.trend-label {
  font-size: 12px;
  color: #666;
}

.trend-value {
  font-size: 18px;
  font-weight: 600;
}

.trend-value.positive {
  color: #4caf50;
}

.trend-value.negative {
  color: #f44336;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
</style>
