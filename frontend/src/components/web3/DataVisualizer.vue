<template>
  <div class="data-viz">
    <!-- Network Status -->
    <n-grid :cols="4" :x-gap="16" :y-gap="16" class="stats-grid">
      <n-gi>
        <n-card class="stat-card network">
          <div class="stat-icon">🌐</div>
          <div class="stat-value">{{ networkStatus?.chainName || 'Ethereum' }}</div>
          <div class="stat-label">Network</div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card block">
          <div class="stat-icon">📦</div>
          <div class="stat-value">#{{ formatNumber(networkStatus?.blockNumber) }}</div>
          <div class="stat-label">Block Number</div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card tps">
          <div class="stat-icon">⚡</div>
          <div class="stat-value">{{ networkStatus?.tps || 0 }}</div>
          <div class="stat-label">TPS</div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card gas" :class="networkStatus?.networkHealth">
          <div class="stat-icon">⛽</div>
          <div class="stat-value">{{ networkStatus?.gasPrice || 0 }} Gwei</div>
          <div class="stat-label">Gas Price - {{ networkStatus?.networkHealth || 'healthy' }}</div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Network Stats -->
    <n-grid :cols="3" :x-gap="16" :y-gap="16" class="mt-16">
      <n-gi>
        <n-card class="stat-card tvl">
          <div class="stat-icon">💎</div>
          <div class="stat-value">${{ formatLargeNumber(networkStats?.totalValueLocked) }}</div>
          <div class="stat-label">Total Value Locked</div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card tx">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ formatLargeNumber(networkStats?.totalTransactions24h) }}</div>
          <div class="stat-label">24h Transactions</div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card addresses">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ formatLargeNumber(networkStats?.uniqueAddresses) }}</div>
          <div class="stat-label">Unique Addresses</div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Multi-chain Overview -->
    <n-card class="mt-16" title="🌐 Multi-Chain Overview">
      <n-data-table
        :columns="chainColumns"
        :data="multiChainData"
        :bordered="false"
        :pagination="false"
        size="small"
      />
    </n-card>

    <!-- Popular Tokens -->
    <n-card class="mt-16" title="🔥 Popular Tokens">
      <n-data-table
        :columns="tokenColumns"
        :data="popularTokens"
        :bordered="false"
        :pagination="{ pageSize: 10 }"
        size="small"
      />
    </n-card>

    <!-- Active Addresses -->
    <n-card class="mt-16" title="🐋 Active Addresses">
      <n-data-table
        :columns="addressColumns"
        :data="activeAddresses"
        :bordered="false"
        :pagination="{ pageSize: 10 }"
        size="small"
      />
    </n-card>

    <!-- Large Transactions -->
    <n-card class="mt-16" title="💰 Large Transactions (>$10K)">
      <div class="filters">
        <n-select
          v-model:value="tokenFilter"
          placeholder="Filter by token"
          :options="tokenOptions"
          clearable
          style="width: 150px"
        />
        <n-input-number
          v-model:value="minValue"
          placeholder="Min Value (USD)"
          clearable
          style="width: 180px"
        />
        <n-button @click="loadLargeTransactions" type="primary">Apply</n-button>
      </div>
      <n-data-table
        :columns="txColumns"
        :data="largeTransactions"
        :bordered="false"
        :pagination="{ pageSize: 15 }"
        size="small"
        class="mt-8"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NCard, NGrid, NGi, NTag, NDataTable, NSelect, NInputNumber, NButton } from 'naive-ui';

// State
const networkStatus = ref<any>(null);
const networkStats = ref<any>(null);
const multiChainData = ref<any[]>([]);
const popularTokens = ref<any[]>([]);
const activeAddresses = ref<any[]>([]);
const largeTransactions = ref<any[]>([]);

const tokenFilter = ref<string | null>(null);
const minValue = ref<number>(10000);

// Token options for filter
const tokenOptions = [
  { label: 'ETH', value: 'ETH' },
  { label: 'WETH', value: 'WETH' },
  { label: 'WBTC', value: 'WBTC' },
  { label: 'USDC', value: 'USDC' },
  { label: 'USDT', value: 'USDT' },
  { label: 'BNB', value: 'BNB' }
];

// Chain columns
const chainColumns = [
  { 
    title: 'Chain', 
    key: 'name',
    render: (row: any) => {
      const chainIcons: Record<string, string> = {
        'Ethereum': '🔷',
        'Polygon': '🟣',
        'Arbitrum': '🔵',
        'Optimism': '🟠',
        'BSC': '🟡',
        'Base': '⚫'
      };
      return `${chainIcons[row.name] || '🔗'} ${row.name}`;
    }
  },
  { 
    title: 'TVL', 
    key: 'tvl',
    render: (row: any) => `$${formatLargeNumber(row.tvl)}`
  },
  { 
    title: '24h Tx', 
    key: 'tx24h',
    render: (row: any) => formatNumber(row.tx24h)
  },
  { 
    title: 'Gas', 
    key: 'gasPrice',
    render: (row: any) => `${row.gasPrice} Gwei`
  },
  { 
    title: 'Active Addr', 
    key: 'activeAddresses',
    render: (row: any) => formatNumber(row.activeAddresses)
  },
  { 
    title: 'Health', 
    key: 'health',
    render: (row: any) => {
      const type = row.health >= 98 ? 'success' : row.health >= 95 ? 'warning' : 'error';
      return h(NTag, { type, size: 'small' }, { default: () => `${row.health}%` });
    }
  }
];

// Token columns
const tokenColumns = [
  { title: 'Token', key: 'symbol' },
  { title: 'Name', key: 'name' },
  { 
    title: 'Price', 
    key: 'price',
    render: (row: any) => `$${row.price.toLocaleString()}`
  },
  { 
    title: '24h Change', 
    key: 'priceChange24h',
    render: (row: any) => {
      const type = row.priceChange24h >= 0 ? 'success' : 'error';
      return h(NTag, { type, size: 'small' }, { default: () => `${row.priceChange24h >= 0 ? '+' : ''}${row.priceChange24h}%` });
    }
  },
  { 
    title: 'Volume', 
    key: 'volume24h',
    render: (row: any) => `$${formatLargeNumber(row.volume24h)}`
  },
  { 
    title: 'Holders', 
    key: 'holders',
    render: (row: any) => formatNumber(row.holders)
  }
];

// Address columns
const addressColumns = [
  { 
    title: 'Address', 
    key: 'address',
    render: (row: any) => `${row.address.slice(0, 10)}...${row.address.slice(-8)}`
  },
  { title: 'Label', key: 'label' },
  { 
    title: 'Type', 
    key: 'type',
    render: (row: any) => {
      const types: Record<string, { label: string; type: string }> = {
        'exchange': { label: 'Exchange', type: 'info' },
        'whale': { label: 'Whale', type: 'warning' },
        'defi': { label: 'DeFi', type: 'success' },
        'dao': { label: 'DAO', type: 'purple' },
        'contract': { label: 'Contract', type: 'default' }
      };
      const t = types[row.type] || { label: row.type, type: 'default' };
      return h(NTag, { type: t.type as any, size: 'small' }, { default: () => t.label });
    }
  },
  { 
    title: '24h Tx', 
    key: 'txCount24h',
    render: (row: any) => formatNumber(row.txCount24h)
  },
  { 
    title: '24h Volume', 
    key: 'volume24h',
    render: (row: any) => `$${formatLargeNumber(row.volume24h)}`
  }
];

// Transaction columns
const txColumns = [
  { 
    title: 'Hash', 
    key: 'hash',
    render: (row: any) => `${row.hash.slice(0, 14)}...${row.hash.slice(-10)}`
  },
  { 
    title: 'From', 
    key: 'from',
    render: (row: any) => `${row.from.slice(0, 10)}...`
  },
  { 
    title: 'To', 
    key: 'to',
    render: (row: any) => `${row.to.slice(0, 10)}...`
  },
  { 
    title: 'Token', 
    key: 'token'
  },
  { 
    title: 'Value', 
    key: 'value',
    render: (row: any) => row.value.toLocaleString()
  },
  { 
    title: 'Value (USD)', 
    key: 'valueUsd',
    render: (row: any) => `$${row.valueUsd.toLocaleString()}`
  },
  { 
    title: 'Gas', 
    key: 'gasPrice',
    render: (row: any) => `${row.gasPrice} Gwei`
  },
  { 
    title: 'Time', 
    key: 'timestamp',
    render: (row: any) => formatTimeAgo(row.timestamp)
  }
];

// Helper functions
function formatNumber(num: number | undefined): string {
  if (!num) return '0';
  return num.toLocaleString();
}

function formatLargeNumber(num: number | undefined): string {
  if (!num) return '0';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Import h for render functions
import { h } from 'vue';

// API functions
async function loadNetworkStatus() {
  try {
    const response = await fetch('/api/web3/data-viz/network-status?chainId=1');
    networkStatus.value = await response.json();
  } catch (e) {
    console.error('Failed to load network status:', e);
  }
}

async function loadNetworkStats() {
  try {
    const response = await fetch('/api/web3/data-viz/network-stats');
    networkStats.value = await response.json();
  } catch (e) {
    console.error('Failed to load network stats:', e);
  }
}

async function loadMultiChainData() {
  try {
    const response = await fetch('/api/web3/data-viz/multi-chain');
    multiChainData.value = await response.json();
  } catch (e) {
    console.error('Failed to load multi-chain data:', e);
  }
}

async function loadPopularTokens() {
  try {
    const response = await fetch('/api/web3/data-viz/popular-tokens');
    popularTokens.value = await response.json();
  } catch (e) {
    console.error('Failed to load popular tokens:', e);
  }
}

async function loadActiveAddresses() {
  try {
    const response = await fetch('/api/web3/data-viz/active-addresses?limit=15');
    activeAddresses.value = await response.json();
  } catch (e) {
    console.error('Failed to load active addresses:', e);
  }
}

async function loadLargeTransactions() {
  try {
    const response = await fetch(`/api/web3/data-viz/large-transactions?limit=20&minValue=${minValue.value}`);
    largeTransactions.value = await response.json();
  } catch (e) {
    console.error('Failed to load large transactions:', e);
  }
}

onMounted(() => {
  loadNetworkStatus();
  loadNetworkStats();
  loadMultiChainData();
  loadPopularTokens();
  loadActiveAddresses();
  loadLargeTransactions();
});
</script>

<style scoped>
.data-viz {
  padding: 16px;
}

.stats-grid {
  margin-top: 16px;
}

.mt-16 {
  margin-top: 16px;
}

.stat-card {
  text-align: center;
  background: rgba(30, 30, 60, 0.8);
  border: 1px solid rgba(100, 100, 255, 0.2);
}

.stat-card .stat-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.stat-card .stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fff;
}

.stat-card .stat-label {
  font-size: 0.85rem;
  color: #aaa;
  margin-top: 4px;
}

.stat-card.profit { border-left: 4px solid #4caf50; }
.stat-card.transactions { border-left: 4px solid #2196f3; }
.stat-card.sandwich { border-left: 4px solid #ff9800; }
.stat-card.gas { border-left: 4px solid #9c27b0; }
.stat-card.network { border-left: 4px solid #00bcd4; }
.stat-card.block { border-left: 4px solid #607d8b; }
.stat-card.tps { border-left: 4px solid #ffeb3b; }
.stat-card.tvl { border-left: 4px solid #e91e63; }
.stat-card.addresses { border-left: 4px solid #3f51b5; }

.stat-card.healthy { border-left: 4px solid #4caf50; }
.stat-card.degraded { border-left: 4px solid #ff9800; }
.stat-card.congested { border-left: 4px solid #f44336; }

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.mt-8 {
  margin-top: 8px;
}
</style>
