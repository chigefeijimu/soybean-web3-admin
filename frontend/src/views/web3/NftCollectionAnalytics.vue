<template>
  <div class="nft-collection-analytics">
    <div class="header">
      <h2>🎨 NFT Collection Analytics</h2>
      <div class="header-actions">
        <select v-model="selectedChain" @change="loadCollections" class="chain-select">
          <option value="all">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="base">Base</option>
        </select>
        <input 
          v-model="searchQuery" 
          @input="debounceSearch"
          type="text" 
          placeholder="Search collections..." 
          class="search-input"
        />
      </div>
    </div>

    <!-- Trending Section -->
    <div v-if="view === 'home'" class="section">
      <h3>🔥 Trending Collections</h3>
      <div class="trending-grid">
        <div 
          v-for="item in trending" 
          :key="item.collection.address" 
          class="trending-card"
          @click="selectCollection(item.collection)"
        >
          <div class="card-header">
            <span class="chain-tag">{{ item.collection.chain }}</span>
            <span class="trend-score">📈 {{ item.score.toFixed(1) }}</span>
          </div>
          <h4>{{ item.collection.name }}</h4>
          <div class="price-info">
            <div class="floor-price">
              <span class="label">Floor</span>
              <span class="value">Ξ {{ item.collection.floorPrice }}</span>
              <span :class="['change', item.collection.floorPriceChange24h >= 0 ? 'positive' : 'negative']">
                {{ item.collection.floorPriceChange24h >= 0 ? '+' : '' }}{{ item.collection.floorPriceChange24h.toFixed(1) }}%
              </span>
            </div>
            <div class="volume">
              <span class="label">24h Vol</span>
              <span class="value">Ξ {{ item.collection.volume24h.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Collections Grid -->
    <div v-if="view === 'home'" class="section">
      <h3>📊 Top Collections</h3>
      <div class="collections-grid">
        <div 
          v-for="collection in collections" 
          :key="collection.address" 
          class="collection-card"
          @click="selectCollection(collection)"
        >
          <div class="card-header">
            <span class="chain-tag">{{ collection.chain }}</span>
            <span class="supply">{{ collection.totalSupply.toLocaleString() }} items</span>
          </div>
          <h4>{{ collection.name }}</h4>
          <p class="symbol">{{ collection.symbol }}</p>
          <div class="stats">
            <div class="stat">
              <span class="label">Floor</span>
              <span class="value">Ξ {{ collection.floorPrice }}</span>
              <span :class="['change', collection.floorPriceChange24h >= 0 ? 'positive' : 'negative']">
                {{ collection.floorPriceChange24h >= 0 ? '+' : '' }}{{ collection.floorPriceChange24h.toFixed(1) }}%
              </span>
            </div>
            <div class="stat">
              <span class="label">24h Volume</span>
              <span class="value">Ξ {{ collection.volume24h.toFixed(1) }}</span>
            </div>
            <div class="stat">
              <span class="label">Holders</span>
              <span class="value">{{ collection.holderCount.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Collection Detail -->
    <div v-if="view === 'detail'" class="section detail-view">
      <button class="back-btn" @click="view = 'home'">← Back to Collections</button>
      
      <div class="detail-header">
        <h2>{{ selectedCollection.name }}</h2>
        <span class="symbol">{{ selectedCollection.symbol }}</span>
        <span class="chain-tag">{{ selectedCollection.chain }}</span>
      </div>

      <div class="detail-stats">
        <div class="stat-card">
          <span class="label">Floor Price</span>
          <span class="value">Ξ {{ selectedCollection.floorPrice }}</span>
          <span :class="['change', selectedCollection.floorPriceChange24h >= 0 ? 'positive' : 'negative']">
            {{ selectedCollection.floorPriceChange24h >= 0 ? '+' : '' }}{{ selectedCollection.floorPriceChange24h.toFixed(1) }}%
          </span>
        </div>
        <div class="stat-card">
          <span class="label">24h Volume</span>
          <span class="value">Ξ {{ selectedCollection.volume24h.toFixed(2) }}</span>
          <span :class="['change', selectedCollection.volumeChange24h >= 0 ? 'positive' : 'negative']">
            {{ selectedCollection.volumeChange24h >= 0 ? '+' : '' }}{{ selectedCollection.volumeChange24h.toFixed(1) }}%
          </span>
        </div>
        <div class="stat-card">
          <span class="label">Sales (24h)</span>
          <span class="value">{{ selectedCollection.sales24h }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Holders</span>
          <span class="value">{{ selectedCollection.holderCount.toLocaleString() }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Market Cap</span>
          <span class="value">Ξ {{ selectedCollection.marketCap.toLocaleString() }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Total Supply</span>
          <span class="value">{{ selectedCollection.totalSupply.toLocaleString() }}</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id" 
          :class="['tab', activeTab === tab.id ? 'active' : '']"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </div>

      <!-- Historical Chart -->
      <div v-if="activeTab === 'chart'" class="tab-content">
        <div class="chart-controls">
          <button 
            v-for="range in ['7d', '30d', '90d']" 
            :key="range"
            :class="['range-btn', historyRange === range ? 'active' : '']"
            @click="historyRange = range; loadHistory()"
          >
            {{ range }}
          </button>
        </div>
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div 
              v-for="(point, index) in historicalData" 
              :key="index"
              class="bar"
              :style="{ height: `${(point.floorPrice / maxFloorPrice) * 100}%` }"
              :title="`${point.date}: Ξ ${point.floorPrice}`"
            ></div>
          </div>
          <div class="chart-labels">
            <span>{{ historicalData[0]?.date }}</span>
            <span>Floor Price (Ξ)</span>
            <span>{{ historicalData[historicalData.length - 1]?.date }}</span>
          </div>
        </div>
      </div>

      <!-- Traits -->
      <div v-if="activeTab === 'traits'" class="tab-content">
        <div class="traits-grid">
          <div v-for="trait in selectedCollection.traits" :key="trait.trait_type" class="trait-card">
            <h5>{{ trait.trait_type }}</h5>
            <div class="trait-values">
              <div v-for="val in getTopValues(trait)" :key="val.value" class="trait-value">
                <span class="value-name">{{ val.value }}</span>
                <span class="value-count">{{ val.count }} ({{ val.rarity.toFixed(1) }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Holders -->
      <div v-if="activeTab === 'holders'" class="tab-content">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Address</th>
              <th>Balance</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(holder, index) in holders" :key="holder.address">
              <td>{{ index + 1 }}</td>
              <td class="address">{{ holder.address }}</td>
              <td>{{ holder.balance }}</td>
              <td>{{ holder.percentage }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Transfers -->
      <div v-if="activeTab === 'transfers'" class="tab-content">
        <table class="data-table">
          <thead>
            <tr>
              <th>Hash</th>
              <th>From</th>
              <th>To</th>
              <th>Token ID</th>
              <th>Price</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transfers" :key="tx.hash">
              <td class="hash">{{ tx.hash }}</td>
              <td class="address">{{ tx.from }}</td>
              <td class="address">{{ tx.to }}</td>
              <td>{{ tx.tokenId }}</td>
              <td>Ξ {{ tx.price }}</td>
              <td>{{ formatTime(tx.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Analytics -->
      <div v-if="activeTab === 'analytics'" class="tab-content">
        <div v-if="analytics" class="analytics-grid">
          <div class="analytics-card">
            <h4>📈 Trend</h4>
            <div class="trend-indicator" :class="analytics.trend">
              {{ analytics.trend.toUpperCase() }}
            </div>
          </div>
          <div class="analytics-card">
            <h4>📊 Volatility</h4>
            <div class="volatility">{{ analytics.volatility }}%</div>
          </div>
          <div class="analytics-card">
            <h4>🎯 Confidence</h4>
            <div class="confidence">{{ analytics.confidence }}%</div>
          </div>
          <div class="analytics-card prediction">
            <h4>🔮 7-Day Prediction</h4>
            <div class="prediction-values">
              <div>Floor: Ξ {{ analytics.prediction.floorPrice7d }}</div>
              <div>Volume: Ξ {{ analytics.prediction.volume7d }}</div>
            </div>
          </div>
          <div class="analytics-card insights">
            <h4>💡 Insights</h4>
            <ul>
              <li v-for="(insight, index) in analytics.insights" :key="index">
                {{ insight }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { get } from '@/service/request';

interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  chain: string;
  totalSupply: number;
  holderCount: number;
  floorPrice: number;
  floorPriceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  sales24h: number;
  avgPrice24h: number;
  marketCap: number;
  traits: any[];
  owners: any[];
  transfers: any[];
  historicalData: any[];
}

interface TrendingItem {
  collection: NFTCollection;
  score: number;
}

const view = ref<'home' | 'detail'>('home');
const selectedChain = ref('all');
const searchQuery = ref('');
const collections = ref<NFTCollection[]>([]);
const trending = ref<TrendingItem[]>([]);
const selectedCollection = ref<NFTCollection | null>(null);
const activeTab = ref('chart');
const historyRange = ref('30d');
const historicalData = ref<any[]>([]);
const holders = ref<any[]>([]);
const transfers = ref<any[]>([]);
const analytics = ref<any>(null);

const tabs = [
  { id: 'chart', name: 'Price Chart', icon: '📈' },
  { id: 'traits', name: 'Traits', icon: '🎨' },
  { id: 'holders', name: 'Holders', icon: '👥' },
  { id: 'transfers', name: 'Transfers', icon: '🔄' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
];

const maxFloorPrice = computed(() => {
  if (!historicalData.value.length) return 1;
  return Math.max(...historicalData.value.map(d => d.floorPrice));
});

const loadCollections = async () => {
  try {
    const response = await get('/nft-collection-analytics/collections', {
      chain: selectedChain.value,
      limit: '20',
    });
    collections.value = response.collections || [];
  } catch (error) {
    console.error('Failed to load collections:', error);
  }
};

const loadTrending = async () => {
  try {
    const response = await get('/nft-collection-analytics/trending', {
      chain: selectedChain.value,
    });
    trending.value = response.trending || [];
  } catch (error) {
    console.error('Failed to load trending:', error);
  }
};

const searchCollections = async () => {
  if (!searchQuery.value) {
    loadCollections();
    return;
  }
  try {
    const response = await get('/nft-collection-analytics/search', {
      q: searchQuery.value,
      chain: selectedChain.value,
    });
    collections.value = response.collections || [];
  } catch (error) {
    console.error('Failed to search:', error);
  }
};

const debounceSearch = () => {
  setTimeout(searchCollections, 300);
};

const selectCollection = async (collection: NFTCollection) => {
  selectedCollection.value = collection;
  view.value = 'detail';
  activeTab.value = 'chart';
  historyRange.value = '30d';
  
  await loadHistory();
  await loadHolders();
  await loadTransfers();
  await loadAnalytics();
};

const loadHistory = async () => {
  if (!selectedCollection.value) return;
  try {
    const response = await get(`/nft-collection-analytics/collection/${selectedCollection.value.address}/history`, {
      range: historyRange.value,
    });
    historicalData.value = response.historicalData || [];
  } catch (error) {
    console.error('Failed to load history:', error);
  }
};

const loadHolders = async () => {
  if (!selectedCollection.value) return;
  try {
    const response = await get(`/nft-collection-analytics/collection/${selectedCollection.value.address}/holders`, {
      limit: '20',
    });
    holders.value = response.holders || [];
  } catch (error) {
    console.error('Failed to load holders:', error);
  }
};

const loadTransfers = async () => {
  if (!selectedCollection.value) return;
  try {
    const response = await get(`/nft-collection-analytics/collection/${selectedCollection.value.address}/transfers`, {
      limit: '20',
    });
    transfers.value = response.transfers || [];
  } catch (error) {
    console.error('Failed to load transfers:', error);
  }
};

const loadAnalytics = async () => {
  if (!selectedCollection.value) return;
  try {
    const response = await post(`/nft-collection-analytics/collection/${selectedCollection.value.address}/analytics`, {});
    analytics.value = response.analytics;
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
};

const getTopValues = (trait: any) => {
  return [
    { value: trait.value, count: trait.count, rarity: trait.rarity },
    { value: 'Other', count: trait.count * 0.3, rarity: trait.rarity * 0.3 },
  ];
};

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const post = async (url: string, data: any) => {
  const response = await fetch(`/api${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

onMounted(() => {
  loadCollections();
  loadTrending();
});
</script>

<style scoped>
.nft-collection-analytics {
  padding: 20px;
  background: #0d1117;
  min-height: 100vh;
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
}

.header-actions {
  display: flex;
  gap: 12px;
}

.chain-select, .search-input {
  padding: 8px 12px;
  border: 1px solid #30363d;
  border-radius: 6px;
  background: #161b22;
  color: #e6edf3;
  font-size: 14px;
}

.search-input {
  width: 200px;
}

.section {
  margin-bottom: 32px;
}

.section h3 {
  margin-bottom: 16px;
  font-size: 18px;
  color: #8b949e;
}

.trending-grid, .collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.trending-card, .collection-card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.trending-card:hover, .collection-card:hover {
  border-color: #58a6ff;
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chain-tag {
  background: #238636;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
}

.trend-score {
  color: #f0883e;
  font-weight: bold;
}

.supply {
  color: #8b949e;
  font-size: 12px;
}

h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
}

.symbol {
  color: #8b949e;
  font-size: 12px;
  display: block;
  margin-bottom: 12px;
}

.price-info, .stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat .label, .price-info .label {
  color: #8b949e;
  font-size: 12px;
}

.stat .value {
  font-weight: 600;
}

.change {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.change.positive {
  background: rgba(35, 134, 54, 0.2);
  color: #3fb950;
}

.change.negative {
  background: rgba(210, 47, 47, 0.2);
  color: #f85149;
}

.detail-view {
  background: #161b22;
  border-radius: 12px;
  padding: 24px;
}

.back-btn {
  background: none;
  border: none;
  color: #58a6ff;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 16px;
  padding: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.detail-header h2 {
  margin: 0;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.stat-card .label {
  display: block;
  color: #8b949e;
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-card .value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #30363d;
  padding-bottom: 8px;
}

.tab {
  background: none;
  border: none;
  color: #8b949e;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.tab:hover {
  background: #21262d;
}

.tab.active {
  background: #21262d;
  color: #58a6ff;
}

.tab-content {
  padding: 16px 0;
}

.chart-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.range-btn {
  background: #21262d;
  border: 1px solid #30363d;
  color: #8b949e;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.range-btn.active {
  background: #58a6ff;
  color: white;
  border-color: #58a6ff;
}

.chart-placeholder {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 24px;
  height: 200px;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
}

.bar {
  flex: 1;
  background: linear-gradient(180deg, #58a6ff, #1f6feb);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  transition: all 0.2s;
  cursor: pointer;
}

.bar:hover {
  background: #79c0ff;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  color: #8b949e;
  font-size: 12px;
  margin-top: 8px;
}

.traits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.trait-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 12px;
}

.trait-card h5 {
  margin: 0 0 8px 0;
  color: #58a6ff;
  font-size: 14px;
}

.trait-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.trait-value {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.value-name {
  color: #e6edf3;
}

.value-count {
  color: #8b949e;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #30363d;
  font-size: 13px;
}

.data-table th {
  color: #8b949e;
  font-weight: 500;
}

.address, .hash {
  font-family: monospace;
  color: #58a6ff;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.analytics-card {
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 16px;
}

.analytics-card h4 {
  margin: 0 0 12px 0;
  color: #8b949e;
  font-size: 14px;
}

.trend-indicator {
  font-size: 24px;
  font-weight: bold;
}

.trend-indicator.bullish {
  color: #3fb950;
}

.trend-indicator.bearish {
  color: #f85149;
}

.trend-indicator.neutral {
  color: #8b949e;
}

.volatility, .confidence {
  font-size: 24px;
  font-weight: bold;
  color: #f0883e;
}

.prediction-values {
  font-size: 14px;
}

.prediction-values div {
  margin-bottom: 4px;
}

.insights ul {
  margin: 0;
  padding-left: 16px;
}

.insights li {
  margin-bottom: 4px;
  font-size: 13px;
  color: #8b949e;
}
</style>
