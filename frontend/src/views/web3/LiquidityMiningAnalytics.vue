<template>
  <div class="liquidity-mining-analytics">
    <div class="header">
      <h2>⛏️ Cross-chain Liquidity Mining Analytics</h2>
      <div class="actions">
        <select v-model="selectedChain" @change="loadPools" class="filter-select">
          <option value="">All Chains</option>
          <option v-for="chain in chains" :key="chain" :value="chain">{{ chain }}</option>
        </select>
        <select v-model="selectedProtocol" @change="loadPools" class="filter-select">
          <option value="">All Protocols</option>
          <option v-for="protocol in protocols" :key="protocol" :value="protocol">{{ protocol }}</option>
        </select>
        <button @click="loadPools" :disabled="loading" class="btn-primary">
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <span class="stat-label">Total Pools</span>
          <span class="stat-value">{{ stats.totalPools }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💎</div>
        <div class="stat-content">
          <span class="stat-label">Total Value Locked</span>
          <span class="stat-value">${{ formatNumber(stats.totalValueLocked) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <span class="stat-label">Average APY</span>
          <span class="stat-value">{{ stats.averageApy }}%</span>
        </div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-icon">🏆</div>
        <div class="stat-content">
          <span class="stat-label">Top Performer</span>
          <span class="stat-value">{{ stats.topPerformer?.pair }}</span>
          <span class="stat-sub">{{ stats.topPerformer?.apy }}% APY</span>
        </div>
      </div>
    </div>

    <!-- Chain Distribution -->
    <div v-if="stats" class="section">
      <h3>🌐 TVL by Chain</h3>
      <div class="chain-distribution">
        <div v-for="(value, chain) in stats.chainDistribution" :key="chain" class="chain-bar-item">
          <div class="chain-info">
            <span class="chain-name">{{ chain }}</span>
            <span class="chain-value">${{ formatNumber(value) }}</span>
          </div>
          <div class="bar-container">
            <div class="bar-fill" :style="{ width: (value / stats.totalValueLocked * 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Pools -->
    <div class="section">
      <h3>🔥 Top Mining Pools</h3>
      <div class="pools-table">
        <table>
          <thead>
            <tr>
              <th>Pool</th>
              <th>Chain</th>
              <th>Protocol</th>
              <th>TVL</th>
              <th>APY</th>
              <th>24h Volume</th>
              <th>Risk</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pool in pools" :key="pool.id">
              <td class="pool-name">
                <span class="token-pair">{{ pool.pair }}</span>
                <span class="pool-category">{{ pool.categories.join(', ') }}</span>
              </td>
              <td><span class="chain-badge">{{ pool.chain }}</span></td>
              <td>{{ pool.protocol }}</td>
              <td>${{ formatNumber(pool.tvl) }}</td>
              <td class="apy-cell" :class="getApyClass(pool.apy)">{{ pool.apy }}%</td>
              <td>${{ formatNumber(pool.volume24h) }}</td>
              <td>
                <span class="risk-badge" :class="pool.riskLevel">{{ pool.riskLevel }}</span>
              </td>
              <td>
                <button @click="selectPool(pool)" class="btn-small">Details</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ROI Calculator -->
    <div class="section calculator">
      <h3>🧮 ROI Calculator</h3>
      <div class="calculator-form">
        <div class="form-group">
          <label>Principal ($)</label>
          <input v-model.number="calcPrincipal" type="number" placeholder="10000" />
        </div>
        <div class="form-group">
          <label>APY (%)</label>
          <input v-model.number="calcApy" type="number" placeholder="25" />
        </div>
        <div class="form-group">
          <label>Duration (days)</label>
          <input v-model.number="calcDays" type="number" placeholder="30" />
        </div>
        <div class="form-group">
          <label>Compound Frequency</label>
          <select v-model="calcFrequency">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <button @click="calculateRoi" class="btn-primary">Calculate</button>
      </div>
      <div v-if="roiResult" class="roi-result">
        <div class="roi-card">
          <span class="roi-label">Final Amount</span>
          <span class="roi-value">${{ formatNumber(roiResult.finalAmount) }}</span>
        </div>
        <div class="roi-card profit">
          <span class="roi-label">Profit</span>
          <span class="roi-value">+${{ formatNumber(roiResult.profit) }}</span>
        </div>
        <div class="roi-card">
          <span class="roi-label">Effective APY</span>
          <span class="roi-value">{{ roiResult.effectiveApy }}%</span>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="section search-section">
      <h3>🔍 Search Pools</h3>
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          placeholder="Search by token, protocol, or chain..." 
          @keyup.enter="searchPools"
        />
        <button @click="searchPools" class="btn-primary">Search</button>
      </div>
      <div v-if="searchResults.length" class="search-results">
        <div v-for="pool in searchResults" :key="pool.id" class="search-result-item" @click="selectPool(pool)">
          <span class="result-pair">{{ pool.pair }}</span>
          <span class="result-chain">{{ pool.chain }}</span>
          <span class="result-apy">{{ pool.apy }}% APY</span>
        </div>
      </div>
    </div>

    <!-- Pool Detail Modal -->
    <div v-if="selectedPoolData" class="modal-overlay" @click="selectedPoolData = null">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedPoolData.name }}</h3>
          <button @click="selectedPoolData = null" class="close-btn">×</button>
        </div>
        <div class="modal-content">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Pool Address</span>
              <span class="detail-value address">{{ selectedPoolData.poolAddress }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Pair</span>
              <span class="detail-value">{{ selectedPoolData.token0 }} / {{ selectedPoolData.token1 }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">TVL</span>
              <span class="detail-value">${{ formatNumber(selectedPoolData.tvl) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">APY</span>
              <span class="detail-value apy">{{ selectedPoolData.apy }}%</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">24h Volume</span>
              <span class="detail-value">${{ formatNumber(selectedPoolData.volume24h) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">24h Fees</span>
              <span class="detail-value">${{ formatNumber(selectedPoolData.fees24h) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Reward Token</span>
              <span class="detail-value">{{ selectedPoolData.rewardToken }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Lock Period</span>
              <span class="detail-value">{{ selectedPoolData.lockPeriod }} days</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Risk Level</span>
              <span class="detail-value risk-badge" :class="selectedPoolData.riskLevel">
                {{ selectedPoolData.riskLevel }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Categories</span>
              <span class="detail-value">{{ selectedPoolData.categories.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const loading = ref(false);
const pools = ref<any[]>([]);
const stats = ref<any>(null);
const chains = ref<string[]>([]);
const protocols = ref<string[]>([]);
const selectedChain = ref('');
const selectedProtocol = ref('');
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const selectedPoolData = ref<any>(null);

// Calculator
const calcPrincipal = ref(10000);
const calcApy = ref(25);
const calcDays = ref(30);
const calcFrequency = ref('daily');
const roiResult = ref<any>(null);

const API_BASE = 'http://localhost:3000';

const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const getApyClass = (apy: number) => {
  if (apy >= 30) return 'high-apy';
  if (apy >= 15) return 'medium-apy';
  return 'low-apy';
};

const loadPools = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (selectedChain.value) params.append('chain', selectedChain.value);
    if (selectedProtocol.value) params.append('protocol', selectedProtocol.value);
    
    const [poolsRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/liquidity-mining/pools?${params}`),
      fetch(`${API_BASE}/liquidity-mining/stats`)
    ]);
    
    const poolsData = await poolsRes.json();
    const statsData = await statsRes.json();
    
    if (poolsData.success) pools.value = poolsData.data;
    if (statsData.success) stats.value = statsData.data;
  } catch (error) {
    console.error('Failed to load pools:', error);
  } finally {
    loading.value = false;
  }
};

const loadChainsAndProtocols = async () => {
  try {
    const [chainsRes, protocolsRes] = await Promise.all([
      fetch(`${API_BASE}/liquidity-mining/chains`),
      fetch(`${API_BASE}/liquidity-mining/protocols`)
    ]);
    
    const chainsData = await chainsRes.json();
    const protocolsData = await protocolsRes.json();
    
    if (chainsData.success) chains.value = chainsData.data;
    if (protocolsData.success) protocols.value = protocolsData.data;
  } catch (error) {
    console.error('Failed to load filters:', error);
  }
};

const searchPools = async () => {
  if (!searchQuery.value.trim()) return;
  try {
    const res = await fetch(`${API_BASE}/liquidity-mining/search?q=${encodeURIComponent(searchQuery.value)}`);
    const data = await res.json();
    if (data.success) searchResults.value = data.data;
  } catch (error) {
    console.error('Search failed:', error);
  }
};

const selectPool = (pool: any) => {
  selectedPoolData.value = pool;
};

const calculateRoi = async () => {
  try {
    const res = await fetch(`${API_BASE}/liquidity-mining/roi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        principal: calcPrincipal.value,
        apy: calcApy.value,
        days: calcDays.value,
        compoundFrequency: calcFrequency.value
      })
    });
    const data = await res.json();
    if (data.success) roiResult.value = data.data;
  } catch (error) {
    console.error('ROI calculation failed:', error);
  }
};

onMounted(() => {
  loadChainsAndProtocols();
  loadPools();
});
</script>

<style scoped>
.liquidity-mining-analytics {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
}

.actions {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.btn-primary {
  padding: 8px 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-primary:disabled {
  background: #a5a5a5;
  cursor: not-allowed;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-card.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon {
  font-size: 32px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-card.highlight .stat-label {
  color: rgba(255,255,255,0.8);
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
}

.stat-sub {
  font-size: 12px;
  color: #666;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.chain-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chain-bar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chain-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.bar-container {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.pools-table {
  overflow-x: auto;
}

.pools-table table {
  width: 100%;
  border-collapse: collapse;
}

.pools-table th,
.pools-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.pools-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 12px;
  color: #666;
}

.pool-name {
  display: flex;
  flex-direction: column;
}

.token-pair {
  font-weight: 600;
}

.pool-category {
  font-size: 11px;
  color: #888;
}

.chain-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 12px;
}

.apy-cell {
  font-weight: bold;
}

.apy-cell.high-apy {
  color: #10b981;
}

.apy-cell.medium-apy {
  color: #f59e0b;
}

.apy-cell.low-apy {
  color: #6b7280;
}

.risk-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
}

.risk-badge.low {
  background: #d1fae5;
  color: #059669;
}

.risk-badge.medium {
  background: #fef3c7;
  color: #d97706;
}

.risk-badge.high {
  background: #fee2e2;
  color: #dc2626;
}

.btn-small {
  padding: 4px 8px;
  background: #f3f4f6;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-small:hover {
  background: #e5e7eb;
}

.calculator-form {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  color: #666;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.roi-result {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}

.roi-card {
  flex: 1;
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.roi-card.profit {
  background: #d1fae5;
}

.roi-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.roi-value {
  font-size: 24px;
  font-weight: bold;
  color: #10b981;
}

.search-box {
  display: flex;
  gap: 12px;
}

.search-box input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.search-results {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  cursor: pointer;
}

.search-result-item:hover {
  background: #f3f4f6;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-content {
  padding: 20px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #666;
}

.detail-value {
  font-weight: 500;
}

.detail-value.address {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
