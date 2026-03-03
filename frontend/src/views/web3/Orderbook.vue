<template>
  <div class="orderbook-view">
    <div class="header">
      <h2>📊 Order Book & Market Depth</h2>
      <div class="actions">
        <select v-model="selectedChain" class="chain-select" @change="loadOrderbook">
          <option value="ethereum">Ethereum</option>
          <option value="arbitrum">Arbitrum</option>
          <option value="optimism">Optimism</option>
          <option value="polygon">Polygon</option>
          <option value="bsc">BSC</option>
          <option value="base">Base</option>
          <option value="avalanche">Avalanche</option>
        </select>
        <select v-model="selectedToken" class="token-select" @change="loadOrderbook">
          <option value="ETH">ETH</option>
          <option value="WBTC">WBTC</option>
          <option value="WETH">WETH</option>
        </select>
        <select v-model="selectedQuote" class="quote-select" @change="loadOrderbook">
          <option value="USDC">USDC</option>
          <option value="USDT">USDT</option>
        </select>
        <button @click="loadOrderbook" :disabled="loading" class="btn-primary">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading orderbook data...</p>
    </div>

    <div v-else class="orderbook-content">
      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">{{ orderbookData?.midPrice || '-' }}</div>
            <div class="stat-label">Mid Price ({{ selectedQuote }})</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <div class="stat-value">{{ orderbookData?.spread || '-' }}</div>
            <div class="stat-label">Spread</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📉</div>
          <div class="stat-info">
            <div class="stat-value">{{ orderbookData?.spreadPercent || '-' }}%</div>
            <div class="stat-label">Spread %</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🔄</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatTime(orderbookData?.timestamp) }}</div>
            <div class="stat-label">Last Update</div>
          </div>
        </div>
      </div>

      <!-- Order Book Section -->
      <div class="orderbook-section">
        <h3>📋 Order Book</h3>
        <div class="orderbook-table">
          <div class="orderbook-header">
            <span>Price ({{ selectedQuote }})</span>
            <span>Amount ({{ selectedToken }})</span>
            <span>Total ({{ selectedQuote }})</span>
          </div>
          
          <!-- Asks (Sell Orders) - Red -->
          <div class="asks-section">
            <div v-for="(ask, index) in orderbookData?.asks?.slice(0, 10)" :key="'ask-'+index" class="order-row ask">
              <span class="price">{{ ask.price }}</span>
              <span class="amount">{{ ask.amount }}</span>
              <span class="total">{{ ask.total }}</span>
              <div class="depth-bar ask-bar" :style="{ width: getAskDepthPercent(ask) + '%' }"></div>
            </div>
          </div>
          
          <!-- Mid Price -->
          <div class="mid-price">
            <span class="price-value">{{ orderbookData?.midPrice }}</span>
            <span class="price-label">{{ selectedQuote }}</span>
          </div>
          
          <!-- Bids (Buy Orders) - Green -->
          <div class="bids-section">
            <div v-for="(bid, index) in orderbookData?.bids?.slice(0, 10)" :key="'bid-'+index" class="order-row bid">
              <span class="price">{{ bid.price }}</span>
              <span class="amount">{{ bid.amount }}</span>
              <span class="total">{{ bid.total }}</span>
              <div class="depth-bar bid-bar" :style="{ width: getBidDepthPercent(bid) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Market Depth Section -->
      <div class="depth-section">
        <h3>📊 Market Depth</h3>
        <div class="depth-controls">
          <label>
            Depth Range:
            <input type="range" v-model="depthPercent" min="1" max="20" @change="loadMarketDepth">
            <span>{{ depthPercent }}%</span>
          </label>
        </div>
        
        <div class="depth-chart">
          <div class="depth-bids">
            <h4>🟢 Bid Depth</h4>
            <div class="depth-bar-container">
              <div v-for="(bid, index) in marketDepthData?.bids" :key="'dbid-'+index" class="depth-item">
                <span class="depth-price">{{ bid.price }}</span>
                <div class="depth-visual">
                  <div class="depth-fill bid-fill" :style="{ width: (parseFloat(bid.cumulative) / maxBidDepth * 100) + '%' }"></div>
                </div>
                <span class="depth-amount">{{ bid.cumulative }}</span>
              </div>
            </div>
          </div>
          
          <div class="depth-asks">
            <h4>🔴 Ask Depth</h4>
            <div class="depth-bar-container">
              <div v-for="(ask, index) in marketDepthData?.asks" :key="'dask-'+index" class="depth-item">
                <span class="depth-price">{{ ask.price }}</span>
                <div class="depth-visual">
                  <div class="depth-fill ask-fill" :style="{ width: (parseFloat(ask.cumulative) / maxAskDepth * 100) + '%' }"></div>
                </div>
                <span class="depth-amount">{{ ask.cumulative }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="depth-stats">
          <div class="depth-stat">
            <span class="label">Total Bid Depth:</span>
            <span class="value green">{{ marketDepthData?.totalBidDepth }}</span>
          </div>
          <div class="depth-stat">
            <span class="label">Total Ask Depth:</span>
            <span class="value red">{{ marketDepthData?.totalAskDepth }}</span>
          </div>
          <div class="depth-stat">
            <span class="label">Imbalance:</span>
            <span :class="['value', parseFloat(marketDepthData?.imbalance || '0') >= 0 ? 'green' : 'red']">
              {{ marketDepthData?.imbalance }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Historical Data Section -->
      <div class="history-section">
        <h3>📈 Order Book History</h3>
        <div class="timeframe-selector">
          <button 
            v-for="tf in timeframes" 
            :key="tf.value"
            :class="['tf-btn', { active: selectedTimeframe === tf.value }]"
            @click="selectTimeframe(tf.value)"
          >
            {{ tf.label }}
          </button>
        </div>
        
        <div class="history-chart">
          <div class="chart-placeholder">
            <div class="chart-line">
              <div v-for="(point, index) in historyData?.slice(-20)" :key="index" 
                class="chart-point" 
                :style="{ height: getPriceHeight(point.midPrice) + '%' }"
                :title="`Price: ${point.midPrice}`"
              ></div>
            </div>
          </div>
        </div>
        
        <div class="history-stats">
          <div class="history-stat">
            <span class="label">High:</span>
            <span class="value">{{ historyStats?.high }}</span>
          </div>
          <div class="history-stat">
            <span class="label">Low:</span>
            <span class="value">{{ historyStats?.low }}</span>
          </div>
          <div class="history-stat">
            <span class="label">Avg:</span>
            <span class="value">{{ historyStats?.avg }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const API_BASE = 'http://localhost:3018/api/v1/orderbook';

const loading = ref(false);
const selectedChain = ref('ethereum');
const selectedToken = ref('ETH');
const selectedQuote = ref('USDC');
const depthPercent = ref(5);
const selectedTimeframe = ref('1h');

const timeframes = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '24h', value: '24h' },
];

const orderbookData = ref<any>(null);
const marketDepthData = ref<any>(null);
const historyData = ref<any[]>([]);

const maxBidTotal = computed(() => {
  if (!orderbookData.value?.bids) return 1;
  return Math.max(...orderbookData.value.bids.map((b: any) => parseFloat(b.total)));
});

const maxAskTotal = computed(() => {
  if (!orderbookData.value?.asks) return 1;
  return Math.max(...orderbookData.value.asks.map((a: any) => parseFloat(a.total)));
});

const maxBidDepth = computed(() => {
  if (!marketDepthData.value?.bids) return 1;
  return Math.max(...marketDepthData.value.bids.map((b: any) => parseFloat(b.cumulative)));
});

const maxAskDepth = computed(() => {
  if (!marketDepthData.value?.asks) return 1;
  return Math.max(...marketDepthData.value.asks.map((a: any) => parseFloat(a.cumulative)));
});

const historyStats = computed(() => {
  if (!historyData.value?.length) return { high: '-', low: '-', avg: '-' };
  const prices = historyData.value.map((h: any) => parseFloat(h.midPrice));
  return {
    high: Math.max(...prices).toFixed(2),
    low: Math.min(...prices).toFixed(2),
    avg: (prices.reduce((a: number, b: number) => a + b, 0) / prices.length).toFixed(2),
  };
});

const loadOrderbook = async () => {
  loading.value = true;
  try {
    const { data } = await axios.get(API_BASE, {
      params: {
        token: selectedToken.value,
        quote: selectedQuote.value,
        chain: selectedChain.value,
        limit: 20,
      },
    });
    orderbookData.value = data;
    await loadMarketDepth();
    await loadHistory();
  } catch (error) {
    console.error('Failed to load orderbook:', error);
  } finally {
    loading.value = false;
  }
};

const loadMarketDepth = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/depth`, {
      params: {
        token: selectedToken.value,
        quote: selectedQuote.value,
        chain: selectedChain.value,
        depthPercent: depthPercent.value,
      },
    });
    marketDepthData.value = data;
  } catch (error) {
    console.error('Failed to load market depth:', error);
  }
};

const loadHistory = async () => {
  try {
    const { data } = await axios.get(`${API_BASE}/history`, {
      params: {
        token: selectedToken.value,
        quote: selectedQuote.value,
        chain: selectedChain.value,
        timeframe: selectedTimeframe.value,
      },
    });
    historyData.value = data;
  } catch (error) {
    console.error('Failed to load history:', error);
  }
};

const selectTimeframe = (tf: string) => {
  selectedTimeframe.value = tf;
  loadHistory();
};

const getBidDepthPercent = (bid: any) => {
  return (parseFloat(bid.total) / maxBidTotal.value) * 100;
};

const getAskDepthPercent = (ask: any) => {
  return (parseFloat(ask.total) / maxAskTotal.value) * 100;
};

const getPriceHeight = (price: string) => {
  if (!historyData.value?.length) return 50;
  const prices = historyData.value.map((h: any) => parseFloat(h.midPrice));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  return ((parseFloat(price) - min) / range) * 80 + 10;
};

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString();
};

onMounted(() => {
  loadOrderbook();
});
</script>

<style scoped>
.orderbook-view {
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
}

.actions {
  display: flex;
  gap: 10px;
}

.chain-select, .token-select, .quote-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.btn-primary {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-icon {
  font-size: 24px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.orderbook-section, .depth-section, .history-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.orderbook-table {
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
}

.orderbook-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 10px 16px;
  background: #f9fafb;
  font-weight: 600;
  font-size: 14px;
}

.order-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 8px 16px;
  position: relative;
  font-size: 14px;
}

.order-row.ask .price { color: #ef4444; }
.order-row.bid .price { color: #22c55e; }

.depth-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  opacity: 0.1;
}

.bid-bar { background: #22c55e; }
.ask-bar { background: #ef4444; }

.mid-price {
  padding: 12px 16px;
  background: #f9fafb;
  text-align: center;
  font-weight: 600;
  font-size: 18px;
}

.depth-chart {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 16px;
}

.depth-bids h4, .depth-asks h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.depth-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.depth-visual {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.depth-fill {
  height: 100%;
  border-radius: 4px;
}

.bid-fill { background: #22c55e; }
.ask-fill { background: #ef4444; }

.depth-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.depth-stat .label {
  color: #666;
  margin-right: 8px;
}

.depth-stat .value.green { color: #22c55e; }
.depth-stat .value.red { color: #ef4444; }

.timeframe-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tf-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.tf-btn.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.chart-placeholder {
  height: 150px;
  background: #f9fafb;
  border-radius: 6px;
  padding: 10px;
}

.chart-line {
  display: flex;
  align-items: flex-end;
  height: 100%;
  gap: 2px;
}

.chart-point {
  flex: 1;
  background: #4f46e5;
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}

.history-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
}

.history-stat .value {
  font-weight: 600;
  margin-left: 8px;
}
</style>
