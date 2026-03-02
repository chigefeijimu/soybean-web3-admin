<template>
  <div class="token-discovery">
    <div class="header">
      <h2>🔍 Token Discovery & Screener</h2>
      <div class="header-actions">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tokens..."
          class="search-input"
          @keyup.enter="searchTokens"
        />
        <button @click="searchTokens" class="btn-primary">Search</button>
      </div>
    </div>

    <!-- Market Stats -->
    <div class="market-stats" v-if="marketStats">
      <div class="stat-card">
        <span class="stat-label">Total Market Cap</span>
        <span class="stat-value">${{ formatNumber(marketStats.totalMarketCap) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">24h Volume</span>
        <span class="stat-value">${{ formatNumber(marketStats.totalVolume) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">BTC Dominance</span>
        <span class="stat-value">{{ marketStats.btcDominance?.toFixed(1) }}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">ETH Dominance</span>
        <span class="stat-value">{{ marketStats.ethDominance?.toFixed(1) }}%</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: activeTab === tab.id }]"
        @click="switchTab(tab.id)"
      >
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>

    <!-- Screener Filters -->
    <div class="screener-filters" v-if="activeTab === 'screener'">
      <div class="filter-row">
        <div class="filter-group">
          <label>Min Market Cap ($)</label>
          <input v-model="filters.minMarketCap" type="number" placeholder="0" />
        </div>
        <div class="filter-group">
          <label>Max Market Cap ($)</label>
          <input v-model="filters.maxMarketCap" type="number" placeholder="1000000000" />
        </div>
        <div class="filter-group">
          <label>Min Volume ($)</label>
          <input v-model="filters.minVolume" type="number" placeholder="10000" />
        </div>
        <div class="filter-group">
          <label>Chain</label>
          <select v-model="filters.chain">
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="avalanche">Avalanche</option>
            <option value="solana">Solana</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Sort By</label>
          <select v-model="filters.sortBy">
            <option value="volume">Volume</option>
            <option value="market_cap">Market Cap</option>
            <option value="price">Price</option>
          </select>
        </div>
        <button @click="runScreener" class="btn-primary">Apply Filters</button>
      </div>
    </div>

    <!-- Token List -->
    <div class="token-list">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="tokens.length === 0" class="empty">No tokens found</div>
      <table v-else class="token-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Token</th>
            <th>Price</th>
            <th>24h Change</th>
            <th>Volume</th>
            <th>Market Cap</th>
            <th>Chain</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(token, index) in tokens" :key="token.address" @click="selectToken(token)">
            <td>{{ index + 1 }}</td>
            <td class="token-info">
              <img v-if="token.logo" :src="token.logo" :alt="token.symbol" class="token-logo" />
              <span class="token-symbol">{{ token.symbol }}</span>
              <span class="token-name">{{ token.name }}</span>
            </td>
            <td class="token-price">${{ formatPrice(token.price) }}</td>
            <td :class="['price-change', token.priceChangePercent24h >= 0 ? 'positive' : 'negative']">
              {{ token.priceChangePercent24h >= 0 ? '▲' : '▼' }}
              {{ Math.abs(token.priceChangePercent24h || 0).toFixed(2) }}%
            </td>
            <td>${{ formatNumber(token.volume24h) }}</td>
            <td>${{ formatNumber(token.marketCap) }}</td>
            <td>
              <span class="chain-badge">{{ token.chain?.toUpperCase() }}</span>
            </td>
            <td class="actions">
              <button @click.stop="addToWatchlist(token)" class="btn-icon" title="Add to Watchlist">⭐</button>
              <button @click.stop="viewDetails(token)" class="btn-icon" title="View Details">🔍</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Token Detail Modal -->
    <div v-if="selectedToken" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedToken.name }} ({{ selectedToken.symbol }})</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Price</span>
              <span class="value">${{ formatPrice(selectedToken.price) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">24h Change</span>
              <span :class="['value', selectedToken.priceChangePercent24h >= 0 ? 'positive' : 'negative']">
                {{ selectedToken.priceChangePercent24h?.toFixed(2) }}%
              </span>
            </div>
            <div class="detail-item">
              <span class="label">7d Change</span>
              <span :class="['value', selectedToken.priceChangePercent7d >= 0 ? 'positive' : 'negative']">
                {{ selectedToken.priceChangePercent7d?.toFixed(2) }}%
              </span>
            </div>
            <div class="detail-item">
              <span class="label">30d Change</span>
              <span :class="['value', selectedToken.priceChangePercent30d >= 0 ? 'positive' : 'negative']">
                {{ selectedToken.priceChangePercent30d?.toFixed(2) }}%
              </span>
            </div>
            <div class="detail-item">
              <span class="label">24h High</span>
              <span class="value">${{ formatPrice(selectedToken.high24h) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">24h Low</span>
              <span class="value">${{ formatPrice(selectedToken.low24h) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Volume</span>
              <span class="value">${{ formatNumber(selectedToken.volume24h) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Market Cap</span>
              <span class="value">${{ formatNumber(selectedToken.marketCap) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Circulating Supply</span>
              <span class="value">{{ formatNumber(selectedToken.circulatingSupply) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Total Supply</span>
              <span class="value">{{ formatNumber(selectedToken.totalSupply) }}</span>
            </div>
          </div>
          <div v-if="selectedToken.sparkline?.length" class="sparkline-container">
            <h4>7 Day Price Chart</h4>
            <div class="sparkline-chart">
              <svg viewBox="0 0 200 50" class="sparkline">
                <polyline
                  :points="getSparklinePoints(selectedToken.sparkline)"
                  fill="none"
                  stroke="#4CAF50"
                  stroke-width="1.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Token {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  priceChangePercent7d?: number;
  priceChangePercent30d?: number;
  volume24h: number;
  marketCap: number;
  liquidity?: number;
  holders?: number;
  chain: string;
  logo: string;
  trustScore?: string;
  high24h?: number;
  low24h?: number;
  circulatingSupply?: number;
  totalSupply?: number;
  maxSupply?: number;
  sparkline?: number[];
}

const searchQuery = ref('');
const activeTab = ref('trending');
const loading = ref(false);
const error = ref('');
const tokens = ref<Token[]>([]);
const marketStats = ref<any>(null);
const selectedToken = ref<Token | null>(null);

const filters = ref({
  minMarketCap: 0,
  maxMarketCap: 1000000000,
  minVolume: 10000,
  chain: 'ethereum',
  sortBy: 'volume',
});

const tabs = [
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'new', label: 'New Listings', icon: '🆕' },
  { id: 'gainers', label: 'Gainers', icon: '📈' },
  { id: 'losers', label: 'Losers', icon: '📉' },
  { id: 'volume', label: 'High Volume', icon: '💹' },
  { id: 'screener', label: 'Screener', icon: '🔍' },
];

const API_BASE = '/api/token-discovery';

const formatNumber = (num: number): string => {
  if (!num) return '0';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatPrice = (price: number): string => {
  if (!price) return '0';
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
};

const getSparklinePoints = (data: number[]): string => {
  if (!data || data.length === 0) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data.map((val, i) => {
    const x = (i / (data.length - 1)) * 200;
    const y = 50 - ((val - min) / range) * 50;
    return `${x},${y}`;
  }).join(' ');
};

const fetchTokens = async (endpoint: string, params: Record<string, string> = {}) => {
  loading.value = true;
  error.value = '';
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/${endpoint}${queryString ? '?' + queryString : ''}`);
    const data = await response.json();
    if (data.success) {
      tokens.value = data.data || [];
    } else {
      error.value = 'Failed to fetch tokens';
    }
  } catch (e: any) {
    error.value = e.message || 'Error fetching data';
  } finally {
    loading.value = false;
  }
};

const fetchMarketStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/market-stats`);
    const data = await response.json();
    if (data.success) {
      marketStats.value = data.data;
    }
  } catch (e) {
    console.error('Failed to fetch market stats', e);
  }
};

const switchTab = (tabId: string) => {
  activeTab.value = tabId;
  switch (tabId) {
    case 'trending':
      fetchTokens('trending', { limit: '20' });
      break;
    case 'new':
      fetchTokens('new-listings', { limit: '20' });
      break;
    case 'gainers':
      fetchTokens('gainers', { limit: '20' });
      break;
    case 'losers':
      fetchTokens('losers', { limit: '20' });
      break;
    case 'volume':
      fetchTokens('high-volume', { limit: '20' });
      break;
    case 'screener':
      runScreener();
      break;
  }
};

const searchTokens = async () => {
  if (!searchQuery.value.trim()) return;
  loading.value = true;
  error.value = '';
  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery.value)}`);
    const data = await response.json();
    if (data.success) {
      tokens.value = data.data || [];
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const runScreener = () => {
  const params = {
    minMarketCap: filters.value.minMarketCap.toString(),
    maxMarketCap: filters.value.maxMarketCap.toString(),
    minVolume: filters.value.minVolume.toString(),
    chain: filters.value.chain,
    sortBy: filters.value.sortBy,
    limit: '50',
  };
  fetchTokens('screener', params);
};

const selectToken = (token: Token) => {
  viewDetails(token);
};

const viewDetails = async (token: Token) => {
  try {
    const response = await fetch(`${API_BASE}/token-details?address=${token.address}&chain=${token.chain}`);
    const data = await response.json();
    if (data.success) {
      selectedToken.value = data.data;
    }
  } catch (e) {
    selectedToken.value = token;
  }
};

const addToWatchlist = (token: Token) => {
  alert(`Added ${token.symbol} to watchlist!`);
};

const closeModal = () => {
  selectedToken.value = null;
};

onMounted(() => {
  fetchMarketStats();
  fetchTokens('trending', { limit: '20' });
});
</script>

<style scoped>
.token-discovery {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 250px;
}

.btn-primary {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #45a049;
}

.market-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.screener-filters {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 12px;
  color: #666;
}

.filter-group input,
.filter-group select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-width: 120px;
}

.token-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.token-table {
  width: 100%;
  border-collapse: collapse;
}

.token-table th,
.token-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.token-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 12px;
  color: #666;
}

.token-table tr:hover {
  background: #f8f9fa;
  cursor: pointer;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.token-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.token-symbol {
  font-weight: 600;
}

.token-name {
  color: #666;
  font-size: 12px;
}

.token-price {
  font-weight: 500;
}

.price-change.positive {
  color: #4CAF50;
}

.price-change.negative {
  color: #f44336;
}

.chain-badge {
  padding: 2px 8px;
  background: #e3f2fd;
  border-radius: 4px;
  font-size: 11px;
  color: #1976d2;
}

.actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  padding: 4px 8px;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.btn-icon:hover {
  background: #f0f0f0;
}

.loading, .error, .empty {
  padding: 40px;
  text-align: center;
  color: #666;
}

.error {
  color: #f44336;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  font-size: 12px;
  color: #666;
}

.detail-item .value {
  font-size: 16px;
  font-weight: 500;
}

.detail-item .value.positive {
  color: #4CAF50;
}

.detail-item .value.negative {
  color: #f44336;
}

.sparkline-container {
  margin-top: 20px;
}

.sparkline-container h4 {
  margin: 0 0 10px 0;
}

.sparkline-chart {
  height: 60px;
}

.sparkline {
  width: 100%;
  height: 100%;
}
</style>
