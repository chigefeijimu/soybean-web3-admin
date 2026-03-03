<template>
  <div class="cross-chain-analytics">
    <div class="header">
      <h1>🔗 Cross-chain Analytics Dashboard</h1>
      <div class="time-range-selector">
        <el-radio-group v-model="timeRange" size="small" @change="fetchData">
          <el-radio-button label="24h">24H</el-radio-button>
          <el-radio-button label="7d">7D</el-radio-button>
          <el-radio-button label="30d">30D</el-radio-button>
          <el-radio-button label="90d">90D</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- Summary Cards -->
    <el-row :gutter="20" class="summary-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="card-icon">💰</div>
          <div class="card-content">
            <div class="card-label">Total TVL</div>
            <div class="card-value">${{ formatNumber(overview.totalTvl) }}</div>
            <div class="card-change" :class="overview.totalTvlChange24h >= 0 ? 'positive' : 'negative'">
              {{ overview.totalTvlChange24h >= 0 ? '↑' : '↓' }} {{ Math.abs(overview.totalTvlChange24h).toFixed(2) }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="card-icon">📊</div>
          <div class="card-content">
            <div class="card-label">24h Volume</div>
            <div class="card-value">${{ formatNumber(overview.totalVolume24h) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="card-icon">⚡</div>
          <div class="card-content">
            <div class="card-label">Transactions</div>
            <div class="card-value">{{ formatNumber(overview.totalTransactions24h) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="card-icon">👥</div>
          <div class="card-content">
            <div class="card-label">Active Addresses</div>
            <div class="card-value">{{ formatNumber(overview.totalActiveAddresses24h) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Chain Health Status -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>🌐 Network Status</span>
          <el-tag :type="chainHealth.summary.healthy === chainHealth.summary.total ? 'success' : 'warning'">
            {{ chainHealth.summary.healthy }}/{{ chainHealth.summary.total }} Healthy
          </el-tag>
        </div>
      </template>
      <div class="chain-health-grid">
        <div 
          v-for="chain in chainHealth.chains" 
          :key="chain.chainId"
          class="chain-health-item"
          :style="{ borderLeftColor: chain.color }"
        >
          <div class="chain-name">{{ chain.name }}</div>
          <div class="chain-status">
            <el-tag :type="chain.status === 'healthy' ? 'success' : chain.status === 'degraded' ? 'warning' : 'danger'" size="small">
              {{ chain.status }}
            </el-tag>
          </div>
          <div class="chain-stats">
            <span>{{ chain.tps }} TPS</span>
            <span>{{ chain.blockTime }}s block</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- TVL Comparison Chart -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <span>📈 TVL Comparison</span>
            </div>
          </template>
          <div class="chart-container">
            <div class="bar-chart">
              <div 
                v-for="chain in tvlComparison" 
                :key="chain.chainId"
                class="bar-item"
              >
                <div class="bar-label">
                  <span class="chain-dot" :style="{ backgroundColor: chain.color }"></span>
                  {{ chain.name }}
                </div>
                <div class="bar-wrapper">
                  <div 
                    class="bar" 
                    :style="{ 
                      width: `${(chain.tvl / maxTvl) * 100}%`,
                      backgroundColor: chain.color 
                    }"
                  ></div>
                </div>
                <div class="bar-value">${{ formatNumber(chain.tvl) }}</div>
                <div class="bar-change" :class="chain.tvlChange24h >= 0 ? 'positive' : 'negative'">
                  {{ chain.tvlChange24h >= 0 ? '+' : '' }}{{ chain.tvlChange24h.toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Gas Prices -->
      <el-col :span="12">
        <el-card shadow="hover" class="section-card">
          <template #header>
            <div class="card-header">
              <span>⛽ Gas Prices</span>
              <el-tag type="info">Best: {{ gasPrices.cheapest?.name }}</el-tag>
            </div>
          </template>
          <div class="gas-list">
            <div 
              v-for="gas in gasPrices.prices" 
              :key="gas.chainId"
              class="gas-item"
            >
              <div class="gas-chain">
                <span class="chain-dot" :style="{ backgroundColor: gas.color }"></span>
                {{ gas.name }}
              </div>
              <div class="gas-prices">
                <span class="gas-slow">Slow: {{ gas.slow.toFixed(4) }}</span>
                <span class="gas-normal">Normal: {{ gas.normal.toFixed(4) }}</span>
                <span class="gas-fast">Fast: {{ gas.fast.toFixed(4) }}</span>
              </div>
              <div class="gas-usd">${{ gas.gasPriceUSD.toFixed(4) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Chain Details Table -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>📊 Chain Analytics Details</span>
          <el-select v-model="rankingMetric" size="small" style="width: 150px" @change="fetchRanking">
            <el-option label="By TVL" value="tvl" />
            <el-option label="By Volume" value="volume" />
            <el-option label="By Transactions" value="transactions" />
            <el-option label="By Addresses" value="addresses" />
            <el-option label="By TPS" value="tps" />
            <el-option label="By Gas Price" value="gas" />
          </el-select>
        </div>
      </template>
      <el-table :data="chainRanking" style="width: 100%" stripe>
        <el-table-column prop="rank" label="#" width="60" />
        <el-table-column label="Chain" width="150">
          <template #default="{ row }">
            <div class="chain-cell">
              <span class="chain-dot" :style="{ backgroundColor: row.color }"></span>
              {{ row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="tvl" label="TVL" width="150">
          <template #default="{ row }">
            ${{ formatNumber(row.tvl) }}
          </template>
        </el-table-column>
        <el-table-column prop="volume24h" label="Volume (24h)" width="150">
          <template #default="{ row }">
            ${{ formatNumber(row.volume24h) }}
          </template>
        </el-table-column>
        <el-table-column prop="transactions24h" label="Transactions" width="130">
          <template #default="{ row }">
            {{ formatNumber(row.transactions24h) }}
          </template>
        </el-table-column>
        <el-table-column prop="activeAddresses24h" label="Active Addresses" width="140">
          <template #default="{ row }">
            {{ formatNumber(row.activeAddresses24h) }}
          </template>
        </el-table-column>
        <el-table-column prop="tps" label="TPS" width="80" />
        <el-table-column label="Gas Price" width="120">
          <template #default="{ row }">
            {{ row.gasPrice.toFixed(3) }} gwei
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Trends Section -->
    <el-card shadow="hover" class="section-card">
      <template #header>
        <div class="card-header">
          <span>📉 Chain Trends</span>
        </div>
      </template>
      <div class="trends-grid">
        <div 
          v-for="trend in trends.trends" 
          :key="trend.chainId"
          class="trend-card"
          :style="{ borderLeftColor: trend.color }"
        >
          <div class="trend-header">
            <span class="chain-dot" :style="{ backgroundColor: trend.color }"></span>
            <span class="trend-name">{{ trend.name }}</span>
            <el-tag :type="trend.trend === 'bullish' ? 'success' : 'danger'" size="small">
              {{ trend.trend }}
            </el-tag>
          </div>
          <div class="trend-stats">
            <div class="trend-stat">
              <span class="stat-label">7d Change</span>
              <span class="stat-value" :class="trend.change7d >= 0 ? 'positive' : 'negative'">
                {{ trend.change7d >= 0 ? '+' : '' }}{{ trend.change7d.toFixed(2) }}%
              </span>
            </div>
            <div class="trend-stat">
              <span class="stat-label">30d Change</span>
              <span class="stat-value" :class="trend.change30d >= 0 ? 'positive' : 'negative'">
                {{ trend.change30d >= 0 ? '+' : '' }}{{ trend.change30d.toFixed(2) }}%
              </span>
            </div>
            <div class="trend-stat">
              <span class="stat-label">Volatility</span>
              <span class="stat-value">{{ trend.volatility.toFixed(2) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';

const timeRange = ref('7d');
const rankingMetric = ref('tvl');
const loading = ref(false);

const overview = ref({
  totalTvl: 0,
  totalTvlChange24h: 0,
  totalVolume24h: 0,
  totalTransactions24h: 0,
  totalActiveAddresses24h: 0,
  chainCount: 0,
  chains: [],
});

const chainHealth = ref({
  chains: [],
  summary: { healthy: 0, degraded: 0, down: 0, total: 0 },
});

const tvlComparison = ref([]);
const gasPrices = ref({ prices: [], cheapest: null });
const chainRanking = ref([]);
const trends = ref({ trends: [] });

const maxTvl = computed(() => {
  if (!tvlComparison.value.length) return 1;
  return Math.max(...tvlComparison.value.map(c => c.tvl));
});

const formatNumber = (num: number): string => {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const fetchOverview = async () => {
  try {
    const response = await fetch(`/api/cross-chain-analytics/overview?range=${timeRange.value}`);
    const data = await response.json();
    overview.value = data;
  } catch (error) {
    console.error('Failed to fetch overview:', error);
  }
};

const fetchChainHealth = async () => {
  try {
    const response = await fetch('/api/cross-chain-analytics/chain-health');
    const data = await response.json();
    chainHealth.value = data;
  } catch (error) {
    console.error('Failed to fetch chain health:', error);
  }
};

const fetchTvlComparison = async () => {
  try {
    const response = await fetch(`/api/cross-chain-analytics/tvl-comparison?range=${timeRange.value}`);
    const data = await response.json();
    tvlComparison.value = data;
  } catch (error) {
    console.error('Failed to fetch TVL comparison:', error);
  }
};

const fetchGasPrices = async () => {
  try {
    const response = await fetch('/api/cross-chain-analytics/gas-prices');
    const data = await response.json();
    gasPrices.value = data;
  } catch (error) {
    console.error('Failed to fetch gas prices:', error);
  }
};

const fetchRanking = async () => {
  try {
    const response = await fetch(`/api/cross-chain-analytics/ranking?metric=${rankingMetric.value}`);
    const data = await response.json();
    chainRanking.value = data;
  } catch (error) {
    console.error('Failed to fetch ranking:', error);
  }
};

const fetchTrends = async () => {
  try {
    const response = await fetch(`/api/cross-chain-analytics/trends?range=${timeRange.value}`);
    const data = await response.json();
    trends.value = data;
  } catch (error) {
    console.error('Failed to fetch trends:', error);
  }
};

const fetchData = async () => {
  loading.value = true;
  await Promise.all([
    fetchOverview(),
    fetchTvlComparison(),
    fetchTrends(),
  ]);
  loading.value = false;
};

onMounted(async () => {
  await Promise.all([
    fetchOverview(),
    fetchChainHealth(),
    fetchTvlComparison(),
    fetchGasPrices(),
    fetchRanking(),
    fetchTrends(),
  ]);
});
</script>

<style scoped>
.cross-chain-analytics {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.summary-cards {
  margin-bottom: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  font-size: 32px;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.card-value {
  font-size: 20px;
  font-weight: 600;
}

.card-change {
  font-size: 12px;
  margin-top: 4px;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chain-health-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.chain-health-item {
  padding: 12px;
  border-left: 3px solid;
  background: #f5f7fa;
  border-radius: 4px;
}

.chain-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.chain-stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: grid;
  grid-template-columns: 120px 1fr 100px 60px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.chain-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.bar-wrapper {
  height: 20px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-value {
  font-size: 13px;
  font-weight: 500;
  text-align: right;
}

.bar-change {
  font-size: 12px;
  text-align: right;
}

.gas-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gas-item {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.gas-chain {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gas-prices {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #606266;
}

.gas-usd {
  font-weight: 500;
  text-align: right;
}

.chain-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trends-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.trend-card {
  padding: 16px;
  border-left: 3px solid;
  background: #f5f7fa;
  border-radius: 4px;
}

.trend-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.trend-name {
  font-weight: 600;
  flex: 1;
}

.trend-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trend-stat {
  display: flex;
  justify-content: space-between;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 13px;
  font-weight: 500;
}
</style>
