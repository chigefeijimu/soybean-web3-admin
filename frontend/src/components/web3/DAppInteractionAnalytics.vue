<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// Types
interface DAppInteraction {
  dapp: string;
  name: string;
  category: string;
  interactions: number;
  firstInteraction: string;
  lastInteraction: string;
  totalValue: number;
  gasSpent: number;
  transactions: number;
}

interface InteractionDetail {
  hash: string;
  timestamp: string;
  type: string;
  value: number;
  gas: number;
  status: 'success' | 'failed';
}

interface CategoryStats {
  category: string;
  count: number;
  value: number;
  percentage: number;
}

// State
const walletAddress = ref('');
const selectedChain = ref(1);
const loading = ref(false);
const error = ref('');
const interactions = ref<DAppInteraction[]>([]);
const selectedDApp = ref<string | null>(null);
const details = ref<InteractionDetail[]>([]);

// Chain options
const chains = [
  { id: 1, name: 'Ethereum' },
  { id: 137, name: 'Polygon' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' },
  { id: 8453, name: 'Base' },
  { id: 56, name: 'BSC' },
];

// Known DApps database
const knownDApps: Record<string, { name: string; category: string; logo: string }> = {
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V3', category: 'DEX', logo: '🦄' },
  '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', category: 'DEX', logo: '🦄' },
  '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': { name: 'Sushiswap', category: 'DEX', logo: '🍣' },
  '0x1f98431c8ad98523631ae4a59f267346ea31f984': { name: 'Uniswap V3 Factory', category: 'DEX', logo: '🦄' },
  '0x5c60dab254c3787a6fb9d0e3f4e9f5b1b5d5e5e': { name: 'Aave V3', category: 'Lending', logo: '👻' },
  '0x87870bca3f3fd6335c3fbd83f7f93e2e8e2b3e5': { name: 'Aave V3 Pool', category: 'Lending', logo: '👻' },
  '0x3d9819210a31b4961b30ef54be2aed6b1c1d3d23': { name: 'Compound', category: 'Lending', logo: '🔷' },
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { name: 'USDC', category: 'Stablecoin', logo: '💵' },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { name: 'USDT', category: 'Stablecoin', logo: '💰' },
  '0x6b175474e89094c44da98b954eedeac495271d0f': { name: 'DAI', category: 'Stablecoin', logo: '🟢' },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { name: 'WBTC', category: 'Bridge', logo: '₿' },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { name: 'WETH', category: 'Wrapper', logo: '♦️' },
  '0x514910771af9ca656af840dff83e8264ecf986ca': { name: 'LINK', category: 'Oracle', logo: '🔗' },
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': { name: 'AAVE', category: 'Lending', logo: '👻' },
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': { name: 'UNI', category: 'Governance', logo: '🦄' },
  '0x0d8775f648430679a709e98d2b0cb6250d2887ef': { name: 'BAT', category: 'Token', logo: '🦇' },
  '0xb1690c08e213a35ed9bab7b318de14420fb57d8': { name: 'OpenSea', category: 'NFT', logo: '🖼️' },
  '0x4fe83213d563e30fabc500a5b4a5f4ae0c4caee5': { name: 'OpenSea Seaport', category: 'NFT', logo: '🖼️' },
  '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d': { name: 'BoredApeYachtClub', category: 'NFT', logo: '🐒' },
  '0x23581767a106ae21c074b2276d25e5c3e136a68b': { name: 'Moonbird', category: 'NFT', logo: '🐦' },
  '0xed5af388653567af2f388e6224dc7c4b3241c544': { name: 'Azuki', category: 'NFT', logo: '🍙' },
  '0x8a90cab2b38dba80c64b7734e58e1dc38d7aa2c8': { name: 'BAYC', category: 'NFT', logo: '🐒' },
  '0x49ecf538e8b9f5b6e0d5f0c3e9c3e9c3e9c3e9c': { name: 'Curve', category: 'DEX', logo: '💚' },
  '0x9db9e0f53e8ea9e9995ec7665a3194e2f3e9e3f5': { name: 'Curve Registry', category: 'DEX', logo: '💚' },
  '0x0cd3a1f5d50ac1a5f8a5f0e9f9c5c5a5c5a5c5a5': { name: 'Yearn Finance', category: 'Yield', logo: '📈' },
  '0x0c10bf8fcb7bf5412287c2e3c2d8a4b5e9c5f5f5': { name: 'Yearn Vaults', category: 'Yield', logo: '📈' },
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': { name: 'MATIC', category: 'Layer2', logo: '🟣' },
  '0x53e0bca35ec6bd3822e6a83c0e4e9c5a5c5a5c5a5': { name: 'Polygon SDK', category: 'Layer2', logo: '🟣' },
  '0x11cd37bb86f659d40522ee95fb4dad3a3c2c2c2c': { name: 'Lido', category: 'Staking', logo: '💧' },
  '0xae7ab96520de3a18e5e111b5eaab095312d7fea4': { name: 'Lido StETH', category: 'Staking', logo: '💧' },
  '0x8f3cf7a23f223cff3c7bc731d2e1e5d9e3c3c3c3': { name: 'QuickSwap', category: 'DEX', logo: '⚡' },
  '0xa5e0829caeceb8e2a34c1e9e6c3e9e3e9c3c3c3c': { name: 'QuickSwap Router', category: 'DEX', logo: '⚡' },
};

// Computed
const categoryStats = computed<CategoryStats[]>(() => {
  const stats: Record<string, { count: number; value: number }> = {};
  
  for (const dapp of interactions.value) {
    if (!stats[dapp.category]) {
      stats[dapp.category] = { count: 0, value: 0 };
    }
    stats[dapp.category].count += dapp.interactions;
    stats[dapp.category].value += dapp.totalValue;
  }
  
  const total = Object.values(stats).reduce((sum, s) => sum + s.count, 0);
  
  return Object.entries(stats).map(([category, data]) => ({
    category,
    count: data.count,
    value: data.value,
    percentage: total > 0 ? (data.count / total) * 100 : 0,
  })).sort((a, b) => b.count - a.count);
});

const totalStats = computed(() => ({
  totalInteractions: interactions.value.reduce((sum, i) => sum + i.interactions, 0),
  totalValue: interactions.value.reduce((sum, i) => sum + i.totalValue, 0),
  totalGas: interactions.value.reduce((sum, i) => sum + i.gasSpent, 0),
  uniqueDApps: interactions.value.length,
}));

// Methods
const isValidAddress = computed(() => {
  return /^0x[a-fA-F0-9]{40}$/.test(walletAddress.value);
});

const formatAddress = (addr: string) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatValue = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Generate demo data for testing
const generateDemoData = () => {
  const demoDApps: DAppInteraction[] = [
    {
      dapp: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
      name: 'Uniswap V3',
      category: 'DEX',
      interactions: 47,
      firstInteraction: '2024-03-15',
      lastInteraction: '2026-02-28',
      totalValue: 125000,
      gasSpent: 2.5,
      transactions: 47,
    },
    {
      dapp: '0x5c60dab254c3787a6fb9d0e3f4e9f5b1b5d5e5e',
      name: 'Aave V3',
      category: 'Lending',
      interactions: 23,
      firstInteraction: '2024-06-20',
      lastInteraction: '2026-02-15',
      totalValue: 85000,
      gasSpent: 1.8,
      transactions: 23,
    },
    {
      dapp: '0x3d9819210a31b4961b30ef54be2aed6b1c1d3d23',
      name: 'Compound',
      category: 'Lending',
      interactions: 15,
      firstInteraction: '2024-08-10',
      lastInteraction: '2025-12-20',
      totalValue: 45000,
      gasSpent: 0.9,
      transactions: 15,
    },
    {
      dapp: '0x4fe83213d563e30fabc500a5b4a5f4ae0c4caee5',
      name: 'OpenSea',
      category: 'NFT',
      interactions: 12,
      firstInteraction: '2024-09-05',
      lastInteraction: '2026-01-25',
      totalValue: 15000,
      gasSpent: 1.2,
      transactions: 12,
    },
    {
      dapp: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      name: 'BoredApeYachtClub',
      category: 'NFT',
      interactions: 8,
      firstInteraction: '2024-10-12',
      lastInteraction: '2025-11-30',
      totalValue: 28000,
      gasSpent: 0.8,
      transactions: 8,
    },
    {
      dapp: '0x49ecf538e8b9f5b6e0d5f0c3e9c3e9c3e9c3e9c',
      name: 'Curve',
      category: 'DEX',
      interactions: 31,
      firstInteraction: '2024-04-22',
      lastInteraction: '2026-02-20',
      totalValue: 67000,
      gasSpent: 1.5,
      transactions: 31,
    },
    {
      dapp: '0x11cd37bb86f659d40522ee95fb4dad3a3c2c2c2c',
      name: 'Lido',
      category: 'Staking',
      interactions: 6,
      firstInteraction: '2024-07-18',
      lastInteraction: '2026-02-01',
      totalValue: 52000,
      gasSpent: 0.3,
      transactions: 6,
    },
    {
      dapp: '0x8f3cf7a23f223cff3c7bc731d2e1e5d9e3c3c3c3',
      name: 'QuickSwap',
      category: 'DEX',
      interactions: 19,
      firstInteraction: '2024-05-30',
      lastInteraction: '2025-10-15',
      totalValue: 23000,
      gasSpent: 0.6,
      transactions: 19,
    },
  ];
  
  return demoDApps;
};

const generateDemoDetails = (): InteractionDetail[] => {
  return [
    { hash: '0x1234567890abcdef1234567890abcdef12345678', timestamp: '2026-02-28T14:30:00', type: 'Swap', value: 5000, gas: 0.05, status: 'success' },
    { hash: '0x2345678901abcdef2345678901abcdef23456789', timestamp: '2026-02-25T10:15:00', type: 'Supply', value: 10000, gas: 0.08, status: 'success' },
    { hash: '0x3456789012abcdef3456789012abcdef34567890', timestamp: '2026-02-20T16:45:00', type: 'Borrow', value: 3000, gas: 0.06, status: 'success' },
    { hash: '0x4567890123abcdef4567890123abcdef45678901', timestamp: '2026-02-15T09:20:00', type: 'Swap', value: 7500, gas: 0.04, status: 'success' },
    { hash: '0x5678901234abcdef5678901234abcdef56789012', timestamp: '2026-02-10T11:30:00', type: 'Mint', value: 15000, gas: 0.12, status: 'failed' },
  ];
};

const fetchDAppInteractions = async () => {
  if (!isValidAddress.value) {
    error.value = 'Please enter a valid wallet address';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    // Simulate API call - in production, this would call backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Use demo data for now
    interactions.value = generateDemoData();
    
  } catch (e: any) {
    error.value = e.message || 'Failed to fetch DApp interactions';
  } finally {
    loading.value = false;
  }
};

const selectDApp = (dapp: DAppInteraction) => {
  selectedDApp.value = dapp.dapp;
  details.value = generateDemoDetails();
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'DEX': '#ff6b6b',
    'Lending': '#4ecdc4',
    'NFT': '#9b59b6',
    'Stablecoin': '#3498db',
    'Yield': '#f39c12',
    'Staking': '#2ecc71',
    'Bridge': '#e74c3c',
    'Layer2': '#1abc9c',
    'Governance': '#95a5a6',
  };
  return colors[category] || '#7f8c8d';
};

const getDAppLogo = (dapp: string): string => {
  return knownDApps[dapp.toLowerCase()]?.logo || '📱';
};

const getDAppName = (dapp: string): string => {
  return knownDApps[dapp.toLowerCase()]?.name || formatAddress(dapp);
};

const getCategory = (dapp: string): string => {
  return knownDApps[dapp.toLowerCase()]?.category || 'Unknown';
};

// Sample addresses for quick testing
const sampleAddresses = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
  '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
];

// Auto-fetch on mount with demo address
onMounted(() => {
  // Don't auto-fetch, wait for user input
});
</script>

<template>
  <div class="dapp-analytics">
    <div class="header">
      <h2>📱 DApp Interaction Analytics</h2>
      <p class="subtitle">Analyze wallet interactions with decentralized applications</p>
    </div>

    <!-- Input Section -->
    <div class="input-section">
      <div class="input-group">
        <label>Wallet Address</label>
        <input
          v-model="walletAddress"
          type="text"
          placeholder="0x..."
          class="address-input"
        />
        <div class="sample-addresses">
          <span class="label">Quick fill:</span>
          <button 
            v-for="addr in sampleAddresses" 
            :key="addr"
            class="sample-btn"
            @click="walletAddress = addr"
          >
            {{ formatAddress(addr) }}
          </button>
        </div>
      </div>

      <div class="controls">
        <select v-model="selectedChain" class="chain-select">
          <option v-for="chain in chains" :key="chain.id" :value="chain.id">
            {{ chain.name }}
          </option>
        </select>
        <button 
          @click="fetchDAppInteractions" 
          :disabled="loading || !isValidAddress" 
          class="analyze-btn"
        >
          {{ loading ? 'Analyzing...' : 'Analyze 🔍' }}
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <span>{{ error }}</span>
      <button @click="error = ''" class="close-btn">×</button>
    </div>

    <!-- Stats Overview -->
    <div v-if="interactions.length > 0" class="stats-overview">
      <div class="stat-card">
        <span class="stat-icon">📊</span>
        <span class="stat-label">Total Interactions</span>
        <span class="stat-value">{{ formatNumber(totalStats.totalInteractions) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">💰</span>
        <span class="stat-label">Total Value</span>
        <span class="stat-value">{{ formatValue(totalStats.totalValue) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">⛽</span>
        <span class="stat-label">Gas Spent</span>
        <span class="stat-value">{{ totalStats.totalGas.toFixed(4) }} ETH</span>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📱</span>
        <span class="stat-label">Unique DApps</span>
        <span class="stat-value">{{ totalStats.uniqueDApps }}</span>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="interactions.length > 0" class="main-content">
      <!-- Category Distribution -->
      <div class="category-section">
        <h3>📊 Category Distribution</h3>
        <div class="category-chart">
          <div 
            v-for="cat in categoryStats" 
            :key="cat.category"
            class="category-bar"
          >
            <div class="bar-label">
              <span>{{ cat.category }}</span>
              <span>{{ cat.count }} ({{ cat.percentage.toFixed(1) }}%)</span>
            </div>
            <div class="bar-track">
              <div 
                class="bar-fill"
                :style="{ 
                  width: `${cat.percentage}%`,
                  backgroundColor: getCategoryColor(cat.category)
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- DApp List -->
      <div class="dapp-section">
        <h3>📱 DApp Interactions</h3>
        <div class="dapp-list">
          <div 
            v-for="dapp in interactions" 
            :key="dapp.dapp"
            class="dapp-card"
            :class="{ selected: selectedDApp === dapp.dapp }"
            @click="selectDApp(dapp)"
          >
            <div class="dapp-header">
              <span class="dapp-logo">{{ getDAppLogo(dapp.dapp) }}</span>
              <div class="dapp-info">
                <span class="dapp-name">{{ getDAppName(dapp.dapp) }}</span>
                <span class="dapp-address">{{ formatAddress(dapp.dapp) }}</span>
              </div>
              <span 
                class="dapp-category"
                :style="{ backgroundColor: getCategoryColor(dapp.category) + '30', color: getCategoryColor(dapp.category) }"
              >
                {{ dapp.category }}
              </span>
            </div>
            <div class="dapp-stats">
              <div class="dapp-stat">
                <span class="label">Interactions</span>
                <span class="value">{{ dapp.interactions }}</span>
              </div>
              <div class="dapp-stat">
                <span class="label">Value</span>
                <span class="value">{{ formatValue(dapp.totalValue) }}</span>
              </div>
              <div class="dapp-stat">
                <span class="label">Gas</span>
                <span class="value">{{ dapp.gasSpent.toFixed(4) }} ETH</span>
              </div>
            </div>
            <div class="dapp-dates">
              <span>First: {{ formatDate(dapp.firstInteraction) }}</span>
              <span>Last: {{ formatDate(dapp.lastInteraction) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Interaction Details -->
      <div v-if="selectedDApp" class="details-section">
        <h3>📋 {{ getDAppName(selectedDApp) }} Transaction History</h3>
        <div class="details-list">
          <div 
            v-for="detail in details" 
            :key="detail.hash"
            class="detail-card"
            :class="{ failed: detail.status === 'failed' }"
          >
            <div class="detail-header">
              <span class="tx-hash">{{ formatAddress(detail.hash) }}</span>
              <span class="tx-status" :class="detail.status">
                {{ detail.status === 'success' ? '✓' : '✗' }}
              </span>
            </div>
            <div class="detail-info">
              <span class="tx-type">{{ detail.type }}</span>
              <span class="tx-value">{{ formatValue(detail.value) }}</span>
              <span class="tx-gas">{{ detail.gas.toFixed(6) }} ETH</span>
            </div>
            <div class="tx-time">{{ formatDate(detail.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="empty-state">
      <div class="empty-icon">📊</div>
      <p>Enter a wallet address to analyze DApp interactions</p>
      <p class="hint">Discover which DApps a wallet interacts with most frequently</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing wallet DApp interactions...</p>
    </div>
  </div>
</template>

<style scoped>
.dapp-analytics {
  padding: 1rem;
}

.header {
  margin-bottom: 1.5rem;
}

.header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #9ca3af;
  font-size: 0.875rem;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
}

.address-input {
  padding: 0.75rem 1rem;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  background: #1f2937;
  color: #f9fafb;
  font-size: 0.875rem;
}

.address-input:focus {
  outline: none;
  border-color: #6366f1;
}

.sample-addresses {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sample-addresses .label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.sample-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background: #374151;
  border: none;
  border-radius: 0.25rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.sample-btn:hover {
  background: #4b5563;
  color: #f9fafb;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.chain-select {
  padding: 0.5rem 1rem;
  border: 1px solid #374151;
  border-radius: 0.5rem;
  background: #1f2937;
  color: #f9fafb;
  font-size: 0.875rem;
}

.analyze-btn {
  padding: 0.5rem 1.5rem;
  background: #6366f1;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.analyze-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #dc2626;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  color: white;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: #1f2937;
  border-radius: 0.75rem;
  border: 1px solid #374151;
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f9fafb;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.5rem;
}

.category-section {
  background: #1f2937;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #374151;
}

.category-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.category-chart {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-bar {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #9ca3af;
}

.bar-track {
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.dapp-section {
  background: #1f2937;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #374151;
}

.dapp-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.dapp-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.dapp-card {
  padding: 0.75rem;
  background: #374151;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.dapp-card:hover {
  background: #4b5563;
}

.dapp-card.selected {
  border: 1px solid #6366f1;
}

.dapp-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.dapp-logo {
  font-size: 1.5rem;
}

.dapp-info {
  flex: 1;
}

.dapp-name {
  display: block;
  font-weight: 500;
  font-size: 0.875rem;
}

.dapp-address {
  font-size: 0.75rem;
  color: #9ca3af;
}

.dapp-category {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 500;
}

.dapp-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.dapp-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dapp-stat .label {
  font-size: 0.625rem;
  color: #9ca3af;
}

.dapp-stat .value {
  font-size: 0.75rem;
  font-weight: 500;
}

.dapp-dates {
  display: flex;
  justify-content: space-between;
  font-size: 0.625rem;
  color: #9ca3af;
}

.details-section {
  grid-column: 1 / -1;
  background: #1f2937;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #374151;
}

.details-section h3 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-card {
  padding: 0.75rem;
  background: #374151;
  border-radius: 0.5rem;
  border-left: 3px solid #22c55e;
}

.detail-card.failed {
  border-left-color: #ef4444;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.tx-hash {
  font-family: monospace;
  font-size: 0.875rem;
}

.tx-status {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
}

.tx-status.success {
  background: #22c55e;
  color: white;
}

.tx-status.failed {
  background: #ef4444;
  color: white;
}

.detail-info {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.tx-type {
  font-weight: 500;
  color: #6366f1;
}

.tx-value {
  color: #22c55e;
}

.tx-gas {
  color: #9ca3af;
}

.tx-time {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hint {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #374151;
  border-top-color: #6366f1;
  border-radius: 50%;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-content {
    grid-template-columns: 1fr;
  }
}
</style>
