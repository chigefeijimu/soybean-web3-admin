<template>
  <div class="nft-royalty-tracker">
    <div class="header">
      <h1>🖼️ NFT版税追踪器</h1>
      <p class="subtitle">追踪NFT系列版税收入，支持多链版税分析</p>
    </div>

    <!-- Dashboard Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalCollections }}</div>
          <div class="stat-label">追踪系列</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalRoyalty }} ETH</div>
          <div class="stat-label">总版税收入</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalVolume }} ETH</div>
          <div class="stat-label">总交易量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏷️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.averageRoyaltyFee }}%</div>
          <div class="stat-label">平均版税费率</div>
        </div>
      </div>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <label>Collection Address</label>
          <input 
            v-model="collectionAddress" 
            placeholder="0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"
            class="address-input"
          />
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="selectedChain" class="chain-select">
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="base">Base</option>
          </select>
        </div>
        <button @click="searchCollection" :disabled="loading" class="search-btn">
          {{ loading ? '查询中...' : '查询版税' }}
        </button>
      </div>

      <!-- Quick Links -->
      <div class="quick-links">
        <span class="quick-label">热门系列:</span>
        <button 
          v-for="collection in popularCollections" 
          :key="collection.address"
          @click="loadCollection(collection)"
          class="quick-btn"
        >
          {{ collection.name }}
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="result" class="results-section">
      <!-- Collection Info Card -->
      <div class="collection-card">
        <div class="collection-header">
          <div class="collection-name">{{ result.name }}</div>
          <div class="collection-address">{{ result.collectionAddress }}</div>
        </div>
        
        <div class="collection-stats">
          <div class="col-stat">
            <span class="col-stat-label">版税费率</span>
            <span class="col-stat-value highlight">{{ result.royaltyPercentage }}%</span>
          </div>
          <div class="col-stat">
            <span class="col-stat-label">累计版税</span>
            <span class="col-stat-value">{{ result.royaltyEarned.toFixed(4) }} ETH</span>
          </div>
          <div class="col-stat">
            <span class="col-stat-label">总交易量</span>
            <span class="col-stat-value">{{ result.totalVolume.toFixed(2) }} ETH</span>
          </div>
          <div class="col-stat">
            <span class="col-stat-label">销售次数</span>
            <span class="col-stat-value">{{ result.salesCount.toLocaleString() }}</span>
          </div>
        </div>

        <div class="collection-address-info">
          <span class="label">版税接收地址:</span>
          <span class="address">{{ result.creatorAddress }}</span>
        </div>
      </div>

      <!-- Royalty History Chart -->
      <div class="history-section">
        <h3>📊 版税历史</h3>
        <div class="chart-placeholder">
          <div class="bar-chart">
            <div 
              v-for="(item, index) in royaltyHistory" 
              :key="index"
              class="bar"
              :style="{ height: (item.royalties / maxRoyalty * 100) + '%' }"
            >
              <span class="bar-tooltip">{{ item.date }}: {{ item.royalties.toFixed(2) }} ETH</span>
            </div>
          </div>
          <div class="chart-labels">
            <span v-for="(item, index) in royaltyHistory" :key="index">{{ item.date }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Collections Table -->
    <div class="top-collections">
      <h3>🏆 热门系列版税排行</h3>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Collection</th>
              <th>Chain</th>
              <th>Volume</th>
              <th>Sales</th>
              <th>Royalty %</th>
              <th>Total Royalty</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(collection, index) in topCollections" 
              :key="collection.address"
              @click="loadCollectionByAddress(collection.address, collection.chain)"
            >
              <td>{{ index + 1 }}</td>
              <td class="collection-cell">
                <span class="collection-name">{{ collection.name }}</span>
              </td>
              <td>
                <span class="chain-badge">{{ collection.chain }}</span>
              </td>
              <td>{{ collection.totalVolume.toFixed(2) }} ETH</td>
              <td>{{ collection.salesCount.toLocaleString() }}</td>
              <td>
                <span class="royalty-badge">{{ collection.royaltyPercentage }}%</span>
              </td>
              <td class="highlight">{{ collection.royaltyEarned.toFixed(4) }} ETH</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Marketplace Info -->
    <div class="marketplace-info">
      <h3>🏪 市场平台版税设置</h3>
      <div class="marketplace-grid">
        <div 
          v-for="market in marketplaces" 
          :key="market.name"
          class="market-card"
        >
          <div class="market-name">{{ market.name }}</div>
          <div class="market-details">
            <div class="detail">
              <span>默认版税:</span>
              <span>{{ market.defaultRoyalty }}%</span>
            </div>
            <div class="detail">
              <span>最高版税:</span>
              <span>{{ market.maxRoyalty }}%</span>
            </div>
            <div class="detail">
              <span>支持链:</span>
              <span>{{ market.chains.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { request } from '@/service/request';

interface CollectionData {
  collectionAddress: string;
  chain: string;
  name: string;
  totalVolume: number;
  totalRoyalties: number;
  royaltyPercentage: number;
  royaltyEarned: number;
  lastSaleVolume: number;
  lastSaleRoyalties: number;
  salesCount: number;
  lastUpdated: number;
  creatorAddress?: string;
}

interface RoyaltyHistoryItem {
  date: string;
  volume: number;
  royalties: number;
  salesCount: number;
}

interface Marketplace {
  name: string;
  defaultRoyalty: number;
  maxRoyalty: number;
  chains: string[];
}

const loading = ref(false);
const collectionAddress = ref('');
const selectedChain = ref('ethereum');
const result = ref<CollectionData | null>(null);
const royaltyHistory = ref<RoyaltyHistoryItem[]>([]);
const topCollections = ref<CollectionData[]>([]);
const marketplaces = ref<Marketplace[]>([]);

const stats = ref({
  totalCollections: 0,
  totalRoyalty: '0',
  totalVolume: '0',
  averageRoyaltyFee: '3.75'
});

const popularCollections = [
  { name: 'BAYC', address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d' },
  { name: 'Azuki', address: '0x23581767a106ae21c074b2276d25e5cc3a6ae32' },
  { name: 'Clone X', address: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b' },
  { name: 'Doodle', address: '0x8a90cab2b38dba80c64b7734e58e1cdb38b8992e' }
];

const maxRoyalty = computed(() => {
  if (!royaltyHistory.value.length) return 1;
  return Math.max(...royaltyHistory.value.map(h => h.royalties));
});

async function loadStats() {
  try {
    const data = await request({
      url: '/api/web3/nft-royalty/stats',
      method: 'get'
    });
    if (data) {
      stats.value = {
        totalCollections: data.totalCollections || 0,
        totalRoyalty: data.totalRoyalty || '0',
        totalVolume: data.totalVolume || '0',
        averageRoyaltyFee: data.averageRoyaltyFee || '3.75'
      };
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

async function loadTopCollections() {
  try {
    const data = await request({
      url: '/api/web3/nft-royalty/top',
      method: 'get',
      params: { limit: 10 }
    });
    if (data) {
      topCollections.value = data;
    }
  } catch (e) {
    console.error('Failed to load top collections:', e);
  }
}

async function loadMarketplaces() {
  try {
    const data = await request({
      url: '/api/web3/nft-royalty/marketplaces',
      method: 'get'
    });
    if (data) {
      marketplaces.value = data;
    }
  } catch (e) {
    // Use default data
    marketplaces.value = [
      { name: 'OpenSea', defaultRoyalty: 2.5, maxRoyalty: 10, chains: ['ethereum', 'polygon'] },
      { name: 'Blur', defaultRoyalty: 0, maxRoyalty: 2.5, chains: ['ethereum'] },
      { name: 'LooksRare', defaultRoyalty: 2, maxRoyalty: 10, chains: ['ethereum'] },
      { name: 'Foundation', defaultRoyalty: 10, maxRoyalty: 10, chains: ['ethereum'] },
      { name: 'Zora', defaultRoyalty: 5, maxRoyalty: 10, chains: ['ethereum', 'base'] }
    ];
  }
}

async function searchCollection() {
  if (!collectionAddress.value) return;
  
  loading.value = true;
  try {
    const data = await request({
      url: `/api/web3/nft-royalty/collection/${collectionAddress.value}`,
      method: 'get',
      params: { chain: selectedChain.value }
    });
    
    if (data) {
      result.value = data;
      
      // Load history
      const historyData = await request({
        url: `/api/web3/nft-royalty/history/${collectionAddress.value}`,
        method: 'get',
        params: { chain: selectedChain.value, limit: 10 }
      });
      
      if (historyData) {
        royaltyHistory.value = historyData;
      }
    }
  } catch (e) {
    console.error('Failed to search collection:', e);
  } finally {
    loading.value = false;
  }
}

function loadCollection(collection: { name: string; address: string }) {
  collectionAddress.value = collection.address;
  selectedChain.value = 'ethereum';
  searchCollection();
}

function loadCollectionByAddress(address: string, chain: string) {
  collectionAddress.value = address;
  selectedChain.value = chain;
  searchCollection();
}

onMounted(() => {
  loadStats();
  loadTopCollections();
  loadMarketplaces();
});
</script>

<style scoped>
.nft-royalty-tracker {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.search-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-form {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 16px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.address-input,
.chain-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
}

.search-btn {
  padding: 10px 24px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.search-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.quick-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 12px;
  color: #666;
}

.quick-btn {
  padding: 4px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
}

.quick-btn:hover {
  background: #e5e7eb;
}

.results-section {
  display: grid;
  gap: 24px;
  margin-bottom: 24px;
}

.collection-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.collection-header {
  margin-bottom: 20px;
}

.collection-name {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.collection-address {
  font-size: 12px;
  color: #666;
  font-family: monospace;
}

.collection-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.col-stat {
  text-align: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.col-stat-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.col-stat-value {
  font-size: 18px;
  font-weight: 600;
}

.col-stat-value.highlight {
  color: #4f46e5;
}

.collection-address-info {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 13px;
}

.collection-address-info .label {
  color: #666;
  margin-right: 8px;
}

.collection-address-info .address {
  font-family: monospace;
  color: #4f46e5;
}

.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-section h3 {
  margin-bottom: 20px;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.bar-chart {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding-bottom: 8px;
}

.bar {
  flex: 1;
  background: linear-gradient(to top, #4f46e5, #818cf8);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  position: relative;
  cursor: pointer;
}

.bar:hover .bar-tooltip {
  display: block;
}

.bar-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 10;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #666;
}

.top-collections {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.top-collections h3 {
  margin-bottom: 20px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  background: #f9fafb;
}

.data-table tr:hover {
  background: #f9fafb;
  cursor: pointer;
}

.collection-cell {
  font-weight: 500;
}

.chain-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 11px;
}

.royalty-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.highlight {
  color: #4f46e5;
  font-weight: 500;
}

.marketplace-info {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.marketplace-info h3 {
  margin-bottom: 20px;
}

.marketplace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.market-card {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.market-name {
  font-weight: 600;
  margin-bottom: 12px;
}

.market-details .detail {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.market-details .detail span:first-child {
  color: #666;
}
</style>
