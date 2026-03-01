<template>
  <div class="mev-explorer">
    <!-- Stats Cards -->
    <n-grid :cols="4" :x-gap="16" :y-gap="16" class="stats-grid">
      <n-gi>
        <n-card class="stat-card profit">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${{ stats?.totalMevProfit24h || 0 }}</div>
          <div class="stat-label">24h MEV Profit</div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card transactions">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ stats?.totalTransactions24h || 0 }}</div>
          <div class="stat-label">24h Transactions</div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card sandwich">
          <div class="stat-icon">🥪</div>
          <div class="stat-value">{{ stats?.sandwichAttacks24h || 0 }}</div>
          <div class="stat-label">Sandwich Attacks</div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card class="stat-card gas">
          <div class="stat-icon">⛽</div>
          <div class="stat-value">{{ stats?.avgGasPrice || 0 }} Gwei</div>
          <div class="stat-label">Avg Gas Price</div>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Gas Analysis & Top Bots -->
    <n-grid :cols="2" :x-gap="16" :y-gap="16" class="mt-16">
      <n-gi>
        <n-card title="⛽ Gas Analysis">
          <div class="gas-analysis">
            <div class="gas-item">
              <span class="gas-label">Current</span>
              <span class="gas-value">{{ gasAnalysis?.current || 0 }} Gwei</span>
            </div>
            <div class="gas-item">
              <span class="gas-label">1h Average</span>
              <span class="gas-value">{{ gasAnalysis?.avg1h || 0 }} Gwei</span>
            </div>
            <div class="gas-item">
              <span class="gas-label">24h Average</span>
              <span class="gas-value">{{ gasAnalysis?.avg24h || 0 }} Gwei</span>
            </div>
            <div class="gas-recommendation" :class="gasAnalysis?.recommendation">
              <span class="rec-label">Recommendation:</span>
              <n-tag :type="getRecommendationType(gasAnalysis?.recommendation)">
                {{ getRecommendationText(gasAnalysis?.recommendation) }}
              </n-tag>
            </div>
          </div>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="🤖 Top MEV Bots">
          <n-data-table
            :columns="botColumns"
            :data="topBots"
            :bordered="false"
            size="small"
          />
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Filters -->
    <n-card class="mt-16">
      <div class="filters">
        <n-select
          v-model:value="typeFilter"
          placeholder="Filter by type"
          :options="typeOptions"
          clearable
          style="width: 200px"
        />
        <n-input
          v-model:value="addressSearch"
          placeholder="Search bot address..."
          clearable
          style="width: 300px"
        >
          <template #prefix>🔍</template>
        </n-input>
        <n-button @click="loadTransactions" type="primary">Search</n-button>
      </div>
    </n-card>

    <!-- Transactions Table -->
    <n-card class="mt-16" title="📜 Recent MEV Transactions">
      <n-data-table
        :columns="columns"
        :data="filteredTransactions"
        :bordered="false"
        :pagination="{ pageSize: 20 }"
        size="small"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { NCard, NGrid, NGi, NTag, NDataTable, NSelect, NInput, NButton, useMessage } from 'naive-ui';

const message = useMessage();

// State
const stats = ref<any>(null);
const transactions = ref<any[]>([]);
const topBots = ref<any[]>([]);
const gasAnalysis = ref<any>(null);
const typeFilter = ref<string | null>(null);
const addressSearch = ref('');

// Type options
const typeOptions = [
  { label: 'Sandwich Attack', value: 'sandwich' },
  { label: 'Arbitrage', value: 'arbitrage' },
  { label: 'Liquidation', value: 'liquidation' },
  { label: 'Flashloan', value: 'flashloan' }
];

// Bot columns
const botColumns = [
  { title: 'Bot Address', key: 'address' },
  { 
    title: 'Profit (ETH)', 
    key: 'profit',
    render: (row: any) => `${row.profit} ETH`
  },
  { 
    title: 'Tx Count', 
    key: 'txCount' 
  }
];

// Transaction columns
const columns = [
  { 
    title: 'Type', 
    key: 'type',
    render: (row: any) => {
      const types: Record<string, { label: string; type: string }> = {
        sandwich: { label: '🥪 Sandwich', type: 'warning' },
        arbitrage: { label: '⚡ Arbitrage', type: 'success' },
        liquidation: { label: '💥 Liquidation', type: 'error' },
        flashloan: { label: '🔄 Flashloan', type: 'info' }
      };
      const config = types[row.type] || { label: row.type, type: 'default' };
      return h(NTag, { type: config.type as any, size: 'small' }, { default: () => config.label });
    }
  },
  { 
    title: 'Hash', 
    key: 'hash',
    render: (row: any) => h('span', { class: 'hash-cell' }, row.hash.slice(0, 10) + '...' + row.hash.slice(-8))
  },
  { 
    title: 'Block', 
    key: 'blockNumber',
    sorter: (a: any, b: any) => a.blockNumber - b.blockNumber
  },
  { 
    title: 'Token Pair', 
    key: 'tokenIn',
    render: (row: any) => `${row.tokenIn} → ${row.tokenOut}`
  },
  { 
    title: 'Volume', 
    key: 'volume',
    render: (row: any) => `$${row.volume.toLocaleString()}`
  },
  { 
    title: 'Profit', 
    key: 'profitUsd',
    render: (row: any) => h('span', { class: 'profit-cell' }, `$${row.profitUsd.toLocaleString()}`)
  },
  { 
    title: 'Gas', 
    key: 'gasPrice',
    render: (row: any) => `${row.gasPrice} Gwei`
  },
  { 
    title: 'Bot', 
    key: 'botAddress',
    render: (row: any) => row.botAddress
  }
];

// Filtered transactions
const filteredTransactions = computed(() => {
  let result = transactions.value;
  if (typeFilter.value) {
    result = result.filter(t => t.type === typeFilter.value);
  }
  if (addressSearch.value) {
    result = result.filter(t => t.botAddress.toLowerCase().includes(addressSearch.value.toLowerCase()));
  }
  return result;
});

// Helper functions
function getRecommendationType(recommendation: string | undefined) {
  if (recommendation === 'optimal') return 'success';
  if (recommendation === 'high') return 'warning';
  return 'info';
}

function getRecommendationText(recommendation: string | undefined) {
  if (recommendation === 'optimal') return '✅ Optimal Time';
  if (recommendation === 'high') return '⚠️ High Gas - Wait';
  return '💤 Low Gas - Good Time';
}

// Import h for render functions
import { h } from 'vue';

// Load data
async function loadStats() {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
    const [statsRes, gasRes, botsRes] = await Promise.all([
      fetch(`${API_BASE}/web3/mev/stats`).then(r => r.json()),
      fetch(`${API_BASE}/web3/mev/gas-analysis`).then(r => r.json()),
      fetch(`${API_BASE}/web3/mev/top-bots`).then(r => r.json())
    ]);
    stats.value = statsRes.data || statsRes;
    gasAnalysis.value = gasRes.data || gasRes;
    topBots.value = botsRes.data || botsRes;
  } catch (e) {
    console.error('Failed to load MEV stats:', e);
  }
}

async function loadTransactions() {
  try {
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
    const url = typeFilter.value 
      ? `${API_BASE}/web3/mev/by-type?type=${typeFilter.value}`
      : `${API_BASE}/web3/mev/transactions?limit=50`;
    const res = await fetch(url);
    const data = await res.json();
    transactions.value = data.data || data;
  } catch (e) {
    console.error('Failed to load transactions:', e);
    message.error('Failed to load MEV transactions');
  }
}

onMounted(() => {
  loadStats();
  loadTransactions();
});
</script>

<style scoped>
.mev-explorer {
  padding: 16px;
}

.stats-grid .stat-card {
  text-align: center;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.stat-card.profit .stat-value {
  color: #18a058;
}

.stat-card.transactions .stat-value {
  color: #2080f0;
}

.stat-card.sandwich .stat-value {
  color: #f0a020;
}

.stat-card.gas .stat-value {
  color: #d03050;
}

.gas-analysis {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gas-item {
  display: flex;
  justify-content: space-between;
}

.gas-label {
  color: #666;
}

.gas-value {
  font-weight: 600;
}

.gas-recommendation {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.rec-label {
  color: #666;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.hash-cell {
  font-family: monospace;
  font-size: 12px;
}

.profit-cell {
  color: #18a058;
  font-weight: 600;
}

.mt-16 {
  margin-top: 16px;
}
</style>
