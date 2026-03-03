<template>
  <div class="activity-feed">
    <div class="header">
      <h1>📡 Cross-Chain Activity Feed</h1>
      <p class="subtitle">Unified activity feed aggregating wallet activities across multiple chains</p>
    </div>

    <!-- Controls -->
    <div class="controls">
      <input
        v-model="address"
        placeholder="Enter wallet address (0x...)"
        class="input-field"
        @keyup.enter="fetchFeed"
      />
      <div class="chain-selector">
        <label>Select Chains:</label>
        <div class="checkbox-group">
          <label v-for="chain in availableChains" :key="chain" class="checkbox-label">
            <input
              type="checkbox"
              :value="chain"
              v-model="selectedChains"
            />
            {{ formatChainName(chain) }}
          </label>
        </div>
      </div>
      <div class="type-selector">
        <label>Activity Types:</label>
        <div class="checkbox-group">
          <label v-for="type in activityTypes" :key="type" class="checkbox-label">
            <input
              type="checkbox"
              :value="type"
              v-model="selectedTypes"
            />
            {{ formatTypeName(type) }}
          </label>
        </div>
      </div>
      <div class="button-group">
        <button class="btn-primary" @click="fetchFeed" :disabled="loading">
          {{ loading ? 'Loading...' : 'Fetch Feed' }}
        </button>
        <button class="btn-secondary" @click="fetchStats" :disabled="loading">
          Statistics
        </button>
        <button class="btn-secondary" @click="fetchRecent" :disabled="loading">
          Recent
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Fetching activity data...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <!-- Stats Overview -->
    <div v-else-if="stats" class="stats-section">
      <h2>📊 Activity Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total Activities</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ stats.confirmed }}</div>
          <div class="stat-label">Confirmed</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-value">{{ stats.failed }}</div>
          <div class="stat-label">Failed</div>
        </div>
      </div>

      <div class="stats-details">
        <div class="card">
          <h3>⛓️ By Chain</h3>
          <div class="distribution-list">
            <div v-for="(count, chain) in stats.byChain" :key="chain" class="distribution-item">
              <span class="chain-name">{{ formatChainName(chain) }}</span>
              <div class="progress-bar">
                <div class="progress" :style="{ width: (count / stats.total * 100) + '%' }"></div>
              </div>
              <span class="count">{{ count }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>📋 By Type</h3>
          <div class="distribution-list">
            <div v-for="(count, type) in stats.byType" :key="type" class="distribution-item">
              <span class="type-name">{{ formatTypeName(type) }}</span>
              <div class="progress-bar">
                <div class="progress" :style="{ width: (count / stats.total * 100) + '%' }"></div>
              </div>
              <span class="count">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Feed -->
    <div v-else-if="activities.length > 0" class="feed-section">
      <div class="feed-header">
        <h2>📡 Activity Feed</h2>
        <span class="activity-count">{{ pagination.total }} total activities</span>
      </div>
      
      <div class="activity-list">
        <div v-for="activity in activities" :key="activity.id" class="activity-card" :class="activity.status">
          <div class="activity-header">
            <span class="activity-type" :class="activity.type">
              {{ getTypeEmoji(activity.type) }} {{ formatTypeName(activity.type) }}
            </span>
            <span class="activity-chain">{{ formatChainName(activity.chain) }}</span>
            <span class="activity-status" :class="activity.status">
              {{ activity.status }}
            </span>
          </div>
          <div class="activity-details">
            <div class="detail-row">
              <span class="label">Hash:</span>
              <span class="value hash">{{ truncateHash(activity.hash) }}</span>
            </div>
            <div class="detail-row" v-if="activity.token">
              <span class="label">Token:</span>
              <span class="value">{{ activity.token }}</span>
            </div>
            <div class="detail-row" v-if="activity.amount">
              <span class="label">Amount:</span>
              <span class="value">{{ activity.amount }}</span>
            </div>
            <div class="detail-row" v-if="activity.value">
              <span class="label">Value:</span>
              <span class="value">${{ activity.value.toFixed(2) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time:</span>
              <span class="value">{{ formatTimestamp(activity.timestamp) }}</span>
            </div>
            <div class="detail-row" v-if="activity.gasFee">
              <span class="label">Gas:</span>
              <span class="value">{{ activity.gasFee.toFixed(6) }} ETH</span>
            </div>
          </div>
          <div class="activity-addresses" v-if="activity.from || activity.to">
            <div v-if="activity.from" class="address-row">
              <span class="label">From:</span>
              <span class="value hash">{{ truncateHash(activity.from) }}</span>
            </div>
            <div v-if="activity.to" class="address-row">
              <span class="label">To:</span>
              <span class="value hash">{{ truncateHash(activity.to) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="pagination.hasMore || pagination.offset > 0">
        <button 
          class="btn-secondary" 
          @click="loadMore" 
          :disabled="loading || !pagination.hasMore"
        >
          Load More
        </button>
        <span class="page-info">
          Showing {{ pagination.offset + activities.length }} of {{ pagination.total }}
        </span>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>No activities found. Try a different address or filters.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Activity {
  id: string;
  address: string;
  chain: string;
  type: string;
  hash: string;
  timestamp: number;
  from?: string;
  to?: string;
  token?: string;
  amount?: string;
  value?: number;
  gasUsed?: number;
  gasFee?: number;
  status: string;
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  failed: number;
  byChain: Record<string, number>;
  byType: Record<string, number>;
  byDay: Record<string, number>;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const address = ref('');
const selectedChains = ref<string[]>([]);
const selectedTypes = ref<string[]>([]);
const activities = ref<Activity[]>([]);
const stats = ref<Stats | null>(null);
const loading = ref(false);
const error = ref('');
const pagination = ref<Pagination>({
  total: 0,
  limit: 20,
  offset: 0,
  hasMore: false,
});

const availableChains = [
  'ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc', 'base', 'avalanche'
];

const activityTypes = [
  'transfer', 'swap', 'stake', 'unstake', 'mint', 'burn', 'borrow', 'repay',
  'liquidate', 'bridge', 'approve', 'nft_transfer', 'contract_interaction'
];

const API_BASE = '/api';

const formatChainName = (chain: string): string => {
  const names: Record<string, string> = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    bsc: 'BSC',
    base: 'Base',
    avalanche: 'Avalanche',
    solana: 'Solana',
    zksync: 'zkSync',
    starknet: 'Starknet',
    linea: 'Linea',
    scroll: 'Scroll',
    mantle: 'Mantle',
    fantom: 'Fantom',
    celo: 'Celo'
  };
  return names[chain] || chain;
};

const formatTypeName = (type: string): string => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getTypeEmoji = (type: string): string => {
  const emojis: Record<string, string> = {
    transfer: '💸',
    swap: '🔄',
    stake: '🔒',
    unstake: '🔓',
    mint: '🆕',
    burn: '🔥',
    borrow: '💳',
    repay: '💵',
    liquidate: '⚡',
    bridge: '🌉',
    approve: '✅',
    nft_transfer: '🖼️',
    contract_interaction: '📝'
  };
  return emojis[type] || '📋';
};

const truncateHash = (hash: string): string => {
  if (!hash) return '';
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const fetchFeed = async () => {
  if (!address.value && selectedChains.value.length === 0) {
    error.value = 'Please enter an address or select chains';
    return;
  }

  loading.value = true;
  error.value = '';
  stats.value = null;
  pagination.value = { total: 0, limit: 20, offset: 0, hasMore: false };

  try {
    const params = new URLSearchParams();
    if (address.value) params.append('address', address.value);
    if (selectedChains.value.length > 0) params.append('chains', selectedChains.value.join(','));
    if (selectedTypes.value.length > 0) params.append('types', selectedTypes.value.join(','));

    const response = await fetch(`${API_BASE}/activity-feed/feed?${params}`);
    if (!response.ok) throw new Error('Failed to fetch activity feed');
    
    const data = await response.json();
    activities.value = data.activities;
    pagination.value = data.pagination;
  } catch (e: any) {
    error.value = e.message || 'An error occurred';
  } finally {
    loading.value = false;
  }
};

const fetchStats = async () => {
  loading.value = true;
  error.value = '';
  activities.value = [];

  try {
    const response = await fetch(`${API_BASE}/activity-feed/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    
    stats.value = await response.json();
  } catch (e: any) {
    error.value = e.message || 'An error occurred';
  } finally {
    loading.value = false;
  }
};

const fetchRecent = async () => {
  loading.value = true;
  error.value = '';
  stats.value = null;

  try {
    const response = await fetch(`${API_BASE}/activity-feed/recent?limit=50`);
    if (!response.ok) throw new Error('Failed to fetch recent activities');
    
    const data = await response.json();
    activities.value = data;
    pagination.value = { 
      total: data.length, 
      limit: 50, 
      offset: 0, 
      hasMore: false 
    };
  } catch (e: any) {
    error.value = e.message || 'An error occurred';
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  if (!pagination.value.hasMore) return;

  loading.value = true;
  pagination.value.offset += pagination.value.limit;

  try {
    const params = new URLSearchParams();
    if (address.value) params.append('address', address.value);
    if (selectedChains.value.length > 0) params.append('chains', selectedChains.value.join(','));
    if (selectedTypes.value.length > 0) params.append('types', selectedTypes.value.join(','));
    params.append('offset', pagination.value.offset.toString());

    const response = await fetch(`${API_BASE}/activity-feed/feed?${params}`);
    if (!response.ok) throw new Error('Failed to fetch more activities');
    
    const data = await response.json();
    activities.value = [...activities.value, ...data.activities];
    pagination.value = data.pagination;
  } catch (e: any) {
    error.value = e.message || 'An error occurred';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchRecent();
});
</script>

<style scoped>
.activity-feed {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
}

.controls {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.input-field {
  width: 100%;
  max-width: 500px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 15px;
}

.chain-selector, .type-selector {
  margin-bottom: 15px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  cursor: pointer;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d5db;
}

.btn-primary:disabled, .btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading, .error-message, .empty-state {
  text-align: center;
  padding: 40px;
}

.error-message {
  color: #dc2626;
  background: #fee2e2;
  border-radius: 8px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stats-section, .feed-section {
  margin-top: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}

.stats-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.card h3 {
  margin-bottom: 15px;
  font-size: 16px;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.distribution-item .chain-name, .distribution-item .type-name {
  min-width: 100px;
  font-size: 13px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s;
}

.count {
  min-width: 40px;
  text-align: right;
  font-size: 13px;
  color: #6b7280;
}

.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.activity-count {
  color: #6b7280;
  font-size: 14px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
}

.activity-card.pending {
  border-left: 3px solid #f59e0b;
}

.activity-card.confirmed {
  border-left: 3px solid #10b981;
}

.activity-card.failed {
  border-left: 3px solid #ef4444;
}

.activity-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
}

.activity-type {
  font-weight: 600;
  font-size: 14px;
}

.activity-chain {
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #6b7280;
}

.activity-status {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.activity-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.activity-status.confirmed {
  background: #d1fae5;
  color: #065f46;
}

.activity-status.failed {
  background: #fee2e2;
  color: #991b1b;
}

.activity-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.detail-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.detail-row .label {
  color: #6b7280;
  min-width: 60px;
}

.detail-row .value {
  color: #1f2937;
}

.detail-row .value.hash {
  font-family: monospace;
  font-size: 12px;
}

.activity-addresses {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.address-row {
  display: flex;
  gap: 8px;
  font-size: 12px;
  margin-top: 4px;
}

.address-row .label {
  color: #6b7280;
  min-width: 40px;
}

.address-row .value {
  font-family: monospace;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  justify-content: center;
}

.page-info {
  color: #6b7280;
  font-size: 14px;
}
</style>
