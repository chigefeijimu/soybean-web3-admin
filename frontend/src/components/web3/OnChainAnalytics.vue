<template>
  <div class="analytics-dashboard">
    <div class="header">
      <h2>📊 On-chain Analytics Dashboard</h2>
      <div class="chain-selector">
        <n-select v-model:value="selectedChain" :options="chainOptions" style="width: 200px" @update:value="loadAllData" />
        <n-button type="primary" @click="loadAllData" :loading="loading">
          Refresh
        </n-button>
      </div>
    </div>

    <!-- Network Stats Cards -->
    <n-grid :cols="24" :x-gap="16" :y-gap="16" class="stats-row">
      <n-gi :span="24" :md="6">
        <n-card class="stat-card gas-card">
          <div class="stat-icon">⛽</div>
          <div class="stat-content">
            <div class="stat-label">Gas Price</div>
            <div class="stat-value">{{ networkStats?.gasPriceGwei || '--' }} Gwei</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi :span="24" :md="6">
        <n-card class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-label">Block Number</div>
            <div class="stat-value">{{ formatNumber(networkStats?.blockNumber) }}</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi :span="24" :md="6">
        <n-card class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">Active Addresses</div>
            <div class="stat-value">{{ formatNumber(networkStats?.activeAddresses) }}</div>
          </div>
        </n-card>
      </n-gi>
      <n-gi :span="24" :md="6">
        <n-card class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <div class="stat-label">TPS</div>
            <div class="stat-value">{{ networkStats?.tps?.toFixed(1) || '--' }}</div>
          </div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Charts Row -->
    <n-grid :cols="24" :x-gap="16" :y-gap="16" class="charts-row">
      <n-gi :span="24" :lg="16">
        <n-card title="📈 Gas Price History (24h)" class="chart-card">
          <div ref="gasChartRef" class="chart-container"></div>
        </n-card>
      </n-gi>
      <n-gi :span="24" :lg="8">
        <n-card title="🔲 Latest Block" class="block-card">
          <n-descriptions :column="1" size="small" label-placement="left">
            <n-descriptions-item label="Block">{{ blockStats?.blockNumber }}</n-descriptions-item>
            <n-descriptions-item label="Gas Used">{{ formatNumber(blockStats?.gasUsed) }}</n-descriptions-item>
            <n-descriptions-item label="Gas Limit">{{ formatNumber(blockStats?.gasLimit) }}</n-descriptions-item>
            <n-descriptions-item label="Utilization">{{ blockStats?.gasUtilization?.toFixed(1) }}%</n-descriptions-item>
            <n-descriptions-item label="Transactions">{{ blockStats?.transactions }}</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Large Transactions & Popular Tokens -->
    <n-grid :cols="24" :x-gap="16" :y-gap="16">
      <n-gi :span="24" :lg="12">
        <n-card title="🐋 Large Transactions" class="transactions-card">
          <template #header-extra>
            <n-input-number
              v-model:value="minValue"
              :min="1000"
              :step="1000"
              placeholder="Min USD"
              style="width: 120px"
              @update:value="loadLargeTransactions"
            />
          </template>
          <n-table :data="largeTransactions" :loading="txLoading" :columns="txColumns" size="small" :pagination="false" />
        </n-card>
      </n-gi>
      <n-gi :span="24" :lg="12">
        <n-card title="🔥 Popular Tokens" class="tokens-card">
          <n-table :data="popularTokens" :loading="tokenLoading" :columns="tokenColumns" size="small" :pagination="false" />
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, h } from 'vue';
import { useMessage } from 'naive-ui';

const message = useMessage();

const selectedChain = ref('ethereum');
const loading = ref(false);
const txLoading = ref(false);
const tokenLoading = ref(false);
const minValue = ref(10000);

const networkStats = ref<any>(null);
const blockStats = ref<any>(null);
const gasHistory = ref<any[]>([]);
const largeTransactions = ref<any[]>([]);
const popularTokens = ref<any[]>([]);

const gasChartRef = ref<HTMLElement | null>(null);

const chainOptions = [
  { label: 'Ethereum', value: 'ethereum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'BNB Chain', value: 'bsc' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Optimism', value: 'optimism' },
];

const txColumns = [
  { title: 'Hash', key: 'hash', render: (row: any) => h('a', { onClick: () => openExplorer(row.hash), style: { cursor: 'pointer' } }, shortenAddress(row.hash)) },
  { title: 'Value (USD)', key: 'valueUsd', render: (row: any) => `$${formatNumber(row.valueUsd)}` },
  { title: 'Time', key: 'timestamp', render: (row: any) => formatTime(row.timestamp) },
];

const tokenColumns = [
  { title: 'Token', key: 'symbol' },
  { title: 'Price', key: 'price', render: (row: any) => `$${row.price.toFixed(2)}` },
  { title: '24h %', key: 'priceChange24h', render: (row: any) => h('span', { class: row.priceChange24h >= 0 ? 'positive' : 'negative' }, `${row.priceChange24h >= 0 ? '↑' : '↓'} ${Math.abs(row.priceChange24h).toFixed(2)}%`) },
  { title: 'Volume', key: 'volume24h', render: (row: any) => `$${formatNumber(row.volume24h)}` },
];

const formatNumber = (num: number | undefined) => {
  if (!num) return '--';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const shortenAddress = (addr: string) => {
  return addr.slice(0, 10) + '...' + addr.slice(-8);
};

const formatTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

const openExplorer = (hash: string) => {
  const explorers: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    bsc: 'https://bscscan.com/tx/',
    arbitrum: 'https://arbiscan.io/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
  };
  window.open(explorers[selectedChain.value] + hash, '_blank');
};

const loadNetworkStats = async () => {
  try {
    const res = await fetch(`/api/web3/analytics/network-stats?chain=${selectedChain.value}`);
    networkStats.value = await res.json();
  } catch (error) {
    console.error('Failed to load network stats:', error);
  }
};

const loadBlockStats = async () => {
  try {
    const res = await fetch(`/api/web3/analytics/block-stats?chain=${selectedChain.value}`);
    blockStats.value = await res.json();
  } catch (error) {
    console.error('Failed to load block stats:', error);
  }
};

const loadGasHistory = async () => {
  try {
    const res = await fetch(`/api/web3/analytics/gas-history?chain=${selectedChain.value}&days=1`);
    gasHistory.value = await res.json();
    await nextTick();
    renderGasChart();
  } catch (error) {
    console.error('Failed to load gas history:', error);
  }
};

const loadLargeTransactions = async () => {
  txLoading.value = true;
  try {
    const res = await fetch(
      `/api/web3/analytics/large-transactions?chain=${selectedChain.value}&minValue=${minValue.value}&limit=20`
    );
    largeTransactions.value = await res.json();
  } catch (error) {
    console.error('Failed to load large transactions:', error);
  } finally {
    txLoading.value = false;
  }
};

const loadPopularTokens = async () => {
  tokenLoading.value = true;
  try {
    const res = await fetch(`/api/web3/analytics/popular-tokens?chain=${selectedChain.value}`);
    popularTokens.value = await res.json();
  } catch (error) {
    console.error('Failed to load popular tokens:', error);
  } finally {
    tokenLoading.value = false;
  }
};

const loadAllData = async () => {
  loading.value = true;
  await Promise.all([
    loadNetworkStats(),
    loadBlockStats(),
    loadGasHistory(),
    loadLargeTransactions(),
    loadPopularTokens(),
  ]);
  loading.value = false;
  message.success('Data refreshed!');
};

const renderGasChart = () => {
  if (!gasChartRef.value || !gasHistory.value.length) return;
  
  const container = gasChartRef.value;
  container.innerHTML = '';
  
  const width = container.clientWidth || 600;
  const height = 200;
  const padding = 30;
  
  const data = gasHistory.value.slice(-24);
  const maxGas = Math.max(...data.map((d: any) => d.avgGasPriceGwei));
  const minGas = Math.min(...data.map((d: any) => d.avgGasPriceGwei));
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width.toString());
  svg.setAttribute('height', height.toString());
  svg.style.background = '#fafafa';
  svg.style.borderRadius = '8px';
  
  const points = data.map((d: any, i: number) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.avgGasPriceGwei - minGas) / (maxGas - minGas || 1)) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  path.setAttribute('points', points);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', '#18aafa');
  path.setAttribute('stroke-width', '2');
  svg.appendChild(path);
  
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  area.setAttribute('points', areaPoints);
  area.setAttribute('fill', 'rgba(24, 138, 250, 0.1)');
  svg.insertBefore(area, path);
  
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', (width / 2).toString());
  label.setAttribute('y', '20');
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('fill', '#666');
  label.textContent = `Gas: ${minGas.toFixed(1)} - ${maxGas.toFixed(1)} Gwei`;
  svg.appendChild(label);
  
  container.appendChild(svg);
};

onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
.analytics-dashboard {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
}

.chain-selector {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  height: 100%;
}

.stat-card :deep(.n-card__content) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  color: #888;
  font-size: 12px;
  text-transform: uppercase;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.gas-card {
  border-left: 4px solid #faad14;
}

.charts-row {
  margin-bottom: 16px;
}

.chart-card :deep(.n-card__content) {
  padding: 16px;
}

.chart-container {
  height: 200px;
  width: 100%;
}

.block-card :deep(.n-card__content) {
  padding: 16px;
}

.transactions-card,
.tokens-card {
  margin-top: 16px;
}

.positive {
  color: #18b368;
}

.negative {
  color: #f50;
}
</style>
