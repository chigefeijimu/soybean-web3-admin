<template>
  <div class="nft-floor-price-oracle">
    <div class="header">
      <h1>🖼️ NFT Floor Price Oracle</h1>
      <p>Real-time floor price feeds for NFT collections across multiple marketplaces</p>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-box">
        <input 
          v-model="searchCollection" 
          placeholder="Enter collection address (0x...)" 
          @keyup.enter="searchCollectionData"
        />
        <select v-model="selectedChain">
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="base">Base</option>
          <option value="avalanche">Avalanche</option>
          <option value="solana">Solana</option>
        </select>
        <button @click="searchCollectionData" :disabled="loading">
          {{ loading ? 'Loading...' : 'Get Floor Price' }}
        </button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid" v-if="trendingCollections.length">
      <div class="stat-card">
        <div class="stat-value">{{ trendingCollections.length }}</div>
        <div class="stat-label">Trending Collections</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ supportedChains.length }}</div>
        <div class="stat-label">Supported Chains</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ supportedMarketplaces.length }}</div>
        <div class="stat-label">Marketplaces</div>
      </div>
    </div>

    <!-- Trending Collections -->
    <div class="trending-section" v-if="trendingCollections.length && !floorPriceData">
      <h2>🔥 Trending Collections</h2>
      <div class="trending-grid">
        <div 
          v-for="collection in trendingCollections" 
          :key="collection.address"
          class="trending-card"
          @click="selectCollection(collection)"
        >
          <div class="collection-name">{{ collection.name }}</div>
          <div class="collection-symbol">{{ collection.symbol }}</div>
          <div class="collection-floor">
            <span class="label">Floor:</span>
            <span class="value">Ξ {{ collection.floorPrice.toFixed(2) }}</span>
          </div>
          <div class="collection-change" :class="collection.priceChange24h >= 0 ? 'positive' : 'negative'">
            {{ collection.priceChange24h >= 0 ? '+' : '' }}{{ collection.priceChange24h.toFixed(1) }}%
          </div>
          <div class="collection-volume">
            Volume: ${{ (collection.volume24h * 3200).toFixed(0) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Floor Price Result -->
    <div v-if="floorPriceData" class="result-section">
      <!-- Main Price Card -->
      <div class="price-card">
        <div class="price-header">
          <h3>Floor Price</h3>
          <span class="chain-badge">{{ floorPriceData.chain.toUpperCase() }}</span>
        </div>
        <div class="price-value">
          <span class="eth-price">Ξ {{ floorPriceData.floorPrice.toFixed(3) }}</span>
          <span class="usd-price">${{ floorPriceData.floorPriceUSD.toFixed(2) }}</span>
        </div>
        <div class="price-change" :class="floorPriceData.priceChange24h >= 0 ? 'positive' : 'negative'">
          {{ floorPriceData.priceChange24h >= 0 ? '↑' : '↓' }} 
          {{ Math.abs(floorPriceData.priceChange24h).toFixed(1) }}% (24h)
        </div>
        <div class="marketplace-info">
          <span class="marketplace-badge">{{ floorPriceData.marketplace }}</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-detail-grid">
        <div class="stat-detail-card">
          <div class="stat-label">24h Volume</div>
          <div class="stat-value">${{ (floorPriceData.volume24h * 3200).toFixed(0) }}</div>
        </div>
        <div class="stat-detail-card">
          <div class="stat-label">24h Sales</div>
          <div class="stat-value">{{ floorPriceData.sales24h }}</div>
        </div>
        <div class="stat-detail-card">
          <div class="stat-label">Listings</div>
          <div class="stat-value">{{ floorPriceData.listings }}</div>
        </div>
        <div class="stat-detail-card">
          <div class="stat-label">Avg Price (24h)</div>
          <div class="stat-value">Ξ {{ floorPriceData.avgPrice24h.toFixed(3) }}</div>
        </div>
        <div class="stat-detail-card">
          <div class="stat-label">Holders</div>
          <div class="stat-value">{{ floorPriceData.holders.toLocaleString() }}</div>
        </div>
        <div class="stat-detail-card">
          <div class="stat-label">Total Supply</div>
          <div class="stat-value">{{ floorPriceData.totalSupply.toLocaleString() }}</div>
        </div>
      </div>

      <!-- Marketplace Comparison -->
      <div class="comparison-section" v-if="marketplaceComparison">
        <h3>📊 Marketplace Comparison</h3>
        <div class="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Marketplace</th>
                <th>Floor Price</th>
                <th>Listings</th>
                <th>24h Volume</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mp in marketplaceComparison.marketplaces" :key="mp.name">
                <td>{{ mp.name }}</td>
                <td :class="mp.name === marketplaceComparison.bestMarketplace ? 'best-price' : ''">
                  Ξ {{ mp.floorPrice.toFixed(3) }}
                  <span v-if="mp.name === marketplaceComparison.bestMarketplace" class="best-badge">Best</span>
                </td>
                <td>{{ mp.listings }}</td>
                <td>${{ (mp.volume24h * 3200).toFixed(0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="savings-info" v-if="marketplaceComparison.potentialSavings > 0">
          Potential savings: Ξ {{ marketplaceComparison.potentialSavings.toFixed(3) }} by using {{ marketplaceComparison.bestMarketplace }}
        </div>
      </div>

      <!-- Historical Chart -->
      <div class="chart-section">
        <h3>📈 Floor Price History</h3>
        <div class="time-range-selector">
          <button 
            v-for="range in timeRanges" 
            :key="range.value"
            :class="{ active: selectedTimeRange === range.value }"
            @click="changeTimeRange(range.value)"
          >
            {{ range.label }}
          </button>
        </div>
        <div class="chart-container" v-if="historicalData.length">
          <div class="chart-bars">
            <div 
              v-for="(point, index) in historicalData" 
              :key="index"
              class="chart-bar"
              :style="{ height: `${getBarHeight(point.floorPrice)}%` }"
              :title="`${formatDate(point.timestamp)}: Ξ${point.floorPrice.toFixed(2)}`"
            >
              <span class="bar-tooltip">{{ formatDate(point.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="action-section">
        <button class="back-btn" @click="clearResults">← Back to Search</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading floor price data...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const searchCollection = ref('')
const selectedChain = ref('ethereum')
const loading = ref(false)
const floorPriceData = ref<any>(null)
const collectionStats = ref<any>(null)
const marketplaceComparison = ref<any>(null)
const historicalData = ref<any[]>([])
const trendingCollections = ref<any[]>([])
const supportedChains = ref<string[]>([])
const supportedMarketplaces = ref<string[]>([])
const selectedTimeRange = ref(7)
const timeRanges = [
  { label: '7D', value: 7 },
  { label: '14D', value: 14 },
  { label: '30D', value: 30 },
]

const API_BASE = '/api/web3/nft-floor-price-oracle'

onMounted(async () => {
  await loadSupportedData()
  await loadTrending()
})

async function loadSupportedData() {
  try {
    const [chainsRes, marketplacesRes] = await Promise.all([
      fetch(`${API_BASE}/supported-chains`),
      fetch(`${API_BASE}/supported-marketplaces`),
    ])
    supportedChains.value = await chainsRes.json()
    supportedMarketplaces.value = await marketplacesRes.json()
  } catch (error) {
    console.error('Failed to load supported data:', error)
  }
}

async function loadTrending() {
  try {
    trendingCollections.value = await fetch(
      `${API_BASE}/trending-collections?chain=ethereum&limit=8`
    ).then(res => res.json())
  } catch (error) {
    console.error('Failed to load trending:', error)
  }
}

async function searchCollectionData() {
  if (!searchCollection.value) return
  
  loading.value = true
  try {
    const [floorRes, statsRes, comparisonRes, historyRes] = await Promise.all([
      fetch(`${API_BASE}/floor-price?collection=${searchCollection.value}&chain=${selectedChain.value}`),
      fetch(`${API_BASE}/collection-stats?collection=${searchCollection.value}&chain=${selectedChain.value}`),
      fetch(`${API_BASE}/marketplace-comparison?collection=${searchCollection.value}&chain=${selectedChain.value}`),
      fetch(`${API_BASE}/historical-floor-price?collection=${searchCollection.value}&chain=${selectedChain.value}&days=${selectedTimeRange.value}`),
    ])
    
    floorPriceData.value = await floorRes.json()
    collectionStats.value = await statsRes.json()
    marketplaceComparison.value = await comparisonRes.json()
    historicalData.value = await historyRes.json()
  } catch (error) {
    console.error('Failed to fetch data:', error)
  } finally {
    loading.value = false
  }
}

function selectCollection(collection: any) {
  searchCollection.value = collection.address
  selectedChain.value = 'ethereum'
  searchCollectionData()
}

async function changeTimeRange(days: number) {
  selectedTimeRange.value = days
  if (searchCollection.value) {
    try {
      const res = await fetch(
        `${API_BASE}/historical-floor-price?collection=${searchCollection.value}&chain=${selectedChain.value}&days=${days}`
      )
      historicalData.value = await res.json()
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }
}

function clearResults() {
  floorPriceData.value = null
  collectionStats.value = null
  marketplaceComparison.value = null
  historicalData.value = []
  searchCollection.value = ''
}

function getBarHeight(price: number): number {
  if (!historicalData.value.length) return 0
  const prices = historicalData.value.map((p: any) => p.floorPrice)
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  const range = maxPrice - minPrice || 1
  return ((price - minPrice) / range) * 80 + 10
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function shortenAddress(addr: string): string {
  if (!addr) return ''
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}
</script>

<style scoped>
.nft-floor-price-oracle {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.search-section {
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.search-box input {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  width: 400px;
  max-width: 100%;
}

.search-box select {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.search-box button {
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.search-box button:hover:not(:disabled) {
  background: #4338ca;
}

.search-box button:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-card .stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #4f46e5;
}

.stat-card .stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-top: 4px;
}

.trending-section {
  margin-bottom: 24px;
}

.trending-section h2 {
  margin-bottom: 16px;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.trending-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.trending-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.collection-name {
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 4px;
}

.collection-symbol {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.collection-floor .label {
  color: #666;
  font-size: 0.85rem;
}

.collection-floor .value {
  font-weight: bold;
  color: #4f46e5;
}

.collection-change {
  font-size: 0.9rem;
  margin-top: 8px;
}

.collection-change.positive {
  color: #22c55e;
}

.collection-change.negative {
  color: #ef4444;
}

.collection-volume {
  font-size: 0.85rem;
  color: #666;
  margin-top: 4px;
}

.result-section {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.price-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  margin-bottom: 24px;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.price-header h3 {
  margin: 0;
}

.chain-badge {
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.price-value {
  margin-bottom: 12px;
}

.eth-price {
  font-size: 2.5rem;
  font-weight: bold;
}

.usd-price {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-left: 12px;
}

.price-change {
  font-size: 1.1rem;
  margin-bottom: 12px;
}

.price-change.positive {
  color: #86efac;
}

.price-change.negative {
  color: #fca5a5;
}

.marketplace-info {
  margin-top: 8px;
}

.marketplace-badge {
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.stats-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-detail-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-detail-card .stat-label {
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 4px;
}

.stat-detail-card .stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.comparison-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.comparison-section h3 {
  margin-bottom: 16px;
}

.comparison-table {
  overflow-x: auto;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.comparison-table th {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.comparison-table td.best-price {
  color: #22c55e;
  font-weight: bold;
}

.best-badge {
  background: #22c55e;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-left: 8px;
}

.savings-info {
  margin-top: 16px;
  padding: 12px;
  background: #f0fdf4;
  border-radius: 8px;
  color: #166534;
  text-align: center;
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.chart-section h3 {
  margin-bottom: 16px;
}

.time-range-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.time-range-selector button {
  padding: 6px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.time-range-selector button.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.chart-container {
  height: 200px;
  display: flex;
  align-items: flex-end;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  width: 100%;
  height: 100%;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
  transition: opacity 0.2s;
}

.chart-bar:hover {
  opacity: 0.8;
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.chart-bar:hover .bar-tooltip {
  opacity: 1;
}

.action-section {
  text-align: center;
}

.back-btn {
  padding: 12px 24px;
  background: #f3f4f6;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #e5e7eb;
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
