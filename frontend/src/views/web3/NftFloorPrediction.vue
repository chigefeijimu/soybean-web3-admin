<template>
  <div class="nft-floor-prediction">
    <div class="header">
      <h2>🎯 NFT Floor Price Predictor</h2>
      <p class="subtitle">AI-powered floor price predictions with technical analysis</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Predictions</div>
        <div class="stat-value">{{ formatNumber(stats.totalPredictions) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Confidence</div>
        <div class="stat-value">{{ stats.avgConfidence.toFixed(1) }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Accuracy Rate</div>
        <div class="stat-value">{{ stats.accuracy.toFixed(1) }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Collections Tracked</div>
        <div class="stat-value">{{ formatNumber(stats.collectionsTracked) }}</div>
      </div>
    </div>

    <!-- Search Section -->
    <div class="search-section">
      <div class="search-form">
        <div class="form-group">
          <label>Collection Address</label>
          <input
            v-model="searchAddress"
            type="text"
            placeholder="0x..."
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>Chain</label>
          <select v-model="selectedChain" class="form-select">
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="optimism">Optimism</option>
            <option value="base">Base</option>
            <option value="solana">Solana</option>
          </select>
        </div>
        <div class="form-group">
          <label>Time Frame</label>
          <select v-model="selectedTimeFrame" class="form-select">
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
          </select>
        </div>
        <button @click="getPrediction" class="btn-primary" :disabled="loading">
          {{ loading ? 'Analyzing...' : 'Get Prediction' }}
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="prediction" class="results-section">
      <div class="prediction-header">
        <div class="current-price">
          <span class="label">Current Floor</span>
          <span class="price">{{ formatPrice(prediction.currentFloor) }} ETH</span>
        </div>
        <div class="signal-badge" :class="prediction.signal">
          {{ formatSignal(prediction.signal) }}
        </div>
      </div>

      <div class="prediction-main">
        <div class="prediction-chart">
          <div class="chart-placeholder">
            <div class="trend-indicator" :class="prediction.trend">
              <span class="trend-icon">{{ prediction.trend === 'bullish' ? '📈' : prediction.trend === 'bearish' ? '📉' : '➡️' }}</span>
              <span class="trend-text">{{ prediction.trend.toUpperCase() }}</span>
            </div>
            <div class="prediction-arrow">
              <div class="arrow-line"></div>
              <div class="arrow-head"></div>
            </div>
            <div class="predicted-price">
              <span class="label">Predicted</span>
              <span class="price">{{ formatPrice(prediction.predictedFloor) }} ETH</span>
              <span class="change" :class="prediction.predictedChange >= 0 ? 'positive' : 'negative'">
                {{ prediction.predictedChange >= 0 ? '+' : '' }}{{ prediction.predictedChangePercent.toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>

        <div class="target-prices">
          <h4>Target Prices</h4>
          <div class="targets">
            <div class="target bullish">
              <span class="label">Bullish</span>
              <span class="price">{{ formatPrice(prediction.targetPrices.bullish) }} ETH</span>
            </div>
            <div class="target neutral">
              <span class="label">Neutral</span>
              <span class="price">{{ formatPrice(prediction.targetPrices.neutral) }} ETH</span>
            </div>
            <div class="target bearish">
              <span class="label">Bearish</span>
              <span class="price">{{ formatPrice(prediction.targetPrices.bearish) }} ETH</span>
            </div>
          </div>
        </div>
      </div>

      <div class="confidence-bar">
        <div class="confidence-label">
          <span>Confidence</span>
          <span>{{ prediction.confidence.toFixed(1) }}%</span>
        </div>
        <div class="bar">
          <div class="fill" :style="{ width: `${prediction.confidence}%` }"></div>
        </div>
      </div>

      <div class="indicators-grid">
        <h4>Technical Indicators</h4>
        <div class="indicators">
          <div class="indicator">
            <span class="label">RSI</span>
            <span class="value" :class="getRsiClass(prediction.indicators.rsi)">
              {{ prediction.indicators.rsi.toFixed(1) }}
            </span>
          </div>
          <div class="indicator">
            <span class="label">MACD</span>
            <span class="value" :class="prediction.indicators.macd">
              {{ prediction.indicators.macd }}
            </span>
          </div>
          <div class="indicator">
            <span class="label">EMA 20</span>
            <span class="value">{{ formatPrice(prediction.indicators.ema20) }}</span>
          </div>
          <div class="indicator">
            <span class="label">EMA 50</span>
            <span class="value">{{ formatPrice(prediction.indicators.ema50) }}</span>
          </div>
          <div class="indicator">
            <span class="label">Volume</span>
            <span class="value">{{ prediction.indicators.volumeTrend }}</span>
          </div>
        </div>
      </div>

      <div class="factors-section">
        <h4>Analysis Factors</h4>
        <ul class="factors">
          <li v-for="(factor, idx) in prediction.factors" :key="idx">
            {{ factor }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Trending Collections -->
    <div class="trending-section">
      <div class="section-header">
        <h3>🔥 Trending Collections</h3>
        <select v-model="trendingChain" @change="loadTrending" class="chain-select">
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="base">Base</option>
        </select>
      </div>
      <div class="trending-grid" v-if="trendingCollections.length > 0">
        <div
          v-for="col in trendingCollections"
          :key="col.address"
          class="trending-card"
          @click="selectCollection(col.address, col.chain)"
        >
          <div class="col-name">{{ col.name }}</div>
          <div class="col-floor">{{ formatPrice(col.floorPrice) }} ETH</div>
          <div class="col-change" :class="col.change24h >= 0 ? 'positive' : 'negative'">
            {{ col.change24h >= 0 ? '+' : '' }}{{ col.change24h.toFixed(2) }}%
          </div>
          <div class="col-signal" :class="col.prediction.signal">
            {{ formatSignal(col.prediction.signal) }}
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        Select a chain to view trending collections
      </div>
    </div>

    <!-- Signals Overview -->
    <div class="signals-section">
      <h3>📊 Market Signals</h3>
      <div class="signals-summary">
        <div class="signal-count strong-buy">
          <span class="count">{{ signalsSummary.strongBuy }}</span>
          <span class="label">Strong Buy</span>
        </div>
        <div class="signal-count buy">
          <span class="count">{{ signalsSummary.buy }}</span>
          <span class="label">Buy</span>
        </div>
        <div class="signal-count hold">
          <span class="count">{{ signalsSummary.hold }}</span>
          <span class="label">Hold</span>
        </div>
        <div class="signal-count sell">
          <span class="count">{{ signalsSummary.sell }}</span>
          <span class="label">Sell</span>
        </div>
        <div class="signal-count strong-sell">
          <span class="count">{{ signalsSummary.strongSell }}</span>
          <span class="label">Strong Sell</span>
        </div>
      </div>
    </div>

    <!-- Watchlist Section -->
    <div class="watchlist-section">
      <div class="section-header">
        <h3>⭐ Watchlist</h3>
        <button @click="addToWatchlist" class="btn-secondary" :disabled="!prediction">
          Add Current
        </button>
      </div>
      <div class="watchlist-grid" v-if="watchlist.length > 0">
        <div
          v-for="item in watchlist"
          :key="item.id"
          class="watchlist-card"
          @click="selectCollection(item.address, item.chain)"
        >
          <div class="item-name">{{ item.name || item.address }}</div>
          <div class="item-chain">{{ item.chain }}</div>
          <button @click.stop="removeFromWatchlist(item.id)" class="btn-remove">
            ✕
          </button>
        </div>
      </div>
      <div v-else class="empty-state">
        No items in watchlist. Search for a collection to add.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { nftFloorPrediction, type FloorPricePrediction, type TrendingCollection, type ChainType, type WatchlistItem } from '../service/nftFloorPrediction';

const loading = ref(false);
const searchAddress = ref('');
const selectedChain = ref<ChainType>('ethereum');
const selectedTimeFrame = ref('7d');
const trendingChain = ref<ChainType>('ethereum');
const prediction = ref<FloorPricePrediction | null>(null);
const trendingCollections = ref<TrendingCollection[]>([]);
const watchlist = ref<WatchlistItem[]>([]);

const stats = ref({
  totalPredictions: 0,
  avgConfidence: 0,
  accuracy: 0,
  collectionsTracked: 0,
});

const signalsSummary = ref({
  strongBuy: 0,
  buy: 0,
  hold: 0,
  sell: 0,
  strongSell: 0,
});

const userId = 'user_' + Math.random().toString(36).substr(2, 9);

onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadTrending(),
    loadSignals(),
    loadWatchlist(),
  ]);
});

async function loadStats() {
  try {
    const res = await nftFloorPrediction.getStats();
    stats.value = res.data;
  } catch (e) {
    console.error('Failed to load stats', e);
  }
}

async function loadTrending() {
  try {
    const res = await nftFloorPrediction.getTrending(trendingChain.value, 8);
    trendingCollections.value = res.data.collections;
  } catch (e) {
    console.error('Failed to load trending', e);
  }
}

async function loadSignals() {
  try {
    const res = await nftFloorPrediction.getSignals();
    signalsSummary.value = res.data.summary;
  } catch (e) {
    console.error('Failed to load signals', e);
  }
}

async function loadWatchlist() {
  try {
    const res = await nftFloorPrediction.getWatchlist(userId);
    watchlist.value = res.data;
  } catch (e) {
    console.error('Failed to load watchlist', e);
  }
}

async function getPrediction() {
  if (!searchAddress.value) return;
  
  loading.value = true;
  try {
    const res = await nftFloorPrediction.predict({
      address: searchAddress.value,
      chain: selectedChain.value,
      timeFrame: selectedTimeFrame.value as any,
    });
    prediction.value = res.data;
  } catch (e) {
    console.error('Failed to get prediction', e);
  } finally {
    loading.value = false;
  }
}

function selectCollection(address: string, chain: ChainType) {
  searchAddress.value = address;
  selectedChain.value = chain;
  getPrediction();
}

async function addToWatchlist() {
  if (!prediction.value) return;
  
  try {
    await nftFloorPrediction.addToWatchlist(
      userId,
      searchAddress.value,
      selectedChain.value,
      searchAddress.value
    );
    await loadWatchlist();
  } catch (e) {
    console.error('Failed to add to watchlist', e);
  }
}

async function removeFromWatchlist(id: string) {
  try {
    await nftFloorPrediction.removeFromWatchlist(id);
    await loadWatchlist();
  } catch (e) {
    console.error('Failed to remove from watchlist', e);
  }
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return price.toFixed(4);
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatSignal(signal: string): string {
  const signals: Record<string, string> = {
    strong_buy: '🚀 Strong Buy',
    buy: '📈 Buy',
    hold: '⏸️ Hold',
    sell: '📉 Sell',
    strong_sell: '🔻 Strong Sell',
  };
  return signals[signal] || signal;
}

function getRsiClass(rsi: number): string {
  if (rsi > 70) return 'overbought';
  if (rsi < 30) return 'oversold';
  return 'neutral';
}
</script>

<style scoped>
.nft-floor-prediction {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
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

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.btn-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.results-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.current-price .label {
  display: block;
  font-size: 12px;
  color: #666;
}

.current-price .price {
  font-size: 28px;
  font-weight: 700;
}

.signal-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.signal-badge.strong_buy {
  background: #d4edda;
  color: #155724;
}

.signal-badge.buy {
  background: #c3e6cb;
  color: #155724;
}

.signal-badge.hold {
  background: #fff3cd;
  color: #856404;
}

.signal-badge.sell {
  background: #f8d7da;
  color: #721c24;
}

.signal-badge.strong_sell {
  background: #f5c6cb;
  color: #721c24;
}

.prediction-main {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  margin-bottom: 24px;
}

.prediction-chart {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
}

.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.trend-indicator.bullish {
  background: #d4edda;
}

.trend-indicator.bearish {
  background: #f8d7da;
}

.trend-indicator.neutral {
  background: #fff3cd;
}

.prediction-arrow {
  position: relative;
  height: 40px;
  margin: 16px 0;
}

.arrow-line {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.arrow-head {
  position: absolute;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid #764ba2;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
}

.predicted-price .label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.predicted-price .price {
  font-size: 24px;
  font-weight: 700;
}

.predicted-price .change {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-top: 4px;
}

.change.positive {
  color: #28a745;
}

.change.negative {
  color: #dc3545;
}

.target-prices h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.targets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.target {
  padding: 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.target.bullish {
  background: #d4edda;
}

.target.neutral {
  background: #f8f9fa;
}

.target.bearish {
  background: #f8d7da;
}

.target .label {
  font-size: 12px;
  color: #666;
}

.target .price {
  font-weight: 600;
}

.confidence-bar {
  margin-bottom: 24px;
}

.confidence-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.bar .fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s;
}

.indicators-grid h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.indicators {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.indicator {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.indicator .label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.indicator .value {
  font-weight: 600;
  font-size: 14px;
}

.indicator .value.bullish {
  color: #28a745;
}

.indicator .value.bearish {
  color: #dc3545;
}

.indicator .value.overbought {
  color: #dc3545;
}

.indicator .value.oversold {
  color: #28a745;
}

.factors-section {
  margin-top: 24px;
}

.factors-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}

.factors {
  list-style: none;
  padding: 0;
  margin: 0;
}

.factors li {
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #555;
}

.trending-section,
.signals-section,
.watchlist-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chain-select {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
}

.trending-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.trending-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.trending-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.col-name {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-floor {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.col-change {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
}

.col-change.positive {
  color: #28a745;
}

.col-change.negative {
  color: #dc3545;
}

.col-signal {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-block;
}

.col-signal.strong_buy,
.col-signal.buy {
  background: #d4edda;
}

.col-signal.hold {
  background: #fff3cd;
}

.col-signal.sell,
.col-signal.strong_sell {
  background: #f8d7da;
}

.signals-summary {
  display: flex;
  gap: 16px;
}

.signal-count {
  flex: 1;
  text-align: center;
  padding: 16px;
  border-radius: 10px;
}

.signal-count .count {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.signal-count .label {
  font-size: 11px;
  color: #666;
}

.signal-count.strong-buy {
  background: #d4edda;
}

.signal-count.buy {
  background: #c3e6cb;
}

.signal-count.hold {
  background: #fff3cd;
}

.signal-count.sell {
  background: #f8d7da;
}

.signal-count.strong-sell {
  background: #f5c6cb;
}

.watchlist-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.watchlist-card {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  cursor: pointer;
}

.item-name {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-chain {
  font-size: 11px;
  color: #666;
}

.btn-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
}

.btn-remove:hover {
  color: #dc3545;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #999;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .prediction-main {
    grid-template-columns: 1fr;
  }
  
  .indicators {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .trending-grid,
  .watchlist-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
  }
  
  .indicators {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .signals-summary {
    flex-wrap: wrap;
  }
  
  .signal-count {
    min-width: calc(33% - 12px);
  }
}
</style>
