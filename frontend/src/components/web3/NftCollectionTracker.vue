<template>
  <div class="nft-collection-tracker">
    <!-- Header -->
    <div class="header-section">
      <div class="title-row">
        <h2>🎨 NFT Collection Tracker</h2>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="Search collections..."
            prefix-icon="Search"
            clearable
            class="search-input"
            @input="handleSearch"
          />
          <el-select v-model="selectedChain" placeholder="All Chains" clearable class="chain-select">
            <el-option label="All Chains" value="" />
            <el-option label="Ethereum" value="ethereum" />
            <el-option label="Solana" value="solana" />
            <el-option label="Polygon" value="polygon" />
            <el-option label="Arbitrum" value="arbitrum" />
          </el-select>
          <el-select v-model="sortBy" placeholder="Sort By" class="sort-select">
            <el-option label="Total Volume" value="volume" />
            <el-option label="Floor Price" value="floorPrice" />
            <el-option label="24h Volume" value="volume24h" />
            <el-option label="24h Sales" value="sales24h" />
            <el-option label="Holders" value="holders" />
            <el-option label="24h Change" value="change24h" />
          </el-select>
        </div>
      </div>
      <div class="tabs">
        <el-radio-group v-model="activeTab" @change="handleTabChange">
          <el-radio-button label="collections">Collections</el-radio-button>
          <el-radio-button label="trending">🔥 Trending</el-radio-button>
          <el-radio-button label="details" :disabled="!selectedCollection">Details</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- Collections Grid -->
    <div v-if="activeTab === 'collections'" class="collections-grid">
      <el-row :gutter="16">
        <el-col
          v-for="collection in displayedCollections"
          :key="collection.contractAddress"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card
            class="collection-card"
            :class="{ selected: selectedCollection?.contractAddress === collection.contractAddress }"
            @click="selectCollection(collection)"
          >
            <div class="card-header">
              <img :src="collection.imageUrl" :alt="collection.name" class="collection-image" />
              <div class="chain-badge" :class="collection.chain">{{ collection.chain }}</div>
            </div>
            <div class="card-body">
              <h3 class="collection-name">{{ collection.name }}</h3>
              <p class="collection-symbol">{{ collection.symbol }}</p>
              <div class="stats-grid">
                <div class="stat">
                  <span class="label">Floor</span>
                  <span class="value">Ξ {{ collection.floorPrice.toFixed(2) }}</span>
                </div>
                <div class="stat">
                  <span class="label">24h</span>
                  <span class="value" :class="collection.floorPriceChange24h >= 0 ? 'positive' : 'negative'">
                    {{ collection.floorPriceChange24h >= 0 ? '+' : '' }}{{ collection.floorPriceChange24h.toFixed(1) }}%
                  </span>
                </div>
                <div class="stat">
                  <span class="label">Volume</span>
                  <span class="value">${{ formatNumber(collection.totalVolume) }}</span>
                </div>
                <div class="stat">
                  <span class="label">Holders</span>
                  <span class="value">{{ formatNumber(collection.holders) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Trending Tab -->
    <div v-else-if="activeTab === 'trending'" class="trending-section">
      <el-alert
        title="🔥 Trending collections with highest price volatility"
        type="info"
        :closable="false"
        show-icon
        class="trend-alert"
      />
      <el-row :gutter="16">
        <el-col
          v-for="collection in trendingCollections"
          :key="collection.contractAddress"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card class="collection-card" @click="selectCollection(collection)">
            <div class="card-header">
              <img :src="collection.imageUrl" :alt="collection.name" class="collection-image" />
              <div class="trend-badge">🔥 #{{ trendingCollections.indexOf(collection) + 1 }}</div>
            </div>
            <div class="card-body">
              <h3 class="collection-name">{{ collection.name }}</h3>
              <div class="stats-grid">
                <div class="stat">
                  <span class="label">Floor</span>
                  <span class="value">Ξ {{ collection.floorPrice.toFixed(2) }}</span>
                </div>
                <div class="stat">
                  <span class="label">24h Change</span>
                  <span class="value" :class="collection.floorPriceChange24h >= 0 ? 'positive' : 'negative'">
                    {{ collection.floorPriceChange24h >= 0 ? '+' : '' }}{{ collection.floorPriceChange24h.toFixed(1) }}%
                  </span>
                </div>
                <div class="stat">
                  <span class="label">24h Sales</span>
                  <span class="value">{{ collection.sales24h }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Details Tab -->
    <div v-else-if="activeTab === 'details' && selectedCollection" class="details-section">
      <el-button @click="activeTab = 'collections'" class="back-btn">
        ← Back to Collections
      </el-button>

      <div class="details-header">
        <img :src="selectedCollection.imageUrl" :alt="selectedCollection.name" class="detail-image" />
        <div class="detail-info">
          <h2>{{ selectedCollection.name }}</h2>
          <p class="symbol">{{ selectedCollection.symbol }}</p>
          <div class="detail-stats">
            <el-tag :type="selectedCollection.chain === 'ethereum' ? 'primary' : 'success'">
              {{ selectedCollection.chain }}
            </el-tag>
            <el-tag>Supply: {{ formatNumber(selectedCollection.totalSupply) }}</el-tag>
            <el-tag>Holders: {{ formatNumber(selectedCollection.holders) }}</el-tag>
          </div>
        </div>
      </div>

      <el-tabs v-model="detailsTab">
        <!-- Overview -->
        <el-tab-pane label="📊 Overview" name="overview">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="stat-card">
                <div class="stat-value">Ξ {{ selectedCollection.floorPrice.toFixed(2) }}</div>
                <div class="stat-label">Floor Price</div>
                <div class="stat-change" :class="selectedCollection.floorPriceChange24h >= 0 ? 'positive' : 'negative'">
                  {{ selectedCollection.floorPriceChange24h >= 0 ? '↑' : '↓' }}
                  {{ Math.abs(selectedCollection.floorPriceChange24h).toFixed(1) }}% (24h)
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="stat-card">
                <div class="stat-value">${{ formatNumber(selectedCollection.marketCap) }}</div>
                <div class="stat-label">Market Cap</div>
                <div class="stat-change neutral">Ξ {{ selectedCollection.floorPrice.toFixed(2) }} × {{ formatNumber(selectedCollection.totalSupply) }}</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="stat-card small">
                <div class="stat-value">${{ formatNumber(selectedCollection.totalVolume) }}</div>
                <div class="stat-label">Total Volume</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="stat-card small">
                <div class="stat-value">${{ formatNumber(selectedCollection.volume24h) }}</div>
                <div class="stat-label">24h Volume</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card class="stat-card small">
                <div class="stat-value">{{ selectedCollection.sales24h }}</div>
                <div class="stat-label">24h Sales</div>
              </el-card>
            </el-col>
          </el-row>

          <!-- Price Chart -->
          <el-card class="chart-card">
            <template #header>
              <span>📈 Price History (30 Days)</span>
            </template>
            <div class="chart-container">
              <div class="simple-chart">
                <div
                  v-for="(point, index) in priceHistory"
                  :key="index"
                  class="chart-bar"
                  :style="{ height: `${(point.price / maxPrice) * 100}%` }"
                  :title="`${formatDate(point.timestamp)}: Ξ ${point.price.toFixed(2)}`"
                />
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- Listings -->
        <el-tab-pane label="📋 Listings" name="listings">
          <el-table :data="listings" style="width: 100%" max-height="400">
            <el-table-column prop="tokenId" label="Token ID" width="120" />
            <el-table-column prop="price" label="Price (ETH)" width="150">
              <template #default="{ row }">
                Ξ {{ row.price.toFixed(3) }}
              </template>
            </el-table-column>
            <el-table-column prop="seller" label="Seller" width="180" />
            <el-table-column prop="expiresAt" label="Expires" width="180">
              <template #default="{ row }">
                {{ formatDate(row.expiresAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Sales -->
        <el-tab-pane label="💰 Recent Sales" name="sales">
          <el-table :data="sales" style="width: 100%" max-height="400">
            <el-table-column prop="tokenId" label="Token ID" width="100" />
            <el-table-column prop="price" label="Price (ETH)" width="120">
              <template #default="{ row }">
                Ξ {{ row.price.toFixed(3) }}
              </template>
            </el-table-column>
            <el-table-column prop="buyer" label="Buyer" width="160" />
            <el-table-column prop="seller" label="Seller" width="160" />
            <el-table-column prop="timestamp" label="Time" width="180">
              <template #default="{ row }">
                {{ formatDate(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="txHash" label="Tx Hash">
              <template #default="{ row }">
                <el-link type="primary" :href="`https://etherscan.io/tx/${row.txHash}`" target="_blank">
                  {{ row.txHash.slice(0, 10) }}...
                </el-link>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Holders -->
        <el-tab-pane label="👥 Top Holders" name="holders">
          <el-alert
            :title="`Total Holders: ${formatNumber(totalHolders)}`"
            type="info"
            :closable="false"
            show-icon
            class="holders-alert"
          />
          <el-table :data="holders" style="width: 100%" max-height="400">
            <el-table-column prop="rank" label="#" width="60" />
            <el-table-column prop="address" label="Address" width="200" />
            <el-table-column prop="tokens" label="Tokens" width="120" />
            <el-table-column prop="percentage" label="%" width="100">
              <template #default="{ row }">
                {{ row.percentage }}%
              </template>
            </el-table-column>
            <el-table-column prop="lastActivity" label="Last Activity" width="180">
              <template #default="{ row }">
                {{ formatDate(row.lastActivity) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- Whales -->
        <el-tab-pane label="🐋 Whale Activity" name="whales">
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in whaleActivities"
              :key="index"
              :type="activity.type === 'buy' ? 'success' : activity.type === 'sell' ? 'danger' : 'info'"
              :timestamp="activity.time"
              placement="top"
            >
              <el-card class="whale-card">
                <div class="whale-header">
                  <el-tag :type="activity.type === 'buy' ? 'success' : activity.type === 'sell' ? 'danger' : 'info'">
                    {{ activity.type.toUpperCase() }}
                  </el-tag>
                  <span class="whale-address">{{ activity.address }}</span>
                </div>
                <div class="whale-details">
                  <span>{{ activity.tokens }} tokens</span>
                  <span class="whale-value">${{ formatNumber(activity.totalValue) }}</span>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Loading -->
    <el-loading v-if="loading" fullscreen />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchNftCollections,
  fetchNftCollectionDetails,
  fetchNftListings,
  fetchNftSales,
  fetchNftHolders,
  fetchNftWhales,
  fetchTrendingCollections,
  searchNftCollections,
  type NftCollection,
  type NftCollectionDetails,
  type NftListing,
  type NftSale,
  type NftHolder,
  type WhaleActivity
} from '@/service/api/web3'

const loading = ref(false)
const collections = ref<NftCollection[]>([])
const trendingCollections = ref<NftCollection[]>([])
const selectedCollection = ref<NftCollection | null>(null)
const collectionDetails = ref<NftCollectionDetails | null>(null)
const listings = ref<NftListing[]>([])
const sales = ref<NftSale[]>([])
const holders = ref<NftHolder[]>([])
const whaleActivities = ref<WhaleActivity[]>([])
const totalHolders = ref(0)
const priceHistory = ref<{ timestamp: number; price: number }[]>([])

const searchQuery = ref('')
const selectedChain = ref('')
const sortBy = ref<string>('volume')
const activeTab = ref('collections')
const detailsTab = ref('overview')

const maxPrice = computed(() => {
  if (!priceHistory.value.length) return 1
  return Math.max(...priceHistory.value.map(p => p.price))
})

const displayedCollections = computed(() => {
  let result = collections.value
  if (selectedChain.value) {
    result = result.filter(c => c.chain === selectedChain.value)
  }
  return result
})

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toString()
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const loadCollections = async () => {
  loading.value = true
  try {
    const res = await fetchNftCollections({
      chain: selectedChain.value || undefined,
      sortBy: sortBy.value as any,
      limit: 50
    })
    if (res.data?.success) {
      collections.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to load collections:', error)
    ElMessage.error('Failed to load collections')
  } finally {
    loading.value = false
  }
}

const loadTrending = async () => {
  try {
    const res = await fetchTrendingCollections()
    if (res.data?.success) {
      trendingCollections.value = res.data.data
    }
  } catch (error) {
    console.error('Failed to load trending:', error)
  }
}

const handleSearch = async () => {
  if (searchQuery.value.length < 2) {
    loadCollections()
    return
  }
  try {
    const res = await searchNftCollections(searchQuery.value)
    if (res.data?.success) {
      collections.value = res.data.data
    }
  } catch (error) {
    console.error('Search failed:', error)
  }
}

const selectCollection = async (collection: NftCollection) => {
  selectedCollection.value = collection
  activeTab.value = 'details'
  detailsTab.value = 'overview'
  
  loading.value = true
  try {
    const [detailsRes, listingsRes, salesRes, holdersRes, whalesRes] = await Promise.all([
      fetchNftCollectionDetails(collection.contractAddress),
      fetchNftListings(collection.contractAddress, 20),
      fetchNftSales(collection.contractAddress, 20),
      fetchNftHolders(collection.contractAddress, 50),
      fetchNftWhales(collection.contractAddress)
    ])

    if (detailsRes.data?.success) {
      collectionDetails.value = detailsRes.data.data
      priceHistory.value = detailsRes.data.data.priceHistory || []
    }
    if (listingsRes.data?.success) {
      listings.value = listingsRes.data.data
    }
    if (salesRes.data?.success) {
      sales.value = salesRes.data.data
    }
    if (holdersRes.data?.success) {
      holders.value = holdersRes.data.data
      totalHolders.value = holdersRes.data.totalHolders
    }
    if (whalesRes.data?.success) {
      whaleActivities.value = whalesRes.data.data
    }
  } catch (error) {
    console.error('Failed to load collection details:', error)
    ElMessage.error('Failed to load collection details')
  } finally {
    loading.value = false
  }
}

const handleTabChange = () => {
  if (activeTab.value === 'trending') {
    loadTrending()
  }
}

onMounted(() => {
  loadCollections()
})
</script>

<style scoped>
.nft-collection-tracker {
  padding: 20px;
}

.header-section {
  margin-bottom: 20px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title-row h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 250px;
}

.chain-select,
.sort-select {
  width: 150px;
}

.tabs {
  margin-bottom: 20px;
}

.collections-grid,
.trending-section {
  margin-top: 20px;
}

.collection-card {
  cursor: pointer;
  margin-bottom: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.collection-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.collection-card.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.card-header {
  position: relative;
  height: 150px;
  overflow: hidden;
  border-radius: 8px;
}

.collection-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chain-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.chain-badge.ethereum {
  background: #627eea;
  color: white;
}

.chain-badge.solana {
  background: linear-gradient(135deg, #9945ff, #14f195);
  color: white;
}

.chain-badge.polygon {
  background: #8247e5;
  color: white;
}

.chain-badge.arbitrum {
  background: #28a0f0;
  color: white;
}

.trend-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  background: rgba(255, 59, 48, 0.9);
  color: white;
  border-radius: 4px;
  font-weight: bold;
}

.card-body {
  padding: 12px 0;
}

.collection-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-symbol {
  margin: 0 0 12px 0;
  color: #909399;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat .label {
  font-size: 12px;
  color: #909399;
}

.stat .value {
  font-size: 14px;
  font-weight: 600;
}

.stat .value.positive {
  color: #67c23a;
}

.stat .value.negative {
  color: #f56c6c;
}

.trend-alert {
  margin-bottom: 16px;
}

.details-section {
  margin-top: 20px;
}

.back-btn {
  margin-bottom: 16px;
}

.details-header {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.detail-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
}

.detail-info h2 {
  margin: 0 0 8px 0;
}

.detail-info .symbol {
  margin: 0 0 12px 0;
  color: #909399;
}

.detail-stats {
  display: flex;
  gap: 8px;
}

.stat-card {
  text-align: center;
  margin-bottom: 16px;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-card .stat-change {
  font-size: 14px;
  margin-top: 8px;
}

.stat-card .stat-change.positive {
  color: #67c23a;
}

.stat-card .stat-change.negative {
  color: #f56c6c;
}

.stat-card .stat-change.neutral {
  color: #909399;
}

.stat-card.small .stat-value {
  font-size: 20px;
}

.chart-card {
  margin-top: 16px;
}

.chart-container {
  height: 200px;
  padding: 20px;
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  height: 100%;
  gap: 2px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #409eff, #66b1ff);
  min-height: 4px;
  border-radius: 2px 2px 0 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.chart-bar:hover {
  opacity: 0.7;
}

.holders-alert {
  margin-bottom: 16px;
}

.whale-card {
  padding: 12px;
}

.whale-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.whale-address {
  font-family: monospace;
  color: #606266;
}

.whale-details {
  display: flex;
  justify-content: space-between;
  color: #909399;
}

.whale-value {
  font-weight: 600;
  color: #303133;
}
</style>
