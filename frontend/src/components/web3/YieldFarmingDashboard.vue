<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

interface YieldPool {
  id: string;
  name: string;
  protocol: string;
  chain: string;
  token0: string;
  token1: string;
  apy: number;
  apy24h: number;
  tvl: number;
  tvlChange24h: number;
  volume24h: number;
  rewardToken: string;
  risk: 'low' | 'medium' | 'high';
  lockPeriod: number;
  poolAddress: string;
  url: string;
}

interface Stats {
  totalTvl: number;
  totalPools: number;
  avgApy: string;
  chains: number;
  protocols: number;
  topChain: { name: string; tvl: number };
  topProtocol: { name: string; tvl: number };
  tvlByChain: { name: string; tvl: number }[];
  apyDistribution: { range: string; count: number }[];
}

const pools = ref<YieldPool[]>([]);
const stats = ref<Stats | null>(null);
const loading = ref(false);
const selectedChain = ref('');
const sortBy = ref('apy');
const searchQuery = ref('');

const chains = ['Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Avalanche', 'Base', 'BSC'];
const sortOptions = [
  { value: 'apy', label: 'Highest APY' },
  { value: 'tvl', label: 'Highest TVL' },
  { value: 'volume', label: 'Highest Volume' },
  { value: 'tvlChange', label: 'Best TVL Change' },
];

const filteredPools = computed(() => {
  let result = [...pools.value];
  
  if (selectedChain.value) {
    result = result.filter(p => p.chain === selectedChain.value);
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.protocol.toLowerCase().includes(query) ||
      p.token0.toLowerCase().includes(query) ||
      p.token1.toLowerCase().includes(query)
    );
  }
  
  return result;
});

async function fetchPools() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (selectedChain.value) params.append('chain', selectedChain.value);
    params.append('sortBy', sortBy.value);
    
    const res = await fetch(`/api/web3/yield-farming/pools?${params}`);
    pools.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch pools:', e);
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const res = await fetch('/api/web3/yield-farming/stats');
    stats.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch stats:', e);
  }
}

function formatUSD(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function getRiskColor(risk: string): string {
  switch (risk) {
    case 'low': return 'text-green-500';
    case 'medium': return 'text-yellow-500';
    case 'high': return 'text-red-500';
    default: return 'text-gray-500';
  }
}

function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500';
}

onMounted(() => {
  fetchPools();
  fetchStats();
});
</script>

<template>
  <div class="yield-farming-dashboard">
    <div class="header">
      <h2 class="text-2xl font-bold">🌾 Yield Farming Dashboard</h2>
      <p class="text-gray-400">Discover and track DeFi yield farming opportunities</p>
    </div>

    <!-- Stats Overview -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total TVL</div>
        <div class="stat-value">{{ formatUSD(stats.totalTvl) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Pools</div>
        <div class="stat-value">{{ stats.totalPools }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average APY</div>
        <div class="stat-value">{{ stats.avgApy }}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Chains</div>
        <div class="stat-value">{{ stats.chains }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Top Chain</div>
        <div class="stat-value">{{ stats.topChain?.name || 'N/A' }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Top Protocol</div>
        <div class="stat-value">{{ stats.topProtocol?.name || 'N/A' }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Chain:</label>
        <select v-model="selectedChain" @change="fetchPools">
          <option value="">All Chains</option>
          <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Sort by:</label>
        <select v-model="sortBy" @change="fetchPools">
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <div class="filter-group search">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search pools..."
        />
      </div>
    </div>

    <!-- Pools Table -->
    <div class="pools-table-container">
      <table class="pools-table">
        <thead>
          <tr>
            <th>Pool</th>
            <th>Protocol</th>
            <th>Chain</th>
            <th>APY</th>
            <th>TVL</th>
            <th>24h Change</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pool in filteredPools" :key="pool.id">
            <td>
              <div class="pool-name">
                <span class="token-pair">{{ pool.token0 }}-{{ pool.token1 }}</span>
                <span class="pool-address text-xs text-gray-500">{{ pool.poolAddress.slice(0, 10) }}...</span>
              </div>
            </td>
            <td>{{ pool.protocol }}</td>
            <td>{{ pool.chain }}</td>
            <td>
              <span class="apy-badge">{{ pool.apy.toFixed(2) }}%</span>
            </td>
            <td>{{ formatUSD(pool.tvl) }}</td>
            <td :class="getChangeColor(pool.tvlChange24h)">
              {{ pool.tvlChange24h > 0 ? '+' : '' }}{{ pool.tvlChange24h.toFixed(2) }}%
            </td>
            <td>
              <span :class="['risk-badge', getRiskColor(pool.risk)]">
                {{ pool.risk }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading yield pools...</p>
    </div>

    <!-- APY Distribution Chart -->
    <div v-if="stats" class="apy-distribution">
      <h3 class="text-lg font-semibold mb-4">APY Distribution</h3>
      <div class="distribution-bars">
        <div 
          v-for="item in stats.apyDistribution" 
          :key="item.range"
          class="distribution-bar"
        >
          <div class="bar-label">{{ item.range }}</div>
          <div class="bar-container">
            <div 
              class="bar-fill" 
              :style="{ width: `${(item.count / stats.totalPools) * 100}%` }"
            ></div>
          </div>
          <div class="bar-count">{{ item.count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yield-farming-dashboard {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  color: #fff;
  margin-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #1e293b;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #334155;
}

.stat-label {
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 4px;
}

.stat-value {
  color: #fff;
  font-size: 24px;
  font-weight: bold;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  color: #94a3b8;
  font-size: 14px;
}

.filter-group select,
.filter-group input {
  background: #1e293b;
  border: 1px solid #334155;
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.filter-group.search {
  flex: 1;
  min-width: 200px;
}

.filter-group.search input {
  width: 100%;
}

.pools-table-container {
  overflow-x: auto;
  background: #1e293b;
  border-radius: 12px;
  border: 1px solid #334155;
  margin-bottom: 24px;
}

.pools-table {
  width: 100%;
  border-collapse: collapse;
}

.pools-table th,
.pools-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #334155;
}

.pools-table th {
  background: #0f172a;
  color: #94a3b8;
  font-weight: 600;
  font-size: 14px;
}

.pools-table td {
  color: #e2e8f0;
}

.pool-name {
  display: flex;
  flex-direction: column;
}

.token-pair {
  font-weight: 600;
}

.apy-badge {
  background: #065f46;
  color: #34d399;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #94a3b8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.apy-distribution {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #334155;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 80px;
  color: #94a3b8;
  font-size: 14px;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: #0f172a;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.bar-count {
  width: 40px;
  color: #fff;
  text-align: right;
}
</style>
