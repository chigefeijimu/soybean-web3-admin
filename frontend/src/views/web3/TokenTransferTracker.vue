<template>
  <div class="token-transfer-tracker">
    <!-- Header -->
    <div class="header">
      <h2>🔄 Token Transfer Tracker</h2>
      <p class="subtitle">Track and analyze token transfers across multiple chains</p>
    </div>

    <!-- Filters -->
    <div class="filters">
      <el-input
        v-model="address"
        placeholder="Enter wallet address"
        clearable
        class="address-input"
        @keyup.enter="search"
      >
        <template #prefix>
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </template>
      </el-input>

      <el-select v-model="selectedChain" placeholder="All Chains" clearable class="chain-select">
        <el-option label="All Chains" value="" />
        <el-option v-for="chain in chains" :key="chain" :label="chain" :value="chain" />
      </el-select>

      <el-select v-model="period" placeholder="Period" class="period-select">
        <el-option label="7 Days" value="7d" />
        <el-option label="30 Days" value="30d" />
        <el-option label="90 Days" value="90d" />
        <el-option label="1 Year" value="1y" />
      </el-select>

      <el-button type="primary" @click="search" :loading="loading">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        Search
      </el-button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon transfers">🔄</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats.stats.totalTransfers) }}</div>
          <div class="stat-label">Total Transfers</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon volume">💰</div>
        <div class="stat-content">
          <div class="stat-value">${{ formatNumber(stats.stats.totalVolumeUsd) }}</div>
          <div class="stat-label">Total Volume (USD)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon senders">📤</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats.stats.uniqueSenders) }}</div>
          <div class="stat-label">Unique Senders</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon receivers">📥</div>
        <div class="stat-content">
          <div class="stat-value">{{ formatNumber(stats.stats.uniqueReceivers) }}</div>
          <div class="stat-label">Unique Receivers</div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="charts-row" v-if="historyData">
      <!-- Transfer History Chart -->
      <div class="chart-card">
        <h3>📊 Transfer History</h3>
        <div class="chart-container">
          <div class="simple-chart">
            <div class="chart-bars">
              <div
                v-for="(item, index) in historyData.data.slice(-14)"
                :key="index"
                class="bar"
                :style="{ height: `${(item.transfers / maxTransfers) * 100}%` }"
                :title="`${item.date}: ${item.transfers} transfers`"
              />
            </div>
            <div class="chart-labels">
              <span v-for="(item, index) in historyData.data.slice(-14)" :key="index">
                {{ item.date.slice(5) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Volume History Chart -->
      <div class="chart-card">
        <h3>💵 Volume History</h3>
        <div class="chart-container">
          <div class="simple-chart">
            <div class="chart-bars volume-bars">
              <div
                v-for="(item, index) in historyData.data.slice(-14)"
                :key="index"
                class="bar volume-bar"
                :style="{ height: `${(item.volumeUsd / maxVolume) * 100}%` }"
                :title="`${item.date}: $${formatNumber(item.volumeUsd)}`"
              />
            </div>
            <div class="chart-labels">
              <span v-for="(item, index) in historyData.data.slice(-14)" :key="index">
                {{ item.date.slice(5) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chain Distribution -->
    <div class="chain-distribution" v-if="stats">
      <h3>⛓️ Chain Distribution</h3>
      <div class="chain-bars">
        <div
          v-for="chainStat in stats.chainStats"
          :key="chainStat.chain"
          class="chain-bar-item"
        >
          <div class="chain-name">{{ chainStat.chain }}</div>
          <div class="chain-bar-container">
            <div
              class="chain-bar"
              :style="{ width: `${(chainStat.volumeUsd / maxChainVolume) * 100}%` }"
            />
          </div>
          <div class="chain-value">${{ formatNumber(chainStat.volumeUsd) }}</div>
        </div>
      </div>
    </div>

    <!-- Top Tokens -->
    <div class="top-tokens" v-if="topTokens">
      <h3>🔥 Top Tokens by Volume</h3>
      <el-table :data="topTokens.tokens" style="width: 100%" stripe>
        <el-table-column prop="symbol" label="Token" width="120">
          <template #default="{ row }">
            <div class="token-cell">
              <span class="token-symbol">{{ row.symbol }}</span>
              <span class="token-chain">{{ row.chain }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="transfers" label="Transfers" width="150" sortable>
          <template #default="{ row }">
            {{ formatNumber(row.transfers) }}
          </template>
        </el-table-column>
        <el-table-column prop="volumeUsd" label="Volume (USD)" sortable>
          <template #default="{ row }">
            <span class="volume-usd">${{ formatNumber(row.volumeUsd) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Recent Transfers -->
    <div class="transfers-section" v-if="transfers.length > 0">
      <h3>📜 Recent Transfers</h3>
      <el-table :data="transfers" style="width: 100%" stripe>
        <el-table-column prop="hash" label="Transaction Hash" min-width="180">
          <template #default="{ row }">
            <div class="hash-cell">
              <a :href="getExplorerUrl(row.chain, row.hash)" target="_blank" class="tx-hash">
                {{ formatHash(row.hash) }}
              </a>
              <span class="chain-badge">{{ row.chain }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="from" label="From" min-width="150">
          <template #default="{ row }">
            <span class="address">{{ formatAddress(row.from) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="to" label="To" min-width="150">
          <template #default="{ row }">
            <span class="address">{{ formatAddress(row.to) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tokenSymbol" label="Token" width="100" />
        <el-table-column prop="value" label="Value" width="120">
          <template #default="{ row }">
            {{ formatNumber(parseFloat(row.value)) }} {{ row.tokenSymbol }}
          </template>
        </el-table-column>
        <el-table-column prop="valueUsd" label="USD Value" width="120">
          <template #default="{ row }">
            <span class="usd-value">${{ formatNumber(row.valueUsd) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="Time" width="150">
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination" v-if="total > limit">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="limit"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>Loading transfer data...</p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && transfers.length === 0 && hasSearched" class="empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <p>No transfers found</p>
      <p class="empty-hint">Try searching with a different address or chain</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import {
  fetchTokenTransfers,
  fetchTransferStats,
  fetchTransferHistory,
  fetchTopTokens,
  fetchSupportedChains,
  type Transfer,
  type TransferStats,
  type ChainStats,
  type TokenInfo,
  type HistoryDataPoint
} from '@/service/tokenTransferTracker';

const address = ref('');
const selectedChain = ref('');
const period = ref('30d');
const loading = ref(false);
const hasSearched = ref(false);

// Data
const transfers = ref<Transfer[]>([]);
const stats = ref<{ stats: TransferStats; chainStats: ChainStats[] } | null>(null);
const historyData = ref<{ data: HistoryDataPoint[] } | null>(null);
const topTokens = ref<{ tokens: TokenInfo[] } | null>(null);
const chains = ref<string[]>([]);

// Pagination
const currentPage = ref(1);
const limit = 50;
const total = ref(0);

// Computed
const maxTransfers = computed(() => {
  if (!historyData.value) return 1;
  return Math.max(...historyData.value.data.map(d => d.transfers), 1);
});

const maxVolume = computed(() => {
  if (!historyData.value) return 1;
  return Math.max(...historyData.value.data.map(d => d.volumeUsd), 1);
});

const maxChainVolume = computed(() => {
  if (!stats.value) return 1;
  return Math.max(...stats.value.chainStats.map(c => c.volumeUsd), 1);
});

// Methods
const search = async () => {
  loading.value = true;
  hasSearched.value = true;
  currentPage.value = 1;

  try {
    const [transfersRes, statsRes, historyRes, tokensRes] = await Promise.all([
      fetchTokenTransfers({
        address: address.value || undefined,
        chain: selectedChain.value || undefined,
        period: period.value,
        page: 1,
        limit
      }),
      fetchTransferStats({
        address: address.value || undefined,
        chain: selectedChain.value || undefined,
        period: period.value
      }),
      fetchTransferHistory({
        address: address.value || undefined,
        chain: selectedChain.value || undefined,
        period: period.value
      }),
      fetchTopTokens({
        chain: selectedChain.value || undefined,
        period: period.value,
        limit: 10
      })
    ]);

    transfers.value = transfersRes.transfers;
    total.value = transfersRes.total;
    stats.value = { stats: statsRes.stats, chainStats: statsRes.chainStats };
    historyData.value = historyRes;
    topTokens.value = tokensRes;
  } catch (error) {
    console.error('Failed to fetch transfer data:', error);
    ElMessage.error('Failed to fetch transfer data');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = async (page: number) => {
  loading.value = true;
  try {
    const res = await fetchTokenTransfers({
      address: address.value || undefined,
      chain: selectedChain.value || undefined,
      period: period.value,
      page,
      limit
    });
    transfers.value = res.transfers;
    currentPage.value = page;
  } catch (error) {
    ElMessage.error('Failed to load more transfers');
  } finally {
    loading.value = false;
  }
};

const loadChains = async () => {
  try {
    const res = await fetchSupportedChains();
    chains.value = res.chains;
  } catch (error) {
    console.error('Failed to load chains:', error);
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatHash = (hash: string): string => {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

const formatAddress = (addr: string): string => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const getExplorerUrl = (chain: string, hash: string): string => {
  const explorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
    bsc: 'https://bscscan.com/tx/',
    base: 'https://basescan.org/tx/',
    avalanche: 'https://snowtrace.io/tx/'
  };
  return (explorers[chain] || '') + hash;
};

// Lifecycle
onMounted(async () => {
  await loadChains();
  await search();
});
</script>

<style scoped>
.token-transfer-tracker {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.subtitle {
  color: #909399;
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.address-input {
  width: 400px;
}

.chain-select,
.period-select {
  width: 150px;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.icon {
  width: 16px;
  height: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.chart-container {
  height: 200px;
}

.simple-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding-bottom: 8px;
}

.bar {
  flex: 1;
  background: linear-gradient(180deg, #409eff 0%, #66b1ff 100%);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
}

.volume-bar {
  background: linear-gradient(180deg, #67c23a 0%, #85ce61 100%);
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #909399;
  overflow: hidden;
}

.chart-labels span {
  flex: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chain-distribution,
.top-tokens,
.transfers-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chain-distribution h3,
.top-tokens h3,
.transfers-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.chain-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chain-bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chain-name {
  width: 100px;
  font-size: 14px;
  color: #606266;
}

.chain-bar-container {
  flex: 1;
  height: 24px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.chain-bar {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.chain-value {
  width: 100px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.token-cell {
  display: flex;
  flex-direction: column;
}

.token-symbol {
  font-weight: 500;
}

.token-chain {
  font-size: 12px;
  color: #909399;
}

.volume-usd,
.usd-value {
  color: #67c23a;
  font-weight: 500;
}

.hash-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tx-hash {
  color: #409eff;
  text-decoration: none;
  font-family: monospace;
}

.tx-hash:hover {
  text-decoration: underline;
}

.chain-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: #f0f2f5;
  border-radius: 4px;
  color: #606266;
}

.address {
  font-family: monospace;
  color: #606266;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.loading .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-hint {
  font-size: 14px;
  margin-top: 8px;
}
</style>
