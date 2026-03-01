<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWeb3 } from '@/composables/web3/useWeb3';

// Types
interface SentimentData {
  symbol: string;
  name: string;
  sentiment: number; // -100 to 100
  trend: 'bullish' | 'bearish' | 'neutral';
  twitterSentiment: number;
  redditSentiment: number;
  newsSentiment: number;
  socialVolume: number;
  fearGreedIndex: number;
  lastUpdated: string;
}

interface TrendData {
  timestamp: number;
  value: number;
}

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  sentiment: number;
}

// Web3 composable
const { selectedChain } = useWeb3();

// State
const loading = ref(false);
const selectedCoin = ref('BTC');
const timeRange = ref('24h');
const sentimentData = ref<SentimentData[]>([]);
const historicalTrends = ref<TrendData[]>([]);
const marketOverview = ref<CoinData[]>([]);

// Mock sentiment data based on real market conditions
const generateSentimentData = (): SentimentData[] => {
  const coins: SentimentData[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      sentiment: 45,
      trend: 'neutral',
      twitterSentiment: 52,
      redditSentiment: 38,
      newsSentiment: 45,
      socialVolume: 125000,
      fearGreedIndex: 55,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      sentiment: 62,
      trend: 'bullish',
      twitterSentiment: 68,
      redditSentiment: 58,
      newsSentiment: 60,
      socialVolume: 89000,
      fearGreedIndex: 62,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      sentiment: 78,
      trend: 'bullish',
      twitterSentiment: 82,
      redditSentiment: 75,
      newsSentiment: 77,
      socialVolume: 67000,
      fearGreedIndex: 72,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'ARB',
      name: 'Arbitrum',
      sentiment: 35,
      trend: 'bearish',
      twitterSentiment: 28,
      redditSentiment: 42,
      newsSentiment: 35,
      socialVolume: 23000,
      fearGreedIndex: 38,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'OP',
      name: 'Optimism',
      sentiment: 28,
      trend: 'bearish',
      twitterSentiment: 22,
      redditSentiment: 35,
      newsSentiment: 27,
      socialVolume: 18000,
      fearGreedIndex: 32,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'LINK',
      name: 'Chainlink',
      sentiment: 58,
      trend: 'bullish',
      twitterSentiment: 55,
      redditSentiment: 62,
      newsSentiment: 57,
      socialVolume: 34000,
      fearGreedIndex: 58,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'AAVE',
      name: 'Aave',
      sentiment: 52,
      trend: 'neutral',
      twitterSentiment: 48,
      redditSentiment: 56,
      newsSentiment: 52,
      socialVolume: 15000,
      fearGreedIndex: 52,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'UNI',
      name: 'Uniswap',
      sentiment: 42,
      trend: 'neutral',
      twitterSentiment: 45,
      redditSentiment: 40,
      newsSentiment: 41,
      socialVolume: 22000,
      fearGreedIndex: 48,
      lastUpdated: new Date().toISOString()
    }
  ];
  return coins;
};

const generateHistoricalTrends = (): TrendData[] => {
  const now = Date.now();
  const trends: TrendData[] = [];
  const hours = timeRange.value === '24h' ? 24 : timeRange.value === '7d' ? 168 : 720;
  
  for (let i = hours; i >= 0; i -= (timeRange.value === '24h' ? 1 : timeRange.value === '7d' ? 6 : 24)) {
    const baseValue = 50 + Math.sin(i / 10) * 20;
    const randomVariation = (Math.random() - 0.5) * 15;
    trends.push({
      timestamp: now - i * 3600000,
      value: Math.max(0, Math.min(100, baseValue + randomVariation))
    });
  }
  return trends;
};

const generateMarketOverview = (): CoinData[] => {
  const coins: CoinData[] = [
    { symbol: 'BTC', name: 'Bitcoin', price: 84520, change24h: 2.3, sentiment: 45 },
    { symbol: 'ETH', name: 'Ethereum', price: 3280, change24h: 4.1, sentiment: 62 },
    { symbol: 'SOL', name: 'Solana', price: 145, change24h: 8.7, sentiment: 78 },
    { symbol: 'BNB', name: 'Binance Coin', price: 580, change24h: 1.2, sentiment: 55 },
    { symbol: 'XRP', name: 'Ripple', price: 2.45, change24h: -1.8, sentiment: 38 },
    { symbol: 'ADA', name: 'Cardano', price: 0.85, change24h: 3.2, sentiment: 48 },
    { symbol: 'DOGE', name: 'Dogecoin', price: 0.32, change24h: 5.4, sentiment: 72 },
    { symbol: 'AVAX', name: 'Avalanche', price: 42, change24h: -2.1, sentiment: 35 }
  ];
  return coins;
};

// Computed
const overallSentiment = computed(() => {
  if (!sentimentData.value.length) return 50;
  const sum = sentimentData.value.reduce((acc, coin) => acc + coin.sentiment, 0);
  return Math.round(sum / sentimentData.value.length);
});

const sentimentLabel = computed(() => {
  const value = overallSentiment.value;
  if (value >= 60) return 'Bullish';
  if (value <= 40) return 'Bearish';
  return 'Neutral';
});

const sentimentColor = computed(() => {
  const value = overallSentiment.value;
  if (value >= 60) return '#22c55e';
  if (value <= 40) return '#ef4444';
  return '#eab308';
});

const selectedCoinData = computed(() => {
  return sentimentData.value.find(c => c.symbol === selectedCoin.value) || sentimentData.value[0];
});

const topBullish = computed(() => {
  return [...sentimentData.value].sort((a, b) => b.sentiment - a.sentiment).slice(0, 3);
});

const topBearish = computed(() => {
  return [...sentimentData.value].sort((a, b) => a.sentiment - b.sentiment).slice(0, 3);
});

// Methods
const loadData = async () => {
  loading.value = true;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    sentimentData.value = generateSentimentData();
    historicalTrends.value = generateHistoricalTrends();
    marketOverview.value = generateMarketOverview();
  } finally {
    loading.value = false;
  }
};

const changeTimeRange = (range: string) => {
  timeRange.value = range;
  historicalTrends.value = generateHistoricalTrends();
};

const getSentimentBarColor = (value: number) => {
  if (value >= 60) return '#22c55e';
  if (value <= 40) return '#ef4444';
  return '#eab308';
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const getTrendIcon = (trend: string) => {
  if (trend === 'bullish') return '📈';
  if (trend === 'bearish') return '📉';
  return '➡️';
};

const getTrendColor = (trend: string) => {
  if (trend === 'bullish') return '#22c55e';
  if (trend === 'bearish') return '#ef4444';
  return '#6b7280';
};

// Auto-refresh
let refreshInterval: ReturnType<typeof setInterval>;

onMounted(() => {
  loadData();
  refreshInterval = setInterval(loadData, 60000); // Refresh every minute
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<template>
  <div class="sentiment-dashboard">
    <!-- Header -->
    <div class="header">
      <div class="title-section">
        <h2 class="title">📊 Crypto Sentiment Dashboard</h2>
        <p class="subtitle">Real-time social media sentiment analysis for cryptocurrencies</p>
      </div>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-label">Overall Sentiment</span>
          <span class="stat-value" :style="{ color: sentimentColor }">
            {{ overallSentiment }} - {{ sentimentLabel }}
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Market Status</span>
          <span class="stat-value" :style="{ color: sentimentColor }">
            {{ overallSentiment >= 50 ? '🟢 Bullish' : '🔴 Bearish' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Time Range Selector -->
    <div class="time-selector">
      <button 
        v-for="range in ['24h', '7d', '30d']" 
        :key="range"
        :class="['time-btn', { active: timeRange === range }]"
        @click="changeTimeRange(range)"
      >
        {{ range }}
      </button>
    </div>

    <!-- Main Grid -->
    <div class="main-grid">
      <!-- Sentiment Trend Chart -->
      <div class="card sentiment-chart">
        <h3 class="card-title">Sentiment Trend</h3>
        <div class="chart-container">
          <div class="simple-chart">
            <div 
              v-for="(point, idx) in historicalTrends" 
              :key="idx"
              class="chart-bar"
              :style="{
                height: `${point.value}%`,
                backgroundColor: getSentimentBarColor(point.value)
              }"
              :title="`${new Date(point.timestamp).toLocaleString()}: ${Math.round(point.value)}`"
            />
          </div>
          <div class="chart-labels">
            <span>Now</span>
            <span>{{ timeRange === '24h' ? '24h ago' : timeRange === '7d' ? '7d ago' : '30d ago' }}</span>
          </div>
        </div>
      </div>

      <!-- Coin Sentiment List -->
      <div class="card coin-list">
        <h3 class="card-title">Coin Sentiments</h3>
        <div class="coin-items">
          <div 
            v-for="coin in sentimentData" 
            :key="coin.symbol"
            :class="['coin-item', { selected: selectedCoin === coin.symbol }]"
            @click="selectedCoin = coin.symbol"
          >
            <div class="coin-info">
              <span class="coin-symbol">{{ coin.symbol }}</span>
              <span class="coin-name">{{ coin.name }}</span>
            </div>
            <div class="coin-sentiment">
              <span class="sentiment-value" :style="{ color: getSentimentBarColor(coin.sentiment) }">
                {{ coin.sentiment }}
              </span>
              <span class="trend-icon">{{ getTrendIcon(coin.trend) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Coin Details -->
      <div class="card coin-details" v-if="selectedCoinData">
        <h3 class="card-title">{{ selectedCoinData.name }} ({{ selectedCoinData.symbol }})</h3>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Overall Sentiment</span>
            <div class="sentiment-bar-container">
              <div 
                class="sentiment-bar"
                :style="{
                  width: `${selectedCoinData.sentiment}%`,
                  backgroundColor: getSentimentBarColor(selectedCoinData.sentiment)
                }"
              />
            </div>
            <span class="detail-value" :style="{ color: getSentimentBarColor(selectedCoinData.sentiment) }">
              {{ selectedCoinData.sentiment }}
            </span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Twitter Sentiment</span>
            <div class="sentiment-bar-container">
              <div 
                class="sentiment-bar twitter"
                :style="{
                  width: `${selectedCoinData.twitterSentiment}%`,
                  backgroundColor: getSentimentBarColor(selectedCoinData.twitterSentiment)
                }"
              />
            </div>
            <span class="detail-value">{{ selectedCoinData.twitterSentiment }}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Reddit Sentiment</span>
            <div class="sentiment-bar-container">
              <div 
                class="sentiment-bar reddit"
                :style="{
                  width: `${selectedCoinData.redditSentiment}%`,
                  backgroundColor: getSentimentBarColor(selectedCoinData.redditSentiment)
                }"
              />
            </div>
            <span class="detail-value">{{ selectedCoinData.redditSentiment }}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">News Sentiment</span>
            <div class="sentiment-bar-container">
              <div 
                class="sentiment-bar news"
                :style="{
                  width: `${selectedCoinData.newsSentiment}%`,
                  backgroundColor: getSentimentBarColor(selectedCoinData.newsSentiment)
                }"
              />
            </div>
            <span class="detail-value">{{ selectedCoinData.newsSentiment }}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Social Volume</span>
            <span class="detail-value">{{ formatNumber(selectedCoinData.socialVolume) }} mentions</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">Fear & Greed Index</span>
            <span class="detail-value" :style="{ color: getSentimentBarColor(selectedCoinData.fearGreedIndex) }">
              {{ selectedCoinData.fearGreedIndex }} / 100
            </span>
          </div>
        </div>
      </div>

      <!-- Market Overview -->
      <div class="card market-overview">
        <h3 class="card-title">Market Overview</h3>
        <div class="market-grid">
          <div 
            v-for="coin in marketOverview" 
            :key="coin.symbol"
            class="market-item"
          >
            <div class="market-coin">
              <span class="market-symbol">{{ coin.symbol }}</span>
              <span class="market-price">${{ coin.price.toLocaleString() }}</span>
              <span :class="['market-change', coin.change24h >= 0 ? 'positive' : 'negative']">
                {{ coin.change24h >= 0 ? '+' : '' }}{{ coin.change24h }}%
              </span>
            </div>
            <div class="market-sentiment">
              <div 
                class="mini-bar"
                :style="{
                  width: `${coin.sentiment}%`,
                  backgroundColor: getSentimentBarColor(coin.sentiment)
                }"
              />
              <span class="mini-value">{{ coin.sentiment }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Movers -->
      <div class="card top-movers">
        <h3 class="card-title">Sentiment Leaders</h3>
        
        <div class="mover-section">
          <h4 class="mover-title bullish">🐂 Top Bullish</h4>
          <div class="mover-list">
            <div v-for="coin in topBullish" :key="coin.symbol" class="mover-item">
              <span class="mover-symbol">{{ coin.symbol }}</span>
              <span class="mover-value" style="color: #22c55e">{{ coin.sentiment }}</span>
            </div>
          </div>
        </div>
        
        <div class="mover-section">
          <h4 class="mover-title bearish">🐻 Top Bearish</h4>
          <div class="mover-list">
            <div v-for="coin in topBearish" :key="coin.symbol" class="mover-item">
              <span class="mover-symbol">{{ coin.symbol }}</span>
              <span class="mover-value" style="color: #ef4444">{{ coin.sentiment }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Loading sentiment data...</p>
    </div>
  </div>
</template>

<style scoped>
.sentiment-dashboard {
  padding: 20px;
  background: #0f172a;
  min-height: 100vh;
  color: #e2e8f0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.time-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.time-btn {
  padding: 8px 16px;
  border: 1px solid #334155;
  border-radius: 6px;
  background: #1e293b;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.time-btn:hover {
  background: #334155;
}

.time-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.main-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.card {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #334155;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #e2e8f0;
}

.sentiment-chart {
  grid-column: span 2;
}

.chart-container {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.simple-chart {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  padding: 10px 0;
}

.chart-bar {
  flex: 1;
  min-height: 2px;
  border-radius: 2px 2px 0 0;
  transition: height 0.3s;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748b;
  margin-top: 8px;
}

.coin-list {
  max-height: 300px;
  overflow-y: auto;
}

.coin-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #0f172a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.coin-item:hover {
  border-color: #3b82f6;
}

.coin-item.selected {
  border-color: #3b82f6;
  background: #1e3a5f;
}

.coin-info {
  display: flex;
  flex-direction: column;
}

.coin-symbol {
  font-weight: 600;
  font-size: 14px;
}

.coin-name {
  font-size: 11px;
  color: #64748b;
}

.coin-sentiment {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sentiment-value {
  font-weight: 700;
  font-size: 16px;
}

.trend-icon {
  font-size: 14px;
}

.coin-details {
  grid-column: span 2;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-label {
  font-size: 12px;
  color: #64748b;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
}

.sentiment-bar-container {
  height: 8px;
  background: #0f172a;
  border-radius: 4px;
  overflow: hidden;
}

.sentiment-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.market-overview {
  grid-column: span 2;
}

.market-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.market-item {
  background: #0f172a;
  padding: 12px;
  border-radius: 8px;
}

.market-coin {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.market-symbol {
  font-weight: 600;
  font-size: 14px;
}

.market-price {
  font-size: 13px;
  color: #94a3b8;
}

.market-change {
  font-size: 12px;
  font-weight: 500;
}

.market-change.positive {
  color: #22c55e;
}

.market-change.negative {
  color: #ef4444;
}

.market-sentiment {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
}

.mini-value {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  min-width: 20px;
}

.top-movers {
  grid-row: span 2;
}

.mover-section {
  margin-bottom: 20px;
}

.mover-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.mover-title.bullish {
  color: #22c55e;
}

.mover-title.bearish {
  color: #ef4444;
}

.mover-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mover-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  background: #0f172a;
  border-radius: 8px;
}

.mover-symbol {
  font-weight: 600;
}

.mover-value {
  font-weight: 700;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 16px;
  color: #94a3b8;
}

@media (max-width: 1200px) {
  .main-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .sentiment-chart,
  .coin-details,
  .market-overview {
    grid-column: span 2;
  }
  
  .top-movers {
    grid-row: span 1;
  }
}

@media (max-width: 768px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
  
  .sentiment-chart,
  .coin-details,
  .market-overview {
    grid-column: span 1;
  }
  
  .header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .market-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
