<template>
  <div class="cross-chain-timeline">
    <div class="header">
      <h1>🔗 Cross-Chain Transaction Timeline</h1>
      <p class="subtitle">Unified timeline view of wallet activity across multiple chains</p>
    </div>

    <!-- Controls -->
    <div class="controls">
      <input
        v-model="address"
        placeholder="Enter wallet address (0x...)"
        class="input-field"
        @keyup.enter="fetchTimeline"
      />
      <div class="chain-selector">
        <label>Select Chains:</label>
        <div class="checkbox-group">
          <label v-for="chain in availableChains" :key="chain.chainId" class="checkbox-label">
            <input
              type="checkbox"
              :value="chain.chainId"
              v-model="selectedChains"
            />
            {{ chain.chainName }}
          </label>
        </div>
      </div>
      <button class="btn-primary" @click="fetchTimeline" :disabled="loading">
        {{ loading ? 'Loading...' : 'Fetch Timeline' }}
      </button>
      <button class="btn-secondary" @click="fetchSummary" :disabled="loading">
        Summary
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Fetching cross-chain data...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="timelineData" class="timeline-content">
      <!-- Summary Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🔗</div>
          <div class="stat-value">{{ timelineData.statistics.totalTransactions }}</div>
          <div class="stat-label">Total Transactions</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">${{ timelineData.statistics.totalValueUSD }}</div>
          <div class="stat-label">Total Value</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⛽</div>
          <div class="stat-value">${{ timelineData.statistics.totalGasUSD }}</div>
          <div class="stat-label">Total Gas</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ timelineData.chains.length }}</div>
          <div class="stat-label">Active Chains</div>
        </div>
      </div>

      <!-- Chain Activity -->
      <div class="card">
        <h3>⛓️ Activity by Chain</h3>
        <div class="chain-activity">
          <div
            v-for="chain in timelineData.chains"
            :key="chain.chainId"
            class="chain-item"
          >
            <div class="chain-info">
              <span class="chain-name">{{ chain.chainName }}</span>
              <span class="chain-id">ID: {{ chain.chainId }}</span>
            </div>
            <div class="chain-stats">
              <span class="tx-count">{{ chain.transactionCount }} txs</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="card">
        <h3>📅 Transaction Timeline</h3>
        <div class="timeline">
          <div
            v-for="day in timelineData.timeline"
            :key="day.date"
            class="timeline-day"
          >
            <div class="timeline-date">{{ formatDate(day.date) }}</div>
            <div class="timeline-items">
              <div
                v-for="tx in day.transactions.slice(0, 5)"
                :key="tx.hash"
                class="timeline-item"
                :class="{ 'error': tx.isError }"
              >
                <div class="tx-hash">
                  <a :href="getExplorerUrl(tx.hash, tx.chainId)" target="_blank">
                    {{ shortHash(tx.hash) }}
                  </a>
                </div>
                <div class="tx-details">
                  <span class="tx-chain">{{ tx.chainName }}</span>
                  <span class="tx-value">${{ tx.valueUSD }}</span>
                </div>
              </div>
              <div v-if="day.transactions.length > 5" class="more-txs">
                +{{ day.transactions.length - 5 }} more transactions
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="timelineData.pagination.hasMore">
        <button
          class="btn-secondary"
          @click="loadMore"
          :disabled="loading"
        >
          Load More
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>Enter a wallet address to view cross-chain transaction timeline</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const address = ref('');
const selectedChains = ref<string[]>(['1', '137', '42161', '10', '56', '8453', '43114']);
const loading = ref(false);
const error = ref('');
const timelineData = ref<any>(null);
const offset = ref(0);

const availableChains = [
  { chainId: '1', chainName: 'Ethereum' },
  { chainId: '137', chainName: 'Polygon' },
  { chainId: '42161', chainName: 'Arbitrum' },
  { chainId: '10', chainName: 'Optimism' },
  { chainId: '56', chainName: 'BSC' },
  { chainId: '8453', chainName: 'Base' },
  { chainId: '43114', chainName: 'Avalanche' },
];

const API_BASE = 'http://localhost:3000';

const fetchTimeline = async () => {
  if (!address.value) {
    error.value = 'Please enter a wallet address';
    return;
  }

  loading.value = true;
  error.value = '';
  offset.value = 0;

  try {
    const response = await axios.get(`${API_BASE}/cross-chain-timeline`, {
      params: {
        address: address.value,
        chains: selectedChains.value.join(','),
        limit: 50,
        offset: 0,
      },
    });
    timelineData.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch timeline';
  } finally {
    loading.value = false;
  }
};

const fetchSummary = async () => {
  if (!address.value) {
    error.value = 'Please enter a wallet address';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await axios.get(`${API_BASE}/cross-chain-timeline/summary`, {
      params: {
        address: address.value,
        chains: selectedChains.value.join(','),
      },
    });
    timelineData.value = {
      ...response.data,
      timeline: [],
      statistics: {
        totalTransactions: response.data.totalTransactions,
        totalValueUSD: '0',
        totalGasUSD: response.data.totalGasSpentUSD.toString(),
      },
      pagination: { hasMore: false },
    };
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to fetch summary';
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  if (!timelineData.value || !address.value) return;

  loading.value = true;
  offset.value += 50;

  try {
    const response = await axios.get(`${API_BASE}/cross-chain-timeline`, {
      params: {
        address: address.value,
        chains: selectedChains.value.join(','),
        limit: 50,
        offset: offset.value,
      },
    });
    
    // Merge the new data
    if (response.data.timeline) {
      timelineData.value.timeline = [
        ...timelineData.value.timeline,
        ...response.data.timeline,
      ];
    }
    timelineData.value.pagination = response.data.pagination;
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const shortHash = (hash: string) => {
  return hash.slice(0, 10) + '...' + hash.slice(-8);
};

const getExplorerUrl = (hash: string, chainId: string) => {
  const explorers: Record<string, string> = {
    '1': 'https://etherscan.io/tx/',
    '137': 'https://polygonscan.com/tx/',
    '42161': 'https://arbiscan.io/tx/',
    '10': 'https://optimistic.etherscan.io/tx/',
    '56': 'https://bscscan.com/tx/',
    '8453': 'https://basescan.org/tx/',
    '43114': 'https://snowtrace.io/tx/',
  };
  return (explorers[chainId] || explorers['1']) + hash;
};

onMounted(() => {
  // Initialize with empty state
});
</script>

<style scoped>
.cross-chain-timeline {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.input-field {
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 300px;
}

.chain-selector {
  flex: 1;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
}

.btn-primary {
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #111;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.card h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.chain-activity {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.chain-info {
  display: flex;
  flex-direction: column;
}

.chain-name {
  font-weight: 500;
}

.chain-id {
  font-size: 12px;
  color: #666;
}

.tx-count {
  font-weight: 500;
  color: #4f46e5;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-day {
  display: flex;
  gap: 16px;
}

.timeline-date {
  min-width: 100px;
  font-weight: 500;
  color: #666;
}

.timeline-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 13px;
}

.timeline-item.error {
  background: #fef2f2;
}

.tx-hash a {
  color: #4f46e5;
  text-decoration: none;
}

.tx-hash a:hover {
  text-decoration: underline;
}

.tx-details {
  display: flex;
  gap: 12px;
  color: #666;
}

.tx-chain {
  padding: 2px 8px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
}

.tx-value {
  font-weight: 500;
}

.more-txs {
  font-size: 13px;
  color: #666;
  padding: 8px;
  text-align: center;
  background: #f3f4f6;
  border-radius: 6px;
}

.pagination {
  text-align: center;
  margin-top: 20px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #666;
  background: #f9fafb;
  border-radius: 12px;
}
</style>
