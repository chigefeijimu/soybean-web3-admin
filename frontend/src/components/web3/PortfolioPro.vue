<template>
  <div class="portfolio-pro">
    <div class="header">
      <h2>💼 Portfolio Pro</h2>
      <p class="subtitle">Enhanced Multi-Chain Portfolio Dashboard</p>
    </div>

    <!-- Wallet Input Section -->
    <div class="input-section">
      <div class="wallet-input">
        <input
          v-model="walletAddress"
          placeholder="Enter wallet address (0x...)"
          class="address-input"
          @keyup.enter="analyzePortfolio"
        />
        <button @click="analyzePortfolio" :disabled="isLoading" class="analyze-btn">
          {{ isLoading ? 'Analyzing...' : 'Analyze' }}
        </button>
      </div>
      
      <div class="chain-selector">
        <label>Select Chains:</label>
        <div class="chain-chips">
          <span
            v-for="chain in availableChains"
            :key="chain.chainId"
            :class="['chain-chip', { active: selectedChains.includes(chain.chainId) }]"
            :style="{ borderColor: chain.color }"
            @click="toggleChain(chain.chainId)"
          >
            {{ chain.name }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Analyzing portfolio...</p>
    </div>

    <!-- Portfolio Results -->
    <div v-else-if="portfolio" class="portfolio-results">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card total-value">
          <span class="label">Total Value</span>
          <span class="value">${{ formatNumber(portfolio.totalValue) }}</span>
          <span :class="['change', portfolio.change24h >= 0 ? 'positive' : 'negative']">
            {{ portfolio.change24h >= 0 ? '+' : '' }}{{ portfolio.change24h.toFixed(2) }}%
          </span>
        </div>
        
        <div class="card positions">
          <span class="label">Positions</span>
          <span class="value">{{ portfolio.positions.length }}</span>
        </div>
        
        <div class="card chains">
          <span class="label">Chains</span>
          <span class="value">{{ uniqueChains }}</span>
        </div>
        
        <div class="card tokens">
          <span class="label">Tokens</span>
          <span class="value">{{ uniqueTokens }}</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'positions' }]"
          @click="activeTab = 'positions'"
        >
          Positions
        </button>
        <button
          :class="['tab', { active: activeTab === 'allocation' }]"
          @click="activeTab = 'allocation'"
        >
          Allocation
        </button>
        <button
          :class="['tab', { active: activeTab === 'history' }]"
          @click="activeTab = 'history'"
        >
          History
        </button>
      </div>

      <!-- Positions Tab -->
      <div v-if="activeTab === 'positions'" class="positions-list">
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Chain</th>
              <th>Balance</th>
              <th>Price</th>
              <th>Value</th>
              <th>24h</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pos in portfolio.positions" :key="pos.id">
              <td>
                <div class="token-info">
                  <span class="symbol">{{ pos.symbol }}</span>
                  <span class="name">{{ pos.name }}</span>
                </div>
              </td>
              <td>
                <span class="chain-badge" :style="{ backgroundColor: getChainColor(pos.chainId) }">
                  {{ getChainName(pos.chainId) }}
                </span>
              </td>
              <td>{{ formatNumber(parseFloat(pos.balance)) }}</td>
              <td>${{ formatNumber(pos.price) }}</td>
              <td class="value">${{ formatNumber(pos.value) }}</td>
              <td :class="['change', pos.change24h >= 0 ? 'positive' : 'negative']">
                {{ pos.change24h >= 0 ? '+' : '' }}{{ pos.change24h.toFixed(2) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Allocation Tab -->
      <div v-if="activeTab === 'allocation'" class="allocation-view">
        <div class="allocation-section">
          <h3>By Chain</h3>
          <div class="allocation-bars">
            <div v-for="alloc in allocations.byChain" :key="alloc.chainId" class="alloc-item">
              <div class="alloc-label">
                <span class="chain-name">{{ alloc.name }}</span>
                <span class="chain-value">${{ formatNumber(alloc.value) }} ({{ alloc.percent }}%)</span>
              </div>
              <div class="bar-container">
                <div
                  class="bar"
                  :style="{ width: alloc.percent + '%', backgroundColor: getChainColor(alloc.chainId) }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="allocation-section">
          <h3>By Token</h3>
          <div class="allocation-bars">
            <div v-for="alloc in allocations.byToken" :key="alloc.symbol" class="alloc-item">
              <div class="alloc-label">
                <span class="token-name">{{ alloc.symbol }}</span>
                <span class="token-value">${{ formatNumber(alloc.value) }} ({{ alloc.percent }}%)</span>
              </div>
              <div class="bar-container">
                <div class="bar" :style="{ width: alloc.percent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="history-view">
        <div class="history-header">
          <select v-model="historyDays" @change="loadHistory" class="days-select">
            <option :value="7">7 Days</option>
            <option :value="30">30 Days</option>
            <option :value="90">90 Days</option>
          </select>
        </div>
        
        <div v-if="historyData.length > 0" class="history-chart">
          <div class="chart-placeholder">
            <div class="chart-line">
              <div
                v-for="(point, i) in historyData"
                :key="i"
                class="chart-point"
                :style="{
                  left: (i / (historyData.length - 1) * 100) + '%',
                  bottom: (point.value / maxHistoryValue * 80) + '%'
                }"
                :title="`$${formatNumber(point.value)}`"
              ></div>
            </div>
            <div class="chart-labels">
              <span>{{ historyData[0]?.date }}</span>
              <span>{{ historyData[historyData.length - 1]?.date }}</span>
            </div>
          </div>
          
          <div class="history-stats">
            <div class="stat">
              <span class="stat-label">High</span>
              <span class="stat-value">${{ formatNumber(maxHistoryValue) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Low</span>
              <span class="stat-value">${{ formatNumber(minHistoryValue) }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Average</span>
              <span class="stat-value">${{ formatNumber(avgHistoryValue) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>Enter a wallet address to analyze portfolio</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

interface PortfolioPosition {
  id: string;
  address: string;
  chainId: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  balance: string;
  price: number;
  value: number;
  change24h: number;
}

interface Portfolio {
  id: string;
  name: string;
  addresses: string[];
  positions: PortfolioPosition[];
  totalValue: number;
  change24h: number;
  change24hPercent: number;
  lastUpdated: number;
}

interface Chain {
  chainId: string;
  name: string;
  symbol: string;
  color: string;
}

interface Allocation {
  chainId?: string;
  symbol?: string;
  name?: string;
  value: number;
  percent: string;
}

// State
const walletAddress = ref('');
const isLoading = ref(false);
const portfolio = ref<Portfolio | null>(null);
const activeTab = ref<'positions' | 'allocation' | 'history'>('positions');
const historyDays = ref(7);
const historyData = ref<Array<{ date: string; value: number }>>([]);
const allocations = ref<{ byChain: Allocation[]; byToken: Allocation[] }>({
  byChain: [],
  byToken: []
});

const availableChains = ref<Chain[]>([
  { chainId: '1', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { chainId: '137', name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
  { chainId: '42161', name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0' },
  { chainId: '10', name: 'Optimism', symbol: 'ETH', color: '#FF0420' },
  { chainId: '56', name: 'BSC', symbol: 'BNB', color: '#F3BA2F' },
  { chainId: '8453', name: 'Base', symbol: 'ETH', color: '#0052FF' },
  { chainId: '43114', name: 'Avalanche', symbol: 'AVAX', color: '#E84142' },
]);

const selectedChains = ref<string[]>(['1', '137', '42161', '10']);

// Computed
const uniqueChains = computed(() => {
  if (!portfolio.value) return 0;
  const chains = new Set(portfolio.value.positions.map(p => p.chainId));
  return chains.size;
});

const uniqueTokens = computed(() => {
  if (!portfolio.value) return 0;
  const tokens = new Set(portfolio.value.positions.map(p => p.symbol));
  return tokens.size;
});

const maxHistoryValue = computed(() => {
  if (historyData.value.length === 0) return 0;
  return Math.max(...historyData.value.map(p => p.value));
});

const minHistoryValue = computed(() => {
  if (historyData.value.length === 0) return 0;
  return Math.min(...historyData.value.map(p => p.value));
});

const avgHistoryValue = computed(() => {
  if (historyData.value.length === 0) return 0;
  return historyData.value.reduce((sum, p) => sum + p.value, 0) / historyData.value.length;
});

// Methods
const toggleChain = (chainId: string) => {
  const index = selectedChains.value.indexOf(chainId);
  if (index >= 0) {
    selectedChains.value.splice(index, 1);
  } else {
    selectedChains.value.push(chainId);
  }
};

const getChainColor = (chainId: string): string => {
  const chain = availableChains.value.find(c => c.chainId === chainId);
  return chain?.color || '#666';
};

const getChainName = (chainId: string): string => {
  const chain = availableChains.value.find(c => c.chainId === chainId);
  return chain?.name || chainId;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(2);
};

const analyzePortfolio = async () => {
  if (!walletAddress.value) return;
  
  // Validate address format
  if (!walletAddress.value.startsWith('0x') || walletAddress.value.length < 42) {
    alert('Please enter a valid Ethereum address');
    return;
  }
  
  isLoading.value = true;
  
  try {
    const response = await axios.post('http://localhost:3016/portfolio-pro/analyze', {
      addresses: [walletAddress.value],
      chainIds: selectedChains.value
    });
    
    portfolio.value = response.data;
    
    // Load allocations
    await loadAllocations();
    
    // Load history
    await loadHistory();
  } catch (error: any) {
    console.error('Failed to analyze portfolio:', error);
    alert('Failed to analyze portfolio: ' + error.message);
  } finally {
    isLoading.value = false;
  }
};

const loadAllocations = async () => {
  if (!walletAddress.value) return;
  
  try {
    const response = await axios.get(`http://localhost:3016/portfolio-pro/allocations/${walletAddress.value}`);
    allocations.value = response.data;
  } catch (error) {
    console.error('Failed to load allocations:', error);
  }
};

const loadHistory = async () => {
  if (!walletAddress.value) return;
  
  try {
    const response = await axios.get(
      `http://localhost:3016/portfolio-pro/history/${walletAddress.value}?days=${historyDays.value}`
    );
    historyData.value = response.data.history;
  } catch (error) {
    console.error('Failed to load history:', error);
  }
};

// Initialize
onMounted(() => {
  // Pre-select all chains
  selectedChains.value = availableChains.value.map(c => c.chainId);
});
</script>

<style scoped>
.portfolio-pro {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  font-size: 28px;
  margin: 0;
  color: #fff;
}

.subtitle {
  color: #888;
  margin: 5px 0 0;
}

.input-section {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.wallet-input {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.address-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #0f0f1a;
  color: #fff;
  font-size: 14px;
}

.address-input:focus {
  outline: none;
  border-color: #627EEA;
}

.analyze-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #627EEA 0%, #4a6fd9 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(98, 126, 234, 0.4);
}

.analyze-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chain-selector label {
  display: block;
  color: #888;
  margin-bottom: 10px;
  font-size: 14px;
}

.chain-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chain-chip {
  padding: 6px 12px;
  border: 1px solid #333;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: #888;
}

.chain-chip.active {
  background: rgba(98, 126, 234, 0.2);
  color: #fff;
  border-color: #627EEA;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #333;
  border-top-color: #627EEA;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.card {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.card .label {
  display: block;
  color: #888;
  font-size: 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.card .value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 5px;
}

.card .change {
  font-size: 14px;
}

.change.positive {
  color: #4ade80;
}

.change.negative {
  color: #f87171;
}

.tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 20px;
  background: #1a1a2e;
  padding: 5px;
  border-radius: 8px;
}

.tab {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab.active {
  background: #627EEA;
  color: #fff;
}

.positions-list {
  background: #1a1a2e;
  border-radius: 12px;
  overflow: hidden;
}

.positions-list table {
  width: 100%;
  border-collapse: collapse;
}

.positions-list th,
.positions-list td {
  padding: 12px 16px;
  text-align: left;
}

.positions-list th {
  background: #0f0f1a;
  color: #888;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.positions-list tr {
  border-bottom: 1px solid #252540;
}

.positions-list tr:last-child {
  border-bottom: none;
}

.token-info {
  display: flex;
  flex-direction: column;
}

.token-info .symbol {
  font-weight: 600;
  color: #fff;
}

.token-info .name {
  font-size: 12px;
  color: #888;
}

.chain-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
}

.value {
  font-weight: 600;
  color: #fff;
}

.allocation-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.allocation-section {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
}

.allocation-section h3 {
  margin: 0 0 15px;
  color: #fff;
  font-size: 16px;
}

.alloc-item {
  margin-bottom: 12px;
}

.alloc-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 13px;
}

.chain-name, .token-name {
  color: #fff;
}

.chain-value, .token-value {
  color: #888;
}

.bar-container {
  height: 8px;
  background: #252540;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #627EEA, #4a6fd9);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.history-view {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 20px;
}

.history-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.days-select {
  padding: 8px 12px;
  background: #0f0f1a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
}

.history-chart {
  position: relative;
  height: 200px;
  margin-bottom: 20px;
}

.chart-placeholder {
  position: relative;
  height: 160px;
  background: #0f0f1a;
  border-radius: 8px;
}

.chart-line {
  position: absolute;
  bottom: 30px;
  left: 10px;
  right: 10px;
  height: 100px;
}

.chart-point {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #627EEA;
  border-radius: 50%;
  transform: translate(-50%, 50%);
}

.chart-labels {
  position: absolute;
  bottom: 5px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 11px;
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  color: #888;
  font-size: 12px;
  margin-bottom: 5px;
}

.stat-value {
  color: #fff;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}
</style>
