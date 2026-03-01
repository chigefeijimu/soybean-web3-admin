<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const API_BASE = '/api/web3/token-vesting';

const loading = ref(false);
const error = ref('');
const searchAddress = ref('');
const selectedChain = ref(1);

const vestingData = ref<any>(null);
const popularContracts = ref<any[]>([]);
const upcomingUnlocks = ref<any[]>([]);
const vestingStats = ref<any>(null);

const chains = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 56, name: 'BNB Chain', symbol: 'BNB' },
  { id: 137, name: 'Polygon', symbol: 'MATIC' },
  { id: 42161, name: 'Arbitrum', symbol: 'ARB' },
  { id: 10, name: 'Optimism', symbol: 'OP' },
  { id: 8453, name: 'Base', symbol: 'BASE' },
];

const vestingTypeColors: Record<string, string> = {
  team: '#3b82f6',
  investor: '#8b5cf6',
  advisor: '#06b6d4',
  community: '#10b981',
  ecosystem: '#f59e0b',
  other: '#6b7280',
};

const formatAmount = (amount: string, decimals: number = 18) => {
  if (!amount) return '0';
  const value = BigInt(amount);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;
  
  if (fraction === BigInt(0)) {
    return Number(whole).toLocaleString();
  }
  
  return `${Number(whole).toLocaleString()}.${fraction.toString().padStart(decimals, '0').slice(0, 4)}`;
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTimeUntil = (timestamp: number) => {
  const now = Date.now() / 1000;
  const diff = timestamp - now;
  
  if (diff < 0) return 'Unlocked';
  
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const calculateProgress = (schedule: any) => {
  const now = Date.now() / 1000;
  const start = schedule.startTime;
  const end = start + schedule.duration;
  const cliffEnd = start + schedule.cliffDuration;
  
  if (now < cliffEnd) return 0;
  if (now >= end) return 100;
  
  const elapsed = now - start;
  const total = schedule.duration;
  return Math.round((elapsed / total) * 100);
};

const searchAddressHandler = async () => {
  if (!searchAddress.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`${API_BASE}/address/${searchAddress.value}?chainId=${selectedChain.value}`);
    if (!response.ok) throw new Error('Failed to fetch vesting data');
    vestingData.value = await response.json();
  } catch (e: any) {
    error.value = e.message;
    vestingData.value = null;
  } finally {
    loading.value = false;
  }
};

const loadPopularContracts = async () => {
  try {
    const response = await fetch(`${API_BASE}/popular?chainId=${selectedChain.value}&limit=10`);
    if (response.ok) {
      popularContracts.value = await response.json();
    }
  } catch (e) {
    console.error('Failed to load popular contracts', e);
  }
};

const loadUpcomingUnlocks = async () => {
  try {
    const response = await fetch(`${API_BASE}/upcoming?chainId=${selectedChain.value}&days=30`);
    if (response.ok) {
      upcomingUnlocks.value = await response.json();
    }
  } catch (e) {
    console.error('Failed to load upcoming unlocks', e);
  }
};

const loadStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/stats?chainId=${selectedChain.value}`);
    if (response.ok) {
      vestingStats.value = await response.json();
    }
  } catch (e) {
    console.error('Failed to load stats', e);
  }
};

const loadAll = async () => {
  await Promise.all([loadPopularContracts(), loadUpcomingUnlocks(), loadStats()]);
};

const selectContract = (address: string) => {
  searchAddress.value = address;
  searchAddressHandler();
};

onMounted(() => {
  loadAll();
});
</script>

<template>
  <div class="token-vesting">
    <div class="header">
      <h2>🔐 Token Vesting Schedule</h2>
      <p class="subtitle">Track team, investor, and advisor token vesting schedules</p>
    </div>

    <!-- Chain Selector -->
    <div class="chain-selector">
      <select v-model="selectedChain" @change="loadAll">
        <option v-for="chain in chains" :key="chain.id" :value="chain.id">
          {{ chain.name }} ({{ chain.symbol }})
        </option>
      </select>
    </div>

    <!-- Stats Cards -->
    <div v-if="vestingStats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Vesting Contracts</div>
        <div class="stat-value">{{ vestingStats.totalVestingContracts }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Value Locked</div>
        <div class="stat-value">{{ formatAmount(vestingStats.totalValueLocked) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Popular Tokens</div>
        <div class="stat-value">
          <span v-for="(token, i) in vestingStats.popularTokens?.slice(0, 3)" :key="token.symbol">
            {{ token.symbol }}{{ i < 2 ? ', ' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="search-section">
      <div class="search-box">
        <input
          v-model="searchAddress"
          type="text"
          placeholder="Enter wallet address (e.g., 0x...)"
          @keyup.enter="searchAddressHandler"
        />
        <button @click="searchAddressHandler" :disabled="loading">
          {{ loading ? 'Loading...' : 'Search' }}
        </button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- Vesting Data -->
    <div v-if="vestingData" class="vesting-result">
      <div v-if="vestingData.schedules?.length > 0" class="vesting-details">
        <!-- Summary -->
        <div class="summary-cards">
          <div class="summary-card">
            <span class="label">Total Vesting</span>
            <span class="value">{{ formatAmount(vestingData.totalVesting) }}</span>
          </div>
          <div class="summary-card released">
            <span class="label">Released</span>
            <span class="value">{{ formatAmount(vestingData.totalReleased) }}</span>
          </div>
          <div class="summary-card pending">
            <span class="label">Pending</span>
            <span class="value">{{ formatAmount(vestingData.totalPending) }}</span>
          </div>
          <div v-if="vestingData.nextUnlockTime" class="summary-card next">
            <span class="label">Next Unlock</span>
            <span class="value">{{ formatDate(vestingData.nextUnlockTime) }}</span>
            <span class="sub">{{ formatAmount(vestingData.nextUnlockAmount) }} tokens</span>
          </div>
        </div>

        <!-- Schedules -->
        <div class="schedules">
          <h3>Vesting Schedules</h3>
          <div v-for="schedule in vestingData.schedules" :key="schedule.id" class="schedule-card">
            <div class="schedule-header">
              <div class="token-info">
                <span class="token-symbol">{{ schedule.tokenSymbol }}</span>
                <span class="token-name">{{ schedule.tokenName }}</span>
                <span 
                  class="vesting-type" 
                  :style="{ backgroundColor: vestingTypeColors[schedule.vestingType] }"
                >
                  {{ schedule.vestingType }}
                </span>
              </div>
              <div class="revocable" :class="{ revoked: schedule.revoked }">
                {{ schedule.revocable ? (schedule.revoked ? 'Revoked' : 'Revocable') : 'Irrevocable' }}
              </div>
            </div>

            <div class="progress-bar">
              <div class="progress" :style="{ width: calculateProgress(schedule) + '%' }"></div>
            </div>
            <div class="progress-text">{{ calculateProgress(schedule) }}% vested</div>

            <div class="schedule-details">
              <div class="detail">
                <span class="label">Total Amount</span>
                <span class="value">{{ formatAmount(schedule.totalAmount) }} {{ schedule.tokenSymbol }}</span>
              </div>
              <div class="detail">
                <span class="label">Released</span>
                <span class="value">{{ formatAmount(schedule.releasedAmount) }} {{ schedule.tokenSymbol }}</span>
              </div>
              <div class="detail">
                <span class="label">Pending</span>
                <span class="value">{{ formatAmount(schedule.pendingAmount) }} {{ schedule.tokenSymbol }}</span>
              </div>
              <div class="detail">
                <span class="label">Start Date</span>
                <span class="value">{{ formatDate(schedule.startTime) }}</span>
              </div>
              <div class="detail">
                <span class="label">Cliff</span>
                <span class="value">{{ Math.floor(schedule.cliffDuration / 86400) }} days</span>
              </div>
              <div class="detail">
                <span class="label">Duration</span>
                <span class="value">{{ Math.floor(schedule.duration / 86400) }} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        <p>No vesting schedules found for this address</p>
      </div>
    </div>

    <!-- Popular Contracts -->
    <div v-if="popularContracts.length > 0" class="section">
      <h3>📋 Popular Vesting Contracts</h3>
      <div class="contracts-list">
        <div 
          v-for="contract in popularContracts" 
          :key="contract.id" 
          class="contract-item"
          @click="selectContract(contract.beneficiary)"
        >
          <div class="contract-info">
            <span class="symbol">{{ contract.tokenSymbol }}</span>
            <span class="type" :style="{ color: vestingTypeColors[contract.vestingType] }">
              {{ contract.vestingType }}
            </span>
          </div>
          <div class="contract-amount">
            {{ formatAmount(contract.totalAmount) }} {{ contract.tokenSymbol }}
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Unlocks -->
    <div v-if="upcomingUnlocks.length > 0" class="section">
      <h3>⏰ Upcoming Unlocks (30 days)</h3>
      <div class="unlocks-list">
        <div v-for="unlock in upcomingUnlocks.slice(0, 10)" :key="unlock.id" class="unlock-item">
          <div class="unlock-token">
            <span class="symbol">{{ unlock.tokenSymbol }}</span>
            <span class="type" :style="{ color: vestingTypeColors[unlock.vestingType] }">
              {{ unlock.vestingType }}
            </span>
          </div>
          <div class="unlock-amount">
            {{ formatAmount(unlock.pendingAmount) }} {{ unlock.tokenSymbol }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.token-vesting {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.subtitle {
  margin: 5px 0 0;
  color: #6b7280;
}

.chain-selector {
  margin-bottom: 20px;
}

.chain-selector select {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-top: 8px;
}

.search-section {
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  gap: 12px;
}

.search-box input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.search-box button {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.search-box button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.error {
  color: #ef4444;
  margin-top: 8px;
}

.vesting-result {
  margin-bottom: 32px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.summary-card .label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
}

.summary-card .value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  margin-top: 4px;
}

.summary-card .sub {
  display: block;
  font-size: 12px;
  color: #6b7280;
}

.summary-card.released {
  background: #d1fae5;
}

.summary-card.released .value {
  color: #065f46;
}

.summary-card.pending {
  background: #fef3c7;
}

.summary-card.pending .value {
  color: #92400e;
}

.summary-card.next {
  background: #e0e7ff;
}

.summary-card.next .value {
  color: #3730a3;
}

.schedules h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #1f2937;
}

.schedule-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-symbol {
  font-weight: bold;
  font-size: 18px;
  color: #1f2937;
}

.token-name {
  color: #6b7280;
}

.vesting-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  text-transform: capitalize;
}

.revocable {
  font-size: 12px;
  color: #10b981;
}

.revocable.revoked {
  color: #ef4444;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  text-align: right;
}

.schedule-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.detail {
  display: flex;
  flex-direction: column;
}

.detail .label {
  font-size: 12px;
  color: #6b7280;
}

.detail .value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.section {
  margin-bottom: 32px;
}

.section h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #1f2937;
}

.contracts-list, .unlocks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contract-item, .unlock-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.contract-item:hover, .unlock-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.contract-info, .unlock-token {
  display: flex;
  align-items: center;
  gap: 8px;
}

.symbol {
  font-weight: bold;
  color: #1f2937;
}

.type {
  font-size: 12px;
  text-transform: capitalize;
}

.contract-amount, .unlock-amount {
  color: #6b7280;
  font-size: 14px;
}
</style>
