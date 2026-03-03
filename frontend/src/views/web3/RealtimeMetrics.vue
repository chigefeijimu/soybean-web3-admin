<template>
  <div class="realtime-metrics">
    <div class="header">
      <h2>📡 Real-time On-chain Metrics</h2>
      <div class="connection-status">
        <span :class="['status-dot', wsConnected ? 'connected' : 'disconnected']"></span>
        {{ wsConnected ? 'Live' : 'Connecting...' }}
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading metrics data...</p>
    </div>

    <div v-else class="metrics-content">
      <!-- Overview Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🚀</div>
          <div class="stat-info">
            <div class="stat-value">{{ overview?.totalTPS || 0 }}</div>
            <div class="stat-label">Total TPS</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">${{ formatNumber(overview?.totalTVL || 0) }}</div>
            <div class="stat-label">Total TVL</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatNumber(overview?.totalTx24h || 0) }}</div>
            <div class="stat-label">24h Transactions</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⛓️</div>
          <div class="stat-info">
            <div class="stat-value">{{ overview?.chainCount || 0 }}</div>
            <div class="stat-label">Active Chains</div>
          </div>
        </div>
      </div>

      <!-- Gas Prices Section -->
      <div class="section">
        <h3>⛽ Gas Prices</h3>
        <div class="gas-grid">
          <div v-for="gas in gasPrices" :key="gas.chainId" class="gas-card">
            <div class="gas-header">
              <span class="chain-name">{{ gas.chainName }}</span>
              <span class="last-update">{{ formatTime(gas.lastUpdated) }}</span>
            </div>
            <div class="gas-prices">
              <div class="gas-item slow">
                <span class="label">Slow</span>
                <span class="value">{{ gas.slow }} {{ getGasUnit(gas.chainId) }}</span>
              </div>
              <div class="gas-item normal">
                <span class="label">Normal</span>
                <span class="value">{{ gas.normal }} {{ getGasUnit(gas.chainId) }}</span>
              </div>
              <div class="gas-item fast">
                <span class="label">Fast</span>
                <span class="value">{{ gas.fast }} {{ getGasUnit(gas.chainId) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chain Metrics Section -->
      <div class="section">
        <h3>📊 Chain Performance</h3>
        <div class="chains-table">
          <table>
            <thead>
              <tr>
                <th>Chain</th>
                <th>TPS</th>
                <th>Gas Price</th>
                <th>24h TXs</th>
                <th>Active Addresses</th>
                <th>TVL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="metric in chainMetrics" :key="metric.chainId">
                <td>
                  <span class="chain-badge">{{ metric.chainName }}</span>
                </td>
                <td>
                  <span class="tps-value">{{ metric.tps }}</span>
                </td>
                <td>
                  <span class="gas-value">{{ metric.gasPrice }} {{ getGasUnit(metric.chainId) }}</span>
                </td>
                <td>{{ formatNumber(metric.txCount24h) }}</td>
                <td>{{ formatNumber(metric.activeAddresses) }}</td>
                <td>${{ formatNumber(metric.tvl) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Events Section -->
      <div class="section">
        <h3>📰 Recent Events</h3>
        <div class="events-grid">
          <!-- Whale Transactions -->
          <div class="event-card">
            <h4>🐋 Whale Transactions</h4>
            <div class="event-list">
              <div v-for="tx in overview?.recentEvents?.whaleTxs || []" :key="tx.hash" class="event-item">
                <div class="event-header">
                  <span class="event-type">{{ tx.type }}</span>
                  <span class="event-chain">{{ tx.chain }}</span>
                </div>
                <div class="event-value">${{ formatNumber(tx.valueUSD) }}</div>
                <div class="event-hash">{{ formatHash(tx.hash) }}</div>
                <div class="event-time">{{ formatTime(tx.timestamp) }}</div>
              </div>
              <div v-if="!overview?.recentEvents?.whaleTxs?.length" class="no-data">
                No whale transactions yet
              </div>
            </div>
          </div>

          <!-- NFT Sales -->
          <div class="event-card">
            <h4>🎨 Recent NFT Sales</h4>
            <div class="event-list">
              <div v-for="sale in overview?.recentEvents?.nftSales || []" :key="sale.tokenId + sale.timestamp" class="event-item">
                <div class="event-header">
                  <span class="event-type">{{ sale.collection }}</span>
                  <span class="event-chain">{{ sale.chain }}</span>
                </div>
                <div class="event-value">{{ sale.price.toFixed(4) }} ETH (${{ formatNumber(sale.priceUSD) }})</div>
                <div class="event-time">{{ formatTime(sale.timestamp) }}</div>
              </div>
              <div v-if="!overview?.recentEvents?.nftSales?.length" class="no-data">
                No recent NFT sales
              </div>
            </div>
          </div>

          <!-- Liquidations -->
          <div class="event-card">
            <h4>⚠️ Liquidations</h4>
            <div class="event-list">
              <div v-for="liq in overview?.recentEvents?.liquidations || []" :key="liq.timestamp + liq.borrower" class="event-item liquidation">
                <div class="event-header">
                  <span class="event-type">{{ liq.protocol }}</span>
                  <span class="event-chain">{{ liq.chain }}</span>
                </div>
                <div class="event-value">
                  {{ liq.collateralAmount.toFixed(2) }} {{ liq.collateralSymbol }}
                </div>
                <div class="event-borrower">Borrower: {{ formatHash(liq.borrower) }}</div>
                <div class="event-time">{{ formatTime(liq.timestamp) }}</div>
              </div>
              <div v-if="!overview?.recentEvents?.liquidations?.length" class="no-data">
                No liquidations
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { realtimeMetricsApi, type GasPrice, type ChainMetrics, type OverviewData, RealtimeMetricsWebSocket } from '@/service/realtimeMetrics';

const loading = ref(true);
const wsConnected = ref(false);
const gasPrices = ref<GasPrice[]>([]);
const chainMetrics = ref<ChainMetrics[]>([]);
const overview = ref<OverviewData | null>(null);

let ws: RealtimeMetricsWebSocket | null = null;

const getGasUnit = (chainId: number): string => {
  const gweiChains = [1, 56, 137, 43114];
  return gweiChains.includes(chainId) ? 'Gwei' : 'ETH';
};

const formatNumber = (num: number): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
};

const formatHash = (hash: string): string => {
  if (!hash) return '';
  return hash.slice(0, 6) + '...' + hash.slice(-4);
};

const loadData = async () => {
  try {
    const [gasRes, metricsRes, overviewRes] = await Promise.all([
      realtimeMetricsApi.getGasPrices(),
      realtimeMetricsApi.getChainMetrics(),
      realtimeMetricsApi.getOverview(),
    ]);

    if (gasRes.data.success) gasPrices.value = gasRes.data.data;
    if (metricsRes.data.success) chainMetrics.value = metricsRes.data.data;
    if (overviewRes.data.success) overview.value = overviewRes.data.data;
  } catch (error) {
    console.error('Failed to load metrics:', error);
  } finally {
    loading.value = false;
  }
};

const initWebSocket = () => {
  ws = new RealtimeMetricsWebSocket(3023);
  
  ws.on('initial_data', (data) => {
    if (data.gasPrices) gasPrices.value = data.gasPrices;
    if (data.chainMetrics) chainMetrics.value = data.chainMetrics;
    if (data.recentSales || data.recentWhaleTxs) {
      overview.value = {
        ...overview.value,
        recentEvents: {
          nftSales: data.recentSales || [],
          liquidations: data.recentLiquidations || [],
          whaleTxs: data.recentWhaleTxs || [],
        },
      } as OverviewData;
    }
    wsConnected.value = true;
  });

  ws.on('metrics_update', (data) => {
    if (data.gasPrices) gasPrices.value = data.gasPrices;
    if (data.chainMetrics) chainMetrics.value = data.chainMetrics;
  });

  ws.on('whale_transaction', (data) => {
    if (overview.value && data.length > 0) {
      overview.value = {
        ...overview.value,
        recentEvents: {
          ...overview.value.recentEvents,
          whaleTxs: data,
        },
      };
    }
  });

  ws.on('nft_sale', (data) => {
    if (overview.value && data.length > 0) {
      overview.value = {
        ...overview.value,
        recentEvents: {
          ...overview.value.recentEvents,
          nftSales: data,
        },
      };
    }
  });

  ws.on('liquidation', (data) => {
    if (overview.value && data.length > 0) {
      overview.value = {
        ...overview.value,
        recentEvents: {
          ...overview.value.recentEvents,
          liquidations: data,
        },
      };
    }
  });

  ws.connect().catch((error) => {
    console.error('WebSocket connection failed:', error);
  });
};

onMounted(() => {
  loadData();
  initWebSocket();
});

onUnmounted(() => {
  if (ws) {
    ws.disconnect();
  }
});
</script>

<style scoped>
.realtime-metrics {
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

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.connected {
  background: #10b981;
  animation: pulse 2s infinite;
}

.status-dot.disconnected {
  background: #ef4444;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading-state {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  margin: 0 auto 16px;
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
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 18px;
  margin-bottom: 16px;
  color: #1f2937;
}

.gas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.gas-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.gas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chain-name {
  font-weight: 600;
  color: #1f2937;
}

.last-update {
  font-size: 12px;
  color: #9ca3af;
}

.gas-prices {
  display: flex;
  gap: 12px;
}

.gas-item {
  flex: 1;
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  background: #f9fafb;
}

.gas-item .label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.gas-item .value {
  font-weight: 600;
  color: #1f2937;
}

.gas-item.slow .value { color: #10b981; }
.gas-item.normal .value { color: #3b82f6; }
.gas-item.fast .value { color: #ef4444; }

.chains-table {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chains-table table {
  width: 100%;
  border-collapse: collapse;
}

.chains-table th,
.chains-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.chains-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #6b7280;
  font-size: 14px;
}

.chains-table td {
  color: #1f2937;
}

.chain-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tps-value {
  color: #10b981;
  font-weight: 600;
}

.gas-value {
  color: #f59e0b;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.event-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.event-card h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #1f2937;
}

.event-list {
  max-height: 300px;
  overflow-y: auto;
}

.event-item {
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  margin-bottom: 8px;
}

.event-item:last-child {
  margin-bottom: 0;
}

.event-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.event-type {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.event-chain {
  font-size: 12px;
  color: #6b7280;
}

.event-value {
  font-size: 16px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 4px;
}

.event-hash {
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
}

.event-time {
  font-size: 12px;
  color: #9ca3af;
}

.event-borrower {
  font-size: 12px;
  color: #ef4444;
  font-family: monospace;
}

.event-item.liquidation .event-value {
  color: #ef4444;
}

.no-data {
  text-align: center;
  color: #9ca3af;
  padding: 20px;
  font-size: 14px;
}
</style>
