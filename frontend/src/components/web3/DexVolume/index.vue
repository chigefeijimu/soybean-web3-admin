<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useFetch } from '@vueuse/core';

// Types
interface DexInfo {
  name: string;
  volume24h: number;
  volumeChange24h: number;
  tvl: number;
  transactions24h: number;
  pairs: number;
}

interface PairInfo {
  address: string;
  token0Symbol: string;
  token1Symbol: string;
  volume24h: number;
  volumeChange24h: number;
  tvl: number;
  priceChange24h: number;
  liquidity: number;
}

interface Chain {
  id: string;
  name: string;
  symbol: string;
}

// State
const selectedChain = ref('eth');
const selectedDex = ref('');
const selectedTab = ref('overview');
const days = ref(7);
const isLoading = ref(false);

// Data
const chains = ref<Chain[]>([
  { id: 'eth', name: 'Ethereum', symbol: 'ETH' },
  { id: 'arb', name: 'Arbitrum', symbol: 'ARB' },
  { id: 'op', name: 'Optimism', symbol: 'OP' },
  { id: 'poly', name: 'Polygon', symbol: 'MATIC' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB' },
  { id: 'base', name: 'Base', symbol: 'BASE' },
]);

const dexes = ref<string[]>([]);
const dexStats = ref<DexInfo[]>([]);
const topPairs = ref<PairInfo[]>([]);
const comparison = ref<{ name: string; volume: number; change: number; share: number }[]>([]);

// API Base URL
const API_BASE = '/api/web3';

// Fetch DEX stats
const { data: statsData, execute: fetchStats } = useFetch(() => `${API_BASE}/dex-volume/stats?chain=${selectedChain.value}`, {
  immediate: false,
});

// Fetch supported DEXes
const { data: dexesData, execute: fetchDexes } = useFetch(() => `${API_BASE}/dex-volume/dexes?chain=${selectedChain.value}`, {
  immediate: false,
});

// Fetch top pairs
const { data: pairsData, execute: fetchPairs } = useFetch(() => 
  `${API_BASE}/dex-volume/pairs?chain=${selectedChain.value}&dex=${selectedDex.value}&limit=50`, {
  immediate: false,
});

// Fetch comparison
const { data: comparisonData, execute: fetchComparison } = useFetch(() => 
  `${API_BASE}/dex-volume/comparison?chain=${selectedChain.value}&days=${days.value}`, {
  immediate: false,
});

// Load data on chain change
async function loadData() {
  isLoading.value = true;
  try {
    await fetchStats();
    if (statsData.value) {
      dexStats.value = statsData.value.dexes || [];
      if (dexStats.value.length > 0 && !selectedDex.value) {
        selectedDex.value = dexStats.value[0].name;
      }
    }

    await fetchDexes();
    if (dexesData.value) {
      dexes.value = dexesData.value.dexes || [];
    }

    await fetchPairs();
    if (pairsData.value) {
      topPairs.value = pairsData.value.pairs || [];
    }

    await fetchComparison();
    if (comparisonData.value) {
      comparison.value = comparisonData.value.dexes || [];
    }
  } catch (e) {
    console.error('Failed to load DEX volume data:', e);
  } finally {
    isLoading.value = false;
  }
}

// Format numbers
function formatNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

// Change chain
function changeChain(chainId: string) {
  selectedChain.value = chainId;
  selectedDex.value = '';
  loadData();
}

// Get tab icon
function getTabIcon(tab: string): string {
  const icons: Record<string, string> = {
    overview: '📊',
    pairs: '🔄',
    comparison: '⚖️',
  };
  return icons[tab] || '📊';
}

// Total volume
const totalVolume = computed(() => {
  return dexStats.value.reduce((sum, dex) => sum + dex.volume24h, 0);
});

// Total TVL
const totalTVL = computed(() => {
  return dexStats.value.reduce((sum, dex) => sum + dex.tvl, 0);
});

// On mount
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="dex-volume-container">
    <!-- Header -->
    <div class="header">
      <h2>📊 DEX Trading Volume Analytics</h2>
      <div class="chain-selector">
        <button
          v-for="chain in chains"
          :key="chain.id"
          :class="['chain-btn', { active: selectedChain === chain.id }]"
          @click="changeChain(chain.id)"
        >
          {{ chain.symbol }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      <span>Loading DEX data...</span>
    </div>

    <template v-else>
      <!-- Summary Stats -->
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-label">Total 24h Volume</div>
          <div class="stat-value">{{ formatNumber(totalVolume) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total TVL</div>
          <div class="stat-value">{{ formatNumber(totalTVL) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active DEXes</div>
          <div class="stat-value">{{ dexStats.length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Top Pair Volume</div>
          <div class="stat-value">{{ formatNumber(topPairs[0]?.volume24h || 0) }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          v-for="tab in ['overview', 'pairs', 'comparison']"
          :key="tab"
          :class="['tab-btn', { active: selectedTab === tab }]"
          @click="selectedTab = tab"
        >
          {{ getTabIcon(tab) }} {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <!-- Overview Tab -->
      <div v-if="selectedTab === 'overview'" class="tab-content">
        <div class="dex-list">
          <div v-for="dex in dexStats" :key="dex.name" class="dex-card">
            <div class="dex-header">
              <h3>{{ dex.name }}</h3>
              <span :class="['change', dex.volumeChange24h >= 0 ? 'positive' : 'negative']">
                {{ formatPercent(dex.volumeChange24h) }}
              </span>
            </div>
            <div class="dex-stats">
              <div class="dex-stat">
                <span class="label">24h Volume</span>
                <span class="value">{{ formatNumber(dex.volume24h) }}</span>
              </div>
              <div class="dex-stat">
                <span class="label">TVL</span>
                <span class="value">{{ formatNumber(dex.tvl) }}</span>
              </div>
              <div class="dex-stat">
                <span class="label">24h Txns</span>
                <span class="value">{{ dex.transactions24h.toLocaleString() }}</span>
              </div>
              <div class="dex-stat">
                <span class="label">Pairs</span>
                <span class="value">{{ dex.pairs.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pairs Tab -->
      <div v-if="selectedTab === 'pairs'" class="tab-content">
        <div class="pairs-header">
          <h3>Top Trading Pairs</h3>
          <select v-model="selectedDex" class="dex-select" @change="loadData">
            <option v-for="dex in dexes" :key="dex" :value="dex">{{ dex }}</option>
          </select>
        </div>
        <div class="pairs-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Pair</th>
                <th>24h Volume</th>
                <th>Volume Change</th>
                <th>TVL</th>
                <th>Price Change</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(pair, index) in topPairs" :key="pair.address">
                <td>{{ index + 1 }}</td>
                <td class="pair-cell">
                  <span class="token">{{ pair.token0Symbol }}</span>
                  <span class="separator">/</span>
                  <span class="token">{{ pair.token1Symbol }}</span>
                </td>
                <td>{{ formatNumber(pair.volume24h) }}</td>
                <td :class="pair.volumeChange24h >= 0 ? 'positive' : 'negative'">
                  {{ formatPercent(pair.volumeChange24h) }}
                </td>
                <td>{{ formatNumber(pair.tvl) }}</td>
                <td :class="pair.priceChange24h >= 0 ? 'positive' : 'negative'">
                  {{ formatPercent(pair.priceChange24h) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Comparison Tab -->
      <div v-if="selectedTab === 'comparison'" class="tab-content">
        <div class="comparison-header">
          <h3>DEX Volume Comparison</h3>
          <div class="days-selector">
            <button
              v-for="d in [1, 7, 30]"
              :key="d"
              :class="['days-btn', { active: days === d }]"
              @click="days = d; loadData()"
            >
              {{ d }}D
            </button>
          </div>
        </div>
        <div class="comparison-chart">
          <div v-for="dex in comparison" :key="dex.name" class="comparison-item">
            <div class="comparison-label">
              <span>{{ dex.name }}</span>
              <span>{{ formatNumber(dex.volume) }}</span>
            </div>
            <div class="comparison-bar-container">
              <div
                class="comparison-bar"
                :style="{ width: `${dex.share}%` }"
              ></div>
            </div>
            <div class="comparison-share">
              {{ dex.share.toFixed(1) }}%
              <span :class="dex.change >= 0 ? 'positive' : 'negative'">
                {{ formatPercent(dex.change) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dex-volume-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #fff;
}

.chain-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chain-btn {
  padding: 8px 16px;
  border: 1px solid #3a3a3a;
  background: #1a1a1a;
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.chain-btn:hover {
  border-color: #4a9eff;
  color: #4a9eff;
}

.chain-btn.active {
  background: #4a9eff;
  border-color: #4a9eff;
  color: #fff;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #888;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 20px;
}

.stat-label {
  color: #888;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 20px;
  border: 1px solid #3a3a3a;
  background: #1a1a1a;
  color: #888;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #4a9eff;
  color: #4a9eff;
}

.tab-btn.active {
  background: #4a9eff;
  border-color: #4a9eff;
  color: #fff;
}

.tab-content {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 24px;
}

.dex-list {
  display: grid;
  gap: 16px;
}

.dex-card {
  background: #252525;
  border: 1px solid #3a3a3a;
  border-radius: 12px;
  padding: 20px;
}

.dex-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dex-header h3 {
  margin: 0;
  font-size: 18px;
  color: #fff;
}

.change {
  font-size: 14px;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
}

.change.positive {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
}

.change.negative {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}

.dex-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.dex-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dex-stat .label {
  color: #888;
  font-size: 12px;
}

.dex-stat .value {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.pairs-header,
.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.pairs-header h3,
.comparison-header h3 {
  margin: 0;
  color: #fff;
}

.dex-select {
  padding: 8px 16px;
  background: #252525;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
}

.days-selector {
  display: flex;
  gap: 8px;
}

.days-btn {
  padding: 6px 12px;
  border: 1px solid #3a3a3a;
  background: #252525;
  color: #888;
  border-radius: 6px;
  cursor: pointer;
}

.days-btn.active {
  background: #4a9eff;
  border-color: #4a9eff;
  color: #fff;
}

.pairs-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #3a3a3a;
}

th {
  color: #888;
  font-weight: 500;
  font-size: 14px;
}

td {
  color: #fff;
}

.pair-cell {
  font-weight: bold;
}

.token {
  color: #4a9eff;
}

.separator {
  color: #888;
  margin: 0 4px;
}

.positive {
  color: #4ade80;
}

.negative {
  color: #f87171;
}

.comparison-chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comparison-label {
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 14px;
}

.comparison-bar-container {
  height: 24px;
  background: #252525;
  border-radius: 4px;
  overflow: hidden;
}

.comparison-bar {
  height: 100%;
  background: linear-gradient(90deg, #4a9eff, #7c3aed);
  transition: width 0.3s ease;
}

.comparison-share {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #888;
}
</style>
