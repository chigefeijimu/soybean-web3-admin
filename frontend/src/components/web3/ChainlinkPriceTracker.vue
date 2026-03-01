<template>
  <div class="chainlink-price-tracker">
    <div class="header">
      <div class="title-section">
        <span class="icon">⛓️</span>
        <h3>Chainlink Price Feeds</h3>
      </div>
      <div class="controls">
        <select v-model="selectedChain" class="chain-select">
          <option value="">All Chains</option>
          <option v-for="network in networks" :key="network.chainId" :value="network.name">
            {{ network.name }}
          </option>
        </select>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search pairs..." 
          class="search-input"
        />
        <button @click="refreshPrices" class="refresh-btn" :disabled="loading">
          {{ loading ? '⏳' : '🔄' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Loading price feeds...</span>
    </div>

    <div v-else class="price-grid">
      <div 
        v-for="feed in filteredFeeds" 
        :key="feed.pair" 
        class="price-card"
        :class="{ positive: feed.change24h > 0, negative: feed.change24h < 0 }"
        @click="showDetails(feed)"
      >
        <div class="pair-name">{{ feed.pair }}</div>
        <div class="price-value">${{ formatPrice(feed.price) }}</div>
        <div class="price-change" :class="{ up: feed.change24h > 0, down: feed.change24h < 0 }">
          {{ feed.change24h > 0 ? '↑' : '↓' }} {{ Math.abs(feed.change24h).toFixed(2) }}%
        </div>
        <div class="chain-badge">{{ feed.chain }}</div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedFeed" class="modal-overlay" @click="selectedFeed = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedFeed.pair }} Price Feed</h3>
          <button class="close-btn" @click="selectedFeed = null">×</button>
        </div>
        <div class="modal-content">
          <div class="detail-stats">
            <div class="stat-item">
              <span class="label">Current Price</span>
              <span class="value">${{ formatPrice(selectedFeed.price) }}</span>
            </div>
            <div class="stat-item">
              <span class="label">24h Change</span>
              <span class="value" :class="{ up: selectedFeed.change24h > 0, down: selectedFeed.change24h < 0 }">
                {{ selectedFeed.change24h > 0 ? '+' : '' }}{{ selectedFeed.change24h.toFixed(2) }}%
              </span>
            </div>
            <div class="stat-item">
              <span class="label">Chain</span>
              <span class="value">{{ selectedFeed.chain }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Data Source</span>
              <span class="value">{{ selectedFeed.source }}</span>
            </div>
            <div class="stat-item">
              <span class="label">Last Updated</span>
              <span class="value">{{ formatTime(selectedFeed.timestamp) }}</span>
            </div>
          </div>
          
          <div class="chart-section">
            <h4>Price History (24h)</h4>
            <div class="simple-chart">
              <div 
                v-for="(price, idx) in priceHistory" 
                :key="idx"
                class="chart-bar"
                :style="{ height: getBarHeight(price) + '%' }"
                :title="'$' + price.toFixed(2)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-info">
      <span class="powered-by">🔗 Powered by Chainlink Oracle Network</span>
      <span class="last-update">Last update: {{ lastUpdateTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';

interface PriceFeed {
  pair: string;
  price: number;
  change24h: number;
  timestamp: number;
  source: string;
  chain: string;
}

interface NetworkInfo {
  chainId: number;
  name: string;
  chainlinkFeeds: string[];
}

const loading = ref(true);
const feeds = ref<PriceFeed[]>([]);
const networks = ref<NetworkInfo[]>([]);
const selectedChain = ref('');
const searchQuery = ref('');
const selectedFeed = ref<PriceFeed | null>(null);
const priceHistory = ref<number[]>([]);
const lastUpdateTime = ref('');

let refreshInterval: number | null = null;

const filteredFeeds = computed(() => {
  let result = feeds.value;
  
  if (selectedChain.value) {
    result = result.filter(f => f.chain === selectedChain.value);
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(f => 
      f.pair.toLowerCase().includes(query) || 
      f.chain.toLowerCase().includes(query)
    );
  }
  
  return result;
});

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toFixed(2);
  } else {
    return price.toFixed(4);
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function getBarHeight(price: number): number {
  if (priceHistory.value.length === 0) return 50;
  const min = Math.min(...priceHistory.value);
  const max = Math.max(...priceHistory.value);
  const range = max - min || 1;
  return ((price - min) / range) * 80 + 10;
}

async function fetchPrices() {
  try {
    const response = await fetch('/api/chainlink-price/feeds');
    if (response.ok) {
      feeds.value = await response.json();
      lastUpdateTime.value = new Date().toLocaleTimeString();
    }
  } catch (error) {
    console.error('Failed to fetch prices:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchNetworks() {
  try {
    const response = await fetch('/api/chainlink-price/networks');
    if (response.ok) {
      networks.value = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch networks:', error);
  }
}

async function showDetails(feed: PriceFeed) {
  selectedFeed.value = feed;
  
  try {
    const pair = encodeURIComponent(feed.pair);
    const response = await fetch(`/api/chainlink-price/history?pair=${pair}&hours=24`);
    if (response.ok) {
      const data = await response.json();
      priceHistory.value = data.prices;
    }
  } catch (error) {
    console.error('Failed to fetch history:', error);
    priceHistory.value = [];
  }
}

function refreshPrices() {
  loading.value = true;
  fetchPrices();
}

onMounted(async () => {
  await Promise.all([fetchPrices(), fetchNetworks()]);
  
  // Auto-refresh every 30 seconds
  refreshInterval = window.setInterval(fetchPrices, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.chainlink-price-tracker {
  background: #0d1117;
  border-radius: 12px;
  padding: 20px;
  color: #e6edf3;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-section .icon {
  font-size: 24px;
}

.title-section h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chain-select, .search-input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #30363d;
  background: #161b22;
  color: #e6edf3;
  font-size: 14px;
}

.chain-select:focus, .search-input:focus {
  outline: none;
  border-color: #58a6ff;
}

.refresh-btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: #238636;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #2ea043;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #30363d;
  border-top-color: #58a6ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.price-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.price-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.price-card:hover {
  border-color: #58a6ff;
  transform: translateY(-2px);
}

.price-card.positive {
  border-left: 3px solid #3fb950;
}

.price-card.negative {
  border-left: 3px solid #f85149;
}

.pair-name {
  font-size: 14px;
  color: #8b949e;
  margin-bottom: 8px;
}

.price-value {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.price-change {
  font-size: 14px;
  font-weight: 500;
}

.price-change.up {
  color: #3fb950;
}

.price-change.down {
  color: #f85149;
}

.chain-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 10px;
  background: #30363d;
  padding: 2px 8px;
  border-radius: 10px;
  color: #8b949e;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #161b22;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  border: 1px solid #30363d;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #30363d;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #8b949e;
  font-size: 24px;
  cursor: pointer;
}

.close-btn:hover {
  color: #e6edf3;
}

.modal-content {
  padding: 20px;
}

.detail-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item .label {
  font-size: 12px;
  color: #8b949e;
}

.stat-item .value {
  font-size: 16px;
  font-weight: 600;
}

.stat-item .value.up {
  color: #3fb950;
}

.stat-item .value.down {
  color: #f85149;
}

.chart-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #8b949e;
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  height: 100px;
  gap: 2px;
  background: #0d1117;
  border-radius: 8px;
  padding: 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #238636, #3fb950);
  border-radius: 2px;
  min-height: 4px;
  transition: height 0.3s;
}

.chart-bar:hover {
  background: #58a6ff;
}

.footer-info {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #30363d;
  font-size: 12px;
  color: #8b949e;
}

.powered-by {
  color: #58a6ff;
}
</style>
