<template>
  <div class="nft-portfolio-tracker">
    <div class="header">
      <h2>🖼️ NFT Portfolio Tracker</h2>
      <div class="wallet-input">
        <input 
          v-model="walletAddress" 
          placeholder="Enter wallet address"
          @keyup.enter="loadPortfolio"
        />
        <button @click="loadPortfolio">Load</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="summary" class="portfolio-content">
      <!-- Portfolio Summary -->
      <div class="summary-cards">
        <div class="card total-value">
          <div class="label">Total Value</div>
          <div class="value">${{ formatNumber(summary.totalValue) }}</div>
          <div class="pnl" :class="{ positive: summary.totalPnl >= 0, negative: summary.totalPnl < 0 }">
            {{ summary.totalPnl >= 0 ? '+' : '' }}${{ formatNumber(summary.totalPnl) }}
            ({{ summary.totalPnlPercent.toFixed(2) }}%)
          </div>
        </div>
        <div class="card">
          <div class="label">Total NFTs</div>
          <div class="value">{{ summary.totalNfts }}</div>
        </div>
        <div class="card">
          <div class="label">Collections</div>
          <div class="value">{{ summary.totalCollections }}</div>
        </div>
        <div class="card">
          <div class="label">Total Cost</div>
          <div class="value">${{ formatNumber(summary.totalCost) }}</div>
        </div>
      </div>

      <!-- Value History Chart -->
      <div class="chart-section">
        <h3>Portfolio Value History</h3>
        <div class="chart-container">
          <svg viewBox="0 0 800 200" class="line-chart">
            <polyline
              fill="none"
              stroke="#6366f1"
              stroke-width="2"
              :points="chartPoints"
            />
          </svg>
        </div>
        <div class="time-range">
          <button 
            v-for="range in ['7d', '30d', '90d']" 
            :key="range"
            :class="{ active: selectedRange === range }"
            @click="selectedRange = range"
          >
            {{ range }}
          </button>
        </div>
      </div>

      <!-- Chain Distribution -->
      <div class="chain-distribution">
        <h3>Chain Distribution</h3>
        <div class="chains">
          <div 
            v-for="(data, chain) in summary.chainDistribution" 
            :key="chain"
            class="chain-item"
          >
            <span class="chain-name">{{ chain }}</span>
            <span class="chain-count">{{ data.count }} NFTs</span>
            <span class="chain-value">${{ formatNumber(data.value) }}</span>
            <div class="bar">
              <div 
                class="bar-fill" 
                :style="{ width: (data.value / summary.totalValue * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- NFT Holdings -->
      <div class="holdings-section">
        <h3>NFT Holdings</h3>
        <div class="holdings-grid">
          <div 
            v-for="holding in summary.topCollections" 
            :key="holding.tokenId"
            class="nft-card"
          >
            <div class="nft-image">
              <img :src="holding.imageUrl" :alt="holding.name" />
            </div>
            <div class="nft-info">
              <div class="nft-name">{{ holding.name }}</div>
              <div class="nft-collection">{{ holding.collectionName }}</div>
              <div class="nft-chain">{{ holding.chain }}</div>
              <div class="nft-value">${{ formatNumber(holding.currentValue) }}</div>
              <div 
                class="nft-pnl"
                :class="{ positive: holding.pnl >= 0, negative: holding.pnl < 0 }"
              >
                {{ holding.pnl >= 0 ? '+' : '' }}${{ formatNumber(holding.pnl) }}
                ({{ holding.pnlPercent.toFixed(2) }}%)
              </div>
              <div v-if="holding.rarity" class="nft-rarity">
                Rarity: #{{ holding.rarityRank }} ({{ holding.rarity }}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trending Collections -->
      <div class="trending-section">
        <h3>🔥 Trending Collections</h3>
        <div class="trending-list">
          <div 
            v-for="collection in trendingCollections" 
            :key="collection.collectionAddress"
            class="trending-item"
          >
            <img :src="collection.imageUrl" :alt="collection.name" class="collection-icon" />
            <div class="collection-info">
              <div class="collection-name">{{ collection.name }}</div>
              <div class="collection-chain">{{ collection.chain }}</div>
            </div>
            <div class="collection-stats">
              <div class="floor-price">Floor: ${{ collection.floorPrice }}</div>
              <div 
                class="price-change"
                :class="{ positive: collection.floorPriceChange24h >= 0, negative: collection.floorPriceChange24h < 0 }"
              >
                {{ collection.floorPriceChange24h >= 0 ? '+' : '' }}{{ collection.floorPriceChange24h.toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Enter a wallet address to view NFT portfolio</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const walletAddress = ref('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
const loading = ref(false);
const summary = ref<any>(null);
const trendingCollections = ref<any[]>([]);
const selectedRange = ref('30d');

const API_BASE = 'http://localhost:3000';

const chartPoints = computed(() => {
  if (!summary.value?.valueHistory) return '';
  const data = summary.value.valueHistory.slice(-30);
  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const range = maxVal - minVal || 1;
  
  return data.map((d, i) => {
    const x = (i / (data.length - 1)) * 800;
    const y = 200 - ((d.value - minVal) / range) * 180 - 10;
    return `${x},${y}`;
  }).join(' ');
});

const loadPortfolio = async () => {
  if (!walletAddress.value) return;
  loading.value = true;
  try {
    const [summaryRes, trendingRes] = await Promise.all([
      axios.get(`${API_BASE}/nft-portfolio/summary/${walletAddress.value}`),
      axios.get(`${API_BASE}/nft-portfolio/trending`),
    ]);
    summary.value = summaryRes.data;
    trendingCollections.value = trendingRes.data;
  } catch (error) {
    console.error('Failed to load portfolio:', error);
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num: number) => {
  return num?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
};

onMounted(() => {
  loadPortfolio();
});
</script>

<style scoped>
.nft-portfolio-tracker {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  color: #1a1a2e;
}

.wallet-input {
  display: flex;
  gap: 8px;
}

.wallet-input input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  width: 300px;
  font-size: 14px;
}

.wallet-input button {
  padding: 8px 16px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.wallet-input button:hover {
  background: #4f46e5;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card .label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.card .value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
}

.card.total-value {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.card.total-value .label,
.card.total-value .value {
  color: white;
}

.pnl {
  font-size: 14px;
  margin-top: 4px;
}

.pnl.positive { color: #10b981; }
.pnl.negative { color: #ef4444; }
.card.total-value .pnl.positive { color: #a7f3d0; }
.card.total-value .pnl.negative { color: #fca5a5; }

.chart-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.chart-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.chart-container {
  height: 200px;
  width: 100%;
}

.line-chart {
  width: 100%;
  height: 100%;
}

.time-range {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.time-range button {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.time-range button.active {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.chain-distribution {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.chain-distribution h3 {
  margin: 0 0 16px 0;
}

.chains {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chain-item {
  display: grid;
  grid-template-columns: 100px 80px 100px 1fr;
  gap: 12px;
  align-items: center;
}

.chain-name {
  font-weight: 600;
  text-transform: capitalize;
}

.bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  transition: width 0.3s;
}

.holdings-section, .trending-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.holdings-section h3, .trending-section h3 {
  margin: 0 0 16px 0;
}

.holdings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.nft-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.nft-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.nft-info {
  padding: 12px;
}

.nft-name {
  font-weight: 600;
  font-size: 14px;
}

.nft-collection {
  font-size: 12px;
  color: #64748b;
}

.nft-chain {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
}

.nft-value {
  font-size: 18px;
  font-weight: 600;
  margin-top: 8px;
}

.nft-pnl {
  font-size: 13px;
}

.nft-pnl.positive { color: #10b981; }
.nft-pnl.negative { color: #ef4444; }

.nft-rarity {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.collection-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.collection-info {
  flex: 1;
}

.collection-name {
  font-weight: 600;
  font-size: 14px;
}

.collection-chain {
  font-size: 12px;
  color: #64748b;
}

.collection-stats {
  text-align: right;
}

.floor-price {
  font-weight: 600;
}

.price-change {
  font-size: 12px;
}

.price-change.positive { color: #10b981; }
.price-change.negative { color: #ef4444; }
</style>
